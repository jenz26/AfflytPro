'use client';

import { ReactNode } from 'react';
import { Check } from 'lucide-react';

interface StepProps {
  number?: number;
  title: string;
  children: ReactNode;
  completed?: boolean;
}

interface StepsProps {
  children: ReactNode;
}

export function Step({ number, title, children, completed }: StepProps) {
  return (
    <div className="relative pl-10 pb-8 last:pb-0">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-700 last:hidden" />

      {/* Number circle */}
      <div
        className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          completed
            ? 'bg-emerald-500 text-white'
            : 'bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-plasma-500 text-white'
        }`}
      >
        {completed ? <Check className="h-4 w-4" /> : number}
      </div>

      {/* Content */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
        <div className="text-gray-400 text-sm leading-relaxed [&>p]:m-0">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Steps({ children }: StepsProps) {
  // Auto-number steps if not provided
  const numberedChildren = Array.isArray(children)
    ? children.map((child, index) => {
        if (child && typeof child === 'object' && 'type' in child && child.type === Step) {
          return {
            ...child,
            props: {
              ...child.props,
              number: child.props.number ?? index + 1,
            },
          };
        }
        return child;
      })
    : children;

  return (
    <div className="my-8 relative">
      {numberedChildren}
    </div>
  );
}
