<template>
    <v-dialog v-model="dialog" max-width="600">
        <v-card>
            <v-card-title class="headline">Record new activity</v-card-title>
            <v-card-text>
                <div class="text-center">
                    <span
                        >Confirm saving activity - <i>{{ activity }}</i> done for {{ timeSpent }} ?</span
                    >
                </div>
            </v-card-text>
            <v-card-actions class="justify-center">
                <v-btn color="red" @click="close">{{ i18n.t('general.cancel') }}</v-btn>
                <v-btn color="green" @click="saveActivity">{{ i18n.t('activities.saveActivity') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script setup lang="ts">
    import { ref } from 'vue';
    import { importDefaults } from '../../compositions/Defaults';
    const {i18n} = importDefaults();
    const activity = ref('sitting around');
    const timeSpent = ref('0s');
    const dialog = ref(false);

    function open(_activity: string, _timeSpent: string) {
        activity.value = _activity ?? activity.value;
        timeSpent.value = _timeSpent;
        dialog.value = true;
    }
    function close() {
        dialog.value = false;
        emit('resetTime');
    }
    function saveActivity() {
        emit('saved');
        close();
    }
    const emit = defineEmits(['saved', 'resetTime']);
    defineExpose({open});
</script>
