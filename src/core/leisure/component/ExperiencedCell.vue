<template>
	<div class="d-flex justify-center">
		<VChip
			v-if="isAnchored === true"
			size="small"
			color="successDark"
			variant="tonal"
			prependIcon="circle-check"
			link
			role="button"
			:title="$t('leisure.experienced.openAnchorHint')"
			:aria-label="`${$t('leisure.experienced.openAnchorHint')}: ${activityName}`"
			@click="openAnchor"
		>
			{{ $t('leisure.experienced.done') }}
		</VChip>
		<VBtn
			v-else-if="eligible"
			size="x-small"
			variant="tonal"
			color="secondaryOutline"
			prependIcon="circle-check"
			@click="capture"
		>
			{{ $t('leisure.experienced.iDidThis') }}
		</VBtn>
		<span
			v-else
			class="text-medium-emphasis"
		>
			—
		</span>
	</div>
</template>

<script setup lang="ts">
	import { useRouter } from 'vue-router'
	import { useAnchorCapture } from '@/core/leisure/composable/useAnchorCapture.ts'

	// `isAnchored === null` means the API does not carry completion yet, so the row is shown as
	// capturable rather than as done — an action that always works, next to a state we cannot claim.
	const {
		activityId,
		activityName,
		isAnchored,
		memoryAnchorId = null,
		eligible = true,
	} = defineProps<{
		activityId: number
		activityName: string
		isAnchored: boolean | null
		/** The anchor this row produced, when the API says which. Without it the link opens the filtered list only. */
		memoryAnchorId?: number | null
		/** False for rows that can never be anchored — a repeatable backlog entry. */
		eligible?: boolean
	}>()
	const emit = defineEmits<{ anchored: [] }>()

	const router = useRouter()
	const { captureAnchor } = useAnchorCapture()

	async function capture() {
		if (await captureAnchor(activityId, activityName)) emit('anchored')
	}

	// The reciprocal of MemoryAnchorTable's source chip. By id, not name: the name filter is a contains
	// match, so it would also catch "Read a Novel II", and a bookmarked link would break on a rename.
	// `anchorId` makes the view open that exact anchor; `activityId` stays as the fallback list behind it,
	// which is what the user lands on when the anchor has since been deleted.
	function openAnchor() {
		const query: Record<string, string> = { activityId: String(activityId) }
		if (memoryAnchorId != null) query.anchorId = String(memoryAnchorId)
		void router.push({ name: 'leisureMemoryAnchors', query })
	}
</script>
