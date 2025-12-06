export class CalendarResponseDto {
	constructor(
		public readonly id: number,
		public readonly date: string,                 // DateOnly -> ISO date string
		public readonly dayType: string,              // DayType enum name
		public readonly label: string | null,
		public readonly wakeUpTime: string | null,    // TimeOnly -> "HH:mm:ss"
		public readonly bedTime: string | null,       // TimeOnly -> "HH:mm:ss"
		public readonly isPlanned: boolean,
		public readonly appliedTemplateId: number | null,
		public readonly appliedTemplateName: string | null,
		public readonly weather: string | null,
		public readonly notes: string | null,
		public readonly totalTasks: number,
		public readonly completedTasks: number,
		public readonly completionRate: number
	) {
	}

	static fromJson(json: any): CalendarResponseDto {
		return new CalendarResponseDto(
			json.id,
			json.date,
			json.dayType,
			json.label ?? null,
			json.wakeUpTime ?? null,
			json.bedTime ?? null,
			json.isPlanned,
			json.appliedTemplateId ?? null,
			json.appliedTemplateName ?? null,
			json.weather ?? null,
			json.notes ?? null,
			json.totalTasks,
			json.completedTasks,
			json.completionRate
		);
	}
}