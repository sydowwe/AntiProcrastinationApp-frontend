import {useEntityQuery} from '@/composables/general/CrudComposition.ts';
import {Role} from '@/classes/Role.ts';
import {Category} from '@/classes/Category.ts';
import {Activity} from '@/classes/Activity.ts';

export function activitySelectOptions() {
	const {fetchSelectOptions: fetchRoleSelectOptions} = useEntityQuery<Role>({responseClass: Role, entityName: 'activity-role'})
	const {fetchSelectOptions: fetchCategorySelectOptions} = useEntityQuery<Category>({responseClass: Category, entityName: 'activity-category'})
	const {fetchSelectOptions: fetchActivitySelectOptions} = useEntityQuery<Activity>({responseClass: Activity, entityName: 'activity'})


	return {
		fetchRoleSelectOptions,
		fetchCategorySelectOptions,
		fetchActivitySelectOptions,
	}
}