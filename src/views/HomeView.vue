<template>
	<div class="px-2 py-8 w-100 h-100 d-flex flex-column">
		<VRow class="flex-fill">
			<VCol
				cols="12"
				md="6"
			>
				<DayPlannerWidget class="h-100" />
			</VCol>
			<VCol
				cols="12"
				md="6"
			>
				<RoutineTodoWidget class="h-100" />
			</VCol>
		</VRow>
		<VRow style="max-height: 400px">
			<VCol
				cols="4"
				alignSelf="stretch"
			>
				<ActivityHistoryWidget class="h-100" />
			</VCol>
			<VCol
				cols="4"
				alignSelf="stretch"
			>
				<QuickRecordWidget class="h-100" />
			</VCol>
			<VCol
				cols="4"
				alignSelf="stretch"
			>
				<TodoListWidget class="h-100" />
			</VCol>
		</VRow>
	</div>
</template>

<script setup lang="ts">
	import DayPlannerWidget from '@/components/home/DayPlannerWidget.vue'
	import RoutineTodoWidget from '@/components/home/RoutineTodoWidget.vue'
	import ActivityHistoryWidget from '@/components/home/ActivityHistoryWidget.vue'
	import QuickRecordWidget from '@/components/home/QuickRecordWidget.vue'
	import TodoListWidget from '@/components/home/TodoListWidget.vue'
</script>
