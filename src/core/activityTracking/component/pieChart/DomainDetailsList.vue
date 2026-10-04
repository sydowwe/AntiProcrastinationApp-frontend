<template>
	<div>
		<div class="text-subtitle-2 text-medium-emphasis mb-2">{{ $t('activityTracking.pieChart.pages') }}</div>

		<VSkeletonLoader
			v-if="loading"
			type="list-item@3"
		/>

		<div
			v-else-if="error"
			class="d-flex flex-column align-center ga-2 py-2"
		>
			<p class="text-body-2 text-medium-emphasis mb-0">
				{{
					error === 'notFound'
						? $t('activityTracking.pieChart.domainDetailsNotFound')
						: $t('activityTracking.common.loadFailed')
				}}
			</p>
			<VBtn
				v-if="error !== 'notFound'"
				size="small"
				variant="outlined"
				@click="emit('retry')"
			>
				{{ $t('activityTracking.common.retry') }}
			</VBtn>
		</div>

		<template v-else-if="details">
			<p
				v-if="details.pages.length === 0"
				class="text-body-2 text-medium-emphasis mb-0"
			>
				{{ $t('activityTracking.pieChart.domainOnly') }}
			</p>

			<template v-else>
				<VList
					density="compact"
					class="py-0"
					data-testid="domain-details-pages"
				>
					<VListItem
						v-for="{ page, href } in visiblePages"
						:key="page.url"
						:href
						:target="href ? '_blank' : undefined"
						:rel="href ? 'noopener noreferrer' : undefined"
						class="px-2"
					>
						<VListItemTitle>{{ page.path }}</VListItemTitle>
						<VListItemSubtitle v-if="page.backgroundSeconds > 0">
							{{
								$t('activityTracking.pieChart.pageSplit', {
									active: fromSeconds(page.activeSeconds),
									background: fromSeconds(page.backgroundSeconds),
								})
							}}
						</VListItemSubtitle>

						<template #append>
							<span class="text-medium-emphasis ms-2">{{ fromSeconds(page.totalSeconds) }}</span>
						</template>

						<VTooltip
							activator="parent"
							location="bottom"
						>
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
					{{
						expanded
							? $t('activityTracking.common.showLess')
							: $t('activityTracking.common.showMore', { count: remainingCount })
					}}
				</VBtn>

				<div
					v-if="withoutPageSeconds > 0"
					class="d-flex justify-space-between px-2 mt-2 text-body-2 text-medium-emphasis"
				>
					<span>{{ $t('activityTracking.pieChart.withoutPage') }}</span>
					<span>{{ fromSeconds(withoutPageSeconds) }}</span>
				</div>
			</template>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import type { DomainDetailsResponse } from '@/core/activityTracking/dto/response/DomainDetailsResponse.ts'

	export type DomainDetailsError = 'notFound' | 'failed'

	const {
		details,
		loading = false,
		error = null,
		maxVisible = 5,
	} = defineProps<{
		/** `pages` is already ranked by the server, longest first. */
		details: DomainDetailsResponse | null
		loading?: boolean
		error?: DomainDetailsError | null
		maxVisible?: number
	}>()

	const emit = defineEmits<{
		retry: []
	}>()

	const expanded = ref(false)

	const pages = computed(() => details?.pages ?? [])

	const visiblePages = computed(() =>
		(expanded.value ? pages.value : pages.value.slice(0, maxVisible)).map(page => ({
			page,
			href: linkFor(page.url),
		})),
	)

	const hasMore = computed(() => pages.value.length > maxVisible)

	const remainingCount = computed(() => Math.max(0, pages.value.length - maxVisible))

	// The pages leave out entries tracked to the domain only, so whatever they do not account for had no URL.
	const withoutPageSeconds = computed(
		() => (details?.totalSeconds ?? 0) - pages.value.reduce((sum, page) => sum + page.totalSeconds, 0),
	)

	function toggleExpanded() {
		expanded.value = !expanded.value
	}

	// The URL is whatever the extension read off the tab, so only http(s) becomes a link.
	function linkFor(url: string): string | undefined {
		try {
			const { protocol } = new URL(url)
			return protocol === 'http:' || protocol === 'https:' ? url : undefined
		} catch {
			return undefined
		}
	}
</script>
