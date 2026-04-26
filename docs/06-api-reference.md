# 06 — API Referencia

A Mona Studio V2 backend végpontjai. Minden endpoint **Cloudflare Pages Function** (TypeScript), és a `src/pages/api/` mappában található.

---

## Konvenciók

- **Base URL**: `https://monabeauty2.pages.dev/api/...` (dev) vagy `https://monastudio.hu/api/...` (production)
- **Content-Type**: `application/json` minden request és response
- **Authentication**: cookie-alapú session (`mona_session`) ha bejelentkezett, vagy public végpontok
- **Errors**: `{ error: string }` formátum + HTTP státusz kód
- **Rate limiting**: KV-alapú IP per-óra limit (tűzfal réteg)

---

## Endpointok

### 📧 `POST /api/newsletter/subscribe`

Hírlevél feliratkozás Mailchimp double opt-in-nel.

**Sprint**: 2A  
**Auth**: nem szükséges  
**Rate limit**: nincs (Mailchimp maga kezeli)

#### Request

```json
{
  "email": "vendeg@example.com"
}
```

#### Validáció
- `email`: kötelező, érvényes email formátum

#### Response — 200 OK
```json
{
  "success": true,
  "message": "A megerősítő emailt elküldtük."
}
```

Vagy ha már fel van iratkozva:
```json
{
  "success": true,
  "message": "Már fel vagy iratkozva — köszönjük!"
}
```

#### Response — 400 Bad Request
```json
{ "error": "Érvénytelen email cím." }
```

#### Response — 503 Service Unavailable
```json
{ "error": "A hírlevél szolgáltatás jelenleg nem érhető el." }
```
(Mailchimp env vars hiányoznak)

#### Mailchimp behavior
- Status: `pending` (double opt-in — Mailchimp küld megerősítő emailt)
- Tags: `["website-signup"]`

#### Env vars
- `MAILCHIMP_API_KEY` (secret)
- `MAILCHIMP_AUDIENCE_ID` (plaintext)
- `MAILCHIMP_SERVER` (plaintext, pl. `us21`)

---

### ✉️ `POST /api/contact`

Kapcsolat form üzenet — Resend-en email küldés `mona@monastudio.hu`-ra.

**Sprint**: 2B  
**Auth**: nem szükséges  
**Rate limit**: 5 üzenet / óra / IP (KV: `contact-rate-{IP}`)

#### Request

```json
{
  "name": "Kovács Anna",
  "email": "anna@example.com",
  "phone": "+36 30 123 4567",
  "subject": "Időpontfoglalás",
  "message": "Üdv, szeretnék időpontot foglalni jövő héten...",
  "consent": true
}
```

#### Validáció
- `name`: min 2 karakter
- `email`: érvényes formátum
- `phone`: opcionális
- `subject`: kötelező (az alábbiak egyike)
  - `"Kezeléssel kapcsolatos kérdés"`
  - `"Időpontfoglalás"`
  - `"Webshop / termék kérdés"`
  - `"Egyéb"`
- `message`: min 10 karakter
- `consent`: kötelező, `true`

#### Response — 200 OK
```json
{ "success": true }
```

#### Response — 400 Bad Request
```json
{ "error": "Az üzenet legalább 10 karakter legyen." }
```

#### Response — 429 Too Many Requests
```json
{ "error": "Túl sok kérés. Próbáld újra később." }
```

#### Response — 500/503
```json
{ "error": "Hiba történt. Próbáld újra később, vagy hívj a +36 20 913 0126 számon!" }
```

#### Resend email tartalma
- **From**: `Mona Studio <weblap@monastudio.hu>`
- **To**: `mona@monastudio.hu`
- **Reply-To**: a felhasználó email címe
- **Subject**: `[Weblap] {subject} — {name}`
- **HTML body**: név, email, telefon, téma, üzenet (XSS-mentes escape-eléssel)

#### Env vars
- `RESEND_API_KEY` (secret)

#### KV use
- `contact-rate-{IP}`: óránkénti számláló (TTL 3600s)

---

## Tervezett endpointok (későbbi sprintekben)

### Sprint 3 — Webshop

| Endpoint | Metódus | Leírás |
|---|---|---|
| `/api/products` | GET | Termék lista szűrőkkel (kategória, márka, ár) |
| `/api/products/[slug]` | GET | Egyedi termék részletes adatai |
| `/api/cart` | GET / POST | Kosár kezelés (sessionhoz kötve KV-ben) |
| `/api/checkout` | POST | Pénztár — rendelés létrehozása D1-ben |
| `/api/wishlist` | GET / POST / DELETE | Kívánságlista (auth szükséges) |

### Sprint 4 — Ügyfél törzs

| Endpoint | Metódus | Leírás |
|---|---|---|
| `/api/auth/register` | POST | Email + jelszó regisztráció |
| `/api/auth/login` | POST | Email + jelszó bejelentkezés |
| `/api/auth/logout` | POST | Session törlés |
| `/api/auth/google` | GET | OAuth init (redirect Google-re) |
| `/api/auth/google-callback` | GET | OAuth callback (token csere + session) |
| `/api/profile` | GET / PATCH | Saját profil lekérés / módosítás |
| `/api/profile/orders` | GET | Saját rendelési előzmények |
| `/api/profile/addresses` | GET / POST / DELETE | Címkönyv |

### Sprint 5 — Admin

| Endpoint | Metódus | Leírás |
|---|---|---|
| `/api/admin/products` | GET / POST | Termék lista / létrehozás |
| `/api/admin/products/[id]` | PATCH / DELETE | Termék módosítás / törlés |
| `/api/admin/products/[id]/images` | POST / DELETE | R2 kép feltöltés / törlés |
| `/api/admin/customers` | GET | Ügyfél lista |
| `/api/admin/customers/[id]/notes` | GET / POST | Mónika jegyzetei |
| `/api/admin/orders` | GET | Rendelések lista |
| `/api/admin/orders/[id]` | PATCH | Rendelés státusz módosítás |
| `/api/admin/promotions` | GET / POST | Akció kezelés |

### Sprint 6 — Integrációk

| Endpoint | Metódus | Leírás |
|---|---|---|
| `/api/foxpost/locations` | GET | Csomagautomata pontok |
| `/api/foxpost/label` | POST | Címke generálás |
| `/api/setmore/availability` | GET | Szabad időpontok |
| `/api/setmore/book` | POST | Időpontfoglalás |
| `/api/chat` | POST | Anthropic chatbot |
| `/api/admin/import-products` | POST | PDF számla → JSON termék import |

---

## Hibakezelés általános elvek

1. **Validáció hibák** → `400 Bad Request` magyar nyelvű üzenettel
2. **Auth hibák** → `401 Unauthorized` "Jelentkezz be"
3. **Forbidden** → `403 Forbidden` "Nincs jogosultságod ehhez"
4. **Not found** → `404 Not Found` "Nem található"
5. **Rate limit** → `429 Too Many Requests` "Túl sok kérés"
6. **Server error** → `500 Internal Server Error` (logolva), általános magyar üzenet
7. **Service unavailable** → `503 Service Unavailable` (3rd party API down vagy env vars hiányoznak)

Soha nem lekerülnek érzékeny adatok (secrets, stack trace) a kliens válaszába.

---

## Tesztelés

A jövőben minden új endpointhoz **integrációs teszt** kerül a `tests/` mappába (Sprint 5 utáni karbantartás). Addig manuális tesztelés a Cloudflare deploy preview URL-eken.

---

## Kapcsolódó dokumentumok

- [00-architektura.md](./00-architektura.md) — adatfolyamok, KV / D1 / R2 használat
- [07-deployment.md](./07-deployment.md) — env vars hol állítsd be
