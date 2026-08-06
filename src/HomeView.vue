<template>
	<div
		class="py-3 w-100 h-100 d-flex flex-column"
		style="overflow: hidden"
	>
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
		<div style="flex: 0 0 400px; min-height: 0; overflow: hidden">
			<VRow
				class="ma-0 h-100"
				align="stretch"
			>
				<VCol
					cols="4"
					style="min-height: 0"
				>
					<ActivityHistoryWidget class="h-100" />
				</VCol>
				<VCol
					cols="4"
					style="min-height: 0"
				>
					<QuickRecordWidget class="h-100" />
				</VCol>
				<VCol
					cols="4"
					style="min-height: 0"
				>
					<TodoListWidget class="h-100" />
				</VCol>
			</VRow>
		</div>
	</div>
</template>

<script setup lang="ts">
	import DayPlannerWidget from '@/core/home/component/DayPlannerWidget.vue'
	import RoutineTodoWidget from '@/core/home/component/RoutineTodoWidget.vue'
	import ActivityHistoryWidget from '@/core/home/component/ActivityHistoryWidget.vue'
	import QuickRecordWidget from '@/core/home/component/QuickRecordWidget.vue'
	import TodoListWidget from '@/core/home/component/TodoListWidget.vue'
</script>
