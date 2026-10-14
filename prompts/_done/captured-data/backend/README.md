# Backend asks — written by the agent that hits the wall

This directory is a **destination**, not a queue. It starts empty on purpose.

The frontend prompts in `..` do not pre-write backend requests. The agent implementing a frontend prompt is the one that discovers exactly which field was
missing, which nullability was wrong, or which computation cannot honestly be done client-side. It writes a sharper ask than anyone could from a cold read.

## The rule

If, while implementing a frontend prompt, you conclude that the correct fix requires a backend change:

1. **Do not stop, and do not implement a fake version of it.** Finish everything in the prompt that does not depend on the backend. No `localStorage`
   stand-in for a server field, no approximation from whatever window the view happens to have loaded.
2. **Do the honest frontend-only fallback** the prompt describes, and leave a `// TODO(Bn):` comment at the site pointing at the file you are about to write.
3. **Read the backend first.** The API is at `C:\Users\jakub\RiderProjects\AdhdTimeOrganizer`. Confirm the thing you need really is missing before asking for
   it. An ask that requests something already there wastes the backend agent's turn.
4. **Write the ask** to `prompts/captured-data/backend/Bn-short-slug.md`, numbering from the highest `Bn` already in this directory.
5. **Report it** in your final message: what you could not do, and the filename you wrote.

## What the ask must and must not contain

**Contract and business rules only.** Do not prescribe storage, entities, EF configuration, migrations, indexes, or where a computation happens. Those are the
backend agent's decisions. Citing a backend file to show *what exists today* is useful. Telling it which table to add is out of scope and will be ignored.

The worked examples are `../../view-docs/backend/_done/B26-planner-task-skip-reason-never-written.md` and
`../../view-docs/backend/_done/B27-template-suggestions-ignore-what-the-user-set.md`. Read one before writing yours. Structure:

```markdown
# Bn · Backend ask — <one line>

**Contract only.** <one sentence disclaiming implementation decisions.>

## The problem
<What the user cannot get TODAY, with file:line citations from src/ (and from the API where you read it).
Describe the user-visible consequence, not the code smell.>

## The business rules
<Every rule the frontend assumes, stated so the backend can confirm or CORRECT it. Frame a rule as a
question where the client's behaviour is a guess rather than a decision. The frontend follows the
server's answer, not the other way round.>

## The shape the frontend needs
<Endpoint (method, route, request), then response fields with types and nullability, in the JSON
casing the frontend `fromJson` reads, and WHY each is needed — name the component that renders it.>

## What changes on the frontend once this lands
<Which files get simplified or which surface appears. This is how the backend agent judges whether the
ask is worth the work.>

## How the client will verify
<The exact live check, against the e2e seed, with no mocking.>
```

Validation 400s carry no `errorType` in this API (`B18`). A 409 or a domain refusal that the client must branch on does. Say which you expect.
