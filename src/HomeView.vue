<template>
	<div class="py-4 w-100 h-100 d-flex flex-column">
		<!-- what to do right now, above everything else -->
		<NowBar class="mx-2 mb-2 flex-shrink-0" />
		<div style="flex: 1 1 0; min-height: 0; overflow: hidden">
			<VRow
				class="ma-0 h-100"
				align="stretch"
			>
				<VCol
					cols="12"
					md="6"
					style="min-height: 0; height: 100%"
				>
					<DayPlannerWidget class="h-100" />
				</VCol>
				<VCol
					cols="12"
					md="6"
					style="min-height: 0; height: 100%"
				>
					<RoutineTodoWidget class="h-100" />
				</VCol>
			</VRow>
		</div>
		<!--
			Scales with the screen, but in `vh` rather than `%`: a percentage basis needs a definite
			height on every ancestor up to VMain and silently falls back to content sizing when it
			does not get one, which is what clipped these widgets. `vh` is always definite. The clamp
			keeps the band usable on a laptop and stops it eating the page on a tall monitor, and
			`0 1` still lets it shrink — the widgets inside are built to shrink with it.
		-->
		<div style="flex: 0 1 clamp(240px, 33vh, 420px); min-height: 0; overflow: hidden">
			<VRow
				class="ma-0 h-100"
				align="stretch"
			>
				<!-- `height: 100%` matters: without it the cards' own `h-100` has no definite parent
					 height to resolve against and falls back to content height, overflowing the band. -->
				<VCol
					cols="3"
					style="min-height: 0; height: 100%"
				>
					<QuickRecordWidget class="h-100" />
				</VCol>
				<VCol
					cols="4"
					style="min-height: 0; height: 100%"
				>
					<ActivityHistoryWidget class="h-100" />
				</VCol>
				<VCol
					cols="5"
					style="min-height: 0; height: 100%"
				>
					<TodoListWidget class="h-100" />
				</VCol>
			</VRow>
		</div>
	</div>
</template>

<script setup lang="ts">
	import NowBar from '@/core/home/component/NowBar.vue'
	import DayPlannerWidget from '@/core/home/component/DayPlannerWidget.vue'
	import RoutineTodoWidget from '@/core/home/component/RoutineTodoWidget.vue'
	import ActivityHistoryWidget from '@/core/home/component/ActivityHistoryWidget.vue'
	import QuickRecordWidget from '@/core/home/component/QuickRecordWidget.vue'
	import TodoListWidget from '@/core/home/component/TodoListWidget.vue'
</script>
