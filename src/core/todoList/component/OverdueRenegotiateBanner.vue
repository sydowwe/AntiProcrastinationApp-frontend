<template>
	<VRow class="flex-grow-0">
		<VCol cols="12">
			<VAlert
				variant="tonal"
				color="primaryOutline"
				density="compact"
				icon="calendar-day"
			>
				<div class="d-flex align-center justify-space-between flex-wrap ga-2">
					<span>
						{{ $t('toDoList.renegotiate.message', { count: overdueCount }, overdueCount) }}
					</span>
					<div class="d-flex flex-wrap ga-2">
						<VBtn
							size="small"
							variant="tonal"
							color="primaryOutline"
							:loading="isRenegotiating"
							:disabled="disabled"
							@click="emit('reschedule', 0)"
						>
							{{ $t('toDoList.renegotiate.toToday') }}
						</VBtn>
						<VBtn
							size="small"
							variant="tonal"
							color="primaryOutline"
							:loading="isRenegotiating"
							:disabled="disabled"
							@click="emit('reschedule', 7)"
						>
							{{ $t('toDoList.renegotiate.pushWeek') }}
						</VBtn>
						<VBtn
							size="small"
							variant="text"
							color="primaryOutline"
							:disabled="disabled"
							@click="emit('reviewOneByOne')"
						>
							{{ $t('toDoList.renegotiate.reviewOneByOne') }}
						</VBtn>
					</div>
				</div>
			</VAlert>
		</VCol>
	</VRow>
</template>

<script setup lang="ts">
	defineProps<{
		overdueCount: number
		isRenegotiating: boolean
		disabled: boolean
	}>()

	const emit = defineEmits<{
		reschedule: [days: number]
		reviewOneByOne: []
	}>()
</script>
