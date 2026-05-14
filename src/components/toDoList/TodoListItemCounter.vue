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
					@click.stop="emit('minus')"
				>
					<VIcon size="22" />
				</VIconBtn>
				<VProgressLinear
					v-else
					v-bind="vHoverProps"
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
	const { doneCount, totalCount, isDone } = defineProps<{
		doneCount: number | null
		totalCount: number | null
		isDone: boolean
	}>()

	const emit = defineEmits<{
		minus: []
		increment: []
	}>()
</script>
