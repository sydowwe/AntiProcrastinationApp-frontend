# F6 · Account deletion confirms identity, never intent

> **Resolved 2026-08-18 — see `migration-revision.md` R21.** Landed as the optional
> `deleteAccountWarning` prop on `SecuritySection` / `UserSettingsView` plus a `confirm()` step
> ahead of `openVerifyDialog`. One deviation from the ask below: `DangerZoneSection` was **not**
> shrunk to the export recommendation — it grew the B6 deletion summary in the meantime and is now
> the on-page counterpart to the dialog. Everything under this line is the ask as written.

**Framework ask.** `src/_common` is a submodule; this describes a change to make in the
`vue_framework` repo, not here.

## The gap

`_common/modules/user/component/settings/SecuritySection.vue:67-72` renders the "delete account"
button. Clicking it (`deleteAccount()`, line 137) calls `openVerifyDialog('/user/delete-account',
onDeleted)` (line 133), which opens `VerifyUserForm` — a dialog asking the user to re-prove their
identity (password / 2FA) — and on success deletes the account immediately.

**User-visible consequence:** the only question the user is ever asked is "are you you", never "do
you understand this is permanent and what it destroys". A user who fat-fingers the button and passes
the identity check (autofilled password, active 2FA session) deletes their account with no
intervening "are you sure", and sees no list of what is about to be lost. Every other consequential
delete in the host app (`useDeleteConfirmation.ts`) requires an explicit confirm step for exactly this
reason — this is the one delete in the app that skips it, and it is the least reversible one.

## Why it cannot be fixed app-side

The button, `deleteAccount()`, and the `VerifyUserForm` dialog are all inside `SecuritySection.vue`,
which the host app renders unmodified. There is no slot or prop on the delete path to intercept the
click before `openVerifyDialog` runs, and no seam to inject app-specific warning copy into
`VerifyUserForm` itself, which is generic (used for 2FA toggle and email change too, not just
deletion).

## The app-side workaround kept in the meantime

`src/core/user/component/settings/DangerZoneSection.vue`, rendered last in `UserSettingsView.vue`'s
`#append` slot. It states in the app's own vocabulary what account deletion destroys, says it is
irreversible, offers the data export as a recommended first step, and points at the framework's
existing "Delete account" button by name rather than adding a second delete path. It cannot insert
itself into the delete flow — it can only sit above it on the same page and hope it's read first.

## What the framework should expose

The smallest version: an intent-confirmation step ahead of the identity step, specific to the delete
path only (2FA toggle and email change keep their current one-step flow) — e.g. `deleteAccount()`
calls `confirm({ title, text })` (already available via `useDialog()`) before `openVerifyDialog`, with
the text sourced from a new optional prop on `SecuritySection` (e.g. `deleteAccountWarningSlot` or a
plain `deleteAccountWarning?: string` prop), defaulting to a generic framework-owned sentence when the
host app supplies nothing. That default keeps every other app consuming the framework unaffected.

A further step this ask does not require but is worth naming: letting the host app's warning text
render as a slot rather than a plain string, since `DangerZoneSection`'s list of destroyed data is
richer than a sentence. Whichever is cheaper to build is fine — a prop beats a slot beats a rewrite.

## What gets deleted here when it lands

`DangerZoneSection.vue`'s intro/list/irreversible copy moves into the prop or slot passed to
`SecuritySection`; the card itself likely shrinks to just the export recommendation, or disappears
entirely if the framework's confirm step is judged sufficient on its own. `useDataExport.ts` stays
either way — it is shared with `DataExportSection.vue`.
