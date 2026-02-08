<template>
	<div>
		<div class="text-subtitle-2 text-medium-emphasis mb-2">Pages:</div>

		<VList density="compact" class="py-0">
			<VListItem
				v-for="(page, index) in visiblePages"
				:key="index"
				:title="formatUrl(page.url)"
				class="px-2"
			>
				<template #append>
					<span class="text-medium-emphasis">
						{{ formatDuration(page.seconds) }}
					</span>
				</template>

				<VTooltip activator="parent" location="bottom">
					{{ page.url }}
				</VTooltip>
			</VListItem>
		</VList>

		<VBtn
			v-if="hasMore"
			variant="text"
			size="small"
			class="mt-2"
			@click="toggleExpanded"
		>
			{{ expanded ? '- Show less' : `+ ${remainingCount} more` }}
		</VBtn>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatDuration } from '@/utils/formatDuration'

interface PageVisit {
	url: string
	seconds: number
}

const props = defineProps<{
	pages: PageVisit[]
	maxVisible?: number
}>()

const expanded = ref(false)

const maxVisibleCount = computed(() => props.maxVisible ?? 5)

const sortedPages = computed(() =>
	[...props.pages].sort((a, b) => b.seconds - a.seconds)
)

const visiblePages = computed(() =>
	expanded.value ? sortedPages.value : sortedPages.value.slice(0, maxVisibleCount.value)
)

const hasMore = computed(() => sortedPages.value.length > maxVisibleCount.value)

const remainingCount = computed(() =>
	Math.max(0, sortedPages.value.length - maxVisibleCount.value)
)

function toggleExpanded() {
	expanded.value = !expanded.value
}

function formatUrl(url: string): string {
	try {
		const urlObj = new URL(url)
		// Return path + search + hash (everything except protocol and domain)
		const path = urlObj.pathname + urlObj.search + urlObj.hash
		// Truncate if too long
		return path.length > 50 ? path.substring(0, 47) + '...' : path
	} catch {
		// If URL parsing fails, just truncate the whole thing
		return url.length > 50 ? url.substring(0, 47) + '...' : url
	}
}
</script>
