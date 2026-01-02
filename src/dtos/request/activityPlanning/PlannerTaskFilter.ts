import type {Time} from '@/utils/Time.ts';

export class PlannerTaskFilter {
	constructor(
		public calendarId: number,
		public from: Time,
		public until: Time
	) {
	}
}
