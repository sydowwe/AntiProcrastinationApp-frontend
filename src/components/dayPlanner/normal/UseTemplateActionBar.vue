<template>
<ActionBar :isShown="store.isTemplateInPreview" @cancel="store.cancelTemplatePreview">
	<template v-if="store.selectedEventIds.size > 0">
		<span class="text-textMuted font-weight-medium selection-count" style="font-size: 1rem; line-height: 1.2rem;">
			{{ store.selectedEventIds.size }} selected
		</span>
		<VBtn
			variant="outlined"
			color="error"
			@click="store.openDeleteDialog"
		>
			Delete
		</VBtn>
	</template>
	<template v-else>
		<span class="text-textMuted d-flex align-center ga-1">
			{{ store.templateInPreview!.name }}
		</span>
		<VNumberInput
			label="Offset (hours)"
			v-model="templateStartOffset"
			:min="-10"
			:max="10"
			:step="0.5"
			:precision="null"
			min-width="150px"
			max-width="150px"
			density="compact"
			controlVariant="split"
			decimalSeparator="."
			hideDetails
		></VNumberInput>
	</template>

	<!-- Slot for view-specific actions (e.g., Toggle Done) -->
	<slot name="actions" :store="store"></slot>

	<!-- Delete button -->
	<VBtn
		variant="tonal"
		color="success"
		@click="emit('applyTemplate')"
	>
		Apply
	</VBtn>
</ActionBar>
</template>

<script setup lang="ts">
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts';
import ActionBar from '@/components/general/ActionBar.vue';
import {ref, watch} from 'vue';

const store = useDayPlannerStore()

const templateStartOffset = ref<number>(0)

watch(templateStartOffset, (newVal) => {
	if (newVal !== null && newVal !== undefined) {
		store.offsetTasksFromTemplate(newVal)
	}
})

const emit = defineEmits<{
	applyTemplate: []
}>()
</script>

<style scoped>

</style>
