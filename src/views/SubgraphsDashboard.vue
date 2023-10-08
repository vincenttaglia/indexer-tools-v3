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
    <template v-slot:top>
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
      <v-text-field
          v-model="subgraphSettingStore.settings.newAllocation"
          type="number"
          label="New Allocation"
          class="d-inline-block mx-4"
          style="max-width:15rem"
      ></v-text-field>
      <v-text-field
          v-model="subgraphSettingStore.settings.targetApr"
          type="number"
          label="Target APR"
          class="d-inline-block mx-4"
          style="max-width:15rem"
      ></v-text-field>
      <v-select
          v-model="subgraphSettingStore.settings.noRewardsFilter"
          :items="[{text: 'Exclude Denied', action: 0}, {text:'Include Denied', action: 1}, {text: 'Only Denied', action: 2}]"
          item-title="text"
          item-value="action"
          label="Subgraphs w/ Denied Rewards"
          style="max-width: 15rem;"
          class="d-inline-block mx-4"
      ></v-select>
      <v-select
          v-model="subgraphSettingStore.settings.networkFilter"
          :items="subgraphStore.getSubgraphNetworks"
          label="Subgraph Networks"
          multiple
          chips
          class="d-inline-block mx-4"
          style="min-width:13rem;max-width: 15rem;top: -5px"
      ></v-select>
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
    </template>
    <template v-slot:item.deploymentStatus.blocksBehindChainhead="{ item }">
      <v-menu
        min-width="200px"
        rounded
      >
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            v-bind="props"
          >
            <v-badge
              :model-value="item.currentVersion.subgraphDeployment.deniedAt != '0'"
              bordered
              color="error"
              icon="mdi-currency-usd-off"
              overlap
              avatar
              v-if="(item.currentVersion.subgraphDeployment.deniedAt && item.currentlyAllocated) || (!item.currentVersion.subgraphDeployment.deniedAt && !item.currentlyAllocated) || (item.currentVersion.subgraphDeployment.deniedAt && !item.currentlyAllocated)"
              >
              <v-avatar :color="item.deploymentStatus.health != undefined ? item.deploymentStatus.color : ''" size="34">
                <v-avatar size="30">
                  <v-img :src="item.image" />
                </v-avatar>
              </v-avatar>
            </v-badge>
            <v-badge
                :model-value="item.currentlyAllocated"
                bordered
                color="warning"
                icon="mdi-exclamation-thick"
                overlap
                avatar
                v-if="!item.currentVersion.subgraphDeployment.deniedAt && item.currentlyAllocated"
            >
              <v-avatar :color="item.deploymentStatus.health != undefined ? item.deploymentStatus.color : ''" size="34">
                <v-avatar size="30">
                  <v-img :src="item.image" />
                </v-avatar>
              </v-avatar>
            </v-badge>
          </v-btn>
        </template>
        <v-card>
          <v-card-text>
            <div class="mx-auto text-center">
              <v-avatar
                size="25"
                :color="item.deploymentStatus?.color != undefined ? item.deploymentStatus.color : 'white'"
              >
                <v-icon :icon="item.deploymentStatus?.icon != undefined ? item.deploymentStatus.icon : 'mdi-close'"></v-icon>
              </v-avatar>
              <h4 class="mt-1">{{item.deploymentStatus?.health != undefined ? item.deploymentStatus.health.toUpperCase() : "Not Deployed"}}</h4>
              <v-divider v-if="item.deploymentStatus?.health != undefined && item.deploymentStatus?.health == 'failed' && item.deploymentStatus?.fatalError" class="my-2"></v-divider>
              <div v-if="item.deploymentStatus?.health != undefined && item.deploymentStatus?.health == 'failed' && item.deploymentStatus?.fatalError">
                <p class="mt-2">
                  Deterministic: <v-icon :icon="item.deploymentStatus.fatalError.deterministic ? 'mdi-check' : 'mdi-close'"></v-icon>
                </p>
                <v-btn
                  rounded
                  variant="text"
                  @click="copyToClipboard(item.deploymentStatus?.fatalError?.block?.number)"
                >
                  Block: {{ item.deploymentStatus?.fatalError?.block?.number }}
                </v-btn>
                <br>
                <v-btn
                  rounded
                  variant="text"
                  @click="copyToClipboard(item.deploymentStatus?.fatalError?.block?.hash)"
                >
                  Hash: {{ item.deploymentStatus?.fatalError?.block?.hash.slice(0,6) }}...{{ item.deploymentStatus.fatalError.block.hash.slice(item.deploymentStatus.fatalError.block.hash.length-4,item.deploymentStatus.fatalError.block.hash.length) }}
                </v-btn>
                <br>
                <v-btn
                  rounded
                  variant="text"
                  @click="copyToClipboard(item.deploymentStatus?.fatalError?.message)"
                >
                  Copy Error
                </v-btn>
              </div>
              
              <v-divider class="my-2"></v-divider>
              <p class="text-caption mt-2">
                First block: {{ item.deploymentStatus?.chains?.[0]?.earliestBlock?.number != undefined ? item.deploymentStatus.chains[0].earliestBlock.number : '-' }}
              </p>
              <p class="text-caption">
                Last block: {{ item.deploymentStatus?.chains?.[0]?.latestBlock?.number != undefined ? item.deploymentStatus.chains[0].latestBlock.number: '-' }}
              </p>
              <p class="text-caption mb-1">
                Chainhead: {{ item.deploymentStatus?.chains[0]?.chainHeadBlock?.number != undefined ? item.deploymentStatus.chains[0].chainHeadBlock.number: '-' }}
              </p>
              {{ item.deploymentStatus?.chains?.[0]?.earliestBlock?.number != undefined && item.deploymentStatus?.chains?.[0]?.latestBlock?.number != undefined && item.deploymentStatus?.chains[0]?.chainHeadBlock?.number != undefined ? numeral((item.deploymentStatus.chains[0].latestBlock.number - item.deploymentStatus.chains[0].earliestBlock.number) / (item.deploymentStatus.chains[0].chainHeadBlock.number - item.deploymentStatus.chains[0].earliestBlock.number)).format('0.00%') : '-%' }}
              <v-progress-linear class="mt-1" :model-value="item.deploymentStatus?.chains?.[0]?.earliestBlock?.number != undefined && item.deploymentStatus?.chains?.[0]?.latestBlock?.number != undefined && item.deploymentStatus?.chains[0]?.chainHeadBlock?.number != undefined ? (item.deploymentStatus.chains[0].latestBlock.number - item.deploymentStatus.chains[0].earliestBlock.number) / (item.deploymentStatus.chains[0].chainHeadBlock.number - item.deploymentStatus.chains[0].earliestBlock.number)*100 : 0"></v-progress-linear>
            </div>
          </v-card-text>
        </v-card>
      </v-menu>
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.createdAt="{ item }">
      <span :timestamp="item.currentVersion.subgraphDeployment.createdAt">{{ moment(item.currentVersion.subgraphDeployment.createdAt + "000", "x").format("MMM D, YYYY HH:mm") }}</span>
    </template>
    <template v-slot:item.proportion="{ item }">
      {{ numeral(item.proportion*100).format('0,0.000') }}%
    </template>
    <template v-slot:item.apr="{ item }">
      {{ numeral(item.apr).format('0,0.00') }}%
    </template>
    <template v-slot:item.newApr="{ item }">
        {{ numeral(item.newApr).format('0,0.00') }}%
      </template>
    <template v-slot:item.maxAllo="{ item }">
      {{ numeral(item.maxAllo).format('0,0') }} GRT
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
    <template v-slot:item.currentVersion.subgraphDeployment.network.id="{ item }">
      {{ item.currentVersion.subgraphDeployment.network ? item.currentVersion.subgraphDeployment.network.id : "null" }}
    </template> 
  </v-data-table>
  <v-btn
      text
      class="my-5 mx-3"
  >
    <download-csv
      :data   = "subgraphStore.getSubgraphs" 
      :csv-title="'subgraphs'">
      Download Data
    </download-csv>
  </v-btn>
  
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
  import { useTableSettingStore } from "@/store/tableSettings";

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

function copyToClipboard (copy) {
  navigator.clipboard.writeText(copy)
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
