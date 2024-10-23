import {SelectOption} from '@/classes/SelectOption';
import {uncapitalizeString} from '@/scripts/helperMethods';

export class SortByRequest {
	constructor(
		public key: string,
		public isDesc: boolean = false) {
	}
}

export class VSortItem {
	constructor(
		public key: string,
		public order?: boolean | 'asc' | 'desc') {
	}
}

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

export enum TableCellType {
	TEXT = 'Text',
	NUMBER = 'Number',
	DECIMAL = 'Decimal',
	BOOLEAN = 'Boolean',
	SELECT = 'Select',
	DATE = 'Date',
	DATETIME = 'Datetime',
	IMAGE = 'Image',
	TEXTAREA = 'Textarea',
}

export function isNumericCell(cellType: TableCellType) {
	return cellType === TableCellType.NUMBER || cellType === TableCellType.DECIMAL;
}

export class EditableColumnMetadata {
	constructor(
		public key: string,
		public type: TableCellType,
		public isReadOnly: boolean,
		public options: SelectOption[] | null = null,
	) {
	}
	static fromObject(object: any) {
		const {
			key = null,
			type = TableCellType.TEXT,
			isReadOnly = false,
			options = null,
		} = object;

		return new EditableColumnMetadata(uncapitalizeString(key), type, isReadOnly, options);
	}

	static listFromObjects(objects: any[]): EditableColumnMetadata[] {
		return objects.map((item: object) => EditableColumnMetadata.fromObject(item));
	}
}

export const NullFalseTrueCheckboxStates: (boolean | null)[] = [null, false, true] ;