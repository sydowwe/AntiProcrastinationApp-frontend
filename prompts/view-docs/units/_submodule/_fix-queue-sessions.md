# Fix queue sessions — `_submodule` units (16–19)

> Written 2026-10-03 against [`_fix-queue.md`](_fix-queue.md) (S1–S31). This file groups those batches into working
> sessions. It does not replace the queue: every batch body, verification and risk still lives there.

All 31 batches change the framework. Within a session, keep **one framework commit per S-batch**, so each one can be
closed on its own (closing is a move to [`_fix-queue-log.md`](_fix-queue-log.md)). One `_common` pointer bump per
session is enough.

## Sessions

| # | Session | Batches | Why together |
| --- | --- | --- | --- |
| 1 | **My reminders: broken actions** | S28 → S30 → S29 | S28 is the worst finding in the queue: Snooze and Dismiss have never worked. All three touch `MyRemindersView` and the `remindersDashboard` locales. S30's dialog changes depend on S28's flow. S29 adds the failure state to the same table. |
| 2 | **Flex and height layout** | S1, S2, S18 | Same root cause (the `BasicTable` height contract, or `flex-shrink` inside a height-bounded container). They share a verification: 1440×900, then check `scrollHeight > clientHeight`. |
| 3 | **Sort tie-breakers** | S3, S23 | The queue already says S23 "can ride with S3". It is the same one-line `defaultSortBy` fix in four views. S3's column rework can go in the same pass. |
| 4 | **Scheduler detail polish** | S4, S6, S7, S8, S9 | Mostly the same two views (`SchedulerRunDetailView`, `JobRunHistory`), and all trivial or low effort. S7's reminders half is just `_silent: true` on two more requests. |
| 5 | **Breadcrumbs** | S5, then S17 | S17 says to re-check it once S5's shell-or-per-view choice is made. Decide that once, then do both. If S5 takes the shell-level de-dup, that is its own commit plus a `composables.md` line. |
| 6 | **Reminders admin data and identity** | S19, S20, S21, S22, S24, then S25 | S19 and S20 put wrong data on screen (the wrong due time, and an upper date bound that excludes its own day). S25's `itemLabel` should use S22's `reminderLabel`, so S22 goes first. S20 also touches `MyReminderFilter`, so run session 1 before this one. |
| 7 | **Notifications module** | S10, then S12, S14, S16 | All inside `modules/notifications/`. S10 is medium effort and functional (the inbox is dead when the hub fails), so it goes first. S12 and S16 both edit the same locale blocks. |
| 8 | **Framework component a11y** | S26, S27, S31 (+ S25 if session 6 did not take it) | Each changes a shared component in every app (rule 4), so they stay separate commits. They are small and similar enough for one sitting. Grep `e2e/` for `'Close'` before S26. |
| 9 | **Wide-impact defaults, one per session** | S13, S15, S11 | Do not pair these with anything. S13 changes focus return for every dialog in every app. S11 changes the dates every EN account sees and needs a full e2e run after the pointer bump. S15 is small but changes a snackbar default. |

## Ordering

1. **Session 1 first.** S28 fixes a feature that has never worked. Keep its two halves together, as the queue warns:
   fixing X1 alone would arm B2, the snooze that delivers early.
2. **Then S10 and S19/S20.** Those are the other "wrong or missing data" bugs. The rest is polish or a11y.
3. **S13 before S30's verification**, or re-check S30's focus return after S13 lands, because S30's `Verify:` expects
   focus to go back to the row's *Dismiss*.
4. **S11 last.** It churns visible dates across the app, so let the other e2e changes settle first.

## Not in any session

The escalations (§S1–§S7) are backend asks. Several batches have a client half that waits on them, but none of the
sessions above is blocked by them.

## Progress

| # | Session | Status |
| --- | --- | --- |
| 1 | My reminders: broken actions | ✅ done 2026-10-04 — S28 `4e385e5`, S30 `0d04853`, S29 `639814a`, one pointer bump |
| 2 | Flex and height layout | ✅ done 2026-10-04 — S1 `ff91bec`, S2 `d21119c`, S18 `7c048c2`; shared pointer bump with session 6 in `11fe182b` |
| 3 | Sort tie-breakers | open |
| 4 | Scheduler detail polish | ✅ done 2026-10-04 — S4, S6, S7, S8, S9 in one framework commit `62451f7` (they share `JobRunHistory`, `SchedulerRunDetailView` and both locale files, so the one-commit-per-batch split was not practical), one pointer bump |
| 5 | Breadcrumbs | ✅ done 2026-10-04 — S5 `6154af1` (shell de-dup) + `524312a` (run detail), S17 `7033ca2`, one pointer bump |
| 6 | Reminders admin data and identity | ✅ done 2026-10-04 — S19 `f103416`, S20 `4920a5b`, S21 `60c85f0`, S22 `dcd6b11`, S24 `113fcaf`, S25 `e46b50f` (so session 8 no longer carries S25). Ran before session 1, which is still open. |
| 7 | Notifications module | ✅ done 2026-10-03 — S10 `b038d3e`, S12 `40255f1`, S14 `5b2e76b`, S16 `8c5dd57`, one pointer bump |
| 8 | Framework component a11y | open |
| 9 | Wide-impact defaults | open |
