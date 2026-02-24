import {Time} from '@/dtos/dto/Time.ts';

export class TimePrecise {
	constructor(
		public hours: number = 0,
		public minutes: number = 0,
		public seconds: number = 0
	) {
	}

	public get toTimeLength() {
		return new Time(this.hours, this.minutes + Math.round(this.seconds / 60));
	}

	public static fromSeconds(seconds: number): TimePrecise {
		return new TimePrecise(Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60);
	}

	static fromJson(object: any) {
		const {
			hours = 0,
			minutes = 0,
			seconds = 0
		} = object;
		return new TimePrecise(hours, minutes, seconds);
	}

	public isNotZero(): boolean {
		return !(this.seconds === 0 && this.minutes === 0 && this.hours === 0);
	}

	public get getInSeconds() {
		return this.hours * 3600 + this.minutes * 60 + this.seconds;
	}

	public get getNice() {
		return `${this.hours != 0 ? this.hours + 'h' : ''}${this.minutes != 0 ? this.minutes + 'm' : ''}${this.seconds}s`;
	}

	public subtract(objectToSubtract: TimePrecise) {
		return TimePrecise.fromSeconds(this.getInSeconds - objectToSubtract.getInSeconds)
	}
}

export type TimePreciseKeys = 'hours' | 'minutes' | 'seconds';