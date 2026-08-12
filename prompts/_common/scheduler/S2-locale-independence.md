# S2 · Locale independence — the module only speaks Slovak

- **Scope:** `_locales/`, `api/SchedulerApi.ts`, `scheduler.routes.ts`, both detail views, `component/ScheduleDisplay.vue`; plus `src/router.ts`, `src/locales/EN.ts`, `src/app/nav/navItems.ts` app-side
- **Backend:** —
- **Model / effort:** Sonnet 5, medium–high
- **Depends on:** nothing (S1 adds locale keys; if S1 ran first, translate its new keys too)
- **Unblocks:** nothing

---

```
The scheduler module at src/_common/modules/scheduler/ is framework code that ships to more than one
app, but it only speaks Slovak. Four separate symptoms, one root cause.

SUBMODULE RULES — read before editing:
src/_common is the vue_framework repo mounted as a git submodule, and CLAUDE.md says never to write
to it. This task is an explicit, user-approved exception: the scheduler module lives there and
nowhere else. So:
  - Edit the files in src/_common in this working tree. Do NOT fork a file into src/, and do NOT add
    a migration-revision.md entry — that file records gaps you are not allowed to fix, which is the
    opposite of this situation.
  - Leave the work in the submodule's working tree and say so in your final message; the parent repo
    will show a dirty submodule pointer. Commit inside the submodule only if the user asks.
  - ESLint and Prettier ignore src/_common, so `npm run lint` will not check your work. Match the
    surrounding style by hand: tabs, single quotes, no semicolons, tab-indented <script setup>.
  - `npm run type-check` DOES cover src/_common. Baseline is 72 errors, all app-side in src/core;
    _common is clean. Any new error under src/_common is a regression you introduced.

NOTE ON ENCODING before you touch any locale file: your global CLAUDE.md forbids round-tripping file
contents through the shell on this machine (cp1252 double-encoding). Use the Write/Edit tools only.
Slovak diacritics are all over these files — one `Get-Content | Set-Content` and you will corrupt
every one of them, and the build will still pass.

Do these four, in this order.

1. THERE IS NO EN LOCALE AT ALL.
   _locales/ contains scheduler.sk.ts and nothing else. src/locales/SK.ts:13,41 spreads it; EN.ts
   spreads nothing, so an EN user gets raw keys — literally "scheduler.job.jobKey" as a column
   header — across all four views. The `user` module in this same submodule ships user.en.ts
   alongside user.sk.ts, so bilingual locales are the framework convention and this module just
   never got one.
   Write _locales/scheduler.en.ts with full key parity against scheduler.sk.ts (145 lines, ~90 keys).
   Read src/_common/modules/user/_locales/user.en.ts first and match its file shape exactly — the
   `const x = { … }; export default x` pattern, backtick string literals, key order mirroring the SK
   file so the two can be diffed side by side.
   Then register it: import and spread it in src/locales/EN.ts exactly the way SK.ts:13,41 does for
   the SK file. Read the comment at the top of SK.ts before you do — the aggregator spread is
   SHALLOW, so a colliding top-level namespace is replaced wholesale rather than merged. `scheduler`
   is a namespace nothing else defines, which is why the SK spread is safe; verify the same holds in
   EN.ts.
   Translate for an English-speaking OPERATOR, not literally. This is an ops console: "Kľúč obslužnej
   rutiny" is "Handler key", not "Key of the serving routine". Some specifics worth getting right:
     jobKey → Job key ; ownerModule → Owner module ; orphaned → Orphaned ; overdue → Overdue
     Vetoed → Vetoed (it is a Quartz term, keep it) ; Skipped → Skipped
     correlationId → Correlation ID ; payloadSnapshot → Payload snapshot
     scheduler.replay.warningText is the safety copy on a destructive action — translate it carefully
     and keep it just as blunt as the Slovak.

2. "EVERY 1 MINÚT".
   ScheduleDisplay.vue:35 does i18n.t(`scheduler.intervalUnit.${intervalUnit}`, intervalValue) — the
   second argument is vue-i18n's plural count. But scheduler.sk.ts:53-61 defines each unit as a
   single string in the genitive plural ("minút", "hodín", "dní"), with no `|` choice forms. So the
   count is passed and ignored, and every interval renders the 5+ form: "každých 1 minút".
   Fix both locales with real plural forms. Slovak needs three forms (1 / 2-4 / 5+) and the rule
   already exists in this app at src/i18n.ts:9 — read it, and read a message that already uses it
   correctly (src/core/todoList/_locales/todoList.sk.ts:38) before writing yours. English needs two.
   The wrapper message scheduler.schedule.everyInterval ("každých {n} {unit}") also has to agree with
   the unit's number in Slovak — check that "každú 1 minútu" / "každé 2 minúty" / "každých 5 minút"
   all read correctly, and restructure the message if the current split between wrapper and unit
   cannot express that. Getting this right may mean the unit key carries the whole phrase rather than
   just the noun; that is fine, prefer correct Slovak over a tidy key layout.

3. SLOVAK FILENAMES INSIDE THE API LAYER.
   SchedulerApi.ts:45 and :98 hardcode the export fallback filenames `planovac-ulohy.${format}` and
   `planovac-behy.${format}`. These are the names the operator's browser saves when the server does
   not send a Content-Disposition, in a module that mounts in apps with no Slovak in them.
   The api layer has no i18n and should not acquire one — useI18n() is a composable and this is a
   plain async function. So make the fallback name a parameter of exportScheduledJobs /
   exportScheduledJobRuns, and have the two callers (SchedulerJobsView.vue:323,
   JobRunHistory.vue:302) pass a localized name built from a new locale key. Give the key a sensible
   default in both files: SK keeps `planovac-ulohy` / `planovac-behy` so nothing changes for this
   app, EN gets `scheduled-jobs` / `job-runs`.
   Keep filenameFromContentDisposition as the primary source — you are only localizing the fallback.

4. HARDCODED SLOVAK ROUTE PATHS, AND TWO BREADCRUMBS THAT HARDCODE THEM AGAIN.
   scheduler.routes.ts:9,15,22,29 declare /planovac/ulohy, /planovac/behy and /planovac/pozornost.
   That is Slovak in a cross-project framework module. Worse, two places then repeat the path as a
   bare string instead of using the route name:
       SchedulerJobDetailView.vue:202   { title: …, to: '/planovac/ulohy' }
       SchedulerRunDetailView.vue:272-273  '/planovac/ulohy' and `/planovac/ulohy/${jobId}`
   Nothing type-checks those strings, so renaming a path breaks the breadcrumbs silently.
   Two fixes, and BOTH are required:
   a) Make the breadcrumbs route-name-based. Every route here has a name (schedulerJobs,
      schedulerJobDetail) and useSetBreadcrumbExtra's crumb `to` accepts what RouterLink accepts —
      check useBreadcrumbs.ts to confirm the type, and if it only accepts a string, resolve the name
      through router.resolve() rather than concatenating a literal. After this, no path literal
      should appear anywhere in the module except scheduler.routes.ts.
   b) Make the path prefix the host app's decision. Change the module's export from a const array to
      a factory — schedulerRoutes(basePath = '/scheduler') or an options object; pick the shape that
      reads best and matches how other framework modules export routes (read
      src/_common/modules/user/*.routes.ts and reminders' route file before choosing, and follow
      whatever precedent exists rather than inventing a third convention). Route NAMES must not
      change: navItems.ts, breadcrumbs and every RouterLink in the module key off them.
   Then update this app to keep its current URLs exactly: src/router.ts:22,63 must call the factory
   with '/planovac' (or whatever shape you chose) so that /planovac/ulohy still resolves. The three
   nav entries in src/app/nav/navItems.ts:83-84 and the paths in the two breadcrumb fixes above must
   all still land on the same URLs they do today. A user's existing bookmark must not 404 — verify
   this by hand, not by reasoning.
   Note src/router.ts is APP code, not submodule code, so normal rules apply there.

DO NOT, in this prompt:
  - fix the bugs in S1 (if S1 has already run, DO translate whatever keys it added),
  - restructure any component (that is S3/S4),
  - change any request or response shape,
  - rename any route NAME, or change any URL this app currently serves.

--- Verification ---

npm run type-check — must stay at 72 errors, all in src/core. Zero under src/_common.
npm run lint — 0 errors (you touched app-side files, which ARE linted).
Then in the app:
  - Switch the app to EN and walk all four scheduler pages: no raw `scheduler.*` keys anywhere,
    including inside filter chips, dialogs and snackbars. Trigger a job and replay a run to see the
    snackbar and dialog strings.
  - Switch back to SK: nothing changed.
  - Find or create jobs with 1-minute, 3-minute and 10-minute intervals and read the schedule column
    in both locales. "každú 1 minútu", "každé 3 minúty", "každých 10 minút".
  - Export both grids in EN and in SK and check the saved filename.
  - Hit /planovac/ulohy, /planovac/behy/<id>, /planovac/pozornost directly by URL — all still resolve.
  - From a run detail page, click every breadcrumb: each must go where it says.
  - Grep the module for 'planovac' — the only hit should be in this app's src/router.ts, not in
    src/_common.

--- No backend ask is expected from this prompt ---

This is entirely presentation. If you somehow reach a wall that needs the server, read
prompts/_common/scheduler/backend/README.md and follow it — but do not go looking for one.
```
