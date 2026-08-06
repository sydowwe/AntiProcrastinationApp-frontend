export class ActivityInfo {
	constructor(
		public id: number = 0,
		public name: string = '',
		public categoryName: string | null = null,
		public icon: string | null = null,
		public color: string | null = null,
	) {}

	static fromJson(object: any) {
		const { id = 0, name = '', categoryName = null, icon = null, color = null } = object
		return new ActivityInfo(id, name, categoryName, icon, color)
	}
}
