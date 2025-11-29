/**
 * LLMCopyService - AI-powered copy generation for deal messages
 *
 * Generates compelling Italian copy for Amazon deals using OpenAI.
 * Includes caching, fallback to templates, and compliance safeguards.
 */

import OpenAI from 'openai';
import { Redis } from 'ioredis';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface DealCopyPayload {
  asin: string;
  title: string;
  currentPrice: number;
  originalPrice: number;
  discountPercent: number;
  category: string;
  rating?: number | null;
  reviewCount?: number | null;
  isHistoricalLow?: boolean;
  hasVisibleDiscount?: boolean;
  affiliateUrl: string;
}

export interface CopyGenerationResult {
  text: string;
  source: 'TEMPLATE' | 'LLM' | 'LLM_CACHE' | 'LLM_FALLBACK_TEMPLATE';
  tokensUsed?: number;
  generatedAt: Date;
}

export interface LLMCopyConfig {
  copyMode: 'TEMPLATE' | 'LLM';
  messageTemplate?: string | null;
  customStylePrompt?: string | null;
  llmModel: string;
  ruleId: string;
}

// ═══════════════════════════════════════════════════════════════
// DEVELOPER PROMPT (COMPLIANCE-FIRST)
// ═══════════════════════════════════════════════════════════════

const DEVELOPER_PROMPT = `Sei un copywriter per Afflyt Pro, una piattaforma che genera post per canali Telegram di offerte Amazon Italia.

OBIETTIVO:
- Generare 1 solo testo breve (5-8 righe max) in ITALIANO.
- Tono: chiaro, concreto, niente hype esagerato.
- Target: utenti che seguono canali sconti su Telegram.

REGOLE FERREE (NON VIOLARLE MAI):
- NON inventare prezzi, coupon, percentuali o benefici non presenti nei dati.
- NON scrivere mai "prezzo più basso di sempre" o "minimo storico" se isHistoricalLow ≠ true.
- NON menzionare codici sconto, coupon o promozioni extra se non indicati nei dati.
- NON garantire disponibilità, spedizione o tempi di consegna.
- NON usare linguaggio fuorviante o troppo aggressivo (no "imperdibile", "obbligatorio", "da non perdere").
- NON aggiungere link, hashtag o menzioni - vengono aggiunti separatamente.

DEVI SEMPRE:
- Mostrare il prezzo attuale e, se disponibile, il prezzo precedente o lo sconto %.
- Evidenziare in 1 riga il "perché" è interessante (uso pratico, problema che risolve).
- Se hasVisibleDiscount è true, puoi dire "in offerta" o "scontato".
- Chiudere con una riga tipo: "Prezzo e disponibilità possono variare, verifica su Amazon."

FORMAT OUTPUT:
- Nessun titolo separato, inizia direttamente con il contenuto.
- Massimo 2-3 emoji se utili, niente emoji decorative inutili.
- Niente markdown complesso (massimo **grassetto** su 1-2 parole chiave).
- Nessun saluto iniziale ("Ciao!", "Ehi!") o finale ("A presto!").
- Nessun link nel testo (il sistema lo aggiunge dopo).

Se i dati sono poveri o incoerenti, genera un testo neutro e prudente.
Rispondi SOLO con il testo del messaggio, senza spiegazioni o meta-commenti.`;

// ═══════════════════════════════════════════════════════════════
// DEFAULT TEMPLATE
// ═══════════════════════════════════════════════════════════════

const DEFAULT_TEMPLATE = `🔥 **{title}**

💰 **€{currentPrice}** ~~€{originalPrice}~~ (-{discountPercent}%)
{ratingLine}
👉 {affiliateUrl}

_Prezzo soggetto a variazioni. Verifica su Amazon._`;

// ═══════════════════════════════════════════════════════════════
// SERVICE CLASS
// ═══════════════════════════════════════════════════════════════

export class LLMCopyService {
  private openai: OpenAI | null = null;
  private redis: Redis;
  private isEnabled: boolean = false;

  constructor(redis: Redis) {
    this.redis = redis;

    // Initialize OpenAI only if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.isEnabled = true;
      console.log('[LLMCopyService] Initialized with OpenAI');
    } else {
      console.warn('[LLMCopyService] OPENAI_API_KEY not set - LLM mode disabled');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN ENTRY POINT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Generate copy for a deal based on rule configuration
   */
  async generateCopy(
    deal: DealCopyPayload,
    config: LLMCopyConfig
  ): Promise<CopyGenerationResult> {
    // Template mode - always use template
    if (config.copyMode === 'TEMPLATE') {
      return {
        text: this.applyTemplate(deal, config.messageTemplate || DEFAULT_TEMPLATE),
        source: 'TEMPLATE',
        generatedAt: new Date()
      };
    }

    // LLM mode - check prerequisites
    if (!this.isEnabled || !this.openai) {
      console.warn('[LLMCopyService] LLM disabled, falling back to template');
      return {
        text: this.applyTemplate(deal, config.messageTemplate || DEFAULT_TEMPLATE),
        source: 'LLM_FALLBACK_TEMPLATE',
        generatedAt: new Date()
      };
    }

    // Check cache first
    const cacheKey = this.buildCacheKey(deal, config);
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return {
        text: cached,
        source: 'LLM_CACHE',
        generatedAt: new Date()
      };
    }

    // Check daily rate limit
    const canGenerate = await this.checkRateLimit(config.ruleId);
    if (!canGenerate) {
      console.warn(`[LLMCopyService] Rate limit reached for rule ${config.ruleId}`);
      return {
        text: this.applyTemplate(deal, config.messageTemplate || DEFAULT_TEMPLATE),
        source: 'LLM_FALLBACK_TEMPLATE',
        generatedAt: new Date()
      };
    }

    // Generate with LLM
    try {
      const result = await this.generateWithLLM(deal, config);

      // Cache the result
      await this.saveToCache(cacheKey, result.text);

      // Increment rate limit counter
      await this.incrementRateLimit(config.ruleId);

      return result;
    } catch (error) {
      console.error('[LLMCopyService] LLM generation failed:', error);
      return {
        text: this.applyTemplate(deal, config.messageTemplate || DEFAULT_TEMPLATE),
        source: 'LLM_FALLBACK_TEMPLATE',
        generatedAt: new Date()
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // LLM GENERATION
  // ═══════════════════════════════════════════════════════════════

  private async generateWithLLM(
    deal: DealCopyPayload,
    config: LLMCopyConfig
  ): Promise<CopyGenerationResult> {
    const userContent = this.buildUserContent(deal, config.customStylePrompt);

    const response = await this.openai!.chat.completions.create({
      model: config.llmModel || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: DEVELOPER_PROMPT },
        { role: 'user', content: userContent }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const text = response.choices[0]?.message?.content?.trim() || '';

    if (!text) {
      throw new Error('Empty response from LLM');
    }

    // Post-process: add affiliate link if not present
    const finalText = text.includes(deal.affiliateUrl)
      ? text
      : `${text}\n\n👉 ${deal.affiliateUrl}`;

    return {
      text: finalText,
      source: 'LLM',
      tokensUsed: response.usage?.total_tokens,
      generatedAt: new Date()
    };
  }

  private buildUserContent(deal: DealCopyPayload, customStyle?: string | null): string {
    const lines: string[] = [];

    if (customStyle) {
      lines.push(`STILE RICHIESTO DALL'UTENTE (seguilo senza stravolgere i dati):`);
      lines.push(customStyle);
      lines.push('');
    }

    lines.push('DATI OFFERTA (usa SOLO questi, non inventare nulla):');
    lines.push('');
    lines.push(`- Titolo: ${deal.title}`);
    lines.push(`- ASIN: ${deal.asin}`);
    lines.push(`- Categoria: ${deal.category}`);
    lines.push(`- Prezzo attuale: €${deal.currentPrice.toFixed(2)}`);
    lines.push(`- Prezzo precedente: €${deal.originalPrice.toFixed(2)}`);
    lines.push(`- Sconto: ${deal.discountPercent}%`);

    if (deal.rating !== undefined && deal.rating !== null) {
      lines.push(`- Rating: ${deal.rating.toFixed(1)}/5`);
    }
    if (deal.reviewCount !== undefined && deal.reviewCount !== null) {
      lines.push(`- Recensioni: ${deal.reviewCount.toLocaleString('it-IT')}`);
    }

    lines.push(`- Minimo storico: ${deal.isHistoricalLow ? 'SÌ' : 'NO'}`);
    lines.push(`- Sconto visibile su Amazon: ${deal.hasVisibleDiscount ? 'SÌ' : 'NO'}`);
    lines.push('');
    lines.push('Genera ora il testo del post seguendo le regole indicate.');

    return lines.join('\n');
  }

  // ═══════════════════════════════════════════════════════════════
  // TEMPLATE ENGINE
  // ═══════════════════════════════════════════════════════════════

  applyTemplate(deal: DealCopyPayload, template: string): string {
    // Build rating line
    let ratingLine = '';
    if (deal.rating !== undefined && deal.rating !== null) {
      const stars = '⭐'.repeat(Math.min(5, Math.round(deal.rating)));
      ratingLine = `${stars} ${deal.rating.toFixed(1)}/5`;
      if (deal.reviewCount) {
        ratingLine += ` (${deal.reviewCount.toLocaleString('it-IT')} recensioni)`;
      }
    }

    // Replace placeholders
    return template
      .replace(/{title}/g, deal.title)
      .replace(/{asin}/g, deal.asin)
      .replace(/{currentPrice}/g, deal.currentPrice.toFixed(2))
      .replace(/{originalPrice}/g, deal.originalPrice.toFixed(2))
      .replace(/{discountPercent}/g, String(deal.discountPercent))
      .replace(/{category}/g, deal.category)
      .replace(/{rating}/g, deal.rating?.toFixed(1) || 'N/D')
      .replace(/{reviewCount}/g, deal.reviewCount?.toLocaleString('it-IT') || 'N/D')
      .replace(/{affiliateUrl}/g, deal.affiliateUrl)
      .replace(/{ratingLine}/g, ratingLine)
      .replace(/{isHistoricalLow}/g, deal.isHistoricalLow ? '🏆 MINIMO STORICO' : '')
      .trim();
  }

  // ═══════════════════════════════════════════════════════════════
  // CACHING
  // ═══════════════════════════════════════════════════════════════

  private buildCacheKey(deal: DealCopyPayload, config: LLMCopyConfig): string {
    // Cache key includes price to invalidate when price changes
    const priceCents = Math.round(deal.currentPrice * 100);

    // Include style prompt hash to invalidate cache when user changes style
    // Use a simple hash to avoid very long cache keys
    const styleHash = config.customStylePrompt
      ? this.simpleHash(config.customStylePrompt)
      : 'default';

    return `llm:copy:${deal.asin}:${config.ruleId}:${priceCents}:${styleHash}`;
  }

  /**
   * Simple string hash for cache key differentiation
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private async getFromCache(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      console.error('[LLMCopyService] Cache get error:', error);
      return null;
    }
  }

  private async saveToCache(key: string, text: string): Promise<void> {
    try {
      // Cache for 24 hours
      await this.redis.set(key, text, 'EX', 60 * 60 * 24);
    } catch (error) {
      console.error('[LLMCopyService] Cache set error:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RATE LIMITING
  // ═══════════════════════════════════════════════════════════════

  private async checkRateLimit(ruleId: string): Promise<boolean> {
    try {
      const key = this.getRateLimitKey(ruleId);
      const count = await this.redis.get(key);

      // Default limit: 50 per day per rule
      const limit = 50;
      return !count || parseInt(count) < limit;
    } catch (error) {
      console.error('[LLMCopyService] Rate limit check error:', error);
      return true; // Allow on error
    }
  }

  private async incrementRateLimit(ruleId: string): Promise<void> {
    try {
      const key = this.getRateLimitKey(ruleId);
      const exists = await this.redis.exists(key);

      await this.redis.incr(key);

      if (!exists) {
        // Set expiry to end of day (UTC)
        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setUTCHours(23, 59, 59, 999);
        const ttl = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
        await this.redis.expire(key, ttl);
      }
    } catch (error) {
      console.error('[LLMCopyService] Rate limit increment error:', error);
    }
  }

  private getRateLimitKey(ruleId: string): string {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `llm:ratelimit:${ruleId}:${today}`;
  }

  // ═══════════════════════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get LLM usage stats for a rule
   */
  async getStats(ruleId: string): Promise<{
    todayCount: number;
    cacheHits: number;
  }> {
    try {
      const rateLimitKey = this.getRateLimitKey(ruleId);
      const todayCount = await this.redis.get(rateLimitKey);

      return {
        todayCount: todayCount ? parseInt(todayCount) : 0,
        cacheHits: 0 // TODO: track cache hits if needed
      };
    } catch (error) {
      return { todayCount: 0, cacheHits: 0 };
    }
  }

  /**
   * Check if LLM is available
   */
  isLLMEnabled(): boolean {
    return this.isEnabled;
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

let instance: LLMCopyService | null = null;

export function getLLMCopyService(redis: Redis): LLMCopyService {
  if (!instance) {
    instance = new LLMCopyService(redis);
  }
  return instance;
}
