# Framework asks — gaps in `src/_common/modules/user/`

`src/_common` is the `vue_framework` submodule. Editing it silently dirties the pointer and the
change is lost on the next bump, and both ESLint and Prettier ignore it so nothing warns you. The
rule from the root `CLAUDE.md` and `migration-revision.md` is absolute:

> Never fix these by editing `src/_common`. Add them in the framework repo, bump the submodule
> pointer, then delete the local file and repoint its importers.

This directory holds the asks that come out of the `prompts/user/` series.

## Why two of these are pre-written and the rest are not

The standing convention for `backend/` is that the agent hitting the wall writes the ask, because
this repo cannot see the .NET solution and an ask written from a cold read is a guess. That reasoning
does **not** transfer here: `src/_common` is checked out and readable, so a framework gap can be
verified from this repo with file and line numbers, exactly like an app-side one.

The split is therefore about who will encounter it:

- **F1 and F2 are pre-written.** Nothing in the `U`, `P` or `A` series touches the code they concern,
  so no implementing agent will ever hit them. If they are not written here they are never written.

  **The cost of that, learned from F2 (resolved 2026-08-18, `migration-revision.md` R17):** a
  pre-written ask is written without hitting the code, so it can be wrong as well as stale. F2's
  stated gap was closed by R16 five days after it was written, and its proposed fix — zone-aware
  `DateTimeHelper` formatting — would have introduced off-by-one-day bugs at every calendar-day call
  site. **Re-verify a pre-written ask's "The gap" section against the code before implementing it,
  and treat its "What the framework should expose" as a suggestion rather than a spec.** An ask
  written by the agent that hit the wall does not have this failure mode.
- **Everything else is written by the agent that reaches it.** `U1` will write `F3`
  (hydration belongs on the login path). `P2` and `A2` each end by telling you to write one. Number
  from the highest `F<n>` already in this directory.

## Every ask must also land in `migration-revision.md`

The ask file is the detail; `migration-revision.md` is the index the next session reads. Add a bullet
under **"Still open"** with the gap, the local file kept for it (if any), and a pointer to the ask
file. That index is how §10 stayed tracked and how R13's thirteen errors went untriaged for weeks by
not being there.

## Format

```markdown
# F<n> · <one line — the gap, not the symptom>

**Framework ask.** `src/_common` is a submodule; this describes a change to make in the
`vue_framework` repo, not here.

## The gap
<What the framework does today, with file:line from src/_common. State the user-visible consequence.
If it is a live bug, say what the user currently sees.>

## Why it cannot be fixed app-side
<Which slot, prop or seam is missing. If a workaround exists and is being shipped, this section says
what it costs.>

## The app-side workaround kept in the meantime
<File path, what it does, and that it is deliberate. `none` is a valid answer.>

## What the framework should expose
<The smallest change that works. A prop, a slot, a call moved. Default it so that no existing
consumer of the framework changes behaviour — that is what makes the ask cheap to accept.>

## What gets deleted here when it lands
<The files and lines this repo removes on the pointer bump. This is how the framework maintainer
judges whether the ask is worth it.>
```

## Scope rules

- **The smallest change that works.** A slot beats a prop beats a rewrite. An ask that redesigns a
  framework flow will be declined and will have cost two turns.
- **Default to current behaviour.** Every other app consuming the framework must be unaffected by
  the change unless it opts in. Say so explicitly in the ask.
- **No app-specific vocabulary in the framework.** The framework must not learn that this app has a
  day planner, activity tracking, or a leisure module. Phrase the ask in the framework's own terms.
- **Do not ask for something already reachable through a slot.** `UserSettingsView` exposes
  `#integrations`, `#preferences` and `#append`; `SecuritySection` forwards `#integrations`. Check
  those first — three of the four candidates considered for this series turned out to be solvable
  through `#append`.
- **Do not write an ask for cosmetics.** The three framework settings sections duplicate the same
  `VCard` shell, and `AppearanceSection` / `SessionsSection` double up the error snackbar the axios
  interceptor already shows. Both are real; neither is worth a turn. They are recorded in the series
  README's exclusions instead.
