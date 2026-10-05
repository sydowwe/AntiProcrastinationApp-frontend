<!-- DayTemplatePicker.vue -->
<template>
	<div>
		<div class="d-flex align-center ga-2 mb-4">
			<VIcon
				icon="layer-group"
				size="16"
				class="text-medium-emphasis"
			/>
			<span class="section-label">{{ t('planner.misc.dayTemplateLabel') }}</span>
		</div>

		<!-- Backend Suggestions -->
		<div
			v-if="suggestions.length && !store.isTemplateInPreview"
			class="mb-4"
		>
			<div class="d-flex align-center ga-1 mb-2">
				<VIcon
					icon="wand-magic-sparkles"
					size="14"
					class="text-primary"
				/>
				<span class="section-label text-primary">{{ t('planner.templateSuggestions.suggestedForYou') }}</span>
			</div>
			<div class="d-flex flex-column ga-2">
				<div
					v-for="s in suggestions"
					:key="s.template.id"
					class="suggestion-item d-flex align-center justify-space-between pa-2 rounded-lg"
					role="button"
					tabindex="0"
					:aria-pressed="selectedTemplate?.id === s.template.id"
					style="cursor: pointer"
					@click="selectSuggestion(s.template)"
					@keydown.enter.space.prevent="selectSuggestion(s.template)"
				>
					<div class="d-flex align-center ga-2 flex-wrap">
						<VIcon
							v-if="s.template.icon"
							:icon="s.template.icon"
							size="16"
							class="text-medium-emphasis"
						/>
						<span class="text-body-2 font-weight-medium">{{ s.template.name }}</span>
						<VChip
							size="x-small"
							variant="tonal"
							color="primaryOutline"
							class="flex-shrink-0"
						>
							{{ patternSentence(s) }}
						</VChip>
					</div>
					<!-- Only history entries have a count; a settings match (types 2/3) is always 0. -->
					<span
						v-if="isHistoryPattern(s)"
						class="text-caption text-medium-emphasis flex-shrink-0 ml-2"
					>
						{{ t('planner.templateSuggestions.timesCount', { count: s.occurrenceCount }) }}
					</span>
				</div>
			</div>
		</div>

		<VAutocomplete
			v-model="selectedTemplate"
			:label="t('planner.misc.chooseTemplateLabel')"
			:items="templates"
			itemTitle="name"
			itemValue="id"
			returnObject
			variant="outlined"
			density="comfortable"
			clearable
			hideDetails
		>
			<template #prepend-inner>
				<VIcon
					icon="search"
					size="18"
					class="text-medium-emphasis"
				/>
			</template>
		</VAutocomplete>

		<!-- Template Preview Card -->
		<VExpandTransition>
			<SubtleCard
				v-if="selectedTemplate"
				color="primary"
				class="template-preview mt-4"
			>
				<div class="d-flex align-center justify-space-between ga-3 mb-2">
					<div class="text-body-2 font-weight-bold">
						{{ selectedTemplate.name }}
						<VIcon
							v-if="selectedTemplate.icon"
							:icon="selectedTemplate.icon"
						></VIcon>
					</div>
					<DayTypeChip
						:dayType="selectedTemplate.suggestedForDayType"
						isTonal
					></DayTypeChip>
				</div>

				<div
					class="d-flex align-center ga-2 text-caption text-medium-emphasis"
					:class="selectedTemplate.tags?.length ? 'mb-3' : 'mb-4'"
				>
					<VIcon
						icon="clock"
						size="14"
					/>
					<span>
						{{ Time.getString(selectedTemplate.defaultWakeUpTime) }} -
						{{ Time.getString(selectedTemplate.defaultBedTime) }}
					</span>
				</div>
				<p
					v-if="selectedTemplate.description"
					class="text-caption text-medium-emphasis mb-3 ma-0"
					style="line-height: 1.5"
				>
					{{ selectedTemplate.description }}
				</p>

				<div
					v-if="selectedTemplate.tags?.length"
					class="d-flex flex-wrap ga-1 mb-4"
				>
					<VChip
						v-for="tag in selectedTemplate.tags"
						:key="tag"
						size="x-small"
						variant="outlined"
						rounded="lg"
						style="opacity: 0.8"
					>
						{{ tag }}
					</VChip>
				</div>

				<VBtn
					v-if="selectedTemplate?.id !== store.templateInPreview?.id"
					color="primary"
					block
					@click="useTemplate"
				>
					<VIcon
						icon="eye"
						size="16"
						class="mr-2"
					/>
					{{ t('planner.misc.previewTemplate') }}
				</VBtn>
				<VChip
					v-else
					color="success"
					variant="tonal"
					block
					class="w-100 justify-center"
				>
					<VIcon
						icon="check"
						size="14"
						class="mr-1"
					/>
					{{ t('planner.misc.inPreview') }}
				</VChip>
			</SubtleCard>
		</VExpandTransition>

		<!-- Applied Template Badge -->
		<div
			v-if="calendar?.appliedTemplateName && !selectedTemplate"
			class="applied-badge d-flex align-center ga-2 mt-3 pa-3 rounded-lg text-body-2"
		>
			<VIcon
				icon="check-circle"
				size="16"
				color="success"
			/>
			<span>
				{{ t('planner.misc.usingTemplate') }}
				<!-- The stamp has no FK: a deleted template keeps its id here, and the template view says it is gone. -->
				<RouterLink
					v-if="calendar.appliedTemplateId != null"
					:to="{ name: 'dayPlannerTemplate', params: { templateId: calendar.appliedTemplateId } }"
					class="font-weight-bold text-primary"
				>
					{{ calendar.appliedTemplateName }}
				</RouterLink>
				<strong v-else>{{ calendar.appliedTemplateName }}</strong>
			</span>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import type { TemplateSuggestionResponse } from '@/core/dayPlanner/dto/response/template/TemplateSuggestionResponse.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import DayTypeChip from '@/core/dayPlanner/component/misc/DayTypeChip.vue'
	import SubtleCard from '@/_common/component/feedback/SubtleCard.vue'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/core/dayPlanner/api/taskPlannerDayTemplateApi.ts'

	const { calendar } = defineProps<{
		calendar?: Calendar
	}>()

	const emit = defineEmits<{
		useTemplate: []
	}>()

	const { t, te } = useI18n()
	const store = useDayPlannerStore()
	const { fetchAll, fetchSuggestions } = useTaskPlannerDayTemplateTaskCrud()

	const templates = ref<TaskPlannerDayTemplate[]>([])
	const selectedTemplate = ref<TaskPlannerDayTemplate | null>(null)
	const backendSuggestions = ref<TemplateSuggestionResponse[]>([])

	onMounted(async () => {
		templates.value = await fetchAll()
		if (store.templateInPreview) {
			selectedTemplate.value = store.templateInPreview
		}
	})

	// Separate from the template list, so a suggestion failure never empties the picker. Keyed on the
	// calendar id rather than read once at mount: the picker mounts before the day view's calendar has
	// loaded, so a mount-time read never asked at all on a normal page load.
	watch(
		() => calendar?.id,
		async calendarId => {
			backendSuggestions.value = []
			if (calendarId == null) return
			const suggestions = await fetchSuggestions(calendarId).catch(() => [] as TemplateSuggestionResponse[])
			if (calendar?.id === calendarId) backendSuggestions.value = suggestions
		},
		{ immediate: true },
	)

	watch(
		() => store.templateInPreview,
		val => {
			selectedTemplate.value = val
		},
	)

	// Rendered in the server's order, which is the ranking (history first, then template settings).
	// Since B27 the server sends one entry per template and active templates only; both guards stay as
	// a safeguard against an older API build, where a template could arrive twice under one v-for key.
	const suggestions = computed(() => {
		const seen = new Set<number>()
		return backendSuggestions.value.filter(s => {
			if (!s.template.isActive || seen.has(s.template.id)) return false
			seen.add(s.template.id)
			return true
		})
	})

	// `patternLabel` is the server's English enum name ("Thursday", "Workday"), so it is translated
	// through the app's own keys and shown raw only if it is a name this client does not know.
	function patternLabel(s: TemplateSuggestionResponse): string {
		const isWeekday = s.patternType === 0 || s.patternType === 2
		const key = isWeekday ? `calendar.${s.patternLabel.toLowerCase()}` : `planner.dayType.${s.patternLabel}`
		return te(key) ? t(key) : s.patternLabel
	}

	function isHistoryPattern(s: TemplateSuggestionResponse): boolean {
		return s.patternType === 0 || s.patternType === 1
	}

	// History says what the user did; a settings match says what the template is set up for (B27).
	const PATTERN_SENTENCE_KEYS = {
		0: 'planner.templateSuggestions.usedOn',
		1: 'planner.templateSuggestions.usedOn',
		2: 'planner.templateSuggestions.scheduledFor',
		3: 'planner.templateSuggestions.suggestedFor',
	} as const

	function patternSentence(s: TemplateSuggestionResponse): string {
		return t(PATTERN_SENTENCE_KEYS[s.patternType] ?? PATTERN_SENTENCE_KEYS[0], { label: patternLabel(s) })
	}

	function selectSuggestion(template: TaskPlannerDayTemplate) {
		selectedTemplate.value = template
	}

	function useTemplate() {
		store.templateInPreview = selectedTemplate.value
		emit('useTemplate')
	}
</script>

<style scoped>
	.section-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: rgba(var(--v-theme-on-surface), 0.5);
	}

	.applied-badge {
		background: rgba(var(--v-theme-success), 0.08);
	}

	.suggestion-item {
		background: rgba(var(--v-theme-primary), 0.06);
		border: 1px solid rgba(var(--v-theme-primary), 0.15);
		transition: background 0.15s;
	}

	.suggestion-item:hover,
	.suggestion-item[aria-pressed='true'] {
		background: rgba(var(--v-theme-primary), 0.12);
	}

	.suggestion-item:focus-visible {
		outline: 2px solid rgb(var(--v-theme-primary));
		outline-offset: 2px;
	}
</style>
