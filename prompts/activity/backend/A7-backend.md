# A7 · Backend ask — is `roleOption` ever absent on `{source}/form-select-options`?

**Contract only.** This asks for a statement of fact about an existing response. No storage, entity or
computation decisions are requested. Mostly a written answer; at most one response-shape change.

Small ask — batch it with A8 and A9 rather than opening a session for it.

## Context

`GET /{source}/form-select-options`, where `{source}` is one of `activity`, `activity-history`,
`task-planner`, returns the combination matrix behind every activity picker in the app. A7 put it
behind a shared per-source cache (`src/core/activity/store/activityOptionsStore.ts`) so it is fetched
once per session instead of once per component mount.

The frontend reads each row as
(`src/core/activity/dto/response/ActivitySelectOptionCombination.ts`):

| JSON field                | Read as                | What the frontend does with it                              |
| ------------------------- | ---------------------- | ----------------------------------------------------------- |
| `id`, `text`              | the activity itself    | the activity dropdown's option                               |
| `roleOption`              | **non-nullable**       | the role dropdown, and the filter key for cascading          |
| `categoryOption`          | `SelectOption \| null` | the category dropdown, and the filter key for cascading      |
| `taskPriorityOption`      | `SelectOption \| null` | the priority dropdown, shown only when "from to-do list"     |
| `routineTimePeriodOption` | `SelectOption \| null` | the period dropdown, shown only when "from routine to-do"    |

## The live consequence

`SelectOption.fromJson` (`src/_common/dto/response/general/SelectOption.ts:7`) destructures its
argument, so **`SelectOption.fromJson(null)` throws a TypeError**. `roleOption` is the one field read
without a guard:

```ts
const roleOption = SelectOption.fromJson(object.roleOption) // throws if null or omitted
```

One such row aborts `listFromObjects`, which rejects the whole request. The caller
(`useActivitySelectionFormState.ts`) catches it and falls back to an empty matrix, so **every dropdown
in the form goes blank with no error shown** — the user sees a form with nothing to pick, not a
failure. `filterActivityFormSelectOptions` then reads `combination.roleOption.id` unguarded too, so a
present-but-empty `roleOption` object silently matches nothing instead of throwing.

The caching does not create this, but it does widen the blast radius: consumers that used to each fail
on their own now all await the same request, so they fail together.

## The question that matters

1. **Can `roleOption` ever be null, or the property omitted, on any of the three sources?**
   If it can, say under which condition (an activity whose role was deleted? a source that joins
   loosely?). The frontend then declares it `SelectOption | null`, guards both read sites, and drops
   the row from the role dropdown rather than blanking the form. That is app-side work and needs no
   backend change — but the guard has to be written for the real case, not a hypothetical one, because
   "drop the row" and "keep the row with no role" are different products.
   If it cannot, say so plainly and the frontend leaves it non-nullable.

2. **Can `id` or `text` be null on any nested option object?** Same reason: `fromJson` copies them
   through without a default, so a null `text` renders an empty dropdown entry that is selectable.

## One thing that does *not* need answering

A1 flagged the null-vs-omitted question for `categoryOption`, `taskPriorityOption` and
`routineTimePeriodOption`. Building the cache resolved it: `fromJson` tests those three for
truthiness, so `null` and "absent" produce identical results and no code depends on which one you
send. **Do not spend time on it.** Only `roleOption` is unguarded, and only because it is declared
non-nullable.

## One question about the shape, worth a sentence

3. Are the three sources **nested** — is `activity/form-select-options` a superset of what
   `activity-history` and `task-planner` return, or are they independently filtered sets that can each
   contain rows the others do not?

   The cache currently keeps one entry per source, because the frontend cannot tell. If `activity` is
   a strict superset, the cache can hold one matrix and derive the other two, which removes up to two
   of the three fetches per session on the largest response the app makes. Not worth changing the
   endpoint over — just say which it is.
