<template>
<VCard
	class="template-card"
	:class="{ 'inactive-template': !template.isActive }"
	elevation="2"
	@click="emit('click')"
>
	<VCardTitle class="pa-4 d-flex justify-space-between align-center">
		<div class="d-flex align-center ga-2">
			<VIcon class="ma-1" v-if="template.icon">{{ template.icon }}</VIcon>
			<span>{{ template.name }}</span>
		</div>
		<div class="d-flex align-center ga-1">
			<DayTypeChip :dayType="template.suggestedForDayType" isTonal />
			<VBtn
				icon="thumbtack"
				variant="text"
				size="small"
				:color="isPinned ? 'primary' : 'grey'"
				@click.stop="emit('togglePin')"
			/>
		</div>
	</VCardTitle>

	<VCardText>
		<div v-if="template.description" class="mb-2">
			{{ template.description }}
		</div>

		<div class="template-meta">
			<VChip
				v-for="tag in template.tags"
				:key="tag"
				size="small"
				class="mr-2 mb-2"
			>
				{{ tag }}
			</VChip>
		</div>

		<MiniTimeline
			v-if="tasks && tasks.length"
			:tasks="tasks"
			:startTime="template.defaultWakeUpTime"
			:endTime="template.defaultBedTime"
			class="mt-2"
		/>

		<div class="d-flex justify-space-between align-center mt-3 text-caption">
			<span>Used {{ template.usageCount }} times</span>
			<span v-if="template.lastUsedAt">
				Last: {{ formatToDate(new Date(template.lastUsedAt)) }}
			</span>
		</div>
	</VCardText>

	<VCardActions class="pa-4 d-flex align-center flex-wrap ga-2">
		<VSwitch
			:modelValue="template.isActive"
			hideDetails
			density="compact"
			color="primary"
			@click.stop
			@update:modelValue="emit('toggleActive')"
		>
			<template #label>
				<span class="text-caption">{{ template.isActive ? 'Active' : 'Inactive' }}</span>
			</template>
		</VSwitch>
		<VSpacer />
		<VBtn
			color="primary"
			variant="tonal"
			prependIcon="play"
			@click.stop="emit('applyToday')"
		>
			Use Today
		</VBtn>
		<VBtn
			color="secondaryOutline"
			variant="tonal"
			@click.stop="emit('duplicate')"
		>
			Duplicate
		</VBtn>
		<VBtn
			color="secondaryOutline"
			variant="tonal"
			@click.stop="emit('edit')"
		>
			Edit Details
		</VBtn>
		<VBtn
			variant="tonal"
			color="error"
			@click.stop="emit('delete')"
		>
			Delete
		</VBtn>
	</VCardActions>
</VCard>
</template>

<script setup lang="ts">
import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts';
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts';
import DayTypeChip from '@/components/dayPlanner/misc/DayTypeChip.vue';
import MiniTimeline from '@/components/dayPlanner/template/MiniTimeline.vue';
import {useMoment} from '@/utils/momentHelper.ts';

defineProps<{
	template: TaskPlannerDayTemplate
	isPinned: boolean
	tasks?: TemplatePlannerTask[]
}>()

const emit = defineEmits<{
	click: []
	edit: []
	delete: []
	duplicate: []
	togglePin: []
	toggleActive: []
	applyToday: []
}>()

const {formatToDate} = useMoment()
</script>

<style scoped>
.template-card {
	cursor: pointer;
	transition: transform 0.2s, box-shadow 0.2s;
}

.template-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.inactive-template {
	opacity: 0.7;
}

.template-meta {
	min-height: 32px;
}
</style>
