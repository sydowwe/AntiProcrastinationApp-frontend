/*
 * The ONE kind → destination map, and the two resolvers built on it.
 *
 * B2 settled that routes stay app-owned: the server sends an opaque `subject { kind, id }` and never
 * a URL. That mapping must exist exactly once, because the same server-side event is delivered twice
 * — SignalR to an open tab, Web Push to a closed one — and a click on either has to land in the same
 * place. Two copies would drift the moment a route is renamed.
 *
 * Read by BOTH delivery paths:
 *   - the in-app bell — `src/app/notifications/notificationTypeMeta.ts`, via the plain <script> tag
 *     in index.html, which runs before main.ts;
 *   - the service worker — `public/sw-push.js`, via workbox `importScripts` (see vite.config.ts,
 *     which lists this file BEFORE sw-push.js).
 *
 * ── Why a classic script in public/ rather than a module under src/ ──────────────────────────────
 * The service worker is pulled in by URL with `importScripts` and is never bundled, so it cannot
 * import anything from `src/`. A shared file therefore has to be loadable both ways, which means a
 * classic script assigning globals. That also forces PATHS rather than named routes as the common
 * currency: the worker has no router to resolve a route name against.
 *
 * CONSEQUENCE, and the one thing to watch: the paths below are duplicated from the route tables in
 * `src/**\/*.routes.ts` and nothing type-checks the pair. Renaming a route path means editing it
 * here too. `notificationSubjectRoutes.test.ts` asserts each path against the live route table to
 * catch exactly that.
 */

/**
 * `subject.kind` → the path that shows that entity.
 *
 * The vocabulary is server-owned and APPEND-ONLY: it will grow without coordination, so a kind that
 * is absent here is normal, not an error. Both resolvers below degrade to the caller's fallback.
 *
 * Only kinds this app has somewhere to put are listed. The others are deliberately absent — see the
 * table at the bottom of this file for which, and why.
 */
globalThis.NOTIFICATION_SUBJECT_ROUTES = {
	// `/planovac/behy/:id(\d+)` — APP_SCHEDULER_PATHS in src/router.ts. The view already renders a not-found alert
	// when the run is gone, which is what makes a dangling reference safe to link to.
	scheduledJobRun: function (id) {
		return '/planovac/behy/' + id
	},

	// `/day-planner/task/:id(\d+)` — dayPlanner.routes.ts. NOT the day view directly: the planner is
	// addressed by date and a task id alone cannot build that URL, so this path is a redirect that
	// resolves task -> calendar -> date and forwards to `/day-planner/<date>?focus=<id>`. The
	// indirection exists because this map has to stay a synchronous string builder — the service
	// worker resolves push clicks through it with no app, router or API client in scope.
	plannerTask: function (id) {
		return '/day-planner/task/' + id
	},

	// `/routine-todo-list` — todoList.routes.ts, a flat list with no id param, so the period is named
	// as a focus query the view resolves once its groups have loaded. A group the user has hidden is
	// deliberately NOT un-hidden by arriving here; the view says where to find it instead.
	routinePeriod: function (id) {
		return '/routine-todo-list?focus=' + id
	},
}

/**
 * `type` → a query parameter that asks the destination to act on the subject, not just show it.
 * Appended as `<param>=<subject.id>` only when the subject resolved to a path above, because the
 * destination needs that id to act on.
 *
 * The value is the id rather than a flag, so the destination does not depend on `focus`, which it
 * clears on arrival. The destination re-checks against live state before it acts: a notification
 * is a snapshot, and by the time it is clicked the action may already be done or impossible.
 *
 *   RoutinePeriodEnded  A broken streak's summary says a skip could restore it (P1-01 C). The
 *                       routine list opens the skip confirm for that period if a miss is still
 *                       coverable now, and does nothing otherwise. A kept streak lands the same way
 *                       and finds no miss.
 */
globalThis.NOTIFICATION_TYPE_INTENTS = {
	RoutinePeriodEnded: 'offerFreeze',
}

/**
 * One `subject` → a path, or `undefined` when there is nowhere specific to go. With the
 * notification's `type`, the path also carries that type's intent parameter, if it has one.
 *
 * `undefined` covers all four ways that happens, because callers treat them identically: no subject,
 * a malformed one, a kind this app does not know, and a kind it knows but has no destination for.
 */
globalThis.resolveNotificationSubjectPath = function (subject, type) {
	if (!subject || typeof subject !== 'object') return undefined

	var kind = subject.kind
	var id = subject.id
	if (typeof kind !== 'string' || typeof id !== 'number' || !isFinite(id)) return undefined

	var build = globalThis.NOTIFICATION_SUBJECT_ROUTES[kind]
	if (typeof build !== 'function') return undefined

	var path = build(id)
	var intent = typeof type === 'string' ? globalThis.NOTIFICATION_TYPE_INTENTS[type] : undefined
	if (!intent) return path
	return path + (path.indexOf('?') === -1 ? '?' : '&') + intent + '=' + id
}

/**
 * The Web Push click target, i.e. B2's settled fallback chain, in one place:
 *
 *   subject → the app-owned map above
 *   else    → the top-level `url`, which is present ONLY when the producer supplied one
 *             (`TimerBoundary` is the only kind that does, and it always has)
 *   else    → '/'
 *
 * `data` is the nested `data` object off the push document, which is what lands in
 * `notification.data`. Kept here rather than in sw-push.js so the parity test can exercise the exact
 * function the worker runs.
 */
globalThis.resolveNotificationTargetUrl = function (data) {
	if (!data || typeof data !== 'object') return '/'
	return globalThis.resolveNotificationSubjectPath(data.subject, data.type) || data.url || '/'
}

/*
 * ── Kinds with no destination in this app ────────────────────────────────────────────────────────
 *
 * Absent above on purpose. Each falls back to the type-level route the bell already used, which is
 * the same list the user landed on before B2 — no regression, just no improvement yet.
 *
 *   reminder        The id is a Planning-module `Reminder` row (see ReminderRegistrationService —
 *                   `new PersonalReminderPayload(reminder.Id, ...)`), and this frontend has NO such
 *                   entity: no API client, no DTO, no view. The reminders screens it does have belong
 *                   to the framework module and list `ReminderDefinition`s, which is a different id
 *                   space — pointing there would deep-link to the wrong row, not merely to a list.
 *                   `/pripomienky/register/:id` is that definition detail; do not point here.
 *                   Falls back to the reminders list, which is where it already went.
 *   todoListItem    `TodoItemDue` (P1-02). An item has no route of its own: the list view is
 *                   `/todo-list/:id` by LIST id, which the subject does not carry, and it has no
 *                   `?focus=` handling to find the row once there. Giving it one means the same
 *                   shape as `plannerTask` — a `/todo-list/item/:id` redirect that reads the item's
 *                   list, plus focus support in TodoListView. Until then it falls back to the lists.
 *   inventoryItem  Not this app; listed in B2's vocabulary for the other app on this framework.
 *
 * Adding one is a two-line change here plus whatever the destination view needs to focus the row.
 */
