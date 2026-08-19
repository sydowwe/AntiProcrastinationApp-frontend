# B3 · Backend ask — do `firstDayOfWeek` and `askBeforeDelete` survive `PUT /user/preferences` → `POST /user/data`?

**Contract only.** No storage, entity, column, migration or serialization-implementation decisions implied below — only whether two fields the client now writes are
echoed back on the read, and what their server-side defaults are.

## Status of this ask — read first

**Unverified from this side.** `README.md` says not to ask whether a field round-trips until you have *observed* it fail. That observation has not been made: the
.NET solution is not in this repo and no backend was running when `P2` was implemented. This file is written at the user's request, ahead of that check, and it is
scoped accordingly — it asks what the contract **is**
rather than asserting it is broken.

If the round trip already works and the defaults below already agree, the correct answer to this ask is "yes, both, defaults are X and Y" and nothing changes on
either side. That answer is still worth having in writing, because §"The business rules" contains one question the frontend genuinely cannot answer alone (the
server-side default), and one design decision the client has already taken unilaterally (`askBeforeDelete` defaults to `true` client-side regardless of what the
server thinks).

## The problem

This app merges two of its own preference fields into the framework's generic `User` /
`UserPreferencesRequest` DTOs through TypeScript interface merging (`src/core/user/dto/userAugmentation.ts:25-37`):

    firstDayOfWeek?: 0 | 1        // 0 = Sunday, 1 = Monday
    askBeforeDelete?: boolean

The framework does not know these exist. They ride along because `User.fromJson` copies unknown keys through untouched
(`_common/modules/user/dto/response/User.ts:41-43`) and because
`PUT /user/preferences` forwards whatever object it is given (`_common/modules/user/api/userApi.ts:11-13`).

Until `P2` landed (2026-08-18), `firstDayOfWeek` had **no control anywhere in the app** — it was declared, typed and localized, but nothing ever sent it.
`PUT /user/preferences` was therefore never called with it, so whatever the backend holds for it today is whatever the backend defaulted to, and no client has ever
contradicted that value. `P2` added the control (`../../../../src/core/user/component/settings/PreferencesSection.vue`), so the write side is live as of now.
`askBeforeDelete` has had a control for longer, but the same read-side question applies to it and the two are one contract, so they are asked together rather than in
two files.

### Why the obvious client-side check is not conclusive

The naive test — set Sunday, reload, see whether it sticks — is **masked by two layers** and will report a false pass:

1. The auth store persists to `localStorage` (`_common/modules/user/store/authStore.ts:79`), so the whole `currentUser` object, including these two fields, is
   restored from the device before any request is made.
2. `setPreferences` writes optimistically —
   `await updatePreferences(partial); Object.assign(currentUser.value, partial)`
   (`authStore.ts:33-36`) — so the local copy is correct even if the server discarded the field.

Hydration then *replaces* the object wholesale:
`currentUser.value = await fetchUserData()` (`authStore.ts:23`), and this app runs it on every boot (`installFramework({ hydrateOnBoot: true })`, `src/main.ts:36`).
So if `POST /user/data` omits the field, the real symptom is not "the toggle resets on reload" — it is **the toggle rendering Sunday on load and then flipping to
Monday a beat later**, once hydration resolves and the key is gone. A tester who reloads and glances at the page can easily miss it, and a tester on a fresh device
(empty
`localStorage`) sees a plain silent reset instead. Both are the same bug.

The user-visible consequence if the read side does not echo: a user sets Sunday, the server stores it, and every screen that reads the preference still behaves as
Monday — today that is the routine weekly review's week boundary (`core/todoList/composable/useRoutineWeeklyReview.ts:14-28`), and it will be the two calendar views
once `../framework/F5-calendar-week-start.md` lands.

## The business rules

Stated as the frontend currently assumes them, so the backend can confirm or **correct** each. The frontend will follow the server's answer.

1. **Does `POST /user/data` return `firstDayOfWeek` and `askBeforeDelete`?** This is the whole ask. If either is stored but not returned, the client cannot see it
   and will keep overwriting it with its own default the next time the user touches the settings page.

2. **Does `PUT /user/preferences` accept and persist them?** The endpoint takes the framework's generic preference shape (`theme`, `locale`, `timezone`). If unknown
   keys are rejected or silently dropped, the control added by `P2` writes nothing and the snackbar it shows is a lie.

3. **What is the server-side default for `firstDayOfWeek` on an account that has never set it?**
   The client currently assumes **Monday (`1`)** —
   `FIRST_DAY_OF_WEEK_DEFAULT` (`src/core/user/composable/useUserPreferences.ts:25`). That is a guess chosen to match `getISOWeekStart`, not a decision anyone made.
   If the server defaults to Sunday, or derives a default from the account's locale, say so and the client constant changes to agree. Two defaults that disagree
   produce a preference that appears to change by itself.

4. **What is the server-side default for `askBeforeDelete`?** The client assumes **`true`**
   (`ASK_BEFORE_DELETE_DEFAULT`, `useUserPreferences.ts:23`), and this one is **not** negotiable in the same way: absent must mean *ask*, because an unknown
   preference must never be the reason a destructive action skips its confirmation dialog (five delete paths read it). If the server's default is `false`, the client
   will still fall back to `true` for the absent case and we should talk about why they differ, rather than the client silently adopting the riskier value.

5. **Is `firstDayOfWeek` `0 | 1`, or should it be the full `DayOfWeek` range?** The client restricts it to Sunday/Monday deliberately — the settings control renders
   exactly two options — but if the column or contract is already a seven-value day enum, say so, because that changes the frontend type rather than the UI (`P2`
   explicitly declined to widen the control on its own authority).

6. **Are these two fields on the same row/shape as `theme` / `locale` / `timezone`, from the contract's point of view?** Not asking where they are stored — asking
   whether a partial
   `PUT /user/preferences` carrying only `{ firstDayOfWeek }` leaves `theme` and `timezone` untouched. The client sends **partials** everywhere
   (`setPreferences({ firstDayOfWeek: v })`,
   `PreferencesSection.vue`), including from `syncBrowserTimeZone`, which fires
   `updatePreferences({ timezone })` on its own during hydration (`authStore.ts:28-30`). If the endpoint treats a partial as a full replacement, that call already
   clobbers everything else and this is a live bug independent of `P2`.

## The shape the frontend needs

No new endpoint and no new field names. What is needed is that the two keys the client already sends come back on the read:

| Field             | Type                              | Nullability                                                          | Endpoint                                                         | Rendered by                                                                                    |
|-------------------|-----------------------------------|----------------------------------------------------------------------|------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| `firstDayOfWeek`  | `0 \| 1` (0 = Sunday, 1 = Monday) | may be absent for an account that never set it — the client defaults | echoed on `POST /user/data`, accepted on `PUT /user/preferences` | `PreferencesSection.vue`'s `VBtnToggle`; consumed by `useRoutineWeeklyReview.ts`               |
| `askBeforeDelete` | `boolean`                         | same                                                                 | same                                                             | `PreferencesSection.vue`'s `VSwitch`; consumed by five delete paths via `useUserPreferences()` |

Absent is an acceptable answer for an unset account — the client is built for it and
`useUserPreferences()` owns the defaults in one place. What is not acceptable is *stored but not returned*, which is indistinguishable from *unset* on the client and
is what makes the value appear to revert.

Neither field is hot: both are read once per boot as part of the user record.

## What changes on the frontend once this lands

**If the answer is "yes, both round-trip, defaults are Monday and `true`":** nothing changes. The ask is closed by being answered, and `useUserPreferences.ts`'s two
default constants get a comment saying the server agrees with them rather than that they are a guess.

**If a default differs:** the corresponding constant in `useUserPreferences.ts:23-25` changes to the server's value — one line each, in the one place both are owned.

**If `firstDayOfWeek` turns out to be a seven-value enum:** `userAugmentation.ts:27,34` widens from
`0 | 1` to the framework's `DayOfWeek`, `useDayOfWeekOptions()` stops being filtered down to two in
`PreferencesSection.vue:52-60`, and the control renders all seven with no other change — the composable already returns them.

**If either field is not echoed:** nothing on the frontend can fix it, and no workaround will be added. The control stays exactly as it is — the write side works
regardless — and the preference simply does not survive a session until the read side echoes it.
