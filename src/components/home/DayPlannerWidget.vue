<template>
	<VCard style="display: flex; flex-direction: column">
		<VCardTitle class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
			<span class="text-h6">{{ $t('home.dayPlanner') }}</span>
			<VIconBtn
				icon="fa-up-right-from-square"
				variant="text"
				size="small"
				@click="navigate"
			/>
		</VCardTitle>
		<VDivider />
		<VCardText style="flex: 1; overflow-y: auto; min-height: 0">
			<div
				v-if="loading"
				class="d-flex justify-center align-center h-100"
			>
				<VProgressCircular indeterminate />
			</div>
			<div
				v-else-if="!calendar"
				class="d-flex flex-column align-center justify-center ga-3 h-100"
			>
				<span class="text-medium-emphasis">{{ $t('home.noCalendar') }}</span>
				<VBtn
					color="primary"
					size="small"
					@click="navigate"
				>
					{{ $t('home.planToday') }}
				</VBtn>
			</div>
			<template v-else>
				<VProgressLinear
					:modelValue="completedCount"
					:max="totalCount || 1"
					color="primary"
					rounded="sm"
					height="18"
					class="mb-3"
				>
					<span class="text-caption font-weight-bold text-white">{{ completedCount }}/{{ totalCount }}</span>
				</VProgressLinear>
				<div
					v-if="sortedTasks.length === 0"
					class="text-center text-medium-emphasis py-4"
				>
					{{ $t('home.noTasks') }}
				</div>
				<VList
					v-else
					density="compact"
					class="pa-0"
				>
					<VListItem
						v-for="task in sortedTasks"
						:key="task.id"
						class="px-1 rounded-lg mb-1"
					>
						<template #prepend>
							<span
								class="text-caption text-medium-emphasis"
								style="min-width: 42px"
							>
								{{ task.startTime.getString() }}
							</span>
						</template>
						<VListItemTitle class="text-body-2">{{ task.activity.name }}</VListItemTitle>
						<template #append>
							<VChip
								:color="getPlannerTaskStatusColor(task.status)"
								size="x-small"
								density="compact"
								:prependIcon="getPlannerTaskStatusIcon(task.status)"
								@click.stop="toggleTaskStatus(task)"
								class="cursor-pointer"
							>
								{{ $t('planner.status.' + task.status) }}
							</VChip>
						</template>
					</VListItem>
				</VList>
			</template>
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import { useCalendarQuery } from '@/api/calendarApi.ts'
	import { useTaskPlannerCrud } from '@/api/taskPlanner/plannerTaskApi.ts'
	import type { Calendar } from '@/dtos/response/activityPlanning/Calendar.ts'
	import type { PlannerTask } from '@/dtos/response/activityPlanning/PlannerTask.ts'
	import { PlannerTaskFilter } from '@/dtos/request/activityPlanning/PlannerTaskFilter.ts'
	import { PatchPlannerTaskStatusRequest } from '@/dtos/request/activityPlanning/PatchPlannerTaskStatusRequest.ts'
	import {
		PlannerTaskStatus,
		getPlannerTaskStatusColor,
		getPlannerTaskStatusIcon,
	} from '@/dtos/enum/PlannerTaskStatus.ts'
	import { Time } from '@/dtos/dto/Time.ts'
	import { useDateTime } from '@/utils/DateTimeHelper.ts'

	const router = useRouter()
	const { fetchByDate } = useCalendarQuery()
	const { fetchFiltered, patchStatus } = useTaskPlannerCrud()
	const { formatToUsString, usStringToUrlString } = useDateTime()

	const calendar = ref<Calendar | null>(null)
	const tasks = ref<PlannerTask[]>([])
	const loading = ref(true)

	const todayStr = usStringToUrlString(formatToUsString(new Date()))

	const nonBackgroundTasks = computed(() => tasks.value.filter(t => !t.isBackground))
	const sortedTasks = computed(() =>
		[...nonBackgroundTasks.value].sort((a, b) => a.startTime.getInMinutes - b.startTime.getInMinutes),
	)
	const completedCount = computed(
		() => nonBackgroundTasks.value.filter(t => t.status === PlannerTaskStatus.Completed).length,
	)
	const totalCount = computed(() => nonBackgroundTasks.value.length)

	async function load() {
		loading.value = true
		try {
			calendar.value = await fetchByDate(todayStr)
			tasks.value = await fetchFiltered(
				new PlannerTaskFilter(calendar.value.id, new Time(0, 0), new Time(23, 59)),
			)
		} catch {
			calendar.value = null
		} finally {
			loading.value = false
		}
	}

	async function toggleTaskStatus(task: PlannerTask) {
		const nextStatus =
			task.status === PlannerTaskStatus.Completed ? PlannerTaskStatus.NotStarted : PlannerTaskStatus.Completed
		task.status = nextStatus
		await patchStatus(task.id, new PatchPlannerTaskStatusRequest(nextStatus))
	}

	function navigate() {
		router.push({ name: 'dayPlanner', params: { date: todayStr } })
	}

	onMounted(load)
</script>
