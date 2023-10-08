<template>
  <v-app-bar 
  flat 
  class="appbar"
  color="#5a3c57"
  height=75
  >
    
    <div 
    style="
      display:flex;
      flex: 1 1;
      align-content: center;
      align-items: center;
      margin-inline-start: 16px;
      font-size: 1.25rem;
      font-weight: 400;
      letter-spacing: 0;
      line-height: 1.75rem;
      text-transform: none;
      ">
      <div>
        <v-icon icon="mdi-tools" />

        Indexer Tools v3
      </div>
      <v-select
        label="Chain"
        class="ml-5 mr-2 flex-left chain"
        :items="chainStore.getChains.map(chain => chain.id)"
        :value="chainStore.getChainID"
        @update:model-value="updateChain"
        active="true"
        
      ></v-select>
    </div>
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
    <v-btn
        variant="text"
        to="/actions-manager"
        class="ml-2 mr-2"
    >
      Actions Manager
    </v-btn>
    <v-btn
        variant="text"
        to="/settings"
        class="ml-2 mr-2"
    >
      Settings
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

<style scoped>
.chain{
  max-width:150px;
  max-height:50px;
}
.appbar{
  min-height:75px;
}
</style>