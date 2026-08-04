import { IdResponse } from '@/_common/dto/response/base/IdResponse.ts'
import type { RunOutcome } from '../enum/RunOutcome.ts'
import type { TriggerSource } from '../enum/TriggerSource.ts'
import { ReplayLineageItem } from './ReplayLineageItem.ts'

/** Full detail of a single run, including its payload snapshot and replay lineage. */
export class ScheduledJobRunResponse extends IdResponse {
	constructor(
		id: number,
		public jobId: number,
		public jobKey: string,
		public outcome: RunOutcome,
		public scheduledFireTime: Date | null,
		public actualFireTime: Date | null,
		public startedAt: Date,
		public finishedAt: Date | null,
		public durationSeconds: number,
		public triggerSource: TriggerSource,
		public correlationId: string,
		public errorType: string | null,
		public errorMessage: string | null,
		// The exact input this run executed with, as raw/technical JSON text.
		public payloadSnapshot: string | null,
		// When this run is itself a replay, the run it replayed; null otherwise.
		public replayedFromRunId: number | null,
		// Runs that were replays of this run.
		public replayRuns: ReplayLineageItem[],
	) {
		super(id)
	}

	static listFromObjects(objects: any[]): ScheduledJobRunResponse[] {
		return objects.map(ScheduledJobRunResponse.fromJson)
	}

	static fromJson(json: any): ScheduledJobRunResponse {
		return new ScheduledJobRunResponse(
			json.id,
			json.jobId,
			json.jobKey,
			json.outcome as RunOutcome,
			json.scheduledFireTime ? new Date(json.scheduledFireTime) : null,
			json.actualFireTime ? new Date(json.actualFireTime) : null,
			new Date(json.startedAt),
			json.finishedAt ? new Date(json.finishedAt) : null,
			json.durationSeconds ?? 0,
			json.triggerSource as TriggerSource,
			json.correlationId ?? '',
			json.errorType ?? null,
			json.errorMessage ?? null,
			json.payloadSnapshot ?? null,
			json.replayedFromRunId ?? null,
			ReplayLineageItem.listFromObjects(json.replayRuns),
		)
	}
}
