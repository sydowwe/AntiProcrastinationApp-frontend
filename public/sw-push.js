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

	event.waitUntil(
		self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(function (clientList) {
			for (var i = 0; i < clientList.length; i++) {
				var client = clientList[i]
				if (client.url.includes(url) && 'focus' in client) {
					return client.focus()
				}
			}
			return self.clients.openWindow(url)
		}),
	)
})
