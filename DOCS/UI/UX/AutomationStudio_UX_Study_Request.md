# UX Study Request: Automation Studio Page

## Context
AfflytPro è una piattaforma SaaS per affiliate marketers Amazon. Hai già creato gli studi UX per:
- Dashboard principale (Command Center)
- Settings (Credentials & Channels)
- Deal Finder

Ora serve lo studio per **Automation Studio** - la pagina più importante del sistema.

---

## Cosa Fa la Pagina

L'Automation Studio permette agli utenti di creare **regole di automazione** che:

1. **Trovano automaticamente** prodotti Amazon che matchano criteri specifici
2. **Calcolano il Deal Score** (0-100) per ogni prodotto
3. **Filtrano** i prodotti sotto una soglia minima
4. **Generano link affiliati** automaticamente
5. **Pubblicano** i deal su canali Telegram/Discord

È essenzialmente un **"mission control"** dove l'utente configura "agenti intelligenti" che lavorano 24/7.

---

## Chi Usa Questa Pagina

**Profilo Utente**:
- Affiliate marketer esperto
- Gestisce 1-10 canali Telegram/Discord
- Vuole automatizzare la ricerca e pubblicazione di deal
- Ha poco tempo, vuole efficienza massima
- Skill tecnico: medio-alto

**Obiettivi**:
- Creare regole in < 3 minuti
- Capire a colpo d'occhio quali regole performano
- Testare regole prima di attivarle
- Modificare/disattivare regole rapidamente

---

## Struttura Tecnica (Backend Già Implementato)

### Automation Rule
```typescript
{
  name: string;              // "Hot Deals Electronics"
  description?: string;      // Opzionale
  isActive: boolean;         // On/Off
  
  // Targeting
  categories: string[];      // ["Electronics", "Computers"]
  minScore: number;          // 0-100 (threshold)
  maxPrice?: number;         // Opzionale
  
  // Publishing
  channelId?: string;        // Dove pubblicare
  
  // Stats
  totalRuns: number;         // Quante volte eseguita
  lastRunAt?: Date;          // Ultima esecuzione
}
```

### API Disponibili
- `GET /automation/rules` - Lista regole
- `POST /automation/rules` - Crea regola
- `PUT /automation/rules/:id` - Modifica
- `DELETE /automation/rules/:id` - Elimina
- `POST /automation/rules/:id/run` - Esegui manualmente (testing)

### Governance
- Max 10 regole per utente
- Ogni regola può essere attiva o in pausa

---

## Flusso Utente Ideale

1. **Arrivo sulla pagina**: Vede subito tutte le sue regole e il loro stato
2. **Crea nuova regola**: Wizard semplice (2-4 step max)
3. **Testa la regola**: Esegue manualmente per vedere risultati
4. **Attiva la regola**: Toggle on/off immediato
5. **Monitora performance**: Vede quanti deal ha pubblicato ogni regola

---

## Requisiti Funzionali

### Must Have
- Lista/grid delle regole esistenti
- Indicatore visivo stato (attiva/pausa)
- Stats per regola (runs, last execution)
- Creazione guidata (wizard)
- Esecuzione manuale (testing)
- Toggle attiva/pausa
- Eliminazione

### Nice to Have
- Filtri/ricerca regole
- Sorting (per performance, data, etc)
- Duplica regola
- Template pre-configurati
- Grafici performance
- Preview dei deal che verrebbero pubblicati

---

## Design System Esistente

Il progetto usa un tema **"Cyber Intelligence"** con:
- Glassmorphism (backdrop-blur, semi-transparent)
- Gradient accents (cyan, plasma, profit colors)
- Dark theme (#0a0e1a background)
- Componenti: `GlassCard`, `CyberButton`, `KPIWidget`
- Font: Orbitron (headings), Inter (body), Mono (numbers)

**Vibe**: Mission control, futuristico, premium, potente.

---

## Il Tuo Compito

Studia la migliore UX possibile per questa pagina considerando:

1. **Information Architecture**: Come organizzare le regole?
2. **Visual Hierarchy**: Cosa deve emergere subito?
3. **Interaction Design**: Come rendere la creazione/modifica fluida?
4. **Feedback**: Come mostrare risultati esecuzione?
5. **Empty State**: Come onboardare il primo utente?
6. **Mobile**: Come adattare per tablet/mobile?

Fornisci:
- **Wireframes** (anche ASCII va bene)
- **Component breakdown** dettagliato
- **User flows** principali
- **Micro-interactions** importanti
- **Copy/microcopy** suggerito
- **Specifiche tecniche** (classi Tailwind, animazioni, etc)

**Libertà totale**: Proponi la soluzione che ritieni migliore. Non sei vincolato a nulla, solo al design system esistente.

---

**Obiettivo**: Creare la pagina più intuitiva e potente possibile per gestire automazioni. L'utente deve sentirsi un "cyber operator" che controlla agenti intelligenti.
