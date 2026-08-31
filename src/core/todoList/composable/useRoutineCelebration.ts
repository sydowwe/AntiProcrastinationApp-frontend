import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { useRoutineRunLabel } from '@/core/todoList/composable/useRoutineRunLabel.ts'
import type { RoutineTimePeriodEntity } from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'

// Celebration is reserved for genuinely rare events. Firing on every completed group habituates
// into meaninglessness within weeks — a daily group would celebrate every single day.
const RUN_MILESTONES = [7, 30, 90, 180, 365]

export function useRoutineCelebration() {
	const { t } = useI18n()
	const { showSuccessSnackbar } = useSnackbar()
	const { runLabel } = useRoutineRunLabel()

	const showConfetti = ref(false)
	const confettiKey = ref(0)

	function triggerConfetti() {
		confettiKey.value++
		showConfetti.value = true
		setTimeout(() => {
			showConfetti.value = false
		}, 2500)
	}

	function celebrateIfRare(before: RoutineTimePeriodEntity, after: RoutineTimePeriodEntity) {
		if (after.streak <= before.streak) return
		const groupName = after.text ?? ''
		// A new longest run — only once the user has an established record to pass.
		if (before.bestStreak > 0 && after.streak > before.bestStreak) {
			triggerConfetti()
			showSuccessSnackbar(
				t('routineTodoList.newLongestRun', {
					group: groupName,
					run: runLabel(after.streak, after.lengthInDays),
				}),
			)
			return
		}
		const milestone = RUN_MILESTONES.find(m => before.streak < m && after.streak >= m)
		if (milestone !== undefined) {
			triggerConfetti()
			showSuccessSnackbar(
				t('routineTodoList.milestoneReached', {
					group: groupName,
					run: runLabel(milestone, after.lengthInDays),
				}),
			)
		}
	}

	return { showConfetti, confettiKey, celebrateIfRare }
}
