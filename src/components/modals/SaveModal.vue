<template>
    <my-modal-template headerText="Do you want to save activity?" successBtnText="Save">
        <div class="d-flex flex-column">
            <span>You have done your activity - {{ activityName }}</span>
            <span>for {{activityLength}}</span>
            <span>Do you want to save your progress to history?</span>
        </div>
        <template #successBtn>
            <button type="button" class="modalBtn btn btn-primary" @click="save">{{ successBtnText }}</button>
        </template>
    </my-modal-template>
    <yes-no-modal></yes-no-modal>
</template>
<script>
    import MyModalTemplate from './MyModalTemplate.vue';
    import YesNoModal from './YesNoModal.vue';
    export default {
        components: {
            MyModalTemplate,
            YesNoModal
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
            },
        data(){
            return {
            }
        },
        methods:{
            save(){
                
            }
        }
    }
</script>
<style></style>
