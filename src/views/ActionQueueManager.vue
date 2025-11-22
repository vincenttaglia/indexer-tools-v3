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
  <br>
  <div class="d-flex justify-space-between">
    <div class="d-flex mr-auto flex-1-1-0 align-center">
      <v-btn text="Refresh actions" prepend-icon="mdi-refresh" @click="queryActions()" class="mx-5 my-6" v-if="accountStore.getAgentConnectStatus" stacked></v-btn>
      <v-select
          v-model="managerSettingStore.settings.statusFilter"
          :items="[{title: 'Queued', value: 'queued'}, {title:'Approved', value: 'approved'}, {title: 'Pending', value: 'pending'}, {title: 'Success', value: 'success'}, {title: 'Failed', value: 'failed'}, {title: 'Canceled', value: 'canceled'}]"
          label="Status Filter"
          class="d-inline-block mx-5 mt-6 flex-0-1"
          multiple
          clearable
          chips
          style="min-width: 150px;"
      ></v-select>
      <v-select
          v-model="managerSettingStore.settings.selectStrategy"
          :items="[{title: 'Page', value: 'page'}, {title:'All', value: 'all'}]"
          label="Select Strategy"
          class="d-inline-block mx-5 mt-6 flex-0-1"
          style="min-width: 150px;"
      ></v-select>
    </div>
    <div class="d-flex text-center flex-row ml-auto mr-auto align-stretch">
      <v-card style="min-width: 150px" variant="tonal" class="mx-1">
        <v-card-text>
          Succeeded:
          <h1 class="pt-2">{{ actionSuccesses }}</h1>
        </v-card-text>
      </v-card>
      <v-card style="min-width: 150px" variant="tonal" class="mx-1">
        <v-card-text>
          Failed:
          <h1 class="pt-2">{{ actionFailures }}</h1>
        </v-card-text>
      </v-card>
    </div>
    <div class="ml-auto flex-1-1-0">
      &nbsp;
    </div>
  </div>
  
  <v-data-table
      :headers="headers"
      :items="filteredActions"
      class="elevation-1"
      mobile-breakpoint="0"
      show-select
      v-model="selected"
      :loading="loading"
      v-model:sort-by="sortBy"
      :select-strategy="managerSettingStore.settings.selectStrategy"
  >
    <template v-slot:item.transaction="{ item }">
      <v-btn  
          variant="tonal"
          v-if="item.transaction != undefined" 
          :href="getURL(`/tx/${item.transaction}`, chainStore.getBlockExplorer)"
          target="_blank"
      > 
        {{item.transaction.slice(0,6) }}...{{ item.transaction.slice(item.transaction.length-4,item.transaction.length) }}
      </v-btn>
    </template>
    <template v-slot:item.failureReason="{ item }">
      <v-btn
          variant="tonal"
          v-if="item.failureReason != undefined"
          :href="`https://github.com/graphprotocol/indexer/blob/main/docs/errors.md#${item.failureReason.toLowerCase()}`"
          target="_blank"
      >
        {{ item.failureReason }}
      </v-btn>
    </template>
    <template v-slot:item.metadata.image="{ item }">
      <v-badge
          :model-value="item.deployment && item.deployment.deniedAt != '0'"
          bordered
          color="error"
          icon="mdi-currency-usd-off"
          overlap
          avatar
      >
        <v-avatar size="30">
          <v-img :src="item.metadata.image" />
        </v-avatar>
      </v-badge>
    </template>
    <template v-slot:item.deployment.createdAt="{ item }">
      <span :timestamp="item.deployment.createdAt">{{ moment(item.deployment.createdAt + "000", "x").format("MMM D, YYYY HH:mm") }}</span>
    </template>
    <template v-slot:item.deployment.signalledTokens="{ item }">
      {{ numeral(Web3.utils.fromWei(item.deployment.signalledTokens)).format('0,0') }} GRT
    </template>
    <template v-slot:item.deployment.indexingRewardAmount="{ item }">
      {{ numeral(Web3.utils.fromWei(item.deployment.indexingRewardAmount)).format('0,0') }} GRT
    </template>
    <template v-slot:item.deployment.queryFeesAmount="{ item }">
      {{ numeral(Web3.utils.fromWei(item.deployment.queryFeesAmount)).format('0,0') }} GRT
    </template>
    <template v-slot:item.deployment.stakedTokens="{ item }">
      {{ numeral(Web3.utils.fromWei(item.deployment.stakedTokens)).format('0,0') }} GRT
    </template>
    <template v-slot:item.proportion="{ item }">
      {{ numeral(item.proportion).format('0,0.000%') }}
    </template>
    <template v-slot:item.newProportion="{ item }">
      {{ numeral(item.newProportion).format('0,0.000%') }}
    </template>
    <template v-slot:item.apr="{ item }">
      {{ numeral(item.apr).format('0,0.00') }}%
    </template>
    <template v-slot:item.newApr="{ item }">
      {{ numeral(item.newApr.toString()).format('0,0.00') }}%
    </template>
    <template v-slot:item.dailyRewards="{ item }">
      {{ numeral(Web3.utils.fromWei(Web3.utils.toBN(item.dailyRewards))).format('0,0') }} GRT
    </template>
    <template v-slot:item.dailyRewardsCut="{ item }">
      {{ numeral(Web3.utils.fromWei(Web3.utils.toBN(item.dailyRewardsCut))).format('0,0') }} GRT
    </template>
  </v-data-table>
  <br>
  <div class="d-flex">
    <v-dialog width="500" v-if="accountStore.getAgentConnectStatus">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" text="Approve Actions" prepend-icon="mdi-check" class="mx-5"> </v-btn>
      </template>

      <template v-slot:default="{ isActive }">
        <v-card title="Approve Actions">
          <v-card-text>
            Are you sure you want to approve action IDs {{ selected.toString() }}?
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn
              text="Back"
              @click="isActive.value = false"
            ></v-btn>
            <v-btn
              text="Approve Actions"
              @click="approveActions(); isActive.value = false"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
    <v-dialog width="500" v-if="accountStore.getAgentConnectStatus">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" text="Cancel Actions" prepend-icon="mdi-cancel" class="mx-5"> </v-btn>
      </template>

      <template v-slot:default="{ isActive }">
        <v-card title="Cancel Actions">
          <v-card-text>
            Are you sure you want to cancel action IDs {{ selected.toString() }}?
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn
              text="Back"
              @click="isActive.value = false"
            ></v-btn>
            <v-btn
              text="Cancel Actions"
              @click="cancelActions(); isActive.value = false"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
    <v-dialog width="500" v-if="accountStore.getAgentConnectStatus">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" text="Delete Actions" prepend-icon="mdi-delete" class="mx-5"> </v-btn>
      </template>

      <template v-slot:default="{ isActive }">
        <v-card title="Approve Actions">
          <v-card-text>
            Are you sure you want to delete action IDs {{ selected.toString() }}?
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn
              text="Back"
              @click="isActive.value = false"
            ></v-btn>
            <v-btn
              text="Delete Actions"
              @click="deleteActions(); isActive.value = false"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
  </div>
  <br>
  <div class="d-flex my-10">
    <v-btn text="Queue actions" @click="sendActionsToAgent()" class="mx-5" prepend-icon="mdi-tray-full" stacked></v-btn>
    <v-dialog width="500" v-if="accountStore.getAgentConnectStatus">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" text="Execute Approved Actions" prepend-icon="mdi-play" class="mx-5" stacked> </v-btn>
      </template>

      <template v-slot:default="{ isActive }">
        <v-card title="Execute Approved Actions">
          <v-card-text>
            Are you sure you want to execute all approved actions?
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn
              text="Back"
              @click="isActive.value = false"
            ></v-btn>
            <v-btn
              text="Execute Approved Actions"
              @click="executeApprovedActions(); isActive.value = false"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
  </div>
  <div class="d-flex my-10">
    <v-expansion-panels>
      <v-expansion-panel
        :title="`Errors (${ actionErrors.length })`"
      >
        <v-expansion-panel-text>
          <v-card
            v-for="(error, i) in actionErrors"
            :key="i"
            class="my-1 px-5 py-2"
          >
            {{ error }}
          </v-card>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
  
</template>

<script setup>
import moment from 'moment';
import Web3 from 'web3';
import numeral from 'numeral';
import { ref, watch, computed } from 'vue';
import { useSubgraphsStore } from '@/store/subgraphs';
import { useNewAllocationSetterStore } from '@/store/newAllocationSetter';
import { storeToRefs } from 'pinia';
import { useChainStore } from '@/store/chains';
import gql from 'graphql-tag';
import { useAccountStore } from '@/store/accounts';
import { useManagerSettingStore } from '@/store/managerSettings';
const subgraphStore = useSubgraphsStore();
const newAllocationSetterStore = useNewAllocationSetterStore();
newAllocationSetterStore.update();

const { newAllocations, getSelectedS } = storeToRefs(newAllocationSetterStore);
const chainStore = useChainStore();
const accountStore = useAccountStore();
const { getActiveAccount } = storeToRefs(accountStore);
const managerSettingStore = useManagerSettingStore();


const actions = ref([]);
const selected = ref([]);
const loading = ref(accountStore.getAgentConnectStatus);
const snackbar = ref(false);
const text = ref("");
const sortBy = ref([{ key: 'id', order: 'desc' }]);
const actionErrors = ref([]);
const actionFailures = ref(0);
const actionSuccesses = ref(0);
const filteredActions = computed(() => {
  let fActions = actions.value;
  
  if(managerSettingStore.statusFilter.length > 0){
    fActions = fActions.filter((e) => managerSettingStore.statusFilter.includes(e.status))
  }

  return fActions;
})
if(accountStore.getAgentConnectStatus)
  queryActions();

watch(getActiveAccount, () => {
  actions.value = [];
  if(accountStore.getAgentConnectStatus)
    queryActions();
});
function getURL(path, base){
  return new URL(path, base);
}

async function batchSendActions(actions){
  let x = 0;
  let reqs = []
  while(x < newAllocationSetterStore.actionsQueueBuildAPIObject.length){
    let actionsBatch = actions.slice(x, x+100);
    reqs.push(accountStore.getAgentConnectClient.mutate({
      mutation: gql`mutation queueActions($actions: [ActionInput!]!){
        queueActions(actions: $actions) {
          actions{
            id
            status
            type
            deploymentID
            allocationID
            amount
            poi
            publicPOI
            poiBlockNumber
            force
            priority
            source
            reason
            transaction
            failureReason
            createdAt
            updatedAt
            protocolNetwork
            isLegacy
          }
        }
      }`,
      variables: { actions: actionsBatch }
    }));
    x = x+100;
  }
  return Promise.all(reqs);
  
}

function sendActionsToAgent(){
  batchSendActions(newAllocationSetterStore.actionsQueueBuildAPIObject).catch((errors) => {
    console.log("Action Queue Errors:")
    for(let i in errors){
      console.log(errors[i]);
    }
    actionErrors.value = actionErrors.value.concat(errors);
    text.value = 'Indexer Agent error. Check errors for details.'
    snackbar.value = true;
  }).then((data) => {
    console.log("AGENT CONNECT SEND ACTIONS DATA");
    console.log(data);
    text.value = `Queued ${data.reduce((n, currentBatch) => n + currentBatch.data.queueActions.length, 0)} actions`;
    snackbar.value = true;
    queryActions();
  });
}

async function approveActions(){
  return accountStore.getAgentConnectClient.mutate({
    mutation: gql`mutation approveActions($actionIDs: [String!]!){
      approveActions(actionIDs: $actionIDs) {
        id
        status
        type
        deploymentID
        allocationID
        amount
        poi
        publicPOI
        poiBlockNumber
        force
        priority
        source
        reason
        transaction
        failureReason
        createdAt
        updatedAt
        protocolNetwork
        isLegacy
      }
    }`,
    variables: { actionIDs: selected.value.map(String) },
  }).catch((errors) => {
    console.log("Approve Action Errors:")
    for(let i in errors){
      console.log(errors[i]);
    }
    actionErrors.value = actionErrors.value.concat(errors);
    text.value = 'Indexer Agent error. Check errors for details.'
    snackbar.value = true;
  }).then((data) => {
    console.log("Approve Action Data")
    console.log(data);
    selected.value = [];
    for(let i = 0; i < data.data.approveActions.length; i++)
      actions.value = actions.value.map((e) => e.id == data.data.approveActions[i].id ? data.data.approveActions[i] : e);

    text.value = `Approved ${data.data.approveActions.length} actions`
    snackbar.value = true;
    
    if(data.data.approveActions.length == 0)
      queryActions();

    return data.data.approveActions;
  });
}

async function deleteActions(){
  return accountStore.getAgentConnectClient.mutate({
    mutation: gql`mutation deleteActions($actionIDs: [String!]!){
      deleteActions(actionIDs: $actionIDs) {
        id
        status
        type
        deploymentID
        allocationID
        amount
        poi
        publicPOI
        poiBlockNumber
        force
        priority
        source
        reason
        transaction
        failureReason
        createdAt
        updatedAt
        protocolNetwork
        isLegacy
      }
    }`,
    variables: { actionIDs: selected.value.map(String) }
  }).catch((errors) => {
    console.log("Delete Action Errors:")
    for(let i in errors){
      console.log(errors[i]);
    }
    actionErrors.value = actionErrors.value.concat(errors);
    text.value = 'Indexer Agent error. Check errors for details.'
    snackbar.value = true;
  }).then((data) => {
    console.log(data);
    for(let i = 0; i < selected.value.length; i++){
      actions.value = actions.value.filter((e) =>  e.id != selected.value[i]);
    }
    text.value = `Deleted ${data.data.deleteActions} actions`
    snackbar.value = true;
    selected.value = [];

    if(data.data.deleteActions.length == 0)
      queryActions();

    return data;
  });
}

async function cancelActions(){
  return accountStore.getAgentConnectClient.mutate({
    mutation: gql`mutation cancelActions($actionIDs: [String!]!){
      cancelActions(actionIDs: $actionIDs) {
        id
        status
        type
        deploymentID
        allocationID
        amount
        poi
        publicPOI
        poiBlockNumber
        force
        priority
        source
        reason
        transaction
        failureReason
        createdAt
        updatedAt
        protocolNetwork
        isLegacy
      }
    }`,
    variables: { actionIDs: selected.value.map(String) }
  }).catch((errors) => {
    console.log("Cancel Action Errors:")
    for(let i in errors){
      console.log(errors[i]);
    }
    actionErrors.value = actionErrors.value.concat(errors);
    text.value = 'Indexer Agent error. Check errors for details.'
    snackbar.value = true;
  }).then((data) => {
    console.log(data);
    selected.value = [];
    for(let i = 0; i < data.data.cancelActions.length; i++)
      actions.value = actions.value.map((e) => e.id == data.data.cancelActions[i].id ? data.data.cancelActions[i] : e);
    
    text.value = `Cancelled ${data.data.cancelActions.length} actions`
    snackbar.value = true;

    if(data.data.cancelActions.length == 0)
      queryActions();

    return data.data.cancelActions;
  });
}

async function queryActions(){
  loading.value = true;
  return accountStore.getAgentConnectClient.query({
    query: gql`query actions($filter: ActionFilter!){
      actions(filter: $filter) {
        id
        status
        type
        deploymentID
        allocationID
        amount
        poi
        publicPOI
        poiBlockNumber
        force
        priority
        source
        reason
        transaction
        failureReason
        createdAt
        updatedAt
        protocolNetwork
        isLegacy
      }
    }`,
    variables: { filter: {  } },
    fetchPolicy: 'network-only',
  }).then((data) => {
    console.log("AGENT CONNECT QUERY ACTIONS DATA");
    console.log(data);
    actions.value = data.data.actions;
    loading.value = false;
    return data.data.actions;
  });
}

async function executeApprovedActions(){
  return accountStore.getAgentConnectClient.mutate({
    mutation: gql`mutation executeApprovedActions{
      executeApprovedActions {
        id
        type
        deploymentID
        allocationID
        amount
        poi
        publicPOI
        poiBlockNumber
        force
        source
        reason
        transaction
        failureReason
        priority
        protocolNetwork
        status
        isLegacy
      }
    }`,
  }).catch((errors) => {
    console.log("Execute Action Errors:")
    for(let i in errors){
      console.log(errors[i]);
    }
    actionErrors.value = actionErrors.value.concat(errors);
    text.value = 'Indexer Agent error. Check errors for details.'
    snackbar.value = true;
  }).then((data) => {
    console.log(data);
    selected.value = [];
    for(let i = 0; i < data.data.executeApprovedActions.length; i++){
      actions.value = actions.value.map((e) => e.id == data.data.executeApprovedActions[i].id ? data.data.executeApprovedActions[i] : e);
      if(data.data.executeApprovedActions[i].status == "failed"){
        actionFailures.value += 1;
      } else if(data.data.executeApprovedActions[i].status == "success"){
        actionSuccesses.value += 1;
      }
    }
    text.value = `Executed ${data.data.executeApprovedActions.length} actions`
    snackbar.value = true;

    if(data.data.executeApprovedActions.length == 0)
      queryActions();

    return data.data.executeApprovedActions;
  });
}

const headers = ref([
        { title: 'ID', key: 'id'},
        { title: 'Status', key: 'status' },
        { title: 'Priority', key: 'priority'},
        { title: 'Type', key: 'type' },
        { title: 'Amount', key: 'amount'},
        { title: 'POI', key: 'poi' },
        { title: 'Force', key: 'force' },
        { title: 'Transaction', key: 'transaction' },
        { title: 'Failure Reason', key: 'failureReason' }, 
        { title: 'Source', key: 'source'},
        { title: 'Deployment ID', key: 'deploymentID', sortable: false },
        { title: 'Allocation ID', key: 'allocationID', sortable: false },
        { title: 'POI Block Number', key: 'poiBlockNumber' },
        { title: 'Public POI', key: 'publicPOI' },
      ]);

</script>