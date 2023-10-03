// Utilities
import { defineStore } from 'pinia'

export const useSubgraphSettingStore = defineStore('subgraphSetting', {
  state: () => ({
    settings: localStorage.subgraphSettings ? JSON.parse(localStorage.subgraphSettings) : {
      search: '',
      minSignal: '',
      maxSignal: '',
      newAllocation: '100000',
      targetApr: '10',
      noRewardsFilter: 0,
      networkFilter: [],
      activateBlacklist: false,
      activateSynclist: false,
      activateStatusList: false,
      automaticIndexingRewards: false,
      subgraphBlacklist: "",
      subgraphSynclist: "",
      networks: ["mainnet", "gnosis", "arbitrum-one", "matic", "fantom", "celo", "avalanche", "optimism", "goerli", "rinkeby"],
      rpc: {
        mainnet: "",
        arbitrum: "",
        goerli: "",
      }
    },
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
})
