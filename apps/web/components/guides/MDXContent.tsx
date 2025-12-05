'use client';

import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import {
  Callout,
  Steps,
  Step,
  StatsGrid,
  Stat,
  ComparisonTable,
  CTA,
  ScoreBreakdown,
  BeforeAfter,
  BeforeAfterHorizontal,
  Timeline,
  TimelineItem,
  QuickAnswer,
  FAQ,
  VideoEmbed,
} from '@/components/mdx';

// MDX components mapping
const components = {
  // Custom components
  Callout,
  Steps,
  Step,
  StatsGrid,
  Stat,
  ComparisonTable,
  CTA,
  ScoreBreakdown,
  BeforeAfter,
  BeforeAfterHorizontal,
  Timeline,
  TimelineItem,
  QuickAnswer,
  FAQ,
  VideoEmbed,

  // Override default HTML elements with styled versions
  // These are optional - prose classes handle most styling
};

interface MDXContentProps {
  source: MDXRemoteSerializeResult;
}

export function MDXContent({ source }: MDXContentProps) {
  return <MDXRemote {...source} components={components} />;
}
