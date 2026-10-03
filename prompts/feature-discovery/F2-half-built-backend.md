# F2. Half-built backend capabilities

Read `prompts/feature-discovery/_RULES.md` first. Output: `docs/feature-discovery/F2-half-built-backend.md`.

## The question

What has the server **started but not finished**? Look for schema, enums, services and endpoints that point at a
feature which has no working path end to end. These are the cheapest backend features, because part of the design is
already decided and paid for.

**Notification producers are already audited** in `docs/notification-audit.md`. Read it first, so that you do not redo
it. Its producer table is your dedupe list for anything under notifications, reminders or the scheduler.

## Sweep the backend for these patterns

Work through each project (`.Planning`, `.TodoLists`, `.Routines`, `.History`, `.Tracking`, `.ActivityProfiles`,
`.Core`, and the host `AdhdTimeOrganizer`). Look at `framework/` only where it is wired into this app.

1. **Columns nothing writes.** A property mapped in a `*Configuration.cs` that no command, handler or job ever assigns
   (apart from tests and seeds). Compare against `docs/data-map.md`. That doc tracks the *client's* use of fields; you
   are checking the *server's*.
2. **Enum members nothing produces.** An enum value that the server never assigns. A status like `Archived`, or an
   outcome nobody sets, usually means a state machine was designed and never driven.
3. **Endpoints no client calls, and that are more than CRUD.** `docs/data-map.md` lists some uncalled endpoints (e.g.
   `DomainDetailsResponse`, `SetupTwoFactorForLoginEndpoint`). Look for endpoints that do real computation and that
   nothing uses. Calling an existing endpoint is frontend-only, so the candidate here is the *finished* feature. Say what
   is missing on the server, if anything.
4. **Services or methods with no caller.** Domain logic written and never invoked, or invoked only from tests.
5. **TODO / FIXME / NotImplemented / commented-out code** in non-test code. Each one is a decision someone postponed.
6. **Entities with no lifecycle.** Rows that are created but never closed, expired, archived or cleaned up, where the
   domain clearly implies they should be (for example a period that ends, or a session left open).
7. **Asymmetric features.** A capability that exists in one module and is obviously missing in its sibling, for example
   something the desktop tracker has and the Android tracker lacks, or the planner has and routines lack.

For each hit, decide whether finishing it gives the **user** something. Many hits are dead code; list those under
*Rejected* with one line each. Only the ones that complete a user-visible feature become candidates.

## You may

- Use `git -C C:\Users\jakub\RiderProjects\AdhdTimeOrganizer log -S <symbol>` to see when something was introduced and
  whether its commit message states an intent that was never completed. Quote the commit hash.
- Read `IntegrationTests/`. A test that pins half a feature is strong evidence of intent.

## Output

Follow `_RULES.md` § *Your output file*. Add one field to each candidate's block:
`- **Pattern:** 1–7 from the list above`, so F5 can see which sweep found it.
