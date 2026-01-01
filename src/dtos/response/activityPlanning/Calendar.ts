import {DayType} from '@/dtos/enum/DayType.ts';
import {convertToEnum} from '@/composables/general/EnumComposable.ts';

export class Calendar {
	constructor(
		public readonly id: number,
		public readonly date: string,                 // DateOnly -> ISO date string
		public readonly dayType: DayType,              // DayType enum name
		public readonly dayIndex: number,
		public readonly label: string | null,
		public readonly wakeUpTime: string | null,    // TimeOnly -> "HH:mm:ss"
		public readonly bedTime: string | null,       // TimeOnly -> "HH:mm:ss"
		public readonly appliedTemplateId: number | null,
		public readonly appliedTemplateName: string | null,
		public readonly weather: string | null,
		public readonly notes: string | null,
		public readonly totalTasks: number,
		public readonly completedTasks: number,
		public readonly completionRate: number,
	) {
	}

	get isToday() {
		return this.date === new Date().toISOString().slice(0, 10);
	}

	get isWeekend() {
		return this.dayIndex === 6 || this.dayIndex === 7;
	}

	static fromJson(json: any): Calendar {
		return new Calendar(
			json.id,
			json.date,
			convertToEnum(DayType, json.dayType),
			json.dayIndex,
			json.label ?? null,
			json.wakeUpTime ?? null,
			json.bedTime ?? null,
			json.appliedTemplateId ?? null,
			json.appliedTemplateName ?? null,
			json.weather ?? null,
			json.notes ?? null,

			json.totalTasks,
			json.completedTasks,
			json.completionRate,
		);
	}
}