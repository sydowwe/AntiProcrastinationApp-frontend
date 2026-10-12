import { computed, ref, watch } from 'vue'
import type { Time } from '@/_common/dto/dto/Time.ts'
import { fetchSessionFit } from '@/core/activityHistory/api/activityHistoryApi.ts'
import { SessionFit } from '@/core/activityHistory/dto/response/SessionFit.ts'

/**
 * F2-07: the "Try 15 min" offer on a timer's setup. Read once per chosen activity.
 *
 * Offered only when it is **shorter** than what is set, or when nothing is set yet. A longer length would be a push
 * to do more, and the same length says nothing. Per instance, like `useEstimateFit`: the setup face that owns it
 * goes with its view.
 */
export function useSessionFit(activityId: () => number | null, currentLength: () => Time) {
	const fit = ref(new SessionFit())
	let requestedFor: number | null = null

	watch(
		activityId,
		async id => {
			requestedFor = id
			fit.value = new SessionFit()
			if (id == null) return
			const result = await fetchSessionFit(id)
			// A slower answer for an activity the user has since moved off must not land on the new one.
			if (requestedFor === id) fit.value = result
		},
		{ immediate: true },
	)

	const offer = computed(() => {
		const suggested = fit.value.suggestedTime
		if (suggested === null) return null
		const current = currentLength().getInSeconds
		return current === 0 || suggested.getInSeconds < current ? suggested : null
	})

	return { offer }
}
