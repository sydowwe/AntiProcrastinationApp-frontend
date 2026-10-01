/**
 * How a session ended, as the running-timer store saw it — see `TimerOutcome` in
 * `runningTimerStore.ts` for what each value means. The server stores it as told and never derives it
 * from the rows. Keys are the API's member names, values the store's spelling.
 */
export enum TimerSessionOutcome {
	Completed = 'completed',
	StoppedEarly = 'stoppedEarly',
	RanOutWhileAway = 'ranOutWhileAway',
}
