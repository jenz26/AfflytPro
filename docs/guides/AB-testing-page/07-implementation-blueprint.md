# Afflyt A/B Testing Strategy - Parte 7: Implementation Blueprint

## A. Architettura Tecnica Consigliata

### A.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AFFLYT PLATFORM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐        │
│  │   FRONTEND      │     │   API GATEWAY   │     │   AUTH SERVICE  │        │
│  │   (Next.js)     │────▶│   (FastAPI)     │────▶│   (NextAuth)    │        │
│  │                 │     │                 │     │                 │        │
│  └─────────────────┘     └────────┬────────┘     └─────────────────┘        │
│                                   │                                          │
│                                   ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         CORE SERVICES                                  │  │
│  │                                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   Copy      │  │   AB Test   │  │   Keepa     │  │  Telegram   │  │  │
│  │  │  Optimizer  │  │   Manager   │  │   Client    │  │  Publisher  │  │  │
│  │  │   Engine    │  │             │  │             │  │             │  │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │  │
│  │         │                │                │                │          │  │
│  │         └────────────────┼────────────────┼────────────────┘          │  │
│  │                          │                │                            │  │
│  │                          ▼                ▼                            │  │
│  │              ┌─────────────────────────────────────┐                  │  │
│  │              │         MESSAGE QUEUE               │                  │  │
│  │              │         (Redis/BullMQ)              │                  │  │
│  │              └─────────────────────────────────────┘                  │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                   │                                          │
│                                   ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         DATA LAYER                                     │  │
│  │                                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │  │
│  │  │  PostgreSQL │  │    Redis    │  │   S3/Minio  │                   │  │
│  │  │  (Primary)  │  │   (Cache)   │  │   (Assets)  │                   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                   │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

EXTERNAL INTEGRATIONS:
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Keepa     │  │  Telegram   │  │   OpenAI/   │  │   Amazon    │
│    API      │  │   Bot API   │  │  Anthropic  │  │  Affiliate  │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### A.2 Component Details

#### Copy Optimizer Engine
```
Responsabilità:
- Gestione Copy Bank (CRUD templates)
- Selezione template (epsilon-greedy)
- Generazione copy via LLM
- Tracking performance
- Leaderboard calculation

Dipendenze:
- PostgreSQL (templates, stats)
- Redis (cache template performance)
- LLM Client (copy generation)
```

#### AB Test Manager
```
Responsabilità:
- Creazione/gestione test
- Assegnazione varianti ai post
- Calcolo significatività statistica
- Early stopping detection
- Notifiche risultati

Dipendenze:
- Copy Optimizer Engine
- PostgreSQL (test state)
- Event system (notifications)
```

#### Telegram Publisher
```
Responsabilità:
- Rate limiting
- Duplicate detection
- Post scheduling
- Click tracking (redirect)
- Views fetching

Dipendenze:
- Telegram Bot API
- Redis (rate limits, dedup)
- PostgreSQL (post history)
```

### A.3 Data Flow

```
1. DEAL INGESTION
   Keepa API → Filter → Deal Queue → PostgreSQL

2. COPY GENERATION
   Deal → Copy Optimizer → Template Selection → LLM → Validation → Ready Queue

3. PUBLISHING
   Ready Queue → Rate Limiter → Telegram API → Post Record → Tracking Setup

4. TRACKING
   User Click → Redirect Service → Amazon → Record Click → Update Stats

5. ANALYSIS
   Hourly Job → Fetch Views → Calculate CTR → Update Template Stats → Check Tests
```

---

## B. Schema Database Suggerito

### B.1 Core Tables

```sql
-- ============================================
-- COPY TEMPLATES
-- ============================================
CREATE TABLE copy_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Style parameters
    tone VARCHAR(50) NOT NULL,  -- 'urgente', 'informativo', 'casual', 'benefit_first'
    emoji_level INTEGER NOT NULL DEFAULT 1 CHECK (emoji_level BETWEEN 0 AND 3),
    structure VARCHAR(50) NOT NULL,  -- 'price_first', 'product_first', etc.
    cta_style VARCHAR(50) NOT NULL DEFAULT 'soft',
    length_target VARCHAR(20) NOT NULL DEFAULT 'medium',
    
    -- LLM configuration
    prompt_template TEXT NOT NULL,
    model_id VARCHAR(50) DEFAULT 'gpt-4o-mini',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance stats per template per category
CREATE TABLE template_stats (
    template_id UUID REFERENCES copy_templates(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    
    -- Aggregated stats
    total_views BIGINT DEFAULT 0,
    total_clicks BIGINT DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    
    -- Computed (updated by trigger/job)
    ctr DECIMAL(8,6) GENERATED ALWAYS AS (
        CASE WHEN total_views > 0 
        THEN total_clicks::DECIMAL / total_views 
        ELSE 0 END
    ) STORED,
    
    -- Time-windowed stats
    views_7d BIGINT DEFAULT 0,
    clicks_7d BIGINT DEFAULT 0,
    views_30d BIGINT DEFAULT 0,
    clicks_30d BIGINT DEFAULT 0,
    
    -- Audit
    last_used_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (template_id, category)
);

CREATE INDEX idx_template_stats_ctr ON template_stats(category, ctr DESC);


-- ============================================
-- A/B TESTS
-- ============================================
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Context
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    -- Test definition
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),  -- NULL = all categories
    
    -- Variants
    control_template_id UUID REFERENCES copy_templates(id),
    treatment_template_id UUID REFERENCES copy_templates(id),
    
    -- Configuration
    target_samples INTEGER NOT NULL DEFAULT 1000,
    confidence_threshold DECIMAL(4,3) DEFAULT 0.95,
    min_duration_days INTEGER DEFAULT 7,
    max_duration_days INTEGER DEFAULT 30,
    enable_early_stopping BOOLEAN DEFAULT true,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    -- 'draft', 'running', 'paused', 'completed', 'stopped_early', 'failed'
    
    -- Timing
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    -- Results (populated on completion)
    winner_template_id UUID REFERENCES copy_templates(id),
    final_lift DECIMAL(8,4),
    final_p_value DECIMAL(10,8),
    final_confidence DECIMAL(5,4),
    stop_reason VARCHAR(100),
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ab_tests_channel_status ON ab_tests(channel_id, status);
CREATE INDEX idx_ab_tests_running ON ab_tests(status) WHERE status = 'running';


-- Test variants data (updated in real-time)
CREATE TABLE ab_test_variants (
    test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
    variant_type VARCHAR(10) NOT NULL,  -- 'control' or 'treatment'
    template_id UUID REFERENCES copy_templates(id),
    
    -- Accumulated stats
    total_views BIGINT DEFAULT 0,
    total_clicks BIGINT DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    
    -- Computed
    ctr DECIMAL(8,6) GENERATED ALWAYS AS (
        CASE WHEN total_views > 0 
        THEN total_clicks::DECIMAL / total_views 
        ELSE 0 END
    ) STORED,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (test_id, variant_type)
);


-- ============================================
-- POSTS (with A/B test assignment)
-- ============================================
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Context
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id),
    
    -- Content
    copy_text TEXT NOT NULL,
    template_id UUID REFERENCES copy_templates(id),
    
    -- Telegram data
    telegram_message_id BIGINT,
    telegram_chat_id BIGINT,
    
    -- A/B Test assignment
    ab_test_id UUID REFERENCES ab_tests(id),
    ab_variant VARCHAR(10),  -- 'control', 'treatment', NULL if no test
    
    -- Performance
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr DECIMAL(8,6) GENERATED ALWAYS AS (
        CASE WHEN views > 0 
        THEN clicks::DECIMAL / views 
        ELSE 0 END
    ) STORED,
    
    -- Metadata
    category VARCHAR(100),
    deal_price DECIMAL(10,2),
    deal_discount INTEGER,
    
    -- Timing
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    views_fetched_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'scheduled', 'published', 'failed', 'deleted'
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_channel_date ON posts(channel_id, published_at DESC);
CREATE INDEX idx_posts_template ON posts(template_id, published_at DESC);
CREATE INDEX idx_posts_ab_test ON posts(ab_test_id) WHERE ab_test_id IS NOT NULL;
CREATE INDEX idx_posts_views_pending ON posts(channel_id, published_at) 
    WHERE views_fetched_at IS NULL AND status = 'published';


-- ============================================
-- CLICK TRACKING
-- ============================================
CREATE TABLE clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id),
    
    -- Click data
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Attribution
    source VARCHAR(50),  -- 'telegram', 'web', etc.
    
    -- Analytics (optional)
    ip_hash VARCHAR(64),  -- Hashed for privacy
    user_agent_hash VARCHAR(64),
    
    -- De-duplication
    fingerprint VARCHAR(128)  -- For duplicate click detection
);

CREATE INDEX idx_clicks_post ON clicks(post_id);
CREATE INDEX idx_clicks_time ON clicks(clicked_at);
CREATE UNIQUE INDEX idx_clicks_dedup ON clicks(post_id, fingerprint);


-- ============================================
-- ANALYTICS AGGREGATES
-- ============================================
CREATE TABLE daily_stats (
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Volume
    posts_count INTEGER DEFAULT 0,
    views_total BIGINT DEFAULT 0,
    clicks_total BIGINT DEFAULT 0,
    
    -- Performance
    avg_ctr DECIMAL(8,6),
    
    -- By category (JSONB for flexibility)
    category_stats JSONB DEFAULT '{}',
    
    -- By template
    template_stats JSONB DEFAULT '{}',
    
    -- Computed at end of day
    computed_at TIMESTAMPTZ,
    
    PRIMARY KEY (channel_id, date)
);

CREATE INDEX idx_daily_stats_date ON daily_stats(date DESC);


-- ============================================
-- CONFIGURATION
-- ============================================
CREATE TABLE channel_ab_config (
    channel_id UUID PRIMARY KEY REFERENCES channels(id) ON DELETE CASCADE,
    
    -- Bandit settings
    epsilon DECIMAL(4,3) DEFAULT 0.20,
    epsilon_decay DECIMAL(6,5) DEFAULT 0.995,
    min_epsilon DECIMAL(4,3) DEFAULT 0.05,
    
    -- Test settings
    max_concurrent_tests INTEGER DEFAULT 1,
    default_target_samples INTEGER DEFAULT 1000,
    auto_apply_winners BOOLEAN DEFAULT false,
    
    -- Notifications
    notify_on_test_complete BOOLEAN DEFAULT true,
    notify_on_early_stop BOOLEAN DEFAULT true,
    
    -- Audit
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### B.2 Supporting Functions

```sql
-- Function: Update template stats after post tracking
CREATE OR REPLACE FUNCTION update_template_stats_on_click()
RETURNS TRIGGER AS $$
BEGIN
    -- Update template_stats
    INSERT INTO template_stats (template_id, category, total_clicks)
    SELECT p.template_id, p.category, 1
    FROM posts p WHERE p.id = NEW.post_id
    ON CONFLICT (template_id, category) 
    DO UPDATE SET 
        total_clicks = template_stats.total_clicks + 1,
        updated_at = NOW();
    
    -- Update AB test variant if applicable
    UPDATE ab_test_variants atv
    SET total_clicks = atv.total_clicks + 1,
        updated_at = NOW()
    FROM posts p
    WHERE p.id = NEW.post_id
      AND p.ab_test_id IS NOT NULL
      AND atv.test_id = p.ab_test_id
      AND atv.variant_type = p.ab_variant;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_click_stats
AFTER INSERT ON clicks
FOR EACH ROW
EXECUTE FUNCTION update_template_stats_on_click();


-- Function: Calculate AB test significance
CREATE OR REPLACE FUNCTION calculate_ab_significance(
    clicks_a BIGINT,
    views_a BIGINT,
    clicks_b BIGINT,
    views_b BIGINT
) RETURNS TABLE (
    ctr_a DECIMAL,
    ctr_b DECIMAL,
    lift_pct DECIMAL,
    z_score DECIMAL,
    p_value DECIMAL,
    is_significant BOOLEAN
) AS $$
DECLARE
    p_a DECIMAL;
    p_b DECIMAL;
    p_pool DECIMAL;
    se DECIMAL;
    z DECIMAL;
    p_val DECIMAL;
BEGIN
    -- CTR calculation
    p_a := CASE WHEN views_a > 0 THEN clicks_a::DECIMAL / views_a ELSE 0 END;
    p_b := CASE WHEN views_b > 0 THEN clicks_b::DECIMAL / views_b ELSE 0 END;
    
    -- Pooled proportion
    p_pool := CASE WHEN (views_a + views_b) > 0 
              THEN (clicks_a + clicks_b)::DECIMAL / (views_a + views_b) 
              ELSE 0 END;
    
    -- Standard error
    IF views_a > 0 AND views_b > 0 AND p_pool > 0 AND p_pool < 1 THEN
        se := SQRT(p_pool * (1 - p_pool) * (1.0/views_a + 1.0/views_b));
    ELSE
        se := 0;
    END IF;
    
    -- Z-score
    z := CASE WHEN se > 0 THEN (p_b - p_a) / se ELSE 0 END;
    
    -- P-value (approximation using normal CDF)
    -- For exact calculation, use external library
    p_val := 2 * (1 - (0.5 * (1 + SIGN(ABS(z)) * SQRT(1 - EXP(-2 * z * z / 3.14159)))));
    
    RETURN QUERY SELECT 
        p_a,
        p_b,
        CASE WHEN p_a > 0 THEN ((p_b - p_a) / p_a) * 100 ELSE 0 END,
        z,
        p_val,
        p_val < 0.05;
END;
$$ LANGUAGE plpgsql;
```

### B.3 Views for Dashboard

```sql
-- View: Template leaderboard
CREATE OR REPLACE VIEW v_template_leaderboard AS
SELECT 
    ct.id,
    ct.name,
    ct.tone,
    ct.emoji_level,
    ct.is_active,
    ts.category,
    ts.total_views,
    ts.total_clicks,
    ts.ctr,
    ts.ctr * 100 as ctr_pct,
    CASE 
        WHEN ts.total_views < 100 THEN 'very_low'
        WHEN ts.total_views < 500 THEN 'low'
        WHEN ts.total_views < 1000 THEN 'medium'
        WHEN ts.total_views < 5000 THEN 'high'
        ELSE 'very_high'
    END as confidence_level,
    ROW_NUMBER() OVER (PARTITION BY ts.category ORDER BY ts.ctr DESC) as rank_in_category
FROM copy_templates ct
JOIN template_stats ts ON ct.id = ts.template_id
WHERE ct.is_active = true;


-- View: Active test status
CREATE OR REPLACE VIEW v_active_tests AS
SELECT 
    t.id,
    t.name,
    t.channel_id,
    c.name as channel_name,
    t.category,
    t.status,
    t.started_at,
    EXTRACT(DAY FROM NOW() - t.started_at) as days_running,
    
    -- Control stats
    vc.total_views as control_views,
    vc.total_clicks as control_clicks,
    vc.ctr as control_ctr,
    
    -- Treatment stats
    vt.total_views as treatment_views,
    vt.total_clicks as treatment_clicks,
    vt.ctr as treatment_ctr,
    
    -- Progress
    ((vc.total_views + vt.total_views)::DECIMAL / (2 * t.target_samples)) * 100 as progress_pct,
    
    -- Lift
    CASE WHEN vc.ctr > 0 
         THEN ((vt.ctr - vc.ctr) / vc.ctr) * 100 
         ELSE 0 END as lift_pct,
    
    -- Significance (simplified)
    (sig).is_significant,
    (sig).p_value
    
FROM ab_tests t
JOIN channels c ON t.channel_id = c.id
LEFT JOIN ab_test_variants vc ON t.id = vc.test_id AND vc.variant_type = 'control'
LEFT JOIN ab_test_variants vt ON t.id = vt.test_id AND vt.variant_type = 'treatment'
CROSS JOIN LATERAL calculate_ab_significance(
    vc.total_clicks, vc.total_views,
    vt.total_clicks, vt.total_views
) as sig
WHERE t.status = 'running';
```

---

## C. Timeline di Sviluppo (2 Settimane)

### Week 1: Foundation

| Giorno | Task | Output |
|--------|------|--------|
| Day 1 | Setup DB schema | Migrations ready |
| Day 1 | Copy Template CRUD API | `/api/templates` endpoints |
| Day 2 | Template Stats tracking | Triggers + aggregation job |
| Day 2 | Epsilon-greedy selector | `CopyOptimizerEngine` class |
| Day 3 | LLM integration | Copy generation pipeline |
| Day 3 | Copy validation | Validator middleware |
| Day 4 | AB Test creation API | `/api/tests` endpoints |
| Day 4 | Variant assignment logic | Assignment on post publish |
| Day 5 | Click tracking update | Include test attribution |
| Day 5 | Stats update on click | Real-time variant stats |

### Week 2: Analysis + UI

| Giorno | Task | Output |
|--------|------|--------|
| Day 6 | Significance calculation | Statistical functions |
| Day 6 | Early stopping logic | Hourly check job |
| Day 7 | Dashboard API | `/api/dashboard/ab` endpoint |
| Day 7 | Leaderboard API | `/api/templates/leaderboard` |
| Day 8 | Frontend: Template management | React components |
| Day 8 | Frontend: Test creation wizard | Multi-step form |
| Day 9 | Frontend: Dashboard metrics | Stats cards + charts |
| Day 9 | Frontend: Test monitoring | Live progress view |
| Day 10 | Integration testing | E2E test suite |
| Day 10 | Documentation | API docs + user guide |

### Deliverables per Sprint

**Sprint 1 (Week 1)**:
- [ ] Database schema deployed
- [ ] Template CRUD working
- [ ] Template selection (epsilon-greedy)
- [ ] LLM copy generation
- [ ] AB Test creation
- [ ] Click tracking with test attribution

**Sprint 2 (Week 2)**:
- [ ] Statistical significance calculation
- [ ] Early stopping automation
- [ ] Dashboard API complete
- [ ] Frontend UI for templates
- [ ] Frontend UI for tests
- [ ] Documentation

---

## D. Template Copy per Creator

### D.1 Template Base Consigliati

```yaml
# Template 1: Urgente
id: tpl_urgente_v1
name: "Urgente"
description: "Tono urgente con enfasi su scarsità e tempo limitato"
tone: urgente
emoji_level: 2
structure: price_first
cta_style: scarcity
length_target: short
prompt_template: |
  Genera un post Telegram urgente per questa offerta Amazon.
  
  PRODOTTO: {product_name}
  PREZZO: {price}€ (era {original_price}€)
  SCONTO: {discount}%
  MINIMO STORICO: {is_historical_low}
  
  REGOLE:
  - Inizia con ⚡ o 🔥
  - Prezzo GRANDE in prima riga
  - Enfatizza urgenza (tempo limitato, ultimi pezzi)
  - Max 220 caratteri
  - NO frasi generiche ("imperdibile", "occasione unica")
  
  Output SOLO il testo del post.

---
# Template 2: Informativo
id: tpl_informativo_v1
name: "Informativo"
description: "Tono neutro e professionale, focus su caratteristiche"
tone: informativo
emoji_level: 0
structure: product_first
cta_style: soft
length_target: medium
prompt_template: |
  Genera un post Telegram informativo per questa offerta Amazon.
  
  PRODOTTO: {product_name}
  PREZZO: {price}€ (era {original_price}€)
  SCONTO: {discount}%
  CATEGORIA: {category}
  
  REGOLE:
  - Nessun emoji all'inizio
  - Nome prodotto prima del prezzo
  - Menziona 1-2 caratteristiche rilevanti
  - Tono oggettivo, da recensore
  - Max 280 caratteri
  
  Output SOLO il testo del post.

---
# Template 3: Casual
id: tpl_casual_v1
name: "Casual"
description: "Tono amichevole, come consiglio tra amici"
tone: casual
emoji_level: 1
structure: benefit_first
cta_style: none
length_target: medium
prompt_template: |
  Genera un post Telegram casual per questa offerta Amazon.
  
  PRODOTTO: {product_name}
  PREZZO: {price}€ (era {original_price}€)
  SCONTO: {discount}%
  
  REGOLE:
  - Scrivi come se consigliassi a un amico
  - 1 solo emoji, posizionato naturalmente
  - No linguaggio marketing
  - Puoi usare "se cercavi", "prezzo onesto", "vale la pena"
  - Max 260 caratteri
  
  Output SOLO il testo del post.

---
# Template 4: Minimo Storico
id: tpl_minimo_storico_v1
name: "Minimo Storico Focus"
description: "Specifico per deal al minimo storico, massima enfasi"
tone: urgente
emoji_level: 2
structure: price_first
cta_style: strong
length_target: short
prompt_template: |
  Genera un post Telegram per un MINIMO STORICO su Amazon.
  
  PRODOTTO: {product_name}
  PREZZO: {price}€ (era {original_price}€)
  SCONTO: {discount}%
  
  REGOLE:
  - DEVE iniziare con "📉 MINIMO STORICO" o "🏷️ MAI COSÌ BASSO"
  - Prezzo evidenziato subito dopo
  - Breve menzione del prodotto
  - Chiudi con urgenza ma senza esagerare
  - Max 200 caratteri
  
  Output SOLO il testo del post.

---
# Template 5: Premium Tech
id: tpl_premium_tech_v1
name: "Premium Tech"
description: "Per prodotti tech di fascia alta, tono aspirazionale"
tone: premium
emoji_level: 1
structure: product_first
cta_style: soft
length_target: long
prompt_template: |
  Genera un post Telegram premium per questo prodotto tech di fascia alta.
  
  PRODOTTO: {product_name}
  BRAND: {brand}
  PREZZO: {price}€ (era {original_price}€)
  SCONTO: {discount}%
  
  REGOLE:
  - Tono elegante, non urlato
  - Enfatizza qualità e brand
  - Menziona una feature distintiva
  - Prezzo presentato come "investimento" non "affare"
  - Max 300 caratteri
  
  Output SOLO il testo del post.
```

### D.2 Quick Reference per Creator

```
┌─────────────────────────────────────────────────────────────┐
│  📋 GUIDA RAPIDA AI TEMPLATE                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔥 URGENTE                                                 │
│  Quando: Flash deal, stock basso, tempo limitato           │
│  Best for: Electronics, Gaming, Home                        │
│  CTR tipico: 4-6%                                          │
│                                                             │
│  📊 INFORMATIVO                                             │
│  Quando: Deal standard, prodotti tecnici                   │
│  Best for: PC, Software, Elettrodomestici                  │
│  CTR tipico: 3-4%                                          │
│                                                             │
│  🤝 CASUAL                                                  │
│  Quando: Deal buoni ma non eccezionali                     │
│  Best for: Casa, Moda, Quotidiano                          │
│  CTR tipico: 3-5%                                          │
│                                                             │
│  📉 MINIMO STORICO                                          │
│  Quando: Prezzo più basso di sempre (verificato)           │
│  Best for: Qualsiasi categoria con storico                 │
│  CTR tipico: 5-8%                                          │
│                                                             │
│  💎 PREMIUM TECH                                            │
│  Quando: Apple, Sony, brand premium in sconto              │
│  Best for: Tech > 200€, Audio Hi-Fi, Foto                  │
│  CTR tipico: 2-4% (ma conversion alta)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## E. Dashboard KPI per Creator

### E.1 Layout Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📊 AFFLYT - Ottimizzazione Copy                      [Canale: TechDeals]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  OGGI                                                            │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│  │  │   CTR    │  │  CLICK   │  │  POST    │  │  VIEWS   │        │    │
│  │  │  4.2%    │  │  1,847   │  │   94     │  │  44,023  │        │    │
│  │  │  ▲ +12%  │  │  ▲ +23%  │  │  ▲ +5%   │  │  ▲ +18%  │        │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │  🏆 TOP PERFORMER            │  │  📈 TREND CTR (7 GIORNI)        │  │
│  │                              │  │                                  │  │
│  │  1. 🔥 Urgente     5.3%     │  │  5%│    ╱╲                      │  │
│  │     ████████████████░ 89%   │  │  4%│   ╱  ╲    ╱╲              │  │
│  │                              │  │  3%│╲╱      ╲╱  ╲╱            │  │
│  │  2. 🤝 Casual      4.8%     │  │  2%│                            │  │
│  │     ███████████████░░ 78%   │  │    └──────────────────────────  │  │
│  │                              │  │     L  M  M  G  V  S  D        │  │
│  │  3. 📉 Min.Storico 4.5%     │  │                                  │  │
│  │     ██████████████░░░ 72%   │  │  Media: 4.1%  Target: 4.5%      │  │
│  │                              │  │                                  │  │
│  └─────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  ⚡ TEST ATTIVI                                                   │    │
│  │                                                                    │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │  "Urgente vs Casual - Tech"                               │  │    │
│  │  │                                                            │  │    │
│  │  │  Progresso: ████████████░░░░░░░░ 62%                      │  │    │
│  │  │                                                            │  │    │
│  │  │  ┌─────────────┐      ┌─────────────┐                     │  │    │
│  │  │  │  CONTROLLO  │      │ TRATTAMENTO │                     │  │    │
│  │  │  │  Urgente    │  VS  │   Casual    │                     │  │    │
│  │  │  │  CTR: 5.1%  │      │  CTR: 4.6%  │                     │  │    │
│  │  │  │  Posts: 156 │      │  Posts: 148 │                     │  │    │
│  │  │  └─────────────┘      └─────────────┘                     │  │    │
│  │  │                                                            │  │    │
│  │  │  Leader: Urgente (+10.9%)  |  Confidenza: 78%             │  │    │
│  │  │  Tempo stimato: ~5 giorni  |  [Dettagli] [Stop Test]      │  │    │
│  │  │                                                            │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                    │    │
│  │  [+ Nuovo Test A/B]                                               │    │
│  │                                                                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  💡 RACCOMANDAZIONI                                               │    │
│  │                                                                    │    │
│  │  • Il template "Informativo" ha CTR 35% sotto media. Considera   │    │
│  │    di disattivarlo o testare una variante migliorata.            │    │
│  │                                                                    │    │
│  │  • I post delle 19:00-21:00 hanno CTR +25% sopra media.          │    │
│  │    Considera di concentrare i deal migliori in questa fascia.    │    │
│  │                                                                    │    │
│  │  • Il test attuale raggiungerà significatività in ~5 giorni.     │    │
│  │    Non avviare nuovi test fino alla conclusione.                 │    │
│  │                                                                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  [📋 Gestisci Template]  [📊 Report Completo]  [⚙️ Impostazioni]       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### E.2 API Response Schema

```typescript
// GET /api/dashboard/ab
interface ABDashboardResponse {
  // Today's metrics
  today: {
    ctr: number;
    ctrDelta: number; // vs yesterday
    clicks: number;
    clicksDelta: number;
    posts: number;
    views: number;
  };
  
  // Template performance
  templates: {
    top: Array<{
      id: string;
      name: string;
      ctr: number;
      confidenceScore: number; // 0-100
      postCount: number;
    }>;
    worst: Array<{
      id: string;
      name: string;
      ctr: number;
      recommendation: string;
    }>;
  };
  
  // Active tests
  activeTests: Array<{
    id: string;
    name: string;
    progress: number; // 0-100
    control: {
      templateName: string;
      ctr: number;
      posts: number;
    };
    treatment: {
      templateName: string;
      ctr: number;
      posts: number;
    };
    currentWinner: string | null;
    liftPct: number;
    confidence: number;
    estimatedDaysLeft: number;
  }>;
  
  // Trends
  trends: {
    ctr7d: number[];
    clicks7d: number[];
    dates: string[];
  };
  
  // Recommendations
  recommendations: Array<{
    type: 'warning' | 'info' | 'success';
    message: string;
    action?: {
      label: string;
      href: string;
    };
  }>;
  
  // System status
  system: {
    epsilon: number;
    mode: 'exploration' | 'exploitation' | 'balanced';
    lastUpdated: string;
  };
}
```

### E.3 Notification Templates

```typescript
// Email/Push notification per test completato
const TEST_COMPLETE_TEMPLATE = {
  subject: "🎯 Test A/B completato: {testName}",
  body: `
Il test "{testName}" è terminato con risultati significativi!

📊 RISULTATI:
- Vincitore: {winnerName}
- Lift: {liftPct}%
- Confidenza: {confidence}%

📈 DETTAGLI:
{controlName}: {controlCtr}% CTR ({controlPosts} post)
{treatmentName}: {treatmentCtr}% CTR ({treatmentPosts} post)

💡 PROSSIMI PASSI:
{nextStepsRecommendation}

[Vedi dettagli completi]({dashboardUrl})
  `
};

// Notification per early stopping
const EARLY_STOP_TEMPLATE = {
  subject: "⚠️ Test A/B fermato: {testName}",
  body: `
Il test "{testName}" è stato fermato automaticamente.

Motivo: {stopReason}

📊 STATO AL MOMENTO DELLO STOP:
- Progresso: {progress}%
- Leader: {currentWinner} ({liftPct}%)
- Confidenza: {confidence}%

{additionalInfo}

[Vedi dettagli]({dashboardUrl})
  `
};
```

---

## F. Checklist Go-Live

### Pre-Deploy
- [ ] Schema DB migrato
- [ ] Indici creati
- [ ] Triggers attivi
- [ ] Job scheduler configurato
- [ ] Redis cache configurata

### API
- [ ] Endpoint templates funzionante
- [ ] Endpoint tests funzionante
- [ ] Endpoint dashboard funzionante
- [ ] Rate limiting configurato
- [ ] Auth middleware attivo

### Frontend
- [ ] Template management UI
- [ ] Test creation wizard
- [ ] Dashboard metriche
- [ ] Real-time updates (WebSocket/polling)
- [ ] Mobile responsive

### Monitoring
- [ ] Logging strutturato
- [ ] Metriche Prometheus/CloudWatch
- [ ] Alert su errori critici
- [ ] Dashboard ops

### Documentation
- [ ] API documentation (OpenAPI)
- [ ] User guide per creator
- [ ] Runbook per ops
- [ ] FAQ

---

## G. Risorse Aggiuntive

### Librerie Consigliate

**Backend (Python/FastAPI)**:
- `scipy.stats` - Calcoli statistici
- `numpy` - Array operations
- `redis-py` - Cache
- `sqlalchemy` - ORM
- `openai` / `anthropic` - LLM

**Frontend (Next.js)**:
- `recharts` - Grafici
- `tanstack/react-query` - Data fetching
- `zustand` - State management
- `tailwindcss` - Styling

### Reference Papers
- "A/B Testing: A Complete Guide" - Ron Kohavi
- "Multi-Armed Bandits in Practice" - Russo et al.
- "Practical Statistics for Data Scientists" - Bruce & Bruce

---

*Fine del documento. Tutti i 7 moduli completati.*
