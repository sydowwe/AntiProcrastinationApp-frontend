# N5 · Backend ask — temptation bundling field on the todo list item

**Contract only.** This states what the frontend sends and reads, nothing about storage. Entities, EF
configuration, migrations, FK relationships, cascade behaviour and validation rules are the backend
agent's decisions, not requests made here.

The frontend work is already merged and ships safely ahead of this: the field is read with
`?? null`, so until the API carries it the pairing UI is simply never populated.

## The field

| | |
|---|---|
| JSON name | `pairedLeisureActivityId` |
| Type | integer |
| Nullable | yes — `null` means "no pairing", and that is the default for every existing row |
| Value | an **activity id** |

One field. Nothing nested.

### Why it is an activity id

The leisure module's backlog entries are profiles keyed by activity: `ActivityBacklogProfile.id`
returns `activityId` (`src/core/leisure/dto/response/ActivityBacklogProfile.ts`). The frontend picks a
backlog entry and stores the activity id it is keyed by, then resolves the name and duration client-side
from `GET /activity-backlog-profile`. So the response does **not** need to embed the leisure activity's
name, duration or any other profile data — an id is sufficient and is all the frontend reads.

## Endpoints that must carry it

Requests — the field is present in the JSON body, sent as `null` when the user has not paired anything:

| Method | Route | Body |
|---|---|---|
| `POST` | `/todo-list-item` | create; `ToDoListItemRequest` + `todoListId` |
| `PUT` | `/todo-list-item/{id}` | update; `ToDoListItemRequest` |

Read responses the frontend already consumes and hydrates through `TodoListItemEntity.fromJson`:

| Method | Route | Used by |
|---|---|---|
| `GET` | `/todo-list-item?todoListId={id}` | the list view — needs the field |
| `GET` | `/todo-list-item/{id}` | re-read after create/edit/toggle — needs the field |
| `GET` | `/todo-list-item/dashboard-widget` | home widget — hydrates the same DTO, but renders no pairing today; including the field is harmless, omitting it costs nothing |

Nothing else changes. The `toggle-is-done`, `change-priority`, `change-display-order`, `move` and
`batch-delete` routes are untouched, and an update must preserve the value it was given rather than
clearing it — `PUT` already round-trips the whole item, so the frontend sends the current value back
on every edit.

## Scope note — normal list only

`pairedLeisureActivityId` belongs to the **normal** todo item only. It is deliberately not on the shared
`BaseToDoListItemRequest`, so routine items (`/routine-todo-list`) do not get it: routine items repeat on
their own schedule and already have their own reward loop (streaks, personal bests, heatmap).
