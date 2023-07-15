<template>
  <div>
  <v-card>
      <v-toolbar
      flat
      color="#5a3c57"
      dark
      >
      <v-toolbar-title>Settings</v-toolbar-title>
      </v-toolbar>
      <div class="d-flex flex-row">
        <v-tabs 
        direction="vertical" 
        v-model="tab"
        >
          <v-tab value="general">
            <v-icon start>
            mdi-cog
            </v-icon>
            General
          </v-tab>
          <v-tab value="accounts">
            <v-icon start>
            mdi-account
            </v-icon>
            Accounts
          </v-tab>
          <v-tab value="table-config">
            <v-icon start>
            mdi-table-border
            </v-icon>
            Table Config
          </v-tab>
          <v-tab value="agent-connect">
            <v-icon start>
            mdi-access-point
            </v-icon>
            Agent Connect
          </v-tab>
        </v-tabs>
        <v-window v-model="tab">
          <v-window-item value="general">
            <v-card flat>
            <v-card-text>
                <v-switch
                v-model="subgraphSettingsStore.settings.automaticIndexingRewards"
                :label="`Automatic Indexing Rewards*`"
                class="mb-0"
                ></v-switch>
                <p class="mb-8">
                    * Disable if there are issues with allocation wizard.
                </p>
                <h3>Subgraph Sync List (Manual)</h3>
                <v-textarea rows="3" v-model="subgraphSettingsStore.settings.subgraphSynclist"></v-textarea>
                <h3>Subgraph Blacklist</h3>
                <v-textarea rows="3" v-model="subgraphSettingsStore.settings.subgraphBlacklist"></v-textarea>
            </v-card-text>
            </v-card>
          </v-window-item>
          <v-window-item value="accounts">
            <v-card flat>
            <v-card-text style="width:450px">
                <AccountsEdit></AccountsEdit>
            </v-card-text>
            </v-card>
          </v-window-item>
          <v-window-item value="table-config">
            <v-card flat>
            <v-card-text>
                <p>
                    Soon: more columns and control over which columns are shown. Change order of columns now on dashboard pages.
                </p>
            </v-card-text>
            </v-card>
          </v-window-item>
          <v-window-item value="agent-connect">
            <v-card flat>
            <v-card-text>
                <p>
                Coming soon ;)
                </p>
            </v-card-text>
            </v-card>
          </v-window-item>
        </v-window>
      </div>
    </v-card>
  </div>
  </template>
  
  <script setup>
  import AccountsEdit from '@/components/AccountsEdit.vue';
  import { useSubgraphSettingStore } from '@/store/subgraphSettings';
  import { ref } from 'vue';
  import { storeToRefs } from 'pinia';
import store from '@/store';
  
  const subgraphSettingsStore = useSubgraphSettingStore();
  const subgraphSettings = storeToRefs(subgraphSettingsStore);
  const tab = ref("general");
  </script>
  
  <style scoped>
  
  </style>