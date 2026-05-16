import { AvailableLocales } from '@/dtos/enum/AvailableLocales.ts'

export type ThemePreference = 'light' | 'dark' | 'system'

export class User {
	constructor(
		public id: number = 0,
		public email: string = '',
		public twoFactorEnabled: boolean = false,
		public createdAt: string = '',
		public lastLoginAt: string | null = null,
		public theme: ThemePreference = 'system',
		public locale: AvailableLocales = AvailableLocales.SK,
		public timezone: string = 'Europe/Bratislava',
		public firstDayOfWeek: 0 | 1 = 1,
		public askBeforeDelete: boolean = true,
	) {}

	static fromJson(o: any) {
		const {
			id = 0,
			email = '',
			twoFactorEnabled = false,
			createdAt = '',
			lastLoginAt = null,
			theme = 'system',
			locale = AvailableLocales.SK,
			timezone = 'Europe/Bratislava',
			firstDayOfWeek = 1,
			askBeforeDelete = true,
		} = o
		return new User(
			id,
			email,
			twoFactorEnabled,
			createdAt,
			lastLoginAt,
			theme,
			locale,
			timezone,
			firstDayOfWeek,
			askBeforeDelete,
		)
	}
}
