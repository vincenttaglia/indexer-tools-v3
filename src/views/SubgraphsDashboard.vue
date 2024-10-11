<template>
  <v-data-table
    :headers="headers"
    :items="subgraphStore.getFilteredSubgraphs"
    item-key="currentVersion.subgraphDeployment.ipfsHash"
    class="elevation-1"
    :custom-sort="customSort"
    loading-text="Loading... Please wait"
    mobile-breakpoint="0"
    :show-select="selectable"
    v-model="selected"
    v-model:sort-by="tableSettingsStore.subgraphSettings.sortBy"
    v-model:loading="subgraphStore.loading"
    v-model:items-per-page="tableSettingsStore.subgraphSettings.itemsPerPage"
    :search="search"
    hover
  >
    <template v-slot:no-data>
      <p class="mt-4">
        No data available
      </p>
      <br>
      <v-btn
        rounded
        variant="text"
        @click="resetFilters()"
        class="mb-4 mt-2"
      >
        Reset Filters
      </v-btn>
    </template>
    <template v-slot:top>
      <div class="d-block">
        <v-text-field
            v-model="search"
            label="Search"
            class="d-inline-block mx-4 mt-2"
            style="width:13rem;max-width:15rem"
        ></v-text-field>
        <v-text-field
            v-model="subgraphSettingStore.settings.minSignal"
            type="number"
            label="Min Signal"
            class="d-inline-block mx-4"
            style="max-width:15rem"
        ></v-text-field>
        <v-text-field
            v-model="subgraphSettingStore.settings.maxSignal"
            type="number"
            label="Max Signal"
            class="d-inline-block mx-4"
            style="max-width:15rem"
        ></v-text-field>
        <v-confirm-edit v-model="subgraphSettingStore.settings.newAllocation">
          <template v-slot:default="{ model: proxyModel, save, cancel, isPristine, actions}">
            <v-text-field
              v-model="proxyModel.value"
              type="number"
              label="New Allocation"
              class="d-inline-block mx-4"
              style="max-width:15rem"
              :append-inner-icon="isPristine ? '' : 'mdi-check'"
              :clear-icon="isPristine ? '' : 'mdi-close-circle'"
              @click:append-inner="save"
              @click:clear="cancel"
              @keydown.enter="save"
              clearable
              hide-spin-buttons
            ></v-text-field>
            <component :is="actions" v-if="false"></component>
          </template>
        </v-confirm-edit>
        <v-confirm-edit v-model="subgraphSettingStore.settings.targetApr">
          <template v-slot:default="{ model: proxyModel, save, cancel, isPristine, actions}">
            <v-text-field
              v-model="proxyModel.value"
              type="number"
              label="Target APR"
              class="d-inline-block mx-4"
              style="max-width:15rem"
              :append-inner-icon="isPristine ? '' : 'mdi-check'"
              :clear-icon="isPristine ? '' : 'mdi-close-circle'"
              @click:append-inner="save"
              @click:clear="cancel"
              @keydown.enter="save"
              clearable
              hide-spin-buttons
            ></v-text-field>
            <component :is="actions" v-if="false"></component>
          </template>
        </v-confirm-edit>
        <v-select
            v-model="subgraphSettingStore.settings.noRewardsFilter"
            :items="[{text: 'Exclude Denied', action: 0}, {text:'Include Denied', action: 1}, {text: 'Only Denied', action: 2}]"
            item-title="text"
            item-value="action"
            label="Subgraphs w/ Denied Rewards"
            style="max-width: 15rem;"
            class="d-inline-block mx-4"
        ></v-select>
        <v-combobox
            v-model="subgraphSettingStore.settings.networkFilter"
            :items="subgraphStore.getSubgraphNetworks"
            label="Subgraph Networks"
            multiple
            chips
            class="d-inline-block mx-4"
            style="min-width:13rem;max-width: 15rem;top: -5px"
        ></v-combobox>
        <v-select
            v-model="subgraphSettingStore.settings.statusFilter"
            :items="[{title:'No Filter', value:'none'},{title:'All Reported Status', value:'all'},{title:'Closable', value:'closable'},{title: 'Healthy/Synced', value:'healthy-synced'},{title:'Syncing', value:'syncing'},{title:'Failed', value:'failed'},{title:'Non-Deterministic', value:'non-deterministic'},{title:'Deterministic', value:'deterministic'}]"
            label="Status Filter"
            class="d-inline-block mx-4"
            style="min-width:13rem;max-width: 15rem;top: -5px"
        ></v-select>
        <v-checkbox
          v-model="subgraphSettingStore.settings.activateBlacklist"
          label="Blacklist"
          class="d-inline-block mr-3"
        ></v-checkbox>
        <v-checkbox
          v-model="subgraphSettingStore.settings.activateSynclist"
          label="Synclist"
          class="d-inline-block"
        ></v-checkbox>
        <v-checkbox
          v-model="subgraphSettingStore.settings.hideCurrentlyAllocated"
          label="Hide Currently Allocated"
          class="d-inline-block"
        ></v-checkbox>
      </div>
    </template>
    <template v-slot:item.deploymentStatus.blocksBehindChainhead="{ item }">
      <StatusDropdownVue :item='item' />
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.createdAt="{ item }">
      <span :timestamp="item.currentVersion.subgraphDeployment.createdAt">{{ moment(item.currentVersion.subgraphDeployment.createdAt + "000", "x").format("MMM D, YYYY HH:mm") }}</span>
    </template>
    <template v-slot:item.proportion="{ item }">
      {{ numeral(item.proportion).format('0,0.0000') }}
    </template>
    <template v-slot:item.apr="{ item }">
      {{ numeral(item.apr).format('0,0.00') }}%
    </template>
    <template v-slot:item.newApr="{ item }">
        {{ numeral(item.newApr).format('0,0.00') }}%
      </template>
    <template v-slot:item.maxAllo="{ item }">
      <span v-if="item.maxAllo != Number.MIN_SAFE_INTEGER">{{ numeral(item.maxAllo).format('0,0') }} GRT</span>
      <span v-if="item.maxAllo == Number.MIN_SAFE_INTEGER">-</span>
    </template>
    <template v-slot:item.dailyRewards="{ item }">
      {{ numeral(web3.utils.fromWei(web3.utils.toBN(item.dailyRewards))).format('0,0') }} GRT
    </template>
    <template v-slot:item.dailyRewardsCut="{ item }">
      {{ numeral(web3.utils.fromWei(web3.utils.toBN(item.dailyRewardsCut))).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentSignalledTokens="{ item }">
      {{ numeral(web3.utils.fromWei(item.currentSignalledTokens.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.indexingRewardAmount="{ item }">
      {{ numeral(web3.utils.fromWei(item.currentVersion.subgraphDeployment.indexingRewardAmount.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.queryFeesAmount="{ item }">
      {{ numeral(web3.utils.fromWei(item.currentVersion.subgraphDeployment.queryFeesAmount.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.stakedTokens="{ item }">
      {{ numeral(web3.utils.fromWei(item.currentVersion.subgraphDeployment.stakedTokens.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.manifest.network="{ item }">
      {{ item.currentVersion.subgraphDeployment.manifest.network ? item.currentVersion.subgraphDeployment.manifest.network : "null" }}
    </template> 
    <template v-slot:item.upgradeIndexer="{ item }">
      <span
        v-if="!item.upgradeIndexer.loading && !item.upgradeIndexer.loaded"
        >
        <v-icon left @click="subgraphStore.fetchNumEntities(item.currentVersion.subgraphDeployment.ipfsHash);">
          mdi-account-arrow-down
        </v-icon>
      </span>
      <v-progress-circular
          indeterminate
          color="purple"
          v-if="item.upgradeIndexer.loading && !item.upgradeIndexer.loaded"
      ></v-progress-circular>
      <div 
       v-if="!item.upgradeIndexer.loading && item.upgradeIndexer.loaded"
       class="d-flex"
      >
        <span>
          {{ numeral(item.upgradeIndexer.value).format('0,0') }} Entities
        </span>
      </div>
      
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
  import { storeToRefs } from 'pinia';
  import { useTableSettingStore } from "@/store/tableSettings";
  import StatusDropdownVue from '@/components/StatusDropdown.vue';


  const search = ref('');
  const subgraphStore = useSubgraphsStore();
  const subgraphSettingStore = useSubgraphSettingStore();
  const tableSettingsStore = useTableSettingStore();
  subgraphStore.fetchData();

  const { selected } = storeToRefs(subgraphStore);

  defineProps({
    selectable: {
      type: Boolean,
      default: false,
    },
  })

function resetFilters () {
  search.value = "";
  subgraphSettingStore.settings.minSignal = "";
  subgraphSettingStore.settings.maxSignal = "";
  subgraphSettingStore.settings.noRewardsFilter = 1;
  subgraphSettingStore.settings.networkFilter = [];
  subgraphSettingStore.settings.statusFilter = "none";
  subgraphSettingStore.settings.activateBlacklist = false;
  subgraphSettingStore.settings.activateSynclist = false;
  subgraphSettingStore.settings.hideCurrentlyAllocated = false;
}

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
    { title: 'Status', key: 'deploymentStatus.blocksBehindChainhead', align: 'start' },
    { title: 'Name', key: 'metadata.displayName' },
    { title: 'Network', key: 'currentVersion.subgraphDeployment.manifest.network'},
    { title: 'Created', key: 'currentVersion.subgraphDeployment.createdAt' },
    { title: 'Current APR', key: 'apr'},
    { title: 'New APR', key: 'newApr'},
    { title: 'Max Allocation', key: 'maxAllo'},
    { title: 'Est Daily Rewards (Before Cut)', key: 'dailyRewards'},
    { title: 'Est Daily Rewards (After Cut)', key: 'dailyRewardsCut'},
    { title: 'Current Signal', key: 'currentSignalledTokens'},
    { title: 'Entities', key: 'upgradeIndexer'},
    { title: 'Current Proportion', key: 'proportion'},
    { title: 'Current Allocations', key: 'currentVersion.subgraphDeployment.stakedTokens'},
    { title: 'Total Query Fees', key: 'currentVersion.subgraphDeployment.queryFeesAmount'},
    { title: 'Total Indexing Rewards', key: 'currentVersion.subgraphDeployment.indexingRewardAmount'},
    { title: 'Deployment ID', key: 'currentVersion.subgraphDeployment.ipfsHash', sortable: false },
  ]);


</script>
