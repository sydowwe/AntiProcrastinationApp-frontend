# Backend asks — written by the agent that hits the wall

This directory is a **destination**, not a queue. It starts empty on purpose.

The frontend prompts in `..` do not pre-write backend requests. The agent implementing a frontend prompt is the one that discovers exactly which field was missing,
which nullability was wrong, or which value never round-trips — and it writes a sharper ask than anyone could from a cold read. Several prompts tell you to come
here. This file says what to write.

The .NET solution is not in this repo, so nothing here can be verified from this side. That is the whole reason the boundary below is drawn where it is.

## The rule

If, while implementing a frontend prompt, you conclude that the correct fix requires a backend change:

1. **Do not stop, and do not implement a fake version of it.** Finish everything in the prompt that does not depend on the backend.
2. **Do the honest frontend-only fallback** the prompt describes, and leave a `// TODO(B<n>):`
   comment at the site pointing at the file you are about to write.
3. **Write the ask** to `prompts/user/backend/B<n>-short-slug.md`, numbering from the highest `B<n>`
   already in this directory.
4. **Report it** in your final message: what you could not do, and the filename you wrote.

## What the ask must and must not contain

**Contract and business rules only.** Do not prescribe storage, entities, EF configuration, migrations, indexes, or where a computation happens — those are the
backend agent's decisions. Requesting a specific table or a specific query is out of scope and will be ignored.

Use this structure — the existing asks in `../../../activity-history/backend` and
`../../todo-motivation/backend` are worked examples, read one before writing yours:

```markdown
# B<n> · Backend ask — <one line>

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

## When NOT to write one

An ask that confirms something the backend already told us, or that the frontend could have determined itself, costs a turn and returns nothing. Specifically:

- **Do not ask whether an existing field exists.** `User.fromJson` copies unknown keys through (`_common/modules/user/dto/response/User.ts:41-43`), so you can find
  out by setting a value, reloading, and seeing whether it comes back. Only ask once you have observed it not round-trip.
- **Do not ask for confirmation that the current shape is fine.** Ask when you believe something is wrong and can say what and why.
- **Do not re-ask what another series already asked.** `../../home/backend/README.md` already scopes the plan-completion streak, including its business rules. If
  `P4`'s triage lands on the same thing, reference that file instead of writing a second ask, and say so in your summary.

## Known candidates

Listed so you recognise the situation, **not** so you write them speculatively — only write the ask if you actually reached it while doing the work.

- **`firstDayOfWeek` may not round-trip** (from `P2`). Declared on both sides of
  `/user/preferences` in `../../../../src/core/user/dto/userAugmentation.ts`, never sent by any control until
  `P2` adds one. If `POST /user/data` does not echo it back, the toggle will silently reset on every reload while the server holds the real value.
- **`askBeforeDelete` may need to stop being a boolean** (from `P3`). Only if the granularity work concludes it should; include the migration semantics for existing
  `true` / `false` rows and the server-side default.
- **Account-scoped state that currently lives in localStorage** (from `P4`). Batch every surviving item into ONE ask, not one per item. The planner streak is the
  strongest case and the questions worth asking about it are already written down in `../../home/backend/README.md` — read that first so the two asks compose instead
  of contradicting.
- **Preference ownership across two endpoints** (from `P1`). `/user/preferences` and the planner's own settings endpoint both store per-user preferences. Only ask if
  a specific field looks like it is on the wrong side, and say which rule you applied.
- **A `Content-Disposition` on `/user/data-export`** (from `U3`), and what the export actually contains — which matters to `A2` and to the privacy copy in `U5`.
- **A cold-path account summary** (from `A2`): counts of what account deletion destroys, so the warning names numbers instead of nouns.

Batch the resulting files into one backend session rather than opening a thread each.
