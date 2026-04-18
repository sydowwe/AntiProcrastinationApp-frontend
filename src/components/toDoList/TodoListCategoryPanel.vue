<template>
	<div class="h-100 d-flex flex-column">
		<div class="d-flex align-center justify-space-between px-3 pt-4 pb-3">
			<span class="text-h6 font-weight-medium">{{ $t('toDoList.namedList.categories') }}</span>
			<VIconBtn
				class="d-md-none"
				icon="xmark"
				size="40"
				variant="tonal"
				@click="emit('closeDialog')"
			/>
			<VIconBtn
				class="d-none d-md-block"
				icon="plus"
				color="success"
				size="40"
				variant="tonal"
				@click="emit('openCreate')"
			/>
		</div>

		<div class="px-3 pb-2 d-flex ga-3">
			<VIconBtn
				:icon="categorySortAsc ? 'sort-alpha-up' : 'sort-alpha-down'"
				size="40"
				density="comfortable"
				variant="tonal"
				@click="emit('toggleSort')"
			/>
			<VTextField
				v-model="filterName"
				:label="$t('general.search')"
				prependInnerIcon="magnifying-glass"
				density="compact"
				clearable
				hideDetails
			/>
			<VIconBtn
				class="d-md-none"
				icon="plus"
				color="success"
				size="40"
				variant="tonal"
				@click="emit('openCreate')"
			/>
		</div>

		<VDivider class="my-2" />

		<div
			class="cat-list pa-2"
			style="flex: 1; overflow-y: auto; min-height: 0"
		>
			<div
				class="cat-item"
				:class="{ 'cat-item--active': selectedCategoryId === null }"
				@click="emit('selectCategory', null)"
			>
				<span class="cat-item__bar" />
				<VIcon
					icon="list"
					size="16"
					class="cat-item__icon"
				/>
				<span class="cat-item__name">{{ $t('general.all') }}</span>
			</div>

			<div
				v-for="cat in categories"
				:key="cat.id"
				class="cat-item"
				:class="{ 'cat-item--active': selectedCategoryId === cat.id }"
				@click="emit('selectCategory', cat.id)"
			>
				<span
					class="cat-item__bar"
					:style="cat.color && cat.color !== 'default' ? { backgroundColor: getBgColor(cat.color) } : {}"
				/>
				<div class="cat-item__prepend">
					<VIcon
						v-if="cat.icon"
						:icon="cat.icon"
						size="16"
						:color="getTextColor(cat.color)"
					/>
					<span
						v-else
						class="cat-item__dot"
						:style="{ backgroundColor: getBgColor(cat.color) }"
					/>
				</div>
				<span class="cat-item__name">{{ cat.name }}</span>
				<span
					v-if="cat.listCount !== null"
					class="cat-item__count"
				>
					{{ cat.listCount }}
				</span>
				<div
					v-if="cat.id !== -1"
					class="cat-item__actions"
					@click.stop
				>
					<VIconBtn
						size="32"
						variant="tonal"
						icon="pen"
						@click.stop="emit('openEdit', cat)"
					>
						<VIcon size="16" />
					</VIconBtn>
					<VIconBtn
						size="32"
						variant="tonal"
						icon="trash"
						@click.stop="emit('confirmDelete', cat)"
					>
						<VIcon size="16" />
					</VIconBtn>
				</div>
			</div>
		</div>
		<VSwitch
			v-model="hideEmptyCategories"
			class="mt-auto ml-auto mr-4 mb-2"
			label="Hide empty"
			color="primary"
			hideDetails
			density="compact"
		/>
	</div>
</template>

<script setup lang="ts">
	import type { TodoListCategoryEntity } from '@/dtos/response/todoList/TodoListCategoryEntity.ts'
	import { useColor } from '@/utils/colorPalette.ts'

	defineProps<{
		categories: TodoListCategoryEntity[]
		selectedCategoryId: number | null
		categorySortAsc: boolean
	}>()

	const emit = defineEmits<{
		selectCategory: [id: number | null]
		closeDialog: false
		openCreate: []
		openEdit: [cat: TodoListCategoryEntity]
		confirmDelete: [cat: TodoListCategoryEntity]
		toggleSort: []
	}>()

	const hideEmptyCategories = defineModel<boolean>('hideEmpty', { default: false })

	const filterName = defineModel<string | null>('filterName', { default: null })

	const { getBgColor, getTextColor } = useColor()
</script>

<style scoped>
	.cat-item {
		position: relative;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 9px 10px 9px 16px;
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.15s ease;
		min-height: 44px;
		user-select: none;
	}

	.cat-item:hover {
		background: rgba(var(--v-theme-on-surface), 0.05);
	}

	.cat-item--active {
		background: rgba(var(--v-theme-primary), 0.08);
	}

	.cat-item--active .cat-item__name {
		font-weight: 600;
	}

	.cat-item__bar {
		position: absolute;
		left: 0;
		top: 50%;
		width: 3px;
		height: 20px;
		border-radius: 0 3px 3px 0;
		background: rgb(var(--v-theme-primary));
		transform: translateY(-50%) scaleY(0);
		transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.cat-item--active .cat-item__bar {
		transform: translateY(-50%) scaleY(1);
	}

	.cat-item__icon {
		flex-shrink: 0;
		opacity: 0.65;
	}

	.cat-item__prepend {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		flex-shrink: 0;
	}

	.cat-item__dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		display: block;
	}

	.cat-item__name {
		flex: 1;
		font-size: 0.875rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: color 0.15s;
	}

	.cat-item__count {
		font-size: 0.7rem;
		font-weight: 600;
		padding: 2px 7px;
		border-radius: 20px;
		background: rgba(var(--v-theme-on-surface), 0.08);
		color: rgba(var(--v-theme-on-surface), 0.55);
		flex-shrink: 0;
	}

	.cat-item__actions {
		display: flex;
		gap: 8px;
		opacity: 0;
		transition: opacity 0.15s;
		flex-shrink: 0;
	}

	.cat-item:hover .cat-item__actions {
		opacity: 1;
	}

	@media (hover: none) {
		.cat-item__actions {
			opacity: 1;
		}
	}
</style>
