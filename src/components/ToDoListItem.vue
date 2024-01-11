<template>
    <VListItem :base-color="toDoListItem.urgency.color" class="align-center">
        <template v-slot:prepend="{ isActive }">
            <VListItemAction start>
                <v-checkbox-btn :model-value="isActive" base-color="white" color="white"></v-checkbox-btn>
            </VListItemAction>
        </template>
        <VListItemTitle class="text-white">{{ toDoListItem.name }}</VListItemTitle>
        <VListItemSubtitle class="text-white">{{ toDoListItem.text }}</VListItemSubtitle>

        <template v-slot:append>
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
                        <VBtn class="px-3" :color="item.color" width="100%" @click="item.action"
                            >{{ item.name }}
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

<script lang="ts">
    import { defineComponent } from 'vue';
    import { ToDoListItemEntity } from '../classes/ToDoListItem';

    export default defineComponent({
        props: {
            toDoListItem: {
                type: ToDoListItemEntity,
                required: true,
            },
        },
        data() {
            return {
                actions: [
                    { name: 'select', color: 'yellow', icon: 'check-circle', action: this.select },
                    { name: 'edit', color: 'primary', icon: 'pen-to-square', action: this.edit },
                    { name: 'delete', color: 'error', icon: 'trash', action: this.delete },
                ],
            };
        },
        created() {},
        methods: {
            edit() {
                this.$emit('edit', this.toDoListItem);
            },
            delete() {
                this.$emit('delete', this.toDoListItem.id);
            },
            select() {
                this.$emit('select', this.toDoListItem.id);
            },
            unSelect() {
                this.$emit('unSelect', this.toDoListItem.id);
            },
        },
        emits: ['edit', 'delete', 'select', 'unSelect'],
    });
</script>