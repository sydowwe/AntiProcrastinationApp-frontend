/**
 * Generates a consistent, accessible color from a domain string
 * Uses HSL color space with good saturation and lightness for accessibility
 * Same domain always generates the same color
 *
 * @param domain - Domain name to generate color for
 * @returns HSL color string
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
	// Avoid red (0-30) and yellow-green (60-90) to reduce colorblind issues
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
 * Lightens an HSL color by a specified amount
 * @param hslColor - HSL color string (e.g., "hsl(200, 60%, 45%)")
 * @param amount - Amount to lighten (0-1, where 1 is maximum lightening)
 * @returns Lightened HSL color string
 */
export function lightenColor(hslColor: string, amount: number): string {
	// Parse HSL color
	const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
	if (!match) return hslColor

	const h = parseInt(match[1])
	const s = parseInt(match[2])
	const l = parseInt(match[3])

	// Increase lightness proportionally
	const newL = Math.min(95, l + (100 - l) * amount)

	return `hsl(${h}, ${s}%, ${newL}%)`
}
