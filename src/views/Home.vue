<template>
  <HelloWorld />
</template>

<script setup>
  import HelloWorld from '@/components/HelloWorld.vue'
  import { useSubgraphsStore } from '../store/subgraphs';

  const subgraphStore = useSubgraphsStore();

  subgraphStore.fetchData();
</script>
