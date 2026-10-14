# B4 · Backend ask — a once-a-day digest of the routine items suggested for today and not done yet

**Contract only.** It asks for one new notification type, the rules for when it is raised and what it carries, and answers to three questions. Where the
sweep runs, how "already sent today" is remembered and how the user's morning is looked up are the backend's decisions.

> Written 2026-09-29 from `prompts/captured-data/C4-routine-suggested-day-nudges.md`, after its frontend half shipped. That half moved the "suggested for
> today" rule into `todoList` (`src/core/todoList/dto/response/routine/routineSuggestedDay.ts`, unit-tested) and marks today's open items on
> `/routine-todo-list`. Both only help someone who already has the app open. This ask covers everyone else.

---

## The problem

A routine item can name the day it is meant for: `SuggestedDays` on a weekly item ("gym: Tuesday, Thursday") or `SuggestedDayOfMonth` on a monthly one ("pay
rent: the 3rd"). The server already enforces which field applies to which period (`RoutineTodoListPeriodRules.cs:62-75`: daily takes neither, `LengthInDays
≤ 14` takes days, `> 14` takes a day of month).

Nothing tells the user that the day has come. The three routine notifications are all about the **period**, not the item:

- `RoutinePeriodEndingSoon`: "3 days left, 5 of 8 open"
- `RoutinePeriodEnded`
- `RoutineStreakGraceExpiring`

All three come from `RoutinePeriodNotificationService.cs` and the 09:00 UTC sweep in `RoutinePeriodNudgeJobHandler.cs`. On Tuesday morning, nobody hears
"Tuesday's gym is today" unless they open the routine list and read the chips.

## The business rules

State them back, or correct them. The client follows the server's answer.

1. **What qualifies.** An item qualifies on a user's day when all of these hold:
   - it belongs to a period that is **not daily** (`LengthInDays !== 1`);
   - the period is **not hidden**, the same filter the nudge sweep uses (`RoutinePeriodNudgeJobHandler.cs:43`);
   - the item is **suggested for that day** (rule 2);
   - it is **not done** when the digest is composed.
2. **Suggested for a day.** This is the rule the client ships in `routineSuggestedDay.ts`, and both sides must agree on it:
   - weekly (`1 < LengthInDays ≤ 14`): `SuggestedDays` contains the day's weekday;
   - monthly and longer (`> 14`): `SuggestedDayOfMonth` equals the day of the month, **clamped to the month's last day**, so "the 31st" is 30 September and
     "the 30th" is 28 February (29th in a leap year). This matches what `RoutineResetService.MonthlyCandidate` already does for reset anchors. A month is
     never skipped.
   - An item with nothing set is suggested on no day.
3. **Daily routines never qualify.** They are suggested every day by definition, so a daily push about them is noise.
4. **One digest per user per day, not one push per item.** A user with three items due gets one notification that names them.
5. **Nothing is sent if nothing qualifies.** There is no "nothing today" message.
6. **The day and the hour are the user's.** "Today" is the calendar date in `User.Timezone`, not UTC. The existing sweep runs at a single UTC instant, so it
   is Tuesday afternoon in Tokyo and still Monday night in Los Angeles. A digest composed then names the wrong day for most of the world. Your call how to
   get there: a more frequent sweep that picks up users whose morning has arrived, per-user scheduling, or something else.
7. **When in the morning.** *Question.* No per-user morning setting exists. `UserPlannerSettings` has none (`UserPlannerSettings.cs`), and
   `DefaultWakeUpTime` belongs to a day template, not to the user. The nearest real value is the day's own `Calendar.WakeUpTime`. It exists once the day is
   planned or lazily created, and a lazily created day gets 08:00 (`LazyCalendarCreationTests.cs:112`). Proposal:
   - send at that day's `WakeUpTime` when the day row exists;
   - otherwise send at 08:00 in the user's zone, the same default a new day gets.

   Please do not add a new setting for this. If reading the planner's calendar from the Routines slice is the wrong dependency, a fixed 08:00 local is an
   acceptable answer. Tell me which you chose.
8. **A missed day is never mentioned again.** If Tuesday's gym is still open on Wednesday, Wednesday's digest does not list it and does not say "you missed
   Tuesday". `RoutinePeriodEndingSoon` already covers running out of time. A daily reminder of yesterday is a guilt feed.
9. **Composed at send time, not at registration.** Same reasoning as the nudge sweep's own comment (`RoutinePeriodNudgeJobHandler.cs:13-18`): an item ticked
   at 07:55 must not appear in an 08:00 digest.
10. **Quiet hours and channel choice are applied downstream, as for every other type.** The producer does not consult preferences, which is what
    `RoutinePeriodNotificationService`'s summary already says about the other three.
11. **Muting.** The C4 prompt assumed this goes through `/reminder-preference` `(ownerModule, kind)`. **It does not, and should not.** That registry only
    governs scheduled reminders. The three routine types are not reminders, and they appear as rows of the per-`(type, channel)` matrix
    (`GET /notification-preference/mine`) because they are listed in `AddNotificationCatalog` (`ModuleServiceExtensions.cs:207-210`). The new type goes in
    that list next to them. Then it gets a row on the settings screen, and turning its channels off stops it, exactly like the other three.
    `NotificationCatalogTests` should cover it.
12. **A failed send is not "sent".** If dispatch is swallowed, the day is not marked, and a later run that same morning may retry. This is the same
    rule as `EndingSoonNotifiedFor` and `GraceNotifiedFor`.

## The shape the frontend needs

**A new `NotificationType` member**, serialised by name like the others. Proposed name: `RoutineSuggestedToday`. Rename it if it clashes with anything in
`Sydowwe.Framework.Contracts`. The client registers whatever name you pick.

**Payload.** The client never reads the payload. It renders the server's `title` and `body`, so the payload only has to carry what the text needs and what
the subject is derived from. Suggested:

| Field | Type | Why |
|---|---|---|
| `date` | `YYYY-MM-DD`, the user's local date | Which day the digest is about, so a late delivery after quiet hours can still say so honestly. |
| `items[]` | `{ itemId: long, name: string, periodId: long }` | The names go in the body. `periodId` is only there to derive the subject. |
| `count` | int | So the body can say "and 2 more" without listing everything. |

**Text, in both portal tables** (`SkPortalNotificationTexts.cs`, `EnPortalNotificationTexts.cs`). `NotificationVocabularyTests` refuses the fallback. The
wording is yours, roughly:

- EN title "Suggested for today", body "Gym, Pay rent and 2 more".
- SK title "Na dnes odporúčané", body "Posilňovňa, Nájom a ďalšie 2".

Use the Slovak plural rules the client uses (1 / 2–4 / 5+).

**Subject.** Derived the way `NotificationTextRenderer` derives it for the other routine types:

- every listed item in **one** period: `{ kind: 'routinePeriod', id: <periodId> }`. The client already deep-links that kind to
  `/routine-todo-list?focus=<periodId>`, which scrolls to the group or explains that it is hidden;
- items in **more than one** period: **no subject**. The client then falls back to the type's route, the plain `/routine-todo-list`.

Please do not invent a per-item kind for this. The client will not add one on its own side either.

## What changes on the frontend once this lands

- `src/app/notifications/notificationTypeMeta.ts`: one entry, marked `TODO(B4)`. It gets an icon (`calendar-check`, the same icon as the list's "Today"
  marker), a colour and `route: n => subjectRoute(n, { name: 'routineToDoList' })`, identical to the other three routine types. `notificationSubjectRoutes.test.ts`
  gains it in its routine loop.
- An inbox-filter label for the type, through `NotificationTypeMeta.label`, in SK and EN.
- `reminderLabels.ts` **does not change** (rule 11).
- No settings UI is added anywhere. The row appears on the notification settings screen because the catalog lists it.

## How the client will verify

Against the e2e seed, nothing mocked. Items are created through the app's own API and deleted afterwards:

1. Create a weekly item suggested for today's weekday in the user's zone, and a second one for another weekday. Run the job on demand from the scheduler
   screen (`schedulerRoutes`, `/planovac`), or tell me how to trigger it. Expect exactly one `RoutineSuggestedToday`: it names the first item and not the
   second, and its subject is the weekly period.
2. Run the job again the same day. Nothing new arrives (rule 4).
3. Tick the item done, then force a fresh day. Nothing arrives (rules 1 and 5).
4. Add a monthly item for the 31st, and check a 30-day month's last day. It is named (rule 2). If the job cannot be run "as of" another date, a server-side
   test is enough, and I'll say so in the verification note.
5. Put the items in two periods. The digest carries no subject, and a click lands on `/routine-todo-list` (rule "Subject").
6. Turn the type's channels off on the notification settings screen. The next day's run raises nothing for this user (rule 11).
7. The seed's daily items (`E2eFixtureSeeder.cs:839`, `:906`) never appear, even though they carry all seven weekdays in `SuggestedDays`, which the create
   validator would refuse. Rule 3 decides by period length, not by the field.

---

## Backend reply (2026-09-29) and the client side that followed

**Delivered as asked, under the proposed name `RoutineSuggestedToday`.** Every rule is implemented as written.

- **Rule 7 (morning):** as proposed. The digest goes out at that day's `Calendar.WakeUpTime` if the day row exists, otherwise at 08:00 in the user's zone.
  There is no new setting. Routines reads the calendar through Core's `ICalendarDayLookup` seam, so Routines does not depend on Planning.
- **Rule 6 (user's day):** a new job, `Routines.SuggestedToday`, runs every 15 minutes. For each user it takes the local date and time in `User.Timezone`,
  and the first run after that user's morning sends the day's digest if it hasn't gone yet.
- **Payload:** `{ date, items[{ itemId, name, periodId }], count }`. Items are ordered shorter periods first, then `displayOrder`.
- **Body text:** up to three items are all named. With more than three, two are named and the rest counted, so "and 1 more" never appears. The Slovak text
  uses the plural forms.
- **Subject:** `routinePeriod` when every item is in one period. It is absent otherwise, and there is no per-item kind.
- **Muting:** the type is in the notification catalog, so it has its own row in `GET /notification-preference/mine`.
- **Details beyond the ask:**
  - "Done" means ticked in the **currently open** cycle, so a leftover tick from a cycle whose reset is due but not yet applied does not hide today's item.
  - A period created after the digest went out does not trigger a second digest that day.
  - A day where nothing qualifies is not marked, so an item added later that day can still earn a digest.
  - If quiet hours defer delivery, `date` still names the original day.
- **The server copy of the rule is `RoutineSuggestedDay.IsSuggestedOn`.** It and `routineSuggestedDay.ts` must change together or not at all.

**Client, after the reply:**

- `notificationTypeMeta.ts` registers `RoutineSuggestedToday`:
  - icon `calendar-check`, colour `secondary`;
  - route `subjectRoute(n, { name: 'routineToDoList' })`, the same as the other three routine types;
  - an app-side `label` (`routineTodoList.suggestedTodayNotificationType`, SK and EN). The framework's `notifications.type.*` block names only the
    framework's own types. An app-side `notifications` namespace would not merge with it but replace it wholesale (only four namespaces are deep-merged),
    wiping every framework notification string.
- `notificationSubjectRoutes.test.ts`:
  - the new type is in the routine deep-link loop and in the bell/worker parity table;
  - a subject-less digest lands on `routineToDoList` in the app;
  - one accepted asymmetry is pinned: a **push** click on a subject-less digest lands on `/`, because the service worker has no per-type route
    (`resolveNotificationTargetUrl`'s settled B2 chain is subject → producer `url` → `/`). Home's routine widget shows exactly today's suggested items, so
    that is an honest place to land, and a second per-type map in `public/notification-subject-routes.js` was not worth it for this one case.
- `reminderLabels.ts` is unchanged, and no settings UI was added.

**Verified live, 2026-09-29 (19:05 Bratislava), after the API restart and the `RoutineSuggestedTodayMark` migration.**

The job marks the day on all of a user's periods the moment it sends, so each account gets one digest a day. The steps were therefore spread over the three
seed accounts. Each run was triggered with `POST /scheduled-job/trigger-now` (`jobKey: "Routines.SuggestedToday"`), and its `Succeeded` row in
`/scheduler-dashboard/run-history` was checked by correlation id before reading the inbox. Test rows were created and deleted through the app's own API.

- **Primary user, steps 3, 1 and 2:**
  - Weekly items "Read a Novel" (Tuesday) and "Morning Exercise" (Wednesday), with the Tuesday one ticked. The run sent nothing.
  - Unticked and re-run: exactly one digest, title "Suggested for today", body "Read a Novel", subject `{ routinePeriod, 6 }`. The Wednesday item was not named.
  - Third run: still one digest.
- **In the app (primary):**
  - The bell row shows `calendar-check` in `secondary`.
  - A click navigates to `/routine-todo-list?focus=6`, and the view clears the parameter after revealing the group.
  - The inbox type filter offers "Routine suggested for today", and `?type=RoutineSuggestedToday` lists only the digest.
  - `/nastavenia/pripomienky` has a row for the type under the same label.
- **Secondary user, step 5:** "Draft Proposal" in Weekly on Tuesday and "Post a Parcel" in Monthly on the 29th gave one digest, body "Draft Proposal and
  Post a Parcel" (the shorter period first), with **no** `subject` key. A bell click navigated to the plain `/routine-todo-list`.
- **Admin user, step 6:**
  - In-app was switched off by unticking the row on `/nastavenia/pripomienky`. WebPush was switched off through the API, because the row disables it in a
    browser with no push subscription. Email was already off.
  - A qualifying Tuesday item was created and the job run. It succeeded, and the inbox received nothing.
  - The preferences were restored afterwards.
- **Steps 4 and 7** cannot be driven as-of another date. They rest on `RoutineSuggestedTodayJobTests`, as the reply says: the 31st on 30 Sep, the 30th on
  28/29 Feb, daily items never named, and the Tokyo/LA day split.
- **Not exercised:** a real Web Push click. The worker's fallback for a subject-less digest (`/`) is pinned in `notificationSubjectRoutes.test.ts` instead.

Left behind on purpose: the three accounts' periods carry `suggested_today_notified_for = 2026-09-29`. That is the real "already sent" mark, it only
suppresses today's digest, and the next `POST /api/test/seed` clears it.
