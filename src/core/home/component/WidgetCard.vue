<template>
	<VCard class="widget-card">
		<VCardTitle class="widget-card__header d-flex align-center ga-2 px-4 pt-4 pb-2">
			<span class="widget-card__title text-h6">{{ title }}</span>
			<VSpacer />
			<slot name="headerActions" />
			<VIconBtn
				v-if="openRoute"
				icon="fa-up-right-from-square"
				variant="text"
				size="small"
				@click="open"
			/>
		</VCardTitle>
		<VDivider />
		<VCardText
			class="widget-card__body"
			:class="[{ 'widget-card__body--scrollable': scrollable }]"
		>
			<div
				v-if="loading"
				class="d-flex align-center justify-center h-100"
			>
				<VProgressCircular indeterminate />
			</div>
			<div
				v-else-if="error"
				class="d-flex flex-column align-center justify-center ga-3 h-100 pa-4 text-center text-medium-emphasis"
			>
				<VIcon
					icon="fa-triangle-exclamation"
					size="26"
					style="opacity: 0.5"
				/>
				<span>{{ errorText ?? $t('home.loadFailed') }}</span>
				<VBtn
					variant="tonal"
					color="primaryOutline"
					size="small"
					prependIcon="fa-rotate-right"
					@click="emit('retry')"
				>
					{{ $t('home.retry') }}
				</VBtn>
			</div>
			<div
				v-else-if="empty"
				class="d-flex flex-column align-center justify-center ga-3 h-100 text-center text-medium-emphasis"
			>
				<slot name="empty">{{ emptyText }}</slot>
			</div>
			<slot v-else />
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
	import { useRouter } from 'vue-router'
	import type { RouteLocationRaw } from 'vue-router'

	const {
		title,
		openRoute,
		loading = false,
		error = false,
		empty = false,
		emptyText,
		errorText,
		scrollable = true,
	} = defineProps<{
		/** Already translated — the shell does no lookups. */
		title: string
		/**
		 * Where the `fa-up-right-from-square` button goes. One `RouteLocationRaw` rather than a
		 * name/params pair because the widgets are split between `params` and `query`.
		 */
		openRoute?: RouteLocationRaw
		loading?: boolean
		/** Takes priority over `empty` — a failed request must never render as "nothing here". */
		error?: boolean
		empty?: boolean
		/** Simple empty state. Use the `#empty` slot when it needs more than a line of text. */
		emptyText?: string
		/** Shown next to the Retry button. Falls back to a generic message when omitted. */
		errorText?: string
		/** Off for bodies that size their own content to the card instead of scrolling. */
		scrollable?: boolean
	}>()

	const emit = defineEmits<{ retry: [] }>()

	const router = useRouter()

	function open() {
		if (openRoute) router.push(openRoute)
	}
</script>

<style scoped>
	/*
	 * Fills the column it is placed in and never asks for a fixed pixel height — the home band is
	 * `flex: 0 1 clamp(...)` and can resolve smaller than any number written here would assume.
	 */
	.widget-card {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/*
	 * One height for every widget header, so cards sitting side by side line up by construction
	 * rather than by their contents happening to measure the same.
	 */
	.widget-card__header {
		flex: 0 0 auto;
		min-height: 64px;
	}

	/* Truncating rather than wrapping is what keeps that height honest. */
	.widget-card__title {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/*
	 * `flex: 1 1 0` + `min-height: 0` is the pair that lets the body shrink below its content and
	 * hand the overflow to its own scrollbar instead of pushing the card past the card frame.
	 * Deliberately not a flex container: children keep normal block flow, so an element with its
	 * own height (the pie chart) cannot be squashed by flex shrinking.
	 */
	.widget-card__body {
		flex: 1 1 0;
		min-height: 0;
		overflow: hidden;
	}

	.widget-card__body--scrollable {
		overflow-y: auto;
	}
</style>
