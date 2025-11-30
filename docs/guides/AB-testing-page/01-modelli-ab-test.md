# Afflyt A/B Testing Strategy - Parte 1: Modelli di Test

## Executive Summary

L'A/B testing su Telegram presenta sfide uniche rispetto alle piattaforme web tradizionali. L'impossibilità di mostrare contenuti diversi a utenti diversi nello stesso momento richiede approcci alternativi che sfruttino la dimensione temporale invece di quella audience-based.

---

## 1. Modelli di A/B Test Analizzati

### 1.1 A/B per Copy Diverso sullo Stesso Deal

**Meccanismo**: Pubblicare lo stesso prodotto Amazon con due testi diversi in momenti diversi.

**Pro**:
- Elimina la variabile "attrattività del prodotto"
- Misura direttamente l'efficacia del copy
- Dati comparabili (stesso prezzo, stesso sconto, stesso prodotto)

**Contro**:
- **CRITICO**: Pubblicare due volte lo stesso deal = spam percepito
- Rischio ban/mute da parte degli utenti
- Telegram può penalizzare per contenuto duplicato
- Il secondo post ha bias di posizione (utenti già esposti al deal)
- L'offerta potrebbe scadere tra il primo e secondo post

**Fattibilità su Telegram**: ⚠️ SCONSIGLIATO per lo stesso canale. Possibile solo con canali gemelli o con delay significativo (24-48h).

**Edge Case**: Se il deal ha stock limitato, il primo post potrebbe esaurirlo, invalidando il test.

---

### 1.2 A/B per Deal Diversi nella Stessa Categoria

**Meccanismo**: Testare copy A su deal X (es. cuffie Sony) e copy B su deal Y (es. cuffie JBL) nella stessa categoria.

**Pro**:
- Nessun rischio spam
- Flusso naturale del canale
- Utenti non percepiscono differenze
- Compatibile con il ritmo normale di pubblicazione

**Contro**:
- **Confounding variable**: prodotti diversi hanno attrattività diversa
- Il prezzo assoluto influenza il CTR indipendentemente dal copy
- Brand awareness diversa (Sony vs JBL)
- Necessita alto volume per isolare l'effetto del copy

**Fattibilità su Telegram**: ✅ OTTIMA - Approccio naturale e non invasivo.

**Formula di normalizzazione suggerita**:
```
Normalized_CTR = Raw_CTR / Expected_CTR_baseline
```
Dove `Expected_CTR_baseline` deriva dallo storico della categoria.

---

### 1.3 A/B per Stile di Scrittura

**Variabili testabili**:
- Emoji: con/senza, quantità (1 vs 3+), posizione
- Tono: urgente vs informativo vs casual
- Lunghezza: short (< 200 char) vs medium (200-400) vs long (400+)
- Formattazione: grassetto, italic, line breaks

**Pro**:
- Alta actionability: lo stile è facilmente modificabile
- Insight trasferibili a tutti i deal futuri
- Non richiede deal identici

**Contro**:
- Effetti spesso piccoli (2-5% delta)
- Richiede sample size elevato per significatività
- Preferenze possono variare per categoria

**Fattibilità su Telegram**: ✅ ECCELLENTE - Il modello più pratico.

**Matrice di test consigliata**:

| Variabile | Variante A | Variante B | Variante C |
|-----------|------------|------------|------------|
| Emoji | 0 | 1-2 | 3+ |
| Tono | Urgente ("⚡ SOLO OGGI") | Informativo ("Prezzo storico") | Casual ("Bella offerta") |
| Lunghezza | < 150 char | 150-300 | > 300 |
| CTA | Implicita | Esplicita soft | Esplicita urgente |

---

### 1.4 A/B per Struttura del Post

**Elementi strutturali**:
- Headline: prezzo first vs prodotto first vs sconto first
- CTA position: inizio vs fine vs entrambi
- Info block: specs inline vs lista vs assente
- Link position: inizio vs fine vs multiplo

**Template strutturali da testare**:

**Struttura A - Price First**:
```
💰 39,99€ (-45%)
AirPods Pro 2
Prezzo più basso di sempre
[LINK]
```

**Struttura B - Product First**:
```
🎧 AirPods Pro 2
Il prezzo crolla a 39,99€
Era 72€ → Sconto 45%
[LINK]
```

**Struttura C - Urgency First**:
```
⚡ MINIMO STORICO
AirPods Pro 2 a 39,99€
Solo per poche ore
[LINK]
```

**Fattibilità su Telegram**: ✅ ALTA - Facilmente implementabile via template LLM.

---

### 1.5 A/B per Orario di Pubblicazione

**Meccanismo**: Stesso tipo di deal pubblicato in fasce orarie diverse.

**Pro**:
- Insight ad alto valore operativo
- Non richiede modifiche al copy
- Dati facilmente raccoglibili

**Contro**:
- Il CTR dipende dal "tipo" di utente attivo in quella fascia
- Confounding: deal diversi hanno appeal diverso per orario (tech = sera, casa = mattina)
- Richiede settimane di dati per pattern affidabili

**Fasce da testare**:
```
Early Morning:  06:00 - 09:00 (commute)
Mid Morning:    09:00 - 12:00 (lavoro/pausa)
Lunch:          12:00 - 14:00 (alta attività)
Afternoon:      14:00 - 18:00 (calo)
Evening:        18:00 - 21:00 (picco)
Night:          21:00 - 00:00 (secondo picco)
Late Night:     00:00 - 06:00 (bassa attività)
```

**Fattibilità su Telegram**: ✅ MEDIA-ALTA - Richiede analisi storica consistente.

---

### 1.6 A/B Test Settimanali Controllati

**Meccanismo**: Settimana 1 = Style A per tutti i deal, Settimana 2 = Style B per tutti.

**Pro**:
- Sample size elevato
- Controllo totale sulle variabili
- Pattern chiari a fine test

**Contro**:
- **Confounding temporale**: eventi esterni (Black Friday, Prime Day) invalidano il test
- 2 settimane = 14 giorni = lungo per iterare
- Se uno stile performa male, 1 settimana di CTR basso

**Mitigazione**:
- Usare "cohort weeks" simili (evitare festività)
- Comparare con baseline storica
- Implementare early stopping se delta > 20% negativo

**Fattibilità su Telegram**: ⚠️ POSSIBILE ma rischioso per canali grandi.

---

## 2. Matrice di Fattibilità Riassuntiva

| Modello | Fattibilità | Rischio Spam | Validità Statistica | Tempo per Risultati | Raccomandazione |
|---------|-------------|--------------|---------------------|---------------------|-----------------|
| Stesso deal, copy diverso | ❌ Bassa | 🔴 Alto | 🟢 Alta | 1-2 giorni | Evitare |
| Deal diversi, stesso stile | ✅ Alta | 🟢 Nullo | 🟡 Media | 1-2 settimane | Usare come baseline |
| Stile scrittura | ✅ Alta | 🟢 Nullo | 🟢 Alta | 1 settimana | **PRIORITÀ 1** |
| Struttura post | ✅ Alta | 🟢 Nullo | 🟢 Alta | 1 settimana | **PRIORITÀ 2** |
| Orario pubblicazione | ✅ Media | 🟢 Nullo | 🟡 Media | 2-4 settimane | Secondario |
| Test settimanali | ⚠️ Media | 🟢 Nullo | 🟡 Media-Bassa | 2+ settimane | Solo canali maturi |

---

## 3. Raccomandazione Strategica per Afflyt

### Approccio Ibrido "Style + Structure Testing"

**Fase 1 (Settimane 1-2)**: Test su stile
- Rotazione random di 3 varianti di tono/emoji
- Tracking per categoria
- Nessuna modifica strutturale

**Fase 2 (Settimane 3-4)**: Test su struttura
- Fisso lo stile vincente dalla Fase 1
- Rotazione di 3 template strutturali
- Analisi per fascia oraria

**Fase 3 (Ongoing)**: Ottimizzazione continua
- Combinazione stile + struttura vincenti
- Multi-armed bandit per fine-tuning
- A/B sporadici per nuove varianti

---

## 4. Considerazioni per l'Implementazione LLM

Il modello LLM di Afflyt deve supportare:

1. **Template parametrici**: strutture fisse con slot variabili
2. **Style tokens**: istruzioni di tono nel prompt
3. **Variant tagging**: ogni output deve essere taggato con variant_id
4. **Determinismo controllato**: stesso seed per replicabilità dei test

**Esempio di prompt strutturato**:
```python
PROMPT_TEMPLATE = """
Genera un post per Telegram con le seguenti caratteristiche:
- Prodotto: {product_name}
- Prezzo: {price}€ (era {original_price}€)
- Sconto: {discount}%
- Stile: {style_variant}  # "urgente" | "informativo" | "casual"
- Struttura: {structure_variant}  # "price_first" | "product_first" | "urgency_first"
- Emoji level: {emoji_level}  # 0 | 1 | 2
- Lunghezza max: {max_chars} caratteri

Output SOLO il testo del post, nessuna spiegazione.
"""
```

---

*Continua in: 02-limiti-tecnici-telegram.md*
