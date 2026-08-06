import type { Time } from '@/_common/dto/dto/Time.ts'

export class PlannerTaskFilter {
	constructor(
		public calendarId: number,
		public from: Time,
		public until: Time,
	) {}
}
