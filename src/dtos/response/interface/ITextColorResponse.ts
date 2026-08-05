import type { IIdResponse } from '@/_common/dto/response/interface/IIdResponse.ts'

export interface ITextColorResponse extends IIdResponse {
	id: number
	text: string
	color: string
}
