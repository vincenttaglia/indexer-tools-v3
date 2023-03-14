// Utilities
import { defineStore } from 'pinia'

export const useSubgraphSettingStore = defineStore('subgraphSetting', {
  state: () => ({
    search: '',
    minSignal: '',
    maxSignal: '',
    newAllocation: '100000',
    targetApr: '',
    noRewardsFilter: 0,
    networkFilter: [],
    activateBlacklist: false,
    activateSynclist: false
  }),
})
