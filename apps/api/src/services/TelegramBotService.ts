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

/**
 * Convert LLM-generated Markdown to Telegram MarkdownV2
 *
 * LLM generates standard Markdown: **bold**, _italic_
 * Telegram MarkdownV2 uses: *bold*, _italic_ (but special chars must be escaped)
 *
 * Strategy:
 * 1. Convert **bold** to *bold* directly (Telegram format)
 * 2. Escape special characters EXCEPT * and _ used for formatting
 */
function convertLLMToMarkdownV2(text: string): string {
    // Step 1: Convert standard Markdown to Telegram MarkdownV2
    // **bold** → *bold*
    // ~~strikethrough~~ → ~strikethrough~ (Telegram uses single tilde)
    let result = text.replace(/\*\*(.+?)\*\*/g, '*$1*');
    result = result.replace(/~~(.+?)~~/g, '~$1~');

    // Step 2: Escape special characters for MarkdownV2
    // We need to escape: _ * [ ] ( ) ~ ` > # + - = | { } . ! \
    // BUT we must preserve * for bold, _ for italic, ~ for strikethrough

    // First, temporarily protect our formatting markers
    const boldMatches: string[] = [];
    result = result.replace(/\*([^*]+)\*/g, (match, content) => {
        boldMatches.push(content);
        return `\x00BOLD${boldMatches.length - 1}\x00`;
    });

    const italicMatches: string[] = [];
    result = result.replace(/_([^_]+)_/g, (match, content) => {
        italicMatches.push(content);
        return `\x00ITALIC${italicMatches.length - 1}\x00`;
    });

    const strikeMatches: string[] = [];
    result = result.replace(/~([^~]+)~/g, (match, content) => {
        strikeMatches.push(content);
        return `\x00STRIKE${strikeMatches.length - 1}\x00`;
    });

    // Now escape all special characters
    result = result.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');

    // Restore bold markers (content was escaped, so we just wrap with *)
    result = result.replace(/\x00BOLD(\d+)\x00/g, (match, index) => {
        const content = boldMatches[parseInt(index)];
        // Escape the content inside bold
        const escapedContent = content.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
        return `*${escapedContent}*`;
    });

    // Restore italic markers
    result = result.replace(/\x00ITALIC(\d+)\x00/g, (match, index) => {
        const content = italicMatches[parseInt(index)];
        // Escape the content inside italic
        const escapedContent = content.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
        return `_${escapedContent}_`;
    });

    // Restore strikethrough markers
    result = result.replace(/\x00STRIKE(\d+)\x00/g, (match, index) => {
        const content = strikeMatches[parseInt(index)];
        // Escape the content inside strikethrough
        const escapedContent = content.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
        return `~${escapedContent}~`;
    });

    return result;
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
      // LLM-generated custom copy
      customCopy?: string;
    },
    userId?: string,
    amazonTag?: string
  ) {
    // Mock for stress test channels - dont actually send to Telegram
    if (channelId.startsWith('TEST_')) {
      console.log(`[Telegram] MOCK: Would send ${deal.asin} to ${channelId}`);
      return { success: true, shortUrl: `https://mock.test/${deal.asin}`, mocked: true };
    }

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

      // Keepa chart URL (via our proxy to protect API key)
      console.log(`[Telegram] Deal ${deal.asin}: includeKeepaChart=${deal.includeKeepaChart}, API_BASE_PUBLIC=${API_BASE_PUBLIC}`);
      const keepaChartUrl = deal.includeKeepaChart
        ? `${API_BASE_PUBLIC}/keepa/graph/${deal.asin}?domain=it&range=180&bb=1&salesrank=0`
        : null;

      let message: string;

      // Use custom LLM copy if provided, otherwise generate default message
      if (deal.customCopy) {
        // Convert LLM Markdown (**bold**) to Telegram MarkdownV2 (*bold*)
        // and escape special characters while preserving formatting
        const safeCopy = convertLLMToMarkdownV2(deal.customCopy);
        // Add the tracked short link - LLMCopyService no longer includes links
        message = `${safeCopy}\n\n👉 [Vai su Amazon](${shortUrl})\n\n_\\#Ad \\| Deal trovato da Afflyt Pro 🤖_`;
      } else {
        // Default template message
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

        message = `
${header}

${safeTitle}

${priceSection}${lowestBadge}${ratingSection}

👉 [Vedi su Amazon](${shortUrl})

_\\#Ad \\| Deal trovato da Afflyt Pro 🤖_
        `.trim();
      }

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
