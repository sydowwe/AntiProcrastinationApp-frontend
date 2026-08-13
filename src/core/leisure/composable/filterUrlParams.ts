// Primitive encode/decode pairs for putting a filter into the query string.
//
// `useTableUrlState` treats an empty string as "delete this param", so every encoder returns '' for
// a value that is absent. That is what keeps `?locationTypeIds=&isOneTime=` out of the URL — an
// absent filter field must be absent from the query, not present and empty.
//
// Every decoder is total: the query string is user-editable, so garbage decodes to `null` (the
// "not filtered" state) rather than reaching the backend.

const LIST_SEPARATOR = ','

export function encodeText(value: string | null): string {
	return value ?? ''
}

export function decodeText(raw: string | undefined): string | null {
	return raw ? raw : null
}

export function encodeNumber(value: number | null): string {
	return value == null ? '' : String(value)
}

// `Number('')` and `Number(' ')` are both 0, so a blank has to be rejected before parsing —
// otherwise `?minRating=` would decode to the perfectly plausible filter "rating ≥ 0".
function parseNumber(raw: string): number | null {
	if (raw.trim() === '') {
		return null
	}
	const parsed = Number(raw)
	return Number.isFinite(parsed) ? parsed : null
}

export function decodeNumber(raw: string | undefined): number | null {
	return raw == null ? null : parseNumber(raw)
}

export function encodeNumberList(value: number[] | null): string {
	return value?.length ? value.join(LIST_SEPARATOR) : ''
}

export function decodeNumberList(raw: string | undefined): number[] | null {
	if (!raw) {
		return null
	}
	const parsed = raw
		.split(LIST_SEPARATOR)
		.map(part => parseNumber(part))
		.filter((value): value is number => value !== null)
	return parsed.length ? parsed : null
}

export function encodeEnumList<T extends string>(value: T[] | null): string {
	return value?.length ? value.join(LIST_SEPARATOR) : ''
}

// Members the enum does not declare are dropped rather than passed through.
export function decodeEnumList<T extends string>(raw: string | undefined, enumObject: Record<string, T>): T[] | null {
	if (!raw) {
		return null
	}
	const allowed = Object.values(enumObject) as string[]
	const parsed = raw.split(LIST_SEPARATOR).filter((value): value is T => allowed.includes(value))
	return parsed.length ? parsed : null
}

// Tri-state boolean: `null` means "not filtered" and must stay out of the URL entirely. Encoding it
// as `false` would silently narrow "any" to "only false" on the next reload.
export function encodeTriState(value: boolean | null): string {
	if (value == null) {
		return ''
	}
	return value ? 'true' : 'false'
}

export function decodeTriState(raw: string | undefined): boolean | null {
	if (raw === 'true') {
		return true
	}
	if (raw === 'false') {
		return false
	}
	return null
}
