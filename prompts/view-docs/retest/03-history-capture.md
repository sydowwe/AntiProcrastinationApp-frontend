# Retest 03 — `history-capture` (5 findings)

Run the **retest round** for this one unit. First read `prompts/view-docs/RETEST-PROMPT.md` in full and follow its
§2–§4 and *Final report*. This file replaces its §1: the table below is your scope.

- **Unit:** `history-capture` → `docs/views/history-capture/findings.md`
- **Commit:** run `git rev-parse --short HEAD` and use that
- **Reseed at start:** no
- **Known failing specs:** whatever the operator's message names, otherwise none
- **Account:** `primaryUser`
- **Routes:** `/activity-history/stopwatch`, `/activity-history/timer`, `/activity-history/pomodoro`, `/activity-history/manual`

## Findings to retest

All five were marked "verified in code" on 2026-09-24. None has been seen working in a browser.

Each finding's `Verify:` block in `findings.md` is the check. The last two columns summarise it so you can plan
the order. If a summary and the `Verify:` block disagree, the block wins.

| id | sev | finding | pass condition, in short | mutates |
|---|---|---|---|---|
| B1 | bug | `dateTime.secondsShort` renders as a raw key on every running clock | the seconds label reads "s" on stopwatch, timer **and** pomodoro, with no `[intlify] Not found` message | no |
| B2 | bug | Typed durations silently round to 5 minutes | typing `0007` into the timer's Length keeps `00:07`, or a visible rounding hint appears | no |
| B3 | bug | A preset chip's Close button is always there and does nothing useful | not rendered or focusable outside edit mode, **or** it really deletes the preset after a confirm | **only if it deletes**: recreate the preset |
| B6 | bug | Manual entry fires twice on a fast double-click and never resets | one `POST /api/activity-history` per double-click, and the form clears after a successful save | **yes**: delete the history row(s) you created |
| P1 | polish | Leftover `console.log` on every timer/pomodoro preset load | no `[LOG]` line from `TimerPresetsSection.vue` | no |

## Unit notes

- **Intlify and Vue warnings arrive at `info` level** in this app. Check B1 and P1 with
  `playwright-cli console info` as well as `console warning`.
- **Never leave a clock running.** Stop anything you start. A running stopwatch, timer or pomodoro can outlive the
  page and leave a history row behind.
- **B6:** use a clearly named activity and time so you can find the row again. Delete it on the history screen
  and confirm it is gone. A second row caused by the double-click is exactly the defect, so delete that too if
  it appears.
