import { useI18n } from 'vue-i18n'
import { useDialog } from '@/_common/composable/general/useDialog.ts'
import RoutineToDoListForm from '@/core/todoList/component/routine/dialog/RoutineToDoListForm.vue'
import RoutineGroupHistoryBody from '@/core/todoList/component/routine/dialog/RoutineGroupHistoryBody.vue'
import type { RoutineTodoListItemRequest } from '@/core/todoList/dto/request/RoutineTodoListItemRequest.ts'
import type { RoutineTodoListItemEntity } from '@/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts'
import type { RoutineTimePeriodEntity } from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'

interface RoutineToDoListFormResult {
	entity: RoutineTodoListItemEntity | null
	request: RoutineTodoListItemRequest
}

export function useRoutineDialogs(
	add: (request: RoutineTodoListItemRequest) => Promise<RoutineTodoListItemEntity>,
	edit: (entity: RoutineTodoListItemEntity, request: RoutineTodoListItemRequest) => Promise<void>,
) {
	const { t } = useI18n()
	const { openDialog } = useDialog()

	function openHistoryDialog(timePeriod: RoutineTimePeriodEntity) {
		const name = timePeriod.text ?? t('routineTodoList.history')
		openDialog({
			component: RoutineGroupHistoryBody,
			componentProps: { timePeriod },
			dialogProps: {
				title: t('routineTodoList.historyDialogTitle', { group: name, days: timePeriod.lengthInDays }),
				hasConfirmBtn: false,
				closeBtnText: t('general.close'),
				isSmall: false,
			},
		})
	}

	async function openCreateDialog() {
		const result = await openDialog<RoutineToDoListFormResult>({
			component: RoutineToDoListForm,
			dialogProps: {
				title: t('routineTodoList.addDialogTitle'),
				confirmBtnLabel: t('general.add'),
			},
		})
		if (result) {
			await add(result.request)
		}
	}

	async function openEditDialog(entityToEdit: RoutineTodoListItemEntity) {
		const result = await openDialog<RoutineToDoListFormResult>({
			component: RoutineToDoListForm,
			componentProps: { entityToEdit },
			dialogProps: {
				title: t('general.edit'),
				confirmBtnLabel: t('general.edit'),
			},
		})
		if (result?.entity) {
			await edit(result.entity, result.request)
		}
	}

	return { openCreateDialog, openEditDialog, openHistoryDialog }
}
