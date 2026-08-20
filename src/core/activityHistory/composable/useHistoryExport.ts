import dayjs from 'dayjs'
import { downloadBlob } from '@/_common/utils/fileDownload.ts'
import { historyGroupKey } from '@/core/historyDashboard/dto/HistoryGroupKey.ts'

/**
 * How many groups an export round asks the pie-chart/summary-cards endpoints for, instead of the `20`
 * (pie chart) / `topN` (summary cards) the on-screen widgets use. Those caps exist to keep a chart
 * readable; a file the user asked to export must not be silently truncated the same way (H8). There is
 * no realistic account with more distinct activities/roles/categories than this in one period.
 */
export const EXPORT_GROUP_LIMIT = 1000

export interface CsvColumn<T> {
	header: string
	value(row: T): string | number | null | undefined
}

function escapeCsvField(value: string | number | null | undefined): string {
	const str = value === null || value === undefined ? '' : String(value)
	if (/["\n\r,]/.test(str)) return `"${str.replace(/"/g, '""')}"`
	return str
}

/** Builds an RFC 4180 CSV body (CRLF line endings) from typed rows — no npm dependency needed for this. */
export function buildCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
	const lines = [columns.map(c => escapeCsvField(c.header)).join(',')]
	for (const row of rows) {
		lines.push(columns.map(c => escapeCsvField(c.value(row))).join(','))
	}
	return lines.join('\r\n')
}

/** Triggers the browser download for a CSV string, BOM-prefixed so Excel reads UTF-8 instead of guessing cp1252. */
export function downloadCsv(csv: string, fileName: string): void {
	const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
	downloadBlob(blob, fileName)
}

/** Local ISO 8601 with the UTC offset — never the display-formatted (`formatToTime`) string. */
export function formatIsoWithOffset(date: Date): string {
	return dayjs(date).format('YYYY-MM-DDTHH:mm:ssZ')
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-+|-+$)/g, '')
}

/** Joins the given parts (dropping empty ones) into `<name>.csv`, so range/groupBy are always visible in the file name. */
export function buildExportFileName(parts: (string | null | undefined)[]): string {
	const slug = parts
		.filter((p): p is string => Boolean(p))
		.map(slugify)
		.join('_')
	return `${slug}.csv`
}

export interface HistoryGroupExportRow {
	groupId: number | null
	name: string
	totalSeconds: number
	entries: number
	/** Null when the group fell outside what the summary-cards round returned, or when the card itself has none (new group / no baseline). */
	percentChange: number | null
}

/**
 * Joins the pie chart's per-group totals/entry counts with the summary cards' percent-change-vs-baseline,
 * keyed the same way the dashboard cross-highlights groups (`HistoryGroupKey`) rather than by name — see
 * that file for why name alone is not a safe key.
 */
export function mergeGroupExportRows(
	pieItems: { groupId: number | null; name: string; totalSeconds: number; entries: number }[],
	cards: { groupId: number | null; name: string; percentChange: number | null }[],
): HistoryGroupExportRow[] {
	const percentByKey = new Map(cards.map(c => [JSON.stringify(historyGroupKey(c)), c.percentChange]))
	return pieItems.map(item => ({
		groupId: item.groupId,
		name: item.name,
		totalSeconds: item.totalSeconds,
		entries: item.entries,
		percentChange: percentByKey.get(JSON.stringify(historyGroupKey(item))) ?? null,
	}))
}
