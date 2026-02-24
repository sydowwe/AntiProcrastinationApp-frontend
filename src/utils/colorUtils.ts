/**
 * Lightens an HSL colour by a specified amount
 * @param hslColor - HSL colour string (e.g., "hsl(200, 60%, 45%)")
 * @param amount - Amount to lighten (0-1, where 1 is maximum lightening)
 * @returns Lightened HSL colour string
 */
export function lightenColor(hslColor: string, amount: number): string {
	const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
	if (!match) return hslColor

	const h = parseInt(match[1] ?? '')
	const s = parseInt(match[2] ?? '')
	const l = parseInt(match[3] ?? '')

	const newL = Math.min(95, l + (100 - l) * amount)

	return `hsl(${h}, ${s}%, ${newL}%)`
}

/**
 * Returns an HSLA colour with the given opacity
 * @param hslColor - HSL colour string (e.g., "hsl(200, 60%, 45%)")
 * @param opacity - Opacity value (0-1)
 * @returns HSLA colour string
 */
export function withOpacity(hslColor: string, opacity: number): string {
	const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
	if (!match) return hslColor

	const h = parseInt(match[1] ?? '')
	const s = parseInt(match[2] ?? '')
	const l = parseInt(match[3] ?? '')

	return `hsla(${h}, ${s}%, ${l}%, ${opacity})`
}