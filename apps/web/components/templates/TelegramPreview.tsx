'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TelegramPreviewProps {
  template: string;
  sampleData?: {
    title?: string;
    price?: number;
    originalPrice?: number;
    discount?: number;
    rating?: number;
    reviewCount?: number;
    savings?: number;
    category?: string;
  };
  useAI?: boolean;
  aiGeneratedText?: string;
}

/**
 * TelegramPreview - Shows how the message will look in Telegram
 *
 * Renders a Telegram-style message preview with proper formatting:
 * - Markdown bold (**text**)
 * - Markdown italic (_text_)
 * - Strikethrough (~~text~~)
 * - Variable substitution with sample data
 */
export function TelegramPreview({
  template,
  sampleData = {},
  useAI = false,
  aiGeneratedText,
}: TelegramPreviewProps) {
  const t = useTranslations('templates.preview');

  // Default sample data
  const data = {
    title: sampleData.title || 'Echo Dot (5ª generazione) | Altoparlante intelligente...',
    price: sampleData.price || 24.99,
    originalPrice: sampleData.originalPrice || 64.99,
    discount: sampleData.discount || 62,
    rating: sampleData.rating || 4.7,
    reviewCount: sampleData.reviewCount || 89543,
    savings: sampleData.savings || 40.00,
    category: sampleData.category || 'Elettronica',
  };

  // Replace variables in template
  let processedMessage = template
    .replace(/\{title\}/g, data.title)
    .replace(/\{price\}/g, data.price.toFixed(2))
    .replace(/\{originalPrice\}/g, data.originalPrice.toFixed(2))
    .replace(/\{discount\}/g, data.discount.toString())
    .replace(/\{rating\}/g, data.rating.toString())
    .replace(/\{reviewCount\}/g, data.reviewCount.toLocaleString('it-IT'))
    .replace(/\{savings\}/g, data.savings.toFixed(2))
    .replace(/\{category\}/g, data.category);

  // If AI is enabled and we have generated text, replace {aiDescription}
  if (useAI && aiGeneratedText) {
    processedMessage = processedMessage.replace(/\{aiDescription\}/g, aiGeneratedText);
  } else {
    // Remove AI placeholder if not used
    processedMessage = processedMessage.replace(/\{aiDescription\}/g, '');
  }

  // Convert markdown to HTML for preview
  const formatMarkdown = (text: string) => {
    return text
      // Bold: **text** or __text__
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      // Italic: *text* or _text_
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      // Strikethrough: ~~text~~
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      // Line breaks
      .replace(/\n/g, '<br/>');
  };

  const formattedMessage = formatMarkdown(processedMessage);

  return (
    <GlassCard className="bg-[#0e1621] border-gray-700" padding="lg">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
        <MessageCircle className="w-5 h-5 text-[#8774E1]" />
        <h3 className="text-white font-bold text-sm">{t('title')}</h3>
      </div>

      {/* Telegram Message Bubble */}
      <div className="bg-[#182533] rounded-lg rounded-tl-none p-4 shadow-lg">
        {/* Message Content */}
        <div
          className="text-white text-sm leading-relaxed telegram-message"
          dangerouslySetInnerHTML={{ __html: formattedMessage }}
        />

        {/* Message Footer */}
        <div className="flex items-center justify-end gap-2 mt-2 text-xs text-gray-400">
          <span>{new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
          <svg width="16" height="11" viewBox="0 0 16 11" fill="none" className="text-[#53A0E4]">
            <path d="M6 8.5L2.5 5L1 6.5L6 11.5L15 2.5L13.5 1L6 8.5Z" fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* Channel Info */}
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <div className="w-6 h-6 rounded-full bg-[#8774E1] flex items-center justify-center text-white font-bold">
          A
        </div>
        <span>{t('channel')}</span>
        <span className="opacity-50">•</span>
        <span>{new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span>
      </div>

      {/* Style for markdown */}
      <style jsx global>{`
        .telegram-message strong {
          font-weight: 700;
        }
        .telegram-message em {
          font-style: italic;
        }
        .telegram-message del {
          text-decoration: line-through;
          opacity: 0.7;
        }
        .telegram-message a {
          color: #53A0E4;
          text-decoration: none;
        }
        .telegram-message a:hover {
          text-decoration: underline;
        }
      `}</style>
    </GlassCard>
  );
}
