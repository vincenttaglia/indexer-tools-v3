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
        <v-img :src="item.raw.image" />
      </v-avatar>
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.createdAt="{ item }">
      <span :timestamp="item.raw.currentVersion.subgraphDeployment.createdAt">{{ moment(item.raw.currentVersion.subgraphDeployment.createdAt + "000", "x").format("MMM D, YYYY HH:mm") }}</span>
    </template>
    <template v-slot:item.proportion="{ item }">
      {{ numeral(item.raw.proportion*100).format('0,0.000') }}%
    </template>
    <template v-slot:item.apr="{ item }">
      {{ numeral(item.raw.apr).format('0,0.00') }}%
    </template>
    <template v-slot:item.currentSignalledTokens="{ item }">
      {{ numeral(web3.utils.fromWei(item.raw.currentSignalledTokens.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.indexingRewardAmount="{ item }">
      {{ numeral(web3.utils.fromWei(item.raw.currentVersion.subgraphDeployment.indexingRewardAmount.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.queryFeesAmount="{ item }">
      {{ numeral(web3.utils.fromWei(item.raw.currentVersion.subgraphDeployment.queryFeesAmount.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.stakedTokens="{ item }">
      {{ numeral(web3.utils.fromWei(item.raw.currentVersion.subgraphDeployment.stakedTokens.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.currentVersion.subgraphDeployment.network.id="{ item }">
      {{ item.raw.currentVersion.subgraphDeployment.network ? item.raw.currentVersion.subgraphDeployment.network.id : "null" }}
    </template> 
  </v-data-table>
</template>

<script setup>
  import { ref } from 'vue';
  import { useSubgraphsStore } from '@/store/subgraphs';
  import numeral from 'numeral';
  import web3 from 'web3';
  import moment from 'moment';

  const subgraphStore = useSubgraphsStore();
  subgraphStore.fetchData();

  const headers = ref([
    { title: 'Img', key: 'image' },
    { title: 'Name', key: 'displayName' },
    { title: 'Network', key: 'currentVersion.subgraphDeployment.network.id'},
    { title: 'Created', key: 'currentVersion.subgraphDeployment.createdAt' },
    { title: 'Current APR', key: 'apr'},
    //{ title: 'New APR', key: 'newapr'},
    //{ title: 'Max Allocation', key: 'max_allo'},
    //{ title: 'Est Daily Rewards (Before Cut)', key: 'dailyrewards'},
    //{ title: 'Est Daily Rewards (After Cut)', key: 'dailyrewards_cut'},
    {
      title: 'Current Signal',
      key: 'currentSignalledTokens',
      /*filter: key => {
        let BigNumber = this.$store.state.bigNumber;
        if(parseInt(this.max_signal) && BigNumber(key).isGreaterThan(new BigNumber(this.$store.state.web3.utils.toWei(this.max_signal))))
          return false;
        if(parseInt(this.min_signal) && BigNumber(key).isLessThan(new BigNumber(this.$store.state.web3.utils.toWei(this.min_signal))))
          return false;
        return true;
      },*/
    },
    { title: 'Current Proportion', key: 'proportion'},
    { title: 'Current Allocations', key: 'currentVersion.subgraphDeployment.stakedTokens'},
    { title: 'Total Query Fees', key: 'currentVersion.subgraphDeployment.queryFeesAmount'},
    { title: 'Total Indexing Rewards', key: 'currentVersion.subgraphDeployment.indexingRewardAmount'},
    { title: 'Deployment ID', key: 'currentVersion.subgraphDeployment.ipfsHash', sortable: false },
  ]);


</script>
