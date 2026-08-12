# R11 · New capability — bulk pause / resume / cancel from the register

- **Scope:** `src/_common/modules/reminders/view/ReminderDefinitionsView.vue`, `component/ReminderActionButtons.vue`, `api/ReminderDefinitionApi.ts`, new component(s)
- **Backend:** **yes** — the frontend ships useful without it, but the good version needs a batch endpoint
- **Model / effort:** **Opus 5**, high
- **Depends on:** R5 (this builds directly on the table it rewrites), R1
- **Unblocks:** nothing

---

```
New capability, not a fix. Today every lifecycle action in this module is one reminder at a time.

--- Submodule note, read this first ---

These files live in src/_common, the vue_framework git submodule. CLAUDE.md says never to write to it;
this task is the approved exception. Edit them in place; do not fork into src/ and do not add a
migration-revision.md entry. Leave the work in the submodule's working tree and say so at the end. Commit
and bump the pointer only if asked. ESLint and Prettier IGNORE src/_common — match the surrounding style
by hand (tabs, single quotes, no semicolons, camelCase props, PascalCase tags, defineModel, destructure
defaults). Verify Vuetify props with the `vuetify` MCP.

--- The case for it ---

ReminderDefinitionsView is the reminder registry: every reminder in the system, filterable by owner
module, subject type, kind, status and schedule type. The realistic admin tasks on it are inherently
plural — "pause everything owned by the module we are about to migrate", "cancel the reminders for the
subjects deleted in yesterday's import", "resume everything paused during the maintenance window".

Every one of those is currently N round trips through a per-row icon button, and cancel is N confirmation
dialogs. All five views pass `:showSelect="false"` to BasicTable, so the selection column the table
already supports is switched off everywhere.

--- What to build ---

1. **Selection.** Turn on BasicTable's select column on the register only. Read BasicTable.vue and the
   DataTable under it first — `showSelect` and a `selected` model already exist
   (BasicTable.vue:11-12 forwards both), so this should be wiring, not new machinery. Selection must
   survive sorting, and must clear on a filter change or a page change unless the table's own model
   already defines that behaviour — pick the rule deliberately and comment it, because "I selected 40
   things, filtered, and acted on something I could not see" is the failure mode that makes bulk actions
   dangerous.

2. **An action bar that appears when something is selected**, showing the count and the applicable
   actions. `_common/component/ActionBar.vue` exists — read it before building anything; if it fits, use
   it.

3. **Only offer what applies.** The single-row rules are already stated in ReminderActionButtons.vue:
   pause is offered for Active, resume for Paused, cancel for Active or Paused (line 123 — Cancelled and
   Completed are terminal). A mixed selection therefore needs a rule, and the honest one is: an action is
   offered when it applies to at least one selected row, and the confirmation states exactly how many
   rows it will affect and how many it will skip. Never silently no-op on the skipped ones.

4. **Confirmation proportional to the damage.** Pause and resume are reversible — a count in the button
   and a snackbar afterwards is enough. Cancel is terminal and permanent
   (`reminders.cancel.warningText` already says so). Bulk cancel needs an explicit, hard-to-mis-click
   confirmation that names the count. CancelReminderDialog.vue exists for the single case and takes a
   `reminderKey?: string | null` for display — extend it or write a sibling; do not weaken the single-row
   dialog to serve both.

5. **The api layer.** The three existing functions take one `ReminderKeyRequest` each and return no
   content (ReminderDefinitionApi.ts:31-43). With no batch endpoint, the frontend-only version is N
   parallel requests, and that comes with obligations:
     - Bound the concurrency. Do not fire 400 requests at once.
     - Handle partial failure honestly. Report "27 paused, 3 failed" and say WHICH three; do not show a
       green snackbar because the last one happened to succeed.
     - Show progress for anything slow enough to notice.
     - Leave the table consistent afterwards: refetch rather than patching 27 rows optimistically.
   Build that, because it makes the feature real today. Then write the ask for the batch endpoint —
   partial-failure reporting is exactly the thing a client cannot do well and a server can.

6. **Keyboard and screen-reader support from the start**, not as a later pass: the selection column is
   reachable, the action bar is announced when it appears, and the count is in each button's accessible
   name. (R8 covers the rest of the module; do not ship new inaccessible markup that R8 then has to fix.)

7. New strings go in _locales/reminders.sk.ts in Slovak. Counts need the three-form plural treatment —
   read src/i18n.ts:9 and src/core/todoList/_locales/todoList.sk.ts:38 first; "1 pripomienok" is exactly
   the bug R3 exists to fix, do not add more of it.

--- Scope discipline ---

- **The register only.** Not the upcoming list, not the dispatch history (append-only, nothing to act
  on), not My Reminders (R10's territory, different audience, and bulk-snoozing your own reminders is a
  different feature with different rules).
- Do not add bulk delete. Nothing in this module deletes reminders, and cancel is the terminal action by
  design.
- Do not build a generic bulk-action framework in _common/component/. If a second module ever needs this,
  that is when it gets extracted.

--- Verification ---

npm run type-check — baseline 72 errors, all app-side in src/core; any src/_common error is yours.
npm run lint stays at 0.

Then on /pripomienky/register:
  - Select a few rows: the bar appears with the right count; only applicable actions are offered.
  - Select a mixed Active/Paused/Cancelled set and pause: the confirmation says how many it will affect
    and how many it will skip, and the outcome matches.
  - Bulk pause ~20 rows with the network throttled: progress is visible, the table is correct afterwards,
    and nothing is double-submitted if you click twice.
  - Block one of the requests: the result reports the partial failure and names what failed.
  - Bulk cancel: the confirmation is unmistakable and states the count.
  - Sort, then filter, then check the selection behaves the way you documented.
  - Tab through the whole flow without a mouse.

--- After the frontend work is done: write the backend ask ---

This is one of the two prompts in this directory where a backend ask is expected rather than possible.
Finish and verify the N-request version first, leave a `// TODO(Bn):` at the api site, then write it.

Read prompts/_common/reminders/backend/README.md for the format and scope rules — note especially that this is the
FRAMEWORK's shared reminder service, so an endpoint added here serves every consumer. Write it to
prompts/_common/reminders/backend/Bn-<slug>.md.

The shape is the easy part. Make the ask about the semantics you had to guess at:
  - Is a batch all-or-nothing, or partially applicable? (The client wants partial; say so and say why.)
  - What comes back when 3 of 30 fail — which 3, and why each failed, in a form a UI can render per row?
  - The single endpoints are documented as idempotent server-side (ReminderDefinitionApi.ts:28). Does
    that hold in a batch — is pausing an already-Paused reminder a success, a skip, or a failure?
  - Is there a sane upper bound on batch size, and what happens above it?
  - Does a batch cancel need the same terminal guarantees as a single one if it fails halfway?

Say explicitly what the frontend does today without it, and what gets deleted when it lands.
```
