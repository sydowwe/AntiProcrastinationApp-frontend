export class QuickActivityToolsDto {
	constructor(
		public id: number,
		public name: string,
		public text: string | null,
		public categoryId: number | null
	) {
	}
	static get createEmpty() {
		return new QuickActivityToolsDto(0, '', null, null);
	}
}
