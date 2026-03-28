import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
import type {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts'
import {DayOfWeek} from '@/dtos/enum/DayOfWeek.ts'

const DAY_INDEX_TO_DAY_OF_WEEK: Record<number, DayOfWeek> = {
	1: DayOfWeek.Monday,
	2: DayOfWeek.Tuesday,
	3: DayOfWeek.Wednesday,
	4: DayOfWeek.Thursday,
	5: DayOfWeek.Friday,
	6: DayOfWeek.Saturday,
	7: DayOfWeek.Sunday,
}

function scoreTemplate(template: TaskPlannerDayTemplate, calendar: Calendar): number {
	let score = 0
	const dayOfWeek = DAY_INDEX_TO_DAY_OF_WEEK[calendar.dayIndex]

	if (template.suggestedForDayType && template.suggestedForDayType === calendar.dayType) score += 4
	if (dayOfWeek && template.scheduledDays?.includes(dayOfWeek)) score += 3
	if (template.suggestedLocation && calendar.location && template.suggestedLocation === calendar.location) score += 2
	if (template.lastUsedAt) {
		const daysSinceUsed = (Date.now() - new Date(template.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24)
		if (daysSinceUsed <= 14) score += 1
	}
	if (template.usageCount > 5) score += 0.5

	return score
}

export function useTemplateSuggestion() {
	function getSuggestions(templates: TaskPlannerDayTemplate[], calendar: Calendar, limit = 2): TaskPlannerDayTemplate[] {
		const active = templates.filter(t => t.isActive)
		return active
			.map(t => ({template: t, score: scoreTemplate(t, calendar)}))
			.filter(({score}) => score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, limit)
			.map(({template}) => template)
	}

	return {getSuggestions}
}
