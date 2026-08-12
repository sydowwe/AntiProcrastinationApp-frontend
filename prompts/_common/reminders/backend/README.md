# Backend asks — written by the agent that hits the wall

This directory is a **destination**, not a queue. It starts empty on purpose.

The prompts in `prompts/_common/reminders/` do not pre-write backend requests. The agent implementing a prompt is
the one that discovers exactly which field was missing, which nullability was wrong, or which
computation cannot honestly be done client-side — and it writes a sharper ask than anyone could from a
cold read. Several prompts tell you to come here. This file says what to write.

## The rule

If, while implementing a prompt, you conclude that the correct fix requires a backend change:

1. **Do not stop, and do not implement a fake version of it.** Finish everything in the prompt that does
   not depend on the backend.
2. **Do the honest frontend-only fallback** the prompt describes, and leave a `// TODO(Bn):` comment at
   the site pointing at the file you are about to write.
3. **Write the ask** to `prompts/_common/reminders/backend/Bn-short-slug.md`, numbering from the highest `Bn`
   already in this directory.
4. **Report it** in your final message: what you could not do, and the filename you wrote.

## This is the framework's backend, not the app's

`src/_common/modules/reminders/` is part of the `vue_framework` submodule, and the reminder service it
talks to (`/reminder-definition/*`, `/reminder-dashboard/*`) is shared infrastructure, not an
AntiProcrastinationApp endpoint. **Say so at the top of every ask.** It changes the calculus for the
backend agent: a field added here is added for every consumer, so an ask that only makes sense for one
app's UI is the wrong ask, and a compatibility-breaking change to an existing response is close to
unacceptable. Prefer additive fields, and say explicitly whether an existing consumer breaks if the
field is absent.

## What the ask must and must not contain

**Contract and business rules only.** Do not prescribe storage, entities, EF configuration, migrations,
indexes, or where a computation happens — those are the backend agent's decisions. Requesting a specific
table or a specific query is out of scope and will be ignored.

Use this structure:

```markdown
# Bn · Backend ask — <one line>

**Contract only.** <one sentence disclaiming implementation decisions.>
**Framework-shared.** <one sentence: this is the shared reminder service, additive changes preferred.>

## The problem
<What is wrong TODAY, with file:line citations from src/_common/modules/reminders/. Describe the
user-visible consequence, not the code smell. If it is a live bug, say so and say what the user
currently sees.>

## The business rules
<Every rule the frontend currently assumes, stated so the backend can confirm or CORRECT it. Frame each
as a question where the current client behaviour looks like a guess rather than a decision. The frontend
will follow the server's answer, not the other way round.>

## The shape the frontend needs
<Fields, their types, their nullability, and WHY each is needed — name the component that renders it.
Say which endpoint it should hang off, whether it is additive or breaking, and whether it is hot enough
to matter.>

## What changes on the frontend once this lands
<Which files get deleted or simplified, and which `// TODO(Bn):` comments get removed. This is how the
backend agent judges whether the ask is worth the work.>
```

## Known candidates

Listed so you recognise the situation, **not** so you write them speculatively — only write the ask if
you actually reached it while doing the work.

- **`ReminderDefinitionGridResponse` is missing `intervalPreset` and `cronExpression`** (from R1). It is
  why the register's schedule column renders "—" for every recurring reminder while the three dashboard
  views render it correctly from `UpcomingReminderGridResponse`, which does carry both. The interesting
  question is not the two fields — it is whether the grid response is deliberately minimal, and if so
  what the register list is supposed to show instead.
- **Whether `ReminderOverviewResponse.failures` is bounded** (from R9). `OverviewFailureList.vue:21`
  renders `items.length` as a headline count and then renders every item, unpaginated. If the server caps
  the list, the headline is a lie on a bad day; if it does not, the card is unbounded. One sentence from
  the backend settles it. Also unstated: what window `dueSoonDays` defaults to and whether the client may
  choose it.
- **A batch pause/resume/cancel endpoint** (from R11). The three existing lifecycle endpoints take a
  single 4-part `ReminderKeyRequest` body and return no content. The ask is mostly about semantics, not
  shape: is a batch partially applicable, what comes back when 3 of 30 fail, and does cancelling an
  already-Cancelled reminder stay idempotent in bulk the way it is singly.
- **A next-N-occurrences projection** (from R12). Cron expressions are declared UTC-interpreted
  (`ReminderScheduleType.ts:7`) and cannot be evaluated client-side without shipping a cron library and
  duplicating the server's DST and end-date rules — which would drift silently the first time either side
  changes. The ask is for the server to project the schedule it already computes.
