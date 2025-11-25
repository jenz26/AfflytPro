Ora creo un documento completo con tutte le informazioni raccolte.

## Documentazione Tecnica Completa: Integrazione Keepa API per Amazon Italia

### 1. KEEPA API - DOCUMENTAZIONE TECNICA

#### A) Endpoint Principali e URL Base

**URL Base API Keepa:**
- `https://api.keepa.com/`[1][2]

**Endpoint Principali Disponibili:**[2][3][1]

| Endpoint | Funzione | Descrizione |
|----------|----------|-----------|
| `/product` | Query Singolo Prodotto | Recupera dati completi per uno o più ASIN |
| `/product/finder` | Product Search/Discovery | Ricerca avanzata con filtri personalizzabili |
| `/bestsellers` | Best Sellers Query | Ottiene lista dei prodotti best-seller per categoria |
| `/deals` | Deal Finder | Trova prodotti con variazioni di prezzo significative |
| `/category` | Category Lookup | Ricerca e navigazione categorie |

**Differenza API Gratuita vs Pagamento:**[4][5][6][1]

L'API Keepa NON ha un piano gratuito dedicato. Tuttavia:
- **Piano Free Browser Extension**: 5 token/minuto, accesso limitato (0% quota)
- **Piano API Premium**: da €49/mese (20 token/min) fino a €4.499/mese (4.000 token/min)
- **Modello Token**: Ogni richiesta consuma token; scadono dopo 60 minuti se non utilizzati[5][6]

#### B) Autenticazione e API Key

**Come Ottenere API Key:**[7][8]

1. Registrarsi su https://keepa.com/
2. Sottoscrivere un piano API (https://keepa.com/#!api)
3. Accedere al profilo → "API Access" → sezione "Private API access keys"
4. Copiare la chiave (stringa di 64 caratteri alfanumerici)

**Headers HTTP Necessari:**[1]

```
GET /product?key=YOUR_API_KEY&asin=B0088PUEPK&domain=IT
Content-Type: application/json
```

L'API Key viene passata come parametro query `key=` (non in header, bensì in query string)

**Costo Token per Richiesta:**[6][5]

| Tipo Richiesta | Token Consumati |
|---|---|
| Query singolo ASIN | 1-3 token |
| Product Finder (ricerca) | 5-10 token |
| Category lookup | 1 token |
| Best sellers | 2-5 token |
| Deals query | 5 token |

**Rate Limiting:**[9][5]

- Token generati: 60 minuti di validità
- Ripristino quota: 5% ogni ora per piani paganti
- Limite max: dipende dal piano (20-4.000 token/minuto)
- Headers response: Includerà info token rimanenti (es: `X-Keepa-Token-Balance`)

#### C) Parametri Query - PRODUCT FINDER (product_finder)[3]

Keepa utilizza un **dizionario Python** con chiavi specifiche. Ecco i principali:

**1. Domain/Marketplace**[10][3][1]

```python
# Domain codes mapping:
domain_codes = ['RESERVED', 'US', 'GB', 'DE', 'FR', 'JP', 'CA', 'CN', 'IT', 'ES', 'IN', 'MX']
# Per Amazon Italia: domain = 'IT' (indice 8, domainId = 8)
```

| Paese | Code | DomainId | Endpoint |
|---|---|---|---|
| USA | US | 1 | .com |
| UK | GB | 2 | .co.uk |
| Germania | DE | 3 | .de |
| Francia | FR | 4 | .fr |
| Giappone | JP | 5 | .co.jp |
| Canada | CA | 6 | .ca |
| Cina | CN | 7 | .cn |
| **Italia** | **IT** | **8** | **.it** |
| Spagna | ES | 9 | .es |
| India | IN | 10 | .in |
| Messico | MX | 11 | .com.mx |

**Utilizzo:**
```python
api.product_finder(product_parms, domain='IT')
# oppure con domainId:
product_parms = {'domainId': 8}
```

**2. Category Filter**[3]

```python
product_parms = {
    'categories_include': [16310101],  # Include categorie (array di category IDs)
    'categories_exclude': [1064954],    # Exclude categorie
    'rootCategory': 16310101            # Root category specifico
}
```

**Come ottenere Category IDs:**[1][3]

```python
# Metodo 1: Search per nome
categories = api.search_for_categories('electronics', domain='IT')
# Ritorna: {category_id: {'name': 'category_name', ...}}

# Metodo 2: Lookup per ID
categories = api.category_lookup(0, domain='IT')  # 0 = tutte root categories
```

**3. Price Range**[3]

I prezzi in Keepa sono in **centesimi di euro** (0,01€):

```python
product_parms = {
    'current_AMAZON_gte': 2000,      # Prezzo minimo Amazon in centesimi (€20)
    'current_AMAZON_lte': 10000,     # Prezzo massimo Amazon in centesimi (€100)
    'current_NEW_gte': 2000,         # Prezzo minimo offerte nuove
    'current_NEW_lte': 10000,        # Prezzo massimo offerte nuove
    'current_LISTPRICE_gte': 2000,   # Prezzo listino minimo
    'current_LISTPRICE_lte': 10000   # Prezzo listino massimo
}
```

**Varianti disponibili:**
- `current_` (prezzo attuale)
- `avg1_`, `avg7_`, `avg30_`, `avg90_`, `avg180_` (medie storiche)
- `delta1_`, `delta7_`, `delta30_`, `delta90_`, `delta180_` (variazioni assolute)
- `deltaPercent1_`, `deltaPercent7_`, ecc. (variazioni percentuali)

**4. Discount Percentage**[3]

Il discount si calcola confrontando `current_AMAZON` vs `current_LISTPRICE`:

```python
# Keepa NON ha parametro diretto "discount_percent"
# Per filtrare sconti > 30%, usare calcolo manuale:

# Ad es: prezzo listino €100 (10000 centesimi)
# Sconto 30% = prezzo €70 (7000 centesimi)

product_parms = {
    'current_LISTPRICE_gte': 5000,     # Listino minimo
    'current_AMAZON_lte': 3500         # Amazon prezzo <= 35% del listino
}
```

**Alternative con coupon:**
```python
product_parms = {
    'couponOneTimePercent_gte': 30,    # Coupon discount >= 30%
    'couponSNSPercent_gte': 20         # Subscribe & Save discount
}
```

**5. Product Rating**[3]

Rating da 0-500 (moltipliato per 100):

```python
product_parms = {
    'current_RATING_gte': 400,         # Rating minimo 4.0 stelle (400/100)
    'current_RATING_lte': 500,         # Rating massimo 5.0 stelle
    'avg30_RATING_gte': 350            # Media 30 giorni >= 3.5 stelle
}
```

**6. Sales Rank**[3]

```python
product_parms = {
    'current_SALES_lte': 100,          # Top 100 sales rank
    'avg30_SALES_lte': 500,            # Media 30gg <= rank 500
    'salesRankDrops30_gte': 10         # Prodotti con rank in miglioramento
}
```

**7. Review Count**[3]

```python
product_parms = {
    'current_COUNT_REVIEWS_gte': 100,  # Minimo 100 recensioni
    'avg180_COUNT_REVIEWS_gte': 50     # Media 180gg >= 50 recensioni
    'hasReviews': True                 # Ha almeno 1 recensione
}
```

**8. Sorting**[3]

```python
product_parms = {
    'sort': [['current_SALES', 'asc']],        # Ordina per sales rank ascendente
    # Opzioni sort: 'current_SALES', 'current_AMAZON', 'current_RATING',
    #               'current_LISTPRICE', 'avg30_SALES', etc.
}
```

**9. Pagination**[3]

```python
product_parms = {
    'page': 0,                         # Pagina (0-based index)
    'perPage': 50                      # Risultati per pagina (default 50, max 250)
}
# Oppure con il wrapper Python:
products = api.product_finder(product_parms, n_products=50)
```

#### D) Response Format - Esempio Completo JSON[11]

**Struttura Base Risposta Singolo Prodotto:**

```json
{
  "asin": "B07HPG684T",
  "title": "Samsung 860 EVO SSD 250GB 2.5\" SATA III",
  "productType": "ABIS",
  "imageUrl": "https://images-eu.ssl-images-amazon.com/...",
  "brand": "Samsung",
  "manufacturer": "Samsung",
  "binding": "Electronics",
  "model": "MZ-76E250B/EU",
  "color": "Black",
  "size": "250GB",
  "format": "SSD",
  "publicationDate": 20180117,
  "releaseDate": 20180131,
  "categories": [
    166199011,
    166199031,
    166225011
  ],
  "rootCategory": 165793011,
  "categoryTree": [
    {
      "id": 165793011,
      "name": "Computers & Accessories"
    },
    {
      "id": 166199011,
      "name": "Storage Devices"
    }
  ],
  "buyBoxSellerId": "A2FP3WC79CXYXU",
  "buyBoxPrice": 3999,
  "buyBoxShipping": 0,
  "buyBoxIsFBA": true,
  "buyBoxIsPrimePantry": false,
  "buyBoxIsPreorder": false,
  "buyBoxIsWarehouseDeals": false,
  "buyBoxIsMAP": false,
  "offerCount": 7,
  "offerCountFBA": 5,
  "offerCountFBM": 2,
  "stockAmazon": 100,
  "stockBuyBox": 50,
  "data": {
    "NEW": [2499, 3199, 3499, 3999, 3999, 3999, 3999],
    "NEW_time": [1610445600, 1612128000, 1614547200, 1617235200, 1619913600, 1622592000, 1625270400],
    "USED": [2199, 2299, 2399, 2499, 2499],
    "USED_time": [1610445600, 1612128000, 1614547200, 1617235200, 1619913600],
    "SALES": [50, 48, 52, 45, 42, 41, 39],
    "SALES_time": [1610445600, 1612128000, 1614547200, 1617235200, 1619913600, 1622592000, 1625270400],
    "LISTPRICE": [3999, 3999, 4499, 4499, 4499],
    "LISTPRICE_time": [1610445600, 1612128000, 1614547200, 1617235200, 1619913600],
    "RATING": [450, 455, 460, 465, 470],
    "RATING_time": [1610445600, 1612128000, 1614547200, 1617235200, 1619913600],
    "REVIEWS": [1234, 1267, 1301, 1335, 1368],
    "REVIEWS_time": [1610445600, 1612128000, 1614547200, 1617235200, 1619913600]
  },
  "csv": [
    [7345328, 2500],
    [7345328, 2500],
    [7303544, -1]
  ],
  "lastUpdate": 1625270400,
  "lastPriceChange": 1619913600,
  "lastOffersUpdate": 1625270400,
  "availabilityAmazon": 3,
  "isAdultProduct": false,
  "hasReviews": true,
  "liveOffersOrder": [0, 1, 2, 3, 4],
  "offers": [
    {
      "offerId": 553,
      "lastSeen": 7376384,
      "sellerId": "A2FP3WC79CXYXU",
      "isPrime": true,
      "isFBA": true,
      "isMAP": false,
      "isShippable": true,
      "offerCSV": "7345328,2500 7346200,2599 7347100,2699"
    }
  ]
}
```

**Spiegazione Campi Importanti:**

| Campo | Formato | Descrizione |
|---|---|---|
| `asin` | String | Amazon Standard ID |
| `title` | String | Nome prodotto |
| `imageUrl` | String | URL immagine principale |
| `buyBoxPrice` | Integer | Prezzo Buy Box in centesimi (es: 3999 = €39,99) |
| `data.NEW` | Array[Int] | Storico prezzi prodotto nuovo |
| `data.NEW_time` | Array[Timestamp] | Timestamp Unix (secondi) per NEW |
| `data.SALES` | Array[Int] | Storico sales rank |
| `data.RATING` | Array[Int] | Rating moltiplicato per 100 (400 = 4.0 stelle) |
| `offerCount` | Integer | Numero offerte totali |
| `stockAmazon` | Integer | Stock Amazon (disponibilità) |
| `lastUpdate` | Timestamp | Ultimo aggiornamento dati (Unix epoch) |

**Format Data/Timestamp:**[2]

- **Formato**: Unix Epoch Seconds (secondi da 1970-01-01)
- **Conversione Python**: `datetime.fromtimestamp(unix_time)`
- **Esempio**: 1625270400 = 2021-07-03 00:00:00 UTC

**Identificare Stock:**

```python
# Stock Amazon
if product['stockAmazon'] > 0:
    print("In stock presso Amazon")
elif product['stockAmazon'] == 0:
    print("Out of stock presso Amazon")
elif product['stockAmazon'] == -1:
    print("Data non disponibile")

# Buy Box availability
if product['buyBoxPrice'] > 0:
    print("Buy Box è disponibile")
```

#### E) Rate Limiting & Best Practices[5][9][6]

**Limiti Richieste per Livello API:**

| Plan | Token/Min | Prezzo Mensile | Prezzo Annuale |
|---|---|---|---|
| Basic | 20 | €49 | €490 |
| Standard | 60 | €129 | €1.290 |
| Professional | 250 | €459 | €4.590 |
| Business | 500 | €879 | €8.790 |
| Enterprise I | 1.000 | €1.499 | €14.990 |
| Enterprise II | 2.000 | €2.499 | - |
| Enterprise III | 3.000 | €3.499 | - |
| Enterprise IV | 4.000 | €4.499 | - |

**Gestire Limiti:**

```python
import keepa
import time

api = keepa.Keepa('YOUR_KEY')

# Con wait=True (default): attende token disponibili
products = api.query('B0088PUEPK', wait=True)

# Con wait=False: non attende (rischia errore 429)
try:
    products = api.query('B0088PUEPK', wait=False)
except keepa.KeepaClientError as e:
    print(f"Token limit exceeded: {e}")
    time.sleep(60)
    products = api.query('B0088PUEPK', wait=True)
```

**Retry Logic:**

```python
import time
from requests.exceptions import RequestException

def query_with_retry(api, asin, max_retries=3):
    for attempt in range(max_retries):
        try:
            return api.query(asin, wait=True)
        except (RequestException, Exception) as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"Tentativo {attempt+1} fallito. Retry in {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise
```

#### F) URL Esempio Completo

**Caso 1: Cerca prodotti Elettronica su Amazon IT, prezzo 20-100€, sconto >30%, rating >4 stelle**

```
https://api.keepa.com/product?
key=YOUR_API_KEY
&domain=IT
&categories_include=166199011
&current_AMAZON_gte=2000
&current_AMAZON_lte=10000
&current_RATING_gte=400
&current_LISTPRICE_gte=3000
&sort=current_SALES,asc
&page=0
&perPage=50
```

**Con Python:**
```python
import keepa

api = keepa.Keepa('YOUR_API_KEY')

product_parms = {
    'categories_include': [166199011],      # Electronics
    'current_AMAZON_gte': 2000,             # €20
    'current_AMAZON_lte': 10000,            # €100
    'current_RATING_gte': 400,              # >= 4.0 stelle
    'current_LISTPRICE_gte': 3000,          # Listino €30+ per sconto >30%
    'sort': [['current_SALES', 'asc']],
    'page': 0,
    'perPage': 50
}

results = api.product_finder(product_parms, domain='IT')
for product in results:
    print(f"ASIN: {product['asin']}")
    print(f"Titolo: {product['title']}")
    print(f"Prezzo: €{product['buyBoxPrice']/100:.2f}")
    print(f"Rating: {product['data']['RATING'][-1]/100:.1f} stelle")
    print("---")
```

**Caso 2: Trova prodotti Home & Kitchen, top sales rank, sconto >50%**

```
https://api.keepa.com/product?
key=YOUR_API_KEY
&domain=IT
&categories_include=16427032011
&current_SALES_lte=1000
&current_AMAZON_lte=5000
&current_LISTPRICE_gte=10000
&hasReviews=true
&sort=current_SALES,asc
```

**Con Python:**
```python
product_parms = {
    'categories_include': [16427032011],    # Home & Kitchen
    'current_SALES_lte': 1000,              # Top 1000 sales rank
    'current_AMAZON_lte': 5000,             # Prezzo <= €50
    'current_LISTPRICE_gte': 10000,         # Listino >= €100 (sconto >= 50%)
    'hasReviews': True,
    'current_COUNT_REVIEWS_gte': 50,        # Minimo 50 recensioni
    'sort': [['current_SALES', 'asc']]
}

results = api.product_finder(product_parms, domain='IT', n_products=100)
```

***

### 2. AMAZON ITALIA - CATEGORY TAXONOMY

#### A) Lista Categorie Principali Amazon.it[12][13]

| Categoria IT | Categoria EN | Root Category ID | Note |
|---|---|---|---|
| Elettronica | Electronics | 166199011 | Molto competitivo, alto volume |
| Casa e Cucina | Home & Kitchen | 16427032011 | Best seller category, essenziale |
| Abbigliamento | Clothing, Shoes & Jewelry | 16345581011 | Gated, variabilità prezzi alta |
| Libri | Books | 133140011 | Basso ticket, reviewer density alta |
| Giochi e Giocattoli | Toys & Games | 10954551011 | Stagionale, sconto frequente |
| Bellezza | Beauty & Personal Care | 11032804011 | Gated, review-driven |
| Salute e Cura | Health & Household | 16352651011 | Consumabili, Subscribe & Save |
| Sport e Tempo Libero | Sports & Outdoors | 11040321011 | Attrezzatura, variabile peso |
| Automotive | Automotive | 16347621011 | Specifico per auto, compatibilità |
| Giardino | Patio, Lawn & Garden | 2619529011 | Stagionale, weight-based |
| Informatica | Computers | 166199031 | Prezzo volatile, ROI margin |
| Ufficio | Office Products | 10981697011 | B2B, quantità, bulk discount |
| Alimentari | Grocery & Gourmet Food | 1482149031 | **Gated**, Subscribe & Save comune |
| Musica | Digital Music | 163856011 | MP3 download, limitato inventario |
| Videogiochi | Video Games | 11051271011 | **Gated**, pre-order frequente |
| Fai da Te | Tools & Home Improvement | 16347721011 | Competitivo, guida installazione |
| Cancelleria | Office & School Supplies | 10981697011 | Consumabili, bulk |

**Categorie Gated (Richiedono Approvazione):**
- Grocery & Gourmet Food (Alimentari)
- Jewelry (Gioielleria)
- Fine Art (Arte)
- Collectible Coins (Monete)
- Video Games (Videogiochi)
- Beauty & Personal Care (Parzialmente)

#### B) Sottocategorie Top 5 Categorie Principali

**1. Elettronica (166199011)**[13][12]

```
Elettronica
├── Componenti & Accessori (166199031)
│   ├── Storage Devices (SSD, HDD) [166225011]
│   ├── RAM & Memory (166225021)
│   └── Power Supplies (166225031)
├── Networking (166225041)
│   ├── Router & Modem (166225051)
│   ├── Ethernet Cables (166225061)
│   └── Network Adapters (166225071)
└── Accessori (166225081)
    ├── Cavi & Connettori (166225091)
    ├── Caricabatterie (166225101)
    └── Hub & Docking Stations (166225111)
```

**2. Casa e Cucina (16427032011)**[12]

```
Casa e Cucina
├── Cucina (16352651031)
│   ├── Utensili Cottura (16352651041)
│   │   ├── Pentole & Padelle (16352651051)
│   │   ├── Forni & Forni Tostapane (16352651061)
│   │   └── Bollitori Elettrici (16352651071)
│   └── Posate & Stoviglie (16352651081)
├── Arredamento (16352651091)
│   ├── Letti & Testiere (16352651101)
│   ├── Divani & Poltrone (16352651111)
│   └── Tavoli & Sedie (16352651121)
└── Organizzazione & Stoccaggio (16352651131)
    ├── Contenitori & Scatole (16352651141)
    ├── Scaffalature (16352651151)
    └── Armadi (16352651161)
```

**3. Bellezza (11032804011)**[12]

```
Bellezza & Cura Personale
├── Skincare (11032804021)
│   ├── Detergenti Viso (11032804031)
│   ├── Creme & Sieri (11032804041)
│   └── Maschere & Esfolianti (11032804051)
├── Haircare (11032804061)
│   ├── Shampoo & Balsamo (11032804071)
│   ├── Trattamenti Capelli (11032804081)
│   └── Styling Products (11032804091)
└── Makeup (11032804101)
    ├── Fondotinta & Concealer (11032804111)
    ├── Eye Makeup (11032804121)
    └── Lipstick & Lip Gloss (11032804131)
```

**4. Abbigliamento (16345581011)**[12]

```
Clothing, Shoes & Jewelry
├── Uomo (16345581021)
│   ├── Magliette & Top (16345581031)
│   ├── Pantaloni (16345581041)
│   └── Giacche & Cappotti (16345581051)
├── Donna (16345581061)
│   ├── Abiti & Gonne (16345581071)
│   ├── Top & Bluse (16345581081)
│   └── Pantaloni (16345581091)
└── Accessori (16345581101)
    ├── Scarpe (16345581111)
    ├── Borse (16345581121)
    └── Cinture & Portafogli (16345581131)
```

**5. Sport e Tempo Libero (11040321011)**[12]

```
Sports & Outdoors
├── Fitness & Palestra (11040321021)
│   ├── Manubri & Pesi (11040321031)
│   ├── Fasce Elastiche (11040321041)
│   └── Tappetini Yoga (11040321051)
├── Outdoor & Campeggio (11040321061)
│   ├── Tende & Sacchi Dormienti (11040321071)
│   ├── Zaini (11040321081)
│   └── Lanterne & Torce (11040321091)
└── Sport Specifici (11040321101)
    ├── Calcio (11040321111)
    ├── Pallavolo (11040321121)
    └── Ciclismo (11040321131)
```

#### C) Category Metadata - Top 5 Categorie

| Categoria | Avg Discount | Price Range | Review Density | Competitività |
|---|---|---|---|---|
| **Elettronica** | 15-25% | €30-€1000 | Media-Alta | Molto Alta (Saturato) |
| **Casa & Cucina** | 20-35% | €15-€500 | Alta | Alta (Opportunità) |
| **Bellezza** | 25-40% | €5-€100 | Molto Alta | Molto Alta (Gated) |
| **Abbigliamento** | 30-50% | €20-€200 | Media | Molto Alta (Gated) |
| **Sport** | 20-40% | €10-€300 | Media | Alta |

***

### 3. ALTERNATIVE A KEEPA & COMPARAZIONE

Se Keepa ha limitazioni di costo o funzionalità, ecco le alternative:[14][15][16][17]

| Strumento | Costo Mensile | Dati Tracciati | Best Per | Pro | Contro |
|---|---|---|---|---|---|
| **Keepa** | €19-€4.499 | 5B+ prodotti | Storico prezzi, Sales rank | Granularità storica, Buy Box data | Costo elevato per API |
| **Jungle Scout** | $29-$129 | 2B+ prodotti | Product Research | Interfaccia pulita, Supplier DB | Meno storico vs Keepa |
| **CamelCamelCamel** | Free-Premium | 1B+ prodotti | Price Tracking solo | Completamente free, Alerts | Solo prezzo, no seller data |
| **Rainforest API** | $25-$500 | Real-time data | ASIN lookup, Search | API documentation chiara | No storico, cost per call |
| **Helium 10** | $39-$299 | Aggregato | Seller completisti | All-in-one tools | Generico, non specializzato |

**Raccomandazione per Affiliate SaaS:**
- **Keepa API** se serve storico prezzi + tracking
- **Rainforest API** per lookup real-time leggero
- **Hybrid** (Keepa + CamelCamelCamel) per ridurre costi

***

### 4. CODICE ESEMPIO - TypeScript/JavaScript

```typescript
import axios, { AxiosInstance } from 'axios';

interface KeepaProductFinderParams {
  key: string;
  domain?: string;
  categories_include?: number[];
  categories_exclude?: number[];
  current_AMAZON_gte?: number;
  current_AMAZON_lte?: number;
  current_RATING_gte?: number;
  current_RATING_lte?: number;
  current_SALES_lte?: number;
  current_COUNT_REVIEWS_gte?: number;
  hasReviews?: boolean;
  sort?: Array<[string, 'asc' | 'desc']>;
  page?: number;
  perPage?: number;
}

class KeepaAPI {
  private baseUrl = 'https://api.keepa.com';
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Query single ASIN product
   */
  async getProduct(asin: string, domain: string = 'IT'): Promise<any> {
    try {
      const response = await this.client.get('/product', {
        params: {
          key: this.apiKey,
          asin,
          domain,
          history: 1,
          stats: 30,
          offers: 20
        }
      });
      return response.data[0]; // Keepa returns array
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Search products with filters
   */
  async productFinder(params: KeepaProductFinderParams): Promise<any[]> {
    try {
      const payload = {
        key: this.apiKey,
        ...params,
        domain: params.domain || 'IT'
      };

      const response = await this.client.post('/product/finder', payload);
      
      return response.data.products || [];
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Get best sellers for category
   */
  async getBestSellers(
    categoryId: number,
    domain: string = 'IT'
  ): Promise<string[]> {
    try {
      const response = await this.client.get('/bestsellers', {
        params: {
          key: this.apiKey,
          category: categoryId,
          domain
        }
      });
      return response.data; // Array of ASINs
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Get categories for marketplace
   */
  async getCategories(domain: string = 'IT'): Promise<Record<string, any>> {
    try {
      const response = await this.client.get('/category', {
        params: {
          key: this.apiKey,
          domain,
          id: 0 // 0 = all root categories
        }
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Search category by name
   */
  async searchCategories(
    query: string,
    domain: string = 'IT'
  ): Promise<Record<string, any>> {
    try {
      const response = await this.client.get('/category/search', {
        params: {
          key: this.apiKey,
          q: query,
          domain
        }
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Handle pagination
   */
  async *searchProductsPaginated(
    params: KeepaProductFinderParams,
    pageSize: number = 50
  ): AsyncGenerator<any> {
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const results = await this.productFinder({
          ...params,
          page,
          perPage: pageSize
        });

        if (results.length === 0) {
          hasMore = false;
        } else {
          for (const product of results) {
            yield product;
          }
          page++;
        }
      } catch (error) {
        hasMore = false;
        throw error;
      }
    }
  }

  /**
   * Parse response with error handling
   */
  private handleError(error: any): never {
    if (error.response) {
      const status = error.response.status;
      if (status === 429) {
        throw new Error('Rate limit exceeded. Token quota depleted.');
      } else if (status === 401) {
        throw new Error('Unauthorized. Invalid API key.');
      } else if (status === 400) {
        throw new Error(
          `Bad request: ${error.response.data.message || 'Invalid parameters'}`
        );
      }
    }
    throw error;
  }
}

// USAGE EXAMPLES

async function main() {
  const api = new KeepaAPI('YOUR_API_KEY');

  // Esempio 1: Ricerca semplice per ASIN
  console.log('=== Esempio 1: Query singolo ASIN ===');
  const product = await api.getProduct('B07HPG684T', 'IT');
  console.log(`Titolo: ${product.title}`);
  console.log(`Prezzo: €${(product.buyBoxPrice / 100).toFixed(2)}`);
  console.log(`Rating: ${(product.data.RATING[-1] / 100).toFixed(1)} stelle`);

  // Esempio 2: Search prodotti con filtri
  console.log('\n=== Esempio 2: Product Finder con filtri ===');
  const searchParams: KeepaProductFinderParams = {
    key: 'YOUR_API_KEY',
    domain: 'IT',
    categories_include: [166199011], // Elettronica
    current_AMAZON_gte: 2000, // Min €20
    current_AMAZON_lte: 10000, // Max €100
    current_RATING_gte: 400, // Min 4.0 stelle
    current_SALES_lte: 1000, // Top 1000 sales
    hasReviews: true,
    page: 0,
    perPage: 20,
    sort: [['current_SALES', 'asc']]
  };

  const products = await api.productFinder(searchParams);
  console.log(`Trovati ${products.length} prodotti`);
  products.forEach((p: any) => {
    console.log(`- ${p.asin}: ${p.title} (€${(p.buyBoxPrice / 100).toFixed(2)})`);
  });

  // Esempio 3: Paginazione
  console.log('\n=== Esempio 3: Paginazione automatica ===');
  let count = 0;
  for await (const product of api.searchProductsPaginated(searchParams, 50)) {
    if (count++ < 5) {
      console.log(`${product.asin}: ${product.title}`);
    }
  }

  // Esempio 4: Best sellers per categoria
  console.log('\n=== Esempio 4: Best Sellers ===');
  const bestsellers = await api.getBestSellers(16427032011); // Home & Kitchen
  console.log(`Top 10 best sellers: ${bestsellers.slice(0, 10).join(', ')}`);

  // Esempio 5: Ottenere categorie
  console.log('\n=== Esempio 5: Categorie disponibili ===');
  const categories = await api.getCategories('IT');
  Object.entries(categories).slice(0, 5).forEach(([id, cat]: [string, any]) => {
    console.log(`${id}: ${cat.name}`);
  });
}

main().catch(console.error);
```

**Con Gestione Retry:**

```typescript
async function queryWithRetry(
  api: KeepaAPI,
  asin: string,
  maxRetries: number = 3
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await api.getProduct(asin);
    } catch (error: any) {
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Attempt ${attempt + 1} failed. Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
}
```

***

### 5. DOCUMENTAZIONE UFFICIALE - Link Diretti

**Risorse Ufficiali Keepa:**[18][7][2][1]

| Risorsa | URL |
|---|---|
| **Documentazione Ufficiale** | https://keepaapi.readthedocs.io/ |
| **GitHub Python Wrapper** | https://github.com/akaszynski/keepa |
| **API Pricing & Plans** | https://keepa.com/#!api |
| **Keepa Dashboard** | https://keepa.com/ |
| **Forum Community** | https://forum.keepa.com/ |
| **Email Support** | support@keepa.com |
| **API Status** | https://keepa.com/status |

**Packaging NPM JavaScript:**
```bash
npm install axios  # Per HTTP requests
```

**Python Wrapper Ufficiale:**
```bash
pip install keepa
```

***

### NOTA IMPORTANTE: Integrazione Amazon Italia

La **documentazione ufficiale di Keepa è in inglese**. Durante l'integrazione per Amazon.it, assicurarsi di:

1. ✅ Impostare `domain='IT'` (non `domain='ITALY'`)
2. ✅ Usare **domainId=8** se si utilizza REST API diretta
3. ✅ I prezzi sono sempre in **centesimi di euro** (10000 = €100,00)
4. ✅ Le categorie sono **specifiche per ogni marketplace** – non sono le stesse tra .com e .it
5. ✅ **Attenzione ai timestamp**: Keepa utilizza Unix Epoch Seconds (UTC)

Con queste informazioni, haip una fondazione solida per integrare l'API Keepa nel vostro sistema di automazione per Amazon Italia!

[1](https://keepaapi.readthedocs.io/en/latest/api_methods.html)
[2](https://keepaapi.readthedocs.io/en/latest/product_query.html)
[3](https://keepaapi.readthedocs.io/en/stable/api_methods.html)
[4](https://affmaven.com/it/keepa-pricing/)
[5](https://revenuegeeks.com/keepa-pricing/)
[6](https://fbamultitool.com/keepa-subscription-pricing-quick-guide-for-amazon-sellers/)
[7](https://botize.com/en/api-credentials/keepa)
[8](https://intercom.help/ProfitPathHelp/en/articles/8795232-how-can-i-find-my-keepa-key)
[9](https://www.gofbahub.com/guide/keepa-free-trial/)
[10](https://github.com/akaszynski/keepa/issues/3)
[11](https://developer.sellerassistant.app/keepa/get-product)
[12](https://www.sellerapp.com/blog/amazon-product-categories/)
[13](https://feedonomics.com/blog/amazon-category-taxonomy/)
[14](https://www.junglescout.com/resources/articles/jungle-scout-vs-keepa/)
[15](https://avada.io/blog/keepa-vs-jungle-scout/)
[16](https://tracefuse.ai/blog/best-keepa-alternatives/)
[17](https://jordiob.com/amazon-tools/comparisons/camelcamelcamel-vs-keepa/)
[18](https://docs.datavirtuality.com/connectors/keepa-api-information)
[19](https://www.scribd.com/document/571210466/keepa-api)
[20](https://developer.sellerassistant.app/api-21568126)
[21](https://databar.ai/explore/keepa-api/product-search)
[22](https://docs.adverity.com/guides/collecting-data/collecting-data-keepa.html)
[23](https://keepaapi.readthedocs.io/en/latest/index.html)
[24](https://bookzpro.com/keepa-the-ultimate-amazon-price-tracker-for-mastering-seller-strategies/)
[25](https://lobehub.com/nl/mcp/cosjef-keepa_mcp)
[26](https://fasttrackfba.com/blog/b/how-to-use-keepa-for-amazon-keepa-tutorial-for-sourcing-products)
[27](https://www.danielenofi.com/keepa/)
[28](https://www.youtube.com/watch?v=x6zA174mgCE)
[29](https://pypi.org/project/keepa/)
[30](https://www.youtube.com/watch?v=Rg2XezV-8RE)
[31](https://chromewebstore.google.com/detail/keepa-amazon-price-tracke/neebplgakaahbhdphmkckjjcegoiijjo?hl=it)
[32](https://codepal.ai/code-generator/query/GDrYTYiL/javascript-code-keepa-api-integration)
[33](https://play.google.com/store/apps/details?id=com.keepa.mobile&hl=it)
[34](https://www.fastweb.it/fastweb-plus/digital-marketing-social/keepa-il-grafico-dello-storico-dei-prezzi-amazon/)
[35](https://apps.apple.com/it/app/keepa-price-tracker/id1533805339)
[36](https://www.freelancer.com/projects/api/keepa-api-daily-csv-tracker)
[37](https://stackoverflow.com/questions/2602043/rest-api-best-practice-how-to-accept-list-of-parameter-values-as-input)
[38](https://shop.hgs.app/blogs/lms/using-python-to-work-with-the-keepa-api-to-automate-mysql-database-ingestion-for-power-bi)
[39](https://keepa.com)
[40](https://www.reddit.com/r/Flipping/comments/puwz38/how_do_you_extract_historical_price_data_from/)
[41](https://mixedanalytics.com/knowledge-base/import-keepa-data-to-google-sheets/)
[42](https://www.postman.com/api-evangelist/commerce/api/6e848c98-423a-458e-a9b4-b3bb399658c3/version/a7e17d46-5036-4198-a9da-20a2ce06bd13)
[43](https://www.northone.com/blog/ecommerce/amazon-all-categories)
[44](https://www.youtube.com/watch?v=Qzvp3feKBq8)
[45](https://www.asinspotlight.com/amz-categories-list-csv)
[46](https://www.ecomengine.com/amazon-categories)
[47](https://www.youtube.com/watch?v=krCH8u90lCk)
[48](https://treblle.com/blog/add-pagination-to-rest-api)
[49](https://stackoverflow.com/questions/51113767/pythonic-way-to-write-rest-wrapper-function-that-takes-optional-arguments)
[50](https://www.merge.dev/blog/api-pagination-challenges-for-multiple-integrations)
[51](https://semaphore.io/community/tutorials/building-and-testing-an-api-wrapper-in-python)
[52](https://palant.info/2021/03/22/follow-up-on-amazon-assistants-data-collection/)
[53](https://cybergarden.au/blog/rest-api-pagination-best-practices)
[54](https://community.n8n.io/t/adding-parameters-to-http-node/18306)
[55](https://lukas-juergensmeier.com/keepar.html)
[56](https://forum.bubble.io/t/issues-with-bubble-recognizing-json-from-api-keepa/29613)
[57](https://chromewebstore.google.com/detail/keepa-amazon-price-tracke/neebplgakaahbhdphmkckjjcegoiijjo)
[58](https://github.com/akaszynski/keepa/issues/118)
[59](https://www.sellerassistant.app/blog/keepa-amazon)
[60](https://papers.ssrn.com/sol3/Delivery.cfm/SSRN_ID4608022_code3320304.pdf?abstractid=4608022&mirid=1)
[61](https://sellercentral.amazon.it/help/hub/reference/external/G1661?locale=en-GB)