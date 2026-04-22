import { Time } from '@/dtos/dto/Time.ts'

function timeReplacer(_key: string, value: unknown): unknown {
	if (value instanceof Time) return { __Time__: true, h: value.hours, m: value.minutes }
	return value
}

function timeReviver(_key: string, value: unknown): unknown {
	if (value !== null && typeof value === 'object' && (value as Record<string, unknown>).__Time__) {
		const t = value as { h: number; m: number }
		return new Time(t.h, t.m)
	}
	return value
}

export function serializeClipboard(clipboard: unknown): string {
	return JSON.stringify(clipboard, timeReplacer)
}

export function deserializeClipboard<T>(json: string): T {
	return JSON.parse(json, timeReviver) as T
}
