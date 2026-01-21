import type {IMyResponse} from '@/dtos/response/interface/IMyResponse.ts';

export interface IIdResponse extends IMyResponse {
	id: number;
}