# Phase 4 — extraction template (one group of app units)

You are running **one extraction session** of Phase 4. Your group file (the file the operator pasted, which
pointed you here) names the units, the modules and anything specific to this group. This file is the procedure.

Several of these sessions run, one per group, and none of them sees the others' output. A single later **reconcile**
session reads only what you write, never the raw docs you read. So **your output file has to stand alone.** If a
fact is not in it, the reconcile session never learns it.

## What this phase is for

`docs/data-map.md` answers one question per field: **where is this piece of data captured, and where is it read?**
Fields that are captured and never read, or read only in the form they were typed into, are the feature backlog.
They can't be seen from inside a single unit, which is why no unit pass could produce this.

Your job is the per-group half of it: a field-level table for your modules, plus your group's `opportunity`
findings, in a fixed shape the reconcile session can merge without translating.

## Hard constraints

- **No browser. No shell writes. No backend calls.** Read files and run read-only searches only.
- **Write exactly one file:** `docs/data-map/<group>.md`, where `<group>` is the name in your group file. Create
  the `docs/data-map/` directory by writing the file, and do not touch any other file. In particular, do not edit
  `usecase.md`, `inventory.md` or `findings.md` even where you find them wrong. Record the disagreement in your
  output (§ *Contradictions*) instead.
- **This is a Windows machine.** Use the PowerShell tool for any shell command, never Bash. Prefer the Grep and
  Glob tools for searching.
- **Do not fix anything, and do not file findings.** This is mapping, not auditing.

## Inputs, in this order

1. `docs/views/glossary.md`. It defines the overlapping nouns (activity, task, routine, template, profile…). Use
   its terms in your output.
2. For each unit in your group: `docs/views/<unit>/usecase.md`, then `inventory.md`. Read `usecase.md`'s *Data
   this unit captures but does not spend* section carefully. It is the unit agent's own claim, and you are about
   to check it.
3. For each unit: `docs/views/<unit>/findings.md`, **only** the entries with `Severity: opportunity` (`O` ids),
   plus their `Status:`. Skip every other severity.
4. The **DTOs** of every module your group file lists: `src/core/<module>/dto/**/*.ts`. These, not the docs, are
   the source of truth for *which fields exist*. The docs only mention what their agent happened to notice.

## Procedure

### 1. Enumerate the fields from the DTOs

For each **response** DTO, list every field its `fromJson` keeps. For each **request** DTO, list every field it
sends. Group them by entity (one entity usually has one response DTO and one or two request DTOs). Use the
glossary's name for the entity.

Skip these, and say once at the top of the output that you skipped them:
- `id` fields, and foreign-key ids used **only** to join or navigate (`activityId` used to fetch the activity).
  Keep an FK id if a view *displays* it or *decides* something on it.
- Pure transport wrappers (paged envelopes, `ValueTitleDto` option lists).

Keep audit fields (`createdAt`, `updatedAt`, `createdBy`…). "Stored but never shown" is exactly the kind of
answer this phase exists to find.

### 2. Find where each field is read

For each field, search `src/` for where it is **read**: templates, computed values, composables, stores. Start
from the property name and follow it through the composable or store that exposes it. Then cross-check against
`inventory.md`'s *Readable surfaces* tables, which say what is actually on screen.

- A match inside the DTO file itself, or inside a request builder, is **not** a read.
- A read in a **different module** matters most: name that module and the file.
- Common names (`name`, `color`, `date`) are noisy. Follow the entity through its API composable and store rather
  than grepping the bare word across all of `src/`.
- If you can't settle a field in two or three searches, mark it `?`, say what you tried, and move on. A long tail
  of `?` rows is fine. A wrong `unread` is not, because it becomes a feature proposal.

### 3. Classify each field

Use exactly one of these values in the *status* column. The reconcile session sorts on them.

| status | meaning |
| --- | --- |
| `spent` | Read by a view to show something or to decide something, somewhere other than the form that wrote it |
| `echo` | Only ever shown back inside the form or dialog that edits it. The user types it, and nothing else reads it |
| `unread` | In a response DTO and parsed, but nothing in `src/` reads it |
| `write-only` | Sent in a request DTO but absent from every response DTO, so the client can never show it back |
| `derived` | Server-computed: in a response, never in a request. Give it this status *and* say whether it is read |
| `?` | Could not settle it. Say what you tried |

A `derived` field is still read or unread. Write it as `derived · spent` or `derived · unread`.

Then mark whether the field is **time-bearing**: a date, time, datetime, duration, deadline, recurrence rule or
period. These are the fields a reminder or notification could be driven from. A separate backend audit later
checks each one against what the backend actually notifies about, so be inclusive here: a `suggestedTime`
duration counts, and so does a routine's period.

### 4. Check what the server sends that the client drops

For each **response** DTO, find the matching backend response type in `C:\Users\jakub\RiderProjects\AdhdTimeOrganizer`.
Search by the DTO's name and by its endpoint path. List the members the backend sends that the client's
`fromJson` does not keep. Unit 13's `activityName` was one of these (see `prompts/view-docs/backend/_done/B6-*.md`).

**Bound this step.** Spend at most two searches per DTO. If you can't find the backend type, write `not located`
and move on. The backend repo is read-only for you, like everything else.

### 5. Collect the group's opportunities

Every `O` finding from your units' `findings.md`: its id, its one-line claim, its `Status:`, and the fields it
involves (by the same `Entity.field` names your tables use). If an opportunity names data your tables classify
differently (for example, it calls a field unread but you found it `spent`), note that under *Contradictions*.

## Output: `docs/data-map/<group>.md`

Use exactly these headings, in this order. The reconcile session depends on the shape.

```markdown
# <group> — data-map extract

> Extracted <date> · commit `<short sha>` · units: <list> · modules: <list>
> DTO files read: <n> · fields mapped: <n> · skipped by rule: ids, join-only FKs, transport wrappers

## Summary
<5–8 lines. The most interesting unread / echo / write-only fields in the group, and the strongest cross-module
reads. Written for the reconcile session, which reads six of these.>

## Entities

### <Entity> — `src/core/<module>/dto/response/<X>.ts` · request: `<Y>.ts`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `<field>` | `<ts type>` | <view → control, or "server"> | <view → surface; `module/file` for cross-module reads; "—"> | <status> | <yes / —> |

## Cross-module reads
| field | owned by | read by (module → file) | what for |
| --- | --- | --- | --- |

## Server sends, client drops
| response DTO | backend type | dropped members | note |
| --- | --- | --- | --- |

## Opportunities
| id | unit | status | claim | fields involved |
| --- | --- | --- | --- | --- |

## Contradictions
<Every place a doc's claim disagrees with what you found in code, with both sides and the file:line that settles
it. Mostly this means *Data this unit captures but does not spend* entries that turned out to be read, or reads
the docs missed. "None" if none.>

## Unsettled
<Every `?` row, with what you searched. "None" if none.>
```

## When you are done

End your session with **only** this:

```
Phase 4 extract: <group>
File: docs/data-map/<group>.md
Entities: <n> · fields: <n> (spent <n> · echo <n> · unread <n> · write-only <n> · derived <n> · ? <n>)
Time-bearing fields: <n>
Cross-module reads: <n> · server-drops: <n> DTOs with dropped members, <n> not located
Opportunities: <n> (open <n>)
Contradictions with the unit docs: <n>
```
