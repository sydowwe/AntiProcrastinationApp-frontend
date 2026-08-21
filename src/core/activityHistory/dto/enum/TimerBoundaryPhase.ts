/**
 * What kind of phase a timer boundary is the end of.
 *
 * The server words the background push from this plus the index fields — see
 * `ScheduleTimerAlarmsRequest`. `Plain` is a countdown, which has one boundary and no phase
 * structure at all; the other three are the pomodoro phases and mirror `PomodoroPhase` in
 * `runningTimerStore.ts`, in the casing the API uses.
 */
export enum TimerBoundaryPhase {
	Plain = 'Plain',
	Focus = 'Focus',
	ShortBreak = 'ShortBreak',
	LongBreak = 'LongBreak',
}
