// Type definitions
export interface TimeSlot {
	hour: number
	minute: number
}

export interface Category {
	label: string
	value: string
	color: string
}

export class EditedMyEvent {
	public constructor(
		public id?: number,
		public title?: string,
		public color?: string,
		public start?: string,
		public end?: string,
		public category?: string,
		public gridRowStart?: number,
		public gridRowEnd?: number,
		public isBackground: boolean = false,
		public isDuringBackgroundEvent: boolean = false
	) {
	}
}

export class MyEvent {
	constructor(
		public id: number,
		public title: string,
		public color: string,
		public start: string,
		public end: string,
		public category: string = "",
		public gridRowStart: number,
		public gridRowEnd: number,
		public isBackground: boolean = false,
		public isDuringBackgroundEvent: boolean = false
	) {
	}
}


export interface CreationPreview {
	startRow: number
	endRow: number
}

export interface PrefillDialog {
	startTime: string
	endTime: string,
	gridRowStart: number,
	gridRowEnd: number,
}