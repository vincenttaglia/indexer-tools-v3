<template>
  <div class="d-flex">
    <div class="d-flex">
      <v-confirm-edit v-model="newAllocationSetterStore.minAllocation">
        <template v-slot:default="{ model: proxyModel, save, cancel, isPristine, actions}">
          <v-text-field
            v-model="proxyModel.value"
            type="number"
            label="Minimum Allocation"
            class="mt-5 mx-2"
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
      <v-confirm-edit v-model="newAllocationSetterStore.minAllocation0Signal">
        <template v-slot:default="{ model: proxyModel, save, cancel, isPristine, actions}">
          <v-text-field
            v-model="proxyModel.value"
            type="number"
            label="Minimum Allocation (0 Signal)"
            class="mt-5 mx-2"
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
    </div>
    <v-btn
        class="d-inline-block mx-2 my-1 align-self-center"
        @click="newAllocationSetterStore.setAllMaxAllos()"
    >
      Set Max Allos
    </v-btn>
    <v-btn
        class="d-inline-block mx-2 my-1 align-self-center"
        @click="newAllocationSetterStore.resetAllos()"
    >
      Reset Allos
    </v-btn>
  </div>
  <v-data-table
      :headers="headers"
      :items="newAllocationSetterStore.getSelectedSubgraphs"
      item-value="deployment.ipfsHash"
      class="elevation-1"
      :custom-sort="customSort"
      :footer-props="{
        'items-per-page-options': [10, 15, 20, 25, 30, 40, 50]
      }"
      mobile-breakpoint="0"
      show-expand
      :expanded="subgraphStore.selected"
  >
    <template v-slot:item.deployment.versions[0].metadata.subgraphVersion.subgraph.metadata.image="{ item }">
      <v-badge
          :model-value="item.deployment && item.deployment.deniedAt != '0'"
          bordered
          color="error"
          icon="mdi-currency-usd-off"
          overlap
          avatar
      >
        <v-avatar size="30">
          <v-img :src="item.deployment.versions[0].metadata.subgraphVersion.subgraph.metadata?.image ? item.deployment.versions[0].metadata.subgraphVersion.subgraph.metadata.image : 'https://api.thegraph.com/ipfs/api/v0/cat?arg=QmdSeSQ3APFjLktQY3aNVu3M5QXPfE9ZRK5LqgghRgB7L9'" />
        </v-avatar>
      </v-badge>
    </template>
    <template v-slot:item.deployment.createdAt="{ item }">
      <span :timestamp="item.deployment.createdAt">{{ moment(item.deployment.createdAt + "000", "x").format("MMM D, YYYY HH:mm") }}</span>
    </template>
    <template v-slot:item.deployment.signalledTokens="{ item }">
      {{ numeral(Web3.utils.fromWei(item.deployment.signalledTokens)).format('0,0') }} GRT
    </template>
    <template v-slot:item.deployment.indexingRewardAmount="{ item }">
      {{ numeral(Web3.utils.fromWei(item.deployment.indexingRewardAmount)).format('0,0') }} GRT
    </template>
    <template v-slot:item.deployment.queryFeesAmount="{ item }">
      {{ numeral(Web3.utils.fromWei(item.deployment.queryFeesAmount)).format('0,0') }} GRT
    </template>
    <template v-slot:item.deployment.stakedTokens="{ item }">
      {{ numeral(Web3.utils.fromWei(item.deployment.stakedTokens)).format('0,0') }} GRT
    </template>
    <template v-slot:item.proportion="{ item }">
      {{ numeral(item.proportion).format('0,0.0000') }}
    </template>
    <template v-slot:item.newProportion="{ item }">
      {{ numeral(item.newProportion).format('0,0.0000') }}
    </template>
    <template v-slot:item.apr="{ item }">
      {{ numeral(item.apr).format('0,0.00') }}%
    </template>
    <template v-slot:item.newApr="{ item }">
      {{ numeral(item.newApr.toString()).format('0,0.00') }}%
    </template>
    <template v-slot:item.dailyRewards="{ item }">
      {{ numeral(Web3.utils.fromWei(Web3.utils.toBN(item.dailyRewards))).format('0,0') }} GRT
    </template>
    <template v-slot:item.dailyRewardsCut="{ item }">
      {{ numeral(Web3.utils.fromWei(Web3.utils.toBN(item.dailyRewardsCut))).format('0,0') }} GRT
    </template>
    <template v-slot:body.append>

    </template>
    <template v-slot:expanded-row="{ item }">
      <tr>
        <td :colspan="5">
            <!-- :max="parseInt(Web3.utils.fromWei(Web3.utils.toBN(calculatedAvailableStake))) + (newAllocationSizes[item.deployment.ipfsHash] ? newAllocationSizes[item.deployment.ipfsHash] : 0)" -->

          <v-slider
              min="0"
              :max="parseInt(Web3.utils.fromWei(Web3.utils.toBN(newAllocationSetterStore.calculatedAvailableStake))) + parseFloat(newAllocations[item.deployment.ipfsHash])"
              v-model="newAllocations[item.deployment.ipfsHash]"
              style="max-width: 500px; min-width:100px;"
              class="mt-4"
              step="1"
          >
            <template v-slot:prepend>
              <v-text-field
                  class="mt-0 pt-0"
                  type="number"
                  style="width: 125px"
                  v-model="newAllocations[item.deployment.ipfsHash]"
              ></v-text-field>
            </template>
          </v-slider>
        </td>
        <!-- <td>
          <v-text-field 
              class="mt-0 pt-0"
              style="width: 125px"
              v-model="customPOIs[item.deployment.ipfsHash]"
              hint="Manual POI"
          ></v-text-field>
        </td> -->
      </tr>
      
    </template>
  </v-data-table>
</template>

<script setup>
import moment from 'moment';
import Web3 from 'web3';
import numeral from 'numeral';
import { ref, watch } from 'vue';
import { useSubgraphsStore } from '@/store/subgraphs';
import { useNewAllocationSetterStore } from '@/store/newAllocationSetter';
import { storeToRefs } from 'pinia';
const subgraphStore = useSubgraphsStore();
const newAllocationSetterStore = useNewAllocationSetterStore();
newAllocationSetterStore.update();


const { newAllocations, getSelectedS, minAllocation, minAllocation0Signal, customPOIs } = storeToRefs(newAllocationSetterStore);

watch(getSelectedS, () => {
  newAllocationSetterStore.update();
})

watch(minAllocation, () =>{
  newAllocationSetterStore.setMinimums();
})

watch(minAllocation0Signal, () =>{
  newAllocationSetterStore.setMinimums0Signal();
})

const headers = ref([
        {
          title: 'Img',
          align: 'start',
          sortable: false,
          key: 'deployment.versions[0].metadata.subgraphVersion.subgraph.metadata.image',
        },
        { title: 'Name', key: 'deployment.versions[0].metadata.subgraphVersion.subgraph.metadata.displayName' },
        { title: 'Current APR', key: 'apr'},
        { title: 'New APR', key: 'newApr'},
        { title: 'Est Daily Rewards (Before Cut)', key: 'dailyRewards'},
        { title: 'Est Daily Rewards (After Cut)', key: 'dailyRewardsCut'},
        { title: 'Current Proportion', key: 'proportion'},
        { title: 'New Proportion', key: 'newProportion'},
        {
          title: 'Current Signal',
          key: 'deployment.signalledTokens',
        },
        { title: 'Created', key: 'deployment.createdAt' },
        { title: 'Current Allocations', key: 'deployment.stakedTokens'},
        { title: 'Total Query Fees', key: 'deployment.queryFeesAmount'},
        { title: 'Total Indexing Rewards', key: 'deployment.indexingRewardAmount'},
        { title: 'Deployment ID', key: 'deployment.ipfsHash', sortable: false },
      ]);

function customSort(items, index, isDesc) {
  items.sort((a, b) => {
    if (index[0] == 'deployment.createdAt'
        || index[0] == 'deployment.signalledTokens'
        || index[0] == 'deployment.stakedTokens'
        || index[0] == 'deployment.indexingRewardAmount'
        || index[0] == 'deployment.queryFeesAmount'
        || index[0] == 'proportion'
        || index[0] == 'apr'
        || index[0] == 'newApr'
        || index[0] == 'dailyRewards'
        || index[0] == 'dailyRewardsCut'
        || index[0] == 'maxAllo'
    ) {
      if (!isDesc[0]) {
        return t(a, index[0]).safeObject - t(b, index[0]).safeObject;
      } else {
        return t(b, index[0]).safeObject - t(a, index[0]).safeObject;
      }
    } else {
      if(typeof t(a, index[0]) !== 'undefined'){
        let objA = t(a, index[0]).safeObject;
        let objB = t(b, index[0]).safeObject;
        if(objA == null || objB == null)
          return objA != null && !isDesc[0];

        if (!isDesc[0]) {
          return objA.toString().toLowerCase().localeCompare(objB.toString().toLowerCase());
        } else {
          return objB.toString().toLowerCase().localeCompare(objA.toString().toLowerCase());
        }
      }
    }

  });
  return items;
}
</script>