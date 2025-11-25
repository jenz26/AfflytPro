import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Description Generator Route
 *
 * Generates compelling product descriptions using LLM (OpenAI GPT-4 or similar)
 *
 * POST /api/ai/generate-description
 * Body: {
 *   productTitle: string;
 *   category: string;
 *   price: number;
 *   originalPrice: number;
 *   customPrompt?: string;
 *   tone?: 'professional' | 'enthusiastic' | 'casual' | 'urgent' | 'technical';
 * }
 */

type ToneType = 'professional' | 'enthusiastic' | 'casual' | 'urgent' | 'technical';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productTitle,
      category,
      price,
      originalPrice,
      customPrompt,
    } = body;
    const tone: ToneType = body.tone || 'enthusiastic';

    // Validate required fields
    if (!productTitle || !category) {
      return NextResponse.json(
        { error: 'productTitle and category are required' },
        { status: 400 }
      );
    }

    // Check for API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.warn('⚠️  OPENAI_API_KEY not configured. Using fallback description.');
      return NextResponse.json({
        description: generateFallbackDescription(productTitle, category, tone),
        source: 'fallback',
      });
    }

    // Build system prompt based on tone
    const toneInstructions: Record<ToneType, string> = {
      professional: 'Scrivi in modo professionale e affidabile, usando un linguaggio formale ma accessibile.',
      enthusiastic: 'Scrivi in modo entusiasta ed energico, trasmettendo eccitazione per il prodotto.',
      casual: 'Scrivi in modo informale e amichevole, come parlando con un amico.',
      urgent: 'Scrivi con urgenza, enfatizzando l\'opportunità limitata e il valore dell\'offerta.',
      technical: 'Scrivi in modo tecnico e dettagliato, enfatizzando specifiche e caratteristiche.',
    };

    const selectedToneInstruction = toneInstructions[tone];

    const systemPrompt = `Sei un esperto copywriter per e-commerce specializzato in deal Amazon.
${selectedToneInstruction}

Scrivi descrizioni brevi (2-3 frasi, max 150 caratteri) che:
- Evidenziano i benefici chiave del prodotto
- Sono persuasive senza essere aggressive
- Usano un linguaggio naturale italiano
- Non ripetono il titolo completo
- Non menzionano prezzi o sconti (vengono già mostrati)`;

    const userPrompt = customPrompt
      ? `${customPrompt}\n\nProdotto: ${productTitle}\nCategoria: ${category}`
      : `Scrivi una descrizione accattivante per questo prodotto Amazon:\n\nTitolo: ${productTitle}\nCategoria: ${category}`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective model, can be changed to gpt-4 for better quality
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 150,
        temperature: 0.8,
        presence_penalty: 0.3,
        frequency_penalty: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);

      // Fallback on API error
      return NextResponse.json({
        description: generateFallbackDescription(productTitle, category, tone),
        source: 'fallback',
        warning: 'API error, using fallback',
      });
    }

    const data = await response.json();
    const description = data.choices[0]?.message?.content?.trim();

    if (!description) {
      throw new Error('No description generated');
    }

    return NextResponse.json({
      description,
      source: 'openai',
      model: 'gpt-4o-mini',
    });

  } catch (error: any) {
    console.error('AI generation error:', error);

    // Return fallback instead of error to ensure UX doesn't break
    try {
      const body = await request.json();
      const tone: ToneType = body.tone || 'enthusiastic';
      return NextResponse.json({
        description: generateFallbackDescription(body.productTitle, body.category, tone),
        source: 'fallback',
        error: error.message,
      });
    } catch {
      // If we can't even parse the request, return a generic error
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
  }
}

/**
 * Fallback description generator (no AI required)
 * Used when OpenAI API is not configured or fails
 */
function generateFallbackDescription(
  productTitle: string,
  category: string,
  tone: ToneType
): string {
  // Extract key words from title (remove common filler words)
  const fillerWords = ['il', 'la', 'i', 'le', 'di', 'da', 'con', 'per', 'in', 'su', 'a', 'e'];
  const keywords = productTitle
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 3 && !fillerWords.includes(word))
    .slice(0, 3)
    .join(', ');

  const templates = {
    professional: [
      `Prodotto di qualità nella categoria ${category}. Eccellente rapporto qualità-prezzo.`,
      `Soluzione affidabile per ${category}. Alta qualità e prestazioni garantite.`,
      `Scelta ideale per chi cerca ${keywords}. Prodotto professionale e durevole.`,
    ],
    enthusiastic: [
      `🎯 Occasione imperdibile! ${category} di altissima qualità a prezzo shock!`,
      `🔥 WOW! Questo è il momento perfetto per acquistare. Non lasciarti sfuggire questa offerta!`,
      `⚡ Incredibile! ${category} premium con uno sconto straordinario. Affrettati!`,
    ],
    casual: [
      `Hey! Questo prodotto è davvero figo. Ottimo per ${category}, lo consiglio!`,
      `Un must-have per chi ama ${keywords}. Super rapporto qualità-prezzo 👌`,
      `Prodotto top nella categoria ${category}. Vale assolutamente la pena!`,
    ],
    urgent: [
      `⏰ OFFERTA LAMPO! Scorte limitate. Agisci ora o rimpiangerai questa occasione!`,
      `🚨 ULTIMI PEZZI! ${category} premium a prezzo mai visto. Non aspettare!`,
      `⚡ SOLO OGGI! Risparmia su questo ${category}. Disponibilità limitata!`,
    ],
    technical: [
      `Specifiche tecniche di alto livello. Prestazioni ottimali nella categoria ${category}.`,
      `Caratteristiche avanzate e design funzionale. Ideale per utilizzo professionale.`,
      `Tecnologia all'avanguardia per ${category}. Materiali premium e costruzione robusta.`,
    ],
  };

  const toneTemplates = templates[tone];
  return toneTemplates[Math.floor(Math.random() * toneTemplates.length)];
}
