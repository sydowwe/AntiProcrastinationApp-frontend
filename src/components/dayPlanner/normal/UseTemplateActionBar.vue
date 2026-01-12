<template>
<ActionBar :isShown="store.isTemplateInPreview" @cancel="store.cancelTemplatePreview">
			<span class="text-textMuted d-flex align-center ga-1">
				{{ store.templateInPreview!.name }}
			</span>
	<VNumberInput v-model="templateStartOffset"
	              :min="-10"
	              :max="10"
	              :clearable="false"
	              min-width="140px"
	              max-width="150px"
	              density="compact"
	              controlVariant="split"
	              hideDetails
	></VNumberInput>

	<!-- Slot for view-specific actions (e.g., Toggle Done) -->
	<slot name="actions" :store="store"></slot>

	<!-- Delete button -->
	<VBtn
		variant="outlined"
		color="error"
		@click="store.openDeleteDialog()"
	>
		Delete
	</VBtn>
</ActionBar>
</template>

<script setup lang="ts">
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts';
import ActionBar from '@/components/general/ActionBar.vue';
import {ref, watch} from 'vue';

const store = useDayPlannerStore()

const templateStartOffset = ref(0)

watch(templateStartOffset, (newVal) => {
	store.offsetTasksFromTemplate(newVal)
})
</script>

<style scoped>

</style>
