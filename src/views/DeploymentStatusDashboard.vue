<template>
  <v-confirm-edit v-model="statusUrl" @change="getStatus">
    <template v-slot:default="{ model: proxyModel, save, cancel, isPristine, actions}">
      <v-text-field
        v-model="proxyModel.value"
        label="Status Endpoint"
        class="d-inline-block mx-4 mt-4"
        style="width:50rem"
        :append-inner-icon="isPristine ? '' : 'mdi-check'"
        :clear-icon="isPristine ? '' : 'mdi-undo-variant'"
        @click:append-inner="save"
        @click:clear="cancel"
        @keydown.enter="save"
        clearable
        hide-spin-buttons
      ></v-text-field>
      <component :is="actions" v-if="false"></component>
    </template>
  </v-confirm-edit>
  <v-data-table
      :headers="headers"
      :items="deploymentStatuses"
      class="elevation-1"
      mobile-breakpoint="0"
      :loading="loading"
  >
    <template v-slot:item.deploymentStatus.blocksBehindChainhead="{ item }">
      <StatusDropdown :item='item' />
    </template>
  </v-data-table>
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { useSubgraphsStore } from '@/store/subgraphs';
  import StatusDropdown from '@/components/StatusDropdown.vue';
  import numeral from 'numeral';

  const statusUrl = ref();
  const deploymentStatuses = ref([]);
  const subgraphStore = useSubgraphsStore();
  const loading = ref(false);

  watch(statusUrl, () => {
    getStatus();
  });
  
  const headers = [
  {
    title: 'Status',
    align: 'start',
    key: 'deploymentStatus.blocksBehindChainhead',
  },
  {
    title: 'Name',
    key: 'deployment.versions[0].metadata.subgraphVersion.subgraph.metadata.displayName',
  },
  {
    title: 'First Block',
    key: 'deploymentStatus.chains[0].earliestBlock.number'
  },
  {
    title: 'Last Block',
    key: 'deploymentStatus.chains[0].latestBlock.number'
  },
  {
    title: 'Chainhead Block',
    key: 'deploymentStatus.chains[0].chainHeadBlock.number'
  },
  {
    title: 'Health',
    key: 'deploymentStatus.health'
  },
  {
    title: 'Synced',
    key: 'deploymentStatus.synced'
  },
  {
    title: 'Completion',
    key: 'deploymentStatus.completion'
  },
  {
    title: 'Node',
    key: 'deploymentStatus.node',
  },
  {
    title: 'Deployment ID',
    key: 'deploymentStatus.subgraph',
  },
  ]

  async function getStatus(){
    loading.value = true;
    const url = new URL('/status', statusUrl.value);
    console.log(url.href);
    await subgraphStore.fetchData();
    fetch(url.href,  {
      method: "POST",
      headers: {"Content-type": "application/json"},
      body: JSON.stringify({query: "{ indexingStatuses { subgraph synced health fatalError{ message deterministic block{ hash number } } node chains{ latestBlock{number} chainHeadBlock{number} earliestBlock{number} } } }"}),
    })
    .then((res) => res.json())
    .then((json) => {
      console.log("SAVING STATUS")
      console.log(json);
      deploymentStatuses.value = [];
      for(let i = 0; i < json.data.indexingStatuses.length; i++){
        deploymentStatuses.value[i] = { deploymentStatus: json.data.indexingStatuses[i]};
        if(deploymentStatuses.value[i].deploymentStatus.health == 'failed' && deploymentStatuses.value[i].deploymentStatus.fatalError && deploymentStatuses.value[i].deploymentStatus.fatalError.deterministic == false){
          deploymentStatuses.value[i].deploymentStatus.icon = 'mdi-refresh';
          deploymentStatuses.value[i].deploymentStatus.color = 'yellow';
        }else if(deploymentStatuses.value[i].deploymentStatus.health == 'failed' && deploymentStatuses.value[i].deploymentStatus.fatalError && deploymentStatuses.value[i].deploymentStatus.fatalError.deterministic == true){
          deploymentStatuses.value[i].deploymentStatus.icon = 'mdi-close';
          deploymentStatuses.value[i].deploymentStatus.color = 'red';
        }else if(deploymentStatuses.value[i].deploymentStatus.health == 'healthy' && deploymentStatuses.value[i].deploymentStatus.synced == true){
          deploymentStatuses.value[i].deploymentStatus.icon = 'mdi-check';
          deploymentStatuses.value[i].deploymentStatus.color = 'green';
        }else if(deploymentStatuses.value[i].deploymentStatus.health == 'healthy' && deploymentStatuses.value[i].deploymentStatus.synced == false){
          deploymentStatuses.value[i].deploymentStatus.icon = 'mdi-minus';
          deploymentStatuses.value[i].deploymentStatus.color = 'blue'
        }else{
          deploymentStatuses.value[i].deploymentStatus.icon = 'mdi-help';
          deploymentStatuses.value[i].deploymentStatus.color = 'default';
        }
        deploymentStatuses.value[i].deploymentStatus.blocksBehindChainhead = deploymentStatuses.value[i]?.deploymentStatus?.chains?.[0]?.chainHeadBlock?.number && deploymentStatuses.value[i].deploymentStatus?.chains?.[0]?.latestBlock?.number ? parseInt(deploymentStatuses.value[i].deploymentStatus?.chains[0].chainHeadBlock.number) - parseInt(deploymentStatuses.value[i].deploymentStatus.chains[0].latestBlock.number) : Number.MAX_SAFE_INTEGER;

        deploymentStatuses.value[i].deployment = subgraphStore.getDataDict[deploymentStatuses.value[i].deploymentStatus.subgraph]?.deployment;
        deploymentStatuses.value[i].deploymentStatus.completion = numeral((deploymentStatuses.value[i].deploymentStatus.chains?.[0]?.latestBlock?.number - deploymentStatuses.value[i].deploymentStatus.chains?.[0]?.earliestBlock?.number) / (deploymentStatuses.value[i].deploymentStatus.chains?.[0]?.chainHeadBlock?.number - deploymentStatuses.value[i].deploymentStatus.chains?.[0]?.earliestBlock?.number)).format('0.00%') || '-%';
      }
      console.log(deploymentStatuses);
      loading.value = false;
    }).catch((error) => {
      console.error(error);
      loading.value = false;
    });
  }
</script>
