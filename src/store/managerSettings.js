// Utilities
import { defineStore } from 'pinia'

const settingsDefault = {
  statusFilter: [],
  selectStrategy: 'page',
};

export const useManagerSettingStore = defineStore('managerSetting', {
  state: () => ({
    settings: localStorage.managerSettings ? Object.assign({}, settingsDefault, JSON.parse(localStorage.managerSettings)) : Object.assign({}, settingsDefault),
  }),
  getters: {
    statusFilter: (state) => state.settings.statusFilter,
    selectStrategy: (state) => state.settings.selectStrategy,
  },
})
