# H4 · Extract the shared widget shell

- **Scope:** `../../../src/core/home/component` — new `WidgetCard.vue`, refactor 4 widgets
- **Backend:** none
- **Model / effort:** Opus 5, high — a slot API that has to fit five different bodies without becoming a leaky config object; getting the flex/overflow contract
  right is the whole job.
- **Depends on:** H1 (fixes the fixed-height and header-layout bugs this would otherwise bake in), H3 (paths)
- **Unblocks:** H6, H7 (both hang new states off this shell)

---

```
Four widgets in src/core/home/component/ repeat the same card scaffold with small divergences that
are accidents rather than decisions:

  ActivityHistoryWidget.vue   VCard > VCardTitle(title + open-in-new) > VDivider > VCardText(scroll)
  TodoListWidget.vue          same, plus a hide-done toggle
  RoutineTodoWidget.vue       same, plus hide-done, plus streak chips, plus a nested flex body
  QuickRecordWidget.vue       same shell, no actions, non-scrolling body
  DayPlannerWidget.vue        richer header (avatar, chips, progress ring) — see the note below

The divergences that are bugs, not intent:
- title padding is `px-4 pt-4 pb-2` in three widgets, `px-4 pt-4 pb-3` in DayPlannerWidget
- QuickRecordWidget.vue:3-6 hardcodes `style="height: 64px"` on its VCardTitle to line up with the
  neighbours it sits beside; the others get their height from content, so the row is aligned by
  coincidence and breaks the moment a title wraps
- the loading branch is copy-pasted four times (`d-flex justify-center align-center h-100` +
  VProgressCircular indeterminate)
- the empty branch is copy-pasted with different classes each time (`text-center
  text-medium-emphasis py-4` in three, a much richer centred icon+CTA block in DayPlannerWidget)
- three different flex/overflow incantations for the body, with the load-bearing rules
  (`flex: 1; min-height: 0; overflow-y: auto`) present in some and not others

Build src/core/home/component/WidgetCard.vue that owns:
- the card frame: flex column, `overflow: hidden`, full height of whatever column it is placed in,
  never a fixed pixel height (see H1 item 4 for why that broke)
- a header: `title` prop (already-translated string, not a key), `#headerActions` slot, and an
  optional `openRouteName` / `openRouteParams` pair that renders the standard
  `fa-up-right-from-square` VIconBtn — every widget has one and they all push a route
- state branches: `loading` and `empty` props with `#empty` slot and an `emptyText` prop for the
  simple case; the widget passes its own state in, the shell decides how it is rendered
- a body region that scrolls correctly: the `flex: 1; min-height: 0; overflow-y: auto` contract in
  ONE place, with a `scrollable` prop (default true) so QuickRecordWidget can opt out
- a consistent header height so the three cards in the bottom band align by construction, replacing
  QuickRecordWidget's hardcoded 64px

Follow the project's prop conventions: destructure defaults, no withDefaults, camelCase in template
and script, `function` declarations.

Then convert ActivityHistoryWidget, TodoListWidget, RoutineTodoWidget and QuickRecordWidget to use
it. Behaviour must be identical afterwards, including the hide-done toggles and the streak sheets,
which become `#headerActions` content.

DayPlannerWidget: convert it too, but only if its header fits `#headerActions` without contorting
the shell — its header carries an avatar, two conditional chips and a progress ring. If making the
shell accommodate that means adding more than one prop that only DayPlannerWidget uses, leave it on
its own frame and say so in a comment at the top of the file. A shell with a per-caller escape hatch
for every variation is worse than four honest duplicates. Use judgement and state which you chose.

Do NOT:
- change any data fetching, any request, or any of the widgets' business logic
- add error handling — that is H6, and it will add an `error` state to this shell afterwards
- touch NowBar.vue, which is not a card and shares nothing with this shell

--- Verification ---

npm run type-check (≤ 72 errors), npm run lint (0 errors). Then load the home page at a tall window
and at a short one (≈700px) and confirm: no card overflows its column, the three bottom cards' header
baselines line up, every body scrolls internally rather than pushing the page, and every
open-in-new button still navigates where it did before.
```
