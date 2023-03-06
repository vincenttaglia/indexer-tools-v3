<template>
  <v-data-table
    :headers="headers"
    :items="subgraphStore.getSubgraphs"
    item-key="currentVersion.subgraphDeployment.ipfsHash"
    class="elevation-1"
    :footer-props="{
      'items-per-page-options': [10, 15, 20, 25, 30, 40, 50]
    }"
    loading-text="Loading... Please wait"
    mobile-breakpoint="0"
  >
  <template v-slot:item.image="{ item }">
    <v-avatar size="30">
      <v-img :src="item.image" />
    </v-avatar>
  </template>
  <template v-slot:item.currentVersion.subgraphDeployment.createdAt="{ item }">
    <span :timestamp="item.currentVersion.subgraphDeployment.createdAt">{{ item.currentVersion.subgraphDeployment.createdAt | moment("MMM D, YYYY HH:mm") }}</span>
  </template>
  <template v-slot:item.currentSignalledTokens="{ item }">
    {{ numeral(item.currentSignalledTokens.toString()).format('0,0') }} GRT
  </template>
  <template v-slot:item.currentVersion.subgraphDeployment.indexingRewardAmount="{ item }">
    {{ numeral(item.currentVersion.subgraphDeployment.indexingRewardAmount.toString()).format('0,0') }} GRT
  </template>
  <template v-slot:item.currentVersion.subgraphDeployment.queryFeesAmount="{ item }">
    {{ numeral(item.currentVersion.subgraphDeployment.queryFeesAmount.toString()).format('0,0') }} GRT
  </template>
  <template v-slot:item.currentVersion.subgraphDeployment.stakedTokens="{ item }">
    {{ numeral(item.currentVersion.subgraphDeployment.stakedTokens.toString()).format('0,0') }} GRT
  </template>
  <template v-slot:item.currentVersion.subgraphDeployment.network.id="{ item }">
    {{ item.currentVersion.subgraphDeployment.network ? item.currentVersion.subgraphDeployment.network.id : "null" }}
  </template>
  <template v-slot:item.proportion="{ item }">
    {{ numeral(item.proportion*100).format('0,0.000') }}%
  </template>
  <template v-slot:body.append>

  </template>
  </v-data-table>
</template>

<script setup>
  import { ref } from 'vue';
  import { useSubgraphsStore } from '@/store/subgraphs';
  import numeral from 'numeral';

  const subgraphStore = useSubgraphsStore();
  subgraphStore.fetchData();

  const headers = ref([
    { text: 'Name', value: 'displayName' },
    { text: 'Network', value: 'currentVersion.subgraphDeployment.network.id'},
    { text: 'Created', value: 'currentVersion.subgraphDeployment.createdAt' },
    //{ text: 'Current APR', value: 'apr'},
    //{ text: 'New APR', value: 'newapr'},
    //{ text: 'Max Allocation', value: 'max_allo'},
    //{ text: 'Est Daily Rewards (Before Cut)', value: 'dailyrewards'},
    //{ text: 'Est Daily Rewards (After Cut)', value: 'dailyrewards_cut'},
    {
      text: 'Current Signal',
      value: 'currentSignalledTokens',
      filter: value => {
        let BigNumber = this.$store.state.bigNumber;
        if(parseInt(this.max_signal) && BigNumber(value).isGreaterThan(new BigNumber(this.$store.state.web3.utils.toWei(this.max_signal))))
          return false;
        if(parseInt(this.min_signal) && BigNumber(value).isLessThan(new BigNumber(this.$store.state.web3.utils.toWei(this.min_signal))))
          return false;
        return true;
      },
    },
    { text: 'Current Proportion', value: 'proportion'},
    { text: 'Current Allocations', value: 'currentVersion.subgraphDeployment.stakedTokens'},
    { text: 'Total Query Fees', value: 'currentVersion.subgraphDeployment.queryFeesAmount'},
    { text: 'Total Indexing Rewards', value: 'currentVersion.subgraphDeployment.indexingRewardAmount'},
    { text: 'Deployment ID', value: 'currentVersion.subgraphDeployment.ipfsHash', sortable: false },
  ]);


</script>
