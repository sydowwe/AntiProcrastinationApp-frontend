export function getRowUnit(windowMinutes: number): number {
	if (windowMinutes <= 90) return 1
	if (windowMinutes <= 360) return 5
	if (windowMinutes <= 1440) return 15
	if (windowMinutes <= 10080) return 60
	return 480
}

export function getYAxisInterval(displayMinutes: number): number {
	if (displayMinutes <= 15) return 5
	if (displayMinutes <= 20) return 5
	if (displayMinutes <= 30) return 5
	if (displayMinutes <= 60) return 10
	if (displayMinutes <= 180) return 15
	if (displayMinutes <= 300) return 20
	if (displayMinutes <= 480) return 30
	if (displayMinutes <= 960) return 60
	if (displayMinutes <= 1440) return 120
	if (displayMinutes <= 10080) return 1440
	return 4320
}

export function formatYAxisLabel(minutes: number): string {
	if (minutes < 60) return `${minutes}m`
	if (minutes < 1440) {
		const h = Math.floor(minutes / 60)
		const m = minutes % 60
		return m === 0 ? `${h}h` : `${h}h ${m}m`
	}
	if (minutes < 10080) return `${minutes / 1440}d`
	return `${minutes / 10080}w`
}

export function formatWindowMinutes(mins: number): string {
	if (mins >= 10080) return `${mins / 10080}w`
	if (mins >= 1440) return `${mins / 1440}d`
	if (mins >= 60) return `${mins / 60}h`
	return `${mins}m`
}
