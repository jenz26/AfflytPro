# Afflyt A/B Testing Strategy - Parte 3: Misurazione e Statistica

## 1. Definizione delle Metriche

### 1.1 CTR Reale vs CTR Stimato

**Il problema fondamentale**: Telegram non fornisce dati di impression.

**Cosa possiamo misurare**:
- ✅ Click sul link affiliato (tracking nostro)
- ✅ Numero iscritti al canale (API Telegram)
- ✅ Visualizzazioni del post (API Telegram, con delay)
- ❌ Impression reali (quanti hanno VISTO nel feed)

**Formula CTR Standard (web)**:
```
CTR = clicks / impressions × 100
```

**Formula CTR Telegram (con views)**:
```
CTR_views = affiliate_clicks / telegram_views × 100
```

**Formula CTR Telegram (stimato su iscritti)**:
```
CTR_estimated = affiliate_clicks / (subscribers × reach_rate) × 100
```

Dove `reach_rate` è la percentuale stimata di iscritti che vedono un post (tipicamente 20-40%).

### 1.2 Stima del Reach Rate

**Fattori che influenzano il reach**:
1. **Timing**: post in ore di punta = reach più alto
2. **Notifiche**: utenti con notifiche on vs off
3. **Frequenza**: canali con molti post = reach più basso per post
4. **Posizione**: post recenti = più visti

**Modello di stima reach**:
```python
def estimate_reach_rate(
    subscribers: int,
    hour_of_day: int,
    posts_last_24h: int,
    notification_enabled: bool = True
) -> float:
    """
    Stima la percentuale di iscritti che vedranno il post.
    Returns: float tra 0.0 e 1.0
    """
    # Base reach rate
    base_rate = 0.30  # 30% baseline
    
    # Time of day multiplier
    HOUR_MULTIPLIERS = {
        (6, 9): 0.8,    # Early morning
        (9, 12): 1.1,   # Mid morning
        (12, 14): 1.2,  # Lunch peak
        (14, 18): 0.9,  # Afternoon
        (18, 21): 1.3,  # Evening peak
        (21, 24): 1.1,  # Late evening
        (0, 6): 0.5,    # Night
    }
    
    time_mult = 1.0
    for (start, end), mult in HOUR_MULTIPLIERS.items():
        if start <= hour_of_day < end:
            time_mult = mult
            break
    
    # Frequency penalty
    # Più post = meno reach per singolo post
    freq_penalty = max(0.5, 1 - (posts_last_24h * 0.02))
    
    # Notification boost
    notif_mult = 1.0 if notification_enabled else 0.4
    
    # Channel size decay (grandi canali = meno engagement rate)
    size_decay = 1.0
    if subscribers > 100000:
        size_decay = 0.8
    elif subscribers > 50000:
        size_decay = 0.9
    
    final_rate = base_rate * time_mult * freq_penalty * notif_mult * size_decay
    return min(0.6, max(0.1, final_rate))  # Clamp between 10% and 60%
```

### 1.3 Metriche Chiave per A/B Testing

| Metrica | Formula | Uso |
|---------|---------|-----|
| CTR_raw | clicks / views | Confronto diretto post |
| CTR_normalized | CTR_raw / baseline_CTR | Cross-category comparison |
| Click Velocity | clicks / minutes_since_post | Early performance indicator |
| Engagement Score | (clicks + views) / subscribers | Overall engagement |
| Conversion Delta | CTR_variant - CTR_control | A/B test result |

---

## 2. Bias e Confounding Variables

### 2.1 Position Bias

**Problema**: I post più recenti hanno più visibilità.

**Scenario**:
- Post A pubblicato alle 10:00
- Post B pubblicato alle 10:30
- Alle 11:00, Post B è in cima, Post A è "scrolled down"

**Quantificazione**:
```python
# Decay function per position
def position_decay_factor(minutes_since_post: int, posts_after: int) -> float:
    """
    Calcola il fattore di decay basato su posizione e tempo.
    """
    # Time decay (logaritmico)
    time_decay = 1 / (1 + 0.1 * math.log(1 + minutes_since_post))
    
    # Position decay (lineare)
    position_decay = 1 / (1 + 0.15 * posts_after)
    
    return time_decay * position_decay
```

**Soluzione per A/B test**:
1. Confrontare post alla stessa "età" (es. CTR a 1 ora)
2. Normalizzare per posizione
3. Evitare di pubblicare varianti troppo vicine

### 2.2 Time-of-Day Confounding

**Problema**: CTR varia drasticamente per orario.

**Dati tipici canali offerte IT**:
```
Ora     | CTR Relativo | Index
--------|--------------|-------
06-09   | 0.7          | Basso
09-12   | 1.1          | Sopra media
12-14   | 1.4          | Picco lunch
14-18   | 0.9          | Sotto media
18-21   | 1.5          | Picco serale
21-24   | 1.2          | Buono
00-06   | 0.4          | Minimo
```

**Normalizzazione**:
```python
HOURLY_CTR_INDEX = {
    6: 0.7, 7: 0.7, 8: 0.8, 9: 1.0, 10: 1.1, 11: 1.1,
    12: 1.3, 13: 1.4, 14: 1.0, 15: 0.9, 16: 0.9, 17: 0.9,
    18: 1.3, 19: 1.5, 20: 1.4, 21: 1.2, 22: 1.1, 23: 0.9,
    0: 0.5, 1: 0.4, 2: 0.4, 3: 0.4, 4: 0.4, 5: 0.5,
}

def normalize_ctr_for_time(raw_ctr: float, hour: int) -> float:
    """
    Normalizza CTR per l'effetto orario.
    """
    index = HOURLY_CTR_INDEX.get(hour, 1.0)
    return raw_ctr / index
```

### 2.3 Day-of-Week Effect

**Pattern tipico**:
```
Giorno     | CTR Index | Note
-----------|-----------|------
Lunedì     | 1.0       | Baseline
Martedì    | 1.05      | Leggermente sopra
Mercoledì  | 1.0       | Baseline
Giovedì    | 1.0       | Baseline
Venerdì    | 0.95      | Leggero calo
Sabato     | 0.85      | Weekend effect
Domenica   | 0.80      | Minimo settimanale
```

### 2.4 Deal Attractiveness Confounding

**Problema**: Deal migliori hanno CTR più alto indipendentemente dal copy.

**Fattori di attrattività**:
- Sconto percentuale (40% > 20%)
- Prezzo assoluto (sotto soglie psicologiche: 9.99€, 19.99€)
- Brand popularity (Apple > brand sconosciuto)
- Categoria (tech > casa)
- "Minimo storico" flag

**Modello di expected CTR**:
```python
def calculate_expected_ctr(deal: dict, category_baseline: float) -> float:
    """
    Calcola CTR atteso basato su caratteristiche del deal.
    Usato per normalizzare i risultati del test.
    """
    base = category_baseline
    
    # Discount multiplier
    discount = deal['discount_pct']
    if discount >= 50:
        discount_mult = 1.5
    elif discount >= 40:
        discount_mult = 1.3
    elif discount >= 30:
        discount_mult = 1.15
    else:
        discount_mult = 1.0
    
    # Price multiplier (prezzi bassi = più click)
    price = deal['price']
    if price < 10:
        price_mult = 1.4
    elif price < 25:
        price_mult = 1.2
    elif price < 50:
        price_mult = 1.1
    elif price < 100:
        price_mult = 1.0
    else:
        price_mult = 0.9
    
    # Historical low flag
    historical_mult = 1.3 if deal.get('is_historical_low') else 1.0
    
    # Brand tier (1-3)
    brand_mult = {1: 0.8, 2: 1.0, 3: 1.3}.get(deal.get('brand_tier', 2), 1.0)
    
    return base * discount_mult * price_mult * historical_mult * brand_mult
```

### 2.5 Channel "Hotness" Effect

**Problema**: I canali hanno cicli di engagement (crescita = più CTR, stagnazione = meno).

**Indicatori di hotness**:
- Tasso crescita iscritti (ultimi 7 giorni)
- CTR medio rolling 7 giorni vs 30 giorni
- Engagement rate trend

**Correzione**:
```python
def calculate_channel_hotness_index(channel_stats: dict) -> float:
    """
    Indice di "temperatura" del canale.
    > 1.0 = canale in crescita
    < 1.0 = canale in calo
    """
    # Growth rate
    subs_7d = channel_stats['subscribers_7d_ago']
    subs_now = channel_stats['subscribers_now']
    growth_rate = (subs_now - subs_7d) / subs_7d if subs_7d > 0 else 0
    growth_index = 1 + (growth_rate * 2)  # 5% growth = 1.1 index
    
    # CTR trend
    ctr_7d = channel_stats['avg_ctr_7d']
    ctr_30d = channel_stats['avg_ctr_30d']
    ctr_trend = ctr_7d / ctr_30d if ctr_30d > 0 else 1
    
    return (growth_index + ctr_trend) / 2
```

---

## 3. Calcolo Significatività Statistica

### 3.1 Sample Size Minimo

**Formula per sample size in A/B test (proporzioni)**:
```
n = 2 × [(Z_α/2 + Z_β)² × p × (1-p)] / δ²
```

Dove:
- `Z_α/2` = 1.96 per 95% confidence
- `Z_β` = 0.84 per 80% power
- `p` = baseline proportion (CTR)
- `δ` = minimum detectable effect (MDE)

**Esempio pratico per Afflyt**:
```python
import math

def calculate_sample_size(
    baseline_ctr: float,
    minimum_detectable_effect: float,
    confidence: float = 0.95,
    power: float = 0.80
) -> int:
    """
    Calcola sample size minimo per A/B test.
    
    Args:
        baseline_ctr: CTR attuale (es. 0.05 per 5%)
        minimum_detectable_effect: Variazione minima da rilevare (es. 0.01 per +1%)
        confidence: Livello di confidenza (default 95%)
        power: Power statistico (default 80%)
    
    Returns:
        Sample size per OGNI variante
    """
    # Z-scores
    z_alpha = {0.90: 1.645, 0.95: 1.96, 0.99: 2.576}[confidence]
    z_beta = {0.80: 0.84, 0.90: 1.28}[power]
    
    p = baseline_ctr
    delta = minimum_detectable_effect
    
    numerator = 2 * ((z_alpha + z_beta) ** 2) * p * (1 - p)
    denominator = delta ** 2
    
    return math.ceil(numerator / denominator)

# Esempio: CTR baseline 5%, voglio rilevare +1% (20% lift relativo)
sample_size = calculate_sample_size(0.05, 0.01)
# Risultato: ~1,570 post per variante
```

### 3.2 Tabella Sample Size Pre-calcolati

Per CTR baseline 5% (tipico canali offerte):

| MDE (assoluto) | MDE (relativo) | Sample per variante | Giorni stimati* |
|----------------|----------------|---------------------|-----------------|
| 0.5% | +10% | 6,280 | 60+ giorni |
| 1.0% | +20% | 1,570 | 15-20 giorni |
| 1.5% | +30% | 700 | 7-10 giorni |
| 2.0% | +40% | 392 | 4-5 giorni |
| 2.5% | +50% | 251 | 2-3 giorni |

*Assumendo 100 post/giorno

### 3.3 Test Statistico: Two-Proportion Z-Test

```python
import math
from scipy import stats

def ab_test_significance(
    clicks_a: int, impressions_a: int,
    clicks_b: int, impressions_b: int,
    confidence: float = 0.95
) -> dict:
    """
    Calcola significatività statistica per A/B test.
    
    Returns:
        {
            'ctr_a': float,
            'ctr_b': float,
            'lift': float,  # % improvement
            'z_score': float,
            'p_value': float,
            'is_significant': bool,
            'confidence_interval': tuple
        }
    """
    # CTR
    p_a = clicks_a / impressions_a
    p_b = clicks_b / impressions_b
    
    # Pooled proportion
    p_pool = (clicks_a + clicks_b) / (impressions_a + impressions_b)
    
    # Standard error
    se = math.sqrt(p_pool * (1 - p_pool) * (1/impressions_a + 1/impressions_b))
    
    # Z-score
    z = (p_b - p_a) / se if se > 0 else 0
    
    # P-value (two-tailed)
    p_value = 2 * (1 - stats.norm.cdf(abs(z)))
    
    # Confidence interval for difference
    alpha = 1 - confidence
    z_critical = stats.norm.ppf(1 - alpha/2)
    se_diff = math.sqrt(p_a*(1-p_a)/impressions_a + p_b*(1-p_b)/impressions_b)
    ci_lower = (p_b - p_a) - z_critical * se_diff
    ci_upper = (p_b - p_a) + z_critical * se_diff
    
    return {
        'ctr_a': p_a,
        'ctr_b': p_b,
        'lift': (p_b - p_a) / p_a * 100 if p_a > 0 else 0,
        'z_score': z,
        'p_value': p_value,
        'is_significant': p_value < (1 - confidence),
        'confidence_interval': (ci_lower * 100, ci_upper * 100)  # in percentuale
    }
```

### 3.4 Tempo Minimo di Test

**Regola empirica**:
```
Tempo minimo = max(
    7 giorni,                           # Minimo per day-of-week effect
    sample_size / posts_per_day,        # Per raggiungere significatività
    3 × avg_deal_lifetime_hours / 24    # Per deal expiry
)
```

**Raccomandazioni per Afflyt**:

| Volume canale | Post/giorno | Tempo minimo test |
|---------------|-------------|-------------------|
| Basso (< 20 post/day) | 10-20 | 14-21 giorni |
| Medio (20-50 post/day) | 20-50 | 7-14 giorni |
| Alto (> 50 post/day) | 50-100 | 7 giorni |

---

## 4. Gestione Deal che Scadono

### 4.1 Il Problema

Le offerte Amazon hanno vita breve:
- Flash deals: 2-6 ore
- Deal of the day: 24 ore
- Regular deals: 3-7 giorni
- Price drops: variabile (possono tornare su)

Se un deal scade prima di raccogliere dati sufficienti, il test è compromesso.

### 4.2 Strategie di Mitigazione

**1. Deal Lifetime Filtering**:
```python
def is_deal_suitable_for_ab_test(deal: dict, min_hours: int = 24) -> bool:
    """
    Verifica se il deal ha abbastanza tempo per un A/B test.
    """
    if 'expires_at' not in deal:
        # Se non sappiamo la scadenza, assumiamo OK
        return True
    
    remaining_hours = (deal['expires_at'] - datetime.now()).total_seconds() / 3600
    return remaining_hours >= min_hours
```

**2. Early Termination con Compensazione**:
```python
def should_terminate_test_early(
    test: ABTest,
    deal_expired: bool
) -> tuple[bool, str]:
    """
    Decide se terminare il test prima.
    """
    if deal_expired:
        # Calcola se abbiamo abbastanza dati
        current_power = calculate_current_power(test)
        if current_power >= 0.60:  # 60% power accettabile
            return True, "deal_expired_sufficient_data"
        else:
            return True, "deal_expired_insufficient_data"
    
    return False, "continue"
```

**3. Weighted Analysis per Partial Data**:
```python
def analyze_partial_test(test: ABTest) -> dict:
    """
    Analisi per test interrotti prematuramente.
    Applica weight basato su completezza dei dati.
    """
    completeness = test.actual_samples / test.target_samples
    
    result = ab_test_significance(
        test.clicks_a, test.impressions_a,
        test.clicks_b, test.impressions_b
    )
    
    # Adjust confidence based on completeness
    result['effective_confidence'] = result['confidence'] * completeness
    result['data_quality'] = 'high' if completeness > 0.8 else 'medium' if completeness > 0.5 else 'low'
    result['recommendation'] = (
        'actionable' if result['is_significant'] and completeness > 0.7
        else 'directional' if result['is_significant']
        else 'inconclusive'
    )
    
    return result
```

---

## 5. Framework di Misurazione Completo

### 5.1 Classe ABTestMeasurement

```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class TestStatus(Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    EARLY_STOPPED = "early_stopped"
    FAILED = "failed"

@dataclass
class Variant:
    id: str
    name: str
    template_id: str
    posts: List[str] = field(default_factory=list)
    total_clicks: int = 0
    total_views: int = 0
    total_impressions_est: int = 0
    
    @property
    def ctr_views(self) -> float:
        return self.total_clicks / self.total_views if self.total_views > 0 else 0
    
    @property
    def ctr_est(self) -> float:
        return self.total_clicks / self.total_impressions_est if self.total_impressions_est > 0 else 0

@dataclass
class ABTest:
    id: str
    channel_id: str
    started_at: datetime
    status: TestStatus
    control: Variant
    treatment: Variant
    target_samples: int
    confidence_level: float = 0.95
    
    # Normalization factors
    time_normalization: bool = True
    position_normalization: bool = True
    deal_normalization: bool = True
    
    # Results
    ended_at: Optional[datetime] = None
    final_result: Optional[dict] = None
    
    def get_current_result(self) -> dict:
        """Calcola risultato corrente del test."""
        return ab_test_significance(
            self.control.total_clicks,
            self.control.total_views,
            self.treatment.total_clicks,
            self.treatment.total_views,
            self.confidence_level
        )
    
    def get_progress(self) -> float:
        """Percentuale completamento test."""
        total_samples = self.control.total_views + self.treatment.total_views
        return min(1.0, total_samples / (2 * self.target_samples))
    
    def should_stop_early(self) -> tuple[bool, str]:
        """
        Early stopping rules:
        1. Clear winner (p < 0.01)
        2. Clear loser (treatment significantly worse)
        3. Futility (unlikely to reach significance)
        """
        result = self.get_current_result()
        progress = self.get_progress()
        
        # Clear winner
        if result['is_significant'] and result['p_value'] < 0.01 and progress > 0.3:
            return True, "clear_winner"
        
        # Clear loser (treatment is significantly worse)
        if result['is_significant'] and result['lift'] < -10:
            return True, "treatment_worse"
        
        # Futility check (at 70% progress, effect too small)
        if progress > 0.7 and abs(result['lift']) < 2:
            return True, "futility"
        
        return False, "continue"
```

### 5.2 Metriche Dashboard

```python
def generate_test_dashboard_metrics(test: ABTest) -> dict:
    """
    Genera metriche per dashboard creator.
    """
    result = test.get_current_result()
    
    return {
        # Status
        'test_id': test.id,
        'status': test.status.value,
        'progress_pct': test.get_progress() * 100,
        'days_running': (datetime.now() - test.started_at).days,
        
        # Control metrics
        'control': {
            'name': test.control.name,
            'posts': len(test.control.posts),
            'clicks': test.control.total_clicks,
            'views': test.control.total_views,
            'ctr': f"{result['ctr_a'] * 100:.2f}%"
        },
        
        # Treatment metrics
        'treatment': {
            'name': test.treatment.name,
            'posts': len(test.treatment.posts),
            'clicks': test.treatment.total_clicks,
            'views': test.treatment.total_views,
            'ctr': f"{result['ctr_b'] * 100:.2f}%"
        },
        
        # Comparison
        'lift': f"{result['lift']:+.1f}%",
        'confidence': f"{(1 - result['p_value']) * 100:.0f}%" if result['p_value'] < 0.5 else "< 50%",
        'is_significant': result['is_significant'],
        'winner': test.treatment.name if result['lift'] > 0 and result['is_significant'] else 
                  test.control.name if result['lift'] < 0 and result['is_significant'] else
                  'Nessuno (ancora)'
    }
```

---

*Continua in: 04-impatto-keepa-tokens.md*
