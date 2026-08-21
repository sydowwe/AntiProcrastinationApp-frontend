# Backend asks — written by the agent that hits the wall

This directory is a **destination**, not a queue. It starts empty on purpose.

The frontend prompts in `prompts/_common/notifications/` do not pre-write backend requests. The agent implementing a frontend prompt is the one that discovers
exactly which field was missing, which nullability was wrong, or which computation cannot honestly be done client-side — and it writes a sharper ask than anyone
could from a cold read. Several prompts tell you to come here. This file says what to write.

## The rule

If, while implementing a frontend prompt, you conclude that the correct fix requires a backend change:

1. **Do not stop, and do not implement a fake version of it.** Finish everything in the prompt that does not depend on the backend.
2. **Do the honest frontend-only fallback** the prompt describes, and leave a `// TODO(Bn):` comment at the site pointing at the file you are about to write.
3. **Write the ask** to `prompts/_common/notifications/backend/Bn-short-slug.md`, numbering from the highest `Bn` already in this directory.
4. **Report it** in your final message: what you could not do, and the filename you wrote.

## What the ask must and must not contain

**Contract and business rules only.** Do not prescribe storage, entities, EF configuration, migrations, indexes, or where a computation happens — those are the
backend agent's decisions. Requesting a specific table or a specific query is out of scope and will be ignored.

Use this structure — the existing asks in `../../../_done/activity-history/backend/` and
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

## One extra rule specific to this module

The notifications module lives in `src/_common` — it is the **framework** submodule, shared with at least one other app whose backend is a different service (that is
why `common.sk.ts` still carries
`EmployeeModule` / `AttendanceModule` / `InventoryModule` labels). So an ask that changes a shared endpoint's shape must say whether the change is **additive**
(safe: a new optional field the other app ignores) or **breaking** (needs coordination). If you cannot tell, say so — do not assume.

## Known candidates

Listed so you recognise the situation, **not** so you write them speculatively — only write the ask if you actually reached it while doing the work.

- **Paging + a server-side unread count + a bulk mark-read** (from N3). `GET /notification/mine`
  returns everything ever, the badge count is derived from the loaded array, and "mark all read"
  is N parallel PATCHes. All three are the same ask and should be one file.
- **A deep-link payload on the notification** (from N5/N6). The server already sends a `url` on the *push* payload (`public/sw-push.js:10` reads `data.url`) but the
  in-app `NotificationResponse`
  carries no equivalent. Ask what identifies the subject of a notification and whether the server or the client should own the mapping to a route — that is the
  interesting question, not the field name.
- **The timezone of `startMinute`/`endMinute`** (from N10). Quiet hours are minutes-from-midnight with no stated timezone. Whose midnight, and what happens on a DST
  transition, is unanswerable from the client. Ask for the rule, not a field.
- **Push re-registration semantics** (from N8). The client needs to be able to replace a rotated subscription. Whether that is the existing `POST /push-subscription`
  being idempotent, or a distinct call carrying the old endpoint, is a server decision — describe the browser event and let them pick.
- **Per-notification-type preferences** (from N12). `reminder-preference` covers *reminder kinds*
  keyed by `(ownerModule, kind)`. Notification `type` is a different axis. Ask whether they are meant to be the same registry before proposing a second one.
