<template>
  <router-view />
</template>

<script setup>
  import { useSubgraphSettingStore } from './store/subgraphSettings';
  import { useTableSettingStore } from './store/tableSettings';
  const subgraphSettingsStore = useSubgraphSettingStore();
  const tableSettingsStore = useTableSettingStore();

  subgraphSettingsStore.$subscribe(() => {
    console.log('subgraph settings changed, saving!');
    localStorage.subgraphSettings = JSON.stringify(subgraphSettingsStore.settings);
  })

  tableSettingsStore.$subscribe(() => {
    console.log('table settings changed, saving!');
    localStorage.subgraphTableSettings = JSON.stringify(tableSettingsStore.subgraphSettings);
    localStorage.allocationTableSettings = JSON.stringify(tableSettingsStore.allocationSettings);
  })
  
  
</script>
