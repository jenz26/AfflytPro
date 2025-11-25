/**
 * MessageFormatter - Format deals for publishing
 * 
 * Creates rich, formatted messages for Telegram/Discord channels
 */
export class MessageFormatter {
    /**
     * Format deal for Telegram/Discord with emojis and markdown
     * 
     * @param deal - Deal information
     * @returns Formatted message string
     */
    static formatDeal(deal: {
        title: string;
        score: number;
        currentPrice: number;
        originalPrice: number;
        discount: number;
        affiliateUrl: string;
        category?: string;
        rating?: number;
        reviewCount?: number;
    }): string {
        // Select emoji based on score
        const emoji = deal.score >= 90
            ? '🔥'
            : deal.score >= 80
                ? '⭐'
                : '💎';

        // Build message parts
        const parts: string[] = [];

        // Header with score
        parts.push(`${emoji} **DEAL SCORE: ${deal.score}/100** ${emoji}\n`);

        // Product title
        parts.push(`📦 **${deal.title}**\n`);

        // Category (if available)
        if (deal.category) {
            parts.push(`🏷️ Categoria: ${deal.category}\n`);
        }

        // Price info
        parts.push(`💰 **Prezzo**: €${deal.currentPrice.toFixed(2)} ~~€${deal.originalPrice.toFixed(2)}~~`);
        parts.push(`🎯 **Sconto**: -${deal.discount}%\n`);

        // Rating (if available)
        if (deal.rating && deal.reviewCount) {
            const stars = '⭐'.repeat(Math.round(deal.rating));
            parts.push(`${stars} ${deal.rating.toFixed(1)} (${deal.reviewCount.toLocaleString()} recensioni)\n`);
        }

        // Affiliate link
        parts.push(`🔗 [Vai all'offerta](${deal.affiliateUrl})\n`);

        // Footer with timestamp
        const timestamp = new Date().toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        parts.push(`\n_Prezzi aggiornati al ${timestamp}_`);

        return parts.join('\n');
    }

    /**
     * Format simple notification message
     */
    static formatNotification(
        title: string,
        message: string,
        type: 'info' | 'success' | 'warning' | 'error' = 'info'
    ): string {
        const emoji = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        }[type];

        return `${emoji} **${title}**\n\n${message}`;
    }

    /**
     * Format automation summary
     */
    static formatAutomationSummary(summary: {
        ruleName: string;
        dealsProcessed: number;
        dealsPublished: number;
        executionTime: number;
    }): string {
        return `
🤖 **Automation Report: ${summary.ruleName}**

📊 Deals analizzati: ${summary.dealsProcessed}
📢 Deals pubblicati: ${summary.dealsPublished}
⏱️ Tempo di esecuzione: ${summary.executionTime}ms

${summary.dealsPublished > 0 ? '✅ Esecuzione completata con successo' : 'ℹ️ Nessun deal pubblicato'}
    `.trim();
    }
}
