<template>
  <div class="p-4">
    <div class="form-group mb-3" id="fromToDoListDiv">
      <label for="fromToDoListSelect">Select from to-do list</label>
      <select
        class="form-select"
        name="fromToDoList"
        id="fromToDoListSelect"
      ></select>
    </div>
    <hr />
    <div class="form-group row mb-3" id="roleCategoryDiv">
      <span class="col-12 col-lg-5 mb-3 mb-lg-0">
        <label for="roleSelect">Role</label>
        <select
          class="form-select select2"
          name="role"
          id="roleSelect"
        ></select>
      </span>
      <span class="col-12 col-lg-7">
        <label for="categorySelect">Category</label>
        <select
          class="form-select select2"
          name="category"
          id="categorySelect"
        ></select>
      </span>
    </div>
    <div class="form-group mb-3" id="activitySelectDiv">
      <label for="activitySelect">Activity</label>
      <select
        class="form-select select2"
        name="activity"
        id="activitySelect"
      ></select>
    </div>
    <button type="button" class="btn btn-success" id="createActivityBtn">
      Vytvoriť novú aktivitu
    </button>
  </div>
</template>
<script>
export default {
  created() {
    newActivityModalTemplate.setAbortBtnClickFunction = () => {
      myModal.hide();
      addNewActivityTemplate.reset();
    };

    newActivityModalTemplate.setSuccessBtnClickFunction = () => {
      myModal.hide();

      addNewActivityTemplate.reset();
    };
    $(this.#template)
      .find("#createActivityBtn")
      .click(() => {
        /*ked to bude pomale pridaj kontrolu či bola updatnuta rola alebo category*/
        myModal.show();
        this.populateUnfilteredSelects(modalElement);
      });

    this.updateAfterSelect($(this.#template));
    this.populateFilteredSelects(this.#template);

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
  },
  methods: {
    populateSelects(template, selects, suffix = "") {
      selects.forEach((e) => {
        template.find(`#${e}${suffix}Select`).select2({
          placeholder: `Select by ${e}`,
          dropdownParent: template,
          allowClear: true,
          ajax: {
            url: `/newRecord/${e}-get-all`,
            type: "GET",
            dataType: "json",
            processResults: function (data) {
              return {
                results: $.map(data, function (item) {
                  return {
                    text: item.name,
                    id: item.id,
                  };
                }),
              };
            },
            cache: true,
          },
        });
      });
    },
    populateFilteredSelects(template) {
      populateSelects($(template), SELECTS);
    },
    populateUnfilteredSelects(template) {
      populateSelects($(template), ROLE_CATEGORY_SELECTS, "Unfiltered");
    },
    updateAfterSelect(template) {
      let otherSelect;
      let otherSelectOptions;
      ROLE_CATEGORY_SELECTS.forEach((select) => {
        template.find(`#${select}Select`).on("select2:select", (e) => {
          $.ajax({
            type: "POST",
            contentType: "application/json",
            url: `/newRecord/get-by-${select}`,
            data: JSON.stringify(e.params.data.id),
            dataType: "json",
          }).done((data) => {
            switch (select) {
              case "role":
                otherSelect = "category";
                otherSelectOptions = data.categories;
                break;
              case "category":
                otherSelect = "role";
                otherSelectOptions = data.roles;
                break;
            }
            template.find(`#${otherSelect}Select`).val(null).trigger("change");
            template.find(`#activitySelect`).val(null).trigger("change");
            template
              .find(`#${otherSelect}Select`)
              .empty()
              .select2({
                data: $.map(otherSelectOptions, function (item) {
                  return {
                    text: item.name,
                    id: item.id,
                  };
                }),
              });
            template
              .find(`#activitySelect`)
              .empty()
              .select2({
                data: $.map(data.activities, function (item) {
                  return {
                    text: item.name,
                    id: item.id,
                  };
                }),
              });
          });
        });
      });
    },
  },
};
</script>
