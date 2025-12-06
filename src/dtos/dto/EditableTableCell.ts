import {EditableColumnMetadata} from './EditableColumnMetadata.ts';

export class EditableTableCell {
	constructor(
		public id: number,
		public column: EditableColumnMetadata,
		public value: string | string[] | number | boolean | null,
		public isEdit: boolean = false,
		public newValue: string | null = null,
	) {
	}
}
