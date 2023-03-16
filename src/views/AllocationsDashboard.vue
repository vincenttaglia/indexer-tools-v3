<template>
  <v-data-table
      :headers="headers"
      :items="allocationStore.getAllocations"
      item-key="subgraphDeployment.ipfsHash"
      class="elevation-1"
      :search="search"
      :custom-sort="customSort"
      :footer-props="{
        'items-per-page-options': [5, 10, 15, 20, 25, 30, 40, 50, 100]
      }"
      loading-text="Loading... Please wait"
      mobile-breakpoint="0"
  >
    <template v-slot:item.subgraphDeployment.versions[0].subgraph.image="{ item }">
      <v-badge
          v-if="item.raw.subgraphDeployment.deniedAt"
          bordered
          color="error"
          icon="mdi-currency-usd-off"
          overlap
          avatar
      >
        <v-avatar size="30">
          <v-img :src="item.raw.subgraphDeployment.versions[0].subgraph.image" />
        </v-avatar>
      </v-badge>
      <v-avatar size="30" v-if="!item.raw.subgraphDeployment.deniedAt">
        <v-img :src="item.raw.subgraphDeployment.versions[0].subgraph.image" />
      </v-avatar>
    </template>
    <template v-slot:item.allocatedTokens="{ item }">
      {{ numeral(Web3.utils.fromWei(item.raw.allocatedTokens.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.createdAt="{ item }">
      <span :timestamp="item.raw.createdAt">
        <v-tooltip theme="dark" location="top">
          <template v-slot:activator="{ props }">
            <span
              v-bind="props"
            >
            Epoch {{ item.raw.createdAtEpoch }}
            </span>
          </template>
          <span>{{ moment(item.raw.createdAt + "000", "x").format("MMM D, YYYY HH:mm") }}</span>
        </v-tooltip>
      </span>
    </template>
    <template v-slot:item.activeDuration="{ item }">
      <span :timestamp="item.raw.activeDuration">
        <v-tooltip theme="dark" location="top">
          <template v-slot:activator="{ props }">
            <span
              v-bind="props"
            >
            {{ item.raw.epochDuration }} epochs
            </span>
          </template>
          <span>{{ item.raw.readableDuration }}</span>
        </v-tooltip>
      </span>
    </template>
    <template v-slot:item.subgraphDeployment.signalledTokens="{ item }">
      {{ numeral(Web3.utils.fromWei(item.raw.subgraphDeployment.signalledTokens.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.subgraphDeployment.indexingRewardAmount="{ item }">
      {{ numeral(Web3.utils.fromWei(item.raw.subgraphDeployment.indexingRewardAmount.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.subgraphDeployment.queryFeesAmount="{ item }">
      {{ numeral(Web3.utils.fromWei(item.raw.subgraphDeployment.queryFeesAmount.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.subgraphDeployment.stakedTokens="{ item }">
      {{ numeral(Web3.utils.fromWei(item.raw.subgraphDeployment.stakedTokens.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.proportion="{ item }">
      {{ numeral(item.raw.proportion*100).format('0,0.000') }}%
    </template>
    <template v-slot:item.apr="{ item }">
      {{ numeral(item.raw.apr).format('0,0.00') }}%
    </template>
    <template v-slot:item.dailyRewards="{ item }">
      {{ numeral(Web3.utils.fromWei(Web3.utils.toBN(item.raw.dailyRewards))).format('0,0') }} GRT
    </template>
    <template v-slot:item.dailyRewardsCut="{ item }">
      {{ numeral(Web3.utils.fromWei(Web3.utils.toBN(item.raw.dailyRewardsCut))).format('0,0') }} GRT
    </template>
    <template v-slot:item.pendingRewards="{ item }">
      <span
        v-if="!item.raw.pendingRewards.loading && !item.raw.pendingRewards.loaded"
        >
        <v-icon left @click="allocationStore.fetchPendingRewards(item.raw.id);">
          mdi-download
        </v-icon>
      </span>
      <v-progress-circular
          indeterminate
          color="purple"
          v-if="item.raw.pendingRewards.loading && !item.raw.pendingRewards.loaded"
      ></v-progress-circular>
      <span
        v-if="!item.raw.pendingRewards.loading && item.raw.pendingRewards.loaded"
        >
        {{ numeral(Web3.utils.fromWei(Web3.utils.toBN(item.raw.pendingRewards.value))).format('0,0') }} GRT
      </span>
      <span
        v-if="item.raw.pendingRewards.error"
        >
        error
      </span>

    </template>
    <template v-slot:item.pendingRewardsCut="{ item }">
      <span
        v-if="!item.raw.pendingRewards.loading && !item.raw.pendingRewards.loaded"
        >
        <v-icon left @click="allocationStore.fetchAllPendingRewards();">
          mdi-download-multiple
        </v-icon>
      </span>
      <v-progress-circular
          indeterminate
          color="purple"
          v-if="item.raw.pendingRewards.loading && !item.raw.pendingRewards.loaded"
      ></v-progress-circular>
      <span
          v-if="!item.raw.pendingRewards.loading && item.raw.pendingRewards.loaded"
      >
        {{ numeral(Web3.utils.fromWei(Web3.utils.toBN(item.raw.pendingRewardsCut))).format('0,0') }} GRT
      </span>
      <span
        v-if="item.raw.pendingRewards.error"
        >
        error
      </span>
    </template>
    <template v-slot:body.append>
      <tr v-if="false">
        <td style="font-size: 11px"><strong>Totals</strong></td>
        <td v-if="selectable"></td>
        <td><strong>{{ allocations.length }} allocations</strong></td>
        <td></td>
        <td></td>
        <td></td>
        <td><strong>{{ numeral(avgAPR).format('0,0.00') }}%</strong></td>
        <td><strong>{{ numeral(Web3.utils.fromWei(Web3.utils.toBN(dailyrewards_sum))).format('0,0') }} GRT</strong></td>
        <td><strong>{{ numeral(Web3.utils.fromWei(Web3.utils.toBN(dailyrewards_cut_sum))).format('0,0') }} GRT</strong></td>
        <td><strong>{{ numeral(Web3.utils.fromWei(Web3.utils.toBN(pending_rewards_sum))).format('0,0') }} GRT</strong></td>
        <td><strong>{{ numeral(Web3.utils.fromWei(Web3.utils.toBN(pending_rewards_cut_sum))).format('0,0') }} GRT</strong></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    </template>
  </v-data-table>
</template>

<script setup>
import { ref, watch } from "vue";
import moment from "moment";
import numeral from "numeral";
import Web3 from "web3";
import { useAllocationStore } from "@/store/allocations";
import { useAccountStore } from "@/store/accounts";
import { storeToRefs } from "pinia";

const allocationStore = useAllocationStore();
const accountStore = useAccountStore();
const { getActiveAccount } = storeToRefs(accountStore);

const headers = ref([
    {
      title: 'Img',
      align: 'start',
      sortable: false,
      key: 'subgraphDeployment.versions[0].subgraph.image',
    },
    { title: 'Name', key: 'subgraphDeployment.versions[0].subgraph.displayName' },
    { title: 'Allocated', key: 'allocatedTokens'},
    { title: 'Created', key: 'createdAt' },
    { title: 'Allocation Duration', key: 'activeDuration'},
    { title: 'Current APR', key: 'apr'},
    { title: 'Est Daily Rewards', key: 'dailyRewards'},
    { title: 'Est Daily Rewards (After Cut)', key: 'dailyRewardsCut'},
    { title: 'Pending Rewards', key: 'pendingRewards'},
    { title: 'Pending Rewards (After Cut)', key: 'pendingRewardsCut'},
    { title: 'Current Signal', key: 'subgraphDeployment.signalledTokens'},
    { title: 'Current Proportion', key: 'proportion'},
    { title: 'Current Allocations', key: 'subgraphDeployment.stakedTokens'},
    { title: 'Total Query Fees', key: 'subgraphDeployment.queryFeesAmount'},
    { title: 'Total Indexing Rewards', key: 'subgraphDeployment.indexingRewardAmount'},
    { title: 'Deployment ID', key: 'subgraphDeployment.ipfsHash', sortable: false },
  ]);

  allocationStore.fetchData();

  watch(getActiveAccount,  async (newAccount, oldAccount) => {
    console.log(newAccount);
    console.log(oldAccount);
    if(newAccount.address != oldAccount.address)
      allocationStore.fetchData();
  });
</script>