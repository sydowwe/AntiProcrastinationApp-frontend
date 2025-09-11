export class TimeObject {
	constructor(
		public hours: number = 0,
		public minutes: number = 0,
		public seconds: number = 0
	) {
	}

	public get toTimeLength() {
		console.log(this)
		return new TimeLengthObject(this.hours, this.minutes + Math.round(this.seconds / 60));
	}

	public static fromSeconds(seconds: number): TimeObject {
		return new TimeObject(Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60);
	}

	static fromJson(object: any) {
		const {
			hours = 0,
			minutes = 0,
			seconds = 0
		} = object;
		return new TimeObject(hours, minutes, seconds);
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

	public subtract(objectToSubtract: TimeObject) {
		return TimeObject.fromSeconds(this.getInSeconds - objectToSubtract.getInSeconds)
	}
}

export type TimeKeys = 'hours' | 'minutes' | 'seconds';

export class TimeLengthObject {
	constructor(
		public hours: number = 0,
		public minutes: number = 0,
	) {
	}

	public static fromMinutes(minutes: number): TimeLengthObject {
		return new TimeLengthObject(Math.floor(minutes / 60), Math.floor(minutes % 60));
	}

	public static fromSeconds(seconds: number): TimeLengthObject {
		return new TimeLengthObject(Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60));
	}

	static fromJson(object: any) {
		const {
			hours = 0,
			minutes = 0,
		} = object;
		return new TimeLengthObject(hours, minutes);
	}

	public isNotZero(): boolean {
		return !(this.minutes === 0 && this.hours === 0);
	}

	public get getInMinutes() {
		return this.hours * 60 + this.minutes;
	}

	public get getInSeconds() {
		return this.getInMinutes * 60;
	}

	public get getNice() {
		return `${this.hours != 0 ? this.hours + 'h' : ''}${this.minutes != 0 ? this.minutes + 'm' : ''}`;
	}

	public subtract(objectToSubtract: TimeLengthObject) {
		return TimeLengthObject.fromMinutes(this.getInMinutes - objectToSubtract.getInMinutes)
	}
}