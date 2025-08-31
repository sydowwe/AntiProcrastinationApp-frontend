import {SelectOption} from '@/classes/SelectOption';
import {uncapitalizeString} from '@/scripts/helperMethods';

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

export class TitleValueObject {
	constructor(
		public value: string,
		public title: string
	) {
	}
}

export class TableColumn {
	constructor(
		public key: string,
		public text: string,
		public isSortable: boolean = true) {
	}
}

export class KeyTextPair {
	constructor(
		public key: string,
		public text: string) {
	}
}

export class VSortItem {
	constructor(
		public key: string,
		public order?: boolean | 'asc' | 'desc') {
	}

	get toRequest() {
		return new SortByRequest(this.key, this.order === 'desc' || this.order === true);
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

	static fromJson(json: any) {
		const {
			key = null,
			type = TableCellType.TEXT,
			isReadOnly = false,
			options = null,
		} = json;

		return new EditableColumnMetadata(uncapitalizeString(key), type, isReadOnly, options);
	}

	static listFromJsonList(jsonList: any[]): EditableColumnMetadata[] {
		return jsonList.map((item: object) => EditableColumnMetadata.fromJson(item));
	}
}

export const NullFalseTrueCheckboxStates: (boolean | null)[] = [null, false, true];


export class ValueTitleDto<TValue extends number | string> {
	constructor(
		public value: TValue,
		public title: string
	) {
	}
}


export class DataTableDto {
	constructor(
		public page: number,
		public itemsPerPage: number,
		public sortBy: VSortItem[]
	) {
	}
}

export interface IMyRequest {
}

export interface IMyResponse {
}

export interface ICreateRequest {
}

export interface IUpdateRequest {
}


export class IdResponse implements IIdResponse {
	constructor(
		public id: number
	) {
	}

	static fromJson(json: any) {
		return new IdResponse(json.id);
	}
}

export interface IIdResponse extends IMyResponse {
	id: number;
}


export interface IFilterRequest {
}


export class SortByRequest {
	constructor(
		public key: string,
		public isDesc: boolean = false) {
	}
}

export class BaseTableRequest {
	constructor(
		public itemsPerPage: number,
		public page: number,
		public sortBy: SortByRequest[]
	) {
	}
}

export class FilteredTableRequest<TFilter extends IFilterRequest> extends BaseTableRequest {
	constructor(
		itemsPerPage: number,
		page: number,
		sortBy: SortByRequest[],
		public useFilter: boolean = false,
		public filter: TFilter | null = null,
	) {
		super(itemsPerPage, page, sortBy);
	}
}


export enum EqualityOperatorEnum {
	Equal,
	NotEqual,
	GreaterThan,
	LessThan,
	GreaterThanOrEqual,
	LessThanOrEqual,
}

export class SpFileUploadResponse {
	constructor(
		public id: string,
		public name: string,
		public webUrl: string,
		public size?: number
	) {
	}

	static fromJson(json: any) {
		return new SpFileUploadResponse(
			json.id,
			json.name,
			json.webUrl,
			json.size
		);
	}
}


