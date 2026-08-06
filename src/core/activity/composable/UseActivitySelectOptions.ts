import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { Role } from '@/core/activity/dto/response/Role.ts'
import { Category } from '@/core/activity/dto/response/Category.ts'
import { Activity } from '@/core/activity/dto/response/Activity.ts'

export function useActivitySelectOptions() {
	const { fetchSelectOptions: fetchRoleSelectOptions } = useEntityQuery<Role>({
		responseClass: Role,
		entityName: 'activity-role',
	})
	const { fetchSelectOptions: fetchCategorySelectOptions } = useEntityQuery<Category>({
		responseClass: Category,
		entityName: 'activity-category',
	})
	const { fetchSelectOptions: fetchActivitySelectOptions } = useEntityQuery<Activity>({
		responseClass: Activity,
		entityName: 'activity',
	})

	return {
		fetchRoleSelectOptions,
		fetchCategorySelectOptions,
		fetchActivitySelectOptions,
	}
}
