<template>
    <v-dialog v-model="dialog" max-width="600">
        <v-card>
            <v-card-title class="headline">{{ title }}</v-card-title>
            <v-card-text>
                <slot></slot>
            </v-card-text>
            <v-card-actions class="justify-center">
                <VBtn variant="elevated" color="red" @click="close()">{{ $t('general.cancel') }}</VBtn>
                <VBtn variant="elevated" color="green" @click="confirmed()" >{{confirmBtnLabel}}</VBtn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
    export default {
        props: {            
            title: String,
            confirmBtnLabel: {
                type: String,
                requrired: true
            },
        },
        data() {
            return {
               dialog: false
            };
        },       
        methods: {
            open() {
                this.dialog = true;
            },
            close() {
                this.dialog = false;
            },
            confirmed() {
                this.$emit('confirmed');
                this.dialog = false;
            },
        },
    };
</script>
