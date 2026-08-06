import type { RunOutcome } from '../enum/RunOutcome.ts'
import type { TriggerSource } from '../enum/TriggerSource.ts'

/** A lightweight reference to a related run in a replay lineage (parent or child). */
export class ReplayLineageItem {
	constructor(
		public id: number,
		public startedAt: Date,
		public outcome: RunOutcome,
		public triggerSource: TriggerSource,
	) {}

	static fromJson(json: any): ReplayLineageItem {
		return new ReplayLineageItem(
			json.id,
			new Date(json.startedAt),
			json.outcome as RunOutcome,
			json.triggerSource as TriggerSource,
		)
	}

	static listFromObjects(objects: any[]): ReplayLineageItem[] {
		return (objects ?? []).map(o => ReplayLineageItem.fromJson(o))
	}
}
