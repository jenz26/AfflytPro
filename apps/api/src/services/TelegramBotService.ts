import { Telegraf } from 'telegraf';

// Internal API configuration
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-dev-key';
const API_BASE = process.env.API_BASE_INTERNAL || `http://localhost:${process.env.PORT || 3001}`;
const APP_URL = process.env.APP_URL || 'https://afflyt.io';

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

      // 2. Format message with short link
      const discountPercent = Math.round(deal.discount * 100);
      const savings = (deal.originalPrice - deal.price).toFixed(2);

      const message = `
🔥 *HOT DEAL ALERT!*

${deal.title}

💰 *Prezzo:* €${deal.price} ~€${deal.originalPrice}~
💸 *Risparmi:* €${savings} (-${discountPercent}%)
⭐ *Rating:* ${deal.rating}/5 (${deal.reviewCount} recensioni)

👉 [Vedi su Amazon](${shortUrl})

_#Ad | Deal trovato da Afflyt Pro 🤖_
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
        ? `${message}\n\n⚠️ _Bottone inline disabilitato (localhost non supportato da Telegram)_`
        : message;

      // 4. Send to channel
      if (deal.imageUrl) {
        await bot.telegram.sendPhoto(channelId, deal.imageUrl, {
          caption: finalMessage,
          parse_mode: 'Markdown',
          ...(keyboard && { reply_markup: keyboard })
        });
      } else {
        await bot.telegram.sendMessage(channelId, finalMessage, {
          parse_mode: 'Markdown',
          ...(keyboard && { reply_markup: keyboard })
        });
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

      // Send a realistic-looking test message
      const testMessage = `
🔥 *HOT DEAL ALERT!*

Apple AirPods Pro (2ª generazione) con custodia MagSafe

💰 *Prezzo:* €199.99 ~€279.99~
💸 *Risparmi:* €80.00 (-29%)
⭐ *Rating:* 4.8/5 (12,847 recensioni)

✅ *Connessione riuscita!*
Il tuo bot Afflyt Pro è configurato correttamente.

_#Ad | Messaggio di test da Afflyt Pro 🤖_
      `.trim();

      await bot.telegram.sendMessage(channelId, testMessage, {
        parse_mode: 'Markdown',
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
