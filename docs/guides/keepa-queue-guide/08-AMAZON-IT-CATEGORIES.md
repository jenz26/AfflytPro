# Amazon Italia - Categorie Keepa

> **Ultimo aggiornamento:** Dicembre 2024
> **Fonte:** Keepa Category API (domain 8 = Italia)
> **Tokens utilizzati:** 1 token

## Panoramica

Questo documento contiene tutti i codici categoria ufficiali per Amazon.it, ottenuti direttamente dall'API Keepa. Questi ID sono necessari per:
- Filtrare i deals per categoria nell'API Deals
- Cercare prodotti per categoria
- Configurare le automazioni utente

---

## Categorie Root (Principali)

| ID | Nome (IT) | Nome (EN) | Prodotti | Gated |
|---|---|---|---|---|
| 5512286031 | Moda | Fashion | 79.466.144 | ⚠️ Sì |
| 524015031 | Casa e cucina | Home & Kitchen | 64.905.804 | No |
| 1571280031 | Auto e Moto | Automotive | 28.189.443 | No |
| 2454160031 | Fai da te | Tools & Home Improvement | 22.806.245 | No |
| 411663031 | Libri | Books | 20.864.599 | No |
| 412609031 | Elettronica | Electronics | 17.458.484 | No |
| 524012031 | Sport e tempo libero | Sports & Outdoors | 14.633.075 | No |
| 635016031 | Giardino e giardinaggio | Garden & Outdoors | 13.437.620 | No |
| 5866068031 | Commercio, Industria e Scienza | Industrial & Scientific | 13.182.053 | No |
| 425916031 | Informatica | Computers | 7.379.654 | No |
| 12472499031 | Prodotti per animali domestici | Pet Supplies | 6.455.136 | No |
| 523997031 | Giochi e giocattoli | Toys & Games | 6.218.419 | No |
| 6198082031 | Bellezza | Beauty & Personal Care | 6.207.673 | ⚠️ Sì |
| 3606310031 | Cancelleria e prodotti per ufficio | Office Products | 5.475.793 | No |
| 1571289031 | Salute e cura della persona | Health & Personal Care | 4.730.054 | No |
| 1748203031 | Musica Digitale | Digital Music | 4.068.220 | No |
| 1571292031 | Illuminazione | Lighting | 3.689.185 | No |
| 412600031 | CD e Vinili | CDs & Vinyl | 3.311.479 | No |
| 1571286031 | Prima infanzia | Baby | 3.027.727 | No |
| 3628629031 | Strumenti musicali | Musical Instruments | 3.024.455 | No |
| 14437356031 | Grandi elettrodomestici | Large Appliances | 1.062.973 | No |
| 412606031 | Film e TV | Movies & TV | 1.012.815 | No |
| 6198092031 | Alimentari e cura della casa | Grocery & Gourmet Food | 866.200 | ⚠️ Sì |
| 425919031 | Altro | Other | 800.789 | No |
| 412603031 | Videogiochi | Video Games | 723.428 | ⚠️ Sì |
| 1661660031 | App e Giochi | Apps & Games | 590.738 | No |
| 16296149031 | Prime Video | Prime Video | 106.769 | No |
| 412612031 | Software | Software | 27.737 | No |
| 17941651031 | Audiolibri Audible e Original | Audible Audiobooks | 12.461 | No |
| 13944605031 | Skill Alexa | Alexa Skills | 6.886 | No |
| 22942555031 | Amazon Luxury | Amazon Luxury | 6.574 | No |
| 818937031 | Kindle Store | Kindle Store | 3.102 | No |
| 9699425031 | Prodotti Handmade | Handmade | 2.502 | No |
| 3557017031 | Buoni regalo | Gift Cards | 1.694 | No |
| 12598749031 | Dispositivi Amazon & Accessori | Amazon Devices | 469 | No |
| 9839998031 | Bellezza Premium | Premium Beauty | 21 | No |

---

## Categorie Consigliate per Affiliati

Le migliori categorie per l'affiliate marketing su Amazon.it sono quelle con:
- ✅ Non gated (nessuna approvazione richiesta)
- ✅ Alto volume di prodotti (più deals disponibili)
- ✅ Buon potenziale di sconto
- ✅ Competizione ragionevole

### Top 10 Categorie Raccomandate

| Rank | Categoria | ID | Perché |
|---|---|---|---|
| 1 | Casa e cucina | 524015031 | Altissimo volume, sconti frequenti 20-35% |
| 2 | Fai da te | 2454160031 | Volume elevato, competizione media |
| 3 | Elettronica | 412609031 | Sempre richiesta, sconti 15-25% |
| 4 | Sport e tempo libero | 524012031 | Buon volume, sconti 20-40% |
| 5 | Giardino e giardinaggio | 635016031 | Stagionale ma sconti ottimi |
| 6 | Informatica | 425916031 | Alto valore medio ordine |
| 7 | Giochi e giocattoli | 523997031 | Ottimo per Black Friday/Natale |
| 8 | Salute e cura della persona | 1571289031 | Acquisti ricorrenti |
| 9 | Prima infanzia | 1571286031 | Genitori sempre in cerca di offerte |
| 10 | Auto e Moto | 1571280031 | Nicchia meno competitiva |

---

## Categorie da Evitare (per Affiliati Principianti)

| Categoria | ID | Motivo |
|---|---|---|
| Moda | 5512286031 | Gated + competizione altissima |
| Bellezza | 6198082031 | Gated + saturato |
| Alimentari | 6198092031 | Gated + margini bassi |
| Videogiochi | 412603031 | Gated + prezzi fissi |
| Musica Digitale | 1748203031 | Margini quasi nulli |
| Prime Video | 16296149031 | Non genera commissioni affiliate |

---

## Uso nell'API Keepa

### Esempio: Fetch deals per categoria

```typescript
// Keepa Deals API - filtrare per Elettronica
const selection = {
    page: 0,
    domainId: 8,  // Italia
    includeCategories: [412609031],  // Elettronica
    deltaPercentRange: [10, 100],    // Min 10% sconto
    hasReviews: true
};

const response = await axios.get('https://api.keepa.com/deal', {
    params: {
        key: KEEPA_API_KEY,
        selection: JSON.stringify(selection)
    }
});
```

### Esempio: Ricerca prodotti per categoria

```typescript
// Keepa Product API - cercare in Informatica
const response = await axios.get('https://api.keepa.com/search', {
    params: {
        key: KEEPA_API_KEY,
        domain: 8,
        type: 'category',
        term: '425916031'  // Informatica
    }
});
```

---

## Script per Aggiornare le Categorie

Se hai bisogno di ri-fetchare le categorie (es. Keepa aggiunge nuove categorie):

```bash
cd apps/api
npx ts-node src/scripts/fetch-keepa-categories.ts
```

Il script salva i risultati e mostra un array TypeScript pronto per essere copiato.

---

## Note Tecniche

### Differenza tra Category ID e Root Category

- **Category ID** (`categories[]`): Array di tutte le categorie del prodotto (incluse sottocategorie)
- **Root Category** (`rootCat`): La categoria principale/parent

Quando filtri per categoria nell'API Deals, usa `includeCategories` con gli ID root.

### Costo Token

- **Category Lookup**: ~1 token per richiesta
- **Deals API con filtro categoria**: ~5 token per richiesta
- **Product API**: ~1 token per ASIN

---

## Changelog

| Data | Modifica |
|---|---|
| 2024-12 | Prima versione - fetch completo da Keepa API |

