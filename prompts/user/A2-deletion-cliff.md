# A2 · Account deletion is one dialog away, with no idea what is lost

- **Scope:** `src/core/user/component/settings/`
- **Backend:** likely — a "what am I about to lose" summary needs counts
- **Framework:** yes — the delete button and its flow are framework-owned; you write the ask
- **Model / effort:** Sonnet 5, medium effort
- **Depends on:** U2 (the section shell and app locale file), U3 (export behaviour you will reference).

---

```
THE FLOW TODAY

`_common/modules/user/component/settings/SecuritySection.vue:67-72` renders a red "delete account"
button at the bottom of a list that also contains "change password". Clicking it calls
`deleteAccount()` (line 136) → `openVerifyDialog('/user/delete-account', onDeleted)` → a
`VerifyUserForm` asking for identity confirmation → on success, `logout()` and a redirect to
registration (lines 152-155).

So the user is asked to prove who they are. They are never asked whether they meant it, never told
what will be destroyed, and never offered the export button that sits two cards below on the same
page. Identity verification is not consent — it answers "are you you", not "do you understand what
happens next".

Two things make this worse in THIS app specifically:
  - the data is not reconstructable. Activity history and tracked time are a record of the past; a
    todo list can be retyped, six months of history cannot.
  - the app already has a full JSON export (`DataExportSection.vue`, `GET /user/data-export`). The
    remedy exists and is not offered at the moment it matters.

THE CONSTRAINT

The button, the dialog and the whole flow are in `src/_common`, which you must not edit. You cannot
insert a step into the framework's sequence. Work with what the app owns: the `#append` slot of
`UserSettingsView`, which is where `DataExportSection` and `AboutSection` already render.

WHAT TO BUILD

A `DangerZoneSection.vue` in `src/core/user/component/settings/`, rendered from
`src/core/user/view/UserSettingsView.vue`'s `#append` slot, last. It is the app's answer to a
framework flow it cannot modify, and it should:

  - state plainly what deleting the account destroys, in terms of THIS app — name the actual things
    (activity history, tracked time, plans and templates, todo lists, leisure entries, the linked
    Google Calendar). Read `src/core/*/` to get the list right rather than guessing at it;
  - say what is NOT recoverable and that the operation cannot be undone;
  - offer the export as the recommended first step, wired to the same `exportData()` the export card
    uses — extract that call into `src/core/user/composable/useDataExport.ts` so both cards share one
    implementation rather than two copies of the blob handling (U3 will have already cleaned that
    code up; reuse its result);
  - point at the framework's delete button rather than duplicating it. Do NOT add a second button
    that calls `/user/delete-account` — two ways to delete an account is strictly worse than one in
    the wrong place. An anchor to the security card, or plain text naming the button, is enough.

Design it to read as a warning without shouting: `variant="outlined"` with `color="error"` per the
project's colour-by-variant rule, not a wall of red. It is the last card on a settings page, not a
modal.

COUNTS, IF THEY ARE CHEAP

"You will lose 1,240 tracked sessions and 8 months of history" is a categorically better warning than
a list of nouns. Check whether the app can already produce those numbers from endpoints it calls
today — the history dashboard and activity-history modules aggregate exactly this kind of thing, and
you may import from another module's `api/` (that is the one cross-module import the rules allow).

If the counts require several requests fired on the settings page just in case someone reads this
card, do not do it — that is a real cost for a card almost nobody opens. Load them lazily behind a
disclosure, or skip them and write the ask: `prompts/user/backend/B<n>-account-summary.md`, per
`prompts/user/backend/README.md`, for a single small summary the card can request on demand. State
which counts, why each one, and that it is cold-path so it need not be fast.

THEN WRITE THE FRAMEWORK ASK

The real fix is that the framework's delete flow should confirm intent, not just identity, and should
let the host app contribute the consequence text. Write
`prompts/user/framework/F<n>-delete-account-consent.md` per `prompts/user/framework/README.md` and
add the `migration-revision.md` entry. Ask for the smallest thing that works — a slot or a prop on
the delete path where the app supplies its own warning body, and an intent confirmation ahead of the
identity step — and name the local `DangerZoneSection` as the workaround that gets deleted when it
lands. Do not ask for the whole flow to be redesigned.

Run `npm run type-check` and `npm run lint`. Verify the card renders last, the export works from it,
and that you have added no second path to account deletion (grep your diff for `delete-account`).
```
