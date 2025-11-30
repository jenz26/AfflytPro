import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const bountyTemplates = [
  {
    name: 'Amazon Prime IT',
    bountyType: 'PRIME',
    locale: 'it',
    baseUrl: 'https://www.amazon.it/amazonprime',
    tagParam: 'tag',
    emoji: '🚀',
    avgCommission: 3.0,
    casualCopy: `🚀 Hai già provato Amazon Prime?

Consegne gratuite, Prime Video, Music e tanto altro!

👉 {{link}}`,
    professionalCopy: `📦 Amazon Prime: il tuo shopping evoluto

Spedizioni illimitate in 1 giorno, streaming incluso.

Scopri i vantaggi → {{link}}`,
    urgentCopy: `⚡️ ULTIMA CHIAMATA: Prime GRATIS per 30 giorni!

Non perdere questa occasione 👇
{{link}}`,
  },
  {
    name: 'Audible IT',
    bountyType: 'AUDIBLE',
    locale: 'it',
    baseUrl: 'https://www.amazon.it/hz/audible/mlp',
    tagParam: 'tag',
    emoji: '🎧',
    avgCommission: 5.0,
    casualCopy: `🎧 Ami leggere ma non hai tempo?

Audible ti regala il primo audiolibro!

👉 {{link}}`,
    professionalCopy: `📚 Audible: trasforma il tempo in cultura

+200.000 audiolibri, il primo è gratis.

Inizia ora → {{link}}`,
    urgentCopy: `🔥 OFFERTA LIMITATA: Audiolibro GRATIS!

Solo per nuovi iscritti 👇
{{link}}`,
  },
  {
    name: 'Kindle Unlimited IT',
    bountyType: 'KINDLE',
    locale: 'it',
    baseUrl: 'https://www.amazon.it/kindle-dbs/hz/subscribe/ku',
    tagParam: 'tag',
    emoji: '📖',
    avgCommission: 3.0,
    casualCopy: `📖 Leggi quanto vuoi, senza limiti!

Kindle Unlimited: milioni di ebook a portata di mano.

👉 {{link}}`,
    professionalCopy: `📚 Kindle Unlimited: la tua biblioteca infinita

Accesso illimitato a milioni di titoli.

Scopri di più → {{link}}`,
    urgentCopy: `📕 PROVA GRATIS: 30 giorni di lettura illimitata!

Non aspettare 👇
{{link}}`,
  },
  {
    name: 'Amazon Music Unlimited IT',
    bountyType: 'MUSIC',
    locale: 'it',
    baseUrl: 'https://www.amazon.it/music/unlimited',
    tagParam: 'tag',
    emoji: '🎵',
    avgCommission: 3.0,
    casualCopy: `🎵 Musica senza pubblicità, ovunque tu sia!

Amazon Music Unlimited: 100 milioni di brani.

👉 {{link}}`,
    professionalCopy: `🎶 Amazon Music Unlimited

Qualità HD, nessuna pubblicità, milioni di brani.

Prova gratis → {{link}}`,
    urgentCopy: `🔊 GRATIS per 30 giorni: Amazon Music Unlimited!

Musica illimitata senza pubblicità 👇
{{link}}`,
  },
  // English templates
  {
    name: 'Amazon Prime EN',
    bountyType: 'PRIME',
    locale: 'en',
    baseUrl: 'https://www.amazon.com/amazonprime',
    tagParam: 'tag',
    emoji: '🚀',
    avgCommission: 3.0,
    casualCopy: `🚀 Have you tried Amazon Prime yet?

Free delivery, Prime Video, Music and much more!

👉 {{link}}`,
    professionalCopy: `📦 Amazon Prime: your shopping elevated

Unlimited 1-day shipping, streaming included.

Discover the benefits → {{link}}`,
    urgentCopy: `⚡️ LAST CALL: Prime FREE for 30 days!

Don't miss this opportunity 👇
{{link}}`,
  },
  {
    name: 'Audible EN',
    bountyType: 'AUDIBLE',
    locale: 'en',
    baseUrl: 'https://www.amazon.com/hz/audible/mlp',
    tagParam: 'tag',
    emoji: '🎧',
    avgCommission: 5.0,
    casualCopy: `🎧 Love reading but no time?

Audible gives you your first audiobook FREE!

👉 {{link}}`,
    professionalCopy: `📚 Audible: turn your time into knowledge

+200,000 audiobooks, first one is free.

Start now → {{link}}`,
    urgentCopy: `🔥 LIMITED OFFER: FREE Audiobook!

New subscribers only 👇
{{link}}`,
  },
];

async function main() {
  console.log('Seeding bounty templates...');

  for (const template of bountyTemplates) {
    const existing = await prisma.bountyTemplate.findFirst({
      where: {
        bountyType: template.bountyType,
        locale: template.locale,
      },
    });

    if (existing) {
      // Update existing
      await prisma.bountyTemplate.update({
        where: { id: existing.id },
        data: template,
      });
      console.log(`Updated: ${template.name}`);
    } else {
      // Create new
      await prisma.bountyTemplate.create({
        data: template,
      });
      console.log(`Created: ${template.name}`);
    }
  }

  console.log('Bounty templates seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
