<template>
	<VTooltip
		:text="canUndo ? `Undo: ${nextUndoDescription}` : 'Nothing to undo'"
		location="bottom"
	>
		<template #activator="{ props: tooltipProps }">
			<VBtn
				v-bind="tooltipProps"
				variant="tonal"
				color="secondaryOutline"
				:disabled="!canUndo"
				@click="emit('click')"
			>
				<VIcon icon="rotate-left" />
				<VBadge
					v-if="stackSize > 0"
					:content="stackSize"
					color="primary"
					floating
				/>
			</VBtn>
		</template>
	</VTooltip>
</template>

<script setup lang="ts">
	defineProps<{
		canUndo: boolean
		stackSize: number
		nextUndoDescription: string | null
	}>()

	const emit = defineEmits<{ click: [] }>()
</script>
