import { ReplanWontFitResolution } from '@/core/dayPlanner/dto/enum/ReplanWontFitResolution.ts'

export class DayReplanWontFitDecision {
	constructor(
		public taskId: number = 0,
		public resolution: ReplanWontFitResolution = ReplanWontFitResolution.Tomorrow,
	) {}

	static fromJson(json: any): DayReplanWontFitDecision {
		const { taskId = 0, resolution = ReplanWontFitResolution.Tomorrow } = json ?? {}
		return new DayReplanWontFitDecision(taskId, resolution)
	}
}

/**
 * Body of `POST calendar/day-plan/{date}/replan/apply` (FO4). The server recomputes the plan from the
 * token rather than trusting placements from here, so the only things sent are the token and one decision
 * per block in the preview's `wontFit`: exactly those blocks, no more and no fewer, or it is a 400.
 */
export class ApplyDayReplanRequest {
	constructor(
		public previewToken: string = '',
		public wontFit: DayReplanWontFitDecision[] = [],
	) {}

	static fromJson(json: any): ApplyDayReplanRequest {
		const { previewToken = '', wontFit = [] } = json ?? {}
		return new ApplyDayReplanRequest(
			previewToken,
			wontFit.map((item: any) => DayReplanWontFitDecision.fromJson(item)),
		)
	}
}
