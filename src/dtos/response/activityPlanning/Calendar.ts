import {DayType} from '@/dtos/enum/DayType.ts';
import {convertToEnum} from '@/composables/general/EnumComposable.ts';
import {Time} from '@/utils/Time.ts';

export class Calendar {
	constructor(
		public readonly id: number,
		public readonly date: string,                 // DateOnly -> ISO date string
		public readonly dayType: DayType,              // DayType enum name
		public readonly dayIndex: number,
		public readonly label: string | null,
		public readonly holidayName: string | null,
		public readonly wakeUpTime: Time,
		public readonly bedTime: Time,
		public readonly appliedTemplateId: number | null,
		public readonly appliedTemplateName: string | null,
		public readonly weather: string | null,
		public readonly notes: string | null,
		public readonly totalTasks: number,
		public completedTasks: number,
	) {
	}

	public get completionRate() {
		return Math.round(this.completedTasks / this.totalTasks * 100);
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
			json.holidayName ?? null,
			Time.fromJson(json.wakeUpTime),
			Time.fromJson(json.bedTime),
			json.appliedTemplateId ?? null,
			json.appliedTemplateName ?? null,
			json.weather ?? null,
			json.notes ?? null,

			json.totalTasks,
			json.completedTasks,
		);
	}
}