# F1 · Regenerating 2FA recovery codes throws them away

**Framework ask.** `src/_common` is a submodule; this describes a change to make in the
`vue_framework` repo, not here.

## The gap

`src/_common/modules/user/component/settings/SecuritySection.vue:170-196`:

```ts
function showScratchCode() {
	openVerifyDialog('/user/2fa/recovery-codes/regenerate', onShowScratchCode)
}

function onShowScratchCode(data?: unknown) {
	const codes = data as string[]
	if (!codes?.length) {
		showErrorSnackbar(i18n.t('user.noScratchCodeReceived'))
	}
	// TODO: display recovery codes to user
}
```

A user with 2FA enabled sees a button labelled `user.newScratchCodes`. Pressing it opens the identity
verification dialog, calls `POST /user/2fa/recovery-codes/regenerate`, and — on success — does
nothing at all. No dialog, no list, no snackbar, no copy button.

The success path is silent, so the user cannot even tell it worked.

What actually happened is worse than nothing happening: regeneration **invalidates the previous set**.
The user pressed a button, their old recovery codes stopped working, and the new ones were received
by the browser and discarded. The next time they lose their authenticator they are locked out of the
account, and the action that locked them out looked like it failed.

This is a live bug and it costs a user their account. It is the most severe finding in the whole
`prompts/user/` review.

The error branch is also wrong on its own terms: it snackbars when the array is empty and then falls
through into the same dead end, so an empty response and a full one are indistinguishable to the user.

## Why it cannot be fixed app-side

The button, the handler and the response all live inside `SecuritySection.vue`. The component exposes
one slot, `#integrations` (line 45), rendered above the button group — it carries no data and cannot
observe the regenerate response. There is no emit, no exposed state, no composable behind it. The
app cannot see the codes at all.

Calling `/user/2fa/recovery-codes/regenerate` from an app-local button instead would mean shipping a
second path to an operation that invalidates credentials, next to a framework button that already
does it silently. That is worse than the bug.

## The app-side workaround kept in the meantime

None, and none is possible. Until this lands, the honest option for a consuming app is to hide or
warn about the button, which the framework also does not allow.

## What the framework should expose

Display the codes. The verification dialog already returns them to `onShowScratchCode` — the data is
in hand, it is only discarded.

The smallest change that works:

1. On success, open a dialog listing the returned codes. `_common/component/dialog/MyDialog.vue` and
   `useDialog()` are already imported in this file (lines 87, 100), so no new dependency.
2. That dialog must make the codes retrievable — a copy-all button and a download as plain text.
   `_common/utils/fileDownload.ts` already exports `downloadBlob`.
3. It must state that the previous codes no longer work, and that this list is shown once.
4. Require an explicit acknowledgement to close (a checkbox or a confirm button reading "I have saved
   these"), not a click-outside dismiss. A recovery-code dialog closed by accident reproduces the
   current bug exactly.
5. Fix the empty-response branch to `return` after the snackbar rather than falling through.

Locale keys go in `_locales/user.{sk,en}.ts` alongside `user.newScratchCodes` and
`user.noScratchCodeReceived`, which already exist.

No existing consumer changes behaviour except by gaining the missing dialog, so this needs no opt-in
and no default to preserve.

**Worth checking while in there:** whether the same silence affects the initial 2FA enablement path
(`toggleTwoFactorAuth` → `onToggleTwoFactorAuth`, lines 131-145). That handler updates the flag and
snackbars but never mentions recovery codes either, so a user may be enabling 2FA without ever being
issued a fallback. That is a question about the framework's intended flow, not a claim.

## What gets deleted here when it lands

Nothing — this app has no workaround to remove. The value is entirely in the framework: the
`// TODO` at line 195 goes away, and the button starts doing what its label says.

Add the `migration-revision.md` entry under "Still open" when this ask is filed, and remove it on the
pointer bump.
