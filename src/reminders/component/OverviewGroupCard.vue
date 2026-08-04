<template>
	<VCard
		class="d-flex flex-column pa-4 flex-grow-1"
		style="min-width: 280px; flex-basis: 45%"
	>
		<div class="d-flex align-center ga-3 mb-3">
			<VIcon
				:icon
				color="primary"
				size="22"
			/>
			<span class="text-subtitle-1 font-weight-medium">{{ title }}</span>
		</div>

		<div
			v-if="groups.length === 0"
			class="text-medium-emphasis text-body-2 py-2"
		>
			{{ $t('reminderDashboard.overview.noUpcoming') }}
		</div>

		<VList
			v-else
			density="compact"
			class="py-0"
		>
			<VListItem
				v-for="group in groups"
				:key="group.label"
				class="px-0"
			>
				<div class="d-flex align-center justify-space-between ga-3">
					<span class="text-body-2 text-truncate">{{ group.label }}</span>
					<VChip
						size="small"
						variant="tonal"
						color="primaryOutline"
					>
						{{ group.count }}
					</VChip>
				</div>
			</VListItem>
		</VList>
	</VCard>
</template>

<script setup lang="ts">
	import type { OverviewGroupCount } from '@/core/reminders/dto/response/ReminderOverviewResponse.ts'

	const { groups } = defineProps<{ title: string; icon: string; groups: OverviewGroupCount[] }>()
</script>
