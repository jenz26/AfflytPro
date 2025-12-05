'use client';

import { ReactNode } from 'react';
import { Check, Clock, Circle } from 'lucide-react';

type TimelineStatus = 'complete' | 'active' | 'pending';

interface TimelineItemProps {
  date: string;
  status?: TimelineStatus;
  children: ReactNode;
}

interface TimelineProps {
  children: ReactNode;
}

export function TimelineItem({ date, status = 'pending', children }: TimelineItemProps) {
  const statusConfig = {
    complete: {
      icon: <Check className="h-4 w-4 text-white" />,
      bg: 'bg-emerald-500',
      line: 'bg-emerald-500',
      dateColor: 'text-emerald-400',
    },
    active: {
      icon: <Clock className="h-4 w-4 text-white" />,
      bg: 'bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-plasma-500',
      line: 'bg-gray-700',
      dateColor: 'text-afflyt-cyan-400',
    },
    pending: {
      icon: <Circle className="h-4 w-4 text-gray-500" />,
      bg: 'bg-gray-700',
      line: 'bg-gray-700',
      dateColor: 'text-gray-500',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="relative pl-10 pb-8 last:pb-0">
      {/* Vertical line */}
      <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${config.line} last:hidden`} />

      {/* Status circle */}
      <div
        className={`absolute left-0 top-0 w-8 h-8 rounded-full ${config.bg} flex items-center justify-center ring-4 ring-afflyt-dark-100`}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div>
        <span className={`text-sm font-medium ${config.dateColor}`}>{date}</span>
        <div className="text-gray-300 text-sm mt-1 [&>p]:m-0">{children}</div>
      </div>
    </div>
  );
}

export function Timeline({ children }: TimelineProps) {
  return <div className="my-8">{children}</div>;
}
