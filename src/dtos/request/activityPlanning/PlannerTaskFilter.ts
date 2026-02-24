import type {Time} from '@/dtos/dto/Time.ts';

export class PlannerTaskFilter {
	constructor(
		public calendarId: number,
		public from: Time,
		public until: Time
	) {
	}
}
