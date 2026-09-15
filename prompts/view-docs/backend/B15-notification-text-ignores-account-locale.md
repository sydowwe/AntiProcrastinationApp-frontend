# B15 · Backend ask — notification titles and bodies are composed in Slovak regardless of the account's locale

**Contract only.** Whether the server localizes at dispatch or the client localizes at render is the decision
this ask puts to you; either is fine on this side. What is not fine is the current third option.

> `_shell/B1`. Written 2026-09-15 from `docs/views/_fix-queue.md` escalation §1 — first filed from inference
> on an empty seed, **confirmed on real data 2026-09-13** once the fixture seeded six notifications.

---

## The problem

Signed in as the seed's `primaryUser`, whose preference is **`locale: EN`**, the notification panel
(`/notifikacie` and the bell) renders every title and body in **Slovak**: *"Blíži sa termín"*,
*"Pripomienky"*, *"Obdobie sa čoskoro končí"*, *"Sústredenie skončilo"*, *"Naplánovaná úloha zlyhala"*. Only the
fixture's own *"Testovacia notifikácia"* carries an English body — and its title is Slovak too. The surrounding
chrome (the bell's label, *Mark all as read*, relative timestamps) is English, because that is the client's
i18n.

The client renders `title` and `body` as opaque strings (`NotificationResponse`), so no `src/` change can fix
this: the text is fixed at dispatch, on the server, and the account's locale is not consulted.

## The business rules

1. **A notification reads in the recipient's account locale** (`User.locale` — the same value
   `/user/preferences` stores and the client's `i18n` follows). Please confirm this is the intended contract
   rather than "the deployment's language".
2. **The locale at *dispatch* time is the one that counts** for a stored notification — a user who switches
   language later sees older rows in the old language. Acceptable to the client; say if you intend otherwise
   (that is the second option below).
3. **The push and e-mail channels are the same text**, so whichever option is taken has to serve all three
   channels — this is not an in-app-only fix.

## The shape the frontend needs — two options, pick one

**Option A — localize server-side at dispatch (no shape change).** Resolve the title/body against the
recipient's locale when the row is created. `title`/`body` stay strings. Cheapest on this side; the client
changes nothing. Existing rows stay as they are.

**Option B — send a key + params, let each client resolve.** `NotificationResponse` gains
`titleKey: string`, `bodyKey: string`, `params: Record<string, string | number>` (keep `title`/`body` as a
pre-rendered fallback for a transition). The client resolves through vue-i18n under `notifications.<type>.*`
— the module already keys everything else by `type`, and `notificationTypeMeta.ts` is where the per-type
strings would hang. Push payloads would need the same keys, and the service worker would resolve them.
More work on both sides, but it also covers rule 2's "switch language later" case and it is the same shape
`B19` (holiday names) would use if localized names are ever wanted there.

The client's preference is **A** — it fixes the observed defect with no contract change and the notification
vocabulary is small. B is only worth it if you want per-client rendering for another reason.

## What changes on the frontend once this lands

- **A:** nothing. `_shell/B1`'s *Verify* block (open the bell as an EN account, read the titles; trigger a fresh
  one and read that too) closes it.
- **B:** `NotificationResponse.fromJson`, `notificationTypeMeta.ts` gains the per-type title/body keys in both
  locales, and the service worker's push handler resolves keys. Say so before starting so the two sides ship
  together.
