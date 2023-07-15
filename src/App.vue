<template>
  <router-view />
</template>

<script setup>
  import { storeToRefs } from 'pinia'
  import { watch } from 'vue'
  import { useSubgraphSettingStore } from './store/subgraphSettings';
  const subgraphSettingsStore = useSubgraphSettingStore();

  const { settings } = storeToRefs(subgraphSettingsStore);

  let { targetApr } = settings;

  subgraphSettingsStore.$subscribe(() => {
    console.log('settings changed, saving!');
    localStorage.subgraphSettings = JSON.stringify(subgraphSettingsStore.settings);
  })
  
  
</script>
