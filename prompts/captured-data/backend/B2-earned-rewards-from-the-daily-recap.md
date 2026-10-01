# B2 · Backend ask — the daily recap names each item and its paired reward, bounded on the user's day

**Contract only.** It asks for three fields on an existing response, one derived flag, and an answer to a day-boundary question. How any of it is queried, and
whether anything is stored, is the backend's decision.

> Written 2026-09-28 from `prompts/captured-data/C2-rewards-waiting.md`, after its frontend half shipped. That half keeps an earned reward waiting on the home
> dashboard until the end of the user's day. Today it only knows about completions **this tab watched happen**, and it holds them in memory
> (`src/core/todoList/store/earnedRewardsStore.ts`, `TODO(B2)`). This ask is what makes "earned today" true across devices and across reloads.

---

## The problem

N5 pairs a normal to-do item with a leisure backlog activity (`pairedLeisureActivityId`). Finishing the item earns that reward. The client now keeps the
earned reward on the home dashboard until the day ends, but it can only see completions it performed itself:

- **A reload forgets every waiting reward.** The client does not write the completion instants it observed to storage. That would be a device-local copy of
  a field the server already has, which this prompt set rules out.
- **Completions made anywhere else never appear.** That covers the phone, another tab, a planner task marked done (`PlannerTaskIsDoneChangedEventHandler`
  → `SetDone`), and tracked time crossing the suggested length (`ActivityTimeRecordedEventHandler.AutomateWithoutPlannerTaskAsync`). The home widget cannot
  even infer these: `GET todo-list-item/dashboard-widget` serves open items only (`GetDashboardTodoListItemEndpoint.cs:46`), so a completed item simply
  disappears from it.

The server already knows the answer. `TodoListItem.CompletedTimestamp` is stamped on every `IsDone` transition and cleared on reopen, from every writer
(`TodoListItemCompletionInterceptor.cs:53-85`). It is not on the wire:

- The item responses omit it on purpose, and a test pins that (`GetAllTodoListItemTests.cs:238-266`, "the daily recap owns the first").
- The daily recap, which owns it, projects only `{ name, timeLoggedSeconds }` per item (`GetDailyRecapTodoListItemEndpoint.cs:61`, `:76-82`). There's no id and
  no pairing, so the client cannot connect a recap row to a reward (`src/core/todoList/dto/response/DailyRecap.ts`).

Per-list item reads would not solve it even with the timestamp added. Rewards are per user, not per list, and the client will not fan out across every
list to find today's completions.

## The business rules

1. **Earned** means a normal to-do item (not a routine item, since N5 is normal-list only) that has a `pairedLeisureActivityId` **and** was completed on the
   requested day. That is exactly the recap's population plus a non-null pairing. The client filters on the pairing, so return every completed item as you do
   now, paired or not.
2. **Reopening un-earns.** An item unticked after completion leaves the recap, because its `CompletedTimestamp` is cleared. The client already treats an
   untick that way. Nothing to add, just confirming it's intended.
3. **The day is the user's day.** *Question:* the recap bounds the day as a half-open **UTC** range (`GetDailyRecapTodoListItemEndpoint.cs:48-51`), but the
   client sends `date` as the user's calendar date in `User.Timezone` (`useDailyRecap.ts`, `isoDateInUserZone()`). The dashboard widget, in the same slice,
   already resolves the day through `IUserTimeZoneResolver` (`GetDashboardTodoListItemEndpoint.cs:35-36`). For a user in Bratislava (UTC+2 in summer), an
   item finished at 00:30 local lands in the previous UTC day. It is missing from today's recap and its reward never waits. I'm asking for the recap to bound
   `date` in the user's zone. If you keep UTC, say so and the client will label the recap accordingly. This is also a live bug in today's "finished today"
   line, independent of rewards.
4. **"Taken" is derived from history, not recorded.** *Question:* a reward counts as taken once an activity-history record for `pairedLeisureActivityId`
   **starts at or after** the item's `CompletedTimestamp`, on the same user day. The recap already reads History through
   `ITodoListItemLoggedTimeSource`, so this needs no new data. I am **not** asking for a claim record. Known imprecision, accepted:
   - a reward started but not yet finished has no history row yet, so it still reads as not taken. The client hides it locally the moment Start is
     pressed, which covers the same tab;
   - two items paired to the same activity are both satisfied by one history record. Tell me if you'd rather match one record to one item.
5. **"Not today" is not asked for.** Letting a reward go stays device-local UI state (user-scoped `localStorage`, like the dismissed onboarding hints). It
   expires with the day anyway, and a dismissal that reappears on another device is harmless. There is **no** tally of taken or declined rewards anywhere, by
   design (`prompts/_done/todo-motivation/README.md`, "Deliberately excluded").

## The shape the frontend needs

Unchanged route and request: `GET /api/todo-list-item/daily-recap?date=YYYY-MM-DD`.

Each `items[]` entry gains four fields, camelCase. Existing fields are unchanged.

```json
{
  "items": [
    {
      "name": "Meal Preparation",
      "timeLoggedSeconds": 0,
      "itemId": 14104,
      "pairedLeisureActivityId": 12007,
      "completedTimestamp": "2026-09-28T08:31:12Z",
      "rewardTaken": false
    }
  ],
  "totalTimeLoggedSeconds": 0
}
```

| Field | Type | Null? | Why |
|---|---|---|---|
| `itemId` | long | never | The client keys a waiting reward by item. "Not today" and "Start" hide one item's reward, and two items can share one leisure activity. |
| `pairedLeisureActivityId` | long | **yes**, meaning no reward is paired | Which backlog profile to offer. A backlog profile's id is its activity id, so the client resolves name and duration itself. |
| `completedTimestamp` | ISO-8601 UTC instant | never (a recap row is completed by definition) | The end-of-day expiry and the display order. The client reads it in the user's zone. |
| `rewardTaken` | bool | never | Rule 4. `false` when `pairedLeisureActivityId` is null. |

No new errors. The validation 400s are the endpoint's existing ones.

## What changes on the frontend once this lands

- `DailyRecap.ts` reads the four fields.
- `earnedRewardsStore.ts` stops being the source of "earned". Its waiting list becomes: recap items with a pairing, `rewardTaken === false`, and not dismissed
  on this device. It is loaded through `useDailyRecap`, which already fetches the recap once per user day for the list view.
- The dismissed and started item ids move to `useUserScopedStorage`, so a reload keeps them.
- `useEarnedRewardTracking.ts` shrinks to an optimistic insert, so a tick shows its reward before the recap re-reads, or it goes away entirely.
- The home widget's `settleThenRefresh` re-read (`TodoListWidget.vue`) exists only so the watcher sees counter and step completions. It can revert to a
  plain `refreshNow`.
- The expiry rule and its unit test (`composable/earnedRewards.ts` / `.test.ts`) stay exactly as they are.

## How the client will verify

Against the e2e seed, nothing mocked, with rows created through the app's own API in a throwaway list:

1. Create an item paired with the seed's backlog activity (`pairedLeisureActivityId` = `temptationBundled`'s pairing) and tick it off. The recap for today
   returns it with `itemId`, the pairing, a `completedTimestamp` within seconds of now, and `rewardTaken: false`. Reload home: the reward is still waiting.
2. Tick the same kind of item off **through a planner task** marked completed. It appears in the recap and waits on home, a path the client cannot see today.
3. Log time on the paired leisure activity, starting after the completion. `rewardTaken` becomes `true` and the reward leaves the strip.
4. Untick the item. It leaves the recap, and the reward goes.
5. Rule 3: with a user timezone east of UTC, complete an item within the first hour after local midnight. It is in **today's** recap, not yesterday's.
6. Sign in as `secondaryUser`: their recap contains none of the primary user's rows.

---

## Backend reply (2026-09-28) and the client side that followed

**Delivered as asked.** All four fields are present. `pairedLeisureActivityId` is an explicit `null` and is never omitted. `completedTimestamp` always ends in
`Z` and may carry fractional seconds. Items come oldest first.

- **Rule 3:** the day is now bounded in `User.Timezone` (DST handled), for all three parts: which items, `timeLoggedSeconds` and `rewardTaken`. The client
  keeps sending `isoDateInUserZone()`.
- **Rule 4:** as proposed. One history record satisfies every item paired to that activity that was completed before the record started; there is no
  one-to-one matching. A record of the item's *own* activity never counts.
- **Rules 2 and 5:** confirmed, with no backend change for "Not today".
- **Nothing is pushed.** The client re-reads after its own ticks and unticks, and on the dashboard's triggers.

**Client, after the reply:**

- `DailyRecap.ts` reads the fields.
- `earnedRewardsStore` derives "waiting" from the recap. It lays this tab's unconfirmed ticks and unticks over it, dropped by the first recap read that
  lands after them, and a per-account, per-day set of items started or let go (`useUserScopedStorage`, key `resolvedLeisureRewards`).
- The rule is the pure `waitingRewards()` in `composable/earnedRewards.ts`, which is unit-tested.
- `useDailyRecap` gained `refresh()` and `reset()`. The reset also stops the list view's recap card from showing the previous account's recap after an
  in-tab account switch.
- The home widget's per-item re-read is gone. The recap now rides `useDashboardRefresh` (mount, tab return, day rollover, finished tracking session).

**Verified live, 2026-09-28, after the API restart.** All six steps passed against the running API, with rows created and deleted through the app's own
API.

- **Step 2:** passed once the planner task was actually linked (see the first finding below).
- **Step 3:** one history record flipped `rewardTaken` on both paired items. The strip emptied on the dashboard's tracking signal, without a reload.
- **Step 5:** run in a browser zoned `Pacific/Tongatapu` at 00:37 local on the 29th. The server placed the 11:30–11:35 UTC completions on the 29th, and the
  client asked for and showed the 29th.

Found on the way, both outside B2:

- **The to-do ↔ planner link is broken on the wire, both ways, and has been since the Planning slice was extracted (2026-08-11).**
  - Request: the client sends `todoListItemId` (`dayPlanner/dto/request/PlannerTaskRequest.ts:25`), but the server binds `TodolistId`
    (`PlannerTaskRequest.cs:31`), so the link is dropped on create.
  - Response: the server returns `todolistItemId`, but the client reads `json.todoListItemId` (`dayPlanner/dto/response/PlannerTask.ts:87`), so it's always
    `null`.
  - Consequences: "add to planner" from a to-do item never links the two, and completing that planner task never ticks the item.
  - Verified: a create with `todolistId` stores the link, and completing the task then ticks the item.
  - Fixing only one side would make every planner PUT write whatever the client read back, so both names have to change together.
  - **Fixed on the frontend, 2026-09-28.** Both wire names now match, pinned by `dayPlanner/dto/plannerTaskTodoLink.test.ts`. The fix exposed a second
    bug: `PlannerActivitySourcePicker` pre-selected by *activity*, so "add to planner" linked the first item with that activity in **any** list. It now
    selects the exact item the dialog was opened from. Verified live: "add to planner" on an item sends `todolistId` for that item, a DTO → PUT round trip
    keeps the link, ticking the task in the home planner widget ticks the item, and unticking or re-ticking the item reopens or completes today's task.
- **The first load after a timezone change reads the recap in the old zone.** `timeZoneSync` pushes the browser's zone with `PUT /user/preferences` during
  hydration, and the dashboard's first recap read can go out before that PUT lands. The client asks for the new zone's date, and the server bounds it in
  the old zone. The next read is correct. The same ordering probably affects every date-scoped dashboard read, so it's a framework boot-order question, not
  one for B2.

**Known gap (closed 2026-09-29):** a planner task ticked done **from the home planner widget** completes its to-do item on the server, but home does not
re-read the recap until the next dashboard trigger. Closing it needs a call in `home/composable/useTodayPlan.ts` `setStatus`, a file that held another
unit's uncommitted work at the time.

## Follow-up (2026-09-29) — frontend only

No backend change: both toggles publish their cross-slice event with `PublishAsync(Mode.WaitForAll)` (`PatchPlannerTaskStatusEndpoint.cs:92-93`,
`ToggleIsDoneTodoListItemEndpoint.cs:22`), so the other side is already written when the PATCH returns. The client only had to read after it.

- **The home tick raced its own write.** `TodoListWidget` flips `isDone` before its PATCH, and `useEarnedRewardTracking` re-read the recap on the flip. A read
  that beat the write retired the tick's observation with the old answer: the reward flashed up and went. The tracker now takes `{ resync: false }`, and
  the widget re-reads once `toggleIsDone` resolves. `TodoListView` keeps the default, because its items only change after the server answers.
- **The gap above.** `useDashboardRefresh` gained a third signal, `notifyTodoItemsChanged({ except })`, with an `onTodoItemsChanged` opt-in. `setStatus`
  fires it when `togglesLinkedTodoItem()` (`home/composable/linkedTodoItemSync.ts`, unit-tested) says the task moved into or out of `Completed` with a
  linked item. The to-do widget fires it after a saved tick. The waiting rewards, the to-do list and today's plan listen, and each writer excludes itself.
  The reverse direction was the same bug: a to-do tick on home completes today's linked planner task, and the planner widget waited for its 5-minute poll.
- **A data-changed trigger was dropped mid-flight.** `runRefresh` swallowed any trigger that arrived while that entry was already refreshing, so a read
  issued before a write could be the last one. Data-changed triggers now queue one follow-up read (commit `2e08c64c`).
- **Signing in dropped the waiting rewards.** Found in the live re-check. `earnedRewardsStore`'s account watcher treated the `0 → id` hydration after
  sign-in as an account switch and called `resetRecap()`, which discarded the recap read the freshly mounted home had just issued: the server returned the
  reward, and the strip stayed empty until the next dashboard trigger. This is `useTodayPlan`'s F8 again. Now `0 → id` only re-reads the per-account
  resolved set, and the reset runs on the way *to* 0. Verified: primary → sign out → secondary (no rewards) → primary (reward back).
- **The strip moved to a `#top` slot on `WidgetCard`**, above the body's loading/error/empty switch. A failed to-do fetch no longer hides rewards that come
  from the recap, and the strip no longer inherits the empty state's centred, muted styling.
