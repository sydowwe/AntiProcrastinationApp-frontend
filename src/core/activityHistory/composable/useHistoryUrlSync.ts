import { watch, type WatchSource } from 'vue'
import { useRouter, type LocationQueryRaw } from 'vue-router'

/**
 * State -> URL for the two dashboard views (theme D). Both end with the same watch: whenever any of
 * the state the view asks its questions over changes, replace the query so the current view is
 * linkable without the back button growing an entry per keystroke.
 *
 * The inverse direction stays in the views — they read the query once, at setup, through the pure
 * parsers in `historyUrlParams.ts`.
 */
export function useHistoryUrlSync(sources: WatchSource[], buildQuery: () => LocationQueryRaw) {
	const router = useRouter()

	watch(sources, () => {
		router.replace({ query: buildQuery() })
	})
}
