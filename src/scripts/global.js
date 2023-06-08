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