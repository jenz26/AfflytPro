# Report UX/UI: Pagina Redirect Amazon per Afflyt Pro

## Executive Summary

La pagina redirect deve essere un **ponte di fiducia** tra Afflyt e Amazon, non un checkpoint burocratico. L'obiettivo è creare un'esperienza fluida che rispetti i requisiti legali senza compromettere le conversioni.

---

## 1. ARCHITETTURA INFORMATIVA

### Gerarchia dei Contenuti (dal più al meno importante)

```
1. AZIONE PRIMARIA
   └── Bottone "Vai su Amazon" (sempre visibile)

2. CONTESTO PRODOTTO  
   ├── Immagine prodotto
   ├── Nome prodotto
   └── Prezzo e sconto

3. TRASPARENZA
   ├── URL destinazione (amazon.it/dp/...)
   └── Badge stato redirect (Auto/Manuale)

4. COMPLIANCE (presente ma discreta)
   ├── Timestamp prezzo
   └── Disclosure affiliazione
```

---

## 2. LAYOUT E DESIGN

### Layout Desktop (Centered Card)

```
┌────────────────────────────────────────┐
│          [Logo Afflyt] → Amazon         │  <- Header minimo
├────────────────────────────────────────┤
│                                        │
│         ┌──────────────────┐          │
│         │  [Img]           │          │  <- GlassCard principale
│         │                  │          │
│         │  Echo Dot (4ª)   │          │
│         │  €24.99          │          │
│         │  ̶€̶5̶9̶.̶9̶9̶ -58%    │          │
│         │                  │          │
│         │ ┌──────────────┐ │          │
│         │ │ VAI SU AMAZON │ │          │  <- CyberButton primary
│         │ └──────────────┘ │          │
│         │                  │          │
│         │  Auto-redirect   │          │  <- Status indicator
│         │  ━━━━━━━━━━      │          │
│         └──────────────────┘          │
│                                        │
│  🔗 amazon.it/dp/B08N5WR...           │  <- Footer info
│  🕐 Prezzo verificato 2 min fa        │
└────────────────────────────────────────┘
```

### Layout Mobile (Full Width)

```
┌─────────────────┐
│ → Amazon        │  <- Sticky header
├─────────────────┤
│                 │
│  [████ Img ████]│  <- Immagine grande
│                 │
│  Echo Dot (4ª)  │
│  €24.99 (-58%)  │
│                 │
├─────────────────┤
│                 │
│  VAI SU AMAZON  │  <- Sticky bottom
│  ──────────     │  <- Progress bar
└─────────────────┘
```

---

## 3. COMPONENTI UI DETTAGLIATI

### 3.1 Product Card

```tsx
const ProductCard = () => (
  <GlassCard className="max-w-md mx-auto p-6">
    {/* Product Info */}
    <div className="flex gap-4 mb-6">
      <img 
        src={product.image} 
        className="w-20 h-20 object-cover rounded-lg"
      />
      <div className="flex-1">
        <h2 className="text-white font-semibold text-lg line-clamp-2">
          {product.title}
        </h2>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold text-white">
            €{product.currentPrice}
          </span>
          <span className="text-sm line-through text-gray-500">
            €{product.originalPrice}
          </span>
          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-sm rounded">
            -{product.discount}%
          </span>
        </div>
      </div>
    </div>

    {/* Auto-redirect Progress (solo se attivo) */}
    {isAutoRedirect && (
      <div className="mb-4">
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600"
            animate={{ width: ["0%", "100%"] }}
            transition={{ duration: 3 }}
          />
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Redirect automatico attivo
        </p>
      </div>
    )}

    {/* CTA */}
    <CyberButton variant="primary" size="lg" className="w-full">
      <ExternalLink className="w-4 h-4" />
      Vai su Amazon
    </CyberButton>
  </GlassCard>
);
```

### 3.2 Consent Management (First Visit)

```tsx
const ConsentBanner = () => (
  <div className="fixed bottom-0 left-0 right-0 p-4 bg-afflyt-dark-50/95 backdrop-blur border-t border-cyan-500/20">
    <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Zap className="w-5 h-5 text-cyan-400" />
        <p className="text-sm text-white">
          Vuoi il redirect automatico la prossima volta?
        </p>
      </div>
      <div className="flex gap-2">
        <button className="px-4 py-2 text-sm text-gray-400 hover:text-white">
          No, chiedi sempre
        </button>
        <CyberButton variant="primary" size="sm">
          Sì, attiva
        </CyberButton>
      </div>
    </div>
  </div>
);
```

### 3.3 Compliance Footer (Sempre Presente)

```tsx
const ComplianceFooter = () => (
  <div className="mt-8 space-y-2 text-center">
    {/* URL Destinazione */}
    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
      <Link className="w-3 h-3" />
      <span className="font-mono truncate max-w-xs">
        amazon.it/dp/{product.asin}
      </span>
    </div>

    {/* Price Timestamp */}
    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
      <Clock className="w-3 h-3" />
      <span>Prezzo verificato {timeAgo}</span>
    </div>

    {/* Affiliate Disclosure */}
    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
      <Info className="w-3 h-3" />
      <span>Link affiliato - Commissioni su acquisti</span>
    </div>
  </div>
);
```

---

## 4. FLUSSI UTENTE

### 4.1 Primo Accesso

```mermaid
graph LR
    A[Click Link] --> B[Pagina Redirect]
    B --> C[Vede Prodotto]
    C --> D[Click "Vai su Amazon"]
    D --> E[Redirect Inizia]
    E --> F[Banner Consenso Appare]
    F --> G1[Accetta Auto]
    F --> G2[Rifiuta]
    G1 --> H[Salvato + Amazon]
    G2 --> H
```

### 4.2 Utente con Auto-Redirect

```mermaid
graph LR
    A[Click Link] --> B[Pagina Redirect]
    B --> C[Progress Bar 3s]
    C --> D1[Attende]
    C --> D2[Click "Vai Subito"]
    D1 --> E[Amazon dopo 3s]
    D2 --> E[Amazon immediato]
```

---

## 5. STATI E VARIANTI

### Stati della Pagina

| Stato | Descrizione | UI Changes |
|-------|-------------|------------|
| **Loading** | Caricamento dati prodotto | Skeleton loader |
| **Ready Manual** | Pronto, richiede click | Bottone attivo, no progress |
| **Ready Auto** | Countdown in corso | Progress bar animata |
| **Redirecting** | Redirect in corso | Bottone disabilitato |
| **Error** | Link scaduto/invalido | Messaggio errore + torna indietro |

### Varianti per Device

| Device | Modifiche Layout |
|--------|------------------|
| **Mobile** | - Immagine 100x100px<br>- Bottone sticky bottom<br>- Font più grandi<br>- Compliance collapsed |
| **Tablet** | - Layout centrato<br>- Immagine 120x120px |
| **Desktop** | - Max width 480px<br>- Centered card |

---

## 6. COPY E MICROCOPY

### Titoli e CTA

| Elemento | Copy | Alternativa |
|----------|------|-------------|
| **Page Title** | "Un momento..." | "Stai andando su Amazon" |
| **CTA Primary** | "Vai su Amazon →" | "Continua su Amazon" |
| **Auto-redirect** | "Redirect automatico in corso" | "Ti portiamo su Amazon..." |
| **Cancel** | "← Torna indietro" | "Annulla" |

### Messaggi di Stato

```javascript
const messages = {
  autoEnabled: "✨ Redirect automatico attivo",
  manualMode: "🔒 Click manuale richiesto",
  redirecting: "Ti stiamo portando su Amazon...",
  error: "😕 Link non valido o scaduto"
};
```

---

## 7. METRICHE DI SUCCESSO

### KPI Primari
- **Click-through Rate**: >95% (da pagina ad Amazon)
- **Bounce Rate**: <5%
- **Time to Action**: <3 secondi (primo click)
- **Consent Accept Rate**: >70% per auto-redirect

### KPI Secondari
- **Support Tickets**: <1% su "cos'è questa pagina?"
- **Mobile Performance**: Lighthouse >90
- **Load Time**: <500ms (FCP)

---

## 8. TESTING E OTTIMIZZAZIONE

### A/B Test Prioritari

1. **Test Bottone**
   - A: "Vai su Amazon" (neutro)
   - B: "Vedi Offerta su Amazon" (urgenza)

2. **Test Countdown**
   - A: 3 secondi
   - B: 2 secondi
   - C: No auto-redirect default

3. **Test Layout Mobile**
   - A: Bottone sticky bottom
   - B: Bottone inline scrollabile

### Heatmap Tracking
- Click su bottone primario
- Click su "cambia preferenze"
- Scroll depth
- Exit points

---

## 9. IMPLEMENTAZIONE TECNICA

### Performance Requirements
```javascript
// Critical Metrics
FCP: <1.0s   // First Contentful Paint
TTI: <2.0s   // Time to Interactive  
CLS: <0.1    // Cumulative Layout Shift
```

### Progressive Enhancement
```html
<!-- Funziona anche senza JS -->
<noscript>
  <meta http-equiv="refresh" content="0;url=https://amazon.it/dp/...">
</noscript>
```

### Analytics Events
```javascript
// Track everything
gtag('event', 'redirect_page_view', { asin, source });
gtag('event', 'consent_choice', { choice: 'auto' });
gtag('event', 'redirect_complete', { time_on_page });
```

---

## 10. CONCLUSIONE

La pagina redirect deve essere:
- **Veloce**: 3 secondi max dall'arrivo al redirect
- **Chiara**: Un bottone principale, tutto il resto è secondario
- **Legale**: Compliance presente ma non invadente
- **Mobile-first**: Ottimizzata per thumb scrolling
- **Trustworthy**: L'utente deve sentirsi sicuro

Il successo si misura in **conversioni**, non in quanti disclaimer mostriamo. 🚀