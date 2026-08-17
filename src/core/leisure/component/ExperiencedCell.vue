<template>
	<div class="d-flex justify-center">
		<VChip
			v-if="isAnchored === true"
			size="small"
			color="successDark"
			variant="tonal"
			prependIcon="circle-check"
			link
			:title="$t('leisure.experienced.openAnchorHint')"
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
		eligible = true,
	} = defineProps<{
		activityId: number
		activityName: string
		isAnchored: boolean | null
		/** False for rows that can never be anchored — a repeatable backlog entry. */
		eligible?: boolean
	}>()
	const emit = defineEmits<{ anchored: [] }>()

	const router = useRouter()
	const { captureAnchor } = useAnchorCapture()

	async function capture() {
		if (await captureAnchor(activityId, activityName)) emit('anchored')
	}

	// The reciprocal of MemoryAnchorTable's source chip. The anchors table filters by activity name,
	// which is the handle both tables already share — no new endpoint, and the URL stays shareable.
	function openAnchor() {
		void router.push({ name: 'leisureMemoryAnchors', query: { activityName } })
	}
</script>
