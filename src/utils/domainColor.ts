/**
 * Generates a consistent, accessible colour from a domain string
 * Uses HSL colour space with good saturation and lightness for accessibility
 * Same domain always generates the same colour
 *
 * @param domain - Domain name to generate colour for
 * @returns HSL colour string
 */
export function getDomainColor(domain: string): string {
	// Special case for "Other" grouping
	if (domain === '_other') {
		return '#9e9e9e'
	}

	// Simple string hash function
	let hash = 0
	for (let i = 0; i < domain.length; i++) {
		hash = domain.charCodeAt(i) + ((hash << 5) - hash)
		hash = hash & hash // Convert to 32-bit integer
	}

	// Generate hue from hash (0-360)
	// Avoid red (0-30) and yellow-green (60-90) to reduce colourblind issues
	const baseHue = Math.abs(hash % 360)
	let hue: number

	if (baseHue < 30) {
		hue = baseHue + 180 // Shift red to cyan
	} else if (baseHue >= 60 && baseHue < 90) {
		hue = baseHue + 120 // Shift yellow-green to blue
	} else {
		hue = baseHue
	}

	// Use good saturation (60-70%) and lightness (45-55%) for accessibility
	const saturation = 60 + (Math.abs(hash >> 8) % 11)
	const lightness = 45 + (Math.abs(hash >> 16) % 11)

	return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

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
