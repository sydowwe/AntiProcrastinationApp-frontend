import {DayType} from '@/dtos/enum/DayType.ts';
import {Time} from '@/utils/Time.ts';
import type {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts';

export class CalendarRequest {
	constructor(
		public label: string | null = null,
		public dayType: DayType = DayType.Workday,
		public wakeUpTime: Time = new Time(7, 0),
		public bedTime: Time = new Time(23, 0),
		public weather: string | null = null,
		public notes: string | null = null,
	) {
	}

	public static fromResponse(response: Calendar): CalendarRequest {
		return new CalendarRequest(response.label, response.dayType, response.wakeUpTime, response.bedTime, response.weather, response.notes);
	}
}