export class GuideLine {
	constructor(
		public minute: number,
		public gridRow: number,
		public showLabel: boolean,
		public label: string = `${minute}m`
	) {}
}
