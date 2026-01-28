import {PomodoroTimerPreset} from '@/dtos/response/PomodoroTimerPreset';

export class PomodoroTimerPresetRequest {
	constructor(
		public name: string = '',
		public focusDuration: number = 25,
		public shortBreakDuration: number = 5,
		public longBreakDuration: number = 15,
		public focusPeriodInCycleCount: number = 4,
		public numberOfCycles: number = 2,
		public focusActivityId: number | null = null,
		public restActivityId: number | null = null
	) {
	}

	static fromEntity(preset: PomodoroTimerPreset) {
		return new PomodoroTimerPresetRequest(
			preset.name,
			preset.focusDuration,
			preset.shortBreakDuration,
			preset.longBreakDuration,
			preset.focusPeriodInCycleCount,
			preset.numberOfCycles,
			preset.focusActivity?.id ?? null,
			preset.restActivity?.id ?? null
		);
	}
}
