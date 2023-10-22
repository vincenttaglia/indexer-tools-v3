// Utilities
import { defineStore } from 'pinia'

export const useManagerSettingStore = defineStore('managerSetting', {
  state: () => ({
    settings: localStorage.managerSettings ? JSON.parse(localStorage.managerSettings) : {
      statusFilter: [],
    },
  }),
  getters: {
    statusFilter: (state) => state.settings.statusFilter,
  },
})
