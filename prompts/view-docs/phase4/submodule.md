# Phase 4 — framework modules (units 16–19), one session

Run as **Sonnet 5, high effort, clean context, no browser.** Run once units 16–19 have their docs in
`docs/views/_submodule/`. It does not depend on the app extracts or the app reconcile, so it can run in parallel with them.

These are four small units over three framework modules, with no cross-module reads *into* the app. That's why
this session does the extraction and the synthesis in one go, rather than extracting in groups and reconciling
afterwards like the app does.

```
Read prompts/view-docs/phase4/TEMPLATE-extract.md in full and follow its procedure (steps 1–5,
the status vocabulary, the hard constraints). This message changes three things about it.

- Group: `framework` → write docs/data-map/framework.md
- Units: 16 `reminders-user`, 17 `reminders-admin`, 18 `notifications`, 19 `scheduler`.
  Their docs are docs/views/_submodule/<unit>/ (read the template's docs/views/<unit>/ as
  that). If any unit has no usecase.md yet, stop and say which.
- Modules (DTO source): src/_common/modules/reminders/, src/_common/modules/notifications/
  (including reminderPreference/), src/_common/modules/scheduler/. Their DTOs sit under each
  module's dto/ subtree.
- Also read, as app-side glue: src/app/notifications/notificationTypeMeta.ts and
  reminderLabels.ts. They are where this app tells the framework which notification kinds and
  reminder labels it knows.

Change 1: this is a FRAMEWORK map. The modules are generic and other apps mount them, so a field
counts as `spent` if the framework's own views read it. What this app happens to do with it
doesn't decide that. Where the answer is "the app never registers anything that fills this
field", say so in the row's note: that is a gap in this app's wiring, not in the framework.

Change 2: after the template's sections, add these two, still inside docs/data-map/framework.md:

    ## App wiring
    <Every notification kind and reminder label the app registers (notificationTypeMeta,
    reminderLabels), and for each one the route it opens (notificationSubjectRoutes if present).
    Then every kind the framework's DTOs or enums can carry that the app registers NO metadata
    for. Those render generically or not at all. Name which.>

    ## Opportunities (framework)
    <Same cluster format as prompts/view-docs/phase4/reconcile.md step 3 (OP<n>, Source, Data it
    spends, Where it would surface, Needs backend, Size, Value), but prefixed FOP<n>. Tag each
    [framework] or [app wiring]. A [framework] opportunity is an upstream change to
    vue_framework. An [app wiring] one is something this app could register or configure
    without touching the submodule.>

Change 3: do NOT try to judge which APP events should produce a notification. That can't be
answered from the frontend. It belongs to prompts/view-docs/phase4/backend-notification-audit.md,
which runs later with the backend repo and the app's time-bearing fields.

Quartz, not Unix: reminder and scheduler cron expressions have 6–7 fields, seconds first,
1 = Sunday, evaluated in UTC. A 5-field expression is invalid. Don't report Quartz syntax as a
gap.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.

End with the template's report block, headed "Phase 4: framework", plus one line:
App wiring: <n> kinds registered · <n> kinds with no metadata · FOP: <n> ([framework] <n> · [app wiring] <n>)
```
