let modalInstances = 0;
const SELECTS = ["role", "category", "activity"];
const ROLE_CATEGORY_SELECTS = ["role","category"];
import "/webjars/select2/4.1.0-rc.0/dist/js/select2.js";

export class _MyModalTemplate {
    #modal;
    #modalOptions = {
        backdrop: 'static',
        keyboard: false,
        focus: true
    };
    #hasHeader = true;
    #hasBody = true;
    #hasFooter = true;
    _headerText = 'Do you want to save activity?';
    _bodyText = 'Save activity and activity length to database?';
    _abortBtnText = 'Close';
    _successBtnText = 'Save changes';
    #template = document.createElement('div');
    #abortBtn = 'abortBtn';
    #successBtn = 'successBtn';
    constructor() {
        this.#abortBtn = 'abortBtn' + modalInstances.toString();
        this.#successBtn = 'successBtn' + modalInstances.toString();
        modalInstances++;
    }
    create() {
        this.#template.classList = 'modal';
        this.#template.tabIndex = '-1';
        this.#template.role = 'dialog';
        this.#template.innerHTML = `
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    ${this.#hasHeader ?
                `<div class="modal-header">
                        <h5 class="modal-title">${this._headerText}</h5>
                    </div>` : ''}
                    ${this.#hasBody ?
                `<div class="modal-body">
                       ${this._bodyText}
                    </div>` : ''}                    
                    ${this.#hasFooter ?
                `<div class="modal-footer">
                        <button type="button" id="${this.#abortBtn}" class="modalBtn btn btn-secondary">${this._abortBtnText}</button>
                        <button type="button" id="${this.#successBtn}" class="modalBtn btn btn-primary">${this._successBtnText}</button>
                    </div>` : ''}
                </div>
            </div>
        `;
        this.#modal = new bootstrap.Modal(this.#template, this.#modalOptions);
        this.setAbortBtnClickFunction = () => { this.getModal.hide() };
        this.setSuccessBtnClickFunction = () => { this.getModal.hide() };
    }
    get getModal() {
        return this.#modal;
    }

    setModalOptions({ backdrop, keyboard, focus }) {
        if (typeof backdrop == typeof true || typeof backdrop == typeof "string") {
            this.#modalOptions.backdrop = backdrop;
        }
        if (typeof keyboard == typeof true) {
            this.#modalOptions.keyboard = keyboard;
        }
        if (typeof focus == typeof true) {
            this.#modalOptions.focus = focus;
        }
    }
    get getTemplate() {
        return this.#template;
    }
    /**
     * @param {boolean} flag
     */
    set setHasHeader(flag) {
        this.#hasHeader = flag;
    }
    /**
      * @param {boolean} flag
      */
    set setHasBody(flag) {
        this.#hasBody = flag;
    }
    /**
     * @param {boolean} flag
     */
    set setHasFooter(flag) {
        this.#hasFooter = flag;
    }
    /**
     * @param {string} headerText
     */
    set setHeaderText(headerText) {
        this._headerText = headerText || this._headerText;
        if (this.#hasHeader) {
            this.getTemplate.querySelector('.modal-title').innerHTML = headerText;
        }
    }
    /**
     * @param {string} bodyText
     */
    set setBodyText(bodyText) {
        this._bodyText = bodyText || this._bodyText;
        if (this.#hasBody) {
            this.getTemplate.querySelector('.modal-body').innerHTML = bodyText;
        }
    }
    /**
     * @param {Node} bodyContent
     */
    set setBodyContent(bodyContent) {
        this._bodyText = '';
        this.getTemplate.querySelector('.modal-body').innerHTML = '';
        if (this.#hasBody) {
            this.getTemplate.querySelector('.modal-body').appendChild(bodyContent);
        }
    }
    /**
    * @param  {(abortBtnText : string, successBtnText:string)}
    */
    set setBtnText({ abortBtnText, successBtnText }) {
        this._abortBtnText = abortBtnText || this._abortBtnText;
        this._successBtnText = successBtnText || this._successBtnText;
        this.#template.querySelector('#' + this.#abortBtn).innerHTML = abortBtnText;
        this.#template.querySelector('#' + this.#successBtn).innerHTML = successBtnText;
    }
    /**
     * @param {(abortBtnIcon : Node,successBtnIcon : Node)}
     */
    set setBtnIcons({ abortBtnIcon, successBtnIcon }) {
        this.#template.querySelector('#' + this.#abortBtn).appendChild(abortBtnIcon);
        this.#template.querySelector('#' + this.#successBtn).appendChild(successBtnIcon);
    }
    /**
     * @param {() => void} functionOnClickAbort
     */
    set setAbortBtnClickFunction(functionOnClickAbort) {
        if (this.#hasFooter) {
            this.#template.querySelector('#' + this.#abortBtn).addEventListener('click', () => {
                functionOnClickAbort();
            });
        }
    }
    /**
    * @param {() => void} functionOnClickSuccess
    */
    set setSuccessBtnClickFunction(functionOnClickSuccess) {
        if (this.#hasFooter) {
            this.#template.querySelector('#' + this.#successBtn).addEventListener('click', () => {
                functionOnClickSuccess();
            })
        }
    }
}
export class NewActivityModalTemplate extends _MyModalTemplate {
    constructor() {
        super();
        this.setHasHeader = false;
        this._abortBtnText = "Cancel";
        this._successBtnText = "Add";
        this.create();
    }
}

export class SaveModalTemplate extends _MyModalTemplate {
    constructor(yesNoModal) {
        super();
        this.create();
        this.setAbortBtnClickFunction = () => {
            this.getModal.hide();
            yesNoModal.show();
        }
        this.setSuccessBtnClickFunction = () => {
            this.getModal.hide();
            //TODO Zapis do databazy;
        }
    }
}

export class YesNoModalTemplate extends _MyModalTemplate {
    constructor() {
        super();
        this.setHasBody = false;
        this._headerText = 'Do you really want to close?';
        this._abortBtnText = 'No';
        this._successBtnText = 'Yes';
    }
}
export class ReallyCloseModal extends YesNoModalTemplate {
    constructor() {
        super();
        this.create();
    }
    /**
     * @param {bootstrap.Modal} returnToModal
     */
    set setReturnToModal(returnToModal) {
        this.setAbortBtnClickFunction = () => {
            this.getModal.hide();
            returnToModal.show();
        }
    }
}


class AddNewActivityTemplate {
    #template = document.createElement('div');
    constructor(){
        this.create();

        $(this.#template).find('#roleCheck').change((e)=>{
            this.#template.querySelector('#roleUnfilteredSelect').nextElementSibling.hidden = e.target.checked;
            this.#template.querySelector('#roleInput').hidden = !e.target.checked;
        });
        $(this.#template).find('#categoryCheck').change((e)=>{
            this.#template.querySelector('#categoryUnfilteredSelect').nextElementSibling.hidden = e.target.checked;
            this.#template.querySelector('#categoryInput').hidden = !e.target.checked;
        });
    }
    create(){        
        const checkbox = (forWho) => {return `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" id="${forWho}Check">
            <label class="form-check-label" for="${forWho}Check">Custom ${forWho}</label>
        </div>`
        };
        this.#template.innerHTML = `
            <div class="form-group mb-2" id="roleInputDiv">
                <label for="roleNew">Role</label>
                <select class="form-select select2 form-input" name="roleNew" id="roleUnfilteredSelect"></select>
                <input type="text" class="form-control form-input" name="roleNew" id="roleInput" hidden>
                ${checkbox("role")}
            </div>
            <div class="form-group mb-2" id="categoryInputDiv">
                <label for="categoryNew">Category</label>
                <select class="form-select select2 form-input" name="categoryNew" id="categoryUnfilteredSelect"></select>
                <input type="text" class="form-control form-input" name="categoryNew" id="categoryInput" hidden>
                ${checkbox("category")}
            </div>
            <div class="form-group mb-2" id="activityInputDiv">
                <label for="activityInput">Activity</label>
                <input type="text" class="form-control form-input" name="activityNew" id="activityInput">
            </div> 
            <div class="form-group mb-2" id="checkBoxes">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="isNecessaryCheck">
                    <label class="form-check-label" for="isNecessaryCheck">Is activity unavoidable</label>
                </div>
            </div>
        `;    
        $(this.#template).addClass("p-3");    
    }
    reset(){
        $(this.#template).find('.form-input').val('');
        $(this.#template).find('.form-check-input').prop('checked',false);
    }
    get getTemplate() {
        return this.#template;
    }
}

export class ActivitySelectionForm {
    #template = document.createElement('form');
    constructor() {
        this.create();
        updateAfterSelect($(this.#template));
        populateFilteredSelects(this.#template);

       /* $(this.#template).find('#activitySelect').on('select2:select', e=>{
            console.log(e.params.data.id);
            $.ajax({
                type: "POST",
                contentType: "application/json",
                url: "/newRecord/get-by-activity",
                data: JSON.stringify(e.params.data.id),
                dataType: 'json'
            }).done(data => {
                console.log(typeof data.activityId);
                console.log(data.roleId);
                console.log(data.categoryId);
                console.log(e);
                console.log($(this.#template).find('#roleSelect'));
                console.log($(this.#template).find('#roleSelect').val());
                console.log($(this.#template).find('#activitySelect').val());

                $(this.#template).find('#roleSelect').val(2).trigger("change");
                $("#roleSelect").val(2).trigger("change");
                console.log($(this.#template).find('#roleSelect').val());
                $(this.#template).find('#categorySelect').val(data.categoryId).trigger('change');
            });
        });*/
    }
    create() {
        this.#template.innerHTML = `
            <div class="form-group mb-3" id="fromToDoListDiv">
                <label for="fromToDoListSelect">Select from to-do list</label>
                <select class="form-select" name="fromToDoList" id="fromToDoListSelect"></select>
            </div>
            <hr>
            <div class="form-group row mb-3" id="roleCategoryDiv">
                <span class="col-12 col-lg-5 mb-3 mb-lg-0">
                    <label for="roleSelect">Role</label>
                    <select class="form-select select2" name="role" id="roleSelect">                    
                    </select>
                </span>
                <span class="col-12 col-lg-7">
                    <label for="categorySelect">Category</label>
                    <select class="form-select select2" name="category" id="categorySelect"></select>
                </span>
            </div>          
            <div class="form-group mb-3" id="activitySelectDiv">
                <label for="activitySelect">Activity</label>
                <select class="form-select select2" name="activity" id="activitySelect"></select>
            </div>            
            <button type="button" class="btn btn-success" id="createActivityBtn">Vytvoriť novú aktivitu</button>
        `;
        $(this.#template).addClass("p-4");

        const newActivityModalTemplate = new NewActivityModalTemplate();
        const modalElement = newActivityModalTemplate.getTemplate;
        const myModal = newActivityModalTemplate.getModal;

        document.getElementById('modals').appendChild(modalElement);
        const addNewActivityTemplate = new AddNewActivityTemplate();
        newActivityModalTemplate.setBodyContent = addNewActivityTemplate.getTemplate;

        newActivityModalTemplate.setAbortBtnClickFunction = () =>{
            myModal.hide();
            addNewActivityTemplate.reset();
        }

        newActivityModalTemplate.setSuccessBtnClickFunction = () =>{
            myModal.hide();

            addNewActivityTemplate.reset();
        }
        $(this.#template).find('#createActivityBtn').click(()=>{
            /*ked to bude pomale pridaj kontrolu či bola updatnuta rola alebo category*/
            myModal.show();
            populateUnfilteredSelects(modalElement);

        });
    }
    get getTemplate() {
        return this.#template;
    }
}

function populateSelects(template,selects,suffix = ""){
    selects.forEach(e=>{
        template.find(`#${e}${suffix}Select`).select2({
            placeholder: `Select by ${e}`,
            dropdownParent: template,
            allowClear: true,
            ajax: {
                url: `/newRecord/${e}-get-all`,
                type: "GET",
                dataType: 'json',
                processResults: function (data) {
                    return {
                        results: $.map(data, function (item) {
                            return {
                                text: item.name,
                                id: item.id
                            }
                        })
                    };
                },
                cache: true
            }
        });
    });
}
function populateFilteredSelects(template){
    populateSelects($(template),SELECTS);
}
function populateUnfilteredSelects(template){
    populateSelects($(template),ROLE_CATEGORY_SELECTS,"Unfiltered");
}
function updateAfterSelect(template){
    let otherSelect;
    let otherSelectOptions;
    ROLE_CATEGORY_SELECTS.forEach(select=>{
        template.find(`#${select}Select`).on('select2:select', e=>{

            $.ajax({
                type: "POST",
                contentType: "application/json",
                url: `/newRecord/get-by-${select}`,
                data: JSON.stringify(e.params.data.id),
                dataType: 'json'
            }).done(data => {
                switch (select) {
                    case "role":
                        otherSelect="category";
                        otherSelectOptions = data.categories;
                        break;
                    case "category":
                        otherSelect="role";
                        otherSelectOptions = data.roles;
                        break;
                }
                template.find(`#${otherSelect}Select`).val(null).trigger('change');
                template.find(`#activitySelect`).val(null).trigger('change');
                template.find(`#${otherSelect}Select`).empty().select2({
                    data: $.map(otherSelectOptions, function (item) {
                        return {
                            text: item.name,
                            id: item.id
                        }
                    })
                });
                template.find(`#activitySelect`).empty().select2({
                    data: $.map(data.activities, function (item) {
                        return {
                            text: item.name,
                            id: item.id
                        }
                    })
                });
            });
        });
    })
}
export function createNewActivity(modal){
    let activityJsonObject = {
        "name": "",
        "isOnToDoList": false,
        "isNecessary": false,
        "roleId": 0,
        "newRoleName": "",
        "categoryId": 0,
        "newCategoryName": ""
    }
    /*activity*/
    activityJsonObject.name = $(modal).find('#activityInput').val();

    /*isOnToDoList*/

    /*isNecessary*/
    activityJsonObject.isNecessary = $(modal).find('#isNecessaryCheck').prop("checked");

    /*role*/
    if($(modal).find('#roleCheck').prop("checked")){
        activityJsonObject.newRoleName = $(modal).find('#roleInput').val();
    }
    else{
        activityJsonObject.roleId = $(modal).find('#roleUnfilteredSelect').val();
    }
    /*category*/
    if($(modal).find('#categoryCheck').prop("checked")){
        activityJsonObject.newCategoryName = $(modal).find('#categoryInput').val();
    }
    else{
        activityJsonObject.categoryId = $(modal).find('#categoryUnfilteredSelect').val();
    }
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: `/newRecord/create-new-activity`,
        data: JSON.stringify(activityJsonObject),
        dataType: 'json'
    }).done(data => {
        alert("Created new activity");
    });
}
export function addNewActivityToHistory(activityId, lengthInMilliSeconds){
    const startInMillis = Date.now() - lengthInMilliSeconds;
    const start = new Date(startInMillis);

    let recordJsonObject = {
        "activityId": parseInt(activityId),
        "length": lengthInMilliSeconds,
        "timeOfStart": start.toISOString().replace("T", " ").replace("Z", "")
    }
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: `/newRecord/add-new-activity-to-history`,
        data: JSON.stringify(recordJsonObject),
        dataType: 'json'
    }).done(data => {
        alert("Added record of activity to history");
    });
}

$().ready(function (){
    $('#timerType').on('input',function(){
        window.location.href=`${this.value}`;
    });
});