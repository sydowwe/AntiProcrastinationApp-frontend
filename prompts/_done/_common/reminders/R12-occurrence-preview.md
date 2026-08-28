# R12 · New capability — "so when does this actually fire?"

- **Scope:** `src/_common/modules/reminders/view/ReminderDefinitionDetailView.vue`, `component/ReminderScheduleDisplay.vue`, new component + api function
- **Backend:** **yes** — the honest version of this feature cannot be computed client-side
- **Model / effort:** **Opus 5**, high
- **Depends on:** R2 (the detail view's failure branch), R3 (the lead-offset strings this renders)
- **Unblocks:** nothing

---

```
New capability. The reminder detail view can tell an admin everything about a reminder except the one
thing they opened it to find out.

--- Submodule note, read this first ---

These files live in src/_common, the vue_framework git submodule. CLAUDE.md says never to write to it;
this task is the approved exception. Edit them in place; do not fork into src/ and do not add a
migration-revision.md entry. Leave the work in the submodule's working tree and say so at the end. Commit
and bump the pointer only if asked. ESLint and Prettier IGNORE src/_common — match the surrounding style
by hand (tabs, single quotes, no semicolons, camelCase props, PascalCase tags, destructure defaults).
Verify Vuetify props with the `vuetify` MCP.

--- The gap ---

ReminderDefinitionDetailView renders a reminder's schedule as its raw configuration:
  - RecurringCron → the cron expression as a monospace string, verbatim (line 159-161)
  - RecurringInterval → a preset name ("Weekly"), an anchor date and an optional end date (line 135-151)
  - OneShot → a due date and a set of lead-time offset chips (line 102-127)
plus a single `nextOccurrenceAt` in the lifecycle card (line 67-70).

So for a cron reminder, an admin verifying a schedule reads `0 7 * * 1-5`, and then either knows cron or
does not. For an interval reminder they get "Weekly" and an anchor, and have to work out whether the end
date truncates the series and where a lead offset lands relative to it. For a one-shot with three lead
offsets, four separate instants exist and exactly one is displayed.

The registry is the screen where you check that a reminder is configured correctly BEFORE it fires. It
cannot currently answer that.

--- What to build ---

A "next occurrences" panel on the detail view: the next N (5–10 is right) instants this reminder will
actually fire, in order, each labelled with what it is — the occurrence itself, or a lead-time nudge at
"30 days before the deadline". Enough that a human can look at it and say "yes, that is what I meant".

It should also handle the states that are not a list of future instants, and say so plainly rather than
rendering an empty box: Paused (would fire, currently suspended), Cancelled/Completed (terminal), a
recurring reminder past its `endDate`, and a one-shot whose due date has passed.

--- Why this needs the backend, and what you must not do ---

Do NOT compute the occurrences in the browser. Specifically, do not add a cron library, and do not
reimplement the interval arithmetic.

The reasons are not stylistic:
  - `ReminderScheduleType.RecurringCron` is documented as interpreted in UTC
    (dto/enum/ReminderScheduleType.ts:7). Reimplementing that mapping in the client's timezone is a bug
    the day someone in a different offset opens the page.
  - The server already computes `nextOccurrenceAt`. A second implementation in the client is guaranteed
    to disagree with it eventually, and the client's version will be the one on screen — a preview that
    is confidently wrong is worse than no preview, because the whole point is verification.
  - The `endDate` truncation rule, how lead offsets interact with a recurring schedule, and what happens
    when an offset lands in the past are all business rules that live on the server and are not stated
    anywhere the client can read.

So: **the panel is built against a contract you specify, and the ask is written from the work.**

--- Do this ---

1. **Design the contract first, and write it down before you write the component.** What the panel needs
   per entry: the instant, what kind of entry it is (occurrence vs lead-time nudge), and for a nudge, the
   offset so it can be labelled with the strings that already exist
   (`useReminderFormat.formatLeadOffset`). Plus, for the panel as a whole: whether the series is finite,
   and why it is empty when it is empty. Keep it minimal — every field you invent is one the backend has
   to justify.

2. **Build the panel against that contract**, with the api function typed and a response DTO written the
   way this module writes them (`static fromJson` with destructuring + defaults, `static
   listFromObjects` — follow dto/response/UpcomingReminderGridResponse.ts).

3. **Ship something real today.** Wire the panel to the endpoint, and when the endpoint is absent (404 /
   not implemented), degrade to what the current data honestly supports rather than showing a broken
   panel: `nextOccurrenceAt` as the single known future instant, the human-readable schedule description,
   and a clear statement that the full projection is not available yet. The detail view must not get
   worse for anyone while the ask is pending, and a reviewer must be able to see the finished UI.

   Do not fake the list with plausible-looking computed dates behind that fallback. An empty state that
   says "not available" is honest; five wrong timestamps are not.

4. **Improve what you CAN say client-side** — this part needs no backend and is worth doing regardless:
   translate the cron expression into a human sentence where it is safely translatable. Be conservative:
   the common shapes (every day at HH:MM, every weekday at HH:MM, a specific weekday, day-of-month) cover
   nearly all real reminders, and anything you cannot translate with certainty falls back to the raw
   expression, which is the current behaviour. A wrong plain-English cron description is worse than a
   cron expression, so only translate what you can prove. ReminderScheduleDisplay.vue is the place for
   this if it belongs in the compact display too; keep the raw expression visible either way.

5. Slovak strings only, in _locales/reminders.sk.ts, matching the surrounding tone; counts need the
   three-form plural treatment (src/i18n.ts:9, and see R3).

--- Out of scope ---

- Editing a schedule. This module is read-only for configuration by design — every write it exposes is a
  lifecycle transition (pause/resume/cancel) or a per-recipient suppression. Do not add a schedule editor.
- A calendar/timeline visualisation. A list of labelled instants is what verification needs.
- Occurrence previews on the list views. Detail view only.

--- Verification ---

npm run type-check — baseline 72 errors, all app-side in src/core; any src/_common error is yours.
npm run lint stays at 0.

Then on /pripomienky/register/<id>, for one reminder of each schedule type:
  - The panel renders, or states clearly why it cannot.
  - With the endpoint absent (it will be, until the ask lands): the fallback shows, the page is not
    broken, and nothing on screen is a fabricated timestamp.
  - A Paused reminder, a Cancelled one, and a recurring one past its endDate each say the right thing.
  - Your cron translations: check each against a cron reference by hand and list in your final message
    which shapes you translate and which you deliberately leave raw.
  - The lead-offset labels agree with the chips already on the page.

--- After the frontend work is done: write the backend ask ---

This is expected here, not conditional. Finish and verify the frontend first, leave a `// TODO(Bn):` at
the api function, then write it.

Read prompts/_common/reminders/backend/README.md for the format and scope rules — this is the FRAMEWORK's shared
reminder service, so say so, and note that this is a new read-only endpoint rather than a change to an
existing response, which makes it purely additive.

Include:
  - The contract you designed, exactly as you coded it, so the backend can confirm or correct it.
  - How many occurrences the client asks for and whether the count is the client's choice.
  - The business rules you had to assume: does the projection respect `endDate`; are lead-time nudges
    included as their own entries or implied; are past-but-unfired occurrences included; what does a
    Paused reminder project (nothing, or what it would fire if resumed — the panel wants the latter and
    the UI says which); does it respect per-recipient dismissals and snoozes, or is it the reminder's
    schedule irrespective of recipient (say which the UI assumes and why).
  - Whether this is cheap enough to call on every detail view load, or whether it needs to be
    request-bounded — you are asking for a computation, not a lookup, and the backend should know you
    thought about that.
  - What gets deleted from the frontend when it lands: name the fallback branch by file and line.
```
