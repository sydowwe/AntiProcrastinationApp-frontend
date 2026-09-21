# B15 · Backend ask — notification titles and bodies are composed in Slovak regardless of the account's locale

**Contract only.** Whether the server localizes at dispatch or the client localizes at render is the decision this ask puts to you; either is fine on this side. What
is not fine is the current third option.

> `_shell/B1`. Written 2026-09-15 from `docs/views/_fix-queue.md` escalation §1 — first filed from inference
> on an empty seed, **confirmed on real data 2026-09-13** once the fixture seeded six notifications.
>
> **✅ Landed as Option A (API `830cad6`) and verified in the browser 2026-09-21** — see the section at the
> bottom. No frontend half; escalation §1 is closed and its body is in `_fix-queue-log.md`.

---

## The problem

Signed in as the seed's `primaryUser`, whose preference is **`locale: EN`**, the notification panel (`/notifikacie` and the bell) renders every title and body in
**Slovak**: *"Blíži sa termín"*, *"Pripomienky"*, *"Obdobie sa čoskoro končí"*, *"Sústredenie skončilo"*, *"Naplánovaná úloha zlyhala"*. Only the fixture's own *"
Testovacia notifikácia"* carries an English body — and its title is Slovak too. The surrounding chrome (the bell's label, *Mark all as read*, relative timestamps) is
English, because that is the client's i18n.

The client renders `title` and `body` as opaque strings (`NotificationResponse`), so no `../../../../src` change can fix this: the text is fixed at dispatch, on the
server, and the account's locale is not consulted.

## The business rules

1. **A notification reads in the recipient's account locale** (`User.locale` — the same value
   `/user/preferences` stores and the client's `i18n` follows). Please confirm this is the intended contract rather than "the deployment's language".
2. **The locale at *dispatch* time is the one that counts** for a stored notification — a user who switches language later sees older rows in the old language.
   Acceptable to the client; say if you intend otherwise (that is the second option below).
3. **The push and e-mail channels are the same text**, so whichever option is taken has to serve all three channels — this is not an in-app-only fix.

## The shape the frontend needs — two options, pick one

**Option A — localize server-side at dispatch (no shape change).** Resolve the title/body against the recipient's locale when the row is created. `title`/`body` stay
strings. Cheapest on this side; the client changes nothing. Existing rows stay as they are.

**Option B — send a key + params, let each client resolve.** `NotificationResponse` gains
`titleKey: string`, `bodyKey: string`, `params: Record<string, string | number>` (keep `title`/`body` as a pre-rendered fallback for a transition). The client
resolves through vue-i18n under `notifications.<type>.*`
— the module already keys everything else by `type`, and `notificationTypeMeta.ts` is where the per-type strings would hang. Push payloads would need the same keys,
and the service worker would resolve them. More work on both sides, but it also covers rule 2's "switch language later" case and it is the same shape
`B19` (holiday names) would use if localized names are ever wanted there.

The client's preference is **A** — it fixes the observed defect with no contract change and the notification vocabulary is small. B is only worth it if you want
per-client rendering for another reason.

## What changes on the frontend once this lands

- **A:** nothing. `_shell/B1`'s *Verify* block (open the bell as an EN account, read the titles; trigger a fresh one and read that too) closes it.
- **B:** `NotificationResponse.fromJson`, `notificationTypeMeta.ts` gains the per-type title/body keys in both locales, and the service worker's push handler
  resolves keys. Say so before starting so the two sides ship together.

---

## ✅ Landed 2026-09-21 — Option A, all three rules confirmed, and rule 2 came out better than asked

API commit `830cad6` (*"Read the bell, the push and the mail in the account's locale, and word this portal's kinds here (B15)"*). Verified the same day through
`playwright-cli` against a fresh `e2e-v3` seed, signed in as `primaryUser` (`locale: EN`):

- The bell rendered all six fixture rows in English — *Deadline approaching: Feature Development.*, *You have 3 scheduled reminders.*, *“Weekly” ends in 1 day, 1
  task left. Done 0 of 1. Streak: 1.*, *“Daily” has ended: 5 of 5 done. Streak continues: 11.*, *Bug Fixing · Phase 2/4 · Cycle 1/2. Time for a break!*, *Test
  notification / Fixture notification for the e2e suite.*
- A fresh `POST /notification/test?type=ScheduledJobFailed` arrived live over SignalR as *Scheduled job “purge-expired-run-logs” failed and needs attention.*
- `PUT /user/preferences {locale: 'SK'}` then `GET /notification/mine` re-rendered the **same rows** as *Naplánovaná úloha „purge-expired-run-logs“ zlyhala a
  vyžaduje pozornosť.* / *Blíži sa termín: Feature Development.* / *Máte 3 naplánované pripomienky.*; switching back to EN restored the English text. So the
  "locale at dispatch" rule holds only for the pushed bytes — the bell follows the account's *current* locale, which is what Option B was for.

No e2e spec matched a Slovak notification string, so nothing in `../../../../e2e` changes. `notificationTypeMeta.ts` and `NotificationResponse` are untouched.

One local trap that is not this ask: the API's `20260920232719_CalendarHolidayKey` migration (B19) shipped in the same batch, and until it is applied
`POST /api/test/seed` answers a 500 (`column "holiday_key" of relation "calendar" does not exist`). `dotnet ef database update` in
`AdhdTimeOrganizer/AdhdTimeOrganizer` clears it.

### Backend response, verbatim

B15 · Backend answer — notification text now follows the account's locale

Option A, shipped server-side. No contract change. NotificationResponse keeps title / body as strings; nothing in src/ changes. The _shell/B1 Verify block closes it.

Rules, as answered

1. Recipient's account locale — confirmed. The text is resolved against User.locale, the same column /user/preferences writes and i18n follows. Not the deployment
   language, not Accept-Language.
2. "Locale at dispatch counts" — true for the pushed bytes, better than that for the bell. A notification row stores no text, only its type and payload; the
   title/body are composed on every read and every send. So:
    - Push and e-mail are rendered at dispatch in the locale the account had then — bytes already sent.
    - The bell (/notification/mine) re-renders every row in the locale the account has now. Switch language and the whole list, old rows included, follows. That is
      the Option-B benefit with no key/params on the wire — it comes free of the storage shape.
3. All three channels are the same text — confirmed. Push document, e-mail body and the e-mail chrome (button, footer) come off the same per-locale table as the
   bell.

What you'll observe

- Signed in as the seed's primaryUser (EN): Reminders / You have 3 scheduled reminders., Deadline approaching: Feature Development., Period ending soon, Focus
  finished, Test notification — instead of Pripomienky, Blíži sa termín, etc.
- User-authored payload content is rendered verbatim, not translated — a reminder's own title, an activity name, the DeadlineApproaching title a producer composed,
  the Test message. Only the vocabulary around it is localized. So the e2e fixture's Test row now reads Test notification / Fixture notification for the e2e suite. —
  English title, its English body.
- CZ accounts read Slovak. No Czech vocabulary exists on either side; this is deliberate and pinned by a test, not a fall-through.
- Quotation marks follow the language („…“ in SK, “…” in EN), and Slovak counts now decline their noun (1 úloha / 2 úlohy / 5 úloh) — if any spec matched the old
  zostáva 1 úloh, it needs the corrected form.

For the e2e side

- docs/e2eTestSeed.md no longer carries the ⚠ "bell text is Slovak regardless of locale" caveat. A spec that located a notification by its Slovak text under an EN
  account must switch to the English text; locating by type is still the stable option.
- Same for the service-worker push: title / body arrive already localized; the SW keeps rendering them verbatim.

Not needed / not changed

- No titleKey / bodyKey / params. notificationTypeMeta.ts stays as is.