<template>
  <v-data-table
      :headers="headers"
      :items="actions"
      class="elevation-1"
      mobile-breakpoint="0"
      show-select
      v-model="selected"
  >
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
  <v-dialog width="500">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" text="Approve Actions"> </v-btn>
    </template>

    <template v-slot:default="{ isActive }">
      <v-card title="Approve Actions">
        <v-card-text>
          Are you sure you want to approve action IDs {{ selected.toString() }}?
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            text="Cancel"
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
</template>

<script setup>
import moment from 'moment';
import Web3 from 'web3';
import numeral from 'numeral';
import { ref, watch } from 'vue';
import { useSubgraphsStore } from '@/store/subgraphs';
import { useNewAllocationSetterStore } from '@/store/newAllocationSetter';
import { storeToRefs } from 'pinia';
import { useChainStore } from '@/store/chains';
import { agentApolloClient } from '@/plugins/graphAgentClient';
import gql from 'graphql-tag';
const subgraphStore = useSubgraphsStore();
const newAllocationSetterStore = useNewAllocationSetterStore();
newAllocationSetterStore.update();

const { newAllocations, getSelectedS } = storeToRefs(newAllocationSetterStore);
const chainStore = useChainStore();

const actions = ref([]);
const selected = ref([]);
queryActions();

function approveActions(){
  return agentApolloClient.mutate({
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
    variables: { actionIDs: selected.value.map(String) }
  }).then((data) => {
    selected.value = [];
    console.log("AGENT CONNECT DATA");
    console.log(data);
    for(let i = 0; i < data.data.approveActions.length; i++){
      let action = actions.value.find((e) => e.id == data.data.approveActions[i].id);
      action = data.data.approveActions[i];
    }
    return data.data.approveActions;
  });
}

async function queryActions(){
  return agentApolloClient.query({
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
    variables: { filter: { status: 'queued' } },
  }).then((data) => {
    console.log("AGENT CONNECT QUERY ACTIONS DATA");
    console.log(data);
    actions.value = data.data.actions;
    return data.data.actions;
  });
}


watch(getSelectedS, (getSelectedS) => {
  newAllocationSetterStore.update();
})

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
        { title: 'Source', key: 'source'},
        { title: 'transaction', key: 'transaction' },
        { title: 'Failure Reason', key: 'failureReason' }, 

        
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