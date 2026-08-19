import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { Category } from '@/core/activity/dto/response/Category.ts'
import { invalidatingActivityOptions, useActivityOptionsStore } from '@/core/activity/store/activityOptionsStore.ts'

export function useActivityCategoryCrud() {
	const url = 'activity-category'
	const { fetchById, fetchAll } = useEntityQuery<Category>({
		responseClass: Category,
		entityName: url,
	})
	const { createWithResponse, create, update, deleteEntity } = useEntityCommand<Category, any, any>({
		responseClass: Category,
		entityName: url,
	})

	return {
		fetchById,
		fetchAll,
		/** Cached and shared — see `activityOptionsStore`. */
		fetchSelectOptions: () => useActivityOptionsStore().ensureOptions('category'),
		createWithResponse: invalidatingActivityOptions('category', createWithResponse),
		create: invalidatingActivityOptions('category', create),
		update: invalidatingActivityOptions('category', update),
		deleteEntity: invalidatingActivityOptions('category', deleteEntity),
	}
}
