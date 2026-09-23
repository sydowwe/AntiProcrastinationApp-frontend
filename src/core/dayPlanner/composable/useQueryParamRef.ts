import { ref, watch, type Ref } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw, type Router } from 'vue-router'

export interface QueryParamRefOptions<T> {
	/** What the bare URL means. It is never written, so the default state keeps a clean URL. */
	defaultValue: T
	/** Decodes one raw query value. Return `undefined` for anything the view cannot use — the default wins. */
	parse: (raw: string) => T | undefined
	/** Encodes a non-default value. Defaults to `String(value)`. */
	serialize?: (value: T) => string
	/**
	 * `false` defers the read until `hydrate()` is called — for a value that is only valid against
	 * something loaded after mount (the split view's two template ids against `templateOptions`).
	 */
	immediate?: boolean
}

export interface QueryParamRef<T> {
	state: Ref<T>
	/** Reads the URL once (validated through `parse`). A no-op after the first call. */
	hydrate: () => void
}

// Writes from several refs in one tick are merged into a single `router.replace`, and each write
// waits for the previous one to settle before reading `currentRoute.query` — otherwise two refs
// hydrated together each spread a stale query and the second wipes the first (the `F1` two-writer race).
let pendingPatch: Record<string, string | undefined> | null = null
let pendingPath: string | null = null
let lastWrite: Promise<void> = Promise.resolve()

function queueQueryPatch(router: Router, patch: Record<string, string | undefined>) {
	if (pendingPatch) {
		Object.assign(pendingPatch, patch)
		return
	}
	pendingPatch = { ...patch }
	pendingPath = router.currentRoute.value.path
	lastWrite = lastWrite.then(async () => {
		const flushed = pendingPatch ?? {}
		const path = pendingPath
		pendingPatch = null
		pendingPath = null
		// The view navigated away in the same tick — its query must not land on the next route.
		if (router.currentRoute.value.path !== path) return
		const query: LocationQueryRaw = { ...router.currentRoute.value.query }
		for (const key in flushed) {
			if (flushed[key] === undefined) delete query[key]
			else query[key] = flushed[key]
		}
		try {
			await router.replace({ query })
		} catch {
			// a duplicated navigation is not a failure for state sync
		}
	})
}

/**
 * One `ref` mirrored into one `?key=` query param, `F42`'s shape for the dayPlanner views: absent
 * when it holds the default, written with `router.replace` (view configuration, not navigation, so
 * the back button is untouched), read once at setup and validated on the way in so a hand-edited
 * `?tab=zzz` lands on the default with no error.
 */
export function useQueryParamRef<T>(key: string, options: QueryParamRefOptions<T>): QueryParamRef<T> {
	const route = useRoute()
	const router = useRouter()
	const { defaultValue, parse, serialize = String, immediate = true } = options

	const state = ref(defaultValue) as Ref<T>
	let hydrated = false

	function hydrate() {
		if (hydrated) return
		hydrated = true
		const raw = route.query[key]
		const first = Array.isArray(raw) ? raw[0] : raw
		if (first === undefined || first === null) return
		const parsed = first === '' ? undefined : parse(first)
		if (parsed === undefined || parsed === defaultValue) {
			// A value the view rejected must not stay in the URL as if it had been applied.
			queueQueryPatch(router, { [key]: undefined })
			return
		}
		state.value = parsed
	}

	watch(state, value => {
		const encoded = value === defaultValue ? undefined : serialize(value)
		// Hydration writes back exactly what it read — skip the no-op navigation.
		if (encoded === route.query[key] || (encoded === undefined && route.query[key] === undefined)) return
		queueQueryPatch(router, { [key]: encoded })
	})

	if (immediate) hydrate()

	return { state, hydrate }
}
