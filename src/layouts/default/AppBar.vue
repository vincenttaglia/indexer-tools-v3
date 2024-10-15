<template>
  <v-app-bar 
  flat 
  class="appbar"
  color="#5a3c57"
  height=75
  >
    <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
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
      <div style="white-space: nowrap;">
        <v-icon icon="mdi-tools" />

        Indexer Tools v3
      </div>
      <v-select
        label="Chain"
        class="ml-5 mr-2 flex-left chain"
        style="min-width: 150px"
        :items="chainStore.getChains.map(chain => chain.id)"
        :value="chainStore.getChainID"
        @update:model-value="updateChain"
        active="true"
        
      ></v-select>
    </div>
    <div style="overflow: hidden;white-space: nowrap;">
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
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
          >
            Managers
          </v-btn>
        </template>

        <v-list>
          <v-list-item to="/actions-manager">
            <v-list-item-title>
              Actions Manager
            </v-list-item-title>
          </v-list-item>
          <v-list-item to="/offchain-manager">
            <v-list-item-title>
              Offchain Sync Manager
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
          >
            Dashboards
          </v-btn>
        </template>

        <v-list>
          <v-list-item to="/query-dashboard">
            <v-list-item-title>
              Query Dashboard
            </v-list-item-title>
          </v-list-item>
          <v-list-item to="/qos-dashboard">
            <v-list-item-title>
              QoS Dashboard
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn
          variant="text"
          to="/settings"
          class="ml-2 mr-2"
      >
        Settings
      </v-btn>
    </div>
    <accounts-dropdown></accounts-dropdown>
  </v-app-bar>
  <v-navigation-drawer
    v-model="drawer"
    temporary
  >
    <v-list nav>
      <v-list-item title="Subgraphs Dashboard" to="/" exact></v-list-item>
      <v-list-item title="Allocations Dashboard" to="/allocations"></v-list-item>
      <v-list-item title="Allocation Wizard" to="/wizard"></v-list-item>
      <v-list-item title="Actions Manager" to="/actions-manager"></v-list-item>
      <v-list-item title="Offchain Sync Manager" to="/offchain-manager"></v-list-item>
      <v-list-item title="Query Fee Dashboard" to="/query-dashboard"></v-list-item>
      <v-list-item title="QoS Dashboard" to="/qos-dashboard"></v-list-item>
      <v-list-item title="Settings" to="/settings"></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
  import AccountsDropdown from '@/components/AccountsDropdown.vue';
  import { useNetworkStore } from '@/store/network';
  import { useSubgraphsStore } from '@/store/subgraphs';
  import { useAllocationStore } from '@/store/allocations';
  import { useChainStore } from '@/store/chains';
  import { ref } from 'vue';
  const chainStore = useChainStore();
  const networkStore = useNetworkStore();
  const subgraphStore = useSubgraphsStore();
  const allocationStore = useAllocationStore();
  const drawer = ref(false);

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