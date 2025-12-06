import type {INameTextIconResponse} from '@/dtos/response/interface/INameTextIconResponse.ts';

export interface INameTextColorIconResponse extends INameTextIconResponse {
	id: number;
	name: string;
	text: string | null;
	icon: string | null;
	color: string | null;
}
