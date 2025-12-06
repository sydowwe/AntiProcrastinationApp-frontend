import type {INameTextResponse} from '@/dtos/response/interface/INameTextResponse.ts';

export interface INameTextIconResponse extends INameTextResponse {
	id: number;
	name: string;
	text: string | null;
	icon: string | null;
}
