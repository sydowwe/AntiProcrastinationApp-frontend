export enum Location {
	Home = 'Home',
	Office = 'Office',
	Travel = 'Travel',
}

export const LOCATION_LABELS: Record<Location, string> = {
	[Location.Home]: 'Home',
	[Location.Office]: 'Office',
	[Location.Travel]: 'Travel',
}

export const LOCATION_ICONS: Record<Location, string> = {
	[Location.Home]: 'house',
	[Location.Office]: 'building',
	[Location.Travel]: 'plane',
}

export const locationOptions = Object.values(Location).map(v => ({ title: v, value: v }))
