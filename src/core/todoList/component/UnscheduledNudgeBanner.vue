<template>
	<VRow class="flex-grow-0">
		<VCol cols="12">
			<VAlert
				variant="tonal"
				color="warning"
				density="compact"
				icon="calendar-xmark"
				closable
				@click:close="emit('dismiss')"
			>
				<div class="d-flex align-center justify-space-between flex-wrap ga-2">
					<span>
						{{ $t('toDoList.unscheduledTasksCount', { count }, count) }}
					</span>
					<VBtn
						size="small"
						color="warningDark"
						@click="emit('scheduleNow')"
					>
						{{ $t('toDoList.scheduleNow') }}
					</VBtn>
				</div>
			</VAlert>
		</VCol>
	</VRow>
</template>

<script setup lang="ts">
	defineProps<{
		count: number
	}>()

	const emit = defineEmits<{
		scheduleNow: []
		dismiss: []
	}>()
</script>
