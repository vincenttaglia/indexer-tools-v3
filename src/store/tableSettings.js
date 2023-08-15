// Utilities
import { defineStore } from 'pinia'

export const useTableSettingStore = defineStore('tableSetting', {
  state: () => ({
    subgraphSettings: localStorage.subgraphTableSettings ? JSON.parse(localStorage.subgraphTableSettings) : {
      sortBy: [{
        "key": "newApr",
        "order": "desc"
      }],
      itemsPerPage: 50,
    },
    allocationSettings: localStorage.allocationTableSettings ? JSON.parse(localStorage.allocationTableSettings) : {
      sortBy: [{
        "key": "apr",
        "order": "asc"
      }],
      itemsPerPage: 25,
    },
  }),
  getters: {
    sortByAllocations: (state) => state.allocationSettings.sortBy,
    itemsPerPageAllocations: (state) => state.allocationSettings.itemsPerPage,
    sortBySubgraphs: (state) => state.subgraphSettings.sortBy,
    itemsPerPageSubgraphs: (state) => state.subgraphSettings.itemsPerPage,
  },
})
