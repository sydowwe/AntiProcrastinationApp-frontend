<template>
	<div class="d-flex flex-column align-center justify-center text-center pa-8">
		<VIcon
			icon="fas fa-chart-column"
			size="48"
			class="text-disabled mb-2"
		/>

		<template v-if="probeState === 'hasDataOutsideWindow'">
			<p class="text-body-1 text-medium-emphasis mb-1">{{ $t('activityTracking.common.emptyInWindow') }}</p>
			<p class="text-body-2 text-medium-emphasis mb-3">
				{{
					isRangeMode
						? $t('activityTracking.common.emptyInWindowHintRange')
						: $t('activityTracking.common.emptyInWindowHint')
				}}
			</p>
			<VBtn
				size="small"
				variant="outlined"
				@click="emit('widenWindow')"
			>
				{{
					isRangeMode
						? $t('activityTracking.common.showWholeDays')
						: $t('activityTracking.common.showWholeDay')
				}}
			</VBtn>
		</template>

		<template v-else-if="probeState === 'emptyFullDay'">
			<p class="text-body-1 text-medium-emphasis mb-1">
				{{ isRangeMode ? $t('activityTracking.common.emptyRange') : $t('activityTracking.common.emptyDay') }}
			</p>
			<RouterLink
				v-if="settingsRouteName"
				class="text-caption text-medium-emphasis"
				:to="{ name: settingsRouteName, params: { tableView: 'distinctEntries' } }"
			>
				{{ $t('activityTracking.common.checkSourceSettings') }}
			</RouterLink>
		</template>

		<template v-else>
			<p class="text-body-1 text-medium-emphasis">{{ $t('activityTracking.common.noActivityRecorded') }}</p>
		</template>
	</div>
</template>

<script setup lang="ts">
	import type { ActivityEmptyProbeState } from '@/core/activityTracking/composable/useActivityDashboard.ts'

	const {
		probeState = 'idle',
		settingsRouteName = null,
		isRangeMode = false,
	} = defineProps<{
		probeState?: ActivityEmptyProbeState
		settingsRouteName?: 'desktopSettings' | 'androidSettings' | null
		// The probe's answers read "this day" over a single day and "this period" over a range; the
		// window-widening button likewise widens one day or every day in the span.
		isRangeMode?: boolean
	}>()

	const emit = defineEmits<{
		widenWindow: []
	}>()
</script>
