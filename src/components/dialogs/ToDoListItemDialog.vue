<template>
    <v-dialog v-model="dialog" max-width="600">
        <v-card class="px-6 py-4 text-center">
            <v-card-title class="pa-0">{{ isEdit ? $t('general.edit') : $t('general.add') + ' to to-do list' }}</v-card-title>
            <v-card-text class="px-0">
               <VTextField :label="$t('general.name')" v-model="toDoListItem.name"></VTextField>
               <VTextField :label="$t('general.text')" v-model="toDoListItem.text"></VTextField>
               <VSelect :label="$t('toDoList.urgency')" v-model="toDoListItem.urgencyId" :clearable="false" hide-details item-title="text" item-value="id" :items="urgencyOptions"></VSelect>
            </v-card-text>
            <v-card-actions class="justify-end px-0">
                <v-btn color="red" @click="closeDialog" >{{ $t('general.cancel') }}</v-btn>
                <v-btn color="green" @click="save">{{ isEdit ? $t('general.edit') : $t('general.add') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { UrgencyEntity } from '../../classes/UrgencyEntity';
import { ToDoListItemDTO } from '../../classes/DTOs/ToDoListItemDTO';
    export default {
        data() {
            return {
                toDoListItem: new ToDoListItemDTO('','',1,false),
                dialog: false,
                urgencyOptions: [] as UrgencyEntity[],
                isEdit: false,
                idToEdit: null as number | null,
            };
        },
        created(){
            this.getUrgencyOptions();
        },
        methods: {
            getUrgencyOptions(){
                window.axios
                    .post(`/urgency/get-all`)
                    .then((response) => {
                        this.urgencyOptions = response.data as UrgencyEntity[];  
                    })
                    .catch((error) => {
                    });
            },
            openDialog(oldToDoListItem: ToDoListItemDTO | null, id: number | null) {   
                if(oldToDoListItem){                 
                    if(id){
                        this.toDoListItem = oldToDoListItem;
                        this.isEdit = true;     
                        this.idToEdit = id;
                    }
                }  
                else{
                    this.isEdit = false;
                }                  
                this.dialog = true;
            },
            closeDialog() {
                this.dialog = false;
            },
            save() {
                if(this.isEdit){
                    this.$emit('edit',this.toDoListItem,this.idToEdit);
                }else{
                    this.$emit('add',this.toDoListItem);
                }
                this.dialog = false;
            },
        },
        emits: ['edit','add']
    };
</script>
