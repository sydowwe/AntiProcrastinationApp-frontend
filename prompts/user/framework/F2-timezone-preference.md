# F2 · The timezone preference is editable and read by nothing

**Framework ask.** `src/_common` is a submodule; this describes a change to make in the
`vue_framework` repo, not here.

## The gap

`src/_common/modules/user/component/settings/AppearanceSection.vue:29-34` renders a full timezone
autocomplete over `Intl.supportedValuesOf('timeZone')`, saves the choice through
`PUT /user/preferences`, and confirms it with a success snackbar.

`User.timezone` (`dto/response/User.ts:24`, defaulting to `'Europe/Bratislava'`) is then read in
exactly one place in this repository — the autocomplete that sets it:

```
src/_common/modules/user/component/settings/AppearanceSection.vue:30    :modelValue="currentUser.timezone"
```

Grep across `src/` finds no other consumer. Not in `_common/utils/DateTimeHelper.ts`, which is where
every date in both the framework and this app is formatted, and which uses plain `dayjs(...)` — local
browser time throughout. Not in any chart axis, not in any "today" boundary, not in any date sent to
an endpoint.

Its two neighbours in the same card behave correctly, which is what makes this one misleading: theme
is applied by `src/App.vue:51-52` and locale by `App.vue:57`. A user reasonably concludes the third
control in the row works the same way.

The user-visible consequence: someone travelling, or working across a timezone boundary from where
their account was created, sets their timezone, gets a green "preference saved" snackbar, and every
date and time in the app continues to render in browser-local time. There is no error and no clue.
For an app whose entire subject matter is *when* things happened, that is a bad thing to be quietly
wrong about.

Note the contrast with theme: `App.vue:53-56` goes to real trouble to keep a stale localStorage value
from overriding the server-side theme preference. That care is absent here because nothing consumes
the value at all.

## Why it cannot be fixed app-side

The control and the DTO field are both in `src/_common`. A host app could read
`currentUser.timezone` and apply it in its own formatting layer, but every date in the app is
formatted through `_common/utils/DateTimeHelper.ts` and the framework's own components
(`TimeDisplay`, `CalendarGrid`, `MyDateInput`, the scheduler and reminders views), none of which the
app can reach into. Fixing it app-side would mean a parallel formatting layer that the framework's
own components bypass — worse than the bug.

## The app-side workaround kept in the meantime

None. This app formats in browser-local time everywhere, which is correct for the common case (the
user is where they are) and silently wrong for the travelling case.

## What the framework should expose

Either make it real or take it away. Both are acceptable answers and the framework should pick one
deliberately rather than leaving a control that does nothing.

**If timezone is meant to be honoured**, the smallest change that works is a single seam: teach
`_common/utils/DateTimeHelper.ts` to format in a configured zone (dayjs already ships `utc` and
`timezone` plugins; `DateTimeHelper.ts:5,14` shows the extend pattern already in use for `isoWeek`),
and have the framework's bootstrap set that zone from `User.timezone` on hydration, defaulting to the
browser zone so no existing consumer changes behaviour. Every framework component and every app that
formats through the helper then follows automatically, with no call-site edits.

The harder half is a decision, not code, and the framework should state it in
`docs/modules/user.md`: is `timezone` a *display* preference (render server timestamps in this zone)
or an *input* preference (interpret dates the user types as being in this zone)? They are different
features and the second one affects what gets sent to endpoints. Pick one, document it, and say what
the other is not.

**If it is not meant to be honoured**, remove the control from `AppearanceSection` and the field from
`User` / `UserPreferencesRequest`, and say in the module doc that the framework formats in browser
time. A missing setting is honest; a decorative one is not.

Either way, no existing consumer's behaviour should change without opting in.

## What gets deleted here when it lands

Nothing app-side either way — this app has no workaround to remove.

If the "make it real" path is taken, this repo gains correct behaviour for free through
`DateTimeHelper`, and the `prompts/user/` series should revisit whether the day-boundary questions in
`P4` and the history modules' "today" logic need to follow the configured zone rather than the
browser's.

Add the `migration-revision.md` entry under "Still open" when this ask is filed.
