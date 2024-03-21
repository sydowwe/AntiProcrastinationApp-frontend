import {getSecondsFromTimeObject, getTimeObjectFromSeconds} from '@/compositions/DateTimeFunctions';

export class TimeLengthObject {
	constructor(
		public hours: number = 0,
		public minutes: number = 0,
		public seconds: number = 0
	) {
	}

	public isNotZero(): boolean {
		return !(this.seconds === 0 && this.minutes === 0 && this.hours === 0);
	}

	public get getInSeconds() {
		return this.hours * 3600 + this.minutes * 60 + this.seconds;
	}
	public subtract(objectToSubtract: TimeLengthObject) {
		return getTimeObjectFromSeconds(getSecondsFromTimeObject(this) - getSecondsFromTimeObject(objectToSubtract))
	}
}

export class TimeObject {
	constructor(
		public hours = 0 as number,
		public minutes = 0 as number
	) {
	}
}
