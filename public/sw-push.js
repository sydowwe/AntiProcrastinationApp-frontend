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
	payload.url = data.url || '/'

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

self.addEventListener('notificationclick', function (event) {
	event.notification.close()

	var url = (event.notification.data && event.notification.data.url) || '/'

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
