import {fas} from '@fortawesome/free-solid-svg-icons'
import {far} from '@fortawesome/free-regular-svg-icons'
import {fab} from '@fortawesome/free-brands-svg-icons'
import type {IconDefinition} from '@fortawesome/fontawesome-svg-core'

export type IconStyle = 'solid' | 'regular' | 'brands'

export interface IconInfo {
	name: string
	prefix: string
	style: IconStyle
	definition: IconDefinition
}

function isIconDefinition(value: unknown): value is IconDefinition {
	return (
		!!value &&
		typeof value === 'object' &&
		'iconName' in value &&
		'prefix' in value
	)
}

function extractIcons(iconPack: Record<string, unknown>, style: IconStyle): IconInfo[] {
	const seenNames = new Set<string>()

	return Object.entries(iconPack)
		.filter(([key, value]) => {
			// Filter out non-icon entries like 'prefix' and 'fa' namespace entries
			if (key === 'prefix' || key === 'fas' || key === 'far' || key === 'fab') return false
			// Check if it's a valid icon definition
			if (!isIconDefinition(value)) return false
			// Deduplicate by iconName (FA exports same icon under multiple keys/aliases)
			if (seenNames.has(value.iconName)) return false
			seenNames.add(value.iconName)
			return true
		})
		.map(([, value]) => {
			const icon = value as IconDefinition
			return {
				name: icon.iconName,
				prefix: icon.prefix,
				style,
				definition: icon
			}
		})
}

// Cache the icons so we don't recompute every time
let cachedSolidIcons: IconInfo[] | null = null
let cachedRegularIcons: IconInfo[] | null = null
let cachedBrandsIcons: IconInfo[] | null = null

export function getSolidIcons(): IconInfo[] {
	if (!cachedSolidIcons) {
		cachedSolidIcons = extractIcons(fas as Record<string, unknown>, 'solid')
	}
	return cachedSolidIcons
}

export function getRegularIcons(): IconInfo[] {
	if (!cachedRegularIcons) {
		cachedRegularIcons = extractIcons(far as Record<string, unknown>, 'regular')
	}
	return cachedRegularIcons
}

export function getBrandsIcons(): IconInfo[] {
	if (!cachedBrandsIcons) {
		cachedBrandsIcons = extractIcons(fab as Record<string, unknown>, 'brands')
	}
	return cachedBrandsIcons
}

export function getIconsByStyle(style: IconStyle): IconInfo[] {
	switch (style) {
		case 'solid':
			return getSolidIcons()
		case 'regular':
			return getRegularIcons()
		case 'brands':
			return getBrandsIcons()
	}
}

export function searchIcons(icons: IconInfo[], query: string): IconInfo[] {
	if (!query.trim()) return icons
	const lowerQuery = query.toLowerCase().trim()
	return icons.filter(icon => icon.name.toLowerCase().includes(lowerQuery))
}

/**
 * Formats icon name for display (e.g., "arrow-right" -> "Arrow Right")
 */
export function formatIconName(name: string): string {
	const val = name
		.split('-')
		.join(' ')
	return val.charAt(0).toUpperCase() + val.slice(1)
}


/**
 * Converts IconInfo to a Vuetify-compatible string format
 * e.g., "fas fa-check", "far fa-circle", "fab fa-github"
 * This format works directly with VIcon's icon prop
 */
export function toVuetifyIcon(icon: IconInfo): string {
	return `${icon.prefix} fa-${icon.name}`
}

/**
 * Parsed icon data from a Vuetify icon string
 */
export interface ParsedIcon {
	prefix: string
	name: string
	style: IconStyle
}

/**
 * Parses a Vuetify icon string back to its components
 * Supports formats: "fas fa-check", "far fa-circle", "fab fa-github"
 * Returns null if the string is invalid
 */
export function parseVuetifyIcon(iconString: string | undefined | null): ParsedIcon | null {
	if (!iconString) return null

	const parts = iconString.trim().split(/\s+/)
	if (parts.length !== 2) return null

	const prefix = parts[0]
	const iconPart = parts[1]

	if (!prefix || !iconPart) return null

	// Validate prefix
	const prefixToStyle: Record<string, IconStyle> = {
		fas: 'solid',
		far: 'regular',
		fab: 'brands'
	}

	const style = prefixToStyle[prefix]
	if (!style) return null

	// Extract icon name (remove "fa-" prefix if present)
	const name = iconPart.startsWith('fa-') ? iconPart.slice(3) : iconPart

	return {prefix, name, style}
}

/**
 * Find an IconInfo by its Vuetify string format
 */
export function findIconByVuetifyString(iconString: string | undefined | null): IconInfo | null {
	const parsed = parseVuetifyIcon(iconString)
	if (!parsed) return null

	const icons = getIconsByStyle(parsed.style)
	return icons.find(icon => icon.name === parsed.name) ?? null
}
