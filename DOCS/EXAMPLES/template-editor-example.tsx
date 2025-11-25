/**
 * Example: How to use the Template Editor System
 *
 * This file demonstrates how to integrate the message template editor
 * into your application for customizing Telegram messages.
 */

import { TemplateEditor } from '@/components/templates/TemplateEditor';
import { TelegramPreview } from '@/components/templates/TelegramPreview';
import { PlanType } from '@/components/dashboard/PlanBadge';

// ==================== EXAMPLE 1: Full Template Editor Page ====================

export function TemplateSettingsPage() {
  const handleSave = async (data: {
    template: string;
    useAI: boolean;
    aiPrompt?: string;
    aiTone?: string;
  }) => {
    // Save to API
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'My Custom Template',
        ...data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save template');
    }

    console.log('Template saved successfully!');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-6">
        Personalizza i tuoi Messaggi
      </h1>

      <TemplateEditor
        // Optional: provide initial template
        initialTemplate={`🔥 *{title}*\n\n💰 €{price} ~~€{originalPrice}~~\n💸 Risparmi: €{savings} (-{discount}%)\n\n{aiDescription}\n\n👉 [Vedi offerta](LINK)`}
        initialUseAI={false}
        initialAIPrompt=""
        initialAITone="enthusiastic"
        onSave={handleSave}
        userPlan="PRO" // Pass actual user plan from your auth system
      />
    </div>
  );
}

// ==================== EXAMPLE 2: Standalone Preview Component ====================

export function MessagePreviewExample() {
  const customTemplate = `
🔥 *OFFERTA IMPERDIBILE!*

{title}

💰 Prezzo: €{price} ~~€{originalPrice}~~
💸 Risparmio: €{savings} (-{discount}%)
⭐ {rating}/5 ({reviewCount} recensioni)

{aiDescription}

👉 [Acquista ora](LINK)

_#Ad | Powered by Afflyt Pro_
  `.trim();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <TelegramPreview
        template={customTemplate}
        sampleData={{
          title: 'Apple AirPods Pro (2ª generazione)',
          price: 189.99,
          originalPrice: 279.00,
          discount: 32,
          rating: 4.8,
          reviewCount: 15234,
          savings: 89.01,
          category: 'Elettronica',
        }}
        useAI={true}
        aiGeneratedText="Gli AirPods Pro di seconda generazione offrono cancellazione attiva del rumore migliorata e audio spaziale personalizzato. Qualità Apple al miglior prezzo!"
      />
    </div>
  );
}

// ==================== EXAMPLE 3: Fetching and Using Saved Templates ====================

export function AutomationRuleEditor() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    // Fetch user's templates
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates || []));
  }, []);

  const handleSaveAutomation = async () => {
    // When creating/editing automation rule, reference the template
    await fetch('/api/automation/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'My Automation',
        minScore: 85,
        categories: '["Elettronica"]',
        // Link the template
        templateId: selectedTemplateId,
        // ... other automation settings
      }),
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Template Messaggio</h2>

      {/* Template Selector */}
      <select
        value={selectedTemplateId || ''}
        onChange={(e) => setSelectedTemplateId(e.target.value)}
        className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-700"
      >
        <option value="">Seleziona un template...</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name} {template.isDefault ? '(Default)' : ''}
          </option>
        ))}
      </select>

      {/* Preview the selected template */}
      {selectedTemplateId && (
        <TelegramPreview
          template={templates.find((t) => t.id === selectedTemplateId)?.template || ''}
          useAI={templates.find((t) => t.id === selectedTemplateId)?.useAI || false}
        />
      )}

      <button onClick={handleSaveAutomation}>Save Automation</button>
    </div>
  );
}

// ==================== EXAMPLE 4: AI Text Generation ====================

export function AITextGenerationExample() {
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTitle: 'Apple AirPods Pro (2ª generazione)',
          category: 'Elettronica',
          price: 189.99,
          originalPrice: 279.00,
          tone: 'enthusiastic',
          customPrompt: 'Enfatizza la qualità audio e la cancellazione del rumore',
        }),
      });

      const data = await response.json();
      setGeneratedText(data.description);
    } catch (error) {
      console.error('Failed to generate text:', error);
      alert('Errore nella generazione del testo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="px-4 py-2 bg-purple-500 text-white rounded-lg"
      >
        {isLoading ? 'Generazione...' : 'Genera Descrizione AI'}
      </button>

      {generatedText && (
        <div className="bg-gray-900 text-white p-4 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">Testo generato:</p>
          <p>{generatedText}</p>
        </div>
      )}
    </div>
  );
}

// ==================== EXAMPLE 5: Plan-Based Feature Gating ====================

export function TemplateEditorWithPlanCheck() {
  const [userPlan, setUserPlan] = useState<PlanType>('FREE');

  // Fetch user plan
  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => setUserPlan(data.plan || 'FREE'));
  }, []);

  const canUseAI = userPlan === 'PRO' || userPlan === 'BUSINESS';

  return (
    <div>
      {/* Plan Badge */}
      <div className="mb-4">
        <PlanBadge plan={userPlan} />
      </div>

      {/* Show upgrade message if FREE */}
      {!canUseAI && (
        <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <p className="text-white font-bold mb-1">
            🔒 AI Copy Generator disponibile dal piano PRO
          </p>
          <p className="text-sm text-gray-400 mb-3">
            Genera descrizioni uniche per ogni prodotto con l'intelligenza artificiale.
          </p>
          <a
            href="/settings/subscription"
            className="inline-block px-4 py-2 bg-purple-500 text-white rounded-lg"
          >
            Upgrade al Piano PRO
          </a>
        </div>
      )}

      {/* Template Editor */}
      <TemplateEditor
        onSave={async (data) => {
          // AI will be automatically disabled if plan doesn't support it
          await fetch('/api/templates', {
            method: 'POST',
            body: JSON.stringify(data),
          });
        }}
        userPlan={userPlan}
      />
    </div>
  );
}

// ==================== EXAMPLE 6: Using Templates in RuleExecutor ====================

/**
 * This shows how the RuleExecutor service would use templates when publishing deals
 */
export async function publishDealWithTemplate(
  deal: any,
  ruleId: string,
  userId: string
) {
  // 1. Get the automation rule with its template
  const rule = await prisma.automationRule.findUnique({
    where: { id: ruleId },
    include: {
      template: true, // Include the MessageTemplate
    },
  });

  if (!rule || !rule.template) {
    throw new Error('Rule or template not found');
  }

  const template = rule.template;

  // 2. If AI is enabled, generate description
  let aiDescription = '';
  if (template.useAI) {
    const aiResponse = await fetch('http://localhost:3000/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productTitle: deal.title,
        category: deal.category,
        price: deal.currentPrice,
        originalPrice: deal.originalPrice,
        tone: template.aiTone || 'enthusiastic',
        customPrompt: template.aiPrompt || undefined,
      }),
    });

    const aiData = await aiResponse.json();
    aiDescription = aiData.description;
  }

  // 3. Replace variables in template
  const savings = deal.originalPrice - deal.currentPrice;
  let message = template.template
    .replace(/\{title\}/g, deal.title)
    .replace(/\{price\}/g, deal.currentPrice.toFixed(2))
    .replace(/\{originalPrice\}/g, deal.originalPrice.toFixed(2))
    .replace(/\{discount\}/g, deal.discount.toString())
    .replace(/\{rating\}/g, (deal.rating || 0).toString())
    .replace(/\{reviewCount\}/g, (deal.reviewCount || 0).toLocaleString('it-IT'))
    .replace(/\{savings\}/g, savings.toFixed(2))
    .replace(/\{category\}/g, deal.category)
    .replace(/\{aiDescription\}/g, aiDescription || '');

  // 4. Replace LINK placeholder with actual short URL
  const shortUrl = await createShortLink(deal);
  message = message.replace(/LINK/g, shortUrl);

  // 5. Send to Telegram
  await sendToTelegram(message, deal.imageUrl);

  return { success: true, message };
}

// ==================== AVAILABLE VARIABLES ====================

/**
 * TEMPLATE VARIABLES
 *
 * Basic Variables (Available to all plans):
 * - {title}         - Product title
 * - {price}         - Current price (e.g., "24.99")
 * - {originalPrice} - Original price before discount
 * - {discount}      - Discount percentage (e.g., "35")
 * - {savings}       - Amount saved in euros
 * - {rating}        - Product rating (e.g., "4.7")
 * - {reviewCount}   - Number of reviews
 * - {category}      - Product category
 *
 * AI Variables (PRO & BUSINESS only):
 * - {aiDescription} - AI-generated product description
 *
 * Special Placeholders:
 * - LINK            - Will be replaced with actual short tracking URL
 *
 * Markdown Formatting:
 * - *text*   or **text**  → Bold
 * - _text_                → Italic
 * - ~~text~~              → Strikethrough
 * - [text](url)           → Link
 */

// ==================== AI TONES ====================

/**
 * AI TONE OPTIONS
 *
 * - 'professional' → Formal, trustworthy language
 * - 'enthusiastic' → Energetic, exciting tone
 * - 'casual'       → Friendly, conversational
 * - 'urgent'       → Limited time, act now messaging
 * - 'technical'    → Detailed, spec-focused
 */

// ==================== DEFAULT TEMPLATE ====================

export const DEFAULT_TEMPLATE = `🔥 *{title}*

💰 Prezzo: €{price} ~~€{originalPrice}~~
💸 Risparmi: €{savings} (-{discount}%)
⭐ Rating: {rating}/5 ({reviewCount} recensioni)

{aiDescription}

👉 [Vedi su Amazon](LINK)

_#Ad | Deal trovato da Afflyt Pro 🤖_`;
