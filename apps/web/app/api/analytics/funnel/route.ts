import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      eventType,
      linkId,
      shortCode,
      sessionId,
      visitorId,
      eventData,
      hasConsent,
      consentType,
      timeOnPage,
      device,
      browser,
      os,
    } = body;

    // Validate required fields
    if (!eventType || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If we have a shortCode, try to find the link
    let resolvedLinkId = linkId;
    if (!resolvedLinkId && shortCode) {
      const link = await prisma.shortLink.findUnique({
        where: { shortCode },
        select: { id: true },
      });
      resolvedLinkId = link?.id;
    }

    // Create funnel event
    if (resolvedLinkId) {
      await prisma.redirectFunnelEvent.create({
        data: {
          linkId: resolvedLinkId,
          sessionId,
          visitorId,
          eventType,
          eventData: eventData ? JSON.stringify(eventData) : null,
          hasConsent,
          consentType,
          timeOnPage,
          device,
          browser,
          os,
        },
      });

      // Update ShortLink aggregated metrics
      if (eventType === 'manual_click' || eventType === 'auto_redirect_start') {
        await prisma.shortLink.update({
          where: { id: resolvedLinkId },
          data: { clicks: { increment: 1 } },
        });
      }

      if (eventType === 'redirect_cancelled') {
        await prisma.shortLink.update({
          where: { id: resolvedLinkId },
          data: { bounces: { increment: 1 } },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Funnel tracking error:', error);
    // Don't fail analytics - return success anyway
    return NextResponse.json({ success: true });
  }
}
