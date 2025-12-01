'use client';

import { useState } from 'react';
import { MessageCircle, X, Bug, Lightbulb, HelpCircle, Send, Loader2, Check } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { Analytics } from '@/components/analytics/PostHogProvider';

type FeedbackType = 'bug' | 'idea' | 'question';

interface FeedbackWidgetProps {
  userPlan?: string;
}

const FEEDBACK_TYPES = [
  { id: 'bug' as const, label: 'Bug', icon: Bug, color: 'text-red-400 bg-red-500/20' },
  { id: 'idea' as const, label: 'Idea', icon: Lightbulb, color: 'text-yellow-400 bg-yellow-500/20' },
  { id: 'question' as const, label: 'Domanda', icon: HelpCircle, color: 'text-blue-400 bg-blue-500/20' },
];

export function FeedbackWidget({ userPlan }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('idea');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setIsSubmitting(true);

    try {
      // Track feedback event
      Analytics.trackFeedbackSubmitted(type, rating || undefined);

      // Track specific event types
      if (type === 'bug') {
        Analytics.trackBugReported(window.location.pathname);
      } else if (type === 'idea') {
        Analytics.trackFeatureRequested(message.substring(0, 100));
      }

      // Here you could also send to your API or Telegram
      // await fetch('/api/feedback', { ... });

      setIsSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
        setMessage('');
        setType('idea');
        setRating(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show for beta users
  if (userPlan !== 'BETA_TESTER') {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-afflyt-cyan-500 hover:bg-afflyt-cyan-600 text-afflyt-dark-100 font-medium rounded-full shadow-lg transition-all hover:scale-105"
      >
        <MessageCircle className="w-5 h-5" />
        <span>Feedback</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md p-6 animate-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Lascia un feedback</h3>
                <p className="text-sm text-gray-400">Aiutaci a migliorare Afflyt</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {isSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h4 className="text-lg font-medium text-white mb-2">Grazie per il feedback!</h4>
                <p className="text-gray-400">Lo leggeremo con attenzione.</p>
              </div>
            ) : (
              <>
                {/* Type Selection */}
                <div className="flex gap-2 mb-4">
                  {FEEDBACK_TYPES.map((feedbackType) => {
                    const Icon = feedbackType.icon;
                    const isSelected = type === feedbackType.id;
                    return (
                      <button
                        key={feedbackType.id}
                        onClick={() => setType(feedbackType.id)}
                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                          isSelected
                            ? `${feedbackType.color} border-current`
                            : 'bg-afflyt-dark-50/50 border-afflyt-glass-border text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{feedbackType.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Message */}
                <div className="mb-4">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      type === 'bug'
                        ? 'Descrivi il problema che hai riscontrato...'
                        : type === 'idea'
                        ? 'Cosa vorresti vedere in Afflyt?'
                        : 'Come possiamo aiutarti?'
                    }
                    className="w-full h-32 px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder-gray-500 resize-none focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Rating (optional) */}
                <div className="mb-6">
                  <label className="text-sm text-gray-400 mb-2 block">
                    Come valuti la tua esperienza? (opzionale)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        onClick={() => setRating(rating === value ? null : value)}
                        className={`w-10 h-10 rounded-lg border transition-all ${
                          rating === value
                            ? 'bg-afflyt-cyan-500/20 border-afflyt-cyan-500 text-afflyt-cyan-400'
                            : 'bg-afflyt-dark-50/50 border-afflyt-glass-border text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Context Info */}
                <div className="mb-4 p-3 bg-afflyt-dark-50/50 rounded-lg">
                  <p className="text-xs text-gray-500">
                    Pagina: {typeof window !== 'undefined' ? window.location.pathname : ''}
                  </p>
                </div>

                {/* Submit */}
                <CyberButton
                  variant="primary"
                  className="w-full justify-center"
                  onClick={handleSubmit}
                  disabled={!message.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Invia Feedback
                </CyberButton>
              </>
            )}
          </GlassCard>
        </div>
      )}
    </>
  );
}

export default FeedbackWidget;
