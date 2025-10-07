// Type definitions
import type {Time} from '@/classes/TimeUtils.ts';

export class MyEvent {
	constructor(
		public id: number,
		public title: string,
		public color: string,
		public start: Date,
		public end: Date,
		public isBackground: boolean = false,
		public isDuringBackgroundEvent: boolean = false,
		public gridRowStart: number,
		public gridRowEnd: number,
	) {
	}
}

// Add a helper type for creating new events (optional fields)
export type NewEventData = Partial<MyEvent> & {
	// Make certain fields required for creation
	title: string;
	start: string;
	end: string;
};


export interface CreationPreviewType {
	startRow: number
	endRow: number
}

export interface PrefillDialog {
	startTime: string
	endTime: string,
	gridRowStart: number,
	gridRowEnd: number,
}

export const SLOT_HEIGHT = 22 // pixels
export const SCROLL_THRESHOLD = 30
export const MAX_SCROLL_SPEED = 15