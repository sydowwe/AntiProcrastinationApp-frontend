import type {IIdResponse} from '@/dtos/response/interface/IIdResponse.ts';

export interface ITextColorResponse extends IIdResponse {
	id: number;
	text: string;
	color: string;
}
