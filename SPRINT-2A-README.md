# Mona Studio — Sprint 2A telepítési útmutató

A Sprint 1 mellé kerülnek be ezek a fájlok ugyanabba a `monabeauty_reorg` projektbe.

## Új és frissített fájlok

### Új fájlok (létrehozni)
```
src/lib/consent.ts                              # Cookie consent állapot kezelés
src/lib/toast.ts                                # Toast trigger helpers
src/lib/cart.ts                                 # localStorage kosár logika
src/components/common/CookieConsent.astro       # 3 kategóriás GDPR banner + modal
src/components/common/ToastContainer.astro      # Toast üzenetek
src/components/common/NewsletterForm.astro      # Mailchimp feliratkozás
src/components/shop/SaleCountdown.astro         # Akciós időzítő (vegyes)
src/pages/api/newsletter/subscribe.ts           # Mailchimp API proxy
```

### Frissített fájlok (felülírni)
```
src/styles/tokens.css      # +header-height, +touch-target, +scroll-padding
src/styles/reset.css       # +sticky footer, +touch target min, +hover lock fix
src/components/common/Header.astro    # +scroll direction, +iOS scroll lock
src/components/common/Footer.astro    # +Cookie beállítások gomb
src/layouts/BaseLayout.astro          # +CookieConsent +ToastContainer +Analytics gating
```

---

## Új env vars Cloudflare Pages-ben

A Mailchimp integrációhoz be kell állítani:

```
MAILCHIMP_API_KEY      = xxxxxxxxxxxxxxxxxxxxxxxxxxxx-us21
MAILCHIMP_AUDIENCE_ID  = 1234567890
MAILCHIMP_SERVER       = us21
```

**Hol találod ezeket Mailchimp-ben:**
1. Account → Extras → API keys → új key generálás
2. Audience → Settings → Audience name and defaults → Audience ID
3. A server prefix az API key utolsó része (`-us21` → `us21`), vagy a Mailchimp URL-ben

---

## Newsletter testreszabás

Az `api/newsletter/subscribe.ts` `tags: ["website-signup"]` címkével iratkoztat fel. Ezt módosíthatod ha szeretnél kategóriákra bontani (pl. külön webshop és szalon).

A double opt-in (`status: "pending"`) miatt Mailchimp küld egy megerősítő emailt — ezt testre tudod szabni Mailchimp-ben:
- Audience → Settings → Email translations → Final welcome email

---

## Cookie consent — GA4 / Facebook Pixel beillesztés

A `BaseLayout.astro` alján vannak a placeholder script-ek. A Sprint 2A-ban ezek **csak akkor töltődnek be**, ha a látogató elfogadja az adott kategóriát.

**Google Analytics 4 telepítés:**
A `BaseLayout.astro`-ban keresd meg ezt a részt és cseréld le a placeholder-t a saját GA4 ID-dre:
```js
function loadAnalytics() {
  if (!isAllowed("analytics")) return;
  // Itt a saját kódod...
}
```

**Facebook Pixel telepítés:**
Ugyanott a `loadMarketing()` függvényben.

A `mona-consent-change` event automatikusan újratölti ezeket, ha a felhasználó utólag módosítja a beállításait.

---

## Cookie tájékoztató oldal (`/cookies`)

A consent banner-ből hivatkozik rá — készíts egy `src/pages/cookies.astro` oldalt, amelyik részletesen leírja:

- Milyen szükséges cookie-k vannak (mona_session, mona_cart, mona_consent)
- Milyen analítikai cookie-k (GA4: _ga, _gid, Microsoft Clarity)
- Milyen marketing cookie-k (Facebook _fbp, fr)
- Mennyi ideig élnek
- Hogyan vonhatja vissza a hozzájárulását

Ez Sprint 2B-ben jön a többi statikus oldallal együtt.

---

## Mit tesztelj a deploy után

1. **Első látogatás (incognito ablakban)** → 1.5 mp után jelenik meg a cookie banner alulról
2. **Kattints "Beállítások"-ra** → modal nyílik 3 kategóriával
3. **"Csak szükséges"** → minden tiltva, GA/FB nem tölt
4. **"Mindent elfogadok"** → GA/FB betöltődik
5. **Footer "Cookie beállítások" link** → újra megnyílik a modal
6. **Header lefelé scrollozva** → eltűnik
7. **Felfelé scroll** → újra megjelenik
8. **Mobile menü megnyit** → háttér nem scrollozható (iOS)
9. **Newsletter form** → email validáció működik
10. **Hibás email**: piros visszajelzés
11. **Sikeres feliratkozás**: zöld visszajelzés + Mailchimp megerősítő email

---

## Toast használata bárhol

```ts
import { toastSuccess, toastError, toastCartAdd } from "@/lib/toast";

// Kosárba helyezés
toastCartAdd("Cica Tonik", 7050);

// Általános siker
toastSuccess("Profil frissítve", "Az adataidat elmentettük.");

// Hiba
toastError("Sikertelen mentés. Próbáld újra!");
```

---

## SaleCountdown használata

**Termékkártyán (csendes):**
```astro
<SaleCountdown endsAt="2026-05-15T23:59:59" variant="compact" />
```

**Termékoldalon (hangos):**
```astro
<SaleCountdown endsAt="2026-05-15T23:59:59" variant="full" />
```

Az `endsAt` lehet a `products` tábla `sale_price_effective_date` mezőjének végdátuma.

---

## Sprint 2B előzetes

A Sprint 2B-ben a meglévő statikus oldalak migrálása:

```
src/pages/index.astro                 # főoldal (új design)
src/pages/rolam.astro                 # Rólam (E-E-A-T)
src/pages/szolgaltatasok/index.astro  # szolgáltatások hub
src/pages/szolgaltatasok/[slug].astro # egyedi szolgáltatás oldal
src/pages/blog/index.astro            # blog lista
src/pages/blog/[slug].astro           # blog cikk
src/pages/galeria.astro
src/pages/velemenyek.astro
src/pages/kapcsolat.astro
src/pages/bejelentkezes.astro
src/pages/cookies.astro               # cookie tájékoztató
src/pages/aszf.astro
src/pages/adatvedelem.astro
src/pages/szallitas.astro
src/pages/404.astro                   # custom 404
src/pages/500.astro                   # custom 500
```

Akkor jelezz, ha a 2A élesben van.
