import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://afflyt.io';
  const lastModified = new Date();

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
    // Cornerstone: Guida Telegram Automation
    {
      url: `${baseUrl}/it/guide/automatizzare-canale-telegram-affiliate`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Cornerstone: Guida Scegliere Prodotti
    {
      url: `${baseUrl}/it/guide/scegliere-prodotti-migliori-automazione`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
