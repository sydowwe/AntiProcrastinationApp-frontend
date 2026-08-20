# A8 · Backend ask — a stable system key on activity roles

> **STATUS: shipped and adopted.** The backend delivered this contract as written —
> `GET /activity-role/by-system-key/{key}` returning the full role, plain 404 on miss, plus nullable
> `systemKey` on every role response, with the wire spelling `routineTask` / `todoListTask` /
> `plannerTask` verbatim (C# members are PascalCase but carry `[JsonStringEnumMemberName]`, so no
> client-side mapping). Storage is a nullable `system_key` column with a filtered unique index on
> `(user_id, system_key)`; migration `20260819183419_ActivityRoleSystemKey`.
>
> Frontend adopted: `fetchSystemActivityRoleId` calls the new endpoint and the `SYSTEM_ROLE_LOOKUP_NAMES`
> bridge constant is deleted. `Role.systemKey` is read in `fromJson`.
>
> **Answers to the three questions**, for the record: (1) per user, on the user-scoped `activity_role`
> table, stamped by `DefaultActivityRoleSeeder`. (2) A keyed role **cannot** be deleted — `DELETE` returns
> 409; rename/recolour/re-icon stay allowed and preserve the key, and no request DTO carries `systemKey`,
> so a role can be neither created keyed nor un-keyed through the API. (3) 404, no lazy create — so the
> `activities.systemRoleMissing` snackbar stays as the expected-state handler.
>
> **One residue.** The migration backfills by the seeded English names, so accounts that renamed one of
> the three *before* this shipped keep `systemKey: null` and cannot be identified automatically — those
> users hit the 404 snackbar until someone maps them by hand (a one-line UPDATE per account). Worth
> running `SELECT count(*) FROM activity_role WHERE system_key IS NULL GROUP BY user_id` after deploy to
> size it. For every account seeded after this, the 404 is unreachable.
>
> The original ask is kept below unchanged.

**Contract only.** This states the endpoint and fields the frontend reads, nothing about storage. Entities, EF configuration, migrations, seeding mechanics and how
the key is persisted are the backend agent's decisions, not requests made here. The business *rules* in "Questions the backend has to answer" are in scope — the
frontend genuinely cannot decide them.

Nothing is blocked. The frontend half of A8 has shipped and works against the existing by-name endpoint. What has not been fixed is the underlying defect, because it
cannot be fixed client-side.

## The problem

Three roles are referenced by the app itself, not by the user: an activity quick-created from a routine to-do, a normal to-do or a planner task lands under a fixed
role. The only way to find that role is its **English display name**:

```
GET /activity-role/by-name/Routine task
GET /activity-role/by-name/To-do list task
GET /activity-role/by-name/Planner task
```

`/activity-settings/roles` lets the user rename any role, with no protection on these three. Renaming
"To-do list task" — to a Slovak name, or to anything at all — makes that GET 404, and quick-create breaks in four dialogs:

- `../../../../src/core/todoList/component/normal/ToDoListItemDialog.vue`
- `../../../../src/core/todoList/component/routine/dialog/RoutineToDoListForm.vue`
- `../../../../src/core/dayPlanner/component/BasePlannerTaskDialog.vue`
- `../../../../src/core/dayPlanner/component/settings/RepeatingTaskDialog.vue`

It also means the name is load-bearing and therefore cannot be localized: the Slovak UI has to keep seeding and displaying English role names for these three, or
lose quick-create.

## The ask

An identity-based lookup for the three system roles.

### Endpoint

```
GET /activity-role/by-system-key/{key}
```

`{key}` is one of the three strings below, sent verbatim as a path segment (they are URL-safe as written; the client does not encode them):

| Key            | Currently seeded as | Used by                   |
|----------------|---------------------|---------------------------|
| `routineTask`  | `Routine task`      | routine to-do dialog      |
| `todoListTask` | `To-do list task`   | normal to-do dialog       |
| `plannerTask`  | `Planner task`      | both planner task dialogs |

These are the values of `SystemActivityRole` in
`../../../../src/core/activity/dto/enum/SystemActivityRole.ts`. They are camelCase because they double as i18n sub-keys client-side. If the backend prefers
PascalCase on the wire, that is fine — say so and the client maps; what matters is that both sides agree on one spelling and it never changes again.

### Response

`200` with the same shape `/activity-role/{id}` already returns, i.e. what
`../../../../src/core/activity/dto/response/Role.ts` reads:

| Field   | Type    | Nullable |
|---------|---------|----------|
| `id`    | integer | no       |
| `name`  | string  | no       |
| `text`  | string  | yes      |
| `color` | string  | yes      |
| `icon`  | string  | yes      |

The frontend only reads `id` here. Returning the whole role is convenient but not required — an
`{ "id": 12 }` body is equally acceptable, as long as the field is named `id` and is an integer.

`404` when the user has no role carrying that key. This is a normal, expected outcome, not an error condition — see below. The client already sends this request
`_silent`, so no error body is rendered; a plain empty 404 is fine.

### Also: expose the key on the role itself

Add the key to whatever `/activity-role` responses already carry a role, as a nullable field:

| Field       | Type   | Nullable | Meaning                                                    |
|-------------|--------|----------|------------------------------------------------------------|
| `systemKey` | string | **yes**  | one of the three keys above; `null` for user-created roles |

This is what lets the roles settings table mark the three as system roles and warn before deleting one. It is a nice-to-have; the lookup endpoint above is the part
that fixes the defect.

## What the frontend does with it

`fetchSystemActivityRoleId` in `../../../../src/core/activity/api/activityOptionsApi.ts` swaps its request URL to the new endpoint and the `SYSTEM_ROLE_LOOKUP_NAMES`
bridge constant directly above it is deleted. That is the whole change — it is one function, and neither `ActivitySelectOrQuickEditFormField.vue` nor the four call
sites know the lookup exists.

**In the meantime**, shipped and live today:

- The four call sites pass `SystemActivityRole.PLANNER_TASK` etc., never a display name.
- The label in the quick-create switch comes from `activities.systemRole.*` in the SK/EN locale files, so the Slovak UI no longer prints an English role name inside
  a Slovak sentence.
- The resolved id is cached for the session in `activityOptionsStore` and invalidated by any role mutation, so quick-create costs one lookup per session instead of
  one per create.
- A failed lookup shows `activities.systemRoleMissing` ("The … role could not be found, so the activity was not created") and does not attempt the create. Previously
  it rejected, produced the interceptor's generic error snackbar, and returned a value the caller could not distinguish from "user cancelled" — so the activity
  silently never appeared.
- `SYSTEM_ROLE_LOOKUP_NAMES` still translates key → English name for the by-name call. This is marked as a temporary bridge in the source and is the only place the
  mapping exists.

## Questions the backend has to answer

The client cannot determine any of these, and its behaviour depends on all three.

1. **Are the three roles seeded per user, or are they shared/global?** The frontend assumes per user, because `/activity-role/all-options` is user-scoped and the
   seeded names show up in the user's own role list. Confirm.
2. **Can a user delete one?** The roles settings table offers delete with no special case. If deletion is permitted, the lookup will 404 permanently for that user
   and quick-create is dead in four dialogs until they recreate a role — which they cannot, because there is no way to attach a system key from the UI. Either
   deletion of a keyed role must be rejected, or the backend must re-seed on demand. State which.
3. **What does `GET /activity-role/by-system-key/{key}` return if the role is missing?** The frontend currently treats any non-answer as "missing" and shows the
   specific snackbar. If the backend intends to lazily create the role on first lookup instead, say so — the frontend would then treat a 404 as a real error rather
   than an expected state, and the snackbar copy changes.

A related question, answerable only server-side: **do existing rows already have these three roles under their seeded English names for every user?** If some
accounts were seeded before the names settled, or a user has already renamed one, backfilling the key cannot be done by name-matching alone and those accounts need a
decision. The frontend behaves identically either way — the lookup 404s and the user gets the snackbar — but the accounts stay broken until it is resolved.

## Out of scope

No change to `PATCH /activity/{id}/Overwrite` and `PATCH /activity/{id}/Clone`. The mode is now a real enum client-side
(`../../../../src/core/activity/dto/enum/QuickEditMode.ts`) but its values are still the exact PascalCase path segments, so the wire format is untouched.
