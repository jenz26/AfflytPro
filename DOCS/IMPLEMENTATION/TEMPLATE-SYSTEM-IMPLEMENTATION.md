# Template System Implementation Guide

**Status**: ✅ Completed
**Tasks**: 6-8 (Template Editor UI + LLM Integration)
**Date**: 2025-11-24

---

## 📋 Overview

The template system allows users to create customizable Telegram message templates with:
- **Variable placeholders** ({title}, {price}, etc.)
- **Markdown formatting** (bold, italic, strikethrough)
- **AI-powered descriptions** (PRO+ plans only)
- **Live browser preview** (Telegram-style)
- **Custom AI prompts and tones**

This eliminates hardcoded message formats and gives users full control over their Telegram posts.

---

## 🗂️ Files Created

### Frontend Components

#### 1. `apps/web/components/templates/TelegramPreview.tsx`
**Purpose**: Shows real-time preview of how the message will look in Telegram

**Features**:
- Telegram-style message bubble UI
- Markdown rendering (bold, italic, strikethrough)
- Variable substitution with sample data
- AI text preview integration
- Timestamp and read receipt display

**Props**:
```typescript
interface TelegramPreviewProps {
  template: string;           // Template with variables
  sampleData?: object;        // Sample product data
  useAI?: boolean;            // AI enabled?
  aiGeneratedText?: string;   // Generated AI description
}
```

**Usage**:
```tsx
<TelegramPreview
  template="🔥 *{title}*\n\n💰 €{price}"
  sampleData={{ title: 'Echo Dot', price: 24.99 }}
/>
```

---

#### 2. `apps/web/components/templates/TemplateEditor.tsx`
**Purpose**: Full-featured template editor with AI settings

**Features**:
- Text editor with variable insertion buttons
- AI toggle with plan-based access control
- AI tone selector (professional, enthusiastic, casual, urgent, technical)
- Custom AI prompt input
- "Generate Preview" button for testing AI
- Live Telegram preview (side-by-side layout)
- Upgrade prompts for FREE users
- Template reset functionality

**Variable Buttons**:
- {title}, {price}, {originalPrice}, {discount}
- {savings}, {rating}, {reviewCount}, {category}
- {aiDescription} (locked for FREE plan)

**AI Tones**:
| Tone | Description | Example Use Case |
|------|-------------|------------------|
| Professional | Formal, trustworthy | Business products |
| Enthusiastic | Energetic, exciting | Hot deals |
| Casual | Friendly, conversational | Lifestyle products |
| Urgent | Limited time messaging | Flash sales |
| Technical | Detailed, spec-focused | Tech products |

**Props**:
```typescript
interface TemplateEditorProps {
  initialTemplate?: string;
  initialUseAI?: boolean;
  initialAIPrompt?: string;
  initialAITone?: string;
  onSave: (data) => Promise<void>;
  userPlan: PlanType;
}
```

---

#### 3. `apps/web/app/[locale]/dashboard/settings/templates/page.tsx`
**Purpose**: Templates management page in dashboard settings

**Features**:
- List all user templates
- Create new template
- Edit existing template
- Delete template (except default)
- Set default template
- Template cards with metadata (AI enabled, tone, created date)
- Empty state with CTA

**Routes**:
```
/dashboard/settings/templates → List templates
/dashboard/settings/templates?new → Create new
/dashboard/settings/templates?id=xxx → Edit template
```

---

### Backend API

#### 4. `apps/web/app/api/ai/generate-description/route.ts`
**Purpose**: Generate AI product descriptions using OpenAI GPT-4

**Endpoint**: `POST /api/ai/generate-description`

**Request Body**:
```json
{
  "productTitle": "Apple AirPods Pro (2ª generazione)",
  "category": "Elettronica",
  "price": 189.99,
  "originalPrice": 279.00,
  "tone": "enthusiastic",
  "customPrompt": "Enfatizza la qualità audio..."
}
```

**Response**:
```json
{
  "description": "Gli AirPods Pro offrono...",
  "source": "openai",
  "model": "gpt-4o-mini"
}
```

**Fallback Behavior**:
- If `OPENAI_API_KEY` not configured → uses template-based fallback
- If API error → gracefully returns fallback description
- Never breaks user experience

**Models Used**:
- **Production**: `gpt-4o-mini` (cost-effective, fast)
- **Optional**: Can upgrade to `gpt-4` for higher quality

**Environment Variable**:
```bash
OPENAI_API_KEY=sk-...
```

---

#### 5. `apps/api/src/routes/templates.ts`
**Purpose**: CRUD API for message templates

**Endpoints**:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/user/templates` | Get all user templates | Required |
| POST | `/user/templates` | Create new template | Required |
| GET | `/user/templates/:id` | Get template by ID | Required |
| PUT | `/user/templates/:id` | Update template | Required |
| DELETE | `/user/templates/:id` | Delete template | Required |
| PUT | `/user/templates/:id/default` | Set as default | Required |

**Plan Enforcement**:
- AI features checked via `checkAIFeature()` middleware
- FREE users can't enable `useAI`
- Returns `PlanGuardError` with upgrade suggestion

**Validation**:
- Can't delete default template
- Can only access own templates (userId check)
- AI fields cleared if useAI=false

---

#### 6. `apps/api/src/app.ts` (Modified)
**Changes**:
- Added `import templatesRoutes from './routes/templates'`
- Registered route: `app.register(templatesRoutes, { prefix: '/user' })`

---

### Documentation

#### 7. `DOCS/EXAMPLES/template-editor-example.tsx`
**Purpose**: Comprehensive usage examples

**Examples Included**:
1. Full Template Editor Page
2. Standalone Preview Component
3. Fetching and Using Saved Templates
4. AI Text Generation
5. Plan-Based Feature Gating
6. Using Templates in RuleExecutor

**Reference Lists**:
- All available template variables
- AI tone options
- Default template
- Markdown formatting guide

---

## 🔄 Integration Points

### 1. Automation Rule Creation
When user creates an automation rule, they select a template:

```typescript
// In automation form
const rule = {
  name: 'My Automation',
  minScore: 85,
  categories: ['Elettronica'],
  templateId: 'template-uuid-here',  // ← Link to template
  // ...
};
```

### 2. RuleExecutor Publishing Flow
When publishing deals, use the selected template:

```typescript
// In RuleExecutor.ts (Step 5: Generate Links & Publish)

// 1. Load rule with template
const rule = await prisma.automationRule.findUnique({
  where: { id: ruleId },
  include: { template: true }
});

// 2. If AI enabled, generate description
let aiDescription = '';
if (rule.template.useAI) {
  const response = await fetch('/api/ai/generate-description', {
    method: 'POST',
    body: JSON.stringify({
      productTitle: deal.title,
      category: deal.category,
      price: deal.currentPrice,
      originalPrice: deal.originalPrice,
      tone: rule.template.aiTone,
      customPrompt: rule.template.aiPrompt,
    })
  });
  const data = await response.json();
  aiDescription = data.description;
}

// 3. Replace variables in template
let message = rule.template.template
  .replace(/\{title\}/g, deal.title)
  .replace(/\{price\}/g, deal.currentPrice.toFixed(2))
  .replace(/\{originalPrice\}/g, deal.originalPrice.toFixed(2))
  .replace(/\{discount\}/g, deal.discount.toString())
  .replace(/\{rating\}/g, deal.rating?.toString() || '0')
  .replace(/\{reviewCount\}/g, deal.reviewCount?.toLocaleString('it-IT') || '0')
  .replace(/\{savings\}/g, (deal.originalPrice - deal.currentPrice).toFixed(2))
  .replace(/\{category\}/g, deal.category)
  .replace(/\{aiDescription\}/g, aiDescription || '')
  .replace(/LINK/g, shortUrl);

// 4. Send to Telegram
await TelegramBotService.sendMessage(channelId, message, deal.imageUrl);
```

### 3. MessageFormatter Service (Deprecated)
The old `MessageFormatter.ts` service can be deprecated in favor of user templates.

**Migration Path**:
1. Create a "Classic" default template with the old format
2. Auto-assign to existing automation rules
3. Users can then customize or keep default

---

## 🎨 UI/UX Flow

### Template Management Flow
```
Dashboard → Settings → Templates
  ↓
[List Templates]
  ├─ Create New → [Editor] → Save → [List]
  ├─ Edit → [Editor] → Save → [List]
  └─ Delete → Confirm → [List]
```

### Template Editor Flow
```
[Template Editor]
  ├─ [Left Panel]
  │   ├─ Variable Buttons (click to insert)
  │   ├─ Template Textarea
  │   ├─ AI Settings
  │   │   ├─ Toggle AI (plan check)
  │   │   ├─ Tone Selector
  │   │   ├─ Custom Prompt
  │   │   └─ Generate Preview Button
  │   └─ Save Button
  │
  └─ [Right Panel]
      └─ Live Telegram Preview
          ├─ Sample data
          ├─ Markdown rendering
          └─ AI text preview
```

### Automation Rule Editor Flow
```
[Create Automation]
  ├─ Rule Settings (name, score, categories)
  ├─ [Template Selector] ← Select from user templates
  ├─ [Preview] ← See how messages will look
  └─ Save
```

---

## 🔐 Plan-Based Access Control

### Feature Matrix

| Feature | FREE | PRO | BUSINESS |
|---------|------|-----|----------|
| Custom Templates | ✅ | ✅ | ✅ |
| Variable Placeholders | ✅ | ✅ | ✅ |
| Markdown Formatting | ✅ | ✅ | ✅ |
| AI Description | ❌ | ✅ | ✅ |
| Custom AI Prompts | ❌ | ✅ | ✅ |
| Multiple Templates | ✅ | ✅ | ✅ |

### Enforcement Points

1. **Frontend** (`TemplateEditor.tsx`):
   - Disables AI toggle for FREE users
   - Shows upgrade prompt when clicking AI features
   - {aiDescription} variable button locked

2. **Backend** (`templates.ts`):
   - `checkAIFeature()` middleware on POST/PUT
   - Throws `PlanGuardError` if FREE user tries useAI=true
   - Returns upgrade suggestion

3. **API Route** (`/api/ai/generate-description`):
   - Could add auth check (currently open)
   - Consider rate limiting by plan

---

## 📊 Database Schema

Already implemented in Task 5:

```prisma
model MessageTemplate {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name      String
  template  String   @default("🔥 *{title}*\n\n💰 Prezzo: €{price} ~~€{originalPrice}~~...")

  // AI Settings
  useAI     Boolean  @default(false)
  aiPrompt  String?  // Custom prompt for LLM
  aiTone    String?  // professional, enthusiastic, casual, urgent, technical

  isDefault Boolean  @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  automationRules AutomationRule[]

  @@index([userId])
}

model AutomationRule {
  // ... existing fields

  templateId String?
  template   MessageTemplate? @relation(fields: [templateId], references: [id])
}
```

---

## 🧪 Testing Checklist

### Frontend Tests
- [ ] Variable insertion works correctly
- [ ] Preview updates in real-time
- [ ] Markdown rendering displays correctly
- [ ] AI toggle disabled for FREE users
- [ ] Upgrade prompt appears when clicking AI features
- [ ] Generate preview button calls API
- [ ] Save button validates required fields
- [ ] Reset button clears all fields

### Backend Tests
- [ ] GET /user/templates returns user's templates only
- [ ] POST /user/templates creates template
- [ ] POST with useAI=true fails for FREE users
- [ ] PUT /user/templates/:id updates correctly
- [ ] DELETE prevents deleting default template
- [ ] PUT /user/templates/:id/default unsets others
- [ ] Templates cascade delete when user deleted

### API Tests
- [ ] AI generation works with valid OPENAI_API_KEY
- [ ] Fallback works when API key missing
- [ ] Fallback works when API returns error
- [ ] Different tones produce different outputs
- [ ] Custom prompts are respected
- [ ] Response time < 3 seconds

### Integration Tests
- [ ] Create automation with template
- [ ] Publish deal using template variables
- [ ] AI description generated for PRO users
- [ ] FREE users see static template (no AI)
- [ ] Template changes reflect in next publish

---

## 🚀 Deployment Checklist

1. **Environment Variables**:
   ```bash
   # Required
   ENCRYPTION_SECRET=...
   JWT_SECRET=...

   # Optional (for AI features)
   OPENAI_API_KEY=sk-...
   ```

2. **Database Migration**:
   ```bash
   # MessageTemplate model already created in Task 5
   npx prisma generate
   npx prisma migrate deploy
   ```

3. **Frontend Build**:
   ```bash
   cd apps/web
   npm run build
   ```

4. **Backend Build**:
   ```bash
   cd apps/api
   npm run build
   ```

5. **Navigation Update** (Optional):
   Add "Templates" link to settings navigation:
   ```tsx
   <NavLink href="/dashboard/settings/templates">
     <MessageSquare className="w-5 h-5" />
     Templates
   </NavLink>
   ```

---

## 🎯 Next Steps (Future Enhancements)

### Phase 2 Features
1. **Template Marketplace**
   - Share templates with community
   - Import templates from library
   - Rate and review templates

2. **A/B Testing Templates**
   - Create template variants
   - Track performance metrics
   - Auto-select best performer

3. **Advanced AI Features**
   - Multi-language support
   - Image generation for thumbnails
   - Emoji optimization

4. **Template Analytics**
   - Click-through rate by template
   - Conversion tracking
   - Best performing variables

5. **Template Variables++**
   - Conditional blocks: `{if discount>30}🔥{/if}`
   - Date/time formatting: `{now|format:HH:mm}`
   - Math operations: `{price*0.9}`

---

## 📖 Usage Documentation

### For Users

**Creating a Template**:
1. Go to Dashboard → Settings → Templates
2. Click "Nuovo Template"
3. Insert variables using buttons
4. Enable AI if PRO+ (optional)
5. Preview your message
6. Click "Salva Template"

**Using AI Copy**:
1. Enable AI toggle (PRO+ only)
2. Select tone (enthusiastic, professional, etc.)
3. Add custom prompt (optional)
4. Click "Genera Anteprima AI" to test
5. Insert {aiDescription} in template where you want AI text

**Linking to Automation**:
1. Create/edit automation rule
2. Select template from dropdown
3. Preview will show how messages will look
4. Save automation

### For Developers

See `DOCS/EXAMPLES/template-editor-example.tsx` for:
- Component usage examples
- API integration patterns
- Plan-based feature gating
- RuleExecutor integration

---

## 🔧 Troubleshooting

### Issue: AI generation returns fallback
**Cause**: OPENAI_API_KEY not configured
**Solution**: Add API key to `.env`

### Issue: FREE users can enable AI
**Cause**: Missing plan check middleware
**Solution**: Ensure `checkAIFeature()` in route preHandler

### Issue: Variables not replaced in message
**Cause**: Case mismatch or typo in variable name
**Solution**: Use exact variable names: `{title}`, `{price}`, etc.

### Issue: Preview doesn't update
**Cause**: React state not re-rendering
**Solution**: Check textarea value is controlled by state

### Issue: Can't delete default template
**Expected**: Default template is protected
**Solution**: Set another template as default first

---

## ✅ Completion Status

**Tasks 6-8 Implementation**:
- ✅ Task 6: Template Editor UI with variable placeholders
- ✅ Task 7: Telegram Preview Component
- ✅ Task 8: LLM Integration API

**Files Created**: 7
**Lines of Code**: ~2,500
**Components**: 2 (TelegramPreview, TemplateEditor)
**API Routes**: 2 (/user/templates/*, /api/ai/generate-description)
**Pages**: 1 (Templates management)
**Examples**: 1 (Comprehensive usage guide)

**Status**: ✅ Ready for testing and deployment

---

## 📞 Support

For implementation questions or issues:
1. Check `DOCS/EXAMPLES/template-editor-example.tsx`
2. Review this implementation guide
3. Test with sample data before production
4. Monitor OpenAI API usage and costs

---

**Last Updated**: 2025-11-24
**Implementation By**: Claude Code
**Review Status**: Pending user testing
