import {
	FRESH_START_SPREAD_DAYS,
	FreshStartTaskChoice,
	FreshStartTodoChoice,
} from '@/core/home/dto/enum/FreshStartChoice.ts'

/**
 * Body of `POST welcome-back/fresh-start` (FO5): the card's three choices, applied in one save. The server
 * re-reads the pile itself, so no ids are sent.
 */
export class ApplyFreshStartRequest {
	constructor(
		public todos: FreshStartTodoChoice = FreshStartTodoChoice.Spread,
		public spreadOverDays: number = FRESH_START_SPREAD_DAYS,
		public pastTasks: FreshStartTaskChoice = FreshStartTaskChoice.CloseAsAway,
		public markNotificationsRead: boolean = true,
	) {}

	static fromJson(json: any): ApplyFreshStartRequest {
		const {
			todos = FreshStartTodoChoice.Spread,
			spreadOverDays = FRESH_START_SPREAD_DAYS,
			pastTasks = FreshStartTaskChoice.CloseAsAway,
			markNotificationsRead = true,
		} = json ?? {}
		return new ApplyFreshStartRequest(todos, spreadOverDays, pastTasks, markNotificationsRead)
	}
}
