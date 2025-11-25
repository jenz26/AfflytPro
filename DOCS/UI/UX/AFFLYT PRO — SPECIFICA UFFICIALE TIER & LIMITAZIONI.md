---

# 📘 **AFFLYT PRO — SPECIFICA UFFICIALE TIER & COMPLIANCE**

### Versione 2.0 – completamente aggiornata dopo analisi normativa

---

# 🧩 **1. Contesto: Qual è il vero vincolo Amazon?**

Amazon **NON obbliga** ad aggiornare i prezzi entro 60 minuti *a meno che tu usi la PA-API*.
Tu **non la usi**, quindi il vincolo **non si applica**.

Gli obblighi generali del Programma Affiliati sono:

### ✔ Accuratezza del contenuto

* Non puoi presentare un prezzo palesemente obsoleto come “attuale”.

### ✔ Disclaimer obbligatorio

* Devi informare che il prezzo può variare.

### ✔ Timestamp raccomandato

* Serve a evitare accuse di “misleading pricing”.

### ✔ Nessun cloaking nei link

* Interstitial obbligatorio: “Redirecting to Amazon”.

### ✔ No machine learning su dati Amazon o derived

* Include dati Keepa.

Questi sono i veri obblighi, NON i TTL PA-API.

---

# ⚙️ 2. Principio guida dei nuovi Tier

I Tier devono riflettere:

* **Costi operativi** (Keepa token usage)
* **Qualità del dato** (freshness)
* **Valore commerciale** (feature premium)
* **Scalabilità** (pro vs agency)
* **Risk mitigation** (accuratezza e trasparenza)

---

# 🟦 **3. FREE PLAN — “Starter”**

### 🎯 Obiettivo

Far entrare l’utente, fargli vedere valore, controllare i costi, senza rischio.

---

## **Funzionalità incluse**

| Feature               | Free                   |
| --------------------- | ---------------------- |
| Automazioni attive    | **1**                  |
| Regole totali         | 2                      |
| Canali supportati     | 1                      |
| Deal Score            | MinScore **fisso ≥85** |
| Frequenza automazioni | **Ogni 6 ore**         |
| Refresh Keepa         | **Ogni 4–6h**          |
| Analytics             | Base                   |
| AI Copy GPT           | ❌                      |
| A/B Testing           | ❌                      |
| Multi-canale          | ❌                      |
| Template premium      | ❌                      |

---

## **Motivazione**

### 🔹 Compliance

* Score ≥85 riduce il rischio di mostrare offerte non interessanti o con dati stantii.
* Dati meno freschi sono accettabili *se* mostri timestamp → OK.

### 🔹 Business

* Chiunque voglia usare Afflyt seriamente sentirà subito la limitazione.
* Ottimo per onboarding, pessimo per crescita → perfetto.

### 🔹 Costi Keepa

* Limita consumi token.

---

# 🟩 **4. PRO PLAN — “Creator Pro”**

### 🎯 Obiettivo

Il piano principale: potente, scalabile, senza costi eccessivi.

---

## **Funzionalità incluse**

| Feature               | Pro                                       |
| --------------------- | ----------------------------------------- |
| Automazioni attive    | **7**                                     |
| Regole totali         | 10                                        |
| Canali                | 5                                         |
| Deal Score            | MinScore **≥70** (regolabile dall’utente) |
| Frequenza automazioni | **Ogni 2–3h**                             |
| Refresh Keepa         | 1–3h (non obbligatorio, ma consigliato)   |
| Refresh “on publish”  | **se dati > 12h**                         |
| A/B Testing           | ✔                                         |
| AI Copy GPT           | ✔                                         |
| Template premium      | ✔                                         |
| Multi-canale          | ✔                                         |
| Analytics avanzate    | ✔                                         |

---

## **Motivazione**

### 🔹 Compliance

* Nessun obbligo PA-API → refresh 1–3h solo come best practice.
* L’unico obbligo reale è mostrare:
  `Ultimo aggiornamento: X ore/min fa`.

### 🔹 Business

* Il Pro deve sentirsi *pro*, con tutte le feature cruciali.
* A/B testing e AI copy sbloccano conversioni enormi.

### 🔹 Costi & Scalabilità

* Refresh più frequenti, ma senza spreco Keepa.
* “On publish refresh” evita di postare dati vecchi senza bruciare token inutili.

---

# 🟧 **5. BUSINESS PLAN — “Agency / Enterprise”**

### 🎯 Obiettivo

Per canali grandi, team multipli, agenzie Telegram.

---

## **Funzionalità incluse**

| Feature                | Business                         |
| ---------------------- | -------------------------------- |
| Automazioni attive     | **∞**                            |
| Regole totali          | **∞**                            |
| Canali                 | **∞**                            |
| Deal Score             | Nessun limite (0–100)            |
| Frequenza automazioni  | **Ogni 30–90 min**               |
| Refresh Keepa          | 30–90 min                        |
| Refresh “on publish”   | Sempre                           |
| A/B Testing            | Avanzato                         |
| AI GPT                 | Avanzato (tone, presets, memory) |
| Webhooks / API         | ✔                                |
| Team access            | ✔                                |
| Priority queue         | ✔                                |
| Deal Finder potenziato | ✔                                |

---

## **Motivazione**

### 🔹 Compliance

* Timestamp sempre incluso → nessun rischio.
* Refresh più frequenti → più accuratezza → più conversioni.

### 🔹 Valore commerciale

Per loro la freshness è business-critical.
Non perché Amazon lo richiede, ma perché:

* se pubblichi 30 offerte al giorno
* la differenza tra dati freschi e vecchi = €€€

### 🔹 Costi

Il Business paga perché *costano* i loro refresh e i loro token.

---

# 🔍 **6. Nuove regole universali (compliance vere, non PA-API)**

## 6.1 **Obbligo timestamp**

Ogni offerta deve mostrare:

```
⏰ Ultimo aggiornamento: 2h 14m fa
Verifica su Amazon prima dell'acquisto.
```

## 6.2 **Obbligo disclaimer**

```
I prezzi possono variare. #ad
```

## 6.3 **Obbligo interstitial**

Il redirect `afflyt.pro/r/...` deve essere trasparente:

```
Redirecting to Amazon...
```

## 6.4 **Vietato ML training**

Deal Score ok
Predizioni ML → vietate
(Nessun “predictor di prezzo futuro” sui dati Amazon/Keepa)

---

# 📦 **7. Perché questo modello è perfetto per Afflyt Pro**

### ✔ Non rompe nessuna policy Amazon

Né PA-API, né Programma Affiliati.

### ✔ È sostenibile con Keepa

Refresh calibrati al Tier.

### ✔ Ha senso business

Il salto da Free → Pro → Business è naturale, non forzato.

### ✔ Evita rischi legali

Timestamp + disclaimer sono inattaccabili.

### ✔ Evita rischi operativi

Refresh su publish garantisce qualità reale.

---
