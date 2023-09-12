<template>
    <v-container fluid>
        <v-row justify="center">
            <v-col cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
                <v-card class="mx-auto" max-width="400">
                    <VBtn color="green">Pridať</VBtn>
                    <v-list lines="three" select-strategy="classic">
                        <v-list-subheader>Tasks</v-list-subheader>
                        <v-list-item value="notifications">
                            <template v-slot:prepend="{ isActive }">
                                <v-list-item-action start>
                                    <v-checkbox-btn :model-value="isActive"></v-checkbox-btn>
                                </v-list-item-action>
                            </template>
                            <v-list-item-title>Notifications</v-list-item-title>
                            <v-list-item-subtitle> Notify me about updates to apps or games that I downloaded </v-list-item-subtitle>
                        </v-list-item>                       
                    </v-list>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    export default {
        components: {},
        data() {
            return {
                items: [],
            };
        },
        created() {},
        methods: {
            getAllRecords() {
                let url = `/to-do-list/get-default`;
                axios
                    .post(url)
                    .then((response) => {
                        this.items = response.data;
                        console.log(this.items);
                    })
                    .catch((error) => {});
            },
        },
    };
</script>
