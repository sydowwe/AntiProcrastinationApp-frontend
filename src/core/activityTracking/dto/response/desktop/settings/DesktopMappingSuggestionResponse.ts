import type { MappingSuggestion } from '@/core/activityTracking/dto/response/MappingSuggestion.ts'

/**
 * An uncovered process the user's own timer focus phases point at one activity (FO9). Read-only: accepting it is
 * the ordinary rule create, so the server never writes on this path.
 */
export class DesktopMappingSuggestionResponse implements MappingSuggestion {
	constructor(
		public processName: string = '',
		public productName: string = '',
		public activityId: number = 0,
		public activityName: string = '',
		public sessionCount: number = 0,
		public activitySessionCount: number = 0,
		public seconds: number = 0,
	) {}

	get key(): string {
		return this.processName
	}

	get subject(): string {
		return this.processName
	}

	get dismissalKey(): string {
		return `${this.processName}|${this.activityId}`
	}

	static fromJson(json: any): DesktopMappingSuggestionResponse {
		const {
			processName = '',
			productName = '',
			activityId = 0,
			activityName = '',
			sessionCount = 0,
			activitySessionCount = 0,
			seconds = 0,
		} = json ?? {}
		return new DesktopMappingSuggestionResponse(
			processName,
			productName,
			activityId,
			activityName,
			sessionCount,
			activitySessionCount,
			seconds,
		)
	}

	static listFromObjects(objects: any[]): DesktopMappingSuggestionResponse[] {
		return objects.map(o => DesktopMappingSuggestionResponse.fromJson(o))
	}
}
