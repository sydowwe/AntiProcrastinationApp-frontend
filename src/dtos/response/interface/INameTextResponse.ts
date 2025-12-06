import type {INameResponse} from '@/dtos/response/interface/INameResponse.ts';

export interface INameTextResponse extends INameResponse {
	text: string | null;
}
