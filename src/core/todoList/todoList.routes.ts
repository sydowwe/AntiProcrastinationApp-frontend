import type { RouteRecordRaw } from 'vue-router'
import TodoListsView from '@/core/todoList/view/TodoListsView.vue'
import TodoListView from '@/core/todoList/view/TodoListView.vue'
import RoutineToDoListView from '@/core/todoList/view/RoutineToDoListView.vue'
import RoutineSettingsView from '@/core/todoList/view/RoutineSettingsView.vue'

export const todoListRoutes: RouteRecordRaw[] = [
	{
		path: '/todo-list',
		name: 'toDoList',
		component: TodoListsView,
	},
	{
		path: '/todo-list/:id',
		name: 'toDoListDetail',
		component: TodoListView,
		props: true,
	},
	{
		path: '/routine-todo-list',
		name: 'routineToDoList',
		component: RoutineToDoListView,
	},
	{
		path: '/routine-settings',
		name: 'routineSettings',
		component: RoutineSettingsView,
	},
]
