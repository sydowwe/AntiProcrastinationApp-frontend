# Retest 01 — `todo-lists` (4 findings)

Run the **retest round** for this one unit. First read `prompts/view-docs/RETEST-PROMPT.md` in full and follow its
§2–§4 and *Final report*. This file replaces its §1: the table below is your scope.

- **Unit:** `todo-lists` → `docs/views/todo-lists/findings.md`
- **Commit:** run `git rev-parse --short HEAD` and use that
- **Reseed at start:** no
- **Known failing specs:** whatever the operator's message names, otherwise none
- **Account:** `primaryUser`
- **Routes:** `/todo-list`, `/todo-list/:id` (list ids from `seed.todoLists`, never a literal)

## Findings to retest

Each finding's `Verify:` block in `findings.md` is the check. The last two columns summarise it so you can plan
the order. If a summary and the `Verify:` block disagree, the block wins.

| id | sev | finding | pass condition, in short | mutates |
|---|---|---|---|---|
| X1 | blocker | Creating a to-do list category always fails (colour sent as a name, API wanted hex) | create with the default colour **and** one non-default swatch → 2xx, the category appears under its typed name | **yes**: delete both categories afterwards |
| B7 | bug | Deleting an item never asks for confirmation | with *Ask before deleting single items* on, a dialog appears; **Cancel** leaves the item and sends no `DELETE` | no, if you cancel |
| B8 | bug | "Move to list" always 404s | 2xx, gone from the source list, present in the destination after a reload with the same id | **yes**: move it back |
| A3 | a11y | Item done-checkbox has no accessible name | the name includes the item's activity name, so each row's checkbox is distinguishable | no |

## Unit notes

- **B7 depends on a preference.** Check *Ask before deleting single items* on `/user/settings` first. If you
  have to turn it on, turn it back off at the end.
- **B8: pick a plain single-count item.** `todoListItems.multiCountPartial` and the overdue items are pinned
  by specs. Moving one of them and failing to move it back breaks later e2e runs.
- The item fetch resolves after first paint. Wait for an item's text before you assert anything on a row.

## Also: `F90` — toggle groups announce their selection

There is no finding for this. Record the result as described in `RETEST-PROMPT.md` §4, *Batch checks*.
**This is one of only two F90 checks in the retest set** (the other is the Slovak names, in `12`). `1ffdd747`
changed each call site mechanically: the tag, plus a `label`. The behaviour is all in the framework's
`MyBtnToggle`, which was already driven live on five screens. The one call site where the framework component
itself changed is below.

| group | where |
|---|---|
| the weekday picker (framework `DayOfWeekPicker`, now with a required `label`, `multiple`) | `/routine-todo-list` → add a routine item with a weekly period, then cancel |

**Pass:** `playwright-cli find` shows a `group` named after the field's visible caption, around seven day buttons.
Every selected day is `[pressed]` and no other day is. Toggling a day adds or removes its `[pressed]`. There is no
console error and nothing new at `console info`. Cancel the dialog. Nothing is saved.
