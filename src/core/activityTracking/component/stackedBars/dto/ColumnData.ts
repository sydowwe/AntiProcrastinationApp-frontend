import type { ActivitySource } from '@/core/activityTracking/dto/enum/ActivitySource.ts'

export class ColumnData {
	constructor(
		/** The item's identity, or `OTHER_DOMAIN` for the folded column. */
		public key: string,
		public label: string,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public activeMinutes: number,
		public backgroundMinutes: number,
		public url?: string,
		public color?: string,
		/** Unified bars only; the folded column carries the union of what it folded. */
		public sources?: ActivitySource[],
	) {}
}
