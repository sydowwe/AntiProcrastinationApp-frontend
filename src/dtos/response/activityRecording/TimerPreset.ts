import {Activity} from '@/dtos/response/activity/Activity.ts';
import {Time} from '@/dtos/dto/Time.ts';

export class TimerPreset {
	constructor(
		public id: number,
		public duration: number,
		public activity: Activity | null
	) {
	}

	static fromJson(object: any) {
		return new TimerPreset(
			object.id,
			object.duration,
			object.activity ? Activity.fromJson(object.activity) : null
		);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => {
			return this.fromJson(item);
		});
	}

	get isActivityPreset(): boolean {
		return this.activity !== null;
	}

	get durationFormatted(): string {
		return Time.fromMinutes(this.duration).getNice;
	}

	get displayName(): string {
		if (this.activity) {
			return `${this.durationFormatted} - ${this.activity.name}`;
		}
		return this.durationFormatted;
	}
}
