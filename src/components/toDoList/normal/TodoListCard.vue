<template>
	<VCard
		elevation="1"
		class="list-card"
		@click="router.push({ name: 'toDoListDetail', params: { id: list.id } })"
	>
		<div class="pa-4">
			<div class="d-flex align-center ga-3">
				<div
					v-if="list.icon"
					class="list-icon-wrap"
				>
					<VIcon
						:icon="list.icon"
						size="20"
						color="primary"
					/>
				</div>
				<div
					class="flex-grow-1"
					style="min-width: 0"
				>
					<div
						class="text-subtitle-1 font-weight-medium"
						style="line-height: 1.3"
					>
						{{ list.name }}
					</div>
					<div
						v-if="list.description"
						class="text-caption text-medium-emphasis mt-1"
						style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap"
					>
						{{ list.description }}
					</div>
				</div>
				<div class="d-flex ga-2 flex-shrink-0">
					<VIconBtn
						icon="pen"
						size="40"
						color="secondaryOutline"
						variant="tonal"
						@click.stop="emit('openEdit', list)"
					/>
					<VIconBtn
						icon="trash"
						size="40"
						color="default"
						variant="tonal"
						@click.stop="emit('confirmDelete', list)"
					/>
				</div>
			</div>

			<div
				v-if="list.itemCount !== null"
				class="mt-3"
			>
				<div class="d-flex justify-space-between align-center mb-1">
					<span class="text-caption text-medium-emphasis">
						{{ list.completedCount ?? 0 }} / {{ list.itemCount }} done
					</span>
					<span class="text-caption font-weight-medium">{{ progressPercent }}%</span>
				</div>
				<VProgressLinear
					:modelValue="progressPercent"
					color="primary"
					bgColor="surface-variant"
					rounded
					height="4"
				/>
			</div>
		</div>
	</VCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useRouter } from 'vue-router'
	import type { TodoListEntity } from '@/dtos/response/todoList/TodoListEntity.ts'

	const { list } = defineProps<{ list: TodoListEntity }>()
	const emit = defineEmits<{ openEdit: [list: TodoListEntity]; confirmDelete: [list: TodoListEntity] }>()

	const router = useRouter()

	const progressPercent = computed(() =>
		list.itemCount > 0 ? Math.round(((list.completedCount ?? 0) / list.itemCount) * 100) : 0,
	)
</script>

<style scoped>
	.list-card {
		cursor: pointer;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease,
			border-color 0.2s ease;
	}

	.list-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 28px -4px rgba(0, 0, 0, 0.28) !important;
	}

	.list-icon-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		flex-shrink: 0;
		background: rgba(var(--v-theme-primary), 0.1);
	}
</style>
