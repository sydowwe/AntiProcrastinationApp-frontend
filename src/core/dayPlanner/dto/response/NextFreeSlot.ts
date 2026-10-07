import { Time } from '@/_common/dto/dto/Time.ts'

/**
 * `GET calendar/day-plan/{date}/next-free-slot`: the earliest free stretch long enough for one block
 * (FO4), found by the same rule the re-plan packs with. No room is a 200 with `found` false, never a 404.
 */
export class NextFreeSlot {
	constructor(
		public readonly date: string,
		public readonly minutes: number,
		public readonly found: boolean,
		public readonly startTime: Time | null,
		public readonly endTime: Time | null,
	) {}

	static fromJson(json: any): NextFreeSlot {
		const { date = '', minutes = 0, found = false, startTime = null, endTime = null } = json ?? {}
		return new NextFreeSlot(
			date,
			minutes,
			found,
			startTime == null ? null : Time.fromJson(startTime),
			endTime == null ? null : Time.fromJson(endTime),
		)
	}
}
