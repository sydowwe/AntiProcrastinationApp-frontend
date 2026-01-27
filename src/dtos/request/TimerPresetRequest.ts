import {TimerPreset} from '@/dtos/response/TimerPreset';

export class TimerPresetRequest {
	constructor(
		public duration: number = 25, // Default 25 minutes
		public activityId: number | null = null
	) {
	}

	static fromEntity(preset: TimerPreset) {
		return new TimerPresetRequest(
			preset.duration,
			preset.activity?.id ?? null
		);
	}
}
