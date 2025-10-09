// Type definitions
import type {Time} from '@/classes/TimeUtils.ts';
import {Activity} from '@/classes/Activity.ts';


export class TaskSpanData {
	constructor(
		public start: Date,
		public end: Date,
		public gridRowStart: number,
		public gridRowEnd: number,
	) {
	}
}


export class CreationPreviewType {
	constructor(
		public initRow: number,
		public startRow: number,
		public endRow: number
	) {
	}
	public static init(slot:number) {
		return new CreationPreviewType(slot, slot, slot)
	}
}


export const SLOT_HEIGHT = 22 // pixels