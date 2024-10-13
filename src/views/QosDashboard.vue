<template>
  <div class="d-flex align-content-center">
    <v-btn text="Refresh Subgraphs" prepend-icon="mdi-refresh" @click="qosStore.fetchData()" class="mx-5 my-6" stacked></v-btn>
    <div class="d-flex align-content-center align-center justify-center">
      <v-combobox
          v-model="subgraphSettingStore.settings.queryFilters.networkFilter"
          :items="networks"
          label="Subgraph Networks"
          multiple
          chips
          clearable
          class="d-inline-block mx-4"
          style="min-width:13rem;max-width: 15rem;top: -5px"
      ></v-combobox>
    </div>
  </div>
  <v-data-table
      :headers="headers"
      :items="qosStore.qosData"
      class="elevation-1"
      loading-text="Loading... Please wait"
      mobile-breakpoint="0"
      hover
      items-per-page="25"
      :loading = "qosStore.loading"
  >
    <template v-slot:no-data>
      <p class="mt-4">
        No data available
      </p>
      <br>
      <v-btn
        rounded
        variant="text"
        @click="resetFilters()"
        class="mb-4 mt-2"
      >
        Reset Filters
      </v-btn>
    </template>
    <template v-slot:item.deploymentStatus.blocksBehindChainhead="{ item }">
      <StatusDropdownVue :item='item' />
    </template>
    <template v-slot:item.query_count="{ item }">
      {{ numeral(item.query_count).format('0,0') }}
    </template>
    <template v-slot:item.total_query_fees="{ item }">
      {{ numeral(item.total_query_fees).format('0,0') }} GRT
    </template>
    <template v-slot:item.avg_gateway_latency_ms="{ item }">
      {{ numeral(item.avg_gateway_latency_ms).format('0,0.00') }} ms
    </template>
    <template v-slot:item.avg_query_fee="{ item }">
      {{ numeral(item.avg_query_fee).format('0,0.00000') }} GRT
    </template>
    <template v-slot:item.gateway_query_success_rate="{ item }">
      {{ numeral(item.gateway_query_success_rate).format('0.00%') }}
    </template>
    <template v-slot:item.upgradeIndexer="{ item }">
      <span
        v-if="!item.upgradeIndexer.loading && !item.upgradeIndexer.loaded"
        >
        <v-icon left @click="subgraphStore.fetchNumEntities(item.deployment.ipfsHash);">
          mdi-account-arrow-down
        </v-icon>
      </span>
      <v-progress-circular
          indeterminate
          color="purple"
          v-if="item.upgradeIndexer.loading && !item.upgradeIndexer.loaded"
      ></v-progress-circular>
      <div 
       v-if="!item.upgradeIndexer.loading && item.upgradeIndexer.loaded"
       class="d-flex"
      >
        <span>
          {{ numeral(item.upgradeIndexer.value).format('0,0') }} Entities
        </span>
      </div>
      
    </template>
  </v-data-table>
</template>

<script setup>
import { ref } from "vue";
import numeral from "numeral";
import { useSubgraphSettingStore } from "@/store/subgraphSettings";
import { useQosStore } from "@/store/qos";
import { networks } from "@/plugins/subgraphNetworks";
import StatusDropdownVue from '@/components/StatusDropdown.vue';
import { useSubgraphsStore } from "@/store/subgraphs";

const subgraphSettingStore = useSubgraphSettingStore();
const qosStore = useQosStore();
const subgraphStore = useSubgraphsStore();

qosStore.fetchData();


function resetFilters () {

}

const headers = ref([
  { title: 'Status', key: 'deploymentStatus.blocksBehindChainhead', align: 'start' },
  { title: 'Name', key: 'deployment.versions[0].metadata.subgraphVersion.subgraph.metadata.displayName' },
  { title: 'Query Fees (1d)', key: 'total_query_fees'},
  { title: 'Query Count (1d)', key: 'query_count' },
  { title: 'Entities', key: 'upgradeIndexer'},
  { title: 'Chain ID', key: 'chain_id'},
  { title: 'Avg Latency', key: 'avg_gateway_latency_ms' },
  { title: 'Avg Query Fee', key: 'avg_query_fee'},
  { title: 'Success Rate', key: 'gateway_query_success_rate' },
  { title: 'Deployment ID', key: 'subgraphDeployment.id' },

]);
</script>