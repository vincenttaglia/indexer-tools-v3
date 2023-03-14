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
    <template v-slot:top>
      <tr>
        <td  class="mx-4">
          <v-text-field
              v-model="subgraphSettingStore.search"
              label="Search"
              class="mx-4"
          ></v-text-field>
        </td>
        <td class="mx-4">
          <v-text-field
              v-model="subgraphSettingStore.minSignal"
              type="number"
              label="Min Signal"
              class="mx-4"
          ></v-text-field>
        </td>
        <td>
          <v-text-field
              v-model="subgraphSettingStore.maxSignal"
              type="number"
              label="Max Signal"
              class="mx-4"
          ></v-text-field>
        </td>
        <td>
          <v-text-field
              v-model="subgraphSettingStore.newAllocation"
              type="number"
              label="New Allocation"
              @change="updateEstApr"
              class="mx-4"
          ></v-text-field>
        </td>
        <td>
          <v-text-field
              v-model="subgraphSettingStore.targetApr"
              type="number"
              label="Target APR"
              @change="updateTargetApr"
              class="mx-4"
          ></v-text-field>
        </td>
        <td>
          <v-select
              v-model="subgraphSettingStore.noRewardsFilter"
              :items="[{text: 'Exclude Denied', action: 0}, {text:'Include Denied', action: 1}, {text: 'Only Denied', action: 2}]"
              item-text="text"
              item-value="action"
              label="Subgraphs w/ Denied Rewards"
              style="width: 200px;"
              class="mx-4"
          ></v-select>
        </td>
        <td>
          <v-select
              v-if="false"
              v-model="subgraphSettingStore.networkFilter"
              :items="networks"
              label="Subgraph Networks"
              multiple
              chips
              class="mx-4"
              style="top: -5px"
          ></v-select>
        </td>
        <td>
          <v-checkbox
            v-model="subgraphSettingStore.activateBlacklist"
            label="Blacklist"
            class="mr-3"
          ></v-checkbox>
        </td>
        <td>
          <v-checkbox
            v-model="subgraphSettingStore.activateSynclist"
            label="Synclist"
          ></v-checkbox>
        </td>
        <td colspan="4"></td>
      </tr>
    </template>
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
    <template v-slot:item.newApr="{ item }">
        {{ numeral(item.raw.newApr).format('0,0.00') }}%
      </template>
    <template v-slot:item.maxAllo="{ item }">
      {{ numeral(item.raw.maxAllo).format('0,0') }} GRT
    </template>
    <template v-slot:item.dailyRewards="{ item }">
      {{ numeral(web3.utils.fromWei(web3.utils.toBN(item.raw.dailyRewards))).format('0,0') }} GRT
    </template>
    <template v-slot:item.dailyRewardsCut="{ item }">
      {{ numeral(web3.utils.fromWei(web3.utils.toBN(item.raw.dailyRewardsCut))).format('0,0') }} GRT
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
  import { useSubgraphSettingStore } from '@/store/subgraphSettings';
  import numeral from 'numeral';
  import web3 from 'web3';
  import moment from 'moment';

  const subgraphStore = useSubgraphsStore();
  const subgraphSettingStore = useSubgraphSettingStore();
  subgraphStore.fetchData();

  const headers = ref([
    { title: 'Img', key: 'image' },
    { title: 'Name', key: 'displayName' },
    { title: 'Network', key: 'currentVersion.subgraphDeployment.network.id'},
    { title: 'Created', key: 'currentVersion.subgraphDeployment.createdAt' },
    { title: 'Current APR', key: 'apr'},
    { title: 'New APR', key: 'newApr'},
    //{ title: 'Max Allocation', key: 'max_allo'},
    { title: 'Est Daily Rewards (Before Cut)', key: 'dailyRewards'},
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
