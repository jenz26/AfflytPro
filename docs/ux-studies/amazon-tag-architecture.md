# UX Study: Amazon Affiliate Tag Architecture

## Problema Attuale

L'Amazon Tag è attualmente associato al **Canale** (Channel), ma questo limita la flessibilità:
- Un canale può pubblicare solo con 1 tag
- Utenti con più tag devono creare canali duplicati
- Nessuna possibilità di A/B testing tra tag

---

## Analisi Casi d'Uso

### Persona 1: Marco - Affiliate Singolo
- **Profilo**: 1 canale Telegram, 1 tag Amazon personale
- **Necessità**: Semplicità, setup veloce
- **Flusso attuale**: Funziona bene ✅

### Persona 2: Laura - Multi-Niche Affiliate
- **Profilo**: 1 canale Telegram, 3 tag Amazon (tech, casa, bambini)
- **Necessità**: Usare tag diversi per categorie diverse
- **Flusso attuale**: Deve creare 3 canali fake ❌

### Persona 3: Agency - Team Marketing
- **Profilo**: 5 canali, 10 tag clienti diversi
- **Necessità**: Gestione centralizzata, assegnazione flessibile
- **Flusso attuale**: Impossibile gestire correttamente ❌

### Persona 4: Power User - A/B Tester
- **Profilo**: 1 canale, vuole testare 2 tag per vedere quale converte meglio
- **Necessità**: Rotazione tag, analytics per tag
- **Flusso attuale**: Non supportato ❌

---

## Opzioni Architetturali

### Opzione A: Tag su Automazione (Override)
```
Channel (default tag) → Automation (override tag opzionale)
```

**Pro:**
- Backward compatible
- Semplice per uso base
- Flessibile per power users

**Contro:**
- Tag sparsi in più posti
- Difficile avere overview di tutti i tag usati

**UI Changes:**
- Channels: mantiene campo `amazonTag` (default)
- Automations: aggiunge campo `amazonTagOverride` (opzionale)
- Scheduler: aggiunge campo `affiliateTag` (opzionale)

---

### Opzione B: Tag Pool Centralizzato
```
User → TagPool[] → selezione in Automation/Scheduler
```

**Pro:**
- Gestione centralizzata
- Facile vedere tutti i tag
- Riutilizzo semplice
- Base per analytics per tag

**Contro:**
- Più complesso
- Richiede nuova UI per gestione tag
- Migration dei tag esistenti

**UI Changes:**
- Nuova sezione: Settings → Affiliate Tags
- Automations: dropdown selezione tag
- Scheduler: dropdown selezione tag
- Channels: rimuove campo tag (opzionale: mantiene come default)

**Schema DB:**
```prisma
model AffiliateTag {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  tag       String   // es: "afflyt-21"
  label     String   // es: "Tag Principale", "Tag Tech"
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())

  @@unique([userId, tag])
}
```

---

### Opzione C: Sistema Ibrido Evoluto
```
User → TagPool[] (gestione centralizzata)
Channel → defaultTagId (FK a TagPool)
Automation → tagId (FK a TagPool, override)
```

**Pro:**
- Massima flessibilità
- Gestione centralizzata
- Override granulare
- Analytics ready

**Contro:**
- Più complesso da implementare
- UI più articolata

---

## Raccomandazione

### Fase 1: Quick Win (Opzione A)
Implementare override su Automazione mantenendo tag su Channel come default.

**Effort**: Basso (2-3h)
**Impatto**: Risolve 80% dei casi d'uso

### Fase 2: Evoluzione (Opzione B/C)
Se necessario, migrare a Tag Pool centralizzato.

**Effort**: Medio (1-2 giorni)
**Impatto**: Risolve 100% dei casi d'uso + analytics

---

## Wireframes Proposti

### Fase 1: Override su Automazione

```
┌─────────────────────────────────────────────────────────┐
│ Step 4: Impostazioni Avanzate                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Amazon Tag                                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ○ Usa tag del canale (afflyt-21)                │   │
│  │ ○ Usa tag personalizzato: [____________]        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ℹ️ Il tag viene usato per generare i link affiliato    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Fase 2: Tag Pool

```
┌─────────────────────────────────────────────────────────┐
│ Settings → Affiliate Tags                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  I tuoi Tag Amazon                    [+ Aggiungi Tag]  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ⭐ Tag Principale          afflyt-21      [···] │   │
│  │    Tag Tech               techdeals-21    [···] │   │
│  │    Tag Casa               homedeals-21    [···] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  💡 Imposta un tag come predefinito per i nuovi canali  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Selezione Tag in Automazione (Fase 2)

```
┌─────────────────────────────────────────────────────────┐
│ Amazon Tag                                              │
│ ┌─────────────────────────────────────────────────┐    │
│ │ ▼ Seleziona tag                                 │    │
│ ├─────────────────────────────────────────────────┤    │
│ │ ⭐ Tag Principale (afflyt-21)                   │    │
│ │    Tag Tech (techdeals-21)                      │    │
│ │    Tag Casa (homedeals-21)                      │    │
│ │ ─────────────────────────────────               │    │
│ │ + Aggiungi nuovo tag                            │    │
│ └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Decisione

**✅ DECISIONE PRESA: Opzione B - Tag Pool Centralizzato**

**Motivazione:**
- Gli utenti useranno più tag per segmentare le metriche di acquisizione
- Afflyt vende DATI → analytics granulari per tag sono fondamentali
- Valore differenziante rispetto a competitor

---

## Piano di Implementazione

### Database Schema

```prisma
model AffiliateTag {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  tag         String   // es: "afflyt-21"
  label       String   // es: "Tag Principale", "Tag Tech"
  marketplace String   @default("IT") // IT, DE, FR, ES, UK, US
  isDefault   Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations per analytics
  automationRules AutomationRule[]
  scheduledPosts  ScheduledPost[]
  links           Link[]

  @@unique([userId, tag])
  @@index([userId])
}
```

### Migration Plan

1. Creare tabella `AffiliateTag`
2. Migrare tag esistenti da `Channel.amazonTag` → `AffiliateTag`
3. Aggiungere `affiliateTagId` a `AutomationRule`, `ScheduledPost`, `Link`
4. Deprecare `Channel.amazonTag` (mantenerlo per backward compat)

### UI Implementation

#### 1. Nuova pagina: Settings → Affiliate Tags
- Lista tag con CRUD
- Set default tag
- Mostra usage count (quante automazioni/link usano quel tag)

#### 2. Automazione Wizard - Step Aggiuntivo
- Dropdown selezione tag (required)
- Quick-add inline se nessun tag esiste

#### 3. Scheduler Wizard
- Dropdown selezione tag per BOUNTY posts

#### 4. Analytics Dashboard
- Filtro per tag
- Breakdown performance per tag
- Comparazione A/B tra tag

---

## Analytics Schema Extension

```prisma
// Aggiungere a Link model
model Link {
  // ... existing fields
  affiliateTagId  String?
  affiliateTag    AffiliateTag? @relation(fields: [affiliateTagId], references: [id])
}

// Questo permette:
// - Click per tag
// - Conversioni per tag
// - Revenue per tag
// - CTR per tag
```

---

## Next Steps

- [x] ~~Validare con utenti reali~~ → Confermato: multi-tag è prioritario
- [x] ~~Decidere fase di implementazione~~ → Tag Pool (Opzione B)
- [ ] Creare migration Prisma
- [ ] Implementare API CRUD per AffiliateTag
- [ ] Creare UI Settings → Affiliate Tags
- [ ] Aggiornare Automation Wizard
- [ ] Aggiornare Scheduler Wizard
- [ ] Aggiornare Link creation per tracciare tagId
- [ ] Dashboard analytics per tag
