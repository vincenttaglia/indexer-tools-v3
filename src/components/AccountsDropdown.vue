<template>
  <v-menu offset-y>
    <template v-slot:activator="{ props }">
      <v-btn
          v-bind="props"
          text
      >
        {{ accountStore.getActiveAccount.name }}
        -
        {{ accountStore.getActiveAccount.address.substring(0,6) }}...{{ accountStore.getActiveAccount.address.substring(accountStore.getActiveAccount.address.length - 4, accountStore.getActiveAccount.address.length) }}
      </v-btn>
    </template>
    <v-card>
      <v-list dense>
        <v-subheader class="d-flex ma-2">
          <h3 class="pl-2">Accounts</h3>
          <v-dialog
              v-model="editDialog"
              width="500"
          >
            <template v-slot:activator="{ props }">
              <v-icon style="margin: 0 0 5px 8px" small clickable v-bind="props">mdi-pencil</v-icon>
            </template>

            <v-card>
              <v-card-title class="text-h5">
                Edit Saved Accounts
              </v-card-title>

              <v-card-text>
                <accounts-edit></accounts-edit>
              </v-card-text>

            </v-card>
          </v-dialog>
          <v-spacer class="d-inline-block"></v-spacer>
          <v-dialog
              v-model="addDialog"
              width="500"
          >
            <template v-slot:activator="{ props }">
              <v-icon small clickable v-bind="props" style="margin-bottom: 5px">mdi-plus</v-icon>
            </template>

            <v-card>
              <v-card-title class="text-h5">
                Add Indexer Account
              </v-card-title>

              <v-card-text>
                <v-text-field
                    v-model="newIndexerName"
                    label="Indexer Name"
                    class="mx-6"
                ></v-text-field>
                <v-text-field
                    v-model="newIndexerAddress"
                    label="Indexer Address"
                    class="mx-6"
                ></v-text-field>
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    color="primary"
                    text
                    @click="accountStore.addAccount(newIndexerAddress, newIndexerName);"

                >
                  Add
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-subheader>
        <v-divider></v-divider>
        <v-list-item-group
            color="primary"
        >
          <v-list-item
              v-for="(indexerAccount) in accountStore.accounts"
              :key="indexerAccount.address"
              @click="accountStore.switchAccount(indexerAccount.address);"
          >
            <v-list-item-content>
              <v-list-item-title v-text="indexerAccount.name"></v-list-item-title>
              {{ indexerAccount.address.substring(0,6) }}...{{ indexerAccount.address.substring(indexerAccount.address.length - 4, indexerAccount.address.length) }}
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup>
import { ref } from 'vue';
import { useAccountStore } from '@/store/accounts';
import AccountsEdit from './AccountsEdit.vue';
const accountStore = useAccountStore();
const editDialog = ref(false);
const addDialog = ref(false);
const newIndexerName = ref("");
const newIndexerAddress = ref("");
</script>