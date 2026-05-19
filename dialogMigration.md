# Dialog Migration — Delegation Prompt

You are migrating one or more dialog components in this Vue 3.5 + Vuetify 3 codebase from the
**per-view-mounted** pattern to the **centralized `useDialog()`** pattern. This document is
self-contained: read it fully before touching code. Read `CLAUDE.md` (project root) for general
coding standards before starting.

---

## 1. Why we're doing this

Each dialog used to be a stateful Single File Component that wrapped `MyDialog`, exposed
imperative methods (`openCreate`, `openEdit`, `open(...)`) via `defineExpose`, was mounted in every
parent view as a `ref`, and bubbled results up via emits. That meant: a `ref` + a `<XxxDialog>` tag
in every view, lifecycle state carried across opens, and no way to `await` a dialog result.

The new pattern: ONE `<DialogHost>` is mounted globally in `App.vue`. Views call
`openDialog({ component, componentProps, dialogProps })` which returns `Promise<TResult | null>`.
The dialog body component is mounted fresh on each open, uses `useDialogApi()` to close itself
with a result, and never wraps `MyDialog` directly.

---

## 2. The infrastructure you'll use (already exists — do NOT re-create)

- `src/composables/general/useDialog.ts` — exports `useDialog()` (returns `openDialog`, `confirm`)
  and `useDialogApi()` (for use inside a dialog body).
- `src/components/general/dialogs/DialogHost.vue` — mounted once in `App.vue`. Iterates the open-
  dialog stack.
- `src/components/general/dialogs/DialogEntryRenderer.vue` — internal; renders one `MyDialog` per
  open dialog and `provide`s a `DialogApi` scoped to it. You should never import this directly.
- `src/components/general/dialogs/MyDialog.vue` — the styled dialog shell. Still the canonical
  wrapper. Read its props before deciding `dialogProps` to pass.

### `DialogApi` (what dialog bodies get from `useDialogApi<TResult>()`)

```ts
interface DialogApi<TResult> {
	close(result?: TResult | null): void              // resolve the openDialog() promise
	onConfirm(handler: () => void | Promise<void>): void  // wire MyDialog's confirm button / Enter
	setLoading(loading: boolean): void                // toggle MyDialog's loading bar
	setDialogProps(patch: Partial<DialogProps>): void // mutate title/labels/etc at runtime
}
```

When the user clicks `MyDialog`'s confirm button (or presses Enter), the host invokes the registered
`onConfirm` handler. The handler is responsible for validating, then calling `dialogApi.close(result)`.
If no `onConfirm` handler is registered (e.g. a display-only dialog), the host closes with `true`
when confirmed and `null` when cancelled/closed.

### `OpenDialogOptions`

```ts
interface OpenDialogOptions<TProps = Record<string, unknown>> {
	component?: Component             // the dialog BODY component (no MyDialog wrapper!)
	componentProps?: TProps           // forwarded to the body via v-bind
	dialogProps?: DialogProps         // forwarded to MyDialog — title, confirmBtnLabel, etc.
}
```

---

## 3. The migration pattern — read these reference examples first

These three were already migrated. Mirror their style:

| Old component (deleted)                                                | New body component                                                   | Caller                                       |
|------------------------------------------------------------------------|----------------------------------------------------------------------|----------------------------------------------|
| `src/components/toDoList/routine/dialog/RoutineToDoListDialog.vue`     | `src/components/toDoList/routine/dialog/RoutineToDoListForm.vue`     | `src/views/todoList/RoutineToDoListView.vue` |
| `src/components/toDoList/routine/dialog/TimePeriodDialog.vue`          | `src/components/toDoList/routine/dialog/TimePeriodForm.vue`          | `src/views/todoList/RoutineSettingsView.vue` |
| `src/components/toDoList/routine/dialog/RoutineGroupHistoryDialog.vue` | `src/components/toDoList/routine/dialog/RoutineGroupHistoryBody.vue` | `src/views/todoList/RoutineToDoListView.vue` |

### Naming

- Form-style dialog → rename to `XxxForm.vue` (e.g. `ActivityDialog` → `ActivityForm`).
- Display-only dialog (no form, no confirm action) → rename to `XxxBody.vue` (e.g.
  `TemplateDetailsDialog` → `TemplateDetailsBody`).
- Confirmation-style dialog with only `OK`/`Cancel` → consider replacing with `confirm({...})`
  helper directly in the caller; no separate component needed.

### Where the work goes

- **API calls**: leave them in the caller view, NOT inside the new body component. The body
  validates + collects data and resolves with the validated request/payload. The caller decides
  what to do with the result (create / update / show snackbar). This matches `RoutineToDoListForm`
  and `TimePeriodForm`.
- **Exception**: if the API call is tightly coupled to the dialog's own state machine and would
  bloat callers in 3+ places, keep it inside the body and resolve with the API response.
  Document the choice in a single short comment.

### Template/script conventions (project rules)

- Use `function name() {}` for all functions, never `const name = () => {}`.
- PascalCase tags in templates, camelCase props (e.g. `hideDetails`, NOT `hide-details`).
- Strict equality: `===`/`!==`.
- Boolean attribute shorthand: write `loading`, not `:loading="true"`.
- Props: destructure defaults — `const { foo = 'x' } = defineProps<{ foo?: string }>()`.
  Never `withDefaults()`.
- For v-model use `defineModel()`.
- i18n: keep any `$t(...)` keys the original dialog used. Strings that were hardcoded English in
  the original may remain hardcoded in the migration (don't expand scope).
- API: import `API` from `@/plugins/axiosConfig.ts`; use the entity composables from
  `src/api/base/` if the original did.

---

## 4. Step-by-step recipe

For each old `XxxDialog.vue`:

1. **Open the old file and identify**:
    - The body content inside `<MyDialog>` slot.
    - What the `defineExpose({...})` methods do (usually `openCreate`/`openEdit`/`open(entity)`).
    - What it emits, and what the parent does with those emits.
    - Any state that's reset on close (`watch(dialog, ...)` blocks).
2. **Create the new body component** (`XxxForm.vue` or `XxxBody.vue`) next to the old one. It must:
    - Have NO `<MyDialog>` wrapper. The root template is the form / display content directly.
    - Take initial data as plain props (e.g. `entityToEdit?: SomeEntity | null`). For create vs
      edit, distinguish by whether the entity prop is `null`.
    - Use `const dialogApi = useDialogApi<TResult>()` where `TResult` is the shape the caller will
      receive on confirm.
    - Register the confirm handler with `dialogApi.onConfirm(onConfirm)` at the top of `<script setup>`.
    - In `onConfirm`: validate, build the result payload, call `dialogApi.close(result)`.
    - Use `dialogApi.setLoading(true/false)` for async work that should show MyDialog's loading bar
      (e.g. watch a `loading` ref and forward).
    - If the dialog body needs initial data fetched (e.g. select options), do it in `onMounted` —
      the body is mounted fresh per open, so `onMounted` runs on each open.
    - Drop the old reset-on-close logic — fresh mount per open replaces it.
    - Do NOT use `defineExpose`.
3. **Update the caller view**:
    - Remove the `<XxxDialog ref="..." />` from the template and the matching `ref` from script.
    - Replace `xxxDialog.value?.openCreate()` / `openEdit(entity)` with new wrapper functions:

      ```ts
      async function openCreateDialog() {
          const result = await openDialog<TResult>({
              component: XxxForm,
              dialogProps: {
                  title: t('...'),
                  confirmBtnLabel: t('general.add'),
              },
          })
          if (!result) return
          // ...do whatever the old emit handler did, with result.
      }
      ```

    - Make sure `const { openDialog } = useDialog()` is imported and called in script setup.
4. **Delete the old `XxxDialog.vue`** file once nothing references it. Run
   `Grep` for the old name to confirm zero references before deleting.
5. **Typecheck**: run `npx vue-tsc --noEmit` (PowerShell). It must pass cleanly with no new errors.
   The project uses Windows + PowerShell — use the PowerShell tool, not Bash, to run it. Exit code
   `0` means success.
6. **Do NOT run `npm run dev`** — you can't verify UI behavior. State explicitly in your final
   summary that the user must smoke-test the migrated dialogs in the browser.

---

## 5. Dialogs to migrate

Run `Grep` for `import MyDialog from` to list candidates. Skip these — they are NOT dialogs to
migrate (they're infrastructure or already-migrated bodies):

- `src/components/general/dialogs/DialogEntryRenderer.vue` (infrastructure)
- `src/components/general/dialogs/ErrorDialog.vue` (utility wrapper — leave for last; if migrated,
  consider whether `confirm({...})` plus a retry callback covers all its use cases)

For each, also `Grep` for the old component name to find every caller — you must update them all.

---

## 6. Edge cases & gotchas

- **`eager` prop**: many old dialogs pass `eager` to `MyDialog` so onMounted fetches run before
  open. The new pattern mounts the body on open, so `onMounted` fires on each open — usually fine,
  but if the fetch is expensive, hoist it into a Pinia store (`src/stores/`) and read from there.
- **Reset-on-close logic**: delete it. The body is unmounted ~300ms after close.
- **Programmatic confirm trigger**: if the old dialog calls `onConfirmed()` from an inner `@submit`
  or `@keyup.enter`, the new body should do the same — `MyDialog` already wires Enter to its
  `confirmed` event, but keep `@submit.prevent="onConfirm"` on `<VForm>` for the case where the
  user has a submit button inside the form.
- **Multiple confirm paths**: if the old dialog had multiple "Save" buttons (e.g. "Save", "Save and
  add another"), don't try to express that with `MyDialog`'s single confirm button. Put extra
  buttons inside `MyDialog`'s footer via the body's own template (use `MyDialog`'s `#footer` slot
  by passing them through — or just put them at the bottom of the body content).
- **Stacked dialogs**: opening a dialog from inside a dialog works — each call to `openDialog`
  pushes a new entry. Use this for confirm-on-discard flows.
- **`confirm()` helper**: for simple yes/no dialogs (delete confirmations, "discard changes?"),
  prefer `const ok = await confirm({ text: '...', confirmBtnLabel: '...', confirmBtnColor: 'error' })`
  over creating a new body component.
- **Dialog props that don't exist on `MyDialog`**: if the old code passed `maxWidth="750"` or
  similar directly on `MyDialog`, note that `MyDialog` computes its own `maxWidth` from `isSmall` +
  breakpoint. Set `isSmall: false` in `dialogProps` for wider dialogs. Don't try to pass a raw
  `maxWidth` — it's overridden.
- **TypeScript**: `useDialogApi<TResult>()` — pick `TResult` deliberately. For a form, it's usually
  `{ entity: SomeEntity | null; request: SomeRequest }` or `{ idToEdit: number | null; request: ... }`.
  Match the caller's expected shape.

---

## 7. Definition of done (per dialog)

- New body component exists, no `MyDialog` wrapper, uses `useDialogApi`.
- Every caller updated to use `openDialog`.
- Old `XxxDialog.vue` file deleted.
- `Grep` for the old component name returns zero matches.
- `npx vue-tsc --noEmit` exits 0 with no new errors.
- The user is told (in your final summary) which dialogs you migrated and to smoke-test them in the
  browser. Mention any behavior differences you introduced (e.g. fetches now run on open instead of
  preload, reset-on-close removed).

---

## 8. Scope discipline

- Do not refactor unrelated code "while you're in there".
- Do not add new features, new i18n keys, or new translations unless required to remove dead
  duplication you uncover.
- Do not change `MyDialog.vue`, `useDialog.ts`, `DialogHost.vue`, or `DialogEntryRenderer.vue`
  unless you find an actual bug that blocks a migration — and only then with one short comment
  explaining why.
- If a dialog is doing something the current `useDialog` API can't express, STOP and ask the user
  rather than introducing a workaround.

---

## 9. Suggested batch size

A reasonable single delegation = 3–6 dialogs from one feature area (e.g. all `dayPlanner/normal/*`
dialogs, or all `activity/*` dialogs). Don't try to do all 25+ in one go — each batch should end
with a passing typecheck.

Tier 3 — Medium complexity (~30–45 min each)

19. TimerPresetDialog (123)
20. TrackTimeDialog (124)
21. CalendarDetailsDialog (133) — read its emits
    carefully
22. PomodoroPresetsDialog (195) — list-style picker
23. TemplateComparisonDialog (171) — side-by-side
    display
24. PomodoroPresetFormDialog (271)

Tier 4 — Architectural decisions required (do last,
possibly inline rather than delegating)

These three are coupled — touching one forces you to
think about the other two:

25. PlannerTaskDialog (140) — likely uses
    BasePlannerTaskDialog
26. BasePlannerTaskDialog (230) — shared base; not a
    "dialog" in the traditional sense. Decide: does it
    become a shared form-body component used by multiple
    callers, or does the migration of PlannerTaskDialog
    flatten the inheritance?
27. ToDoListItemDialog (207) — mirrors the
    RoutineToDoList migration; use it as the template
28. RepeatingTaskDialog (351) — biggest, most state.
    Boss fight. Do it after everything else so the pattern
    is automatic by then.