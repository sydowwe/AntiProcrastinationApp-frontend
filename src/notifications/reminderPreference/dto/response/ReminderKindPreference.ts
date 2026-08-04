import type { ReminderChannel } from '../enum/ReminderChannel.ts'

// One per-kind setting the user has explicitly customised, keyed by (ownerModule, kind). A kind absent
// from the returned list is at its default — enabled. `channel` is an advisory hint and may be null.
export class ReminderKindPreference {
	constructor(
		public ownerModule: string,
		public kind: string,
		public enabled: boolean,
		public channel: ReminderChannel | null,
	) {}

	public static fromJson(json: any): ReminderKindPreference {
		return new ReminderKindPreference(
			json.ownerModule,
			json.kind,
			json.enabled ?? true,
			(json.channel ?? null) as ReminderChannel | null,
		)
	}

	public static listFromObjects(objects: any[]): ReminderKindPreference[] {
		return (objects ?? []).map(o => ReminderKindPreference.fromJson(o))
	}
}
