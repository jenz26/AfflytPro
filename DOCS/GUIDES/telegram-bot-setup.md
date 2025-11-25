# 🤖 Guida Completa: Setup Bot Telegram

> **Tempo stimato:** 5 minuti
> **Difficoltà:** Principiante
> **Ultimo aggiornamento:** 24 Novembre 2025

---

## 📋 Cosa ti serve

Prima di iniziare, assicurati di avere:

- ✅ Un account Telegram attivo
- ✅ Un canale o gruppo Telegram (anche privato va bene)
- ✅ Accesso admin al canale/gruppo
- ✅ Account Afflyt Pro attivo

---

## 🚀 Passo 1: Crea il Bot con BotFather

### 1.1 Apri BotFather

1. Apri l'app Telegram sul tuo dispositivo
2. Cerca `@BotFather` nella barra di ricerca
3. Avvia la chat cliccando su **START**

> 💡 **Nota:** BotFather è il bot ufficiale di Telegram per creare e gestire bot

### 1.2 Crea il tuo bot

1. Invia il comando `/newbot` a BotFather
2. BotFather ti chiederà di scegliere un **nome** per il bot
   - Esempio: `Afflyt Deal Bot`
3. Poi ti chiederà di scegliere uno **username**
   - Deve finire con `bot` (es: `AfflytDealBot` o `mio_deals_bot`)
   - Deve essere unico (se è già preso, provane un altro)

### 1.3 Salva il token

Una volta creato, BotFather ti risponderà con un messaggio simile a questo:

```
Done! Congratulations on your new bot. You will find it at
t.me/AfflytDealBot. You can now add a description...

Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789

Keep your token secure and store it safely, it can be used by
anyone to control your bot.
```

⚠️ **IMPORTANTE:**
- **Copia il token** (la stringa tipo `1234567890:ABC...`)
- **NON condividerlo con nessuno** - è come una password
- Lo userai tra poco nella configurazione di Afflyt

---

## 📢 Passo 2: Aggiungi il Bot al tuo Canale

### 2.1 Apri le impostazioni del canale

1. Vai al tuo canale/gruppo Telegram
2. Clicca sul nome del canale in alto
3. Seleziona **"Amministratori"** o **"Manage channel"**

### 2.2 Aggiungi il bot come amministratore

1. Clicca su **"Aggiungi amministratore"** o **"Add admin"**
2. Cerca il bot usando lo username che hai creato (es: `@AfflytDealBot`)
3. Selezionalo dalla lista

### 2.3 Assegna i permessi necessari

Quando aggiungi il bot come admin, assicurati di abilitare:

- ✅ **Pubblicare messaggi** (Post messages)
- ✅ **Modificare messaggi** (Edit messages) - opzionale
- ⚠️ **DISABILITA** tutti gli altri permessi per sicurezza

> 💡 **Tip:** Il bot ha bisogno SOLO del permesso di pubblicare messaggi. Non dargli altri permessi non necessari.

---

## 🔑 Passo 3: Ottieni il Channel ID

### 3.1 Per canali pubblici

Se il tuo canale è pubblico (ha un username):

- Il Channel ID è semplicemente: `@username_del_canale`
- Esempio: `@mio_canale_deals`

### 3.2 Per canali privati

Se il tuo canale è privato, devi trovare il **numeric ID**:

#### Metodo 1: Usando il bot GetIDs

1. Aggiungi il bot `@getidsbot` al tuo canale temporaneamente
2. Il bot ti invierà automaticamente il Channel ID
3. Il formato sarà tipo: `-1001234567890`
4. Rimuovi `@getidsbot` dal canale dopo

#### Metodo 2: Usando Web Telegram

1. Apri [web.telegram.org](https://web.telegram.org)
2. Vai al tuo canale
3. Guarda l'URL nella barra degli indirizzi
4. Troverai un numero tipo: `https://web.telegram.org/#/im?p=c1234567890`
5. Il Channel ID è: `-100` + quel numero = `-1001234567890`

> ⚠️ **Importante:** I Channel ID privati iniziano SEMPRE con `-100`

---

## ⚙️ Passo 4: Configura in Afflyt Pro

### 4.1 Accedi alla configurazione

1. Vai su Afflyt Pro → **Impostazioni** → **Canali**
2. Clicca su **"Aggiungi Canale"**
3. Seleziona **"Telegram"**

### 4.2 Inserisci le credenziali

1. **Bot Token:** Incolla il token che hai ricevuto da BotFather
   - Esempio: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

2. **Channel ID:** Inserisci l'ID del tuo canale
   - Pubblico: `@mio_canale`
   - Privato: `-1001234567890`

3. **Nome Canale (descrittivo):** Dai un nome per riconoscerlo facilmente
   - Esempio: "Canale Tech Deals Italia"

### 4.3 Testa la connessione

1. Clicca su **"Test Connessione"**
2. Afflyt invierà un messaggio di test al tuo canale
3. Controlla su Telegram che il messaggio sia arrivato
4. Se tutto ok, clicca **"Salva"**

---

## ✅ Passo 5: Verifica e Test

### Checklist finale

Prima di attivare le automazioni, verifica:

- ✅ Il bot è amministratore del canale
- ✅ Il bot ha il permesso "Pubblicare messaggi"
- ✅ Il messaggio di test è arrivato correttamente
- ✅ Il token è salvato in modo sicuro
- ✅ La configurazione è attiva su Afflyt

### Test manuale

1. Vai su **Automazioni** → crea una regola di test
2. Imposta il canale Telegram appena configurato
3. Esegui manualmente la regola
4. Verifica che i deal vengano pubblicati sul canale

---

## 🎯 Formato dei Messaggi

I messaggi pubblicati da Afflyt avranno questo formato:

```
🔥 HOT DEAL ALERT!

Apple AirPods Pro (2ª gen) con cancellazione del rumore

💰 Prezzo: €159.99 ~€279.00~
💸 Risparmi: €119.01 (-43%)
⭐ Rating: 4.7/5 (12.453 recensioni)

👉 [Vedi su Amazon](short.afflyt.io/xyz)

#Ad | Deal trovato da Afflyt Pro 🤖
```

Con:
- ✅ Immagine del prodotto
- ✅ Link affiliato tracciato
- ✅ Bottone inline "Vai su Amazon"
- ✅ Dati sempre aggiornati

---

## ❓ Troubleshooting Comuni

### 🔴 Il bot non pubblica messaggi

**Possibili cause:**
1. ❌ Bot non è amministratore → Aggiungi come admin
2. ❌ Manca permesso "Pubblicare messaggi" → Abilita il permesso
3. ❌ Token errato → Verifica e reinserisci il token
4. ❌ Channel ID sbagliato → Ricontrolla l'ID (deve iniziare con `-100` per canali privati)

**Soluzione:**
```bash
1. Verifica che il bot appaia nella lista amministratori
2. Controlla i permessi del bot
3. Rimuovi e ri-aggiungi il bot se necessario
4. Testa con il comando "Test Connessione"
```

### 🟡 Messaggio di test non arriva

**Causa probabile:** Cache di Telegram

**Soluzione:**
1. Aspetta 30 secondi
2. Riprova il test
3. Se ancora non funziona, rimuovi e ri-aggiungi il bot

### 🟡 Errore "Chat not found"

**Causa:** Channel ID errato

**Soluzione:**
- Per canali pubblici: assicurati di usare `@username` (con la @)
- Per canali privati: ricontrolla il numeric ID (deve iniziare con `-100`)

### 🔴 Errore "Bot was blocked by the user"

**Causa:** Il bot è stato bloccato o rimosso dal canale

**Soluzione:**
1. Ri-aggiungi il bot al canale
2. Assicurati che sia amministratore
3. Ritesta la connessione

---

## 🚀 Prossimi Passi

Ora che hai configurato il bot Telegram:

1. 📊 [Crea la tua prima automazione](./first-automation.md)
2. ⚙️ [Configura filtri avanzati](./advanced-filters.md)
3. 📈 [Ottimizza il Deal Score](./deal-score-optimization.md)
4. 💰 [Best practices per massimizzare conversioni](./conversion-optimization.md)

---

## 📞 Hai bisogno di aiuto?

Se hai problemi con la configurazione:

- 💬 **Live Chat:** Disponibile 24/7 per utenti PRO (< 2 min di attesa)
- 📧 **Email:** support@afflyt.io (risposta entro 2h)
- 📅 **Video Call:** Prenota una sessione di supporto 1-to-1

---

## 📚 Risorse Aggiuntive

- [Documentazione ufficiale Telegram Bot API](https://core.telegram.org/bots)
- [Come trovare il Channel ID](https://stackoverflow.com/questions/33858927/how-to-obtain-the-chat-id-of-a-private-telegram-channel)
- [Best practices sicurezza bot](https://core.telegram.org/bots/faq#general-questions)

---

**Ultimo aggiornamento:** 24 Novembre 2025
**Versione guida:** 1.0
**Contributori:** Team Afflyt Pro

---

💡 **Hai suggerimenti per migliorare questa guida?** Inviaci un feedback a docs@afflyt.io
