# Afflyt Pro - Keepa Token Queue System

## Overview

Questo documento descrive l'architettura del sistema di gestione token Keepa per Afflyt Pro. Il sistema ottimizza l'uso dei token Keepa attraverso un cache collaborativo e una coda intelligente con priorità.

---

## Problema da Risolvere

Keepa ha un rate limit di **20 token/minuto** (primo tier, €49/mese). Con più utenti che hanno automazioni attive, dobbiamo:

1. Non sprecare token in momenti di inattività
2. Non far aspettare troppo gli utenti quando c'è carico
3. Garantire dati freschi a TUTTI gli utenti, indipendentemente dal piano
4. Scalare in modo sostenibile col crescere della user base

---

## Decisioni Chiave

### 1. Cache Collaborativo (non Discovery attivo)

**Decisione:** Il database si popola come effetto collaterale dell'uso reale delle automazioni, non tramite discovery attivo.

**Motivazione:**
- Non ha senso tenere un DB aggiornato se i dati non vengono usati rapidamente
- Le automazioni degli utenti determinano quali categorie sono "calde"
- Più utenti su una categoria = più valore nel tenerla aggiornata

**Flusso:**
```
Automazione triggera → Check cache
    ↓
├── Dato fresco? → Usa e pubblica
└── Dato stale? → Query Keepa → Salva → Pubblica
    ↓
    Altre automazioni sulla stessa categoria beneficiano
```

### 2. TTL Uguale per Tutti

**Decisione:** Il TTL del cache (30-60 minuti) è identico per tutti i piani.

**Motivazione:**
- Se un utente Free posta un deal morto, pensa "questa piattaforma fa schifo", non "devo pagare per avere dati migliori"
- La differenziazione avviene su volume/funzionalità, non sulla qualità del dato
- Un dato stale è un problema per TUTTI, non solo per i Free

### 3. Differenziazione per Volume

| Piano | Automazioni | Post/giorno | Filtri | Extra |
|-------|-------------|-------------|--------|-------|
| Free | 1 | 5 | Base | - |
| Starter | 5 | 20 | Avanzati | - |
| Pro | 20 | Illimitato | Tutti | Analytics |
| Business | 100 | Illimitato | Tutti | API, Multi-canale |

### 4. Deduplicazione Job per Categoria

**Decisione:** Se N automazioni sulla stessa categoria triggerano nello stesso minuto, creiamo UN solo job Keepa.

**Motivazione:**
- È il fulcro della strategia di ottimizzazione token
- 5 automazioni su "Informatica" = 1 chiamata Keepa, 5 pubblicazioni con filtri diversi
- Più utenti attivi = maggiore efficienza del sistema

### 5. Zero Token Sprecati

**Decisione:** Quando la coda è vuota, usiamo i token per pre-fetch intelligente.

**Motivazione:**
- I token non usati sono persi (non si accumulano)
- Di notte prepariamo i dati per le automazioni della mattina
- Il sistema è sempre al lavoro, mai idle

---

## Modello di Scaling

```
Utenti crescono
    ↓
Più automazioni su stesse categorie
    ↓
Cache più efficiente (più hit, meno chiamate)
    ↓
Quando saturiamo i 20 token/min
    ↓
Upgrade piano Keepa (49€ → 129€ = 3x token)
    ↓
Costo scala con ricavi (utenti paganti)
```

I piani Keepa disponibili vanno da 20 token/min (€49) fino a 16.000 token/min (€17.649). C'è spazio per scalare.

---

## Stack Tecnologico

- **Database:** PostgreSQL (Prisma) su Railway
- **Queue/Cache:** Redis su Railway (o Upstash)
- **Backend:** Node.js su Railway
- **Frontend:** Next.js su Vercel
- **Scheduling:** node-cron

---

## File di Questa Documentazione

1. `01-OVERVIEW.md` - Questo file
2. `02-ARCHITECTURE.md` - Architettura e flussi dati
3. `03-QUEUE-SYSTEM.md` - Sistema di coda con priorità
4. `04-CACHE-SYSTEM.md` - Cache collaborativo e TTL
5. `05-PREFETCH.md` - Pre-fetch intelligente
6. `06-IMPLEMENTATION.md` - Codice TypeScript completo
7. `07-MONITORING.md` - Metriche e alerting

---

*Documento creato: 2025-11-27*
*Versione: 1.0*
