'use client';

import { ReactNode } from 'react';
import {
  Lightbulb,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Sparkles
} from 'lucide-react';

type CalloutType = 'tip' | 'warning' | 'info' | 'success' | 'danger' | 'note';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}

const calloutConfig: Record<CalloutType, {
  icon: ReactNode;
  borderColor: string;
  bgColor: string;
  iconColor: string;
  titleColor: string;
  defaultTitle: string;
}> = {
  tip: {
    icon: <Lightbulb className="h-5 w-5" />,
    borderColor: 'border-l-emerald-500',
    bgColor: 'bg-emerald-500/5',
    iconColor: 'text-emerald-400',
    titleColor: 'text-emerald-400',
    defaultTitle: 'Pro Tip',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    borderColor: 'border-l-amber-500',
    bgColor: 'bg-amber-500/5',
    iconColor: 'text-amber-400',
    titleColor: 'text-amber-400',
    defaultTitle: 'Attenzione',
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-500/5',
    iconColor: 'text-blue-400',
    titleColor: 'text-blue-400',
    defaultTitle: 'Info',
  },
  success: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    borderColor: 'border-l-green-500',
    bgColor: 'bg-green-500/5',
    iconColor: 'text-green-400',
    titleColor: 'text-green-400',
    defaultTitle: 'Fatto',
  },
  danger: {
    icon: <XCircle className="h-5 w-5" />,
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-500/5',
    iconColor: 'text-red-400',
    titleColor: 'text-red-400',
    defaultTitle: 'Errore',
  },
  note: {
    icon: <Sparkles className="h-5 w-5" />,
    borderColor: 'border-l-afflyt-cyan-400',
    bgColor: 'bg-afflyt-cyan-400/5',
    iconColor: 'text-afflyt-cyan-400',
    titleColor: 'text-afflyt-cyan-400',
    defaultTitle: 'Nota',
  },
};

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const config = calloutConfig[type];
  const displayTitle = title || config.defaultTitle;

  return (
    <div
      className={`my-6 rounded-r-lg border-l-4 ${config.borderColor} ${config.bgColor} p-4`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          {displayTitle && (
            <p className={`font-semibold ${config.titleColor} mb-1`}>
              {displayTitle}
            </p>
          )}
          <div className="text-gray-300 text-sm leading-relaxed [&>p]:m-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
