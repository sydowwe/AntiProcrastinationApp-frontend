<template>
    <my-modal-template headerText="Do you really want to close?" has-body="false">        
        <template #successBtn>
            <button type="button" class="modalBtn btn btn-primary" @click="save">Save</button>
        </template>
    </my-modal-template>
</template>
<script>
    import MyModalTemplate from './MyModalTemplate.vue';
    export default {
        components: {
            MyModalTemplate,
        },
        props: {
            activityLength: {
                type: Number,
                default: 0,
            },
            activityName: {
                type: String,
                default: '',
            },
            returnModal: {
                type: Object,
                default: null,
            }
        },
        data() {
            return {};
        },
        methods: {
            save() {},
        },
    };
</script>
<style></style>