# Afflyt A/B Testing Strategy - Parte 6: Soluzione Consigliata

## 1. Modello Selezionato: "Adaptive Copy Rotation"

Dopo l'analisi completa, la soluzione ottimale per Afflyt combina:

1. **Copy Bank** per gestione template
2. **A/B/C Rotation** per test iniziali
3. **Epsilon-Greedy Bandit** per ottimizzazione continua
4. **Heat Score LLM** opzionale per pre-filtering

### 1.1 Perché Questo Modello

| Requisito Afflyt | Come lo Risolviamo |
|------------------|---------------------|
| No spam | Rotazione su deal diversi |
| Compatibile Telegram | Nessun split audience |
| Scalabile | Funziona da 500 a 300k iscritti |
| Semplice per creator | Dashboard unificata |
| Token Keepa efficienti | Zero overhead |
| Statisticamente valido | P-value + early stopping |

### 1.2 Architettura High-Level

```
┌─────────────────────────────────────────────────────────────┐
│                     AFFLYT DASHBOARD                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Test Setup  │  │  Live Stats │  │  Results    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    COPY OPTIMIZER ENGINE                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Copy Bank   │  │  Bandit     │  │  Analytics  │          │
│  │ (Templates) │  │  (Selection)│  │  (Tracking) │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          ▼                                   │
│              ┌─────────────────────┐                        │
│              │   LLM Generator     │                        │
│              │   (Copy Creation)   │                        │
│              └──────────┬──────────┘                        │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    TELEGRAM PUBLISHER                        │
├─────────────────────────────────────────────────────────────┤
│  Rate Limiter → Duplicate Checker → Post → Track Clicks     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Implementazione Tecnica Dettagliata

### 2.1 Copy Optimizer Engine

```python
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import random
import math

class OptimizationMode(Enum):
    EXPLORATION = "exploration"     # Test nuovi template
    EXPLOITATION = "exploitation"   # Usa template migliori
    BALANCED = "balanced"           # Mix dei due

@dataclass
class CopyTemplate:
    """Template per generazione copy."""
    id: str
    name: str
    description: str
    
    # Style parameters
    tone: str  # "urgente", "informativo", "casual", "premium"
    emoji_level: int  # 0, 1, 2, 3
    structure: str  # "price_first", "product_first", "urgency_first", "benefit_first"
    cta_style: str  # "none", "soft", "strong", "scarcity"
    length_target: str  # "short", "medium", "long"
    
    # LLM prompt template
    prompt_template: str
    
    # Performance tracking
    stats: Dict[str, dict] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    is_active: bool = True
    
    def get_ctr(self, category: str = "_all") -> float:
        """CTR per categoria (o overall)."""
        if category not in self.stats:
            return 0.05  # Prior ottimistico
        s = self.stats[category]
        if s['views'] == 0:
            return 0.05
        return s['clicks'] / s['views']
    
    def update_stats(self, category: str, views: int, clicks: int):
        """Aggiorna statistiche."""
        if category not in self.stats:
            self.stats[category] = {'views': 0, 'clicks': 0}
        self.stats[category]['views'] += views
        self.stats[category]['clicks'] += clicks
        
        # Update overall
        if '_all' not in self.stats:
            self.stats['_all'] = {'views': 0, 'clicks': 0}
        self.stats['_all']['views'] += views
        self.stats['_all']['clicks'] += clicks


class CopyOptimizerEngine:
    """
    Engine principale per ottimizzazione copy.
    Combina Copy Bank + Bandit algorithm.
    """
    
    def __init__(
        self, 
        db,
        llm_client,
        initial_epsilon: float = 0.3,
        min_epsilon: float = 0.05,
        epsilon_decay: float = 0.995
    ):
        self.db = db
        self.llm = llm_client
        
        # Bandit parameters
        self.epsilon = initial_epsilon
        self.min_epsilon = min_epsilon
        self.epsilon_decay = epsilon_decay
        
        # Copy bank
        self.templates: Dict[str, CopyTemplate] = {}
        
        # Active tests
        self.active_tests: Dict[str, 'ABTest'] = {}
        
    def add_template(self, template: CopyTemplate):
        """Aggiunge template al bank."""
        self.templates[template.id] = template
        self._sync_to_db(template)
    
    def select_template(
        self, 
        category: str,
        mode: OptimizationMode = OptimizationMode.BALANCED,
        exclude_ids: List[str] = None
    ) -> CopyTemplate:
        """
        Seleziona template usando epsilon-greedy strategy.
        """
        available = [
            t for t in self.templates.values() 
            if t.is_active and (exclude_ids is None or t.id not in exclude_ids)
        ]
        
        if not available:
            raise ValueError("No active templates available")
        
        # Decay epsilon
        self.epsilon = max(self.min_epsilon, self.epsilon * self.epsilon_decay)
        
        # Mode override
        if mode == OptimizationMode.EXPLORATION:
            effective_epsilon = 0.8
        elif mode == OptimizationMode.EXPLOITATION:
            effective_epsilon = 0.1
        else:
            effective_epsilon = self.epsilon
        
        # Epsilon-greedy selection
        if random.random() < effective_epsilon:
            # Exploration: random selection
            return random.choice(available)
        else:
            # Exploitation: best CTR for category
            return max(available, key=lambda t: t.get_ctr(category))
    
    async def generate_copy(
        self, 
        template: CopyTemplate,
        deal: dict,
        category: str
    ) -> dict:
        """
        Genera copy usando template e LLM.
        """
        prompt = template.prompt_template.format(
            product_name=deal['product_name'],
            price=deal['price'],
            original_price=deal['original_price'],
            discount=deal['discount_pct'],
            category=category,
            is_historical_low=deal.get('is_historical_low', False),
            brand=deal.get('brand', 'N/A'),
            # Style parameters
            tone=template.tone,
            emoji_level=template.emoji_level,
            cta_style=template.cta_style,
            length_target=template.length_target
        )
        
        response = await self.llm.chat.completions.create(
            model="gpt-4o-mini",  # O Claude
            messages=[
                {"role": "system", "content": self._get_system_prompt()},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        copy_text = response.choices[0].message.content.strip()
        
        return {
            'text': copy_text,
            'template_id': template.id,
            'template_name': template.name,
            'deal_id': deal['id'],
            'category': category,
            'generated_at': datetime.now().isoformat()
        }
    
    def _get_system_prompt(self) -> str:
        return """Sei un copywriter esperto per canali Telegram di offerte Amazon Italia.

REGOLE FONDAMENTALI:
- Scrivi in italiano naturale e coinvolgente
- Mai superare 280 caratteri (limite Telegram per preview ottimale)
- Includi sempre il prezzo e lo sconto
- Non inventare caratteristiche del prodotto
- Non usare frasi generiche ("offerta imperdibile", "occasione unica")

Output SOLO il testo del post, nessuna spiegazione."""
    
    def record_result(
        self, 
        post_id: str, 
        template_id: str, 
        category: str,
        views: int, 
        clicks: int
    ):
        """
        Registra risultato e aggiorna statistiche.
        """
        if template_id not in self.templates:
            return
        
        template = self.templates[template_id]
        template.update_stats(category, views, clicks)
        
        # Persist to DB
        self._sync_to_db(template)
        
        # Update active tests
        for test in self.active_tests.values():
            test.record_data(template_id, views, clicks)
    
    def _sync_to_db(self, template: CopyTemplate):
        """Sincronizza template con database."""
        self.db.execute("""
            INSERT INTO copy_templates (id, name, stats, updated_at)
            VALUES (?, ?, ?, NOW())
            ON CONFLICT (id) DO UPDATE SET
                stats = EXCLUDED.stats,
                updated_at = NOW()
        """, [template.id, template.name, json.dumps(template.stats)])
    
    def get_leaderboard(self, category: str = None) -> List[dict]:
        """
        Classifica template per performance.
        """
        results = []
        for t in self.templates.values():
            if not t.is_active:
                continue
            
            cat = category or '_all'
            ctr = t.get_ctr(cat)
            stats = t.stats.get(cat, {'views': 0, 'clicks': 0})
            
            results.append({
                'template_id': t.id,
                'template_name': t.name,
                'ctr': ctr,
                'views': stats['views'],
                'clicks': stats['clicks'],
                'confidence': self._calculate_confidence(stats['views'], ctr)
            })
        
        return sorted(results, key=lambda x: x['ctr'], reverse=True)
    
    def _calculate_confidence(self, samples: int, ctr: float) -> dict:
        """Calcola intervallo di confidenza."""
        if samples < 10:
            return {'level': 'very_low', 'ci': (0, 1)}
        
        # Wilson score interval
        z = 1.96  # 95% confidence
        n = samples
        p = ctr
        
        denominator = 1 + z**2/n
        center = (p + z**2/(2*n)) / denominator
        spread = z * math.sqrt((p*(1-p) + z**2/(4*n)) / n) / denominator
        
        ci_lower = max(0, center - spread)
        ci_upper = min(1, center + spread)
        
        level = 'very_low' if samples < 50 else 'low' if samples < 200 else 'medium' if samples < 500 else 'high' if samples < 1000 else 'very_high'
        
        return {
            'level': level,
            'ci': (ci_lower, ci_upper),
            'samples': samples
        }
```

### 2.2 A/B Test Manager

```python
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime
import uuid

class TestStatus(Enum):
    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    STOPPED_EARLY = "stopped_early"

@dataclass
class TestVariant:
    template_id: str
    template_name: str
    views: int = 0
    clicks: int = 0
    posts: List[str] = field(default_factory=list)
    
    @property
    def ctr(self) -> float:
        return self.clicks / self.views if self.views > 0 else 0

@dataclass
class ABTest:
    """
    Test A/B gestito dal sistema.
    """
    id: str
    channel_id: str
    name: str
    description: str
    category: str  # Categoria su cui testare
    
    control: TestVariant
    treatment: TestVariant
    
    # Config
    target_samples: int = 1000  # Per variante
    confidence_threshold: float = 0.95
    min_duration_days: int = 7
    max_duration_days: int = 30
    
    # Status
    status: TestStatus = TestStatus.DRAFT
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    winner: Optional[str] = None
    
    # Results
    final_lift: Optional[float] = None
    final_p_value: Optional[float] = None
    final_confidence: Optional[float] = None
    
    def record_data(self, template_id: str, views: int, clicks: int):
        """Registra dati per variante."""
        if template_id == self.control.template_id:
            self.control.views += views
            self.control.clicks += clicks
        elif template_id == self.treatment.template_id:
            self.treatment.views += views
            self.treatment.clicks += clicks
    
    def calculate_results(self) -> dict:
        """Calcola risultati correnti."""
        if self.control.views == 0 or self.treatment.views == 0:
            return {
                'status': 'insufficient_data',
                'control_ctr': 0,
                'treatment_ctr': 0
            }
        
        # CTR
        p_c = self.control.ctr
        p_t = self.treatment.ctr
        
        # Pooled proportion
        total_clicks = self.control.clicks + self.treatment.clicks
        total_views = self.control.views + self.treatment.views
        p_pool = total_clicks / total_views
        
        # Standard error
        se = math.sqrt(
            p_pool * (1 - p_pool) * 
            (1/self.control.views + 1/self.treatment.views)
        )
        
        # Z-score
        z = (p_t - p_c) / se if se > 0 else 0
        
        # P-value (two-tailed)
        from scipy import stats
        p_value = 2 * (1 - stats.norm.cdf(abs(z)))
        
        # Lift
        lift = (p_t - p_c) / p_c * 100 if p_c > 0 else 0
        
        return {
            'status': 'calculated',
            'control_ctr': p_c,
            'treatment_ctr': p_t,
            'lift_pct': lift,
            'z_score': z,
            'p_value': p_value,
            'is_significant': p_value < (1 - self.confidence_threshold),
            'confidence': 1 - p_value,
            'winner': (
                self.treatment.template_name if lift > 0 and p_value < 0.05
                else self.control.template_name if lift < 0 and p_value < 0.05
                else None
            )
        }
    
    def should_stop_early(self) -> tuple[bool, str]:
        """
        Determina se fermare il test.
        """
        if self.status != TestStatus.RUNNING:
            return False, "not_running"
        
        results = self.calculate_results()
        
        if results['status'] == 'insufficient_data':
            return False, "insufficient_data"
        
        # Min samples check
        min_samples = max(100, self.target_samples * 0.3)
        if self.control.views < min_samples or self.treatment.views < min_samples:
            return False, "below_min_samples"
        
        # Clear winner (p < 0.01)
        if results['p_value'] < 0.01:
            if abs(results['lift_pct']) > 10:
                return True, f"clear_winner_{results['winner']}"
        
        # Clear loser (treatment significantly worse)
        if results['is_significant'] and results['lift_pct'] < -15:
            return True, "treatment_significantly_worse"
        
        # Futility (at 70%+ samples, effect too small to be meaningful)
        progress = (self.control.views + self.treatment.views) / (2 * self.target_samples)
        if progress > 0.7 and abs(results['lift_pct']) < 3:
            return True, "futility"
        
        # Max duration reached
        if self.started_at:
            days_running = (datetime.now() - self.started_at).days
            if days_running >= self.max_duration_days:
                return True, "max_duration"
        
        return False, "continue"
    
    def finalize(self, reason: str):
        """Finalizza il test."""
        self.status = TestStatus.COMPLETED if reason == "target_reached" else TestStatus.STOPPED_EARLY
        self.ended_at = datetime.now()
        
        results = self.calculate_results()
        self.final_lift = results.get('lift_pct')
        self.final_p_value = results.get('p_value')
        self.final_confidence = results.get('confidence')
        self.winner = results.get('winner')


class ABTestManager:
    """
    Gestisce ciclo di vita dei test A/B.
    """
    
    def __init__(self, db, optimizer: CopyOptimizerEngine):
        self.db = db
        self.optimizer = optimizer
        self.tests: Dict[str, ABTest] = {}
    
    def create_test(
        self,
        channel_id: str,
        name: str,
        description: str,
        category: str,
        control_template_id: str,
        treatment_template_id: str,
        target_samples: int = 1000
    ) -> ABTest:
        """
        Crea nuovo test A/B.
        """
        # Validate templates exist
        control_template = self.optimizer.templates.get(control_template_id)
        treatment_template = self.optimizer.templates.get(treatment_template_id)
        
        if not control_template or not treatment_template:
            raise ValueError("Template not found")
        
        test = ABTest(
            id=str(uuid.uuid4()),
            channel_id=channel_id,
            name=name,
            description=description,
            category=category,
            control=TestVariant(
                template_id=control_template_id,
                template_name=control_template.name
            ),
            treatment=TestVariant(
                template_id=treatment_template_id,
                template_name=treatment_template.name
            ),
            target_samples=target_samples
        )
        
        self.tests[test.id] = test
        self._sync_to_db(test)
        
        return test
    
    def start_test(self, test_id: str) -> bool:
        """Avvia un test."""
        test = self.tests.get(test_id)
        if not test or test.status != TestStatus.DRAFT:
            return False
        
        test.status = TestStatus.RUNNING
        test.started_at = datetime.now()
        
        # Register with optimizer
        self.optimizer.active_tests[test_id] = test
        
        self._sync_to_db(test)
        return True
    
    def check_all_tests(self):
        """
        Check periodico su tutti i test attivi.
        Chiamato da scheduler ogni ora.
        """
        for test_id, test in list(self.tests.items()):
            if test.status != TestStatus.RUNNING:
                continue
            
            should_stop, reason = test.should_stop_early()
            
            if should_stop:
                test.finalize(reason)
                del self.optimizer.active_tests[test_id]
                self._sync_to_db(test)
                self._notify_test_ended(test, reason)
            else:
                # Check if target reached
                total_samples = test.control.views + test.treatment.views
                if total_samples >= 2 * test.target_samples:
                    test.finalize("target_reached")
                    del self.optimizer.active_tests[test_id]
                    self._sync_to_db(test)
                    self._notify_test_ended(test, "target_reached")
    
    def _sync_to_db(self, test: ABTest):
        """Persiste test su DB."""
        self.db.execute("""
            INSERT INTO ab_tests (
                id, channel_id, name, category, status,
                control_data, treatment_data,
                started_at, ended_at, results
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status,
                control_data = EXCLUDED.control_data,
                treatment_data = EXCLUDED.treatment_data,
                ended_at = EXCLUDED.ended_at,
                results = EXCLUDED.results
        """, [
            test.id, test.channel_id, test.name, test.category,
            test.status.value,
            json.dumps(asdict(test.control)),
            json.dumps(asdict(test.treatment)),
            test.started_at, test.ended_at,
            json.dumps(test.calculate_results())
        ])
    
    def _notify_test_ended(self, test: ABTest, reason: str):
        """Notifica creator che il test è terminato."""
        # Implementa notifica (email, webhook, etc.)
        pass
```

---

## 3. KPI e Metriche

### 3.1 KPI Primari

| KPI | Formula | Target | Frequenza |
|-----|---------|--------|-----------|
| CTR Medio | clicks / views | > 4% | Giornaliero |
| CTR Delta vs Baseline | (current_ctr - baseline_ctr) / baseline_ctr | > +10% | Settimanale |
| Test Completion Rate | completed_tests / started_tests | > 80% | Mensile |
| Winning Insights | significant_tests / completed_tests | > 50% | Mensile |

### 3.2 KPI Secondari

| KPI | Formula | Target | Note |
|-----|---------|--------|------|
| Click Velocity | clicks_first_hour / total_clicks | > 60% | Misura engagement immediato |
| Template Diversity | unique_templates_used / posts | > 0.3 | Evita over-optimization |
| Early Stop Rate | early_stopped / completed | < 30% | Test ben progettati |
| False Positive Rate | reversed_winners / total_winners | < 5% | Qualità decisioni |

### 3.3 Dashboard Metrics Schema

```python
@dataclass
class DashboardMetrics:
    """Metriche per dashboard creator."""
    
    # Overview
    total_posts_today: int
    total_clicks_today: int
    ctr_today: float
    ctr_vs_yesterday: float  # Delta %
    
    # Active tests
    active_tests: List[dict]  # [{name, progress, current_winner, lift}]
    
    # Leaderboard
    top_templates: List[dict]  # Top 5 templates by CTR
    worst_templates: List[dict]  # Bottom 3 templates
    
    # Trends
    ctr_7d_trend: List[float]  # CTR per day
    clicks_7d_trend: List[int]
    
    # Recommendations
    recommendations: List[str]  # Actionable suggestions

def generate_dashboard_metrics(
    channel_id: str, 
    optimizer: CopyOptimizerEngine,
    test_manager: ABTestManager,
    db
) -> DashboardMetrics:
    """Genera metriche per dashboard."""
    
    # Today's data
    today = db.query("""
        SELECT 
            COUNT(*) as posts,
            SUM(clicks) as clicks,
            SUM(views) as views
        FROM posts 
        WHERE channel_id = ? AND DATE(created_at) = CURRENT_DATE
    """, [channel_id])
    
    yesterday = db.query("""
        SELECT AVG(clicks::float / NULLIF(views, 0)) as ctr
        FROM posts 
        WHERE channel_id = ? AND DATE(created_at) = CURRENT_DATE - 1
    """, [channel_id])
    
    ctr_today = today['clicks'] / today['views'] if today['views'] > 0 else 0
    ctr_yesterday = yesterday['ctr'] or ctr_today
    
    # Active tests
    active_tests = [
        {
            'name': t.name,
            'progress': (t.control.views + t.treatment.views) / (2 * t.target_samples) * 100,
            'current_winner': t.calculate_results().get('winner'),
            'lift': t.calculate_results().get('lift_pct', 0)
        }
        for t in test_manager.tests.values()
        if t.status == TestStatus.RUNNING and t.channel_id == channel_id
    ]
    
    # Leaderboard
    leaderboard = optimizer.get_leaderboard()
    
    # 7-day trends
    trends = db.query("""
        SELECT 
            DATE(created_at) as date,
            SUM(clicks)::float / NULLIF(SUM(views), 0) as ctr,
            SUM(clicks) as clicks
        FROM posts
        WHERE channel_id = ? AND created_at > NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date
    """, [channel_id])
    
    # Recommendations
    recommendations = generate_recommendations(
        ctr_today, leaderboard, active_tests, optimizer
    )
    
    return DashboardMetrics(
        total_posts_today=today['posts'],
        total_clicks_today=today['clicks'],
        ctr_today=ctr_today,
        ctr_vs_yesterday=(ctr_today - ctr_yesterday) / ctr_yesterday * 100 if ctr_yesterday > 0 else 0,
        active_tests=active_tests,
        top_templates=leaderboard[:5],
        worst_templates=leaderboard[-3:] if len(leaderboard) > 3 else [],
        ctr_7d_trend=[t['ctr'] for t in trends],
        clicks_7d_trend=[t['clicks'] for t in trends],
        recommendations=recommendations
    )

def generate_recommendations(
    ctr_today: float,
    leaderboard: List[dict],
    active_tests: List[dict],
    optimizer: CopyOptimizerEngine
) -> List[str]:
    """Genera raccomandazioni actionable."""
    recs = []
    
    # CTR basso
    if ctr_today < 0.03:
        recs.append("⚠️ CTR sotto media. Considera di testare template con tono più urgente.")
    
    # Template sottoperformante
    for t in leaderboard[-2:]:
        if t['ctr'] < 0.02 and t['confidence']['level'] in ['high', 'very_high']:
            recs.append(f"🔴 Template '{t['template_name']}' ha CTR basso confermato. Considera di disattivarlo.")
    
    # Nessun test attivo
    if not active_tests:
        recs.append("💡 Nessun test attivo. Avvia un A/B test per migliorare le performance.")
    
    # Exploration mode suggerito
    if optimizer.epsilon < 0.1:
        recs.append("🔍 Il sistema è in modalità exploitation. Considera più exploration per trovare nuovi vincitori.")
    
    return recs
```

---

## 4. Integrazione con LLM

### 4.1 Template Prompts Consigliati

```python
TEMPLATE_PROMPTS = {
    "urgente": """
Genera un post Telegram per questa offerta Amazon.

PRODOTTO: {product_name}
PREZZO: {price}€ (era {original_price}€)
SCONTO: {discount}%
MINIMO STORICO: {"Sì" if is_historical_low else "No"}

STILE: Urgente e diretto
- Inizia con emoji ⚡ o 🔥
- Enfatizza la scarsità o il tempo limitato
- Prezzo SEMPRE in evidenza
- Max 250 caratteri

ESEMPIO OUTPUT:
⚡ MINIMO STORICO
AirPods Pro 2 a 199€ (-35%)
Corre prima che finisca!
""",

    "informativo": """
Genera un post Telegram per questa offerta Amazon.

PRODOTTO: {product_name}
PREZZO: {price}€ (era {original_price}€)
SCONTO: {discount}%
CATEGORIA: {category}

STILE: Informativo e neutro
- Nessun emoji all'inizio
- Evidenzia caratteristiche utili
- Tono professionale
- Max 280 caratteri

ESEMPIO OUTPUT:
Prezzo interessante per le AirPods Pro 2: 199€
Sconto del 35% sul prezzo di listino. Include cancellazione attiva del rumore e custodia MagSafe.
""",

    "casual": """
Genera un post Telegram per questa offerta Amazon.

PRODOTTO: {product_name}
PREZZO: {price}€ (era {original_price}€)
SCONTO: {discount}%

STILE: Casual e amichevole
- Tono conversazionale, come consigliare a un amico
- 1-2 emoji massimo, posizionati naturalmente
- Non usare "imperdibile", "occasione unica", etc.
- Max 260 caratteri

ESEMPIO OUTPUT:
Bella offerta sulle AirPods Pro 2 🎧
199€ invece di 309€, sconto onesto del 35%. Se le cercavi, è un buon momento.
""",

    "benefit_first": """
Genera un post Telegram per questa offerta Amazon.

PRODOTTO: {product_name}
PREZZO: {price}€ (era {original_price}€)
SCONTO: {discount}%
CATEGORIA: {category}

STILE: Focus sui benefici
- Inizia con il problema che risolve o il beneficio principale
- Prezzo alla fine
- Max 1 emoji
- Max 270 caratteri

ESEMPIO OUTPUT:
Addio rumore di fondo nelle call 🎧
Le AirPods Pro 2 hanno la cancellazione attiva perfetta per lavorare da casa. Oggi a 199€ (-35%).
"""
}
```

### 4.2 Copy Validator

```python
class CopyValidator:
    """Valida copy prima della pubblicazione."""
    
    MAX_LENGTH = 300
    MIN_LENGTH = 50
    FORBIDDEN_PHRASES = [
        "offerta imperdibile",
        "occasione unica",
        "da non perdere",
        "prezzo folle",
        "regalo",
        "gratis"  # A meno che non sia vero
    ]
    
    def validate(self, copy: str, deal: dict) -> tuple[bool, List[str]]:
        """
        Valida copy.
        Returns: (is_valid, list_of_issues)
        """
        issues = []
        
        # Length check
        if len(copy) > self.MAX_LENGTH:
            issues.append(f"Troppo lungo: {len(copy)} caratteri (max {self.MAX_LENGTH})")
        if len(copy) < self.MIN_LENGTH:
            issues.append(f"Troppo corto: {len(copy)} caratteri (min {self.MIN_LENGTH})")
        
        # Forbidden phrases
        copy_lower = copy.lower()
        for phrase in self.FORBIDDEN_PHRASES:
            if phrase in copy_lower:
                issues.append(f"Frase vietata: '{phrase}'")
        
        # Price accuracy
        price_str = f"{deal['price']}"
        if price_str not in copy and f"{deal['price']:.2f}" not in copy:
            issues.append("Prezzo non presente o non corretto")
        
        # Discount accuracy (allow ±1%)
        discount = deal['discount_pct']
        discount_mentioned = any(
            f"{d}%" in copy 
            for d in range(discount - 1, discount + 2)
        )
        if not discount_mentioned:
            issues.append(f"Sconto ({discount}%) non menzionato correttamente")
        
        return len(issues) == 0, issues
```

---

## 5. Interfaccia Utente (Wireframe Concettuale)

### 5.1 Sezione "Ottimizzazione Copy"

```
┌─────────────────────────────────────────────────────────────┐
│  🎯 OTTIMIZZAZIONE COPY                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Performance Oggi                                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │  CTR    │  │  Click  │  │  Post   │                     │
│  │  4.2%   │  │  1,234  │  │   89    │                     │
│  │  ▲ +8%  │  │  ▲ +15% │  │  = 0%   │                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
│                                                             │
│  🏆 Top Template                    📉 Da Migliorare        │
│  ┌─────────────────────────┐       ┌─────────────────────┐ │
│  │ 🥇 Urgente (5.1% CTR)   │       │ ⚠️ Informativo      │ │
│  │ 🥈 Casual (4.8% CTR)    │       │    (2.1% CTR)       │ │
│  │ 🥉 Benefit (4.5% CTR)   │       │    [Disattiva]      │ │
│  └─────────────────────────┘       └─────────────────────┘ │
│                                                             │
│  ⚡ Test Attivo                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "Urgente vs Casual - Tech"                           │   │
│  │ Progresso: ████████░░░░░░░░ 52%                     │   │
│  │ Leader attuale: Urgente (+12%)                       │   │
│  │ Confidenza: 78%                                      │   │
│  │                                     [Dettagli] [Stop]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [+ Nuovo Test]  [📋 Gestisci Template]  [📈 Report]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Modale "Crea Nuovo Test"

```
┌─────────────────────────────────────────────────────────────┐
│  ✨ Crea Nuovo A/B Test                              [X]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Nome Test:                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Urgente vs Casual - Elettronica                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Categoria:                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [v] Elettronica                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Template A (Controllo):                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [v] Urgente (CTR attuale: 5.1%)                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Template B (Sfidante):                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [v] Casual (CTR attuale: 4.8%)                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Durata stimata: ~10 giorni (1000 post per variante)       │
│                                                             │
│  ⚙️ Opzioni Avanzate                                       │
│  [ ] Early stopping automatico                             │
│  [ ] Notifica quando significativo                         │
│                                                             │
│                              [Annulla]  [🚀 Avvia Test]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Rischi e Mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Creator avvia troppi test | Media | Basso | Limite 1 test attivo per canale |
| Test non raggiunge sample size | Alta | Medio | Proiezione tempo + avviso |
| Template vincente non è replicabile | Media | Alto | Test su multiple categorie |
| Overfitting su pochi template | Media | Alto | Forced exploration periodica |
| CTR cala dopo rollout winner | Bassa | Alto | A/B test di conferma post-rollout |
| Spam detection Telegram | Bassa | Critico | Rate limiter strict, no same-deal test |

---

## 7. Rollout Plan per Beta Tester

### Fase 1: Setup (Giorno 1-2)
1. Deploy Copy Bank con 5 template base
2. Abilitare tracking automatico su tutti i post
3. Configurare dashboard metriche base
4. Briefing con beta tester su come funziona

### Fase 2: Baseline Collection (Giorno 3-9)
1. Rotazione random dei 5 template
2. Nessun test formale, solo raccolta dati
3. Calcolo baseline CTR per categoria
4. Identificazione template migliori/peggiori

### Fase 3: Primo Test (Giorno 10-20)
1. Avvio primo A/B test controllato
2. Monitoring giornaliero
3. Supporto attivo al tester
4. Documentazione learnings

### Fase 4: Ottimizzazione (Giorno 21+)
1. Attivazione epsilon-greedy bandit
2. Test multipli in parallelo (se volume lo permette)
3. Raccolta feedback UX
4. Iterazione su dashboard

---

*Continua in: 07-implementation-blueprint.md*
