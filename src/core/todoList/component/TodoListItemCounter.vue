<template>
	<div class="pl-3 d-flex flex-column ga-1 align-center justify-center">
		<VHover>
			<template #default="{ isHovering, props: vHoverProps }">
				<VIconBtn
					v-if="isHovering"
					v-bind="vHoverProps"
					icon="minus"
					color="white"
					variant="tonal"
					size="35"
					:title="decreaseLabel"
					:aria-label="decreaseLabel"
					@click.stop="emit('minus')"
				>
					<VIcon size="22" />
				</VIconBtn>
				<VProgressLinear
					v-else
					v-bind="vHoverProps"
					:title="increaseLabel"
					:aria-label="increaseLabel"
					color="neutral-400"
					:modelValue="((doneCount ?? 0) / (totalCount ?? 1)) * 100"
					height="35"
					bgOpacity="0.3"
					style="width: 35px; border: 1px solid #777; border-radius: 4px"
					@click.stop="emit('increment')"
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
			</template>
		</VHover>
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
	// tech unnamed. Each names the current state *and* what a click does — the two branches are two
	// different actions on the same visual control.
	const increaseLabel = computed(() =>
		t('toDoList.counterIncrease', { done: doneCount ?? 0, total: totalCount ?? 0 }),
	)
	const decreaseLabel = computed(() =>
		t('toDoList.counterDecrease', { done: doneCount ?? 0, total: totalCount ?? 0 }),
	)
</script>
