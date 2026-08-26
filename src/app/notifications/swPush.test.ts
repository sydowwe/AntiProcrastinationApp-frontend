import { beforeEach, describe, expect, it, vi } from 'vitest'

/*
 * `public/sw-push.js` is invisible to every other check in this repo: eslint ignores `public/**`,
 * it is plain JS so vue-tsc never sees it, and `vite build` only proves it parses. Everything below
 * therefore drives the REAL file — loaded the way workbox's importScripts loads it, against a
 * stubbed `self` — rather than a copy of its logic.
 *
 * The click-target rules are the reason this exists. The old test was `client.url.includes(url)`
 * against a `url` that defaults to '/', which matches EVERY open tab, so the first client in the
 * list was raised and the user was left wherever they already were.
 */

interface StubClient {
	url: string
	focus: ReturnType<typeof vi.fn>
	navigate?: ReturnType<typeof vi.fn>
	postMessage: ReturnType<typeof vi.fn>
}

/*
 * `vi.hoisted` runs BEFORE the imports below, and it has to: `sw-push.js` calls
 * `self.addEventListener` at load time, while ES imports are hoisted above ordinary statements — so
 * a plain assignment here would run too late and the worker would load against no `self` at all.
 *
 * The worker script itself holds no mutable state (listeners plus function declarations), so it is
 * imported ONCE and every test drives the same handlers through this stub, mutating it in place.
 */
const sw = vi.hoisted(() => {
	const origin = 'https://app.test'
	const listeners: Record<string, (event: any) => void> = {}
	const state: { clientList: StubClient[] } = { clientList: [] }
	const openWindow = vi.fn<(url: string) => Promise<unknown>>()
	const getSubscription = vi.fn<() => Promise<unknown>>()
	const subscribe = vi.fn<(options: unknown) => Promise<unknown>>()

	;(globalThis as { self?: unknown }).self = {
		addEventListener(type: string, handler: (event: any) => void) {
			listeners[type] = handler
		},
		location: { origin },
		registration: {
			showNotification: vi.fn(),
			pushManager: { getSubscription, subscribe },
		},
		clients: {
			// Read at call time, so a test can set the tab list after the worker has been loaded.
			matchAll: () => Promise.resolve(state.clientList),
			openWindow,
		},
	}

	return { origin, listeners, state, openWindow, getSubscription, subscribe }
})

// The order workbox gives the worker: the shared kind -> path map defines the globals `sw-push.js`
// resolves clicks through, so vite.config.ts lists it first. Side-effect imports, exactly as the
// <script> tag in index.html and the worker's importScripts do it.
import '../../../public/notification-subject-routes.js'
import '../../../public/sw-push.js'

const { origin: ORIGIN, listeners, state, openWindow, getSubscription, subscribe } = sw

/** A window client. `canNavigate: false` models a tab this worker does not control. */
function makeClient(url: string, { canNavigate = true }: { canNavigate?: boolean } = {}): StubClient {
	const client: StubClient = {
		url,
		focus: vi.fn(() => Promise.resolve(client)),
		postMessage: vi.fn(),
	}
	if (canNavigate) {
		client.navigate = vi.fn((target: string) => {
			client.url = target
			return Promise.resolve(client)
		})
	}
	return client
}

/** Collects `waitUntil` promises so a test can await the handler's real work. */
function makeEvent<T extends object>(props: T) {
	const pending: Promise<unknown>[] = []
	return {
		...props,
		waitUntil(promise: Promise<unknown>) {
			pending.push(promise)
		},
		settled() {
			return Promise.all(pending)
		},
	}
}

async function dispatch(type: string, event: { settled(): Promise<unknown> }) {
	listeners[type]!(event)
	await event.settled()
}

function clickEvent(data: unknown) {
	return makeEvent({ notification: { data, close: vi.fn() } })
}

function openTabs(...clients: StubClient[]) {
	state.clientList = clients
}

beforeEach(() => {
	state.clientList = []
	openWindow.mockReset().mockResolvedValue(null)
	getSubscription.mockReset().mockResolvedValue(null)
	subscribe.mockReset().mockResolvedValue({ endpoint: `${ORIGIN}/new-endpoint` })
	vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('notificationclick picks the right tab', () => {
	it('focuses the tab already showing the exact target, and changes nothing', async () => {
		const other = makeClient(`${ORIGIN}/leisure`)
		const exact = makeClient(`${ORIGIN}/routine-todo-list?focus=77`)
		openTabs(other, exact)

		await dispatch('notificationclick', clickEvent({ subject: { kind: 'routinePeriod', id: 77 } }))

		expect(exact.focus).toHaveBeenCalled()
		// Re-navigating would reload the page the user is already reading.
		expect(exact.navigate).not.toHaveBeenCalled()
		// And the first client in the list must not win just for being first — the bug this replaces.
		expect(other.focus).not.toHaveBeenCalled()
		expect(other.navigate).not.toHaveBeenCalled()
		expect(openWindow).not.toHaveBeenCalled()
	})

	it('navigates a tab on the right page but the wrong row', async () => {
		// `?focus=<id>` is the only difference between "the list" and "the list, at this row", so a
		// match on pathname alone must still move the tab or the notification does nothing visible.
		const samePath = makeClient(`${ORIGIN}/routine-todo-list?focus=12`)
		openTabs(samePath)

		await dispatch('notificationclick', clickEvent({ subject: { kind: 'routinePeriod', id: 77 } }))

		expect(samePath.navigate).toHaveBeenCalledWith(`${ORIGIN}/routine-todo-list?focus=77`)
		expect(samePath.focus).toHaveBeenCalled()
		expect(openWindow).not.toHaveBeenCalled()
	})

	it('navigates an unrelated tab rather than merely raising it', async () => {
		const unrelated = makeClient(`${ORIGIN}/leisure`)
		openTabs(unrelated)

		await dispatch('notificationclick', clickEvent({ subject: { kind: 'scheduledJobRun', id: 77 } }))

		expect(unrelated.navigate).toHaveBeenCalledWith(`${ORIGIN}/planovac/behy/77`)
		expect(openWindow).not.toHaveBeenCalled()
	})

	it('opens a window when nothing is open', async () => {
		await dispatch('notificationclick', clickEvent({ subject: { kind: 'plannerTask', id: 91 } }))

		expect(openWindow).toHaveBeenCalledWith(`${ORIGIN}/day-planner/task/91`)
	})

	it('raises a tab but never navigates it when there is no specific destination', async () => {
		// '/' is the resolver saying "nowhere in particular", not "go home". This is the case the old
		// `includes('/')` test hit for every notification without a subject — and the one place where
		// focusing really is the whole correct behaviour.
		const first = makeClient(`${ORIGIN}/day-planner/25-08-2026`)
		const second = makeClient(`${ORIGIN}/leisure`)
		openTabs(first, second)

		await dispatch('notificationclick', clickEvent({ type: 'ReminderDigest' }))

		expect(first.focus).toHaveBeenCalled()
		expect(first.navigate).not.toHaveBeenCalled()
		expect(second.navigate).not.toHaveBeenCalled()
		expect(openWindow).not.toHaveBeenCalled()
	})

	it('opens the root in a new window when there is no destination and no tab', async () => {
		await dispatch('notificationclick', clickEvent({ type: 'ReminderDigest' }))

		expect(openWindow).toHaveBeenCalledWith(`${ORIGIN}/`)
	})

	it('accepts a producer url as either a path or a full URL', async () => {
		// TimerBoundary's url comes from the producer and the server has never said which form it
		// takes. Both must resolve to the same tab.
		const tab = makeClient(`${ORIGIN}/leisure`)
		openTabs(tab)

		await dispatch('notificationclick', clickEvent({ url: '/activity-tracking' }))
		expect(tab.navigate).toHaveBeenCalledWith(`${ORIGIN}/activity-tracking`)

		tab.navigate!.mockClear()
		tab.url = `${ORIGIN}/leisure`
		await dispatch('notificationclick', clickEvent({ url: `${ORIGIN}/activity-tracking` }))
		expect(tab.navigate).toHaveBeenCalledWith(`${ORIGIN}/activity-tracking`)
	})

	it('never navigates one of our tabs off-site', async () => {
		const tab = makeClient(`${ORIGIN}/leisure`)
		openTabs(tab)

		await dispatch('notificationclick', clickEvent({ url: 'https://elsewhere.test/thing' }))

		expect(tab.navigate).not.toHaveBeenCalled()
		expect(openWindow).toHaveBeenCalledWith('https://elsewhere.test/thing')
	})

	it('ignores a tab on another origin when matching', async () => {
		const foreign = makeClient('https://elsewhere.test/planovac/behy/77')
		openTabs(foreign)

		await dispatch('notificationclick', clickEvent({ subject: { kind: 'scheduledJobRun', id: 77 } }))

		expect(foreign.focus).not.toHaveBeenCalled()
		expect(foreign.navigate).not.toHaveBeenCalled()
		expect(openWindow).toHaveBeenCalledWith(`${ORIGIN}/planovac/behy/77`)
	})

	it('falls back to focusing when navigate is unavailable', async () => {
		const noNavigate = makeClient(`${ORIGIN}/leisure`, { canNavigate: false })
		openTabs(noNavigate)

		await dispatch('notificationclick', clickEvent({ subject: { kind: 'scheduledJobRun', id: 77 } }))

		expect(noNavigate.focus).toHaveBeenCalled()
		expect(openWindow).not.toHaveBeenCalled()
	})

	it('falls back to focusing when navigate rejects', async () => {
		const rejects = makeClient(`${ORIGIN}/leisure`)
		rejects.navigate!.mockRejectedValueOnce(new Error('not controlled by this worker'))
		openTabs(rejects)

		await dispatch('notificationclick', clickEvent({ subject: { kind: 'scheduledJobRun', id: 77 } }))

		expect(rejects.focus).toHaveBeenCalled()
		// A duplicate window on top of the tab it failed to move would be the worse failure.
		expect(openWindow).not.toHaveBeenCalled()
	})

	it('closes the notification whatever it decides to do', async () => {
		const event = clickEvent({ subject: { kind: 'scheduledJobRun', id: 77 } })
		await dispatch('notificationclick', event)
		expect(event.notification.close).toHaveBeenCalled()
	})
})

describe('pushsubscriptionchange rebuilds the subscription', () => {
	const OLD_ENDPOINT = 'https://push.test/old'
	const KEY = new Uint8Array([1, 2, 3]).buffer

	function rotationEvent(props: { oldSubscription?: unknown; newSubscription?: unknown } = {}) {
		return makeEvent(props)
	}

	function oldSubscription() {
		return { endpoint: OLD_ENDPOINT, options: { applicationServerKey: KEY } }
	}

	it('re-subscribes with the same application server key', async () => {
		await dispatch('pushsubscriptionchange', rotationEvent({ oldSubscription: oldSubscription() }))

		expect(subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey: KEY })
	})

	it('does not re-subscribe when the browser already handed over a replacement', async () => {
		await dispatch(
			'pushsubscriptionchange',
			rotationEvent({
				oldSubscription: oldSubscription(),
				newSubscription: { endpoint: 'https://push.test/new' },
			}),
		)

		expect(subscribe).not.toHaveBeenCalled()
	})

	it('does not re-subscribe when one is already registered', async () => {
		getSubscription.mockResolvedValue({ endpoint: 'https://push.test/new' })

		await dispatch('pushsubscriptionchange', rotationEvent({ oldSubscription: oldSubscription() }))

		expect(subscribe).not.toHaveBeenCalled()
	})

	it('tells every open client, carrying the endpoint that only this event knows', async () => {
		const a = makeClient(`${ORIGIN}/leisure`)
		const b = makeClient(`${ORIGIN}/day-planner/25-08-2026`)
		openTabs(a, b)

		await dispatch('pushsubscriptionchange', rotationEvent({ oldSubscription: oldSubscription() }))

		const expected = { type: 'push-subscription-changed', oldEndpoint: OLD_ENDPOINT }
		expect(a.postMessage).toHaveBeenCalledWith(expected)
		expect(b.postMessage).toHaveBeenCalledWith(expected)
	})

	it('still wakes the app when it cannot rebuild the subscription itself', async () => {
		// No old subscription means no key to re-subscribe with. The app holds one (from the bundle
		// or from the server), so it must still be told rather than left believing push is healthy.
		const tab = makeClient(`${ORIGIN}/leisure`)
		openTabs(tab)

		await dispatch('pushsubscriptionchange', rotationEvent({}))

		expect(subscribe).not.toHaveBeenCalled()
		expect(tab.postMessage).toHaveBeenCalledWith({ type: 'push-subscription-changed', oldEndpoint: null })
	})

	it('still wakes the app when re-subscribing throws', async () => {
		subscribe.mockRejectedValue(new Error('push service refused'))
		const tab = makeClient(`${ORIGIN}/leisure`)
		openTabs(tab)

		await dispatch('pushsubscriptionchange', rotationEvent({ oldSubscription: oldSubscription() }))

		expect(tab.postMessage).toHaveBeenCalledWith({ type: 'push-subscription-changed', oldEndpoint: OLD_ENDPOINT })
	})
})
