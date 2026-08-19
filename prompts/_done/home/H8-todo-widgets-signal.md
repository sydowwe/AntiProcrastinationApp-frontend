# H8 · Make the todo widgets say something

- **Scope:** `../../../src/core/home/component/TodoListWidget.vue`, `RoutineTodoWidget.vue`, `_locales/home.{sk,en}.ts`
- **Backend:** possibly — `suggestedDay` looks overloaded; see the escalation block at the end
- **Model / effort:** Sonnet 5, medium
- **Depends on:** H1 (route bug, stale `today`), H4 (shell)
- **Unblocks:** nothing

---

```
--- 1. TodoListWidget sorts by due date and never shows one ---

src/core/home/component/TodoListWidget.vue:75-88 computes `daysDiff(dueDate)` and sorts by it. The
rendered rows are plain `NormalTodoListItem`s — the due date is invisible. So the list is in an
order the user cannot explain, and an item overdue by three weeks looks identical to one due next
month.

The locale files already have the strings for this and nothing uses them:
  home.overdue, home.dueToday, home.dueTomorrow, home.dueIn ({days})
(verified: zero references across src/, including dynamic $t keys). They were clearly written for
this widget and never wired up.

Add a due-date indicator per row: overdue in error colour, due today emphasised, tomorrow, then
"due in N days". `home.dueIn` is `Due in {days} days` — in Slovak that needs plural forms, so use
vue-i18n pluralization for the SK string rather than a single template (Slovak has three forms:
1 deň / 2-4 dni / 5+ dní). Fix the EN side to pluralize too so the two files stay parallel.

Where to put it: NormalTodoListItem is another module's component and home is allowed to consume it
(accepted exception — do not restructure it). If it has a slot or prop that fits, use it. If it does
not, render the indicator alongside the item in the widget's own row wrapper rather than adding a
prop to the shared component for home's benefit.

--- 2. Both widgets hide their most important state ---

`hideDone` defaults to `true` in both widgets (TodoListWidget.vue:70, RoutineTodoWidget.vue:137) and
resets on every navigation. Two consequences:

- The default hides completed work, which is exactly the feedback an anti-procrastination dashboard
  should be showing. Progress is only visible as the numerator in RoutineTodoWidget's per-group
  "3/7" (line 84-86); TodoListWidget shows no count at all.
- The toggle's state is not persisted anywhere. CLAUDE.md asks for filterable state in URL query
  params; for a dashboard toggle that fires on every visit, a persisted user preference is the
  better fit than a query param nobody will share. Use the sessionStorage-backed Pinia default via a
  small home ui store, or extend the existing plannerStreakStore's neighbourhood with one — pick one
  and be consistent across both widgets.

Add a done/total count to TodoListWidget's header so progress is legible even with `hideDone` on.
RoutineTodoWidget already has per-group bars; give it a single overall figure in the header too.

--- 3. RoutineTodoWidget's filtering is silently lossy ---

`isSuggestedForToday` (line 145-149) drops any item whose `timePeriod.lengthInDays !== 1` and whose
`suggestedDay` is null. Combined with `hideDone` and the `isHidden` period filter (line 156-161),
a group can vanish entirely with no indication that anything was filtered. The user cannot tell
"nothing is due" from "three weekly items exist but none is suggested for today".

Also note line 148: `item.suggestedDay <= 7 ? matches day-of-week : matches day-of-month` — a
monthly item suggested for the 3rd of the month is indistinguishable from a weekly one suggested for
Wednesday, and is therefore matched against the wrong field. Confirm the intended semantics against
src/core/todoList/ before changing anything. Do NOT guess at it in the client: if the field really is
overloaded, a "fix" that picks one reading silently hides half the user's routine items. The
escalation block at the end covers this.

At minimum: when items were filtered out, show a quiet "+N not due today" affordance rather than an
empty group.

--- Constraints ---

- New strings in both _locales files, SK primary.
- Do not change what the widgets fetch, and do not add sorting/filtering controls — this is about
  making the existing behaviour visible, not adding configuration.

--- Verification ---

npm run type-check (≤ 72 errors), npm run lint (0 errors). Then check with real data: an overdue
item reads as overdue in both languages, the SK plural is correct for 1 / 3 / 8 days, the hide-done
toggle survives navigating away and back, and a routine group with items that are not due today says
so instead of disappearing.

--- After the frontend work is done: write the backend ask, IF item 3 turned out to be real ---

Item 3 sends you to read `suggestedDay`'s real semantics in src/core/todoList/. Three outcomes:

- **It is well-defined and the widget reads it correctly.** Nothing to write. Add a comment at
  RoutineTodoWidget.vue:148 recording the semantics you confirmed, so the next reader does not have
  to repeat the investigation.
- **It is well-defined and the widget reads it WRONG.** That is a frontend bug — fix it here, in this
  prompt, and say so. No backend ask.
- **It is genuinely overloaded** — one nullable int carrying either a day-of-week or a day-of-month
  depending on its own magnitude, with no discriminator. Then the client cannot distinguish the two
  cases and neither can anyone reading the DTO. Write the ask AFTER the frontend work above is
  finished and verified. Read prompts/home/backend/README.md for the format and scope rules, and
  write it to prompts/home/backend/Bn-<slug>.md.

For that third case the ask is small and specific: state that a monthly item due on the 3rd is
currently indistinguishable from a weekly item due on Wednesday, name the consumer
(RoutineTodoWidget's `isSuggestedForToday`, which decides whether an item is shown at all, so the
failure mode is a silently missing task), and ask for either an explicit discriminator alongside the
value or a computed "is due on date D" the server owns. Do not prescribe which — offer both and let
the backend pick.

Say in your final message which of the three outcomes you found.
```
