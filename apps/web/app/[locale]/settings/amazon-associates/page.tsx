'use client';

import { ImportSection } from '@/components/settings/amazon-import';

export default function AmazonAssociatesSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Sezione Import CSV */}
      <ImportSection />
    </div>
  );
}
