/**
 * Why a re-plan (FO4) touches a block. The server derives it and never stores it.
 *
 * - `missed`: not started, and its end has passed on the user's clock.
 * - `late`: not started, its start has passed but its end has not.
 * - `upcoming`: still ahead, and pushed later to make room for the two above.
 */
export enum PlannerTaskSlipState {
	Missed = 'missed',
	Late = 'late',
	Upcoming = 'upcoming',
}
