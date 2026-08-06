# Task: unify the dialog system between this project and the framework

**Deferred out of the architecture-alignment migration** (see `MIGRATION-PLAN.md`, decision #3). The alignment migration leaves this project's dialog system exactly
where it is; this document is the follow-up that resolves it. Read it in full before touching anything — the obvious answer is wrong.

## Why this was postponed

The architecture brief says "the framework version always wins, even when this project's local version looks nicer." Applying that rule here would mean rewriting 48
call sites onto
`@/_common/composable/CentralDialogComposable.ts`.

**Don't.** An audit of the framework repo found that `CentralDialogComposable.ts` is dead code:

- Zero call sites. Grepping all of `moja-digitalna-firma_frontend/src` for `useDialogManager`,
  `useConfirmDialog`, `useAlertDialog` or `CentralDialogComposable` returns only the file's own definitions. Nothing in MDF imports it.
- **No renderer exists.** `_common/component/dialog/` contains `MyDialog.vue`, `ErrorDialog.vue`,
  `LookupDialog.vue` and `LoadingFullscreen.vue` — but nothing that iterates
  `dialogManager.getDialogs()` and mounts them. `openDialog()` returns a Promise that can never resolve, because no component ever calls `closeDialog()`. Its
  `component: null` "will use default text display" comment describes a renderer that was never written.

So the framework does not actually have a working central dialog system. This project does. "The framework version wins" is a rule for choosing between two working
implementations; it is not a reason to migrate onto a stub.

## The two implementations

### This project — `src/composables/general/useDialog.ts` (+ `DialogHost.vue`, `DialogEntryRenderer.vue`)

Working, in production, 48 call sites. Shape:

- `openDialog<TResult, TProps>({ component, componentProps, dialogProps })` → `Promise<TResult | null>`
- `confirm({ title, text, confirmBtnLabel, confirmBtnColor })` → `Promise<boolean>`
- `useDialogApi<T>()` — injected via `DIALOG_API_KEY` into the opened component, giving it
  `close(result)`, `onConfirm(handler)`, `setLoading(bool)`, `setDialogProps(patch)`
- A `shallowRef` **stack** (dialogs nest), `markRaw`'d components, per-entry `resolved` guard so a Promise settles exactly once, and a 300 ms close-animation delay
  before the entry is unmounted
- `DialogProps` covers header/footer/close/confirm button config, `persistent`, `eager`, `loading`,
  `isSmall`

### The framework — `_common/composable/CentralDialogComposable.ts`

A `DialogManager` class over a `reactive(Map)`, with `openDialog`/`closeDialog`/`closeAllDialogs`
and `useConfirmDialog`/`useAlertDialog` wrappers returning `DialogResult<T>` (`{ action: 'closed' }`). Types live in `_common/dto/dto/DialogConfig.ts`. No stack
semantics, no injected per-dialog API, no loading control, no renderer.

## What to do

**Upstream this project's implementation into the framework, and delete the stub.** Concretely:

1. In the **framework repo** (`https://github.com/sydowwe/vue_framework.git` — mounted at
   `src/_common` in both projects; never edit it from inside a consuming project):
    - Add `composable/general/useDialog.ts` — this project's implementation, unchanged in behaviour.
    - Add `component/dialog/DialogHost.vue` and `component/dialog/DialogEntryRenderer.vue`.
    - Delete `composable/CentralDialogComposable.ts`. Check whether
      `dto/dto/DialogConfig.ts` has any other consumer before deleting it too.
    - If `useConfirmDialog` / `useAlertDialog` are worth keeping as ergonomics, reimplement them as thin wrappers over `openDialog` so there is still exactly one
      mechanism.
2. Bump the submodule pointer in **both** projects.
3. In **this** project: delete `src/composables/general/useDialog.ts` and
   `src/components/general/dialogs/{DialogHost,DialogEntryRenderer}.vue`, then repoint the 48 call sites at `@/_common/composable/general/useDialog.ts`. Mount
   `DialogHost` from
   `@/_common/component/dialog/DialogHost.vue` in `App.vue`.
4. In **MDF**: nothing to migrate — it had no working dialog system to begin with. It simply gains one.

## Constraints

- Behaviour must not change in this project. This is a relocation, not a redesign: same stack semantics, same `DIALOG_API_KEY` injection contract, same 300 ms close
  delay, same settle-once guard. Every one of the 48 call sites keeps working with only its import path edited.
- Follow the framework's own conventions when placing the files — `composable/general/` for the composable, `component/dialog/` for the components, matching how
  `_common` is already organised.
- `npx vue-tsc --noEmit` and `npm run lint` clean after each of steps 1 and 3.
- Verify a nested dialog (dialog opened from inside a dialog) still works before calling it done — that's the capability the framework's Map-based manager lacked,
  and it's the thing most likely to regress in the move.

## If you disagree with the recommendation

The alternative is to keep this project's dialog system app-local forever (under the owning module, never in `_common`) and leave the framework's stub in place. That
is acceptable but leaves dead code in the framework and a capability the other project can't reach. Say so explicitly rather than silently forking.
