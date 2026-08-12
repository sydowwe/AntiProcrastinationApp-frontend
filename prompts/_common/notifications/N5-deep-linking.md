# N5 · A notification about one task should open that task

- **Scope:** `src/_common/modules/notifications/utils/notificationTypeMeta.ts`,
  `dto/NotificationResponse.ts`, `component/NotificationBell.vue`,
  `src/app/notifications/notificationTypeMeta.ts`, `src/_common/bootstrap/installFramework.ts`,
  `src/_common/SETUP.md`
- **Backend:** **yes** — the notification payload carries no subject. Escalation block at the end
- **Model / effort:** Opus 5, high
- **Depends on:** N1 (rewrites `fromJson`)
- **Unblocks:** N6, N7

---

```
IMPORTANT — read this before you start. CLAUDE.md says src/_common is a git submodule that must
never be edited. The repo owner has explicitly authorised editing it for this task. Edit
src/_common/modules/notifications/ in place. Do NOT fork files into src/. At the end, list the files
under src/_common you touched.

Click-through is keyed on the notification TYPE alone, so it can only ever reach a list.

  utils/notificationTypeMeta.ts:28  notificationRoute(type) -> typeMeta[type]?.route
  component/NotificationBell.vue:126-130  onItemClick pushes that route
  src/app/notifications/notificationTypeMeta.ts:9  DeadlineApproaching -> { name: 'myReminders' }

So "Deadline approaching: Finish the tax return" opens the reminders list and leaves the user to find
it. Same for RoutinePeriodEndingSoon -> routineToDoList. The notification knows which entity it is
about; the client is never told.

The evidence that this is a gap and not a decision: public/sw-push.js:10 already reads `data.url` off
the push payload and sw-push.js:19 navigates to it. The SAME server-side event, delivered by push
instead of by the hub, CAN deep-link. Only the in-app path cannot, because NotificationResponse
(dto/NotificationResponse.ts) has six fields — id, type, title, body, createdAt, isRead — and none of
them identifies the subject.

Do this:

1. First, establish the facts. Look at what the server actually sends today: log a raw
   `/notification/mine` response and a raw hub `ReceiveNotification` payload, and compare them
   against the DTO. If there are already fields the DTO drops on the floor — a url, a referenceId, a
   data blob — this whole prompt is a five-line fix and you should say so. Do not skip this step;
   fromJson takes `json: any` and silently discards everything it does not name.

2. Widen the seam. `NotificationTypeMeta.route` is a static RouteLocationRaw
   (utils/notificationTypeMeta.ts:5). Change it so an entry can supply a resolver as well as a
   constant — a `RouteLocationRaw | ((notification) => RouteLocationRaw | undefined)`, or an
   explicitly named second field; pick one and justify it in a comment. `notificationRoute` then
   takes the notification, not just the type string.
   Constraints on this change:
   - It must stay backwards compatible for an app that registers plain constant routes. The
     framework serves other apps and their meta maps must keep working untouched.
   - The unknown-type fallback (no icon entry -> plain bell, no navigation) must survive. A resolver
     that returns undefined must degrade to "no navigation", never to a router error.
   - The map stays app-registered through installFramework's notificationTypeMeta option — do not
     move route knowledge into the framework.

3. Use it in this app. Update src/app/notifications/notificationTypeMeta.ts so the types that are
   about a specific entity resolve to that entity, and the ones that genuinely are not (ReminderDigest,
   ScheduledJobFailed, ScheduledJobOverdue) stay as they are. The existing comment at the top of that
   file explains the ownership rule — keep it accurate.
   IF step 1 showed the server sends nothing to resolve against, wire the seam anyway, leave this
   app's map on constant routes, put a `// TODO(Bn):` in it, and write the backend ask. The seam is
   worth having even before the data arrives; a fake identifier parsed out of the title string is not
   — do not do that.

4. Make the two delivery paths agree. Whatever identifies the subject in-app should be what
   sw-push.js turns into `data.url`. Note the mismatch in a comment in sw-push.js if the server owns
   the mapping, so the next person does not implement it twice. Do not restructure sw-push.js here —
   N8 owns that file.

5. Update SETUP.md §5 and _common/README.md's setNotificationTypeMeta line: they document the map's
   shape and both become wrong the moment you widen it. docs/modules/notifications.md is stale in
   several other ways too; N13 owns that file, so leave it alone.

--- Verification ---

npm run type-check — baseline 72, all app-side in src/core; any src/_common error is a regression.
Pay attention here: widening a public type is exactly the change that breaks other call sites
silently if you make the new field optional in the wrong place.
npm run lint — 0 errors.

Behavioural: a notification whose type has a constant route still navigates exactly as before (this
is the compatibility check — do it first). A notification with a resolver navigates to the specific
entity. A notification of a type absent from the map renders a plain bell and clicking it does
nothing, with no console error.

--- After the frontend work is done: write the backend ask, IF you found one ---

If step 1 showed the notification payload carries no way to identify its subject, write the ask.

The interesting question is NOT "please add a referenceId". It is: who owns the mapping from a
notification to a place in the UI? The server already produces a url for push, which means it holds
an opinion about app routes — that is arguably the wrong side of the boundary for a framework module
serving multiple apps with different route tables. Frame the ask that way: describe both designs
(server sends a url; server sends an opaque subject reference and each app maps it), say which one
the seam you just built prefers and why, and let the backend decide. Include what you found the push
payload actually contains, because that is the existing precedent.

Read prompts/_common/notifications/backend/README.md for the format and scope rules — including the
extra rule about shared endpoints, which matters a lot here: NotificationResponse is framework surface
and another app consumes it, so an added field must be optional and ignorable. Write to
prompts/_common/notifications/backend/Bn-<slug>.md.
```
