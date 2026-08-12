# Backend asks — written by the agent that hits the wall

This directory is a **destination**, not a queue. It starts empty on purpose.

The frontend prompts in `prompts/home/` do not pre-write backend requests. The agent implementing a
frontend prompt is the one that discovers exactly which field was missing, which nullability was
wrong, or which computation cannot honestly be done client-side — and it writes a sharper ask than
anyone could from a cold read. Several prompts tell you to come here. This file says what to write.

## The rule

If, while implementing a frontend prompt, you conclude that the correct fix requires a backend
change:

1. **Do not stop, and do not implement a fake version of it.** Finish everything in the prompt that
   does not depend on the backend.
2. **Do the honest frontend-only fallback** the prompt describes, and leave a `// TODO(Bn):` comment
   at the site pointing at the file you are about to write.
3. **Write the ask** to `prompts/home/backend/Bn-short-slug.md`, numbering from the highest `Bn`
   already in this directory.
4. **Report it** in your final message: what you could not do, and the filename you wrote.

## What the ask must and must not contain

**Contract and business rules only.** Do not prescribe storage, entities, EF configuration,
migrations, indexes, or where a computation happens — those are the backend agent's decisions.
Requesting a specific table or a specific query is out of scope and will be ignored.

Use this structure — the existing asks in `prompts/activity-history/backend/` and
`prompts/todo-motivation/backend/` are worked examples, read one before writing yours:

```markdown
# Bn · Backend ask — <one line>

**Contract only.** <one sentence disclaiming implementation decisions.>

## The problem
<What is wrong TODAY, with file:line citations from src/. Describe the user-visible consequence,
not the code smell. If it is a live bug, say so and say what the user currently sees.>

## The business rules
<Every rule the frontend currently assumes, stated so the backend can confirm or CORRECT it.
Frame each as a question where the current client behaviour looks like a guess rather than a
decision. The frontend will follow the server's answer, not the other way round.>

## The shape the frontend needs
<Fields, their types, their nullability, and WHY each is needed — name the component that renders
it. Say which endpoint it should hang off, and whether it is hot enough to matter.>

## What changes on the frontend once this lands
<Which files get deleted or simplified. This is how the backend agent judges whether the ask is
worth the work.>
```

## Known candidates

These are the three places the frontend is most likely to hit the wall. They are listed so you
recognise the situation, **not** so you write them speculatively — only write the ask if you actually
reached it while doing the work.

- **A server-side plan-completion streak** (from H2). `src/core/home/store/plannerStreakStore.ts` is
  localStorage-only; its own header comment already says it should be replaced. It is per-device,
  per-browser-profile, not namespaced by user, and its `revokeCompletedDay` is not a correct inverse
  of `registerCompletedDay`. The number cannot be made correct client-side. The interesting part of
  the ask is not the endpoint shape — it is the rules: does a `Cancelled` task break the day, does a
  day with no plan break the streak, are there grace days like the routine side's `streakGraceDays`.
- **A `/home/today` aggregate** (from H7). The page fires four to six independent requests on mount
  and H7 makes them repeat on every tab-focus. Only worth asking for if H7's measurements show it
  matters — include the request count and timings you actually observed, not an estimate.
- **The `todo-list-item/dashboard-widget` contract** (from H5/H8). Undocumented endpoint called with
  a raw URL string, no composable, no stated ordering or limit, and `RoutineTodoListItemEntity.suggestedDay`
  appears to be overloaded — `<= 7` is read as day-of-week and `> 7` as day-of-month
  (`RoutineTodoWidget.vue:148`), which makes a monthly item due on the 3rd indistinguishable from a
  weekly one due on Wednesday. Confirm the intended semantics before writing this one; it may be a
  frontend misreading rather than a contract flaw.
