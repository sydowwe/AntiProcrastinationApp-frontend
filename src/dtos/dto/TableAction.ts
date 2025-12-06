export class TableAction {
	constructor(
		public name: string,
		public text: string,
		public color: string,
		public variant: "text" | "flat" | "outlined" | "tonal" | "elevated" | "plain" | undefined,
		public icon: string,
		public onClick: Function
	) {
	}
}
