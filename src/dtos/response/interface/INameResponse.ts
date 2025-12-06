import type {IIdResponse} from '@/dtos/response/interface/IIdResponse.ts';

export interface INameResponse extends IIdResponse {
	name: string;
}
