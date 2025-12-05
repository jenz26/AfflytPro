'use client';

import { ReactNode, useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface QuickAnswerProps {
  question: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function QuickAnswer({ question, children, defaultOpen = false }: QuickAnswerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="my-4 rounded-xl border border-gray-800 bg-afflyt-dark-50 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-afflyt-cyan-400/10 flex items-center justify-center">
          <HelpCircle className="h-4 w-4 text-afflyt-cyan-400" />
        </div>
        <span className="flex-1 font-medium text-white">{question}</span>
        <div className="flex-shrink-0 text-gray-400">
          {isOpen ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pl-15">
          <div className="pl-11 text-gray-300 text-sm leading-relaxed [&>p]:m-0">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// FAQ Group component
interface FAQProps {
  children: ReactNode;
}

export function FAQ({ children }: FAQProps) {
  return (
    <div className="my-8 space-y-2">
      {children}
    </div>
  );
}
