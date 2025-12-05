import { MetadataRoute } from 'next';
import { getAllGuides } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://afflyt.io';
  const lastModified = new Date();

  // Get all guides dynamically
  const guides = getAllGuides();
  const guideUrls = guides.map((guide) => ({
    url: `${baseUrl}/it/guide/${guide.slug}`,
    lastModified: guide.updatedAt ? new Date(guide.updatedAt) : new Date(guide.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: guide.featured ? 0.8 : 0.7,
  }));

  return [
    // Landing IT (principale - priorità massima per 301 da DealPilot)
    {
      url: `${baseUrl}/it`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Landing EN
    {
      url: `${baseUrl}/en`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Guide Index Page
    {
      url: `${baseUrl}/it/guide`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // All guides (dynamic)
    ...guideUrls,
    // Migration page - DealPilot → Afflyt (SEO continuity)
    {
      url: `${baseUrl}/it/blog/dealpilot-diventa-afflyt`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.9,
    },
  ];
}
