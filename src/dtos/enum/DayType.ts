export enum DayType {
	Workday = 'Workday',
	Weekend = 'Weekend',
	Vacation = 'Vacation',
	SickDay = 'SickDay',
	Special = 'Special',
}

export const dayTypeOptions = Object.values(DayType)

export function getDayTypeColor(dayType: DayType, light: boolean = false): string {
	switch (dayType) {
		case DayType.Workday:
			return 'base'
		case DayType.Weekend:
			return light ? 'primaryOutline' : 'primary'
		case DayType.Vacation:
			return light ? 'secondaryOutline' : 'secondary'
		case DayType.SickDay:
			return light ? 'success' : 'successDark'
		case DayType.Special:
			return light ? 'primaryOutline' : 'primary'
		default:
			return 'surface-variant'
	}
}

export function getDayTypeIcon(dayType: DayType): string {
	switch (dayType) {
		case DayType.Workday:
			return 'briefcase'
		case DayType.Weekend:
			return 'mug-hot'
		case DayType.Vacation:
			return 'umbrella-beach'
		case DayType.SickDay:
			return 'notes-medical'
		case DayType.Special:
			return 'star'
		default:
			return 'calendar'
	}
}
