import {Serializable} from '@/scripts/classDeserializationHelper.ts';

@Serializable
export class Time {
	constructor(
		public hours: number = 0,
		public minutes: number = 0,
	) {
	}

	public static fromMinutes(minutes: number): Time {
		return new Time(Math.floor(minutes / 60), Math.floor(minutes % 60));
	}

	public static fromSeconds(seconds: number): Time {
		return new Time(Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60));
	}

	static fromJson(object: any) {
		const {
			hours = 0,
			minutes = 0,
		} = object;
		return new Time(hours, minutes);
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

	public subtract(objectToSubtract: Time) {
		return Time.fromMinutes(this.getInMinutes - objectToSubtract.getInMinutes)
	}

	public getString() {
		return `${this.hours.toString().padStart(2, '0')}:${this.minutes.toString().padStart(2, '0')}`;
	}

	public static getString(time: Time) {
		return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}`;
	}

	public static fromString(string: string) {
		const [h, m] = string.split(':');
		const hours = parseInt(h ?? '0')
		const minutes = parseInt(m ?? '0')
		if (hours < 0 || minutes < 0) {
			return new Time(0, 0);
		}
		return new Time(hours, minutes);
	}

	public static fromDate(date: Date) {
		return Time.fromMinutes(date.getHours() * 60 + date.getMinutes());
	}
}