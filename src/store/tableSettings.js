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
        "order": "desc"
      }],
      itemsPerPage: 100, // Increased from 25 to 100 for better performance with large datasets
      virtualScrolling: true, // Enable virtual scrolling for large datasets
      lazyLoading: true, // Enable lazy loading
      batchSize: 250, // Process data in batches of 250
    },
  }),
  getters: {
    sortByAllocations: (state) => state.allocationSettings.sortBy,
    itemsPerPageAllocations: (state) => state.allocationSettings.itemsPerPage,
    sortBySubgraphs: (state) => state.subgraphSettings.sortBy,
    itemsPerPageSubgraphs: (state) => state.subgraphSettings.itemsPerPage,
    virtualScrollingEnabled: (state) => state.allocationSettings.virtualScrolling,
    lazyLoadingEnabled: (state) => state.allocationSettings.lazyLoading,
    batchSize: (state) => state.allocationSettings.batchSize,
  },
  actions: {
    // Update allocation settings with performance optimizations
    updateAllocationSettings(settings) {
      this.allocationSettings = { ...this.allocationSettings, ...settings };
      // Save to localStorage
      localStorage.allocationTableSettings = JSON.stringify(this.allocationSettings);
    },

    // Reset to performance-optimized defaults
    resetToPerformanceDefaults() {
      this.allocationSettings = {
        sortBy: [{
          "key": "apr",
          "order": "desc"
        }],
        itemsPerPage: 100,
        virtualScrolling: true,
        lazyLoading: true,
        batchSize: 250,
      };
      localStorage.allocationTableSettings = JSON.stringify(this.allocationSettings);
    }
  }
})
