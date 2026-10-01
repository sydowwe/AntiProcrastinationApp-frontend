/**
 * Which timer wrote an `ActivityHistorySession`. Keys are the API's member names (read through
 * `convertToEnum`, written through `getEnumKeyByValue`); values are the store's `TimerKind` spelling.
 * A stopwatch is not a session and has no member here.
 */
export enum TimerSessionKind {
	Pomodoro = 'pomodoro',
	Timer = 'timer',
}
