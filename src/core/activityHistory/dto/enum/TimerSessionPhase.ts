/**
 * Which part of a pomodoro a history row is. It cannot be read off the activity, because the rest
 * activity may be the focus one. Keys are the API's member names, values the store's `PomodoroPhase`
 * spelling. Not `TimerBoundaryPhase`, which describes the instant an alarm announces and has a
 * `Plain` member no row may carry.
 */
export enum TimerSessionPhase {
	Focus = 'focus',
	ShortBreak = 'shortBreak',
	LongBreak = 'longBreak',
}
