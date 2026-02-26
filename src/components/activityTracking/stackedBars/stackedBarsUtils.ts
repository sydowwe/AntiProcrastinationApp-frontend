export function getRowUnit(windowMinutes: number): number {
	if (windowMinutes <= 90) return 1
	if (windowMinutes <= 360) return 5
	if (windowMinutes <= 1440) return 15
	if (windowMinutes <= 10080) return 60
	return 480
}

export function formatYAxisLabel(minutes: number): string {
	if (minutes < 60) return `${minutes}m`
	if (minutes < 1440) return `${minutes / 60}h`
	if (minutes < 10080) return `${minutes / 1440}d`
	return `${minutes / 10080}w`
}

export function formatWindowMinutes(mins: number): string {
	if (mins >= 10080) return `${mins / 10080}w`
	if (mins >= 1440) return `${mins / 1440}d`
	if (mins >= 60) return `${mins / 60}h`
	return `${mins}m`
}
