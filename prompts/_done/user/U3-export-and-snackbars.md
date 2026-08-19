# U3 · Data export reinvents a framework util, and errors double up

- **Scope:** `../../../src/core/user/component/settings/DataExportSection.vue`, `PreferencesSection.vue`
- **Backend:** maybe — one contract question about `Content-Disposition`, see below
- **Framework:** none
- **Model / effort:** Sonnet 5, low effort
- **Independent.** Touches two small files nothing else in the series edits.

---

```
Two unrelated small fixes in the same two files.

1. USE THE DOWNLOAD UTIL THAT ALREADY EXISTS.

`DataExportSection.vue:29-45` hand-rolls a blob download:

    const blob = await exportData()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `antiprocrastination-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)

`@/_common/utils/fileDownload.ts` exports `downloadBlob(blob, fileName)` which does the same thing
correctly — it appends the anchor to `document.body` before clicking and removes it after, which the
local copy skips. Five framework call sites already use it (`ReminderUpcomingView.vue:202`,
`SchedulerJobsView.vue:182`, `JobRunHistory.vue:171`, and two more). Use it here.

The filename is the more interesting half. The local code invents
`antiprocrastination-export-YYYY-MM-DD.json` client-side and throws away whatever the server said.
The same util file exports `filenameFromContentDisposition(header, fallback)` for exactly this, and
`_common/modules/reminders/api/ReminderDashboardApi.ts` shows the pattern: the API function reads the
header off the response and returns the name alongside the blob.

But `useUserApi().exportData()` (`_common/modules/user/api/userApi.ts:19-22`) returns a bare `Blob`
and discards the response headers, and it is framework code you must not edit. So:
  - keep calling `exportData()`;
  - keep the invented filename as the fallback, unchanged, so behaviour does not regress;
  - do NOT add an app-local axios call to work around it.

Then check whether `/user/data-export` even sends a `Content-Disposition`. If you cannot determine
that from this repo (you cannot — the .NET solution is not here), that is a genuine contract question:
write it to `prompts/user/backend/B<n>-export-filename.md` per `prompts/user/backend/README.md`,
asking what the endpoint sets and what the export actually contains. Keep it to one short ask; if the
answer is "it sets a sensible one", the follow-up is a framework ask to have `exportData()` return it,
which you should mention but not write.

While you are in the file: the export button has no disabled/loading state of its own — it relies on
`showFullScreenLoading()`. That is fine, leave it. Do not add a second spinner.

2. STOP SHOWING TWO SNACKBARS FOR ONE FAILURE.

`PreferencesSection.vue:32-34`:

    } catch (e: any) {
        handleHttpCodes(e.response?.status)
    }

The axios interceptor already raises an error snackbar for a failed request. `src/App.vue:77` states
this outright — "Failures already surface as a snackbar from the axios interceptor" — and that is why
the theme watcher two lines below it uses a bare `.catch(() => {})`.

Confirm it first: read the response interceptor in `@/_common/axiosConfig.ts` and check whether it
snackbars unconditionally or only when `_silent` is absent. Then:
  - if it does snackbar by default, drop the `handleHttpCodes` call here and let the interceptor own
    the message. Keep the catch (so the promise does not reject unhandled) and add the one-line
    comment saying why it is empty, matching App.vue's;
  - if it does not, leave it and say so in your summary.

Either way, verify the switch reverts visually when the save fails — `setPreferences` only assigns to
the store after the request resolves, and the switch is bound with `:modelValue` + an explicit
`@update:modelValue`, so it should snap back. Confirm it does with the network tab set to offline;
if it sticks in the wrong position, that is a real bug and fixing it is in scope.

Do NOT touch the same pattern in `_common/modules/user/component/settings/AppearanceSection.vue`
(lines 74, 84, 92) or `SessionsSection.vue` (112, 125, 139) — same defect, framework file, and the
framework ask for it is not worth a turn on its own. Note it in your summary as an observation.

Run `npm run type-check` and `npm run lint`. Verify the export still downloads a file with a sane
name.
```
