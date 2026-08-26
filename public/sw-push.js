self.addEventListener('push', function (event) {
	if (!event.data) return

	var data = event.data.json()
	var title = data.title || 'AntiProcrastination'
	// The server's own `data` (notification id and type) is carried through and `url` added to it,
	// so notificationclick keeps working and nothing downstream loses the identifiers.
	var payload = {}
	if (data.data) {
		for (var key in data.data) {
			payload[key] = data.data[key]
		}
	}
	// Only when the producer actually supplied one. Writing '/' here would bake the final fallback in
	// at push time, before the click handler has had a chance to resolve `data.subject` — harmless
	// today only because subject is checked first, and a trap the moment that order is edited.
	if (data.url) {
		payload.url = data.url
	}

	var options = {
		body: data.body || '',
		icon: data.icon || '/icons/icon-192x192.png',
		badge: '/icons/icon-48x48.png',
		data: payload,
	}

	// A tagged notification REPLACES an already-shown one with the same tag rather than stacking on
	// it. That is how a timer boundary avoids ringing twice when the tab happened to be open: the
	// page's own alarm shows first with this exact tag (see timerAlarmSchedule.ts) and this push
	// lands on top of it. `renotify` is deliberately left off — replacing must be silent, or the
	// suppression turns into a second buzz.
	//
	// Only set when present. Notification kinds that supply no tag OMIT the key entirely, and an
	// untagged one must not inherit a tag and start replacing somebody else's notification.
	if (data.tag) {
		options.tag = data.tag
	}

	event.waitUntil(self.registration.showNotification(title, options))
})

// WHERE A CLICK GOES — settled by B2, and resolved through the SAME app-owned map the in-app bell
// uses (`notification-subject-routes.js`, imported ahead of this file; see vite.config.ts).
//
//   data.subject  -> the app's kind -> path map
//   else data.url -> present only when the PRODUCER supplied one (TimerBoundary is the only kind
//                    that does; the notifications module has never composed a route and now never will)
//   else '/'
//
// The chain itself lives in that shared file as `resolveNotificationTargetUrl`, not here, so there is
// exactly one implementation and a test can exercise the function the worker actually runs. Both
// deliveries of one server-side event — this push and the SignalR bell — therefore land in the same
// place by construction rather than by two mappings agreeing.
//
// DO NOT add a second kind -> route mapping in this file.
self.addEventListener('notificationclick', function (event) {
	event.notification.close()

	// The map is imported before this script, but a worker that somehow starts without it must still
	// open something rather than throw inside an event handler.
	var url =
		typeof resolveNotificationTargetUrl === 'function'
			? resolveNotificationTargetUrl(event.notification.data)
			: (event.notification.data && event.notification.data.url) || '/'

	event.waitUntil(openNotificationTarget(url))
})

/**
 * Absolute URL for a click target, or null when it does not belong to this app.
 *
 * The shared map yields paths ('/planovac/behy/77'), while a producer-supplied `data.url` may be
 * either a path or a full URL — the server has never written down which, and nothing on this side
 * can make it. Resolving both against the worker's own origin collapses the difference before
 * anything compares them.
 */
function toSameOriginUrl(rawUrl) {
	try {
		var resolved = new URL(rawUrl, self.location.origin)
		return resolved.origin === self.location.origin ? resolved : null
	} catch (e) {
		return null
	}
}

function findEntry(entries, predicate) {
	for (var i = 0; i < entries.length; i++) {
		if (predicate(entries[i])) return entries[i]
	}
	return null
}

function focusEntry(entry) {
	return 'focus' in entry.client ? entry.client.focus() : undefined
}

/**
 * Move an already-open tab to the target, then raise it.
 *
 * `navigate()` is not implemented everywhere and rejects for a client this worker does not control;
 * focusing the tab the user would have landed in is a better failure than opening a duplicate
 * window on top of it.
 */
function navigateEntry(entry, target) {
	if (typeof entry.client.navigate !== 'function') return Promise.resolve(focusEntry(entry))
	return entry.client
		.navigate(target.href)
		.then(function (navigated) {
			var client = navigated || entry.client
			return 'focus' in client ? client.focus() : undefined
		})
		.catch(function () {
			return focusEntry(entry)
		})
}

/**
 * Pick the tab the click should land in.
 *
 * The rule this replaces was `client.url.includes(url)` against a `url` that defaults to '/', which
 * matches EVERY open tab of the app — so the first client in the list was raised and the user was
 * left exactly where they already were, whatever the notification was about.
 */
function openNotificationTarget(rawUrl) {
	var target = toSameOriginUrl(rawUrl)

	// A producer-supplied URL pointing somewhere else entirely. There is nothing of ours to match it
	// against, and navigating one of the user's own tabs off-site would be worse than a new one.
	if (target === null) return self.clients.openWindow(rawUrl)

	return self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(function (clientList) {
		var entries = []
		for (var i = 0; i < clientList.length; i++) {
			var url = toSameOriginUrl(clientList[i].url)
			if (url !== null) entries.push({client: clientList[i], url: url})
		}

		// '/' is the resolver's way of saying "no specific destination", NOT an instruction to go
		// home. Raising whatever the user already had open is the whole of the correct behaviour
		// here; navigating a tab to the home page would throw away what they were doing to show them
		// something they never asked for.
		if (target.pathname === '/' && target.search === '') {
			if (entries.length > 0) return focusEntry(entries[0])
			return self.clients.openWindow(target.href)
		}

		// Already showing exactly this — path AND query, because every deep link this app builds
		// differs from the plain page by `?focus=<id>` (see notification-subject-routes.js). Focus it
		// and change nothing: a re-navigation would reload the page the user is already reading.
		var exact = findEntry(entries, function (entry) {
			return entry.url.pathname === target.pathname && entry.url.search === target.search
		})
		if (exact !== null) return focusEntry(exact)

		// Right page, wrong query — the same list with a different row focused. Navigate, so the row
		// the user actually tapped is the one that ends up focused.
		var samePath = findEntry(entries, function (entry) {
			return entry.url.pathname === target.pathname
		})
		if (samePath !== null) return navigateEntry(samePath, target)

		// Some other page of this app: navigate it rather than merely raising it.
		if (entries.length > 0) return navigateEntry(entries[0], target)

		return self.clients.openWindow(target.href)
	})
}

// ─── SUBSCRIPTION ROTATION ───────────────────────────────────────────────────────────────────────
//
// Browsers replace a push subscription on their own schedule (Chrome does; it also happens after
// certain permission and storage events). The endpoint held server-side is then dead, and without
// this handler nothing ever noticed: push stopped permanently and silently for a user whose settings
// switch still read "on", because that switch is `getSubscription() !== null` and after a rotation
// that returns the NEW subscription.
//
// ── Why this does not call the API itself, which is the interesting part ─────────────────────────
// It is NOT that the worker cannot authenticate. Auth here is cookie-based (`axiosConfig.ts` sets
// `withCredentials` on every request), and cookies ARE attached to a worker's own `fetch` with
// `credentials: 'include'`. Two other things block it:
//
//   1. It does not know where the API is. `VITE_API_URL` is a different origin from the app, and it
//      is substituted at BUNDLE time — this file is copied verbatim from public/ into dist/ and
//      pulled in with importScripts, so nothing in it is ever substituted. There is no build step
//      that could put the URL here.
//   2. The access token may have expired, and the refresh-and-retry flow lives in the axios
//      interceptor, in the app.
//
// So the worker does the one part only it can do — rebuild the subscription while the key of the
// subscription being replaced is still reachable — and hands the registration to a client.
//
// ── What happens when no tab is open ─────────────────────────────────────────────────────────────
// Stated honestly: the new endpoint is not registered at that moment. It is NOT lost, though, and
// this needs no storage of its own — `initPushSupport()` re-registers whatever `getSubscription()`
// returns on every sign-in, and after a rotation that IS the new subscription. `POST
// /push-subscription` is an upsert keyed on the endpoint, so that heals the account on the next app
// start whether or not this handler ever got to run.
//
// The one thing genuinely lost with no tab open is retiring the OLD endpoint, whose value exists
// only inside this event. That leak is bounded server-side rather than permanent: the first delivery
// to a dead endpoint comes back `410 Gone` and the row is pruned then, and an idle subscription is
// purged after 180 days regardless. Persisting it here (IndexedDB, replayed on next boot) would buy
// only the window between the rotation and the next push, at the cost of a store to open, version
// and clean up — not worth it while the server prunes on its own.
self.addEventListener('pushsubscriptionchange', function (event) {
	event.waitUntil(handlePushSubscriptionChange(event))
})

/** Message name the app listens for. Mirrored in `UsePushNotifications.ts` — keep the two in step. */
var PUSH_SUBSCRIPTION_CHANGED = 'push-subscription-changed'

function handlePushSubscriptionChange(event) {
	// The only fact that exists nowhere else: after this event the replaced endpoint is unreachable.
	var oldEndpoint = event.oldSubscription ? event.oldSubscription.endpoint : null

	return resolveRotatedSubscription(event)
		.catch(function (e) {
			// A failed re-subscribe must still wake the app: it holds the VAPID key from the bundle
			// and can try again with more to work with than this worker has.
			console.error('[sw-push] re-subscribe after rotation failed:', e)
			return null
		})
		.then(function () {
			return self.clients.matchAll({type: 'window', includeUncontrolled: true})
		})
		.then(function (clientList) {
			for (var i = 0; i < clientList.length; i++) {
				clientList[i].postMessage({type: PUSH_SUBSCRIPTION_CHANGED, oldEndpoint: oldEndpoint})
			}
		})
}

/**
 * Get this device back to holding a live subscription, without needing the app.
 *
 * Deliberately does not report which branch it took: the client re-reads `getSubscription()` for
 * itself rather than trusting a serialised copy from here, so all this has to guarantee is that a
 * subscription exists by the time the message goes out.
 */
function resolveRotatedSubscription(event) {
	// Some browsers hand the replacement straight to the event. When they do, subscribing again
	// would be wrong rather than merely wasteful.
	if (event.newSubscription) return Promise.resolve(event.newSubscription)

	return self.registration.pushManager.getSubscription().then(function (existing) {
		if (existing !== null) return existing

		// Re-subscribe with the SAME application server key, read off the subscription being
		// replaced because this worker has no other source for it (see the note above on why
		// VITE_VAPID_PUBLIC_KEY cannot reach this file).
		var options = event.oldSubscription ? event.oldSubscription.options : null
		var applicationServerKey = options ? options.applicationServerKey : null
		if (!applicationServerKey) return null

		return self.registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: applicationServerKey,
		})
	})
}
