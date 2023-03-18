<template>
  <v-data-table
    :headers="headers"
    :items="subgraphStore.getFilteredSubgraphs"
    item-key="currentVersion.subgraphDeployment.ipfsHash"
    class="elevation-1"
    :search="subgraphSettingStore.search"
    :custom-sort="customSort"
    :footer-props="{
      'items-per-page-options': [10, 15, 20, 25, 30, 40, 50]
    }"
    loading-text="Loading... Please wait"
    mobile-breakpoint="0"
    :show-select="selectable"
    v-model="selected"
  >
    <template v-slot:top>
      <v-text-field
          v-model="subgraphSettingStore.search"
          label="Search"
          class="d-inline-block mx-4"
          style="width:13rem;max-width:15rem"
      ></v-text-field>
      <v-text-field
          v-model="subgraphSettingStore.minSignal"
          type="number"
          label="Min Signal"
          class="d-inline-block mx-4"
          style="max-width:15rem"
      ></v-text-field>
      <v-text-field
          v-model="subgraphSettingStore.maxSignal"
          type="number"
          label="Max Signal"
          class="d-inline-block mx-4"
          style="max-width:15rem"
      ></v-text-field>
      <v-text-field
          v-model="subgraphSettingStore.newAllocation"
          type="number"
          label="New Allocation"
          class="d-inline-block mx-4"
          style="max-width:15rem"
      ></v-text-field>
      <v-text-field
          v-model="subgraphSettingStore.targetApr"
          type="number"
          label="Target APR"
          class="d-inline-block mx-4"
          style="max-width:15rem"
      ></v-text-field>
      <v-select
          v-model="subgraphSettingStore.noRewardsFilter"
          :items="[{text: 'Exclude Denied', action: 0}, {text:'Include Denied', action: 1}, {text: 'Only Denied', action: 2}]"
          item-title="text"
          item-value="action"
          label="Subgraphs w/ Denied Rewards"
          style="max-width: 15rem;"
          class="d-inline-block mx-4"
      ></v-select>
      <v-select
          v-model="subgraphSettingStore.networkFilter"
          :items="subgraphSettingStore.networks"
          label="Subgraph Networks"
          multiple
          chips
          class="d-inline-block mx-4"
          style="min-width:13rem;max-width: 15rem;top: -5px"
      ></v-select>
      <v-checkbox
        v-model="subgraphSettingStore.activateBlacklist"
        label="Blacklist"
        class="d-inline-block mr-3"
      ></v-checkbox>
      <v-checkbox
        v-model="subgraphSettingStore.activateSynclist"
        label="Synclist"
        class="d-inline-block"
      ></v-checkbox>
    </template>
    <template v-slot:item.image="{ item }">
      <v-badge
            :model-value="item.raw.currentVersion.subgraphDeployment.deniedAt != '0'"
            bordered
            color="error"
            icon="mdi-currency-usd-off"
            overlap
            avatar
            v-if="(item.raw.currentVersion.subgraphDeployment.deniedAt && item.raw.currentlyAllocated) || (!item.raw.currentVersion.subgraphDeployment.deniedAt && !item.raw.currentlyAllocated) || (item.raw.currentVersion.subgraphDeployment.deniedAt && !item.raw.currentlyAllocated)"
        >
        <v-avatar size="30">
          <v-img :src="item.raw.image" />
        </v-avatar>
      </v-badge>
      <v-badge
          :model-value="item.raw.currentlyAllocated"
          bordered
          color="warning"
          icon="mdi-exclamation-thick"
          overlap
          avatar
          v-if="!item.raw.currentVersion.subgraphDeployment.deniedAt && item.raw.currentlyAllocated"
      >
        <v-avatar size="30">
          <v-img :src="item.raw.image" />
        </v-avatar>
      </v-badge>
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.createdAt="{ item }">
      <span :timestamp="item.raw.currentVersion.subgraphDeployment.createdAt">{{ moment(item.raw.currentVersion.subgraphDeployment.createdAt + "000", "x").format("MMM D, YYYY HH:mm") }}</span>
    </template>
    <template v-slot:item.proportion="{ item }">
      {{ numeral(item.raw.proportion*100).format('0,0.000') }}%
    </template>
    <template v-slot:item.apr="{ item }">
      {{ numeral(item.raw.apr).format('0,0.00') }}%
    </template>
    <template v-slot:item.newApr="{ item }">
        {{ numeral(item.raw.newApr).format('0,0.00') }}%
      </template>
    <template v-slot:item.maxAllo="{ item }">
      {{ numeral(item.raw.maxAllo).format('0,0') }} GRT
    </template>
    <template v-slot:item.dailyRewards="{ item }">
      {{ numeral(web3.utils.fromWei(web3.utils.toBN(item.raw.dailyRewards))).format('0,0') }} GRT
    </template>
    <template v-slot:item.dailyRewardsCut="{ item }">
      {{ numeral(web3.utils.fromWei(web3.utils.toBN(item.raw.dailyRewardsCut))).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentSignalledTokens="{ item }">
      {{ numeral(web3.utils.fromWei(item.raw.currentSignalledTokens.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.indexingRewardAmount="{ item }">
      {{ numeral(web3.utils.fromWei(item.raw.currentVersion.subgraphDeployment.indexingRewardAmount.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.queryFeesAmount="{ item }">
      {{ numeral(web3.utils.fromWei(item.raw.currentVersion.subgraphDeployment.queryFeesAmount.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.stakedTokens="{ item }">
      {{ numeral(web3.utils.fromWei(item.raw.currentVersion.subgraphDeployment.stakedTokens.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.network.id="{ item }">
      {{ item.raw.currentVersion.subgraphDeployment.network ? item.raw.currentVersion.subgraphDeployment.network.id : "null" }}
    </template> 
  </v-data-table>
</template>

<script setup>
  import { ref } from 'vue';
  import { useSubgraphsStore } from '@/store/subgraphs';
  import { useSubgraphSettingStore } from '@/store/subgraphSettings';
  import numeral from 'numeral';
  import web3 from 'web3';
  import moment from 'moment';
  import BigNumber from 'bignumber.js';
  import { storeToRefs } from 'pinia';

  const subgraphStore = useSubgraphsStore();
  const subgraphSettingStore = useSubgraphSettingStore();
  subgraphStore.fetchData();

  const { selected } = storeToRefs(subgraphStore);

  defineProps({
    selectable: {
      type: Boolean,
      default: false,
    },
  })

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

  const headers = ref([
    { title: 'Img', key: 'image' },
    { title: 'Name', key: 'displayName' },
    { title: 'Network', key: 'currentVersion.subgraphDeployment.network.id'},
    { title: 'Created', key: 'currentVersion.subgraphDeployment.createdAt' },
    { title: 'Current APR', key: 'apr'},
    { title: 'New APR', key: 'newApr'},
    { title: 'Max Allocation', key: 'maxAllo'},
    { title: 'Est Daily Rewards (Before Cut)', key: 'dailyRewards'},
    { title: 'Est Daily Rewards (After Cut)', key: 'dailyRewardsCut'},
    { title: 'Current Signal', key: 'currentSignalledTokens'},
    { title: 'Current Proportion', key: 'proportion'},
    { title: 'Current Allocations', key: 'currentVersion.subgraphDeployment.stakedTokens'},
    { title: 'Total Query Fees', key: 'currentVersion.subgraphDeployment.queryFeesAmount'},
    { title: 'Total Indexing Rewards', key: 'currentVersion.subgraphDeployment.indexingRewardAmount'},
    { title: 'Deployment ID', key: 'currentVersion.subgraphDeployment.ipfsHash', sortable: false },
  ]);


</script>
