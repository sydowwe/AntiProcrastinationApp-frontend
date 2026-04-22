import { useEntityQuery } from '@/api/base/useEntityQuery.ts'
import { useEntityCommand } from '@/api/base/useEntityCommand.ts'
import { Category } from '@/dtos/response/activity/Category.ts'

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

	return { fetchById, fetchAll, createWithResponse, create, update, deleteEntity }
}
