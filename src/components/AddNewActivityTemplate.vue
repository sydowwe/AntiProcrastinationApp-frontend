<template>
    <div>
        <div class="form-group mb-2" id="roleInputDiv">
            <label for="roleNew">Role</label>
            <select v-if="!isCustomRole" class="form-select select2 form-input" name="roleNew" id="roleUnfilteredSelect"></select>
            <input v-else type="text" class="form-control form-input" name="roleNew" id="roleInput" hidden />
            <div class="form-check">
                <input v-model="isCustomRole" class="form-check-input" type="checkbox" id="roleCheck" />
                <label class="form-check-label" for="roleCheck">Custom role</label>
            </div>
        </div>
        <div class="form-group mb-2" id="categoryInputDiv">
            <label for="categoryNew">Category</label>
            <select v-if="!isCustomCategory" class="form-select select2 form-input" name="categoryNew" id="categoryUnfilteredSelect"></select>
            <input v-else type="text" class="form-control form-input" name="categoryNew" id="categoryInput" hidden />
            <div class="form-check">
                <input v-model="isCustomCategory"  class="form-check-input" type="checkbox" id="categoryCheck" />
                <label class="form-check-label" for="categoryCheck">Custom category</label>
            </div>
        </div>
        <div class="form-group mb-2" id="activityInputDiv">
            <label for="activityInput">Activity</label>
            <input type="text" class="form-control form-input" name="activityNew" id="activityInput" />
        </div>
        <div class="form-group mb-2" id="checkBoxes">
            <div class="form-check">
                <input v-model="isObligatoryActivity" class="form-check-input" type="checkbox" id="isNecessaryCheck" />
                <label class="form-check-label" for="isNecessaryCheck">Is activity unavoidable</label>
            </div>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                isCustomRole: false,
                isCustomCategory: false,
                isObligatoryActivity: false
            };
        },
        created() {            
        },       
        methods: {
            reset() {
                $('.form-input').val('');
                $('.form-check-input').prop('checked', false);
            },
        },
    };
</script>
