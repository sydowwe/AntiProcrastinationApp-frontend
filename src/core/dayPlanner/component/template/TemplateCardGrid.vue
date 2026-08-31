<template>
	<VRow>
		<VCol
			v-for="template in templates"
			:key="template.id"
			cols="12"
			md="6"
			lg="4"
		>
			<div
				:ref="el => registerCard(el, template.id, section, () => templates.map(t => t.id))"
				class="template-drag-wrapper"
				:class="{
					'h-100': section === 'active',
					'drag-over-before':
						dragOverState?.templateId === template.id && dragOverState?.position === 'before',
					'drag-over-after': dragOverState?.templateId === template.id && dragOverState?.position === 'after',
				}"
			>
				<TemplateCard
					:template
					:isPinned
					:tasks="templateTasksMap.get(template.id)"
					:compareMode
					:isCompareSelected="compareSelection.includes(template.id)"
					@click="emit('click', template.id)"
					@edit="emit('edit', template)"
					@delete="emit('delete', template)"
					@togglePin="emit('togglePin', template.id)"
					@toggleActive="emit('toggleActive', template)"
					@applyToday="emit('applyToday', template.id)"
					@duplicate="emit('duplicate', template)"
					@toggleCompare="emit('toggleCompare', template.id)"
				/>
			</div>
		</VCol>
	</VRow>
</template>

<script setup lang="ts">
	import type { ComponentPublicInstance } from 'vue'
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import type { TemplatePlannerTask } from '@/core/dayPlanner/dto/response/template/TemplatePlannerTask.ts'
	import TemplateCard from '@/core/dayPlanner/component/template/TemplateCard.vue'

	const {
		templates,
		section,
		isPinned,
		templateTasksMap,
		compareMode,
		compareSelection,
		registerCard,
		dragOverState,
	} = defineProps<{
		templates: TaskPlannerDayTemplate[]
		section: 'pinned' | 'active' | 'inactive'
		isPinned: boolean
		templateTasksMap: Map<number, TemplatePlannerTask[]>
		compareMode: boolean
		compareSelection: number[]
		registerCard: (
			el: Element | ComponentPublicInstance | null,
			templateId: number,
			section: 'pinned' | 'active' | 'inactive',
			getIds: () => number[],
		) => void
		dragOverState: { templateId: number; position: 'before' | 'after' } | null
	}>()

	const emit = defineEmits<{
		click: [templateId: number]
		edit: [template: TaskPlannerDayTemplate]
		delete: [template: TaskPlannerDayTemplate]
		togglePin: [templateId: number]
		toggleActive: [template: TaskPlannerDayTemplate]
		applyToday: [templateId: number]
		duplicate: [template: TaskPlannerDayTemplate]
		toggleCompare: [templateId: number]
	}>()
</script>

<style scoped>
	.template-drag-wrapper {
		position: relative;
		cursor: grab;
	}

	.template-drag-wrapper:active {
		cursor: grabbing;
	}

	.template-drag-wrapper.drag-over-before::before,
	.template-drag-wrapper.drag-over-after::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		height: 3px;
		background: rgb(var(--v-theme-primary));
		border-radius: 2px;
		z-index: 10;
	}

	.template-drag-wrapper.drag-over-before::before {
		top: 0;
	}

	.template-drag-wrapper.drag-over-after::after {
		bottom: 0;
	}
</style>
