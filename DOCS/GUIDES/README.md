# 📚 Guide Afflyt Pro

Benvenuto nella cartella delle guide di Afflyt Pro! Questa cartella contiene tutta la documentazione per aiutare gli utenti a ottenere il massimo dalla piattaforma.

---

## 📁 Struttura

```
DOCS/GUIDES/
├── README.md                    # Questo file
├── telegram-bot-setup.md        # Guida setup bot Telegram
├── first-automation.md          # [DA CREARE] Prima automazione
├── deal-score-optimization.md   # [DA CREARE] Ottimizzare Deal Score
└── ... altre guide
```

---

## ✍️ Come Aggiungere una Nuova Guida

### 1. Crea il file Markdown

Crea un nuovo file `.md` in questa cartella con un nome descrittivo:

```bash
# Esempio
DOCS/GUIDES/discord-integration.md
DOCS/GUIDES/advanced-filters.md
DOCS/GUIDES/api-usage.md
```

### 2. Usa il Template Standard

Ogni guida dovrebbe seguire questo formato:

```markdown
# 🎯 Titolo della Guida

> **Tempo stimato:** X minuti
> **Difficoltà:** Principiante | Intermedio | Avanzato
> **Ultimo aggiornamento:** GG Mese AAAA

---

## 📋 Cosa ti serve

Prima di iniziare...

---

## 🚀 Passo 1: [Nome Passo]

### 1.1 Sottopasso

Descrizione dettagliata...

---

## ❓ Troubleshooting Comuni

### 🔴 Problema X

**Causa:** ...
**Soluzione:** ...

---

## 🚀 Prossimi Passi

- [Link ad altra guida](./altra-guida.md)

---

## 📞 Hai bisogno di aiuto?

Contatti support...
```

### 3. Aggiungi alla Pagina Help

Una volta creata la guida, devi collegarla alla pagina Help:

#### 3.1 Aggiorna le traduzioni

Modifica i file di traduzione per aggiungere il nuovo link:

**File:** `apps/web/messages/it.json`

```json
{
  "help": {
    "sections": {
      "tuaSezione": {
        "title": "Titolo Sezione",
        "guides": {
          "nuovaGuida": "Nome Guida",
          "nuovaGuidaDesc": "Breve descrizione"
        }
      }
    }
  }
}
```

**File:** `apps/web/messages/en.json` (stessa struttura in inglese)

#### 3.2 Aggiorna la pagina Help

**File:** `apps/web/app/[locale]/help/page.tsx`

Aggiungi il nuovo link nell'array appropriato:

```typescript
const sections: GuideSection[] = [
  {
    icon: TuaIcona,
    title: t('sections.tuaSezione.title'),
    guides: [
      // ... guide esistenti
      {
        title: t('sections.tuaSezione.guides.nuovaGuida'),
        description: t('sections.tuaSezione.guides.nuovaGuidaDesc'),
        href: '#link-guida',
        isNew: true  // opzionale: mostra badge "NEW"
      }
    ]
  }
];
```

---

## 🎨 Linee Guida di Stile

### Tono

- **Amichevole ma professionale**: "Ciao! Vediamo come..."
- **Chiaro e conciso**: Vai dritto al punto
- **Step-by-step**: Numera i passaggi
- **Pratico**: Usa esempi reali

### Formattazione

#### Icone (Lucide Icons)

**IMPORTANTE:** Usa emoji nel markdown - verranno automaticamente convertite in icone Lucide professionali!

**Icone disponibili:**

| Emoji | Icona | Quando usare |
|-------|-------|--------------|
| ✅ | CheckCircle | Successo, completato, checklist |
| ❌ | XCircle | Errore, fallito, no |
| ⚠️ | AlertTriangle | Warning, attenzione, importante |
| 💡 | Lightbulb | Tip, suggerimento, idea |
| ℹ️ | Info | Informazione generale |
| 🚀 | Rocket | Inizio, launch, setup |
| ⚡ | Zap | Veloce, potente, automazione |
| 🎯 | Target | Obiettivo, focus, targeting |
| 🔥 | Flame | Hot, critico, importante |
| 🤖 | Bot | Bot, automazione, AI |
| 📊 | BarChart3 | Analytics, statistiche, dashboard |
| 💰 | DollarSign | Monetizzazione, prezzo, revenue |
| 📈 | TrendingUp | Crescita, miglioramento, trend |
| 🔗 | Link2 | Collegamenti, integrazione |
| ⏱️ | Clock | Tempo, durata, deadline |
| 📅 | Calendar | Data, evento, scheduling |
| 📧 | Mail | Email, contatto |
| 💬 | MessageCircle | Chat, messaggio, support |
| 📞 | Phone | Telefono, chiamata |
| 🔑 | Key | Password, token, API key |
| 🛡️ | Shield | Sicurezza, protezione |
| 👍 | ThumbsUp | Like, approvazione |
| 👎 | ThumbsDown | Dislike, sconsigliato |
| ⭐ | Star | Rating, preferito, importante |
| 📚 | Book | Documentazione, guida |
| 📹 | Video | Video tutorial |
| ⚙️ | Settings | Configurazione, impostazioni |

**Esempio:**
```markdown
## 🚀 Passo 1: Setup

- ✅ Completa configurazione
- ⚠️ Controlla permessi
- 💡 **Tip:** Usa token sicuri
```

Verrà renderizzato con icone Lucide professionali invece delle emoji!

#### Code Blocks

Per comandi:
```bash
npm install
```

Per codice:
```typescript
const example = "value";
```

Per output:
```
Output di esempio
```

#### Callout Boxes

```markdown
> 💡 **Tip:** Messaggio utile
> ⚠️ **Importante:** Attenzione a questo
> 🔴 **ERRORE:** Evita di fare questo
```

#### Screenshot

Se possibile, aggiungi screenshot:

```markdown
![Descrizione immagine](../assets/screenshots/nome-file.png)
```

---

## 📊 Checklist per una Guida Completa

Prima di pubblicare, verifica:

- [ ] Titolo chiaro e descrittivo
- [ ] Metadata (tempo, difficoltà, data)
- [ ] Sezione "Cosa ti serve"
- [ ] Passaggi numerati e chiari
- [ ] Screenshot o esempi dove utile
- [ ] Sezione Troubleshooting
- [ ] Link a guide correlate
- [ ] Info di contatto support
- [ ] Data ultimo aggiornamento
- [ ] Nessun typo o errore grammaticale
- [ ] Testata su utente reale (se possibile)

---

## 🔄 Aggiornamenti

Quando aggiorni una guida esistente:

1. Modifica il file `.md`
2. Aggiorna la data in `**Ultimo aggiornamento:**`
3. Se sono cambi significativi, incrementa la versione
4. Considera di aggiungere un changelog in fondo:

```markdown
---

## 📝 Changelog

### v1.1 - 25 Nov 2025
- Aggiunto metodo alternativo per trovare Channel ID
- Migliorate istruzioni per canali privati

### v1.0 - 24 Nov 2025
- Prima versione pubblicata
```

---

## 🎯 Guide Prioritarie da Creare

### Alta Priorità

- [ ] **first-automation.md** - Prima automazione passo-passo
- [ ] **deal-score-explained.md** - Come funziona il Deal Score
- [ ] **api-limits-management.md** - Gestire i limiti API
- [ ] **dashboard-metrics.md** - Leggere le metriche

### Media Priorità

- [ ] **discord-integration.md** - Setup Discord bot
- [ ] **email-automation.md** - Automazione email
- [ ] **advanced-filters.md** - Filtri avanzati
- [ ] **roi-tracking.md** - Tracking ROI e conversioni

### Bassa Priorità

- [ ] **webhooks-custom.md** - Webhook personalizzati
- [ ] **api-integration.md** - Integrare con API
- [ ] **troubleshooting-common.md** - Problemi comuni
- [ ] **best-practices-affiliate.md** - Best practices affiliazione

---

## 🌐 Localizzazione

### Sistema Automatico

Il sistema legge automaticamente il file corretto in base al locale:

**Italiano (default):**
```
telegram-bot-setup.md
```

**Inglese:**
```
telegram-bot-setup-en.md
```

### Come Funziona

1. L'utente visita `/en/help/guides/telegram-bot-setup`
2. Il sistema cerca prima `telegram-bot-setup-en.md`
3. Se non esiste, fallback a `telegram-bot-setup.md`

### Creare Versione Multilingua

1. Crea la versione italiana: `nome-guida.md`
2. Crea la versione inglese: `nome-guida-en.md`
3. Traduci tutto il contenuto
4. Mantieni la stessa struttura (headings, sezioni)

**File supportati:**
```
telegram-bot-setup.md       ← IT (default)
telegram-bot-setup-en.md    ← EN
```

**Future lingue:**
```
telegram-bot-setup-es.md    ← Spagnolo
telegram-bot-setup-de.md    ← Tedesco
```

---

## 📞 Contatti

Per domande sulla documentazione:

- **Email:** docs@afflyt.io
- **Slack:** #documentation-team
- **Issues:** Apri un issue su GitHub

---

## 🎉 Contribuire

Tutti possono contribuire alla documentazione!

1. Crea la tua guida seguendo questo README
2. Fai un pull request con:
   - Il file `.md` della guida
   - Le modifiche alle traduzioni
   - Le modifiche alla pagina Help
3. Il team revisiona e fa merge

**Grazie per aiutarci a creare la migliore documentazione! 🚀**

---

**Ultimo aggiornamento:** 24 Novembre 2025
**Maintainer:** Team Afflyt Pro
