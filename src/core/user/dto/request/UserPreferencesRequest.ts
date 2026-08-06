import type { AvailableLocales } from '@/_common/dto/enum/AvailableLocales.ts'
import type { ThemePreference } from '@/core/user/dto/response/User.ts'

export class UserPreferencesRequest {
	constructor(
		public theme?: ThemePreference,
		public locale?: AvailableLocales,
		public timezone?: string,
		public firstDayOfWeek?: 0 | 1,
		public askBeforeDelete?: boolean,
	) {}
}
