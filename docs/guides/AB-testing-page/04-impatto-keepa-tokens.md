# Afflyt A/B Testing Strategy - Parte 4: Impatto Token Keepa

## 1. Contesto: Come Afflyt Usa Keepa

### 1.1 Flusso Attuale

```
[Deal Source] → [Keepa API Call] → [Price/History Data] → [Filter Logic] → [LLM Generation] → [Telegram Post]
```

**Costo per deal processato**:
- Product Request: 1 token
- Price History (graphs): 5-10 tokens
- Deals Request: 20-50 tokens (dipende da filtri)

**Consumo tipico**:
```
Canale piccolo (50 deal/giorno):   ~500-1000 tokens/giorno
Canale medio (200 deal/giorno):    ~2000-4000 tokens/giorno
Canale grande (500 deal/giorno):   ~5000-10000 tokens/giorno
```

### 1.2 Impatto Teorico dell'A/B Testing

**Scenario naive (peggiore)**:
Se per ogni A/B test pubblichiamo lo stesso deal due volte, raddoppiamo:
- Non i token Keepa (il deal è già fetchato)
- Ma potenzialmente creiamo lookup duplicati se non gestiamo cache

**Scenario ottimizzato**:
A/B testing NON dovrebbe aumentare i costi Keepa se implementato correttamente.

---

## 2. Analisi Costi per Scenario A/B

### 2.1 Scenario: A/B su Copy Diverso (Stesso Deal)

**Token Keepa aggiuntivi**: 0
- Il deal è già stato fetchato
- I dati sono in cache
- Generiamo solo copy diverso (costo LLM, non Keepa)

**Rischio**: Se il sistema non è ottimizzato, potremmo ri-fetchare inutilmente.

### 2.2 Scenario: A/B su Deal Diversi (Stessa Categoria)

**Token Keepa aggiuntivi**: 0
- Stiamo già fetchando deal della categoria
- Nessun fetch extra

**Nota**: Questo è l'approccio consigliato, zero impatto Keepa.

### 2.3 Scenario: A/B su Timing/Orario

**Token Keepa aggiuntivi**: Potenziale aumento
- Se posticipare un deal richiede refresh dei dati (prezzo cambiato?)
- Raccomandazione: cache validity di 1-2 ore

### 2.4 Scenario: Test su Categorie Aggiuntive

**Token Keepa aggiuntivi**: Proporzionali
- Ogni categoria aggiuntiva = più deal da monitorare
- Ma questo è costo di espansione, non di A/B testing

---

## 3. Strategia di Caching per A/B Testing

### 3.1 Architettura Cache a Due Livelli

```
Level 1: Hot Cache (Redis)
├── TTL: 30 minuti
├── Dati: prezzo corrente, disponibilità
└── Uso: decisioni real-time

Level 2: Warm Cache (PostgreSQL)
├── TTL: 24 ore
├── Dati: storico prezzi, graphs, metadati
└── Uso: generazione copy, analytics
```

### 3.2 Implementazione Cache Intelligente

```python
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import json

class KeepaCache:
    """
    Cache manager per dati Keepa con supporto A/B testing.
    """
    
    def __init__(self, redis_client, db):
        self.redis = redis_client
        self.db = db
        
        # TTL configurations
        self.HOT_TTL = timedelta(minutes=30)
        self.WARM_TTL = timedelta(hours=24)
        self.AB_TEST_TTL = timedelta(hours=6)  # Per dati usati in A/B test
    
    def _get_cache_key(self, asin: str, data_type: str) -> str:
        return f"keepa:{asin}:{data_type}"
    
    async def get_product_data(
        self, 
        asin: str, 
        for_ab_test: bool = False
    ) -> Optional[dict]:
        """
        Recupera dati prodotto con strategia cache.
        
        Args:
            asin: ASIN Amazon
            for_ab_test: Se True, accetta dati più vecchi (risparmio token)
        """
        cache_key = self._get_cache_key(asin, "product")
        
        # Try hot cache first
        hot_data = await self.redis.get(cache_key)
        if hot_data:
            data = json.loads(hot_data)
            return data
        
        # Try warm cache
        warm_data = self.db.query(
            "SELECT data, fetched_at FROM keepa_cache WHERE asin = ?",
            [asin]
        )
        
        if warm_data:
            age = datetime.now() - warm_data['fetched_at']
            
            # Per A/B test, accettiamo dati fino a 6 ore
            max_age = self.AB_TEST_TTL if for_ab_test else self.WARM_TTL
            
            if age < max_age:
                # Refresh hot cache
                await self.redis.setex(
                    cache_key, 
                    int(self.HOT_TTL.total_seconds()),
                    warm_data['data']
                )
                return json.loads(warm_data['data'])
        
        # Cache miss - need to fetch from Keepa
        return None
    
    async def should_refresh_for_ab_test(
        self, 
        asin: str, 
        test_started_at: datetime
    ) -> bool:
        """
        Determina se serve refresh per A/B test.
        Regola: se i dati sono più vecchi dell'inizio del test, refresh.
        """
        warm_data = self.db.query(
            "SELECT fetched_at FROM keepa_cache WHERE asin = ?",
            [asin]
        )
        
        if not warm_data:
            return True
        
        # Dati devono essere più recenti dell'inizio test
        return warm_data['fetched_at'] < test_started_at
```

### 3.3 Batch Fetching per Efficienza

```python
class KeepaOptimizedFetcher:
    """
    Fetcher ottimizzato per ridurre costi token.
    """
    
    BATCH_SIZE = 100  # Keepa supporta fino a 100 ASIN per request
    
    async def fetch_batch(self, asins: list[str]) -> dict:
        """
        Fetch multipli ASIN in una singola request.
        Costo: 1 token per ASIN (invece di 1 request per ASIN)
        """
        # Split in batches
        batches = [asins[i:i+self.BATCH_SIZE] for i in range(0, len(asins), self.BATCH_SIZE)]
        
        all_results = {}
        for batch in batches:
            response = await self.keepa_client.product_request(
                asins=batch,
                domains=['IT'],
                stats=True,
                history=True
            )
            all_results.update(response['products'])
        
        return all_results
    
    async def prefetch_for_ab_test(
        self, 
        category: str, 
        test_duration_hours: int = 24
    ) -> int:
        """
        Pre-fetch intelligente per A/B test.
        Stima quali deal serviranno e li carica in cache.
        
        Returns: Numero di token consumati
        """
        # Stima deal che arriveranno
        historical_rate = self.db.query(
            "SELECT AVG(deals_per_hour) FROM category_stats WHERE category = ?",
            [category]
        )['avg']
        
        expected_deals = int(historical_rate * test_duration_hours * 1.2)  # +20% buffer
        
        # Fetch trending ASINs nella categoria
        # Questo consuma token ma li "investe" per il test
        trending = await self.keepa_client.deals_request(
            domain='IT',
            category=category,
            page=0,
            page_count=min(5, expected_deals // 20)
        )
        
        asins = [d['asin'] for d in trending['deals']]
        
        # Batch fetch e cache
        products = await self.fetch_batch(asins)
        
        for asin, data in products.items():
            await self.cache.set_product_data(asin, data, ttl=timedelta(hours=test_duration_hours))
        
        return len(asins)  # Tokens consumati
```

---

## 4. Strategie di Risparmio Token

### 4.1 Evitare Test Inutili

```python
class ABTestTokenGuard:
    """
    Previene test che sprecherebbero token senza valore.
    """
    
    MIN_SAMPLE_SIZE = 100  # Minimo post per risultato significativo
    MIN_CATEGORY_VOLUME = 50  # Deal/giorno per categoria
    
    def should_allow_test(
        self, 
        channel_id: str, 
        category: str
    ) -> tuple[bool, str]:
        """
        Verifica se un test ha senso avviarlo.
        """
        # Check volume categoria
        daily_volume = self.db.query(
            "SELECT COUNT(*) FROM deals WHERE category = ? AND created_at > NOW() - INTERVAL '1 day'",
            [category]
        )['count']
        
        if daily_volume < self.MIN_CATEGORY_VOLUME:
            return False, f"Categoria {category} ha volume insufficiente ({daily_volume}/giorno)"
        
        # Check test già in corso
        active_tests = self.db.query(
            "SELECT COUNT(*) FROM ab_tests WHERE channel_id = ? AND status = 'running'",
            [channel_id]
        )['count']
        
        if active_tests > 0:
            return False, "Test già in corso per questo canale"
        
        # Check baseline data
        baseline_days = self.db.query(
            "SELECT COUNT(DISTINCT DATE(created_at)) FROM posts WHERE channel_id = ?",
            [channel_id]
        )['count']
        
        if baseline_days < 7:
            return False, "Serve almeno 1 settimana di baseline dati"
        
        return True, "ok"
```

### 4.2 Test Progressivo con Early Stopping

```python
class ProgressiveTokenBudget:
    """
    Gestisce budget token per test con fase progressiva.
    """
    
    def __init__(self, total_budget: int):
        self.total_budget = total_budget
        self.used = 0
        self.phase = 1  # 1=exploration, 2=validation, 3=confirmation
    
    def allocate_for_phase(self) -> int:
        """
        Alloca token per fase corrente.
        Phase 1: 20% budget (quick signal)
        Phase 2: 30% budget (validate signal)
        Phase 3: 50% budget (confirm winner)
        """
        PHASE_ALLOCATION = {1: 0.2, 2: 0.3, 3: 0.5}
        return int(self.total_budget * PHASE_ALLOCATION[self.phase])
    
    def should_advance_phase(self, test_result: dict) -> bool:
        """
        Decide se avanzare alla fase successiva.
        """
        if self.phase == 1:
            # Phase 1→2: serve segnale direzionale
            return abs(test_result['lift']) > 5 and test_result['p_value'] < 0.3
        
        elif self.phase == 2:
            # Phase 2→3: serve conferma statistica
            return test_result['p_value'] < 0.1
        
        return False  # Phase 3 è finale
    
    def should_stop_test(self, test_result: dict) -> tuple[bool, str]:
        """
        Decide se fermare il test per risparmiare token.
        """
        # Futility: nessun segnale dopo phase 1
        if self.phase == 1 and self.used >= self.allocate_for_phase():
            if abs(test_result['lift']) < 2:
                return True, "futility_no_signal"
        
        # Clear winner: stop early
        if test_result['p_value'] < 0.01 and abs(test_result['lift']) > 10:
            return True, "clear_winner"
        
        # Budget exhausted
        if self.used >= self.total_budget:
            return True, "budget_exhausted"
        
        return False, "continue"
```

### 4.3 Memorizzazione Risultati per Riuso

```python
class ABTestResultsRepository:
    """
    Repository per riutilizzare learnings da test passati.
    Evita di ripetere test simili.
    """
    
    def store_result(self, test: ABTest, result: dict):
        """
        Salva risultato con metadati per future reference.
        """
        self.db.execute("""
            INSERT INTO ab_test_results (
                test_id, channel_id, category,
                control_variant, treatment_variant,
                lift, p_value, confidence,
                sample_size, duration_days,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        """, [
            test.id, test.channel_id, test.category,
            test.control.template_id, test.treatment.template_id,
            result['lift'], result['p_value'], 1 - result['p_value'],
            test.control.total_views + test.treatment.total_views,
            (test.ended_at - test.started_at).days
        ])
    
    def get_similar_test(
        self, 
        category: str, 
        control_template: str, 
        treatment_template: str
    ) -> Optional[dict]:
        """
        Cerca test simili già completati.
        Evita di ripetere test con risultati noti.
        """
        return self.db.query("""
            SELECT * FROM ab_test_results
            WHERE category = ?
            AND control_variant = ?
            AND treatment_variant = ?
            AND confidence > 0.9
            AND created_at > NOW() - INTERVAL '90 days'
            ORDER BY confidence DESC
            LIMIT 1
        """, [category, control_template, treatment_template])
    
    def get_winning_templates(self, category: str) -> list[str]:
        """
        Recupera template che hanno vinto test in questa categoria.
        """
        results = self.db.query("""
            SELECT 
                CASE WHEN lift > 0 THEN treatment_variant ELSE control_variant END as winner,
                ABS(lift) as lift_magnitude,
                confidence
            FROM ab_test_results
            WHERE category = ?
            AND confidence > 0.9
            ORDER BY confidence DESC, lift_magnitude DESC
        """, [category])
        
        return [r['winner'] for r in results]
```

---

## 5. Budget Token per A/B Testing

### 5.1 Calcolo Budget Mensile

```python
def calculate_ab_test_token_budget(
    monthly_token_budget: int,
    current_consumption: int,
    test_count: int = 2
) -> dict:
    """
    Calcola budget token dedicabile ad A/B testing.
    
    Regola: A/B testing non dovrebbe aumentare consumo > 10%
    """
    # Margine per A/B testing
    available_margin = monthly_token_budget * 0.10
    
    # Token per test
    tokens_per_test = available_margin / test_count
    
    # Verifica fattibilità
    is_feasible = current_consumption < (monthly_token_budget * 0.85)
    
    return {
        'monthly_budget': monthly_token_budget,
        'current_consumption': current_consumption,
        'available_for_ab': int(available_margin),
        'per_test_budget': int(tokens_per_test),
        'max_concurrent_tests': test_count,
        'is_feasible': is_feasible,
        'recommendation': (
            "OK: budget sufficiente" if is_feasible 
            else "ATTENZIONE: consumo attuale troppo alto, ridurre prima di testare"
        )
    }
```

### 5.2 Stima Token per Tipo di Test

| Tipo Test | Token Aggiuntivi | Note |
|-----------|------------------|------|
| Copy A/B (stesso deal) | ~0 | Solo costo LLM |
| Style A/B (deal diversi) | ~0 | Già fetchati |
| Timing A/B | ~5% | Possibili refresh |
| Categoria nuova | ~20% | Nuovi deal da monitorare |
| Multi-variant (A/B/C) | ~0 | Stesso pool di deal |

### 5.3 Raccomandazioni per Piano Token

```python
# Config consigliata per utente Afflyt

KEEPA_PLANS = {
    'basic': {
        'tokens_month': 500_000,
        'ab_test_budget': 50_000,  # 10%
        'max_concurrent_tests': 1,
        'recommended_test_types': ['style', 'copy']
    },
    'pro': {
        'tokens_month': 2_000_000,
        'ab_test_budget': 200_000,  # 10%
        'max_concurrent_tests': 3,
        'recommended_test_types': ['style', 'copy', 'timing', 'structure']
    },
    'enterprise': {
        'tokens_month': 10_000_000,
        'ab_test_budget': 1_000_000,  # 10%
        'max_concurrent_tests': 5,
        'recommended_test_types': ['all']
    }
}
```

---

## 6. Checklist Ottimizzazione Token

Prima di avviare A/B test:

- [ ] Cache a due livelli implementata (Redis + DB)
- [ ] Batch fetching attivo
- [ ] Duplicate detection per evitare ri-fetch
- [ ] Results repository per evitare test duplicati
- [ ] Early stopping configurato
- [ ] Budget tracking attivo
- [ ] Alert per consumo anomalo

---

*Continua in: 05-strategie-alternative.md*
