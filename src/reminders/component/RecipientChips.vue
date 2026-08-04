<template>
	<span
		v-if="ids.length === 0"
		class="text-medium-emphasis"
	>
		—
	</span>
	<span
		v-else
		class="d-inline-flex flex-wrap ga-1 align-center"
	>
		<ChipWithIcon
			v-for="id in shownIds"
			:key="id"
			icon="user"
			color="secondaryOutline"
			size="x-small"
		>
			#{{ id }}
		</ChipWithIcon>
		<VChip
			v-if="hiddenCount > 0"
			size="x-small"
			variant="tonal"
			:title="allIdsLabel"
		>
			+{{ hiddenCount }}
		</VChip>
	</span>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'

	// Recipients carry no PII here — they are rendered as bare user-id references (#id), never names.
	const { ids, max = 5 } = defineProps<{ ids: number[]; max?: number }>()

	const shownIds = computed(() => ids.slice(0, max))
	const hiddenCount = computed(() => Math.max(0, ids.length - max))
	const allIdsLabel = computed(() => ids.map(id => `#${id}`).join(', '))
</script>
