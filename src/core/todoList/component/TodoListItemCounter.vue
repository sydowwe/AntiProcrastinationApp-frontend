<template>
	<!--
		Two always-present buttons rather than a hover swap. The old `VHover` rendered the decrement
		button *instead of* the bar while hovered, so a real mouse — which dwells before it clicks —
		could only ever decrement, and a keyboard could reach neither. Clicks stop here: the counter
		is not "the row body", and the row's click is what opens the log-time dialog.
	-->
	<div
		class="pl-3 d-flex flex-column ga-1 align-center justify-center"
		@click.stop
	>
		<button
			type="button"
			class="counter-increment"
			:title="increaseLabel"
			:aria-label="increaseLabel"
			:disabled="isDone"
			@click="emit('increment')"
		>
			<VProgressLinear
				color="neutral-400"
				:modelValue="((doneCount ?? 0) / (totalCount ?? 1)) * 100"
				height="35"
				bgOpacity="0.3"
				style="width: 35px; border: 1px solid #777; border-radius: 4px"
			>
				<div class="d-flex align-center">
					<span
						v-if="!isDone"
						class="text-white"
					>
						{{ doneCount ?? 0 }}
					</span>
					<VIcon
						v-if="isDone"
						size="17"
						icon="check"
						color="success"
					/>
					<span class="text-white">/{{ totalCount }}</span>
				</div>
			</VProgressLinear>
		</button>
		<VIconBtn
			icon="minus"
			variant="text"
			size="20"
			:disabled="(doneCount ?? 0) <= 0"
			:title="decreaseLabel"
			:aria-label="decreaseLabel"
			@click="emit('minus')"
		>
			<VIcon size="12" />
		</VIconBtn>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'

	const { doneCount, totalCount, isDone } = defineProps<{
		doneCount: number | null
		totalCount: number | null
		isDone: boolean
	}>()

	const emit = defineEmits<{
		minus: []
		increment: []
	}>()

	const { t } = useI18n()

	// The control renders a number and a bar and nothing else, so without these it reached assistive
	// tech unnamed. Each names the current state *and* what a click does.
	const increaseLabel = computed(() =>
		t('toDoList.counterIncrease', { done: doneCount ?? 0, total: totalCount ?? 0 }),
	)
	const decreaseLabel = computed(() =>
		t('toDoList.counterDecrease', { done: doneCount ?? 0, total: totalCount ?? 0 }),
	)
</script>

<style scoped>
	/* A native button so the bar is focusable and Enter/Space-operable; strip the UA chrome only. */
	.counter-increment {
		display: block;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
	}

	.counter-increment:disabled {
		cursor: default;
	}
</style>
