<template>
  <v-data-table
      :headers="headers"
      :items="allocationStore.getFilteredAllocations"
      item-selectable="subgraphDeployment.ipfsHash"
      class="elevation-1"
      :custom-sort="customSort"
      loading-text="Loading... Please wait"
      mobile-breakpoint="0"
      :show-select="selectable"
      v-model="selected"
      v-model:sort-by="tableSettingsStore.allocationSettings.sortBy"
      v-model:loading="allocationStore.loading"
      v-model:items-per-page="tableSettingsStore.allocationSettings.itemsPerPage"
      hover
      no-data-text="No data available<br>"
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
        <v-select
            v-model="subgraphSettingsStore.settings.statusFilter"
            :items="[{title:'No Filter', value:'none'},{title:'All Reported Status', value:'all'},{title:'Closable', value:'closable'},{title: 'Healthy/Synced', value:'healthy-synced'},{title:'Syncing', value:'syncing'},{title:'Failed', value:'failed'},{title:'Non-Deterministic', value:'non-deterministic'},{title:'Deterministic', value:'deterministic'}]"
            label="Status Filter"
            class="d-inline-block mx-4 mt-5"
            style="min-width:13rem;max-width: 15rem;"
        ></v-select>
        <v-select
          v-model="allocationStore.networkFilter"
          :items="allocationStore.getSubgraphNetworks"
          label="Subgraph Networks"
          multiple
          chips
          class="d-inline-block mx-4"
          style="min-width:13rem;max-width: 15rem;top: -5px"
        ></v-select>
        <v-checkbox
          v-model="allocationStore.activateBlacklist"
          label="Blacklist"
          class="d-inline-block mr-3"
        ></v-checkbox>
        <v-checkbox
          v-model="allocationStore.activateSynclist"
          label="Synclist"
          class="d-inline-block"
        ></v-checkbox>
      </div>
    </template>
    <template v-slot:item.deploymentStatus.blocksBehindChainhead="{ item }">
      <StatusDropdownVue :item='item' :subgraph='item.subgraphDeployment' :metadata='item.subgraphDeployment.versions[0].subgraph.metadata' />
    </template>
    <template v-slot:item.id="{ item }" style="width:100;max-width:100px;min-width:100px;overflow-x: scroll;">
      <p style="width:100;max-width:100px;min-width:100px;overflow-x: scroll;">{{ item.id }}</p>
    </template>
    <template v-slot:item.allocatedTokens="{ item }">
      {{ numeral(Web3.utils.fromWei(item.allocatedTokens.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.createdAt="{ item }">
      <span :timestamp="item.createdAt">
        <v-tooltip theme="dark" location="top">
          <template v-slot:activator="{ props }">
            <span
              v-bind="props"
            >
            Epoch {{ item.createdAtEpoch }}
            </span>
          </template>
          <span>{{ moment(item.createdAt + "000", "x").format("MMM D, YYYY HH:mm") }}</span>
        </v-tooltip>
      </span>
    </template>
    <template v-slot:item.activeDuration="{ item }">
      <span :timestamp="item.activeDuration">
        <v-tooltip theme="dark" location="top">
          <template v-slot:activator="{ props }">
            <span
              v-bind="props"
            >
            {{ item.epochDuration }} epochs
            </span>
          </template>
          <span>{{ item.readableDuration }}</span>
        </v-tooltip>
      </span>
    </template>
    <template v-slot:item.subgraphDeployment.signalledTokens="{ item }">
      {{ numeral(Web3.utils.fromWei(item.subgraphDeployment.signalledTokens.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.subgraphDeployment.indexingRewardAmount="{ item }">
      {{ numeral(Web3.utils.fromWei(item.subgraphDeployment.indexingRewardAmount.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.subgraphDeployment.queryFeesAmount="{ item }">
      {{ numeral(Web3.utils.fromWei(item.subgraphDeployment.queryFeesAmount.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.subgraphDeployment.stakedTokens="{ item }">
      {{ numeral(Web3.utils.fromWei(item.subgraphDeployment.stakedTokens.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.proportion="{ item }">
      {{ numeral(item.proportion).format('0,0.0000') }}
    </template>
    <template v-slot:item.apr="{ item }">
      {{ numeral(item.apr).format('0,0.00') }}%
    </template>
    <template v-slot:item.dailyRewards="{ item }">
      {{ numeral(Web3.utils.fromWei(Web3.utils.toBN(item.dailyRewards))).format('0,0') }} GRT
    </template>
    <template v-slot:item.dailyRewardsCut="{ item }">
      {{ numeral(Web3.utils.fromWei(Web3.utils.toBN(item.dailyRewardsCut))).format('0,0') }} GRT
    </template>
    <template v-slot:item.pendingRewards.value="{ item }">
      <span
        v-if="!item.pendingRewards.loading && !item.pendingRewards.loaded"
        >
        <v-icon left @click="allocationStore.fetchPendingRewards(item.id);">
          mdi-download
        </v-icon>
      </span>
      <v-progress-circular
          indeterminate
          color="purple"
          v-if="item.pendingRewards.loading && !item.pendingRewards.loaded"
      ></v-progress-circular>
      <div 
       v-if="!item.pendingRewards.loading && item.pendingRewards.loaded"
       class="d-flex"
      >
        <span>
        {{ numeral(Web3.utils.fromWei(Web3.utils.toBN(item.pendingRewards.value))).format('0,0') }} GRT
      </span>
      <v-tooltip
          location="top"
          v-if="item.subgraphDeployment.deniedAt"
        >
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" size="12" class="mb-2 mr-3">
              mdi-information
            </v-icon>
          </template>
          <span>Rewards Denied for Subgraph</span>
        </v-tooltip>
      </div>
      
    </template>
    <template v-slot:item.pendingRewardsCut="{ item }">
      <span
        v-if="!item.pendingRewards.loading && !item.pendingRewards.loaded"
        >
        <v-icon left @click="allocationStore.fetchAllPendingRewards();">
          mdi-download-multiple
        </v-icon>
      </span>
      <v-progress-circular
          indeterminate
          color="purple"
          v-if="item.pendingRewards.loading && !item.pendingRewards.loaded"
      ></v-progress-circular>
      <div 
       v-if="!item.pendingRewards.loading && item.pendingRewards.loaded"
       class="d-flex"
      >
        <span>
          {{ numeral(Web3.utils.fromWei(Web3.utils.toBN(item.pendingRewardsCut))).format('0,0') }} GRT
      </span>
      <v-tooltip
          location="top"
          v-if="item.subgraphDeployment.deniedAt"
        >
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" size="12" class="mb-2 mr-3">
              mdi-information
            </v-icon>
          </template>
          <span>Rewards Denied for Subgraph</span>
        </v-tooltip>
      </div>
    </template>
    <template v-slot:body.append>
      <tr>
        <td style="font-size: 11px"><strong>Totals</strong></td>
        <td v-if="selectable"></td>
        <td><strong>{{ allocationStore.getAllocations.length }} allocations</strong>&nbsp;&nbsp;</td>
        <td></td>
        <td></td>
        <td></td>
        <td><strong>{{ numeral(allocationStore.avgAPR).format('0,0.00%') }}</strong>&nbsp;&nbsp;</td>
        <td><strong>{{ numeral(Web3.utils.fromWei(Web3.utils.toBN(allocationStore.dailyRewardsSum))).format('0,0') }} GRT&nbsp;&nbsp;</strong></td>
        <td><strong>{{ numeral(Web3.utils.fromWei(Web3.utils.toBN(allocationStore.dailyRewardsCutSum))).format('0,0') }} GRT&nbsp;&nbsp;</strong></td>
        <td><strong>{{ numeral(Web3.utils.fromWei(Web3.utils.toBN(allocationStore.pendingRewardsSum))).format('0,0') }} GRT&nbsp;&nbsp;</strong></td>
        <td><strong>{{ numeral(Web3.utils.fromWei(Web3.utils.toBN(allocationStore.pendingRewardsCutSum))).format('0,0') }} GRT</strong></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    </template>
  </v-data-table>
  <div>
      <v-btn
        text
        class="my-5 mx-3"
      >
        <download-csv
          :data   = "allocationStore.getFilteredAllocations" 
          :csv-title="'allocations'">
          Download Data
        </download-csv>
      </v-btn>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import moment from "moment";
import numeral from "numeral";
import Web3 from "web3";
import { useAllocationStore } from "@/store/allocations";
import { useAccountStore } from "@/store/accounts";
import { storeToRefs } from "pinia";
import { useSubgraphSettingStore } from "@/store/subgraphSettings";
import { useChainStore } from "@/store/chains";
import { useTableSettingStore } from "@/store/tableSettings";
import StatusDropdownVue from '@/components/StatusDropdown.vue';

const allocationStore = useAllocationStore();
const accountStore = useAccountStore();
const subgraphSettingsStore = useSubgraphSettingStore();
const tableSettingsStore = useTableSettingStore();
const chainStore = useChainStore();
const { getActiveAccount } = storeToRefs(accountStore);

const { selected, loaded } = storeToRefs(allocationStore);

defineProps({
  selectable: {
    type: Boolean,
    default: false,
  },
})

function copyToClipboard (copy) {
  navigator.clipboard.writeText(copy)
}

function resetFilters () {
  subgraphSettingsStore.settings.statusFilter = "none";
  allocationStore.networkFilter = [];
  allocationStore.activateBlacklist = false;
  allocationStore.activateSynclist = false;
}

const headers = ref([
    {
      title: 'Status',
      align: 'start',
      key: 'deploymentStatus.blocksBehindChainhead',
    },
    { title: 'Name', key: 'subgraphDeployment.versions[0].subgraph.metadata.displayName' },
    { title: 'Allocated', key: 'allocatedTokens'},
    { title: 'Created', key: 'createdAt' },
    { title: 'Allocation Duration', key: 'activeDuration'},
    { title: 'Current APR', key: 'apr'},
    { title: 'Est Daily Rewards', key: 'dailyRewards'},
    { title: 'Est Daily Rewards (After Cut)', key: 'dailyRewardsCut'},
    { title: 'Pending Rewards', key: 'pendingRewards.value'},
    { title: 'Pending Rewards (After Cut)', key: 'pendingRewardsCut'},
    { title: 'Current Signal', key: 'subgraphDeployment.signalledTokens'},
    { title: 'Current Proportion', key: 'proportion'},
    { title: 'Current Allocations', key: 'subgraphDeployment.stakedTokens'},
    { title: 'Total Query Fees', key: 'subgraphDeployment.queryFeesAmount'},
    { title: 'Total Indexing Rewards', key: 'subgraphDeployment.indexingRewardAmount'},
    { title: 'Deployment ID', key: 'subgraphDeployment.ipfsHash', sortable: false },
    { title: 'Allocation ID', key: 'id', sortable: false, width: "100px" },
  ]);

  watch(loaded, (loaded) => {
    if(loaded == true && subgraphSettingsStore.settings.automaticIndexingRewards && subgraphSettingsStore.settings.rpc[chainStore.getChainID] != '')
      allocationStore.fetchAllPendingRewards();
  })

  allocationStore.init();

  watch(getActiveAccount,  async (newAccount, oldAccount) => {
    console.log(newAccount);
    console.log(oldAccount);
    allocationStore.loaded = false;
    allocationStore.loading = false;
    if(newAccount.address != oldAccount.address || newAccount.chain != oldAccount.chain)
      allocationStore.fetchData();
  });

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
      }else if(index[0] == 'pendingRewards' || index[0] == 'pendingRewardsCut'){
        console.log(t(a, index[0]).safeObject);
        console.log(t(b, index[0]).safeObject);
        if(!isDesc[0]){
          return t(a, index[0]).safeObject.value - t(b, index[0]).safeObject.value;
        } else{
          return t(b, index[0]).safeObject.value - t(a, index[0]).safeObject.value;
        }
      }else {
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