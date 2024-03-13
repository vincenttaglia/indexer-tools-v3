<template>
  <v-snackbar
    v-model="snackbar"
    variant="flat"
    location="top"
    style="margin-top:100px"
  >
    {{ text }}

    <template v-slot:actions>
      <v-btn
        variant="text"
        @click="snackbar = false"
        location = "bottom"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
  <h3 v-if="!accountStore.getAgentConnectStatus" class="mx-3 my-5">Set Agent Conenct settings in account settings.</h3>
  <br><br>
  <v-dialog width="500" v-if="accountStore.getAgentConnectStatus">
    <template v-slot:activator="{ props }">
      <div class="d-flex">
        <v-text-field
            v-model="newOffchainSync"
            style="max-width:350px"
            class="mx-5 d-inline-block"
        ></v-text-field>
        <v-btn v-bind="props" text="Add Deployment" class="mx-5 d-inline-block"> </v-btn>
      </div>
    </template>

    <template v-slot:default="{ isActive }">
      <v-card title="Add to Offchain Sync List">
        <v-card-text>
          Are you sure you want to add {{ newOffchainSync }} to offchain sync list?
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            text="Back"
            @click="isActive.value = false"
          ></v-btn>
          <v-btn
            text="Add to Offchain Sync List"
            @click="addOffchainSync(newOffchainSync); isActive.value = false"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
  <br><br>
  <v-dialog width="500" v-if="accountStore.getAgentConnectStatus">
    <template v-slot:activator="{ props }">
      <div class="d-flex">
        <v-text-field
          v-model="newOffchainSyncRemoval"
          style="max-width:350px"
          class="mx-5 d-inline-block"
        ></v-text-field>
        <v-btn v-bind="props" text="Remove Deployment" class="mx-5 d-inline-block"> </v-btn>
      </div>
    </template>

    <template v-slot:default="{ isActive }">
      <v-card title="Remove from Offchain Sync List">
        <v-card-text>
          Are you sure you want to remove {{ newOffchainSyncRemoval }} from offchain sync list?
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            text="Back"
            @click="isActive.value = false"
          ></v-btn>
          <v-btn
            text="Remove from Offchain Sync List"
            @click="removeOffchainSync(newOffchainSyncRemoval); isActive.value = false"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
  <br><br>

  <v-data-table
      :headers="headers"
      :items="offchainSyncs"
      class="elevation-1"
      mobile-breakpoint="0"
      show-select
      v-model="selected"
      :loading="loading"
      item-value="identifier"
      items-per-page="-1"
  >
  </v-data-table>
  <br>
  <v-dialog width="500" v-if="accountStore.getAgentConnectStatus">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" text="Remove Deployments" class="mx-5"> </v-btn>
    </template>

    <template v-slot:default="{ isActive }">
      <v-card title="Remove Offchain Syncs">
        <v-card-text>
          Are you sure you want to remove offchain syncs {{ selected.toString() }}?
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            text="Back"
            @click="isActive.value = false"
          ></v-btn>
          <v-btn
            text="Remove from Offchain Sync List"
            @click="removeOffchainSyncs(); isActive.value = false"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
  <br>
  <br>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useNewAllocationSetterStore } from '@/store/newAllocationSetter';
import { storeToRefs } from 'pinia';
import { useChainStore } from '@/store/chains';
import gql from 'graphql-tag';
import { useAccountStore } from '@/store/accounts';
const newAllocationSetterStore = useNewAllocationSetterStore();
newAllocationSetterStore.update();

const chainStore = useChainStore();
const accountStore = useAccountStore();
const { getActiveAccount } = storeToRefs(accountStore);


const offchainSyncs = ref([]);
const selected = ref([]);
const loading = ref(accountStore.getAgentConnectStatus);
const snackbar = ref(false);
const text = ref("");
const newOffchainSync = ref("");
const newOffchainSyncRemoval = ref("");
if(accountStore.getAgentConnectStatus)
  queryOffchainSyncs();

watch(getActiveAccount, () => {
  offchainSyncs.value = [];
  if(accountStore.getAgentConnectStatus)
    queryOffchainSyncs();
});
function getURL(path, base){
  return new URL(path, base);
}

async function addOffchainSync(ipfsHash){
  let indexingRuleInput = {
    identifier: ipfsHash,
    identifierType: 'deployment',
    decisionBasis: 'offchain',
    protocolNetwork: chainStore.getActiveChain.id,
  }
  accountStore.getAgentConnectClient.mutate({
    mutation: gql`mutation setIndexingRule($rule: IndexingRuleInput!){
      setIndexingRule(rule: $rule) {
        identifier
        decisionBasis
      }
    }`,
    variables: { rule: indexingRuleInput }
  }).then((data) => {
    console.log("AGENT CONNECT DATA");
    console.log(data);
    if(!data.data.errors){
      text.value = `${data.data.setIndexingRule.identifier.slice(0,7)}... added to offchain sync list`;
      snackbar.value = true;
    }else{
      text.value = 'Indexer Agent error. Check console for details.'
      snackbar.value = true;
    }
  });
}

async function removeOffchainSyncs(){
  for(let i = 0; i < selected.value.length; i++){
    removeOffchainSync(selected.value[i]);
  }
}

async function removeOffchainSync(ipfsHash){
  let indexingRuleIdentifier = {
    identifier: ipfsHash,
    protocolNetwork: chainStore.getActiveChain.id,
  }
  accountStore.getAgentConnectClient.mutate({
    mutation: gql`mutation deleteIndexingRule($identifier: IndexingRuleIdentifier!){
      deleteIndexingRule(identifier: $identifier) {
        identifier
      }
    }`,
    variables: { identifier: indexingRuleIdentifier }
  }).then((data) => {
    console.log("AGENT CONNECT DATA");
    console.log(data);
    if(!data.data.errors){
      text.value = `Subgraph removed from offchain sync list`;
      snackbar.value = true;
    }else{
      text.value = 'Indexer Agent error. Check console for details.'
      snackbar.value = true;
    }
  });
}

async function queryOffchainSyncs(){
  loading.value = true;
  return accountStore.getAgentConnectClient.query({
    query: gql`query indexingRules($protocolNetwork: String){
      indexingRules(protocolNetwork: $protocolNetwork) {
        identifier
        identifierType
        decisionBasis
      }
    }`,
    variables: { protocolNetwork: chainStore.getActiveChain.id },
    fetchPolicy: 'network-only',
  }).then((data) => {
    console.log("AGENT CONNECT QUERY OFFCHAIN SYNC DATA");
    console.log(data);
    const filteredSyncs = data.data.indexingRules.filter((r) => r.decisionBasis == 'offchain');
    offchainSyncs.value = filteredSyncs;
    loading.value = false;
    return filteredSyncs;
  });
}

const headers = ref([
  { title: 'ID', key: 'identifier'},
  { title: 'ID Type', key: 'identifierType' },
  { title: 'Decision Basis', key: 'decisionBasis' },
]);
</script>