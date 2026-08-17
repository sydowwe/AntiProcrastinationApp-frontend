// Shared by ComfortZoneStepper (input) and BucketListTable (display) — both walk the same 1/3/5 ramp.
export function comfortZoneColor(step: number): string {
	if (step <= 1) return 'success'
	if (step <= 3) return 'warning'
	return 'errorDark'
}
