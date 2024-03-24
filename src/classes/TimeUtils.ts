import {getSecondsFromTimeObject, getTimeObjectFromSeconds} from '@/compositions/DateTimeFunctions';
import {Activity} from '@/classes/Activity';

export class TimeLengthObject {
	constructor(
		public hours: number = 0,
		public minutes: number = 0,
		public seconds: number = 0
	) {
	}
	static fromObject(object: any){
		const {
			hours = 0,
			minutes = 0,
			seconds = 0
		} = object;
		return new TimeLengthObject(hours,minutes,seconds);
	}
	public isNotZero(): boolean {
		return !(this.seconds === 0 && this.minutes === 0 && this.hours === 0);
	}

	public get getInSeconds() {
		console.log(this.hours, this.minutes, this.seconds);
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
