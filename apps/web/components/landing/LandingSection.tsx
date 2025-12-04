import { ReactNode } from 'react';

interface LandingSectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  background?: 'default' | 'dark' | 'gradient';
}

export function LandingSection({
  children,
  className = '',
  id,
  background = 'default'
}: LandingSectionProps) {
  const bgClasses = {
    default: '',
    dark: 'bg-afflyt-dark-950/50',
    gradient: 'bg-gradient-to-b from-transparent to-afflyt-dark-950/30',
  };

  return (
    <section
      id={id}
      className={`px-4 py-16 md:py-24 ${bgClasses[background]} ${className}`}
    >
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </section>
  );
}
