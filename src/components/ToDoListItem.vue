<template>
    <VListItem :active="!toDoListItem.isDone" @click="toDoListItem.isDone = !toDoListItem.isDone" :base-color="toDoListItem.urgency.color" class="align-center listItem">
        <template v-slot:prepend>
            <VListItemAction start>
                <v-checkbox-btn v-model="toDoListItem.isDone" base-color="white" color="white"></v-checkbox-btn>
            </VListItemAction>
        </template>
        <VListItemTitle class="text-white">{{ toDoListItem.name }}</VListItemTitle>
        <VListItemSubtitle class="text-white">{{ toDoListItem.text }}</VListItemSubtitle>
        <template v-slot:append>
            <VIcon v-if="isSelected">
                <FontAwesomeIcon icon="fas fa-check-circle" class="text-info"></FontAwesomeIcon>
            </VIcon>
            <v-menu location="start" transition="slide-y-transition">
                <template v-slot:activator="{ props }">
                    <v-btn icon v-bind="props" color="white" variant="text">
                        <VIcon>
                            <FontAwesomeIcon icon="fas fa-ellipsis-vertical"></FontAwesomeIcon>
                        </VIcon>
                    </v-btn>
                </template>
                <VList>
                    <VListItem class="px-3" v-for="(item, i) in actions" :key="i">
                        <VBtn class="px-3" :color="item.color" width="100%" @click="item.action">
                            {{ actionButtonText(item.name) }}
                            <VIcon class="ml-2" slot="append">
                                <FontAwesomeIcon :icon="['fas', `${item.icon}`]"></FontAwesomeIcon>
                            </VIcon>
                        </VBtn>
                    </VListItem>
                </VList>
            </v-menu>
        </template>
    </VListItem>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { ToDoListItemEntity } from '../classes/ToDoListItem';

    const props = defineProps({
        toDoListItem: {
            type: ToDoListItemEntity,
            required: true,
        },
    });
    const emits = defineEmits(['edit', 'delete', 'select', 'unSelect', 'isDoneChanged']);

    const isSelected = ref(false);

    const actions = [
        { name: 'select', color: 'yellow', icon: 'check-circle', action: toggleSelect },
        { name: 'edit', color: 'primary', icon: 'pen-to-square', action: edit },
        { name: 'delete', color: 'error', icon: 'trash', action: del },
    ];

    function actionButtonText(name: string) {
        return isSelected.value ? (`general.un${name}`) : (`general.${name}`);
    }

    function toggleDone() {
        props.toDoListItem.isDone = !props.toDoListItem.isDone;
        emits('isDoneChanged', props.toDoListItem.id, props.toDoListItem.isDone);
    }

    function edit() {
        emits('edit', props.toDoListItem);
    }

    function del() {
        emits('delete', props.toDoListItem.id);
    }
    function toggleSelect() {
        isSelected.value = !isSelected.value;
        if(isSelected.value){
            emits('select', props.toDoListItem.id);            
        }else{
            emits('unSelect', props.toDoListItem.id);
        }
    }

</script>
<style scoped>
    .listItem {
        border: 2px solid black !important;
        border-radius: 5px;
    }
</style>
