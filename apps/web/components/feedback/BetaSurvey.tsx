'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Star, MessageSquare, ThumbsUp, ThumbsDown, Send, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { Analytics } from '@/components/analytics/PostHogProvider';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type SurveyType = 'nps' | 'csat' | 'feedback' | 'feature';

interface BetaSurveyProps {
  userPlan?: string;
  userId?: string;
  surveyType?: SurveyType;
  feature?: string; // For feature-specific surveys
  trigger?: 'milestone' | 'time' | 'manual';
  onComplete?: () => void;
  onDismiss?: () => void;
}

interface SurveyState {
  isOpen: boolean;
  type: SurveyType;
  step: number;
  rating: number | null;
  feedback: string;
  canPromote: boolean | null;
}

// ═══════════════════════════════════════════════════════════════
// SURVEY CONTENT
// ═══════════════════════════════════════════════════════════════

const SURVEY_CONTENT = {
  nps: {
    title: 'Come valuteresti Afflyt?',
    subtitle: 'La tua opinione ci aiuta a migliorare',
    ratingLabel: 'Da 0 a 10, quanto consiglieresti Afflyt?',
    followUp: {
      promoter: 'Fantastico! Cosa ti piace di più?',
      passive: 'Cosa potremmo fare meglio?',
      detractor: 'Ci dispiace! Come possiamo migliorare?',
    },
  },
  csat: {
    title: 'Sei soddisfatto?',
    subtitle: 'Valuta la tua esperienza',
    ratingLabel: 'Quanto sei soddisfatto della tua esperienza?',
    followUp: {
      promoter: 'Ottimo! Cosa ti ha soddisfatto di più?',
      passive: 'Come potremmo migliorare?',
      detractor: 'Come possiamo migliorare la tua esperienza?',
    },
  },
  feedback: {
    title: 'Dicci cosa pensi',
    subtitle: 'Il tuo feedback è prezioso',
    ratingLabel: "Come valuti l'esperienza finora?",
    followUp: {
      promoter: 'Cosa ti è piaciuto di più?',
      passive: 'Come possiamo migliorare?',
      detractor: 'Cosa non ha funzionato?',
    },
  },
  feature: {
    title: 'Cosa ne pensi?',
    subtitle: 'Aiutaci a capire cosa funziona',
    ratingLabel: 'Quanto è stata utile questa funzionalità?',
    followUp: {
      promoter: 'Ottimo! Cosa ti è piaciuto?',
      passive: 'Come potremmo migliorarla?',
      detractor: 'Cosa non funziona bene?',
    },
  },
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function BetaSurvey({
  userPlan,
  userId,
  surveyType = 'nps',
  feature,
  trigger = 'manual',
  onComplete,
  onDismiss,
}: BetaSurveyProps) {
  const [state, setState] = useState<SurveyState>({
    isOpen: false,
    type: surveyType,
    step: 1,
    rating: null,
    feedback: '',
    canPromote: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Check if survey should be shown based on localStorage
  const surveyKey = `afflyt_survey_${surveyType}_${feature || 'general'}`;

  useEffect(() => {
    // Only show for beta users
    if (userPlan !== 'BETA_TESTER') return;

    // Check if already shown
    const lastShown = localStorage.getItem(surveyKey);
    if (lastShown) {
      const daysSinceShown = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      // Don't show again for 7 days for NPS, 3 days for others
      const cooldownDays = surveyType === 'nps' ? 7 : 3;
      if (daysSinceShown < cooldownDays) return;
    }

    // Auto-trigger based on trigger type
    if (trigger === 'time') {
      // Delay display for better UX
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, isOpen: true }));
      }, 10000); // 10 seconds delay
      return () => clearTimeout(timer);
    } else if (trigger === 'milestone') {
      // Show immediately for milestones
      setState((prev) => ({ ...prev, isOpen: true }));
    }
  }, [userPlan, surveyType, trigger, surveyKey, feature]);

  const handleRatingSelect = useCallback((rating: number) => {
    setState((prev) => ({
      ...prev,
      rating,
      step: 2,
    }));
  }, []);

  const handleSubmit = async () => {
    if (!state.rating) return;

    setIsSubmitting(true);

    try {
      // Track to PostHog
      Analytics.captureSurveyResponse(`beta_${surveyType}_survey`, {
        $survey_response: state.rating,
        survey_type: surveyType,
        feature,
        rating: state.rating,
        feedback: state.feedback,
        trigger,
        nps_category:
          surveyType === 'nps'
            ? state.rating >= 9
              ? 'promoter'
              : state.rating >= 7
              ? 'passive'
              : 'detractor'
            : undefined,
      });

      // Mark as shown
      localStorage.setItem(surveyKey, Date.now().toString());

      setIsSubmitted(true);

      setTimeout(() => {
        handleClose();
        onComplete?.();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit survey:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setState((prev) => ({ ...prev, isOpen: false }));
    Analytics.captureSurveyDismissed(`beta_${surveyType}_survey`);
    onDismiss?.();
  };

  // Only show for beta users
  if (userPlan !== 'BETA_TESTER' || !state.isOpen) {
    return null;
  }

  const content = SURVEY_CONTENT[surveyType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <GlassCard className="w-full max-w-md p-6 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-linear-to-br from-afflyt-cyan-400 to-afflyt-plasma-400 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-medium text-afflyt-cyan-400 uppercase tracking-wider">
                Beta Feedback
              </span>
            </div>
            <h3 className="text-xl font-semibold text-white">{content.title}</h3>
            <p className="text-sm text-gray-400">{content.subtitle}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {isSubmitted ? (
          // Thank you state
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-linear-to-br from-afflyt-cyan-400/20 to-afflyt-plasma-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-afflyt-cyan-400" />
            </div>
            <h4 className="text-lg font-medium text-white mb-2">Grazie per il feedback!</h4>
            <p className="text-gray-400">Il tuo contributo ci aiuta a migliorare Afflyt.</p>
          </div>
        ) : (
          <>
            {/* Step 1: Rating */}
            {state.step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-300 mb-4">{content.ratingLabel}</p>

                {surveyType === 'nps' ? (
                  // NPS Scale (0-10)
                  <div className="space-y-3">
                    <div className="grid grid-cols-11 gap-1">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleRatingSelect(score)}
                          className={`aspect-square rounded-lg border text-sm font-medium transition-all hover:scale-105 ${
                            state.rating === score
                              ? score >= 9
                                ? 'bg-green-500/20 border-green-500 text-green-400'
                                : score >= 7
                                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                                : 'bg-red-500/20 border-red-500 text-red-400'
                              : 'bg-afflyt-dark-50/50 border-afflyt-glass-border text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Per niente probabile</span>
                      <span>Molto probabile</span>
                    </div>
                  </div>
                ) : (
                  // Star Rating (1-5)
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => handleRatingSelect(score)}
                        className="p-2 transition-all hover:scale-110"
                      >
                        <Star
                          className={`w-10 h-10 ${
                            state.rating !== null && score <= state.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-600 hover:text-gray-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Feedback */}
            {state.step === 2 && (
              <div className="space-y-4">
                {/* Show rating summary */}
                <div className="flex items-center gap-3 p-3 bg-afflyt-dark-50/50 rounded-lg">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                      surveyType === 'nps'
                        ? state.rating !== null && state.rating >= 9
                          ? 'bg-green-500/20 text-green-400'
                          : state.rating !== null && state.rating >= 7
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                        : 'bg-afflyt-cyan-500/20 text-afflyt-cyan-400'
                    }`}
                  >
                    {state.rating}
                  </div>
                  <div className="text-sm">
                    <p className="text-white font-medium">
                      {surveyType === 'nps'
                        ? state.rating !== null && state.rating >= 9
                          ? 'Promoter'
                          : state.rating !== null && state.rating >= 7
                          ? 'Neutral'
                          : 'Potremmo fare meglio'
                        : state.rating !== null && state.rating >= 4
                        ? 'Soddisfatto'
                        : 'Non soddisfatto'}
                    </p>
                    <p className="text-gray-500">La tua valutazione</p>
                  </div>
                  <button
                    onClick={() => setState((prev) => ({ ...prev, step: 1, rating: null }))}
                    className="ml-auto text-xs text-afflyt-cyan-400 hover:underline"
                  >
                    Modifica
                  </button>
                </div>

                {/* Follow-up question */}
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    {surveyType === 'nps'
                      ? state.rating !== null && state.rating >= 9
                        ? content.followUp?.promoter
                        : state.rating !== null && state.rating >= 7
                        ? content.followUp?.passive
                        : content.followUp?.detractor
                      : 'Hai qualcosa da aggiungere? (opzionale)'}
                  </label>
                  <textarea
                    value={state.feedback}
                    onChange={(e) => setState((prev) => ({ ...prev, feedback: e.target.value }))}
                    placeholder="Scrivi qui il tuo feedback..."
                    className="w-full h-24 px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder-gray-500 resize-none focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Quick reactions for NPS detractors */}
                {surveyType === 'nps' && state.rating !== null && state.rating < 7 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Cosa non ha funzionato?</p>
                    <div className="flex flex-wrap gap-2">
                      {['UX Confusa', 'Bug/Errori', 'Lentezza', 'Funzioni mancanti', 'Altro'].map(
                        (tag) => (
                          <button
                            key={tag}
                            onClick={() =>
                              setState((prev) => ({
                                ...prev,
                                feedback: prev.feedback ? `${prev.feedback}, ${tag}` : tag,
                              }))
                            }
                            className="px-3 py-1.5 text-xs bg-afflyt-dark-50 border border-afflyt-glass-border rounded-full text-gray-400 hover:border-afflyt-cyan-500 hover:text-afflyt-cyan-400 transition-colors"
                          >
                            {tag}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <CyberButton
                  variant="primary"
                  className="w-full justify-center"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Invia Feedback
                </CyberButton>
              </div>
            )}

            {/* Skip button for step 1 */}
            {state.step === 1 && (
              <button
                onClick={handleClose}
                className="w-full mt-4 text-sm text-gray-500 hover:text-gray-400 transition-colors"
              >
                Chiedimelo dopo
              </button>
            )}
          </>
        )}
      </GlassCard>
    </div>
  );
}

export default BetaSurvey;
