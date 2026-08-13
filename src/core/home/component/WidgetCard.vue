<template>
	<VCard class="widget-card">
		<VCardTitle class="widget-card__header d-flex align-center ga-2 px-4 pt-4 pb-2">
			<span class="widget-card__title text-h6">{{ title }}</span>
			<VSpacer />
			<slot name="headerActions" />
			<!-- Named once here, for every widget: an icon-only button is otherwise announced as
				 "button" and nothing else. `title` and `aria-label` both, because the sighted
				 keyboard user needs the tooltip and the screen reader needs the label. -->
			<VIconBtn
				v-if="openRoute"
				icon="fa-up-right-from-square"
				variant="text"
				size="small"
				:title="openLabel"
				:aria-label="openLabel"
				@click="open"
			/>
		</VCardTitle>
		<!-- a background refetch says so in 2px instead of tearing the body down to a spinner -->
		<VProgressLinear
			v-if="refreshing && !loading"
			indeterminate
			color="primary"
			height="2"
		/>
		<VDivider v-else />
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
	import { computed } from 'vue'
	import { useRouter } from 'vue-router'
	import type { RouteLocationRaw } from 'vue-router'
	import { useI18n } from 'vue-i18n'

	const {
		title,
		openRoute,
		loading = false,
		refreshing = false,
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
		/**
		 * A background refetch with the previous content still on screen. Renders as a 2px bar where
		 * the header divider sits; it must never be routed into `loading`, which blanks the body.
		 */
		refreshing?: boolean
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
	const { t } = useI18n()

	const openLabel = computed(() => t('home.openFullView', { widget: title }))

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
	 *
	 * The header wraps below `md` and only there: on a phone the action side of a header (the routine
	 * widget carries a sheet per time period) is wider than the whole card, and a non-wrapping row
	 * inside an `overflow: hidden` card is a row that gets cut off. Above `md` the cards are side by
	 * side and the equal-height invariant above is what matters, so nothing wraps there.
	 */
	.widget-card__header {
		flex: 0 0 auto;
		min-height: 64px;
		flex-wrap: wrap;
		row-gap: 8px;
	}

	@media (min-width: 960px) {
		.widget-card__header {
			flex-wrap: nowrap;
		}
	}

	/* Truncating rather than wrapping is what keeps that height honest. */
	.widget-card__title {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/*
	 * Below `md` the card has no definite height to divide — HomeView stops handing one down so that
	 * the page can scroll instead of each card scrolling inside itself. `flex: 1 1 0` here would
	 * therefore collapse the body to nothing (a zero basis, and `min-height: 0` removes the
	 * content-based floor that would otherwise save it), leaving a header and no widget. So the body
	 * takes its content height and the document does the scrolling.
	 *
	 * `min-height` is for the states that centre themselves in the body — spinner, error, empty —
	 * which are a couple of lines tall and would otherwise sit in a sliver of a card.
	 */
	.widget-card__body {
		flex: 0 0 auto;
		min-height: 7rem;
		overflow: visible;
	}

	/*
	 * From `md` up the card is inside a fixed-height band. `flex: 1 1 0` + `min-height: 0` is the
	 * pair that lets the body shrink below its content and hand the overflow to its own scrollbar
	 * instead of pushing the card past the card frame. Deliberately not a flex container: children
	 * keep normal block flow, so an element with its own height (the pie chart) cannot be squashed by
	 * flex shrinking.
	 */
	@media (min-width: 960px) {
		.widget-card__body {
			flex: 1 1 0;
			min-height: 0;
			overflow: hidden;
		}

		.widget-card__body--scrollable {
			overflow-y: auto;
		}
	}
</style>
