import { Telegraf } from 'telegraf';

// Internal API configuration
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-dev-key';
const API_BASE = process.env.API_BASE_INTERNAL || `http://localhost:${process.env.PORT || 3001}`;
const API_BASE_PUBLIC = process.env.API_BASE_PUBLIC || 'https://api.afflyt.io';
const APP_URL = process.env.APP_URL || 'https://afflyt.io';

/**
 * Escape special characters for Telegram MarkdownV2
 * Characters that need escaping: _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
function escapeMarkdownV2(text: string): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

export class TelegramBotService {
  /**
   * Validate bot token
   */
  static async validateToken(token: string): Promise<{
    valid: boolean;
    botInfo?: { id: number; username: string; firstName: string };
    error?: string;
  }> {
    try {
      const bot = new Telegraf(token);
      const botInfo = await bot.telegram.getMe();

      return {
        valid: true,
        botInfo: {
          id: botInfo.id,
          username: botInfo.username,
          firstName: botInfo.first_name
        }
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Validate channel connection
   */
  static async validateChannelConnection(
    token: string,
    channelId: string
  ): Promise<{
    valid: boolean;
    canPost: boolean;
    error?: string;
  }> {
    try {
      const bot = new Telegraf(token);

      // Try to get chat info
      await bot.telegram.getChat(channelId);

      // Check if bot is admin
      const admins = await bot.telegram.getChatAdministrators(channelId);
      const botInfo = await bot.telegram.getMe();
      const isBotAdmin = admins.some(admin => admin.user.id === botInfo.id);

      return {
        valid: true,
        canPost: isBotAdmin
      };
    } catch (error: any) {
      return {
        valid: false,
        canPost: false,
        error: error.message
      };
    }
  }

  /**
   * Send deal message to channel with short link tracking
   */
  static async sendDealToChannel(
    channelId: string,
    token: string,
    deal: {
      asin: string;
      title: string;
      price: number;
      originalPrice: number;
      discount: number;
      rating: number;
      reviewCount: number;
      imageUrl?: string;
      affiliateLink: string;
      // New fields for deal type
      dealType?: 'discounted' | 'lowest_price';
      hasVisibleDiscount?: boolean;
      isLowestEver?: boolean;
      includeKeepaChart?: boolean;
    },
    userId?: string,
    amazonTag?: string
  ) {
    try {
      const bot = new Telegraf(token);

      // 1. Create trackable short link via internal API
      let shortUrl = deal.affiliateLink; // Fallback to direct link

      if (userId && amazonTag) {
        try {
          const shortLinkResponse = await fetch(`${API_BASE}/internal/links/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Key': INTERNAL_API_KEY
            },
            body: JSON.stringify({
              asin: deal.asin,
              amazonUrl: deal.affiliateLink,
              amazonTag: amazonTag,
              userId: userId,
              title: deal.title,
              imageUrl: deal.imageUrl,
              currentPrice: deal.price,
              originalPrice: deal.originalPrice,
              source: 'telegram',
              campaignId: `channel_${channelId}`,
            }),
          });

          if (shortLinkResponse.ok) {
            const linkData = await shortLinkResponse.json();
            shortUrl = linkData.shortUrl;
          } else {
            console.warn('Failed to create short link, using direct Amazon link');
          }
        } catch (linkError) {
          console.warn('Short link creation failed, using direct Amazon link:', linkError);
        }
      }

      // 2. Format message based on deal type (using MarkdownV2)
      const discountPercent = Math.round(deal.discount * 100);
      const savings = (deal.originalPrice - deal.price).toFixed(2);

      // Escape title for MarkdownV2
      const safeTitle = escapeMarkdownV2(deal.title);
      const safePrice = escapeMarkdownV2(deal.price.toString());
      const safeOriginalPrice = escapeMarkdownV2(deal.originalPrice.toString());
      const safeSavings = escapeMarkdownV2(savings);

      // Different header based on deal type
      let header = '🔥 *HOT DEAL ALERT\\!*';
      let priceSection = '';

      if (deal.dealType === 'lowest_price' && !deal.hasVisibleDiscount) {
        // Lowest price deal without visible discount on Amazon
        header = '📉 *PREZZO MINIMO STORICO\\!*';
        priceSection = `💰 *Prezzo:* €${safePrice}
📊 _Al minimo storico \\- Non troverai di meglio\\!_`;
      } else {
        // Regular discounted deal - use strikethrough ~~ for original price
        priceSection = `💰 *Prezzo:* €${safePrice} ~€${safeOriginalPrice}~
💸 *Risparmi:* €${safeSavings} \\(\\-${discountPercent}%\\)`;
      }

      // Add lowest price badge if applicable
      const lowestBadge = deal.isLowestEver && deal.hasVisibleDiscount
        ? '\n🏆 *Prezzo più basso di sempre\\!*'
        : '';

      // Rating section (only if rating > 0)
      const ratingSection = deal.rating > 0
        ? `\n⭐ *Rating:* ${escapeMarkdownV2(deal.rating.toString())}/5 \\(${escapeMarkdownV2(deal.reviewCount.toLocaleString())} recensioni\\)`
        : '';

      // Keepa chart URL (via our proxy to protect API key)
      const keepaChartUrl = deal.includeKeepaChart
        ? `${API_BASE_PUBLIC}/keepa/graph/${deal.asin}?domain=it&range=180&bb=1&salesrank=0`
        : null;

      const message = `
${header}

${safeTitle}

${priceSection}${lowestBadge}${ratingSection}

👉 [Vedi su Amazon](${shortUrl})

_\\#Ad \\| Deal trovato da Afflyt Pro 🤖_
      `.trim();

      // 3. Prepare keyboard (skip for localhost - Telegram requires HTTPS)
      const isLocalhost = shortUrl.startsWith('http://localhost') || shortUrl.startsWith('http://127.0.0.1');
      const keyboard = isLocalhost ? undefined : {
        inline_keyboard: [
          [{ text: '🛒 Vai su Amazon', url: shortUrl }]
        ]
      };

      // Add warning for localhost
      const finalMessage = isLocalhost
        ? `${message}\n\n⚠️ _Bottone inline disabilitato \\(localhost non supportato da Telegram\\)_`
        : message;

      // 4. Send to channel
      if (deal.imageUrl) {
        await bot.telegram.sendPhoto(channelId, deal.imageUrl, {
          caption: finalMessage,
          parse_mode: 'MarkdownV2',
          ...(keyboard && { reply_markup: keyboard })
        });
      } else {
        await bot.telegram.sendMessage(channelId, finalMessage, {
          parse_mode: 'MarkdownV2',
          ...(keyboard && { reply_markup: keyboard })
        });
      }

      // 5. Send Keepa price history chart if enabled
      if (keepaChartUrl) {
        try {
          await bot.telegram.sendPhoto(channelId, keepaChartUrl, {
            caption: `📈 _Storico prezzi ultimi 180 giorni \\(${escapeMarkdownV2(deal.asin)}\\)_`,
            parse_mode: 'MarkdownV2'
          });
        } catch (chartError) {
          // Don't fail the whole message if chart fails
          console.warn(`Failed to send Keepa chart for ${deal.asin}:`, chartError);
        }
      }

      return { success: true, shortUrl };
    } catch (error: any) {
      console.error('Telegram send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test connection with sample message that looks like a real deal
   */
  static async sendTestMessage(channelId: string, token: string) {
    try {
      const bot = new Telegraf(token);

      // Send a realistic-looking test message (MarkdownV2)
      const testMessage = `
🔥 *HOT DEAL ALERT\\!*

Apple AirPods Pro \\(2ª generazione\\) con custodia MagSafe

💰 *Prezzo:* €199\\.99 ~€279\\.99~
💸 *Risparmi:* €80\\.00 \\(\\-29%\\)
⭐ *Rating:* 4\\.8/5 \\(12,847 recensioni\\)

✅ *Connessione riuscita\\!*
Il tuo bot Afflyt Pro è configurato correttamente\\.

_\\#Ad \\| Messaggio di test da Afflyt Pro 🤖_
      `.trim();

      await bot.telegram.sendMessage(channelId, testMessage, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛒 Vai su Amazon', url: 'https://afflyt.io' }]
          ]
        }
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
