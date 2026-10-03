/**
 * The identity pair every per-source dashboard item carries, under the same two names on all three
 * sources (the server's `IDashboardItem`).
 *
 * `key` is the stable identifier — the domain, the process name, the package name. Selection,
 * `?selected=`, the details lookup and the colour hash all read it, never `label`: several desktop
 * processes ship under one product name, so keying on the display name merged them and opened the
 * wrong detail panel (OP11).
 *
 * `label` is what is printed. The server never sends it blank — it falls back to `key` where the
 * source has no better string.
 *
 * The unified dashboard has no pair: its single `label` is already the joined identity, so it fills
 * both fields with it (see `UnifiedActivityItem`).
 */
export interface DashboardItem {
	key: string
	label: string
}

/**
 * Reads the pair off a per-source wire object. `fallbackKey` is the source's own identifier field —
 * every current response sends `key`/`label`, so it only matters against an older API.
 */
export function readDashboardItem(json: any, fallbackKey: string | undefined): DashboardItem {
	const key: string = json?.key ?? fallbackKey ?? ''
	const label: string = json?.label || key
	return { key, label }
}

/**
 * The label each key should be printed under within one panel. Where two keys share a label, both
 * are suffixed with their key ("Google Chrome (chrome.exe)") — otherwise the two slices or cards the
 * key split produced would sit side by side under one indistinguishable name.
 *
 * Per panel, not global: a name that is unique where it is shown stays as the user knows it.
 */
export function distinctLabels(items: Iterable<DashboardItem>): Map<string, string> {
	const keysByLabel = new Map<string, Set<string>>()
	for (const item of items) {
		const keys = keysByLabel.get(item.label) ?? new Set<string>()
		keys.add(item.key)
		keysByLabel.set(item.label, keys)
	}

	const result = new Map<string, string>()
	for (const [label, keys] of keysByLabel) {
		for (const key of keys) {
			result.set(key, keys.size > 1 && key !== label ? `${label} (${key})` : label)
		}
	}
	return result
}
