import { ref, shallowRef } from 'vue'
import type { MappingSuggestion } from '@/core/activityTracking/dto/response/MappingSuggestion.ts'
import { readUserScoped, writeUserScoped } from '@/core/user/composable/useUserScopedStorage.ts'

/**
 * The rule suggestions of one distinct-entries grid (FO9), keyed by the column the suggested exact rule matches, and
 * the user's *Not this* dismissals. Desktop and android each pass their own read and storage key.
 *
 * Read once with the grid's first page (`ensureLoaded`) and again after a rule is created from one (`reload`); a
 * failure only means no chips, so it is swallowed.
 *
 * *Not this* is device-local on purpose, like the settings hint: being asked again on a new device costs a tap,
 * which does not buy an endpoint. Keyed by key and activity, so a different suggestion for the same row still shows.
 */
export function useMappingSuggestions<T extends MappingSuggestion>(
	fetchSuggestions: () => Promise<T[]>,
	dismissedStorageKey: string,
) {
	// Shallow: the map is only ever replaced whole, and a deep ref would unwrap `T` into a different type.
	const suggestions = shallowRef(new Map<string, T>())
	const dismissed = ref<Set<string>>(readDismissed())
	let loaded = false

	function readDismissed(): Set<string> {
		try {
			const stored: unknown = JSON.parse(readUserScoped(dismissedStorageKey) ?? '[]')
			return new Set(Array.isArray(stored) ? stored.filter((k): k is string => typeof k === 'string') : [])
		} catch {
			return new Set()
		}
	}

	function suggestionFor(key: string): T | undefined {
		const suggestion = suggestions.value.get(key)
		return suggestion && !dismissed.value.has(suggestion.dismissalKey) ? suggestion : undefined
	}

	async function reload() {
		try {
			const list = await fetchSuggestions()
			suggestions.value = new Map(list.map(s => [s.key, s]))
		} catch {
			suggestions.value = new Map()
		}
	}

	function ensureLoaded() {
		if (loaded) return
		loaded = true
		void reload()
	}

	function dismiss(suggestion: T) {
		dismissed.value = new Set([...dismissed.value, suggestion.dismissalKey])
		writeUserScoped(dismissedStorageKey, JSON.stringify([...dismissed.value]))
	}

	return { suggestionFor, ensureLoaded, reload, dismiss }
}
