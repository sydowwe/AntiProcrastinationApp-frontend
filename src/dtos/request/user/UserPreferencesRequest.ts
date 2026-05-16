import type { AvailableLocales } from '@/dtos/enum/AvailableLocales.ts'
import type { ThemePreference } from '@/dtos/response/user/User.ts'

export class UserPreferencesRequest {
	constructor(
		public theme?: ThemePreference,
		public locale?: AvailableLocales,
		public timezone?: string,
		public firstDayOfWeek?: 0 | 1,
		public askBeforeDelete?: boolean,
	) {}
}
