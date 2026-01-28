import {Activity} from '@/dtos/response/Activity';
import {Time} from '@/utils/Time';

export class PomodoroTimerPreset {
	constructor(
		public id: number,
		public name: string,
		public focusDuration: number,
		public shortBreakDuration: number,
		public longBreakDuration: number,
		public focusPeriodInCycleCount: number,
		public numberOfCycles: number,
		public focusActivity: Activity | null,
		public restActivity: Activity | null
	) {
	}

	static fromJson(object: any) {
		return new PomodoroTimerPreset(
			object.id,
			object.name,
			object.focusDuration,
			object.shortBreakDuration,
			object.longBreakDuration,
			object.focusPeriodInCycleCount,
			object.numberOfCycles,
			object.focusActivity ? Activity.fromJson(object.focusActivity) : null,
			object.restActivity ? Activity.fromJson(object.restActivity) : null
		);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => {
			return this.fromJson(item);
		});
	}

	get hasFocusActivity(): boolean {
		return this.focusActivity !== null;
	}

	get hasRestActivity(): boolean {
		return this.restActivity !== null;
	}

	get presetType(): 'basic' | 'focus' | 'both' {
		if (this.hasFocusActivity && this.hasRestActivity) return 'both';
		if (this.hasFocusActivity) return 'focus';
		return 'basic';
	}

	get focusDurationFormatted(): string {
		return Time.fromMinutes(this.focusDuration).getNice;
	}

	get shortBreakDurationFormatted(): string {
		return Time.fromMinutes(this.shortBreakDuration).getNice;
	}

	get longBreakDurationFormatted(): string {
		return Time.fromMinutes(this.longBreakDuration).getNice;
	}

	get displaySummary(): string {
		const parts = [
			`${this.focusDurationFormatted}`,
			`${this.focusPeriodInCycleCount}×${this.numberOfCycles}`
		];
		if (this.hasFocusActivity) {
			parts.push(this.focusActivity!.name);
		}
		return parts.join(' · ');
	}
}
