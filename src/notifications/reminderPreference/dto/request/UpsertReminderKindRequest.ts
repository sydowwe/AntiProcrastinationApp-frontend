import type { ReminderChannel } from '../enum/ReminderChannel.ts'

// Body for PUT /reminder-preference/kind. Upserts a single per-kind setting keyed by (ownerModule,
// kind): toggling the same kind again just updates the one row. `channel` is an advisory hint.
export class UpsertReminderKindRequest {
	constructor(
		public ownerModule: string = '',
		public kind: string = '',
		public enabled: boolean = true,
		public channel: ReminderChannel | null = null,
	) {}

	static fromJson(json: any): UpsertReminderKindRequest {
		return new UpsertReminderKindRequest(
			json.ownerModule ?? '',
			json.kind ?? '',
			json.enabled ?? true,
			(json.channel ?? null) as ReminderChannel | null,
		)
	}
}
