<template>
	<VTooltip
		:text="label"
		location="bottom"
	>
		<template #activator="{ props: tooltipProps }">
			<VBtn
				v-bind="tooltipProps"
				variant="tonal"
				color="secondaryOutline"
				:disabled="!canUndo"
				:aria-label="label"
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
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'

	const { canUndo, nextUndoDescription } = defineProps<{
		canUndo: boolean
		stackSize: number
		nextUndoDescription: string | null
	}>()

	const emit = defineEmits<{ click: [] }>()

	const i18n = useI18n()

	// Doubles as the tooltip and the accessible name: the button renders an icon and a count badge, so
	// without it the only thing assistive tech had to go on was the badge number.
	const label = computed(() =>
		canUndo ? `${i18n.t('general.undo')}: ${nextUndoDescription}` : i18n.t('general.nothingToUndo'),
	)
</script>
