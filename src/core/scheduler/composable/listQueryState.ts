import type { LocationQueryValue } from 'vue-router'

type QueryValue = LocationQueryValue | LocationQueryValue[]

// Vue Router exposes a query value as string | null (or an array when repeated). These helpers
// coerce a single raw query value into the typed shape the scheduler list views keep in their refs,
// so filter/sort/page state can round-trip through the URL (CLAUDE.md "URL State" rule).

function firstValue(value: QueryValue): string | null {
	const raw = Array.isArray(value) ? value[0] : value
	return typeof raw === 'string' && raw.length > 0 ? raw : null
}

export function queryString(value: QueryValue): string | null {
	return firstValue(value)
}

export function queryNumber(value: QueryValue, fallback: number): number {
	const raw = firstValue(value)
	if (raw === null) return fallback
	const parsed = Number(raw)
	return Number.isFinite(parsed) ? parsed : fallback
}

export function queryBool(value: QueryValue): boolean {
	return firstValue(value) === 'true'
}

export function queryEnum<T extends string>(value: QueryValue, allowed: readonly T[]): T | null {
	const raw = firstValue(value)
	return raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : null
}

export function queryDate(value: QueryValue): Date | null {
	const raw = firstValue(value)
	if (raw === null) return null
	const date = new Date(raw)
	return Number.isNaN(date.getTime()) ? null : date
}
