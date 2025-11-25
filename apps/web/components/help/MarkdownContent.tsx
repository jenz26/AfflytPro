'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  Code,
  Terminal,
  Flame,
  Zap,
  Target,
  Rocket,
  Bot,
  Mail,
  Calendar,
  BarChart3,
  Link2,
  Clock,
  Key,
  Shield,
  Book,
  FileText,
  MessageCircle,
  Phone,
  Download,
  Upload,
  Settings,
  Video,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  Package,
  Star,
  Users,
  Eye,
  Heart,
  ThumbsUp,
  ThumbsDown,
  ChevronRight
} from 'lucide-react';

// Icon mapping for common emoji/keywords to Lucide icons
const iconMap: Record<string, any> = {
  // Status & Actions
  '✅': CheckCircle,
  '❌': XCircle,
  '⚠️': AlertTriangle,
  'ℹ️': Info,
  '💡': Lightbulb,

  // Emotions & Reactions
  '🔥': Flame,
  '⚡': Zap,
  '🎯': Target,
  '🚀': Rocket,
  '🤖': Bot,
  '👍': ThumbsUp,
  '👎': ThumbsDown,
  '❤️': Heart,
  '⭐': Star,
  '👁️': Eye,

  // Communication
  '📧': Mail,
  '📞': Phone,
  '💬': MessageCircle,
  '📅': Calendar,

  // Business & Analytics
  '📊': BarChart3,
  '💰': DollarSign,
  '📈': TrendingUp,
  '🔗': Link2,

  // Time & Status
  '⏱️': Clock,
  '⏰': Clock,

  // Security & Access
  '🔑': Key,
  '🛡️': Shield,

  // Content
  '📚': Book,
  '📄': FileText,
  '📹': Video,
  '🖼️': ImageIcon,

  // System
  '⚙️': Settings,
  '📦': Package,
  '👥': Users,

  // Actions
  '📥': Download,
  '📤': Upload,
  '🔄': ChevronRight,
  '→': ChevronRight,
};

// Function to replace emoji with icon components
function replaceEmojisWithIcons(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentText = '';
  let index = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const twoChar = text.slice(i, i + 2);

    // Check for two-character emoji first
    if (iconMap[twoChar]) {
      if (currentText) {
        parts.push(currentText);
        currentText = '';
      }
      const IconComponent = iconMap[twoChar];
      parts.push(
        <IconComponent
          key={`icon-${index++}`}
          className="inline-block w-4 h-4 mx-0.5 text-afflyt-cyan-400"
        />
      );
      i++; // Skip next character
    }
    // Then check single character
    else if (iconMap[char]) {
      if (currentText) {
        parts.push(currentText);
        currentText = '';
      }
      const IconComponent = iconMap[char];
      parts.push(
        <IconComponent
          key={`icon-${index++}`}
          className="inline-block w-4 h-4 mx-0.5 text-afflyt-cyan-400"
        />
      );
    }
    // Regular text
    else {
      currentText += char;
    }
  }

  if (currentText) {
    parts.push(currentText);
  }

  return parts.length > 0 ? parts : [text];
}

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose prose-invert prose-cyan max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => {
            const processedChildren = typeof children === 'string'
              ? replaceEmojisWithIcons(children)
              : children;
            return (
              <h1 className="text-3xl font-bold text-white mb-6 mt-8 first:mt-0 pb-3 border-b border-afflyt-glass-border flex items-center gap-2">
                {processedChildren}
              </h1>
            );
          },
          h2: ({ children }) => {
            const processedChildren = typeof children === 'string'
              ? replaceEmojisWithIcons(children)
              : children;
            return (
              <h2 className="text-2xl font-bold text-white mb-4 mt-8 flex items-center gap-2">
                {processedChildren}
              </h2>
            );
          },
          h3: ({ children }) => {
            const processedChildren = typeof children === 'string'
              ? replaceEmojisWithIcons(children)
              : children;
            return (
              <h3 className="text-xl font-semibold text-white mb-3 mt-6 flex items-center gap-2">
                {processedChildren}
              </h3>
            );
          },
          h4: ({ children }) => {
            const processedChildren = typeof children === 'string'
              ? replaceEmojisWithIcons(children)
              : children;
            return (
              <h4 className="text-lg font-semibold text-white mb-2 mt-4 flex items-center gap-2">
                {processedChildren}
              </h4>
            );
          },

          // Paragraphs
          p: ({ children }) => {
            const processedChildren = typeof children === 'string'
              ? replaceEmojisWithIcons(children)
              : children;
            return (
              <p className="text-gray-300 leading-relaxed mb-4">
                {processedChildren}
              </p>
            );
          },

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-afflyt-cyan-400 hover:text-afflyt-cyan-300 underline decoration-afflyt-cyan-400/30 hover:decoration-afflyt-cyan-300 transition"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="space-y-2 mb-4 pl-6">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-2 mb-4 pl-6 list-decimal">
              {children}
            </ol>
          ),
          li: ({ children }) => {
            const processedChildren = typeof children === 'string'
              ? replaceEmojisWithIcons(children)
              : children;
            return (
              <li className="text-gray-300 leading-relaxed flex items-start gap-2">
                {processedChildren}
              </li>
            );
          },

          // Code blocks
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 bg-afflyt-dark-50 border border-afflyt-glass-border rounded text-afflyt-cyan-400 text-sm font-mono">
                  {children}
                </code>
              );
            }

            const language = className?.replace('language-', '') || 'text';

            return (
              <div className="my-4 rounded-lg overflow-hidden border border-afflyt-glass-border">
                <div className="flex items-center justify-between px-4 py-2 bg-afflyt-dark-50 border-b border-afflyt-glass-border">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-afflyt-cyan-400" />
                    <span className="text-xs text-gray-400 font-mono">{language}</span>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(String(children))}
                    className="px-2 py-1 text-xs text-afflyt-cyan-400 hover:text-afflyt-cyan-300 transition"
                  >
                    Copia
                  </button>
                </div>
                <pre className="p-4 bg-afflyt-dark-100 overflow-x-auto">
                  <code className="text-sm text-gray-300 font-mono">
                    {children}
                  </code>
                </pre>
              </div>
            );
          },

          // Blockquotes (for callouts)
          blockquote: ({ children }) => {
            const text = String(children);

            // Detect callout type from emoji or keywords
            let IconComponent = Info;
            let bgColor = 'bg-blue-500/10';
            let borderColor = 'border-blue-500/30';
            let textColor = 'text-blue-400';

            if (text.includes('💡') || text.includes('Tip') || text.includes('Note')) {
              IconComponent = Lightbulb;
              bgColor = 'bg-afflyt-cyan-500/10';
              borderColor = 'border-afflyt-cyan-500/30';
              textColor = 'text-afflyt-cyan-400';
            } else if (text.includes('⚠️') || text.includes('Importante') || text.includes('IMPORTANTE') || text.includes('Important')) {
              IconComponent = AlertTriangle;
              bgColor = 'bg-yellow-500/10';
              borderColor = 'border-yellow-500/30';
              textColor = 'text-yellow-400';
            } else if (text.includes('🔴') || text.includes('ERRORE') || text.includes('Errore') || text.includes('Error')) {
              IconComponent = XCircle;
              bgColor = 'bg-red-500/10';
              borderColor = 'border-red-500/30';
              textColor = 'text-red-400';
            } else if (text.includes('✅') || text.includes('Successo') || text.includes('Success')) {
              IconComponent = CheckCircle;
              bgColor = 'bg-afflyt-profit-500/10';
              borderColor = 'border-afflyt-profit-500/30';
              textColor = 'text-afflyt-profit-400';
            }

            return (
              <div className={`my-4 p-4 ${bgColor} border ${borderColor} rounded-lg flex gap-3`}>
                <div className={`${textColor} shrink-0 mt-0.5`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 text-gray-300 [&>p]:mb-0">
                  {children}
                </div>
              </div>
            );
          },

          // Tables
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-afflyt-glass-border">
              <table className="w-full">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-afflyt-dark-50 border-b border-afflyt-glass-border">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-gray-300 border-t border-afflyt-glass-border">
              {children}
            </td>
          ),

          // Horizontal rule
          hr: () => (
            <hr className="my-8 border-afflyt-glass-border" />
          ),

          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-bold text-white">
              {children}
            </strong>
          ),

          // Emphasis/Italic
          em: ({ children }) => (
            <em className="italic text-gray-300">
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
