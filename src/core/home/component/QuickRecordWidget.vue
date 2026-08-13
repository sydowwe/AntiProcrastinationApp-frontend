<template>
	<WidgetCard
		:title="$t('home.quickRecord')"
		:scrollable="false"
	>
		<div class="quick">
			<!-- one reflex, not four equal choices -->
			<VBtn
				class="quick__primary text-none"
				color="primary"
				stacked
				prependIcon="fas fa-circle-half-stroke"
				@click="router.push({ name: 'pomodoroTimer' })"
			>
				<span class="text-subtitle-1 font-weight-bold">{{ $t('home.pomodoro') }}</span>
				<span class="text-caption">{{ $t('home.pomodoroHint') }}</span>
			</VBtn>
			<div class="quick__secondary">
				<VBtn
					v-for="option in secondaryOptions"
					:key="option.route"
					variant="tonal"
					color="secondaryOutline"
					stacked
					class="text-none"
					:prependIcon="option.icon"
					@click="router.push({ name: option.route })"
				>
					{{ $t(option.label) }}
				</VBtn>
			</div>
		</div>
	</WidgetCard>
</template>

<script setup lang="ts">
	import { useRouter } from 'vue-router'
	import WidgetCard from '@/core/home/component/WidgetCard.vue'

	const router = useRouter()

	const secondaryOptions = [
		{ route: 'timer', icon: 'fas fa-hourglass-half', label: 'home.timer' },
		{ route: 'stopwatch', icon: 'fas fa-stopwatch', label: 'home.stopwatch' },
		{ route: 'activityHistoryManual', icon: 'fas fa-pen', label: 'home.manual' },
	]
</script>

<style scoped>
	/* Fills the non-scrolling body it is handed, rather than deciding its own height. */
	.quick {
		height: 100%;
		min-height: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	/*
	 * Both rows are `flex: <n> 1 0`: they split whatever height the card has and shrink with it, so
	 * the widget fills its column exactly and can never demand more room than it is given. Avoid
	 * `block` + `height` here — `.v-btn--block` is `flex: 1 0 auto`, which in a column parent grows
	 * on the main axis, ignores `height` and pushes the row below out of the card.
	 */
	.quick__primary {
		flex: 1.4 1 0;
		width: 100%;
		min-height: 56px;
	}

	.quick__secondary {
		flex: 1 1 0;
		display: flex;
		align-items: stretch;
		gap: 8px;
		min-height: 0;
	}

	/*
	 * `flex` sizes these on the row's main axis (width). Their height comes from `align-items:
	 * stretch`, which needs an `auto` cross-size — so Vuetify's explicit `.v-btn` height has to be
	 * cleared, or the buttons keep their intrinsic ~40px and leave dead space under them.
	 */
	.quick .quick__secondary > * {
		flex: 1 1 0;
		min-width: 0;
		height: auto;
		min-height: 44px;
	}

	/*
	 * Below `md` there is no card height to divide: the body sizes to its content, so a zero
	 * flex-basis would shrink both rows to their `min-height` and the stacked label would spill out
	 * of the button. Sizing to content is the whole mobile layout — the page scrolls, the card does
	 * not — and the taller floors keep the three secondary buttons above the 44 px touch target once
	 * they are sharing a phone's width.
	 */
	@media (max-width: 959.98px) {
		.quick {
			height: auto;
		}

		.quick__primary {
			flex: 0 0 auto;
			min-height: 72px;
		}

		.quick__secondary {
			flex: 0 0 auto;
		}

		.quick .quick__secondary > * {
			min-height: 64px;
		}
	}
</style>
