import { useI18n } from 'vue-i18n'
import type { RoleCategoryTarget } from '@/core/activityTracking/dto/RoleCategoryTarget.ts'

export function useRoleCategoryTarget() {
	const { t } = useI18n()

	/** "Role: Work · Category: Deep work", or `null` for a rule aimed elsewhere. An API predating the names
	 *  sends ids alone, which print as `#id` rather than leaving the target blank. */
	function roleCategoryTargetLabel(target: RoleCategoryTarget): string | null {
		const parts: string[] = []
		if (target.roleId != null) {
			parts.push(t('activityTracking.settings.roleTarget', { name: target.roleName ?? `#${target.roleId}` }))
		}
		if (target.categoryId != null) {
			parts.push(
				t('activityTracking.settings.categoryTarget', { name: target.categoryName ?? `#${target.categoryId}` }),
			)
		}
		return parts.length ? parts.join(' · ') : null
	}

	return { roleCategoryTargetLabel }
}
