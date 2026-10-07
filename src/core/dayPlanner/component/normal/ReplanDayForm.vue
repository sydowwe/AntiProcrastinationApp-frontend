<!--
	The body of the "Re-plan the rest of today" dialog (FO4), opened through `useDayReplan`.

	It shows a preview and nothing is written until the user confirms. The packing is the server's: this
	side only draws what the preview says, and sends back the token plus one decision per block that did
	not fit. It never proposes placements of its own, so a preview and its apply cannot disagree.

	No counts and no "you missed N" framing. The question it answers is "where does the rest of the day
	go", not "how far behind am I".
-->
<template>
	<div class="d-flex flex-column ga-4">
		<VAlert
			v-if="notice"
			type="info"
			variant="tonal"
			density="compact"
			:text="notice"
		/>

		<p class="text-body-2 ma-0">
			{{
				$t('planner.replan.intro', {
					from: preview.packedFrom.getString(),
					end: preview.windowEnd.getString(),
				})
			}}
		</p>

		<!-- Before and after on the same scale, so a moved block visibly slides along its row. Decorative:
			 every move is also listed in text below. -->
		<div
			v-if="beforeTimeline.length"
			class="replan-timelines"
			aria-hidden="true"
		>
			<span class="text-caption text-medium-emphasis">{{ $t('planner.replan.before') }}</span>
			<MiniTimeline
				:tasks="beforeTimeline"
				:startTime="rangeStart"
				:endTime="preview.windowEnd"
				:showCount="false"
			/>
			<span class="text-caption text-medium-emphasis">{{ $t('planner.replan.after') }}</span>
			<MiniTimeline
				:tasks="afterTimeline"
				:startTime="rangeStart"
				:endTime="preview.windowEnd"
				:showCount="false"
			/>
		</div>

		<section v-if="preview.moves.length">
			<h3 class="text-subtitle-2 mb-2">{{ $t('planner.replan.movesTitle') }}</h3>
			<ul
				v-auto-animate
				class="replan-list"
			>
				<li
					v-for="move in preview.moves"
					:key="move.task.id"
					class="replan-row"
				>
					<span
						class="replan-dot"
						:style="{ background: taskColor(move.task) }"
					/>
					<span class="flex-grow-1 text-truncate">{{ move.task.activity.name }}</span>
					<span class="text-caption text-medium-emphasis">{{ $t(stateKey[move.state]) }}</span>
					<span class="replan-times">
						<span class="text-medium-emphasis">{{ move.task.startTime.getString() }}</span>
						<VIconSmall
							icon="fa-arrow-right"
							class="mx-1"
						/>
						<strong>{{ move.startTime.getString() }}–{{ move.endTime.getString() }}</strong>
					</span>
				</li>
			</ul>
		</section>

		<section v-if="preview.wontFit.length">
			<h3 class="text-subtitle-2 mb-1">{{ $t('planner.replan.wontFitTitle') }}</h3>
			<p class="text-caption text-medium-emphasis mb-2">{{ $t('planner.replan.wontFitHint') }}</p>
			<ul class="replan-list">
				<li
					v-for="item in preview.wontFit"
					:key="item.task.id"
					class="replan-row flex-wrap"
				>
					<span
						class="replan-dot"
						:style="{ background: taskColor(item.task) }"
					/>
					<span class="flex-grow-1 text-truncate">
						{{ item.task.activity.name }}
						<span class="text-caption text-medium-emphasis">
							· {{ item.task.startTime.getString() }}–{{ item.task.endTime.getString() }}
							<template v-if="item.isOptional">· {{ $t('planner.replan.optional') }}</template>
						</span>
					</span>
					<MyBtnToggle
						v-model="decisions[item.task.id]"
						:label="$t('planner.replan.decisionLabel', { name: item.task.activity.name })"
						mandatory
						density="compact"
						variant="outlined"
						color="primaryOutline"
						divided
					>
						<VBtn
							:value="ReplanWontFitResolution.Tomorrow"
							size="small"
						>
							{{ $t('planner.replan.tomorrow') }}
						</VBtn>
						<VBtn
							:value="ReplanWontFitResolution.Skip"
							size="small"
						>
							{{ $t('planner.replan.skip') }}
						</VBtn>
					</MyBtnToggle>
				</li>
			</ul>
		</section>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import type { Ref } from 'vue'
	import axios from 'axios'
	import { useI18n } from 'vue-i18n'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import { extractServerErrorType } from '@/_common/axiosConfig.ts'
	import { handleHttpCodes } from '@/_common/composable/general/ErrorHandlingFunctions.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import MyBtnToggle from '@/_common/component/inputs/MyBtnToggle.vue'
	import MiniTimeline from '@/core/dayPlanner/component/template/MiniTimeline.vue'
	import { useDayReplanApi } from '@/core/dayPlanner/api/dayReplanApi.ts'
	import type { DayReplanPreview } from '@/core/dayPlanner/dto/response/DayReplanPreview.ts'
	import type { ApplyDayReplanResult } from '@/core/dayPlanner/dto/response/ApplyDayReplanResult.ts'
	import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
	import type { ITimelineTask } from '@/core/dayPlanner/dto/ITimelineTask.ts'
	import { PlannerTaskSlipState } from '@/core/dayPlanner/dto/enum/PlannerTaskSlipState.ts'
	import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
	import { ReplanWontFitResolution } from '@/core/dayPlanner/dto/enum/ReplanWontFitResolution.ts'
	import {
		ApplyDayReplanRequest,
		DayReplanWontFitDecision,
	} from '@/core/dayPlanner/dto/request/ApplyDayReplanRequest.ts'

	const { initialPreview, tasks } = defineProps<{
		initialPreview: DayReplanPreview
		/** The day as the caller has it on screen, drawn as the "before" row. The preview only names what moves. */
		tasks: PlannerTask[]
	}>()

	const { t } = useI18n()
	const dialogApi = useDialogApi<ApplyDayReplanResult>()
	const { fetchPreview, apply } = useDayReplanApi()

	const preview = ref(initialPreview) as Ref<DayReplanPreview>
	const decisions = ref<Record<number, ReplanWontFitResolution>>({})
	const notice = ref('')
	let applying = false

	const stateKey: Record<PlannerTaskSlipState, string> = {
		[PlannerTaskSlipState.Missed]: 'planner.replan.state.missed',
		[PlannerTaskSlipState.Late]: 'planner.replan.state.late',
		[PlannerTaskSlipState.Upcoming]: 'planner.replan.state.upcoming',
	}

	// One decision per block that did not fit. An optional block defaults to a skip, anything else to
	// tomorrow: the default should be the answer most people would give without reading the row.
	watch(
		preview,
		value => {
			decisions.value = Object.fromEntries(
				value.wontFit.map(item => [
					item.task.id,
					item.isOptional ? ReplanWontFitResolution.Skip : ReplanWontFitResolution.Tomorrow,
				]),
			)
			dialogApi.setDialogProps({ confirmBtnDisabled: !value.hasChanges })
		},
		{ immediate: true },
	)

	function taskColor(task: PlannerTask): string {
		return task.color || task.activity.category?.color || 'rgb(var(--v-theme-primary))'
	}

	/** What the timeline rows draw: the day's foreground blocks, minus skipped ones. */
	const drawnTasks = computed(() =>
		tasks.filter(task => task.id > 0 && !task.isBackground && task.status !== PlannerTaskStatus.Cancelled),
	)

	function toTimeline(task: PlannerTask, startTime: Time, endTime: Time): ITimelineTask {
		return { startTime, endTime, isBackground: false, color: taskColor(task) }
	}

	const beforeTimeline = computed(() => drawnTasks.value.map(task => toTimeline(task, task.startTime, task.endTime)))

	const afterTimeline = computed(() => {
		const moved = new Map(preview.value.moves.map(move => [move.task.id, move]))
		const dropped = new Set(preview.value.wontFit.map(item => item.task.id))
		return drawnTasks.value
			.filter(task => !dropped.has(task.id))
			.map(task => {
				const move = moved.get(task.id)
				return move
					? toTimeline(task, move.startTime, move.endTime)
					: toTimeline(task, task.startTime, task.endTime)
			})
	})

	/** From the earliest block's hour (or now's, if that is earlier) so both rows share one scale. */
	const rangeStart = computed(() => {
		const earliest = Math.min(
			preview.value.packedFrom.getInMinutes,
			...drawnTasks.value.map(task => task.startTime.getInMinutes),
		)
		return Time.fromMinutes(Math.floor(earliest / 60) * 60)
	})

	dialogApi.onConfirm(applyReplan)

	async function applyReplan() {
		if (applying || !preview.value.hasChanges) return
		applying = true
		dialogApi.setLoading(true)
		try {
			const request = new ApplyDayReplanRequest(
				preview.value.previewToken,
				preview.value.wontFit.map(
					item =>
						new DayReplanWontFitDecision(
							item.task.id,
							decisions.value[item.task.id] ?? ReplanWontFitResolution.Tomorrow,
						),
				),
			)
			// `_silent`: a 409 here is not an error to report, it is "the day moved under the preview",
			// and the right answer is a fresh preview, not a toast.
			const result = await apply(preview.value.date, request, { _silent: true })
			dialogApi.close(result)
		} catch (e) {
			const status = axios.isAxiosError(e) ? e.response?.status : undefined
			if (status === 409) {
				await refreshPreview()
			} else {
				handleHttpCodes(status ?? 0, axios.isAxiosError(e) ? extractServerErrorType(e) : undefined)
			}
		} finally {
			applying = false
			dialogApi.setLoading(false)
		}
	}

	/**
	 * The day changed since the preview (another device, a timer finishing, the clock moving on), the token
	 * expired, or this preview was already applied. Nothing was written, so show the day as it is now.
	 */
	async function refreshPreview() {
		try {
			preview.value = await fetchPreview(preview.value.date)
			notice.value = preview.value.hasChanges ? t('planner.replan.stale') : t('planner.replan.nothingLeft')
		} catch {
			// The interceptor has already said why; the old preview stays, and its apply will 409 again.
		}
	}
</script>

<style scoped>
	.replan-timelines {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		column-gap: 12px;
		row-gap: 6px;
	}

	.replan-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.replan-row {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.replan-dot {
		flex: 0 0 auto;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		/* A task may be coloured white; the ring keeps its dot visible on the dialog's surface. */
		box-shadow: 0 0 0 1px rgba(var(--v-theme-on-surface), 0.35);
	}

	.replan-times {
		flex: 0 0 auto;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
