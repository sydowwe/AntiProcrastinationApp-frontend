# H9 · Resolve the NowBar / DayPlannerWidget overlap

- **Scope:** `../../../src/core/home/component/NowBar.vue`, `DayPlannerWidget.vue`, `composable/useTodayPlan.ts`
- **Backend:** none
- **Model / effort:** Opus 5, high — this is a design decision about what the page is for, not a mechanical extraction. Get the decision right before touching code.
- **Depends on:** H1, H2
- **Unblocks:** nothing

---

```
NowBar and DayPlannerWidget render the same focus task twice, ~200px apart, with duplicated logic.

The overlap, concretely:
- `focusCountdown` (DayPlannerWidget.vue:431-445) and `countdown` (NowBar.vue:220-235) are the same
  function written twice — same three branches, same three i18n keys (endsIn / startsIn / wasDue).
- `focusIcon` (DayPlannerWidget.vue:419-429) and `modeIcon` (NowBar.vue:204-215) are the same switch,
  except DayPlannerWidget's `default` returns the warning triangle where NowBar's returns the
  champagne glasses — so in the `allDone` state the two show contradictory icons.
- Both render the focus task's name, its mode kicker (`$t(\`home.${focusMode}\`)`), its progress bar
  (`activeProgress`, `overrunMinutes`), and a primary action.
- The primary actions differ arbitrarily: NowBar offers Start / Done + Track time + a snooze/skip
  menu; DayPlannerWidget's focus block offers a big tick, and "+15m" when active or "Start" when not.
  `extendTask` is reachable ONLY from DayPlannerWidget; `skipTask` and `snoozeTask` ONLY from NowBar
  (its `snoozeOptions` / `skipReasons` at lines 190-191 are duplicated verbatim at
  DayPlannerWidget.vue:382-383 — where, check this, they may not even be used).

So the user sees the same task twice with different available actions and, in one state, two
different icons for the same thing.

Step 1 — decide, and write the decision down in a comment before coding. The two defensible answers:

  (a) NowBar owns the focus task; DayPlannerWidget becomes purely the day's list + day strip, with
      its focus block removed and its unique actions (extend) moved up into NowBar's menu.
  (b) DayPlannerWidget owns the whole plan including focus; NowBar shrinks to the date + streak +
      a one-line "now: X" with no actions.

(a) is the better fit for this page — NowBar is above the fold, full width, and HomeView.vue:3
already comments it as "what to do right now, above everything else"; the planner card is the
list view. Prefer (a) unless reading the components changes your mind, and if it does, say why.

Step 2 — whichever you pick, the shared derivations move into useTodayPlan.ts, which already exports
`focusMode`, `focusTask`, `activeProgress`, `overrunMinutes` and `minutesLabel`. Add the countdown
string and the mode icon there so there is exactly one definition of each. Note the composable
already imports i18n directly (line 15) for its alert strings, so a t()-using computed is consistent
with what is there — but check that pattern reacts to a locale change; if it does not, keep the
string in the component and share only the inputs.

Step 3 — make the action set complete and identical wherever the focus task appears: start, finish,
extend, snooze, skip, track. Right now which actions you get depends on which of the two widgets you
happen to click, which is not a design.

Also fix while you are here:
- NowBar.vue:197 hardcodes `locale.value === 'EN' ? 'en-GB' : 'sk-SK'` for date formatting. Two
  locales are hardcoded into a ternary in a component. Move the locale→BCP47 mapping somewhere it
  can grow (or use the framework's DateTimeHelper `formatLocalized`, which may already do this —
  read it first).
- NowBar.vue:242-246: `start()` calls `void requestNotificationPermission()` on every start, not
  just the first. The comment says "ask on the first deliberate start". Browsers no-op a repeat
  request after a decision, so this is not a bug users see, but the code does not do what it says.
- DayPlannerWidget is 666 lines. If the split lands as described, it should shrink a lot; if it does
  not, extract the day strip (template + the ~10 computeds at lines 386-410 + its CSS) into its own
  component. Do not split it further than that — the row list is cohesive.

Do NOT change any request, any status transition, or the streak logic.

--- Verification ---

npm run type-check (≤ 72 errors), npm run lint (0 errors). Then walk all four focus modes with real
data — now / upNext / missed / allDone — and confirm the focus task appears in exactly one place,
with one icon, one countdown, and the same action set in every mode where that action is meaningful.
```
