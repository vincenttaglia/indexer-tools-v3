<template>
  <v-app-bar flat>
    <v-app-bar-title>
      <v-icon icon="mdi-circle-slice-6" />

      Indexer Tools v3
    </v-app-bar-title>
    <v-select
      label="Chain"
      class="ml-5 mr-2"
      style="width:10px"
      :items="chainStore.getChains.map(chain => chain.id)"
      :value="chainStore.getActiveChain.id"
      @update:model-value="updateChain"
    ></v-select>
    <v-btn
        variant="text"
        to="/"
        class="ml-5 mr-2"
        exact
    >
      Subgraphs Dashboard
    </v-btn>
    <v-btn
        variant="text"
        to="/allocations"
        class="ml-2 mr-2"
    >
      Allocations Dashboard
    </v-btn>
    <v-btn
        variant="text"
        to="/wizard"
        class="ml-2 mr-2"
    >
      Allocation Wizard
    </v-btn>
    <accounts-dropdown></accounts-dropdown>
  </v-app-bar>
</template>

<script setup>
  import AccountsDropdown from '@/components/AccountsDropdown.vue';
  import { useNetworkStore } from '@/store/network';
  import { useSubgraphsStore } from '@/store/subgraphs';
  import { useAllocationStore } from '@/store/allocations';
  import { useChainStore } from '@/store/chains';
  const chainStore = useChainStore();
  const networkStore = useNetworkStore();
  const subgraphStore = useSubgraphsStore();
  const allocationStore = useAllocationStore();

  function updateChain(id){
    chainStore.setChain(id);
    networkStore.init();
    subgraphStore.fetchData();
    allocationStore.fetchData();
  }

</script>
<style>
.v-input{
  flex: 0.2 0.5 0%;
}
</style>