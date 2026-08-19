# P1 · The app has two preference systems and two settings pages ⭐

- **Scope:** `../../../src/core/user`, `../../../src/app/nav/navItems.ts`; reads (does not restructure) `core/dayPlanner`
- **Backend:** likely — one contract question about consolidating two preference endpoints
- **Framework:** none
- **Model / effort:** Opus 5, high effort. This is a boundary decision, and the wrong one violates the module rule.
- **Run before P2–P4.** They all add preferences and need to know which system owns them.

---

```
Before adding a single new preference, settle where preferences live. Right now there are two
answers, and neither knows about the other.

SYSTEM ONE — the framework's user preferences.
    endpoint  PUT /user/preferences  (_common/modules/user/api/userApi.ts:11)
    shape     UserPreferencesRequest — theme, locale, timezone
              + this app's askBeforeDelete, firstDayOfWeek merged in by
                src/core/user/dto/userAugmentation.ts
    store     _common/modules/user/store/authStore.ts, id 'user', localStorage
    UI        /user/settings — AppearanceSection (framework) + PreferencesSection (ours, ONE switch)

SYSTEM TWO — the day planner's settings.
    endpoint  core/dayPlanner/api/plannerSettingsApi.ts
    shape     UserPlannerSettingsRequest — remindersEnabled, reminderMinutesBefore,
              detailsPanelExpandedByDefault, arrowKeyNavEnabled, predefinedSkipReasons,
              slotDurationMinutes, defaultApplyTemplateId, defaultConflictResolution,
              defaultApplyPreviewMode
    store     core/dayPlanner/store/dayPlannerSettingsStore.ts, sessionStorage, lazy `loaded` flag
    UI        core/dayPlanner/view/DayPlannerSettingsView.vue — a second, separate settings page

Nine per-user preferences the user cannot find from the page called "settings", and two of the nine
(`remindersEnabled`, `reminderMinutesBefore`) are notification preferences, which is a category the
framework's notifications module also has opinions about.

THE CONSTRAINT THAT DECIDES THIS

CLAUDE.md: "Cross-module imports are allowed only via another module's api/ or dto/. Never reach into
another module's component/, composable/ or store/."

So `src/core/user/` MAY NOT import `useDayPlannerSettingsStore` or render `DayPlannerSettingsView`.
Merging the two pages by import is off the table. Do not do it, and do not propose a shared
`component/` in the framework for it either — the framework has no business knowing this app has a
day planner.

WHAT TO ACTUALLY DO

1. WRITE THE RULE DOWN FIRST, then build to it. Add a short section to CLAUDE.md under the user
   module's paragraph stating which system owns what. The line that holds up:

     - `/user/preferences` owns preferences that cut ACROSS modules or describe the person —
       theme, locale, timezone, first day of week, delete confirmation, day boundary.
     - A module's own settings endpoint owns preferences meaningful only inside that module —
       slot duration, arrow-key nav, template conflict resolution.

   Apply the rule to the nine planner fields and say, per field, which side it lands on. Expect one
   or two to be genuinely cross-cutting (the reminder pair is the candidate) — flag those rather than
   moving them; moving a field is a backend change, not a frontend one.

2. MAKE THE SECOND PAGE REACHABLE FROM THE FIRST. The user settings page should list the app's module
   settings pages as links — planner settings today, others later — under a heading that says what
   they are. This is a `RouterLink` to a named route, which crosses no module boundary. Put it in a
   new section component in `src/core/user/component/settings/`, driven by a small local list of
   `{ routeName, labelKey, icon }` so adding a module is one line, not a component edit. Do not
   import anything from `core/dayPlanner` to build it — a route name is a string.

   Check `src/app/nav/navItems.ts` too: if the planner settings page is not in the sidebar either,
   it is currently reachable only by URL, and that is worth saying in your summary.

3. GIVE THE PLANNER SETTINGS THE SAME TREATMENT IN REVERSE — a link back to /user/settings from
   `DayPlannerSettingsView.vue`, so the two pages form a pair rather than two dead ends. This edits
   a file in another module; that is allowed (it is a route link, not an import), but keep the diff
   to the one link and say so.

4. FIX THE STORAGE MISMATCH YOU WILL NOTICE. `dayPlannerSettingsStore` persists to sessionStorage
   with a `loaded` flag that short-circuits `loadSettings()` (line 24). Server-side preferences cached
   in sessionStorage means a second tab re-fetches while the first serves a stale copy, and a
   preference changed in tab A never reaches tab B. Decide whether that is a real problem here and
   fix it if it is — but do it as a minimal, argued change, and do not restructure the planner
   module. If you conclude it is fine as-is, say why.

THE BACKEND QUESTION

Two endpoints writing per-user preference rows is a shape the backend chose, and the frontend cannot
see whether they are two tables, two columns on one row, or one thing behind two routes. If your
step-1 analysis concludes a field is on the wrong side, that is a contract question, not a
refactor you can do: write it to `prompts/user/backend/B<n>-preference-ownership.md` per
`prompts/user/backend/README.md`. State the rule you applied, list the fields you think are
misplaced and why, and ask the backend to confirm or correct the split. Do NOT propose tables,
columns or a migration.

Only write it if a field actually looks misplaced. "Please confirm the current split is fine" is not
worth a backend turn.

Run `npm run type-check` and `npm run lint`. Verify both settings pages load, the links work in both
directions, and nothing in `core/user` imports from `core/dayPlanner` (grep your own diff).
```
