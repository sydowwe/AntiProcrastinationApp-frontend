import { Time } from '@/utils/Time.ts'

/**
 * Formats seconds into human-readable duration string
 * @param seconds - Number of seconds to format
 * @returns Formatted string like "5h 32m" or "45m" or "0m"
 */
export function formatDuration(seconds: number): string {
	const time = Time.fromSeconds(seconds)
	return time.getNice || '0m'
}

/**
 * Formats seconds into detailed duration string with seconds
 * @param seconds - Number of seconds to format
 * @returns Formatted string like "5h 32m 15s"
 */
export function formatDurationDetailed(seconds: number): string {
	const hours = Math.floor(seconds / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)
	const secs = Math.floor(seconds % 60)

	const parts: string[] = []
	if (hours > 0) parts.push(`${hours}h`)
	if (minutes > 0) parts.push(`${minutes}m`)
	if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

	return parts.join(' ')
}
