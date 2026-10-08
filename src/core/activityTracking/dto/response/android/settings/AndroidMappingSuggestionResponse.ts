import type { MappingSuggestion } from '@/core/activityTracking/dto/response/MappingSuggestion.ts'

/**
 * An uncovered app the user's own timer focus phases point at one activity, and that filled those timers rather
 * than interrupting them (FO9). Read-only: accepting it is the ordinary rule create.
 */
export class AndroidMappingSuggestionResponse implements MappingSuggestion {
	constructor(
		public packageName: string = '',
		public appLabel: string = '',
		public activityId: number = 0,
		public activityName: string = '',
		public sessionCount: number = 0,
		public activitySessionCount: number = 0,
		public seconds: number = 0,
	) {}

	/** The grid lists a package once per label; one exact-package rule covers them all. */
	get key(): string {
		return this.packageName
	}

	get subject(): string {
		return this.appLabel || this.packageName
	}

	get dismissalKey(): string {
		return `${this.packageName}|${this.activityId}`
	}

	static fromJson(json: any): AndroidMappingSuggestionResponse {
		const {
			packageName = '',
			appLabel = '',
			activityId = 0,
			activityName = '',
			sessionCount = 0,
			activitySessionCount = 0,
			seconds = 0,
		} = json ?? {}
		return new AndroidMappingSuggestionResponse(
			packageName,
			appLabel,
			activityId,
			activityName,
			sessionCount,
			activitySessionCount,
			seconds,
		)
	}

	static listFromObjects(objects: any[]): AndroidMappingSuggestionResponse[] {
		return objects.map(o => AndroidMappingSuggestionResponse.fromJson(o))
	}
}
