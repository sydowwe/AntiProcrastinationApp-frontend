# P2 · `firstDayOfWeek` — a preference with no control and one consumer

- **Scope:** `../../../src/core/user/component/settings/PreferencesSection.vue`, `core/todoList` (one composable)
- **Backend:** likely — the field may never be returned by `/user/data`
- **Framework:** yes — `CalendarGrid` is hardcoded to ISO weeks; you will write the ask
- **Model / effort:** Sonnet 5, medium effort
- **Depends on:** U1 (defaulted read) and P1 (which settles that this field belongs to `/user/preferences`).

---

```
`firstDayOfWeek` is declared, typed, localized in both languages — and unreachable. There is no
control anywhere in the app that sets it, and `PUT /user/preferences` is therefore never called with
it. Whatever the backend has stored is whatever the backend defaulted to.

WHAT EXISTS TODAY

    src/core/user/dto/userAugmentation.ts:14,21   declared `0 | 1` on both User and the request
    _common/modules/user/_locales/user.sk.ts:120  `Prvý deň týždňa` — a label with nothing to label
    core/todoList/composable/useRoutineWeeklyReview.ts:17
        const firstDayOfWeek = userStore.currentUser.firstDayOfWeek ?? 1

That `?? 1` is the only live read in the app, and it silently contradicts the non-optional `0 | 1`
declaration — U1 should already have made the declaration optional and routed reads through
`useUserPreferences()`. If U1 has not run, do that part first; do not add a control on top of a type
that lies.

The header comment at `userAugmentation.ts:5` claims the field "feeds the planner calendar". It does
not. The planner calendar is `_common/component/calendar/CalendarGrid.vue`, and it computes its weeks
with `getISOWeekStart` / `getISOWeekEnd` (lines 208, 209, 225, 267) — dayjs `isoWeek`, permanently
Monday. `_common/utils/DateTimeHelper.ts:90-104` has no non-ISO variant. `useRoutineWeeklyReview.ts:9`
already documents this: "DateTimeHelper's getISOWeekStart is fixed to Monday, so the boundary is
computed locally here instead."

WHAT TO DO

1. ADD THE CONTROL. A two-value choice in `PreferencesSection.vue` — Monday (1) or Sunday (0). Use a
   `VBtnToggle` with `mandatory`, matching the theme toggle in the framework's `AppearanceSection`
   (lines 10-21) so the settings page stays visually coherent; a `VIdSelect` with two items is
   heavier than the choice deserves.

   `_common/composable/general/useDayOfWeekOptions.ts` returns all seven days with localized labels
   from `calendar.*` — use it as the label source for the two you render rather than adding new
   locale keys, but do NOT widen the control to seven values. The type is `0 | 1` and widening it is
   a contract change you are not authorized to make here.

   Save on change through `setPreferences`, matching the existing switch's handler — including U3's
   snackbar fix if it has landed.

2. VERIFY THE ROUND TRIP, and this is the part that matters. Change the setting, hard-reload, and
   confirm the value comes back. `User.fromJson` copies unknown keys through (`User.ts:41-43`), so if
   `/user/data` does not include `firstDayOfWeek`, the field returns as `undefined` and the toggle
   resets to the default on every reload while the server quietly holds the real value. That failure
   looks exactly like "the toggle doesn't stick" and has nothing to do with your code.

   If it does not round-trip, do NOT work around it client-side. Write
   `prompts/user/backend/B<n>-first-day-of-week.md` per `prompts/user/backend/README.md`: state that
   the frontend now sends `firstDayOfWeek: 0 | 1` on `PUT /user/preferences` and needs it echoed on
   `POST /user/data`, name the consumer (the routine weekly review's week boundary), and ask what the
   server-side default is so the client default can agree with it rather than fight it. Leave the
   control in place — the write side works even if the read side does not.

3. AUDIT THE OTHER WEEK BOUNDARIES. `useRoutineWeeklyReview.ts` respects the preference. Grep for
   `getISOWeek` across `src/core/` and list every other place the app decides where a week starts.
   For each, say whether it should follow the preference or is legitimately ISO (week NUMBERS are
   ISO by definition — `formatWeekLabel`'s `W1` is not a bug). Fix the ones that are app-facing week
   boundaries and can be fixed without touching `_common`. Do not fork `DateTimeHelper`.

4. THEN WRITE THE FRAMEWORK ASK. `CalendarGrid` is the one consumer you cannot fix from here, and it
   is the most visible one — the planner calendar will keep starting weeks on Monday for a user who
   chose Sunday. Write `prompts/user/framework/F<n>-calendar-week-start.md` per
   `prompts/user/framework/README.md`, asking for an optional `firstDayOfWeek` prop on `CalendarGrid`
   (defaulting to ISO/Monday so no existing consumer changes) and a non-ISO week-start helper in
   `DateTimeHelper`. Add the matching `migration-revision.md` entry under "Still open". Name the
   local workaround kept in the meantime — `useRoutineWeeklyReview`'s hand-rolled boundary — and say
   it gets deleted when this lands.

5. FIX THE LYING COMMENT at `userAugmentation.ts:5` while you are in the file.

Run `npm run type-check` and `npm run lint`. Verify: set Sunday, reload, the toggle still says Sunday
and the routine weekly review's week boundary moves with it.
```
