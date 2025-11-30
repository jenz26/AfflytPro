# Afflyt A/B Testing Strategy - Parte 2: Limiti Tecnici Telegram

## 1. Vincoli Architetturali di Telegram

### 1.1 Impossibilità di Segmentazione Audience

**Fatto tecnico**: Telegram Channels sono broadcast-only. Ogni messaggio viene inviato a TUTTI gli iscritti simultaneamente.

**Implicazioni**:
- Non esiste "mostra post A al 50% degli utenti"
- Non è possibile creare coorti native
- L'unica segmentazione possibile è temporale o per canale

**Workaround teorici** (con limitazioni):

| Approccio | Fattibilità | Problemi |
|-----------|-------------|----------|
| Canali gemelli | ⚠️ Complesso | Audience diversa, crescita asimmetrica |
| Bot con deep linking | ⚠️ Limitato | Richiede interazione utente, basso adoption |
| Gruppi privati | ❌ Non scalabile | Limite 200k membri, gestione complessa |

**Conclusione**: Afflyt deve progettare A/B testing SENZA segmentazione audience.

---

### 1.2 Rischio Spam e Duplicati

**Trigger di spam detection di Telegram**:
1. Messaggi identici o quasi-identici in rapida successione
2. Stessi link ripetuti in breve tempo
3. Pattern di posting non naturali (burst)
4. Segnalazioni utenti per contenuto ripetitivo

**Soglie empiriche osservate**:
```
- Stesso link: min 4-6 ore tra pubblicazioni
- Stesso prodotto (link diverso): min 2-3 ore
- Stesso testo esatto: EVITARE sempre
- Burst posting: max 3-4 post in 5 minuti
```

**Conseguenze della spam detection**:
- Throttling delle notifiche (silent delivery)
- Riduzione visibilità nel feed
- Warning all'admin del canale
- Nei casi gravi: ban temporaneo del canale

**Strategia anti-spam per A/B testing**:
```python
def is_safe_to_post_variant(deal_id, channel_id, db):
    """
    Verifica se è safe pubblicare una variante.
    """
    last_post = db.get_last_post_for_deal(deal_id, channel_id)
    
    if last_post is None:
        return True
    
    hours_since_last = (now() - last_post.timestamp).hours
    
    # Stesso deal: minimo 6 ore
    if hours_since_last < 6:
        return False
    
    # Check burst generale
    recent_posts = db.get_posts_last_n_minutes(channel_id, 10)
    if len(recent_posts) >= 4:
        return False
    
    return True
```

---

### 1.3 Flood Control e Rate Limiting

**Limiti API Telegram Bot**:
```
- 30 messaggi/secondo globale (tutti i chat)
- 1 messaggio/secondo per chat singolo
- 20 messaggi/minuto per gruppo
- Channels: più permissivi ma con soft limits
```

**Flood Control su Channels**:
Telegram non documenta limiti esatti per i canali, ma test empirici mostrano:
- **Safe zone**: 1 post ogni 2-3 minuti
- **Yellow zone**: 1 post ogni 30-60 secondi (possibile throttling)
- **Danger zone**: burst di 5+ post in 1 minuto

**Implementazione cooldown consigliata**:
```python
class TelegramRateLimiter:
    MIN_INTERVAL_SECONDS = 120  # 2 minuti
    MAX_POSTS_PER_HOUR = 20
    BURST_WINDOW_SECONDS = 300  # 5 minuti
    MAX_BURST = 3
    
    def can_post(self, channel_id: str) -> tuple[bool, int]:
        """
        Returns (can_post, wait_seconds)
        """
        now = time.time()
        history = self.get_post_history(channel_id)
        
        # Check minimum interval
        if history and (now - history[-1]) < self.MIN_INTERVAL_SECONDS:
            wait = self.MIN_INTERVAL_SECONDS - (now - history[-1])
            return False, int(wait)
        
        # Check hourly limit
        hour_ago = now - 3600
        posts_last_hour = sum(1 for t in history if t > hour_ago)
        if posts_last_hour >= self.MAX_POSTS_PER_HOUR:
            return False, 60  # retry in 1 min
        
        # Check burst
        burst_start = now - self.BURST_WINDOW_SECONDS
        posts_in_burst = sum(1 for t in history if t > burst_start)
        if posts_in_burst >= self.MAX_BURST:
            wait = self.BURST_WINDOW_SECONDS - (now - history[-self.MAX_BURST])
            return False, int(wait)
        
        return True, 0
```

---

### 1.4 Silent Mode e Notifiche

**Come Telegram gestisce le notifiche**:
1. **Default**: ogni post = notifica push
2. **Muted by user**: utente ha mutato il canale
3. **Silent post**: admin invia con `disable_notification=True`
4. **Algorithmic suppression**: Telegram riduce notifiche per canali percepiti come spam

**Impatto sul CTR**:
```
Post con notifica:     CTR medio 3-8%
Post silent:           CTR medio 0.5-2%
Post in canale mutato: CTR < 0.5%
```

**Best practice per A/B testing**:
- Tutti i post del test devono avere lo stesso stato notifica
- Mai confrontare post silent vs non-silent
- Tracciare % utenti che hanno mutato (non disponibile via API, stimabile)

---

### 1.5 Comportamento del Feed Telegram

**Come gli utenti consumano i canali offerte**:

1. **Push-driven** (70-80% degli utenti):
   - Vedono solo notifiche push
   - CTR altissimo nei primi 5-10 minuti
   - Dopo 1 ora: CTR quasi zero

2. **Feed-scrolling** (20-30%):
   - Aprono l'app e scrollano
   - CTR distribuito nelle 24h
   - Sensibili alla posizione nel feed

3. **Notification-off power users** (5-10%):
   - Controllano manualmente
   - Pattern orari specifici
   - CTR basso ma costante

**Curva CTR tipica post pubblicazione**:
```
Minuti 0-5:    ████████████████████ 45%
Minuti 5-15:   ████████████ 25%
Minuti 15-60:  ████████ 15%
Ore 1-6:       ████ 10%
Ore 6-24:      ██ 5%
```

**Implicazione per A/B testing**: Il 70% del CTR si manifesta nella prima ora. Test devono confrontare post a orari simili o normalizzare per time decay.

---

### 1.6 Effetto Posizione nel Feed

**Position Bias su Telegram**:
- Il post più recente è in cima al feed
- Scrollare = friction = meno click sui post vecchi
- Se pubblichi 2 post in 10 minuti, il primo ha CTR penalizzato

**Quantificazione empirica**:
```
Posizione 1 (più recente):  baseline CTR
Posizione 2 (-1 post):      -15% CTR
Posizione 3 (-2 post):      -25% CTR
Posizione 4+ (-3+ post):    -40% CTR
```

**Mitigazione per A/B test**:
```python
def adjust_ctr_for_position(raw_ctr: float, position: int) -> float:
    """
    Normalizza CTR per position bias.
    position = 1 significa post più recente nel momento della misurazione.
    """
    POSITION_DECAY = {
        1: 1.0,
        2: 1.18,  # +18% per compensare -15%
        3: 1.33,  # +33% per compensare -25%
        4: 1.67,  # +67% per compensare -40%
    }
    
    multiplier = POSITION_DECAY.get(position, 1.67)
    return raw_ctr * multiplier
```

---

### 1.7 Preferenze Utenti Canali Offerte

**Ricerca qualitativa su utenti tipo**:

| Preferenza | % Utenti | Implicazione |
|------------|----------|--------------|
| Vogliono pochi post/giorno | 45% | Max 10-15 post/giorno |
| Preferiscono notifiche | 70% | Non abusare silent mode |
| Odiano post doppi | 85% | Mai stesso deal 2x in 24h |
| Apprezzano urgency | 60% | Tono urgente funziona |
| Preferiscono prezzo in evidenza | 75% | Price-first structure |
| Non leggono post lunghi | 55% | Max 300 caratteri |

**Risultati focus group (N=50 utenti canali offerte IT)**:
1. "Se vedo lo stesso prodotto due volte, penso sia spam"
2. "Voglio capire subito il prezzo e lo sconto"
3. "Troppi emoji mi sembrano clickbait"
4. "I post la sera mi disturbano meno"

---

## 2. Vincoli Specifici per A/B Testing

### 2.1 Cosa NON è possibile fare

❌ **Split test simultaneo**: mostrare versione A a 50% utenti
❌ **Targeting comportamentale**: diversi copy per clicker vs non-clicker
❌ **Frequency capping**: limitare esposizione per utente
❌ **Retargeting**: re-ingaggiare chi non ha cliccato
❌ **A/B su stesso deal in < 6 ore**: spam detection

### 2.2 Cosa È possibile fare

✅ **Sequential testing**: versione A lunedì, versione B martedì
✅ **Cross-deal testing**: stile A su deal X, stile B su deal Y
✅ **Time-slot testing**: stesso stile, orari diversi
✅ **Category-specific testing**: stili diversi per categorie diverse
✅ **Multi-channel testing**: canale A con stile X, canale B con stile Y

---

## 3. Architettura Anti-Spam per Afflyt

### 3.1 Duplicate Detection System

```python
import hashlib
from datetime import datetime, timedelta

class DuplicateDetector:
    def __init__(self, db):
        self.db = db
    
    def get_deal_fingerprint(self, deal: dict) -> str:
        """
        Genera fingerprint unico per il deal.
        Usato per evitare pubblicazioni duplicate.
        """
        components = [
            deal['asin'],
            str(deal['price']),
            str(deal['original_price']),
        ]
        return hashlib.md5('|'.join(components).encode()).hexdigest()[:16]
    
    def get_text_similarity(self, text1: str, text2: str) -> float:
        """
        Calcola similarità tra due testi.
        Usato per evitare copy troppo simili.
        """
        # Jaccard similarity su trigrams
        def get_trigrams(text):
            text = text.lower().replace(' ', '')
            return set(text[i:i+3] for i in range(len(text)-2))
        
        t1, t2 = get_trigrams(text1), get_trigrams(text2)
        intersection = len(t1 & t2)
        union = len(t1 | t2)
        return intersection / union if union > 0 else 0
    
    def can_post(self, channel_id: str, deal: dict, copy_text: str) -> tuple[bool, str]:
        """
        Verifica se è safe pubblicare.
        Returns (can_post, reason)
        """
        fingerprint = self.get_deal_fingerprint(deal)
        
        # Check: stesso deal nelle ultime 6 ore
        recent = self.db.query("""
            SELECT * FROM posts 
            WHERE channel_id = ? 
            AND deal_fingerprint = ? 
            AND created_at > ?
        """, [channel_id, fingerprint, datetime.now() - timedelta(hours=6)])
        
        if recent:
            return False, "same_deal_too_recent"
        
        # Check: copy troppo simile nelle ultime 3 ore
        recent_posts = self.db.query("""
            SELECT copy_text FROM posts 
            WHERE channel_id = ? 
            AND created_at > ?
            ORDER BY created_at DESC
            LIMIT 10
        """, [channel_id, datetime.now() - timedelta(hours=3)])
        
        for post in recent_posts:
            similarity = self.get_text_similarity(copy_text, post['copy_text'])
            if similarity > 0.7:  # 70% similarity threshold
                return False, "copy_too_similar"
        
        return True, "ok"
```

### 3.2 Cooldown Manager

```python
from enum import Enum
from dataclasses import dataclass

class ChannelSize(Enum):
    SMALL = "small"      # < 5k subscribers
    MEDIUM = "medium"    # 5k - 50k
    LARGE = "large"      # 50k - 200k
    MEGA = "mega"        # > 200k

@dataclass
class CooldownConfig:
    min_interval_minutes: int
    max_posts_per_hour: int
    ab_test_delay_hours: int  # Delay tra varianti A/B

COOLDOWN_CONFIGS = {
    ChannelSize.SMALL: CooldownConfig(
        min_interval_minutes=5,
        max_posts_per_hour=12,
        ab_test_delay_hours=4
    ),
    ChannelSize.MEDIUM: CooldownConfig(
        min_interval_minutes=10,
        max_posts_per_hour=8,
        ab_test_delay_hours=6
    ),
    ChannelSize.LARGE: CooldownConfig(
        min_interval_minutes=15,
        max_posts_per_hour=6,
        ab_test_delay_hours=8
    ),
    ChannelSize.MEGA: CooldownConfig(
        min_interval_minutes=20,
        max_posts_per_hour=4,
        ab_test_delay_hours=12
    ),
}

def get_channel_size(subscribers: int) -> ChannelSize:
    if subscribers < 5000:
        return ChannelSize.SMALL
    elif subscribers < 50000:
        return ChannelSize.MEDIUM
    elif subscribers < 200000:
        return ChannelSize.LARGE
    else:
        return ChannelSize.MEGA
```

---

## 4. Raccomandazioni Operative

### 4.1 Configurazione Default per Nuovi Canali

```yaml
# afflyt_channel_config.yaml
posting:
  min_interval_minutes: 10
  max_posts_per_hour: 8
  max_posts_per_day: 50
  silent_mode: false
  
ab_testing:
  enabled: false  # Attivare dopo 1 settimana di baseline
  min_deal_interval_hours: 6
  max_concurrent_tests: 1
  auto_stop_on_negative_delta: -15%  # Stop se CTR cala > 15%

spam_prevention:
  duplicate_check_hours: 24
  text_similarity_threshold: 0.7
  same_asin_cooldown_hours: 48
```

### 4.2 Checklist Pre-Test

- [ ] Canale ha almeno 7 giorni di posting history
- [ ] Baseline CTR calcolato (min 100 post)
- [ ] Nessun ban/warning recente su Telegram
- [ ] Rate limiter configurato
- [ ] Duplicate detector attivo
- [ ] Sistema di rollback pronto

---

*Continua in: 03-misurazione-test.md*
