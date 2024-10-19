<template>
  <v-data-table
      :headers="subgraphSettingsStore.settings.selectedAllocationColumns"
      :items="allocationStore.getFilteredAllocations"
      item-selectable="subgraphDeployment.ipfsHash"
      class="elevation-1"
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
        <v-combobox
          v-model="allocationStore.networkFilter"
          :items="allocationStore.getSubgraphNetworks"
          label="Subgraph Networks"
          multiple
          chips
          class="d-inline-block mx-4"
          style="min-width:13rem;max-width: 15rem;top: -5px"
        ></v-combobox>
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
    <template v-slot:item.qos.query_count="{ item }">
      {{ numeral(item.qos?.query_count).format('0,0') }} queries
    </template>
    <template v-slot:item.qos.total_query_fees="{ item }">
      {{ numeral(item.qos?.total_query_fees).format('0,0') }} GRT
    </template>
    <template v-slot:item.qos.avg_indexer_latency_ms="{ item }">
      {{ numeral(item.qos?.avg_indexer_latency_ms).format('0,0.0') }} ms
    </template>
    <template v-slot:item.qos.max_indexer_latency_ms="{ item }">
      {{ numeral(item.qos?.max_indexer_latency_ms).format('0,0.0') }} ms
    </template>
    <template v-slot:item.qos.avg_query_fee="{ item }">
      {{ numeral(item.qos?.avg_query_fee).format('0,0.00000') }} GRT
    </template>
    <template v-slot:item.qos.max_query_fee="{ item }">
      {{ numeral(item.qos?.max_query_fee).format('0,0.00000') }} GRT
    </template>
    <template v-slot:item.qos.proportion_indexer_200_responses="{ item }">
      {{ numeral(item.qos?.proportion_indexer_200_responses).format('0.00%') }}
    </template>
    <template v-slot:item.qos.avg_indexer_blocks_behind="{ item }">
      {{ numeral(item.qos?.avg_indexer_blocks_behind).format('0,0') }} blocks
    </template>
    <template v-slot:item.qos.max_indexer_blocks_behind="{ item }">
      {{ numeral(item.qos?.max_indexer_blocks_behind).format('0,0') }} blocks
    </template>
    <template v-slot:item.qos.num_indexer_200_responses="{ item }">
      {{ numeral(item.qos?.num_indexer_200_responses).format('0,0') }} queries
    </template>
    <template v-slot:item.queryFees.query_count="{ item }">
      {{ item.queryFees?.query_count ? numeral(item.queryFees.query_count).format('0,0') : '-' }}
    </template>
    <template v-slot:item.queryFees.total_query_fees="{ item }">
      {{ item.queryFees?.total_query_fees ? numeral(item.queryFees.total_query_fees).format('0,0') : '-' }} GRT
    </template>
    <template v-slot:body.append>
      <DashboardFooter :columns="subgraphSettingsStore.settings.selectedAllocationColumns" :selectable="selectable">
        <template v-slot:selectable>
          <strong style="font-size: 11px">Totals</strong>
        </template>
        <template v-slot:deploymentStatus.blocksBehindChainhead>
          <strong style="font-size: 11px" v-if="!selectable">Totals</strong>
        </template>
        <template v-slot:subgraphDeployment.versions[0].subgraph.metadata.displayName>
          <strong>{{ allocationStore.getAllocations.length }} allocations</strong>&nbsp;&nbsp;
        </template>
        <template v-slot:apr>
          <strong>{{ numeral(allocationStore.avgAPR).format('0,0.00%') }}</strong>&nbsp;&nbsp;
        </template>
        <template v-slot:dailyRewards>
          <strong>{{ numeral(Web3.utils.fromWei(Web3.utils.toBN(allocationStore.dailyRewardsSum))).format('0,0') }} GRT&nbsp;&nbsp;</strong>
        </template>
        <template v-slot:dailyRewardsCut>
          <strong>{{ numeral(Web3.utils.fromWei(Web3.utils.toBN(allocationStore.dailyRewardsCutSum))).format('0,0') }} GRT&nbsp;&nbsp;</strong>
        </template>
        <template v-slot:pendingRewards.value>
          <strong>{{ numeral(Web3.utils.fromWei(Web3.utils.toBN(allocationStore.pendingRewardsSum))).format('0,0') }} GRT&nbsp;&nbsp;</strong>
        </template>
        <template v-slot:pendingRewardsCut>
          <strong>{{ numeral(Web3.utils.fromWei(Web3.utils.toBN(allocationStore.pendingRewardsCutSum))).format('0,0') }} GRT</strong>
        </template>
      </DashboardFooter>
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
  import { useSubgraphSettingStore } from "@/store/subgraphSettings";
  import { useChainStore } from "@/store/chains";
  import { useTableSettingStore } from "@/store/tableSettings";
  import StatusDropdownVue from '@/components/StatusDropdown.vue';
  import DashboardFooter from "@/components/DashboardFooter.vue";

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

  function resetFilters () {
    subgraphSettingsStore.settings.statusFilter = "none";
    allocationStore.networkFilter = [];
    allocationStore.activateBlacklist = false;
    allocationStore.activateSynclist = false;
  }

  watch(loaded, (loaded) => {
    if(loaded == true && subgraphSettingsStore.settings.automaticIndexingRewards && subgraphSettingsStore.settings.rpc[chainStore.getChainID] != '')
      allocationStore.fetchAllPendingRewards();
  })
  watch(getActiveAccount,  async (newAccount, oldAccount) => {
    console.log(newAccount);
    console.log(oldAccount);
    allocationStore.loaded = false;
    allocationStore.loading = false;
    if(newAccount.address != oldAccount.address || newAccount.chain != oldAccount.chain)
      allocationStore.fetchData();
  });

  allocationStore.init();
</script>