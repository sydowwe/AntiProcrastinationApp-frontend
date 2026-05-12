export interface PlacingItem {
	name: string
	icon: string
	color?: string
}

export class CreationPreviewType {
	constructor(
		public initRow: number,
		public startRow: number,
		public endRow: number,
	) {}

	public static init(slot: number) {
		return new CreationPreviewType(slot, slot, slot)
	}
}

export const SLOT_HEIGHT = 44 // pixels
