# B19 · Backend ask — public-holiday names: a design decision on country and locale, not a defect

**A decision, not a defect report.** Nothing here is broken against its own design. Written so the two units
that filed it as a bug stop re-filing it, and so `planner-day.draft.spec.ts:48`'s `fixme` has a policy to wait
on.

> `history-review/B4` and `planner-day/B4`, both re-graded `bug` → `polish` (`_fix-queue.md` *Contradictions*
> §30). Written 2026-09-15 from escalation §8. Source read in `AdhdTimeOrganizer.Planning` 2026-09-13.
> **Blocking nothing.**

---

## What was filed, and what is actually true

Both units read *"Deň Ústavy Slovenskej republiky"* (2026-09-01) and *"Sedembolestná Panna Mária"*
(2026-09-15) off the calendar as an EN-locale account and filed it with `_shell/B1` (notification text in
the wrong locale). It is not the same shape:

- `CalendarDayFactory.cs:37` writes `HolidayName = HolidayCalendar.ForDate(date, countryCode)` when a
  `Calendar` row is created (seeder or lazy provisioner — both go through it).
- `HolidayCalendar.cs:31-56` is a **Slovak** table of native names, with a Czech sibling (`:58-81`) and
  `DefaultCountryCode = "SK"` — *"the only country this app has ever seeded"* (`:11-12`).
- The column is `string?`, max 200; the History and Planner endpoints project it as-is.

So the string is the holiday's **proper name**, in the language of the country whose holiday it is. There is
no English variant anywhere that could have been chosen instead, and an EN-locale user *in Slovakia* arguably
should see "Sedembolestná Panna Mária" — that is what the day is called. The finding's other pass condition
(*"omitted for accounts outside Slovakia"*) has nothing to read: `User` carries no country, and
`HolidayCalendar` is only ever called with the default.

**Native-name rendering is a defensible default and costs nothing.** It just has to be a decision rather than
an accident of `DefaultCountryCode`.

## The question — two independent halves, take either, both, or neither

### 1. A country preference

Without one, "outside Slovakia" cannot exist. If wanted: it describes the person, so it belongs on
`/user/preferences` (the client's ownership rule in CLAUDE.md), and `CalendarDayFactory` reads it instead of
the constant. Note the re-materialisation problem: rows are created once, so a country change would need
either a backfill or the holiday column becoming a **lookup at read time** (`HolidayCalendar.ForDate` is cheap
and pure, so that is viable and avoids the backfill entirely). The Czech table already exists, so `CZ` is a
free second value.

### 2. Localized holiday names

If wanted at all: store (or emit) a **stable key** per holiday (`SK_CONSTITUTION_DAY`) and let each client
resolve it through vue-i18n — the same *"send a key + params"* shape `B15` offers as its option B for
notifications. The client would carry a `calendar.holidays.<key>` table in both locales. If **not** wanted,
say so and the `fixme` becomes a plain assertion on the native string.

The client's preference: **1 = yes, at read time; 2 = no.** A Slovak user sees Slovak names, a Czech user
Czech names, and an EN-locale user in either country sees the name the day actually has.

## The shape the frontend needs

- If 1: `country: string | null` on `User` / `UserPreferencesRequest` (ISO 3166-1 alpha-2), merged app-side
  through `userAugmentation.ts` like `firstDayOfWeek`; a select in the app's preferences card. `holidayName`
  stays a string.
- If 2: `holidayKey: string | null` alongside (or instead of) `holidayName` on every calendar-day response
  (`POST /calendar/filter`, the History calendar endpoint).
- If neither: nothing.

## What changes on the frontend once this lands

`CalendarGrid.vue:104` renders whatever arrives and needs no change for 1. For 2, a locale table and a
one-line resolve in the two consumers. `planner-day.draft.spec.ts:48` stops being a `fixme` either way.
