<template>
<div class="app-container">
	<div class="columns-container">
		<div class="column">
			<h2>Done</h2>
			<VueDraggableNext
				v-model="items"
				class="draggable-list"
				v-bind="{ group: 'test', sort: false }"
			>
				<div
					v-for="item in items"
					:key="item.id"
					class="task-item"
				>
					<h3>{{ item.name }}</h3>
				</div>
			</VueDraggableNext>
		</div>
	</div>
</div>
</template>
<script setup>
import { ref } from 'vue'
import { VueDraggableNext } from 'vue-draggable-next'

const isShown = ref(true)
const items = ref([])

setTimeout(() => {
	isShown.value = false;
	items.value = Array.from({ length: 15 }, (_, i) => ({
		id: i + 1,
		name: `Task ${i + 1}`
	}));
}, 10)

setTimeout(() => {
	isShown.value = true;
}, 15)
</script>

<style scoped>
.drag-container {
	min-height: 200px;
	padding: 20px;
}

.drag-item {
	padding: 10px;
	margin: 5px 0;
	background: #f0f0f0;
	border-radius: 4px;
	cursor: move;
	transition: background 0.2s;
}

.drag-item:hover {
	background: #e0e0e0;
}
</style>