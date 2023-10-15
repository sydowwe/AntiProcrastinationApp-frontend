<template>
  <div class="container">
    <h4 class="text-center mb-2">Zadajte QR kód z aplikácie</h4>
    <form @submit.prevent="handleSubmit" class="d-flex flex-column">
      <div class="form-group mb-2">
        <label class="form-label" for="code">QR kód</label>
        <input
          type="text"
          id="code"
          class="form-control form-control-lg"
          v-model="code"
        />
      </div>
    </form>
  </div>
</template>
<script>
export default {
  props: {
    personData: {
      type: Object,
      required: true,
    },
    modalRef: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      code: "",
    };
  },
  created() {},
  methods: {
    handleSubmit() {
      this.personData.code = this.code;
      $.ajax({
        type: "POST",
        contentType: "application/json",
        url: "/zad1/api/verifyQR.php",
        data: JSON.stringify(this.personData),
        dataType: "json",
      })
        .done((data) => {
          this.isError = data.error;
          if (!this.isError) {
            this.modalRef.hideModal();
            this.$router.push({ name: "home" });
          } else {
            alert("Nesprávny QR kód!");
          }
        })
        .fail((error) => {
          console.log(error);
        });
    },
  },
};
</script>
