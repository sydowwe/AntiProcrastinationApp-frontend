export class MenuItem {
	constructor(
		public name: string,
		public variant: "flat" | "text" | "elevated" | "outlined" | "plain" | "tonal",
		public color: string,
		public icon: string,
		public action: () => void
	) {
	}
}