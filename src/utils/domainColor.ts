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
