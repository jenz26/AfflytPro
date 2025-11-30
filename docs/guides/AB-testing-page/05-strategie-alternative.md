# Afflyt A/B Testing Strategy - Parte 5: Strategie Alternative

## 1. Limiti dell'A/B Testing Classico su Telegram

Prima di esplorare le alternative, riassumiamo perché l'A/B testing tradizionale è problematico:

| Problema | Impatto | Severità |
|----------|---------|----------|
| No audience split | Non possiamo mostrare A e B simultaneamente | 🔴 Critico |
| Sample size alto | Serve molto tempo per significatività | 🟡 Medio |
| Deal variability | Ogni deal è diverso, difficile isolare copy effect | 🟡 Medio |
| Short deal lifetime | Molti test finiscono prima di completarsi | 🟡 Medio |
| User fatigue | Test troppo evidenti infastidiscono | 🟢 Basso |

---

## 2. Strategia 1: A/B/C Testing (Multi-Variant)

### 2.1 Concetto

Invece di due varianti, testiamo tre o più contemporaneamente distribuendole nel tempo.

```
Timeline:
09:00 → Deal 1 con Stile A
10:00 → Deal 2 con Stile B  
11:00 → Deal 3 con Stile C
12:00 → Deal 4 con Stile A
13:00 → Deal 5 con Stile B
...
```

### 2.2 Implementazione

```python
from itertools import cycle
from typing import List
from dataclasses import dataclass

@dataclass
class Variant:
    id: str
    name: str
    template_id: str
    weight: float = 1.0  # Per weighting non uniforme

class ABCTestRotator:
    """
    Rotatore per test multi-variante.
    """
    
    def __init__(self, variants: List[Variant]):
        self.variants = variants
        self.cycle = cycle(variants)
        self.assignment_log = []
    
    def get_next_variant(self, deal_id: str) -> Variant:
        """
        Assegna la prossima variante in rotazione.
        """
        variant = next(self.cycle)
        
        self.assignment_log.append({
            'deal_id': deal_id,
            'variant_id': variant.id,
            'timestamp': datetime.now()
        })
        
        return variant
    
    def get_weighted_variant(self, deal_id: str) -> Variant:
        """
        Assegna variante con weighting (per exploration/exploitation).
        """
        import random
        
        total_weight = sum(v.weight for v in self.variants)
        r = random.uniform(0, total_weight)
        
        cumulative = 0
        for variant in self.variants:
            cumulative += variant.weight
            if r <= cumulative:
                return variant
        
        return self.variants[-1]
```

### 2.3 Pro e Contro

| Pro | Contro |
|-----|--------|
| Testa più varianti contemporaneamente | Sample size per variante più piccolo |
| Trova winner più velocemente | Più complesso da analizzare |
| Meno bias temporale (distribuito) | Richiede più post per significatività |
| Naturale per canali ad alto volume | Non adatto a canali piccoli |

### 2.4 Quando Usarlo

✅ **Ideale per**: Canali con > 50 post/giorno, test su stile/emoji/tono
❌ **Evitare per**: Canali piccoli, test su struttura complessa

---

## 3. Strategia 2: Multi-Armed Bandit (MAB)

### 3.1 Concetto

Invece di allocazione fissa 50/50, il sistema impara in tempo reale e sposta traffico verso varianti che performano meglio.

```
Giorno 1: 33% A, 33% B, 33% C (exploration)
Giorno 3: 40% A, 35% B, 25% C (A sta vincendo)
Giorno 7: 60% A, 25% B, 15% C (exploitation)
```

### 3.2 Epsilon-Greedy Implementation

```python
import random
from collections import defaultdict

class EpsilonGreedyBandit:
    """
    Implementazione epsilon-greedy per A/B testing.
    Epsilon decresce nel tempo (più exploration all'inizio).
    """
    
    def __init__(self, variants: List[str], initial_epsilon: float = 0.3):
        self.variants = variants
        self.initial_epsilon = initial_epsilon
        self.epsilon = initial_epsilon
        
        # Track performance
        self.impressions = defaultdict(int)
        self.clicks = defaultdict(int)
        self.decay_rate = 0.99  # Epsilon decay per pull
    
    def get_ctr(self, variant: str) -> float:
        """CTR stimato per variante."""
        if self.impressions[variant] == 0:
            return 0.5  # Prior ottimistico per exploration
        return self.clicks[variant] / self.impressions[variant]
    
    def select_variant(self) -> str:
        """
        Seleziona variante con epsilon-greedy strategy.
        """
        # Decay epsilon
        self.epsilon = max(0.05, self.epsilon * self.decay_rate)
        
        # Exploration: random variant
        if random.random() < self.epsilon:
            return random.choice(self.variants)
        
        # Exploitation: best variant
        best_variant = max(self.variants, key=self.get_ctr)
        return best_variant
    
    def update(self, variant: str, clicked: bool):
        """
        Aggiorna statistiche dopo un post.
        """
        self.impressions[variant] += 1
        if clicked:
            self.clicks[variant] += 1
    
    def get_stats(self) -> dict:
        """
        Statistiche correnti per dashboard.
        """
        return {
            'epsilon': self.epsilon,
            'variants': {
                v: {
                    'impressions': self.impressions[v],
                    'clicks': self.clicks[v],
                    'ctr': self.get_ctr(v),
                    'allocation': self.impressions[v] / sum(self.impressions.values()) * 100
                }
                for v in self.variants
            }
        }
```

### 3.3 Pro e Contro

| Pro | Contro |
|-----|--------|
| Minimizza regret (perde meno CTR durante test) | Più complesso da implementare |
| Adattivo in tempo reale | Difficile determinare "vincitore" definitivo |
| Non richiede sample size fisso | Può convergere prematuramente |
| Ottimo per ottimizzazione continua | Meno rigore statistico |

### 3.4 Quando Usarlo

✅ **Ideale per**: Ottimizzazione continua post-test, canali grandi
❌ **Evitare per**: Test one-shot con deadline, necessità di p-value rigoroso

---

## 4. Strategia 3: Thompson Sampling

### 4.1 Concetto

Approccio Bayesiano: invece di stimare CTR puntuale, mantiene una distribuzione di probabilità per ogni variante.

### 4.2 Implementazione

```python
import numpy as np
from scipy import stats

class ThompsonSamplingBandit:
    """
    Thompson Sampling con Beta distribution.
    Più sofisticato di epsilon-greedy, bilancia meglio exploration/exploitation.
    """
    
    def __init__(self, variants: List[str]):
        self.variants = variants
        
        # Beta distribution parameters (uniform prior)
        self.alpha = {v: 1 for v in variants}  # Successi + 1
        self.beta = {v: 1 for v in variants}   # Fallimenti + 1
    
    def select_variant(self) -> str:
        """
        Campiona da ogni distribuzione Beta e sceglie il massimo.
        """
        samples = {
            v: np.random.beta(self.alpha[v], self.beta[v])
            for v in self.variants
        }
        return max(samples, key=samples.get)
    
    def update(self, variant: str, clicked: bool):
        """
        Aggiorna distribuzione Beta dopo osservazione.
        """
        if clicked:
            self.alpha[variant] += 1
        else:
            self.beta[variant] += 1
    
    def get_posterior_stats(self) -> dict:
        """
        Statistiche posteriori per ogni variante.
        """
        results = {}
        for v in self.variants:
            a, b = self.alpha[v], self.beta[v]
            dist = stats.beta(a, b)
            
            results[v] = {
                'mean': dist.mean(),
                'std': dist.std(),
                'ci_95': (dist.ppf(0.025), dist.ppf(0.975)),
                'prob_best': self._prob_best(v)
            }
        return results
    
    def _prob_best(self, target: str, samples: int = 10000) -> float:
        """
        Stima probabilità che target sia la variante migliore.
        """
        wins = 0
        for _ in range(samples):
            target_sample = np.random.beta(self.alpha[target], self.beta[target])
            is_best = all(
                target_sample >= np.random.beta(self.alpha[v], self.beta[v])
                for v in self.variants if v != target
            )
            if is_best:
                wins += 1
        return wins / samples
    
    def should_stop(self, threshold: float = 0.95) -> tuple[bool, str]:
        """
        Ferma quando una variante ha > threshold probabilità di essere best.
        """
        stats = self.get_posterior_stats()
        for v, s in stats.items():
            if s['prob_best'] > threshold:
                return True, v
        return False, None
```

### 4.3 Pro e Contro

| Pro | Contro |
|-----|--------|
| Ottimo balance exploration/exploitation | Più complesso matematicamente |
| Stopping rule naturale (prob_best) | Richiede più computation |
| Handles uncertainty elegantemente | Può essere overkill per test semplici |
| Framework Bayesiano completo | Curva di apprendimento per il team |

### 4.4 Quando Usarlo

✅ **Ideale per**: Decision-making continuo, quando interessa "probability of being best"
❌ **Evitare per**: Test semplici A/B, team senza background statistico

---

## 5. Strategia 4: Copy Bank con Rotazione Intelligente

### 5.1 Concetto

Invece di testare varianti specifiche, manteniamo una "banca" di template e li ruotiamo, accumulando dati nel tempo.

### 5.2 Implementazione

```python
from dataclasses import dataclass, field
from typing import Dict, List
from datetime import datetime, timedelta

@dataclass
class CopyTemplate:
    id: str
    name: str
    style: str  # "urgente", "informativo", "casual"
    structure: str  # "price_first", "product_first", "urgency_first"
    emoji_level: int  # 0, 1, 2
    prompt_template: str
    
    # Performance tracking
    total_impressions: int = 0
    total_clicks: int = 0
    category_performance: Dict[str, dict] = field(default_factory=dict)
    
    @property
    def overall_ctr(self) -> float:
        if self.total_impressions == 0:
            return 0
        return self.total_clicks / self.total_impressions
    
    def get_category_ctr(self, category: str) -> float:
        if category not in self.category_performance:
            return self.overall_ctr  # Fallback to overall
        
        perf = self.category_performance[category]
        if perf['impressions'] == 0:
            return self.overall_ctr
        return perf['clicks'] / perf['impressions']


class CopyBank:
    """
    Gestisce pool di template con performance tracking.
    """
    
    def __init__(self):
        self.templates: Dict[str, CopyTemplate] = {}
        self.rotation_history: List[dict] = []
    
    def add_template(self, template: CopyTemplate):
        self.templates[template.id] = template
    
    def select_template(
        self, 
        category: str, 
        strategy: str = "weighted_random"
    ) -> CopyTemplate:
        """
        Seleziona template per la categoria.
        
        Strategies:
        - "random": selezione casuale uniforme
        - "weighted_random": peso proporzionale a CTR
        - "best": sempre il migliore
        - "explore": priorità a template con pochi dati
        """
        templates = list(self.templates.values())
        
        if strategy == "random":
            return random.choice(templates)
        
        elif strategy == "weighted_random":
            # Peso = CTR della categoria (con smoothing)
            weights = []
            for t in templates:
                ctr = t.get_category_ctr(category)
                # Smoothing: evita pesi zero
                weight = max(0.01, ctr) + 0.01
                weights.append(weight)
            
            return random.choices(templates, weights=weights, k=1)[0]
        
        elif strategy == "best":
            return max(templates, key=lambda t: t.get_category_ctr(category))
        
        elif strategy == "explore":
            # Priorità a template con meno dati nella categoria
            def exploration_score(t):
                if category in t.category_performance:
                    return -t.category_performance[category]['impressions']
                return float('inf')  # Mai usato in questa categoria
            
            return max(templates, key=exploration_score)
    
    def update_performance(
        self, 
        template_id: str, 
        category: str, 
        impressions: int, 
        clicks: int
    ):
        """
        Aggiorna statistiche template.
        """
        template = self.templates[template_id]
        
        template.total_impressions += impressions
        template.total_clicks += clicks
        
        if category not in template.category_performance:
            template.category_performance[category] = {'impressions': 0, 'clicks': 0}
        
        template.category_performance[category]['impressions'] += impressions
        template.category_performance[category]['clicks'] += clicks
    
    def get_leaderboard(self, category: str = None) -> List[dict]:
        """
        Classifica template per performance.
        """
        results = []
        for t in self.templates.values():
            if category:
                ctr = t.get_category_ctr(category)
                samples = t.category_performance.get(category, {}).get('impressions', 0)
            else:
                ctr = t.overall_ctr
                samples = t.total_impressions
            
            results.append({
                'id': t.id,
                'name': t.name,
                'ctr': ctr,
                'samples': samples,
                'confidence': self._calculate_confidence(samples, ctr)
            })
        
        return sorted(results, key=lambda x: x['ctr'], reverse=True)
    
    def _calculate_confidence(self, samples: int, ctr: float) -> str:
        """
        Stima confidenza del CTR basata su sample size.
        """
        if samples < 100:
            return "low"
        elif samples < 500:
            return "medium"
        elif samples < 1000:
            return "high"
        else:
            return "very_high"
```

### 5.3 Pro e Contro

| Pro | Contro |
|-----|--------|
| Accumula dati nel tempo senza test formali | Meno rigore statistico |
| Facile da gestire per creator | Può convergere lentamente |
| Learning continuo | Difficile dichiarare "vincitore" |
| No interruzioni per test | Richiede disciplina nella rotazione |

### 5.4 Quando Usarlo

✅ **Ideale per**: Learning passivo, canali che non vogliono "test" formali
❌ **Evitare per**: Decisioni rapide, necessità di risultati statisticamente validi

---

## 6. Strategia 5: Heat Score LLM-Based

### 6.1 Concetto

Usare l'LLM per predire la performance di un copy PRIMA di pubblicarlo, basandosi su pattern storici.

### 6.2 Implementazione

```python
from openai import OpenAI  # O Anthropic, o altro

class CopyHeatScorer:
    """
    Predice performance del copy usando LLM + dati storici.
    """
    
    def __init__(self, llm_client, historical_db):
        self.llm = llm_client
        self.db = historical_db
    
    def get_historical_patterns(self, category: str) -> dict:
        """
        Estrae pattern dai dati storici.
        """
        high_performers = self.db.query("""
            SELECT copy_text, ctr, emoji_count, char_length, 
                   has_price_first, has_urgency_words
            FROM posts 
            WHERE category = ? AND ctr > (
                SELECT AVG(ctr) * 1.2 FROM posts WHERE category = ?
            )
            ORDER BY ctr DESC
            LIMIT 50
        """, [category, category])
        
        low_performers = self.db.query("""
            SELECT copy_text, ctr, emoji_count, char_length,
                   has_price_first, has_urgency_words
            FROM posts 
            WHERE category = ? AND ctr < (
                SELECT AVG(ctr) * 0.8 FROM posts WHERE category = ?
            )
            ORDER BY ctr ASC
            LIMIT 50
        """, [category, category])
        
        return {
            'high': high_performers,
            'low': low_performers,
            'avg_ctr': self.db.query(
                "SELECT AVG(ctr) as avg FROM posts WHERE category = ?",
                [category]
            )['avg']
        }
    
    async def score_copy(
        self, 
        copy_text: str, 
        category: str, 
        deal_info: dict
    ) -> dict:
        """
        Genera heat score per un copy.
        """
        patterns = self.get_historical_patterns(category)
        
        prompt = f"""
        Sei un esperto di copywriting per canali Telegram di offerte Amazon.
        
        Analizza questo copy e predici la sua performance relativa.
        
        COPY DA ANALIZZARE:
        {copy_text}
        
        CATEGORIA: {category}
        DEAL: {deal_info['product_name']} - {deal_info['price']}€ ({deal_info['discount']}% off)
        
        ESEMPI COPY AD ALTA PERFORMANCE (CTR > media):
        {self._format_examples(patterns['high'][:5])}
        
        ESEMPI COPY A BASSA PERFORMANCE (CTR < media):
        {self._format_examples(patterns['low'][:5])}
        
        CTR MEDIO CATEGORIA: {patterns['avg_ctr']:.2%}
        
        Rispondi in JSON con:
        {{
            "heat_score": 1-10 (10 = massima performance prevista),
            "predicted_ctr_relative": "above_average" | "average" | "below_average",
            "strengths": ["punto forte 1", "punto forte 2"],
            "weaknesses": ["punto debole 1"],
            "improvement_suggestions": ["suggerimento 1", "suggerimento 2"]
        }}
        """
        
        response = await self.llm.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
    
    def _format_examples(self, examples: list) -> str:
        """Formatta esempi per il prompt."""
        formatted = []
        for ex in examples:
            formatted.append(f"- \"{ex['copy_text'][:100]}...\" (CTR: {ex['ctr']:.2%})")
        return "\n".join(formatted)
    
    async def optimize_copy(
        self, 
        original_copy: str, 
        category: str, 
        deal_info: dict
    ) -> str:
        """
        Genera versione ottimizzata del copy.
        """
        score = await self.score_copy(original_copy, category, deal_info)
        
        if score['heat_score'] >= 8:
            return original_copy  # Già buono
        
        prompt = f"""
        Riscrivi questo copy per un canale Telegram di offerte Amazon.
        
        COPY ORIGINALE:
        {original_copy}
        
        PROBLEMI IDENTIFICATI:
        {', '.join(score['weaknesses'])}
        
        SUGGERIMENTI:
        {', '.join(score['improvement_suggestions'])}
        
        DEAL: {deal_info['product_name']} - {deal_info['price']}€ ({deal_info['discount']}% off)
        
        Genera una versione migliorata. Max 280 caratteri.
        Rispondi SOLO con il nuovo copy, nessuna spiegazione.
        """
        
        response = await self.llm.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.choices[0].message.content.strip()
```

### 6.3 Pro e Contro

| Pro | Contro |
|-----|--------|
| Feedback prima della pubblicazione | Dipende da qualità dati storici |
| Nessun test necessario | LLM può sbagliare |
| Migliora ogni copy individualmente | Costo LLM aggiuntivo |
| Learning trasferibile tra canali | Richiede calibrazione |

### 6.4 Quando Usarlo

✅ **Ideale per**: Ottimizzazione pre-publish, canali con storico ricco
❌ **Evitare per**: Nuovi canali senza storico, budget LLM limitato

---

## 7. Strategia 6: Test Cross-Categoria

### 7.1 Concetto

Invece di testare sullo stesso deal (spam) o sulla stessa categoria (confounding), testare stili diversi su categorie diverse e poi trasferire i learnings.

### 7.2 Implementazione

```python
class CrossCategoryTester:
    """
    Testa stili su categorie diverse, poi trasferisce learnings.
    """
    
    def __init__(self, db):
        self.db = db
        self.category_similarity = self._build_similarity_matrix()
    
    def _build_similarity_matrix(self) -> dict:
        """
        Matrice di similarità tra categorie basata su:
        - Prezzo medio
        - CTR baseline
        - Tipo utente target
        """
        # Simplified: categorie simili hanno transfer positivo
        return {
            ('tech', 'gaming'): 0.8,
            ('tech', 'home'): 0.4,
            ('home', 'garden'): 0.7,
            ('fashion', 'beauty'): 0.75,
            # ... etc
        }
    
    def get_transferable_learnings(
        self, 
        source_category: str, 
        target_category: str
    ) -> List[dict]:
        """
        Recupera learnings trasferibili da categoria source a target.
        """
        similarity = self.category_similarity.get(
            tuple(sorted([source_category, target_category])),
            0.3  # Default bassa similarità
        )
        
        if similarity < 0.5:
            return []  # Non trasferibile
        
        # Trova test significativi nella categoria source
        source_results = self.db.query("""
            SELECT 
                winning_variant,
                style,
                lift,
                confidence
            FROM ab_test_results
            WHERE category = ?
            AND confidence > 0.9
            AND ABS(lift) > 10
            ORDER BY confidence DESC
        """, [source_category])
        
        # Aggiusta confidence per similarity
        for r in source_results:
            r['transferred_confidence'] = r['confidence'] * similarity
            r['recommendation'] = (
                'strong' if r['transferred_confidence'] > 0.7
                else 'weak' if r['transferred_confidence'] > 0.5
                else 'experimental'
            )
        
        return source_results
    
    def design_cross_category_test(
        self, 
        categories: List[str], 
        variants: List[str]
    ) -> dict:
        """
        Disegna test che massimizza learning cross-categoria.
        """
        # Assegna varianti a categorie per massimizzare coverage
        assignments = {}
        
        for i, category in enumerate(categories):
            # Rotazione semplice
            variant_idx = i % len(variants)
            assignments[category] = variants[variant_idx]
        
        return {
            'type': 'cross_category',
            'assignments': assignments,
            'expected_learnings': len(categories) * len(variants),
            'transfer_potential': self._calculate_transfer_potential(categories)
        }
    
    def _calculate_transfer_potential(self, categories: List[str]) -> float:
        """
        Quanto learning è trasferibile tra le categorie selezionate.
        """
        total_similarity = 0
        pairs = 0
        
        for i, c1 in enumerate(categories):
            for c2 in categories[i+1:]:
                key = tuple(sorted([c1, c2]))
                total_similarity += self.category_similarity.get(key, 0.3)
                pairs += 1
        
        return total_similarity / pairs if pairs > 0 else 0
```

### 7.3 Pro e Contro

| Pro | Contro |
|-----|--------|
| Zero rischio spam | Transfer non sempre valido |
| Learnings ampi | Richiede molte categorie |
| Nessun conflitto A/B | Più complesso da analizzare |
| Scalabile | Meno preciso per categoria specifica |

---

## 8. Matrice Comparativa Strategie

| Strategia | Complessità Impl. | Rigore Statistico | Velocità Learning | Rischio Spam | Best For |
|-----------|-------------------|-------------------|-------------------|--------------|----------|
| A/B Classico | 🟢 Bassa | 🟢 Alto | 🟡 Media | 🟡 Medio | Test one-shot |
| A/B/C Multi | 🟢 Bassa | 🟢 Alto | 🟢 Alta | 🟢 Basso | Canali alto volume |
| MAB Epsilon-Greedy | 🟡 Media | 🟡 Medio | 🟢 Alta | 🟢 Basso | Ottimizzazione continua |
| Thompson Sampling | 🔴 Alta | 🟢 Alto | 🟢 Alta | 🟢 Basso | Decision-making Bayesiano |
| Copy Bank | 🟢 Bassa | 🔴 Basso | 🟡 Media | 🟢 Basso | Learning passivo |
| Heat Score LLM | 🟡 Media | 🟡 Medio | 🟢 Immediata | 🟢 Nullo | Pre-optimization |
| Cross-Category | 🟡 Media | 🟡 Medio | 🟡 Media | 🟢 Nullo | Multi-category |

---

## 9. Raccomandazione per Afflyt

### Approccio Ibrido Consigliato

**Fase 1 (MVP)**: Copy Bank + A/B/C Rotation
- Implementa Copy Bank con 5-8 template
- Rotazione automatica con tracking
- Dashboard semplice per creator

**Fase 2 (Ottimizzazione)**: Epsilon-Greedy Bandit
- Upgrade a MAB per allocation dinamica
- Early stopping automatico
- Alert per varianti sottoperformanti

**Fase 3 (Avanzato)**: Heat Score + Thompson Sampling
- LLM scoring pre-publish
- Thompson Sampling per decisioni finali
- Cross-category transfer learning

---

*Continua in: 06-soluzione-consigliata.md*
