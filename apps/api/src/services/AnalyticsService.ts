import prisma from '../lib/prisma';
import crypto from 'crypto';

interface TrackEventParams {
  userId?: string;
  sessionId: string;
  eventName: string;
  eventCategory: string;
  properties?: Record<string, any>;
  userAgent?: string;
  ip?: string;
  referrer?: string;
}

export class AnalyticsService {
  /**
   * Track generic event
   */
  static async trackEvent(params: TrackEventParams) {
    const { userId, sessionId, eventName, eventCategory, properties, userAgent, ip, referrer } = params;

    const ipHash = ip ? crypto.createHash('sha256').update(ip).digest('hex') : null;

    await prisma.analyticsEvent.create({
      data: {
        userId,
        sessionId,
        eventName,
        eventCategory,
        properties: JSON.stringify(properties || {}),
        userAgent,
        ipHash: ipHash || undefined,
        referrer
      }
    });
  }

  /**
   * Track onboarding step
   */
  static async trackOnboardingStep(
    userId: string,
    step: string,
    completed: boolean,
    metadata?: Record<string, any>
  ) {
    // Get or create progress
    let progress = await prisma.onboardingProgress.findUnique({
      where: { userId }
    });

    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: { userId }
      });
    }

    // Build update data dynamically
    const updateData: any = {
      lastActiveStep: step,
      updatedAt: new Date()
    };

    // Map step names to fields
    const stepFieldMap: Record<string, string> = {
      'welcome': 'welcomeSurveyCompleted',
      'telegram': 'telegramSetupCompleted',
      'email': 'emailSetupCompleted',
      'discord': 'discordSetupCompleted',
      'firstAutomation': 'firstAutomationCreated'
    };

    if (stepFieldMap[step]) {
      updateData[stepFieldMap[step]] = completed;
    }

    // Add metadata
    if (metadata?.goal) updateData.goal = metadata.goal;
    if (metadata?.audienceSize) updateData.audienceSize = metadata.audienceSize;
    if (metadata?.channels) updateData.channelsSelected = JSON.stringify(metadata.channels);

    await prisma.onboardingProgress.update({
      where: { userId },
      data: updateData
    });

    // Track event
    await this.trackEvent({
      userId,
      sessionId: metadata?.sessionId || 'unknown',
      eventName: `onboarding_step_${completed ? 'completed' : 'viewed'}`,
      eventCategory: 'onboarding',
      properties: { step, ...metadata }
    });
  }

  /**
   * Complete onboarding
   */
  static async completeOnboarding(userId: string) {
    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId }
    });

    if (!progress) return;

    const timeSpent = Math.floor((Date.now() - progress.startedAt.getTime()) / 1000);

    await prisma.onboardingProgress.update({
      where: { userId },
      data: {
        completedAt: new Date(),
        totalTimeSpent: timeSpent
      }
    });

    await this.trackEvent({
      userId,
      sessionId: 'completion',
      eventName: 'onboarding_completed',
      eventCategory: 'onboarding',
      properties: { timeSpent }
    });

    // Unlock achievement
    await this.unlockAchievement(userId, 'onboarding-complete');

    if (timeSpent < 300) { // < 5 minutes
      await this.unlockAchievement(userId, 'fast-setup');
    }
  }

  /**
   * Unlock achievement
   */
  static async unlockAchievement(userId: string, type: string) {
    const exists = await prisma.achievement.findFirst({
      where: { userId, type }
    });

    if (!exists) {
      await prisma.achievement.create({
        data: { userId, type }
      });

      await this.trackEvent({
        userId,
        sessionId: 'achievement',
        eventName: 'achievement_unlocked',
        eventCategory: 'gamification',
        properties: { type }
      });
    }
  }

  /**
   * Get funnel metrics
   */
  static async getFunnelMetrics(dateFrom: Date, dateTo: Date) {
    const events = await prisma.analyticsEvent.findMany({
      where: {
        timestamp: { gte: dateFrom, lte: dateTo },
        eventCategory: 'onboarding'
      }
    });

    const signups = await prisma.user.count({
      where: { createdAt: { gte: dateFrom, lte: dateTo } }
    });

    const welcomeStarted = events.filter(e =>
      e.eventName === 'onboarding_step_viewed' &&
      JSON.parse(e.properties).step === 'welcome'
    ).length;

    const channelConnected = events.filter(e =>
      e.eventName === 'onboarding_step_completed' &&
      (JSON.parse(e.properties).step === 'telegram' || JSON.parse(e.properties).step === 'email')
    ).length;

    const automationCreated = events.filter(e =>
      e.eventName === 'onboarding_step_completed' &&
      JSON.parse(e.properties).step === 'firstAutomation'
    ).length;

    return {
      signups,
      welcomeStarted,
      channelConnected,
      automationCreated,
      conversionRates: {
        signupToWelcome: signups > 0 ? ((welcomeStarted / signups) * 100).toFixed(2) + '%' : '0%',
        welcomeToChannel: welcomeStarted > 0 ? ((channelConnected / welcomeStarted) * 100).toFixed(2) + '%' : '0%',
        channelToAutomation: channelConnected > 0 ? ((automationCreated / channelConnected) * 100).toFixed(2) + '%' : '0%',
        overall: signups > 0 ? ((automationCreated / signups) * 100).toFixed(2) + '%' : '0%'
      }
    };
  }

  /**
   * Get drop-off analysis
   */
  static async getDropOffAnalysis(dateFrom: Date, dateTo: Date) {
    const abandoned = await prisma.onboardingProgress.findMany({
      where: {
        completedAt: null,
        startedAt: { gte: dateFrom, lte: dateTo }
      }
    });

    const dropOffPoints = abandoned.reduce((acc, progress) => {
      const step = progress.lastActiveStep || 'welcome';
      acc[step] = (acc[step] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAbandoned: abandoned.length,
      dropOffPoints: Object.entries(dropOffPoints)
        .sort(([, a], [, b]) => b - a)
        .map(([step, count]) => ({
          step,
          count,
          percentage: ((count / abandoned.length) * 100).toFixed(2) + '%'
        }))
    };
  }
}
