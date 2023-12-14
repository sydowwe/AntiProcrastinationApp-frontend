<template>
    <v-dialog v-model="dialog" max-width="600">
        <v-card>
            <v-card-title class="headline">Record new activity</v-card-title>
            <v-card-text>
                <div class="text-center">
                    <span>Confirm saving activity - <i>{{ activity }}</i> done for {{ timeSpent }} ?</span>
                </div>
            </v-card-text>
            <v-card-actions class="justify-center">
                <v-btn color="red" @click="close" >{{ $t('general.cancel') }}</v-btn>
                <v-btn color="green" @click="saveActivity">{{ $t('activities.saveActivity') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
    export default {
        data() {
            return {
                activity: 'sitting around',
                timeSpent: '0s',
                dialog: false,
            };
        },
        methods: {
            open(activity: string, timeSpent:string) {
                this.activity = activity ?? this.activity;
                this.timeSpent = timeSpent;
                this.dialog = true;
            },
            close() {
                this.dialog = false;
                this.$emit('resetTime');
            },
            saveActivity() {
                this.dialog = false;
                this.$emit('saved');
                this.$emit('resetTime');
            },
        },
    };
</script>
