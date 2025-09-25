<template>
<div class="d-flex ga-9">
	<VList ref="todoList" class="kanban-column">
		<VListItem v-for="todo in todos" :key="todo" class="kanban-item">
			{{ todo }}
		</VListItem>
	</VList>
	<VList ref="doneList" class="kanban-column">
		<VListItem v-for="done in dones" :key="done" class="kanban-item">
			{{ done }}
		</VListItem>
	</VList>
</div>
</template>

<script setup lang="ts">
import { useDragAndDrop } from "@formkit/drag-and-drop/vue";

const todoItems = ["Schedule perm", "Rewind VHS tapes", "Make change for the arcade", "Get disposable camera developed", "Learn C++", "Return Nintendo Power Glove"];
const doneItems = ["Pickup new mix-tape from Beth"];

const [todoList, todos] = useDragAndDrop(todoItems, { group: "todoList" });
const [doneList, dones] = useDragAndDrop(doneItems, { group: "todoList" });
</script>