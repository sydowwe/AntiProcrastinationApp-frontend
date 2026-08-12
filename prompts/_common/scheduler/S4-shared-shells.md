# S4 · Shared shells — one detail page, one enum chip, one home for pure helpers

- **Scope:** both detail views, the three `*Chip.vue` files, `composable/useSchedulerFormat.ts`, `dto/index.ts`
- **Backend:** —
- **Model / effort:** Opus 5, high
- **Depends on:** S1 (it fixes the detail-page states you are about to extract), S3 (it rewrites the grids' scripts)
- **Unblocks:** S7 (a11y fixes land in one shell instead of two)

---

```
Four consolidations in the scheduler module at src/_common/modules/scheduler/. One of them is a
silent CSS bug. This prompt needs judgement — two of the four could be over-consolidated, and the
prompt says where to stop.

SUBMODULE RULES — read before editing:
src/_common is the vue_framework repo mounted as a git submodule, and CLAUDE.md says never to write
to it. This task is an explicit, user-approved exception: the scheduler module lives there and
nowhere else. So:
  - Edit the files in src/_common in this working tree. Do NOT fork a file into src/, and do NOT add
    a migration-revision.md entry.
  - Leave the work in the submodule's working tree and say so in your final message; the parent repo
    will show a dirty submodule pointer. Commit inside the submodule only if the user asks.
  - ESLint and Prettier ignore src/_common, so `npm run lint` will not check your work. Match the
    surrounding style by hand: tabs, single quotes, no semicolons, tab-indented <script setup>.
  - `npm run type-check` DOES cover src/_common. Baseline is 72 errors, all app-side in src/core;
    _common is clean. Any new error under src/_common is a regression you introduced.

1. `.info-row__value` HAS NEVER APPLIED. Fix this first — it is a live bug, not a refactor.
   InfoRow.vue:34 defines `.info-row__value { font-size: 0.9375rem; … }` inside a <style scoped>
   block, with no :slotted(). Both detail views then put that class on spans they pass INTO the
   slot:
       SchedulerJobDetailView.vue:60, 88, 94, 115
       SchedulerRunDetailView.vue:153
   Slot content is compiled in the PARENT's scope and carries the parent's data-v attribute, so the
   selector `.info-row__value[data-v-inforow]` never matches. Those five values silently render at
   default size and colour while their siblings — the ones using InfoRow's `value` prop, which is
   rendered inside InfoRow and does get the attribute — render at 0.9375rem. Nobody noticed because
   the difference is small and the two never sit adjacent.
   Decide the honest fix and apply it consistently:
     - either InfoRow exposes the style to slotted content (`:slotted(.info-row__value)`), which makes
       the existing call sites correct as written,
     - or the call sites stop borrowing another component's private class and the styling moves into
       InfoRow's own wrapper so any slot content gets it automatically.
   Prefer the second if it does not change the layout — a component's scoped class is private and
   five call sites reaching into it is what caused this. Either way the five values must end up
   visually identical to the prop-rendered ones. Compare them side by side in the browser; do not
   reason about it.
   InfoRow.vue is framework-wide (src/_common/component/feedback/), used well outside the scheduler.
   Whichever fix you choose must be additive for every other consumer — grep for InfoRow usages and
   check that none of them relies on slot content NOT being styled.

2. ONE DETAIL-PAGE SHELL INSTEAD OF TWO.
   SchedulerJobDetailView.vue and SchedulerRunDetailView.vue are the same page written twice:
     - a back button, a header row of chips, an action button (JobDetail:7-38, RunDetail:7-42)
     - a card whose body is an auto-fit info grid — .job-info-grid (JobDetail:212-216) and
       .run-info-grid (RunDetail:308-312) are byte-identical apart from the name:
       `repeat(auto-fit, minmax(220px, 1fr))`, gap 16px
     - a centred VProgressCircular while loading (JobDetail:135-143, RunDetail:187-195)
     - a not-found VAlert (JobDetail:145-151, RunDetail:197-203)
     - after S1, also a load-failure alert with retry, and a forbidden card
   Extract the shell so those states are defined once. Two candidate seams, and you should probably
   do both:
     - an info-grid layout component (the CSS is identical and trivially shareable), and
     - a detail-page state wrapper taking loading / notFound / failed / forbidden and slotting the
       body, so a future state is added in one file rather than two.
   Where the wrapper belongs is a real decision: if it is scheduler-shaped, keep it in the module's
   component/ directory; if it is genuinely generic, src/_common/component/ is the right home but the
   blast radius is the whole framework. When in doubt keep it module-local — a second module can lift
   it later, and a premature framework component is much harder to walk back. Say which you chose and
   why in your final message.
   Do NOT change what either page renders. Same chips, same order, same copy.
   The two pages are NOT identical and must not be forced into one component: the job page embeds
   JobRunHistory and JobActionButtons, the run page has the payload card, the lineage card and the
   replay dialog. You are sharing a frame, not merging two pages.

3. THREE ENUM CHIPS THAT ARE ONE CHIP.
   JobStatusChip.vue, RunOutcomeChip.vue and TriggerSourceChip.vue are the same 40-line shape:
   props { value, size = 'small' }, an icon computed switch, a colour computed switch, and
   `$t('scheduler.<ns>.' + value)` rendered through ChipWithIcon. Each also carries an unreachable
   `default:` branch — the props are typed to the enum, so `default` can only fire on bad server data,
   and then it renders a grey "circle" chip that says nothing useful.
   Collapse the duplication, but keep the call sites readable. The three components are used 12 times
   across the module with meaningful names; replacing every `<JobStatusChip :status>` with a generic
   `<EnumChip :map="jobStatusMap" :value>` makes the templates worse. Prefer: one shared chip
   implementation plus three thin named wrappers that supply their map, so call sites are unchanged
   and the switch statements exist once.
   Behaviour to preserve exactly:
     - RunOutcomeChip takes `RunOutcome | null` and renders an em dash for null (RunOutcomeChip:10-15).
       The other two do not accept null. Keep that asymmetry; it is used — SchedulerJobsView.vue:112
       passes `item.lastOutcome ?? null` for jobs that have never run.
     - The colour names come from this app's custom Vuetify theme (success / warning / textMuted /
       primaryOutline / secondaryOutline). Do not rename or "normalize" any of them.
   If, after reading all three, you judge that three 40-line files with zero shared bugs are clearer
   than an abstraction plus three wrappers, SAY SO and skip this item. That is a legitimate outcome;
   an unconvincing consolidation is worse than the duplication. But make the call explicitly.

4. TWO SMALL PLACEMENT FIXES.
   a) composable/useSchedulerFormat.ts holds no reactive state — it is three pure functions behind a
      useI18n() call. The module's own map (src/_common/docs/modules/scheduler.md, "Composables"
      section) already notes it belongs in utils/. Move it, keeping the i18n dependency honest:
      replayError needs translation, so either it takes the t function or it stays a composable while
      the two pure formatters move. Pick one and be consistent.
      While you are there, consider whether formatDateTime (a date + time-with-sec concatenation) and
      formatRunDuration (sub-second → "820ms", else fromSecondsDetailed) belong in
      _common/utils/DateTimeHelper.ts and formatDuration.ts rather than in a scheduler-specific file
      — the sub-second case in particular is generally useful. Moving them is optional; if you do,
      grep for other call sites that could use them and mention them in your report rather than
      changing them here.
   b) dto/index.ts is a 16-line barrel that re-exports everything and that NOTHING imports — all 33
      files use long absolute paths instead. Either adopt it across the module or delete it. Deleting
      is the smaller change and matches how the rest of the module is written; adopting it is a
      bigger diff but shortens every import. Pick one, apply it completely, and do not leave a barrel
      that half the module uses.

DO NOT, in this prompt:
  - change the grids' script blocks (that is S3),
  - add or change any user-visible behaviour, copy, colour or icon,
  - add a11y attributes or responsive breakpoints (that is S7 — it will edit the shell you build,
    which is exactly why the shell should exist first),
  - touch anything under src/_common outside modules/scheduler/, EXCEPT InfoRow.vue for item 1 and
    utils/ for item 4a.

--- Verification ---

npm run type-check — must stay at 72 errors, all in src/core. Zero under src/_common.
Then, as an admin:
  - Open a job detail and a run detail side by side with the pre-change version (git stash, or a
    screenshot first). Every value, chip, label and spacing must be identical — EXCEPT the five
    values from item 1, which should now match their siblings' size and colour instead of being
    subtly smaller.
  - Force each state on both pages: loading (throttle the network), not found (bad id in the URL),
    load failure (stop the backend), forbidden (if the app's auth adapter lets you). Each state must
    render on both pages and look the same on both.
  - Check every chip in all four views once more — status, outcome (including a job that has never
    run, which must show an em dash), trigger source.
  - Grep the module for `info-row__value` and confirm the remaining usages are all deliberate.

--- No backend ask is expected from this prompt ---

This is a pure refactor. If you hit a wall that needs the server, read
prompts/_common/scheduler/backend/README.md and follow it — but do not go looking for one.
```
