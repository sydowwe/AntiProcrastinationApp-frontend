# B1 · `Content-Disposition` on the data export — **ANSWERED AND LANDED**

**Status:** backend shipped, frontend shipped. Kept for the answers in §4, which `A2` and `U5` reuse.

## What was wrong

`GET /user/data-export` did set `Content-Disposition: attachment; filename="..."`, but the header
never reached the browser: the CORS policy in `Program.cs` used `AllowAnyHeader()` (which governs
*request* headers) and never emitted `Access-Control-Expose-Headers`. Reading a response header from
JS cross-origin requires the expose header, so `response.headers['content-disposition']` was
`undefined` on every download. `useUserApi().exportData()` discarded response headers anyway, so the
frontend always used its own hardcoded name.

Two independent bugs stacked, and the integration suite caught neither — `WebApplicationFactory`
sends no `Origin`, so no test in the suite exercised the CORS middleware at all.

This also silently affected the Reminders and Scheduler exports, which read the same header via
`ReminderDashboardApi.ts`'s `filenameFromContentDisposition()` and had been falling back for as long
as they have existed.

## What the backend changed

1. `Program.cs` — `.WithExposedHeaders("Content-Disposition")` on the `AllowFrontend` policy. This
   was the actual blocker; everything else is polish.
2. `GetUserDataExportEndpoint.cs`
   - the filename date goes through `WallClockZone.FromUtc(…, user.Timezone)` rather than
     `DateTime.UtcNow`, so it matches what the client computes in the user's zone (they disagreed
     near midnight);
   - `exportedAt` is a `DateTimeOffset` carrying the account's offset instead of a bare UTC
     `DateTime` — same instant, self-describing, consistent with the `preferences.timezone` field
     beside it;
   - the hand-rolled header write was replaced with `Send.BytesAsync(bytes, filename, contentType)`,
     the path the Reminders and Scheduler exports already take.
3. Two guard tests: `Export_ExposesContentDispositionToTheBrowser` (sends a real cross-origin
   `Origin`) and `Export_StampsFilenameAndPayloadInTheAccountsOwnZone` (caller in `Pacific/Kiritimati`,
   +14 with no DST, so the assertion is deterministic at every hour).

The server-suggested name is `antiprocrastination-export-<YYYY-MM-DD>.json`, plain `filename=` form.
No RFC 5987 `filename*=` — the name is ASCII by construction. That changes if the name ever picks up
a user-supplied string.

## What the frontend changed

- `_common/modules/user/api/userApi.ts` — `exportData(fallbackFileName?)` now returns
  `{ blob, fileName }`, reading the header through `filenameFromContentDisposition()` exactly as
  `ReminderDashboardApi.ts` does. Framework change; documented in `_common/docs/modules/user.md`.
- `DataExportSection.vue` passes `antiprocrastination-export-${isoDateInUserZone()}.json` as the
  fallback rather than as the name. It now agrees with the server instead of drifting by a day.

## 4. What the export actually contains — reused by A2 and U5

**It is not "all your data".** Nine entities, hand-picked: `PlannerTask`, `TodoList`, `TodoListItem`,
`RoutineTodoList`, `TaskPlannerDayTemplate`, `Calendar`, `ActivityHistory`,
`WebExtensionActivityEntry`, `DesktopActivityEntry` — plus the account's e-mail, creation date and
preferences.

Each is projected to a thin subset rather than the full row: `todoListItems` carries only
`{ id, name, createdTimestamp }`; `webTracking` / `desktopTracking` carry only
`{ id, createdTimestamp }` — **the tracked domains and process names themselves are not exported.**
Lookups (activity categories, priorities, planner settings) are not included either, so the file is
readable but **not self-contained** — it references ids it does not define.

The gaps are enumerated and test-enforced: a `KnownGaps` ledger of 26 user-scoped entities, with
`Export_EveryUserScopedEntityIsEitherExportedOrARecordedGap` failing the build when a new user-scoped
entity is added without a decision. The entries flagged as genuine Art. 15 gaps: `TimerPreset`,
`PomodoroTimerPreset`, `Reminder`, `RepeatingPlannerTask`, `TemplatePlannerTask`, `MemoryAnchor`,
`AndroidSessionData`, the two tracker pattern-mapping tables, and `LeisureSuggestionRecord`.

**Copy rules that follow from this:**

- **U5 / privacy policy:** do not write "all your data" or "a complete copy". It is a partial export
  by id-reference.
- **A2 / deletion warning:** account deletion is a hard delete and reaches *materially more* than the
  export returns — `DeleteAccount_ErasesUserDataAcrossEverySlice` pins erasure across every slice
  including lookups, and the `ISubjectDataEraser` fan-out reaches FK-free module rows (reminder
  recipients, notification quiet hours). So **"export first, then delete" does not preserve
  everything that is about to be destroyed.** The warning must say so rather than implying the export
  is a safety net.

## Still open — not a frontend question

Ten `KnownGaps` entries are user-authored content that arguably belongs in an Art. 15 export
(`TimerPreset`, `Reminder`, `MemoryAnchor`, …). Whether to close them is a product/legal call, and it
feeds the `A2` and `U5` copy above.
