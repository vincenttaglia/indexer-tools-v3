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
  <v-btn text="Queue actions" @click="sendActionsToAgent()" class="mx-5 my-6"></v-btn>
  <v-btn text="Refresh actions" @click="queryActions()" class="mx-5 my-6" v-if="accountStore.getAgentConnectStatus"></v-btn>
  <v-select
      v-model="managerSettingStore.settings.statusFilter"
      :items="[{title: 'Queued', value: 'queued'}, {title:'Approved', value: 'approved'}, {title: 'Pending', value: 'pending'}, {title: 'Success', value: 'success'}, {title: 'Failed', value: 'failed'}, {title: 'Canceled', value: 'canceled'}]"
      label="Status Filter"
      class="d-inline-block mx-5 my-6"
      multiple
      clearable
      chips
      style="min-width: 150px;"
  ></v-select>
  <v-data-table
      :headers="headers"
      :items="filteredActions"
      class="elevation-1"
      mobile-breakpoint="0"
      show-select
      v-model="selected"
      :loading="loading"
      v-model:sort-by="sortBy"
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
    <template v-slot:item.image="{ item }">
      <v-badge
          :model-value="item.currentVersion.subgraphDeployment && item.currentVersion.subgraphDeployment.deniedAt != '0'"
          bordered
          color="error"
          icon="mdi-currency-usd-off"
          overlap
          avatar
      >
        <v-avatar size="30">
          <v-img :src="item.image" />
        </v-avatar>
      </v-badge>
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.createdAt="{ item }">
      <span :timestamp="item.currentVersion.subgraphDeployment.createdAt">{{ moment(item.currentVersion.subgraphDeployment.createdAt + "000", "x").format("MMM D, YYYY HH:mm") }}</span>
    </template>
    <template v-slot:item.currentSignalledTokens="{ item }">
      {{ numeral(Web3.utils.fromWei(item.currentSignalledTokens)).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.indexingRewardAmount="{ item }">
      {{ numeral(Web3.utils.fromWei(item.currentVersion.subgraphDeployment.indexingRewardAmount)).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.queryFeesAmount="{ item }">
      {{ numeral(Web3.utils.fromWei(item.currentVersion.subgraphDeployment.queryFeesAmount)).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.stakedTokens="{ item }">
      {{ numeral(Web3.utils.fromWei(item.currentVersion.subgraphDeployment.stakedTokens)).format('0,0') }} GRT
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
  <v-dialog width="500" v-if="accountStore.getAgentConnectStatus">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" text="Approve Actions" class="mx-5"> </v-btn>
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
      <v-btn v-bind="props" text="Cancel Actions" class="mx-5"> </v-btn>
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
      <v-btn v-bind="props" text="Delete Actions" class="mx-5"> </v-btn>
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
  <v-dialog width="500" v-if="accountStore.getAgentConnectStatus">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" text="Execute Approved Actions" class="mx-5"> </v-btn>
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

function sendActionsToAgent(){
  accountStore.getAgentConnectClient.mutate({
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
          force
          priority
          source
          reason
          transaction
          failureReason
          createdAt
          updatedAt
          protocolNetwork
        }
      }
    }`,
    variables: { actions: newAllocationSetterStore.actionsQueueBuildAPIObject }
  }).then((data) => {
    console.log("AGENT CONNECT SEND ACTIONS DATA");
    console.log(data);
    if(!data.data.errors){
      text.value = `Queued ${data.data.queueActions.length} actions`;
      snackbar.value = true;
      queryActions();
    }else{
      text.value = 'Indexer Agent error. Check console for details.'
      snackbar.value = true;
    }
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
        force
        priority
        source
        reason
        transaction
        failureReason
        createdAt
        updatedAt
        protocolNetwork
      }
    }`,
    variables: { actionIDs: selected.value.map(String) },
  }).then((data) => {
    console.log(data);
    if(!data.data.errors){
      selected.value = [];
      for(let i = 0; i < data.data.approveActions.length; i++){
        let actionI = actions.value.findIndex((e) => e.id == data.data.approveActions[i].id);
        actions.value[actionI] = data.data.approveActions[i];
      }
      text.value = `Approved ${data.data.approveActions.length} actions`
      snackbar.value = true;
    }else{
      text.value = 'Indexer Agent error. Check console for details.'
      snackbar.value = true;
    }
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
        force
        priority
        source
        reason
        transaction
        failureReason
        createdAt
        updatedAt
        protocolNetwork
      }
    }`,
    variables: { actionIDs: selected.value.map(String) }
  }).then((data) => {
    console.log(data);
    if(!data.data.errors){
      for(let i = 0; i < selected.value.length; i++){
        actions.value = actions.value.filter((e) =>  e.id != selected.value[i]);
      }
      text.value = `Deleted ${data.data.deleteActions} actions`
      snackbar.value = true;
      selected.value = [];
    }else{
      text.value = 'Indexer Agent error. Check console for details.'
      snackbar.value = true;
    }
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
        force
        priority
        source
        reason
        transaction
        failureReason
        createdAt
        updatedAt
        protocolNetwork
      }
    }`,
    variables: { actionIDs: selected.value.map(String) }
  }).then((data) => {
    console.log(data);
    if(!data.data.errors){
      selected.value = [];
      for(let i = 0; i < data.data.cancelActions.length; i++){
        let actionI = actions.value.findIndex((e) => e.id == data.data.cancelActions[i].id);
        actions.value[actionI] = data.data.cancelActions[i];
      }
      text.value = `Cancelled ${data.data.cancelActions.length} actions`
      snackbar.value = true;
    }else{
      text.value = 'Indexer Agent error. Check console for details.'
      snackbar.value = true;
    }
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
        force
        priority
        source
        reason
        transaction
        failureReason
        createdAt
        updatedAt
        protocolNetwork
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
        force
        source
        reason
        transaction
        failureReason
        priority
        protocolNetwork
      }
    }`,
  }).then((data) => {
    console.log(data);
    if(!data.data.errors){
      selected.value = [];
      for(let i = 0; i < data.data.executeApprovedActions.length; i++){
        let actionI = actions.value.findIndex((e) => e.id == data.data.executeApprovedActions[i].id);
        actions.value[actionI] = data.data.executeApprovedActions[i];
        if(!data.data.executeApprovedActions[i].failureReason){
          actions.value[actionI].status = 'success';
        }else{
          actions.value[actionI].status = 'failed';
        }
        
      }
      text.value = `Executed ${data.data.executeApprovedActions.length} actions`
      snackbar.value = true;
    }else{
      text.value = 'Indexer Agent error. Check console for details.'
      snackbar.value = true;
    }
    return data.data.executeApprovedActions;
  });
}

const headers = ref([
        { title: 'ID', key: 'id'},
        // {
        //   title: 'Img',
        //   sortable: false,
        //   key: 'image',
        // },
        //{ title: 'Name', key: 'displayName' },
        { title: 'Status', key: 'status' },
        { title: 'Type', key: 'type' },
        { title: 'Amount', key: 'amount'},
        { title: 'POI', key: 'poi' },
        { force: 'Force', key: 'force' },
        { title: 'Transaction', key: 'transaction' },
        { title: 'Failure Reason', key: 'failureReason' }, 
        { title: 'Source', key: 'source'},

        
        // { title: 'Current APR', key: 'apr'},
        // { title: 'New APR', key: 'newApr'},
        // { title: 'Est Daily Rewards (Before Cut)', key: 'dailyRewards'},
        // { title: 'Est Daily Rewards (After Cut)', key: 'dailyRewardsCut'},
        // { title: 'Current Proportion', key: 'proportion'},
        // { title: 'New Proportion', key: 'newProportion'},


        { title: 'Deployment ID', key: 'deploymentID', sortable: false },
        { title: 'Allocation ID', key: 'allocationID', sortable: false },
      ]);

function customSort(items, index, isDesc) {
  items.sort((a, b) => {
    if (index[0] == 'currentVersion.subgraphDeployment.createdAt'
        || index[0] == 'currentSignalledTokens'
        || index[0] == 'currentVersion.subgraphDeployment.stakedTokens'
        || index[0] == 'currentVersion.subgraphDeployment.indexingRewardAmount'
        || index[0] == 'currentVersion.subgraphDeployment.queryFeesAmount'
        || index[0] == 'proportion'
        || index[0] == 'apr'
        || index[0] == 'newApr'
        || index[0] == 'dailyRewards'
        || index[0] == 'dailyRewardsCut'
        || index[0] == 'maxAllo'
    ) {
      if (!isDesc[0]) {
        return t(a, index[0]).safeObject - t(b, index[0]).safeObject;
      } else {
        return t(b, index[0]).safeObject - t(a, index[0]).safeObject;
      }
    } else {
      if(typeof t(a, index[0]) !== 'undefined'){
        let objA = t(a, index[0]).safeObject;
        let objB = t(b, index[0]).safeObject;
        if(objA == null || objB == null)
          return objA != null && !isDesc[0];

        if (!isDesc[0]) {
          return objA.toString().toLowerCase().localeCompare(objB.toString().toLowerCase());
        } else {
          return objB.toString().toLowerCase().localeCompare(objA.toString().toLowerCase());
        }
      }
    }

  });
  return items;
}
</script>