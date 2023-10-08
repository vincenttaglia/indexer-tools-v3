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
                    class="mx-3"
                ></v-text-field>
                <v-text-field
                    v-model="newIndexerAddress"
                    label="Indexer Address"
                    class="mx-3"
                ></v-text-field>
                <v-select
                  v-model="newIndexerChain"
                  label="Chain"
                  class="mx-3"
                  :items="chainStore.getChains.map(chain => chain.id)"
                ></v-select>
                <v-checkbox
                    v-model="newIndexerAgentConnect"
                    label="Enable Agent Connect"
                    class="mx-3"
                >
                </v-checkbox>
                <Transition>
                  <v-text-field
                      v-if="newIndexerAgentConnect"
                      v-model="newIndexerAgentEndpoint"
                      label="Indexer Agent Endpoint"
                      class="mx-3"
                  ></v-text-field>
                </Transition>
                
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    color="primary"
                    text
                    @click="accountStore.addAccount(newIndexerAddress, newIndexerName, newIndexerChain); clearForms();"

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
              @click="switchAccount(indexerAccount.address, indexerAccount.chain);"
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
import { ref, watch } from 'vue';
import { useAccountStore } from '@/store/accounts';
import AccountsEdit from './AccountsEdit.vue';
import { useChainStore } from '@/store/chains';
import { useAllocationStore } from '@/store/allocations';
import { useNetworkStore } from '@/store/network';
import { useSubgraphsStore } from '@/store/subgraphs';
import { useDeploymentStatusStore } from '@/store/deploymentStatuses';
import { storeToRefs } from "pinia";
const accountStore = useAccountStore();
const chainStore = useChainStore();
const subgraphStore = useSubgraphsStore();
const allocationStore = useAllocationStore();
const networkStore = useNetworkStore();
const deploymentStatusStore = useDeploymentStatusStore();
const { getActiveUrl } = storeToRefs(accountStore);


const editDialog = ref(false);
const addDialog = ref(false);
const newIndexerName = ref("");
const newIndexerAddress = ref("");
const newIndexerAgentConnect = ref(false);
const newIndexerAgentEndpoint = ref("");
const newIndexerChain = ref(chainStore.getChainID);

function clearForms(){
  editDialog.value = false;
  addDialog.value = false;
  newIndexerName.value = "";
  newIndexerAddress.value = "";
  newIndexerAgentConnect.value = false;
  newIndexerAgentEndpoint.value = "";
  newIndexerChain.value = chainStore.getChainID;
}

function switchAccount(address, chain){
  const oldChain = chainStore.getChainID;
  const newAccount = accountStore.switchAccount(address, chain);
  // If chain switch was triggered, reload data
  if(newAccount && oldChain != chainStore.getChainID){
    networkStore.init();
    subgraphStore.fetchData();
    allocationStore.fetchData();
  }
  
}
watch(getActiveUrl,  async (newUrl, oldUrl) => {
    if(newUrl != oldUrl)
      deploymentStatusStore.update();
  });
</script>

<style scoped>
/* we will explain what these classes do next! */
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>