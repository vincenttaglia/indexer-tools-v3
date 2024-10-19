// Utilities
import { defineStore } from 'pinia'

const settingsDefault = {
  search: '',
  minSignal: '',
  maxSignal: '',
  newAllocation: '100000',
  targetApr: '10',
  noRewardsFilter: 0,
  networkFilter: [],
  activateBlacklist: false,
  activateSynclist: false,
  statusFilter: 'none',
  automaticIndexingRewards: false,
  subgraphBlacklist: "",
  subgraphSynclist: "",
  rpc: {
    mainnet: "",
    arbitrum: "",
    sepolia: "",
    arbitrumSepolia: "",
  },
  hideCurrentlyAllocated: false,
  queryFilters: {
    minSignal: '',
    networkFilter: [],
  },
  selectedAllocationColumns: [
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
    { title: 'Deployment ID', key: 'subgraphDeployment.ipfsHash', sortable: false },
    { title: 'Allocation ID', key: 'id', sortable: false, width: "100px" },
    { title: 'Query Fees (1d)', key: 'qos.total_query_fees'},
    { title: 'Query Count (1d)', key: 'qos.query_count' },
    { title: 'Avg Latency', key: 'qos.avg_indexer_latency_ms' },
    { title: 'Avg Query Fee', key: 'qos.avg_query_fee'},
    { title: 'Success Rate', key: 'qos.proportion_indexer_200_responses' },
    { title: 'Avg Blocks Behind', key: 'qos.avg_indexer_blocks_behind'},
    { title: 'Max Latency', key: 'qos.max_indexer_latency_ms'},
    { title: 'Max Blocks Behind', key: 'qos.max_indexer_blocks_behind'},
    { title: 'Successful Queries', key: 'qos.num_indexer_200_responses'},
    { title: 'Avg Query Fee', key: 'qos.avg_query_fee' },
    { title: 'Max Query Fee', key: 'qos.max_query_fee' },
    { title: 'Network Query Fees (1d)', key: 'queryFees.total_query_fees'},
    { title: 'Network Queries (1d)', key: 'queryFees.query_count'},
  ],
  selectedSubgraphColumns: [
    { title: 'Status', key: 'deploymentStatus.blocksBehindChainhead', align: 'start' },
    { title: 'Name', key: 'deployment.versions[0].metadata.subgraphVersion.subgraph.metadata.displayName' },
    { title: 'Network', key: 'deployment.manifest.network'},
    { title: 'Created', key: 'deployment.createdAt' },
    { title: 'Current APR', key: 'apr'},
    { title: 'Max Allocation', key: 'maxAllo'},
    { title: 'Est Daily Rewards (Before Cut)', key: 'dailyRewards'},
    { title: 'Est Daily Rewards (After Cut)', key: 'dailyRewardsCut'},
    { title: 'Current Signal', key: 'deployment.signalledTokens'},
    { title: 'Entities', key: 'upgradeIndexer'},
    { title: 'Current Proportion', key: 'proportion'},
    { title: 'Current Allocations', key: 'deployment.stakedTokens'},
    { title: 'Query Fees (1d)', key: 'queryFees.total_query_fees'},
    { title: 'Queries (1d)', key: 'queryFees.query_count'},
    { title: 'Deployment ID', key: 'deployment.ipfsHash', sortable: false },
  ],
};

export const useSubgraphSettingStore = defineStore('subgraphSetting', {
  state: () => ({
    settings: localStorage.subgraphSettings ? Object.assign({}, settingsDefault, JSON.parse(localStorage.subgraphSettings)) : Object.assign({}, settingsDefault),
  }),
  getters: {
    search: (state) => state.settings.search,
    minSignal: (state) => state.settings.minSignal,
    maxSignal: (state) => state.settings.maxSignal,
    newAllocation: (state) => state.settings.newAllocation,
    targetApr: (state) => state.settings.targetApr,
    noRewardsFilter: (state) => state.settings.noRewardsFilter,
    networkFilter: (state) => state.settings.networkFilter,
    activateBlacklist: (state) => state.settings.activateBlacklist,
    activateSynclist: (state) => state.settings.activateSynclist,
    automaticIndexingRewards: (state) => state.settings.automaticIndexingRewards,
    subgraphBlacklist: (state) => state.settings.subgraphBlacklist,
    subgraphSynclist: (state) => state.settings.subgraphSynclist,
    networks: (state) => state.settings.networks,
  },
  actions: {
    moveItemInArray(array, from, to) {
      const item = this.settings[array].splice(from, 1)[0];
      this.settings[array].splice(to, 0, item);
    },
    async moveItemInAllocationColumns(from, to) {
      this.moveItemInArray('selectedAllocationColumns', from, to);
    },
    async moveItemInSubgraphColumns(from, to) {
      this.moveItemInArray('selectedSubgraphColumns', from, to);
    },
    async resetAllocationDefaultColumns(){
      this.settings.selectedAllocationColumns = settingsDefault.selectedAllocationColumns.slice();
    },
    async resetSubgraphDefaultColumns(){
      this.settings.selectedSubgraphColumns = settingsDefault.selectedSubgraphColumns.slice();
    },
  }
})
