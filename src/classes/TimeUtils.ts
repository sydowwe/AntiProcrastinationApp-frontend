export class TimeLengthObject {
	constructor(
		public hours: number = 0,
		public minutes: number = 0,
		public seconds: number = 0
	) {
	}
	public static fromSeconds(seconds: number): TimeLengthObject {
		return new TimeLengthObject( Math.floor(seconds/3600),Math.floor(seconds % 3600 / 60),seconds % 60);
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
		return this.hours * 3600 + this.minutes * 60 + this.seconds;
	}
	public get getNice(){
		return `${this.hours != 0 ? this.hours + 'h' : ''}${this.minutes != 0 ? this.minutes + 'm' : ''}${this.seconds}s`;
	}
	public subtract(objectToSubtract: TimeLengthObject) {
		return TimeLengthObject.fromSeconds(this.getInSeconds - objectToSubtract.getInSeconds)
	}
}