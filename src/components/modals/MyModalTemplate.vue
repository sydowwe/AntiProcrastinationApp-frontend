<template>
    <div ref="modalRoot" class="modal" tabIndex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div v-if="hasHeader" class="modal-header">
                    <slot name="modalHeader">
                        <h5 class="modal-title">{{ headerText }}</h5>
                    </slot>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div v-if="hasBody" class="modal-body">
                    <slot>                        
                        {{ bodyText }}
                    </slot>
                </div>
                <div v-if="hasFooter" class="modal-footer">
                    <slot name="modalFooter">
                        <slot v-if="hasAbortBtn" name="abortBtn">
                            <button type="button" class="modalBtn btn btn-secondary" @click="closeModal">{{ abortBtnText }}</button>
                        </slot>
                        <slot v-if="hasSuccessBtn" name="successBtn">
                            <button type="button" class="modalBtn btn btn-primary" @click="successBtnClick">{{ successBtnText }}</button>
                        </slot>
                    </slot>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

    export default {
        components: {},
        props: {          
            hasHeader: {
                type: Boolean,
                default: true,
            },
            headerText: {
                type: String,
                default: 'Modal',
            },
            hasBody: {
                type: Boolean,
                default: true,
            },
            bodyText: {
                type: String,
                default: 'Body',
            },
            hasFooter: {
                type: Boolean,
                default: true,
            },
            hasAbortBtn: {
                type: Boolean,
                default: true,
            },
            abortBtnText: {
                type: String,
                default: 'Close',
            },
            hasSuccessBtn: {
                type: Boolean,
                default: true,
            },
            successBtnText: {
                type: String,
                default: 'OK',
            },

            modalOptions: {
                type: Object,
                default: {
                    backdrop: 'static',
                    keyboard: true,
                    focus: true,
                },
            },
        },
        data() {
            return {
                modal: null,                
            };
        },
        created() {
            console.log(this.modalOptions);
            this.modal = new bootstrap.Modal(this.$refs.modalRoot, {backdrop: true, keyboard:true, focus: true});
        },
        methods: {
            setModalOptions({ backdrop = 'static', keyboard = true, focus = true }) {
                if (typeof backdrop == typeof true || typeof backdrop == typeof 'string') {
                    this.modalOptions.backdrop = backdrop;
                }
                if (typeof keyboard == typeof true) {
                    this.modalOptions.keyboard = keyboard;
                }
                if (typeof focus == typeof true) {
                    this.modalOptions.focus = focus;
                }
            },
            closeModal() {
                this.modal.hide();
            },
            successBtnClick(){
                this.closeModal();
            }
        },
    };
</script>

<style></style>
