self.addEventListener('push', function (event) {
	if (!event.data) return

	var data = event.data.json()
	var title = data.title || 'AntiProcrastination'
	var options = {
		body: data.body || '',
		icon: data.icon || '/icons/icon-192x192.png',
		badge: '/icons/icon-48x48.png',
		data: {url: data.url || '/'},
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
