import {useEntityQuery} from '@/composables/general/CrudComposition.ts';
import {Role} from '@/dtos/response/activity/Role.ts';
import {Category} from '@/dtos/response/activity/Category.ts';
import {Activity} from '@/dtos/response/activity/Activity.ts';

export function useActivitySelectOptions() {
	const {fetchSelectOptions: fetchRoleSelectOptions} = useEntityQuery<Role>({responseClass: Role, entityName: 'activity-role'})
	const {fetchSelectOptions: fetchCategorySelectOptions} = useEntityQuery<Category>({responseClass: Category, entityName: 'activity-category'})
	const {fetchSelectOptions: fetchActivitySelectOptions} = useEntityQuery<Activity>({responseClass: Activity, entityName: 'activity'})


	return {
		fetchRoleSelectOptions,
		fetchCategorySelectOptions,
		fetchActivitySelectOptions,
	}
}