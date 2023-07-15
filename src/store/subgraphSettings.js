// Utilities
import { defineStore } from 'pinia'

export const useSubgraphSettingStore = defineStore('subgraphSetting', {
  state: () => ({
    search: '',
    minSignal: '',
    maxSignal: '',
    newAllocation: '100000',
    targetApr: '10',
    noRewardsFilter: 0,
    networkFilter: [],
    activateBlacklist: false,
    activateSynclist: false,
    subgraphBlacklist: "",
    subgraphSynclist: "",
    networks: ["mainnet", "gnosis", "arbitrum-one", "celo", "matic", "avalanche", "goerli", "rinkeby"],
  }),
})
