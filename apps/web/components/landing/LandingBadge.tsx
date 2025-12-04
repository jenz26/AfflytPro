interface LandingBadgeProps {
  children: string;
}

export function LandingBadge({ children }: LandingBadgeProps) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-afflyt-cyan-500/10 text-afflyt-cyan-500 border border-afflyt-cyan-500/20">
      {children}
    </span>
  );
}
