export enum DayType {
	Workday = 'Workday',
	Weekend = 'Weekend',
	Holiday = 'Holiday',
	Vacation = 'Vacation',
	SickDay = 'SickDay',
	Special = 'Special'
}

export function getDayTypeColor(dayType: DayType, light: boolean = false): string {
	switch (dayType) {
		case DayType.Workday:
			return light ? 'primaryOutline' : 'primary'
		case DayType.Weekend:
			return light ? 'success' : 'successDark'
		case DayType.Holiday:
			return light ? 'error' : 'errorDark'
		case DayType.Vacation:
			return light ? 'secondaryOutline' : 'secondary'
		case DayType.SickDay:
			return 'warning'
		case DayType.Special:
			return 'info'
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
		case DayType.Holiday:
			return 'gift'
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