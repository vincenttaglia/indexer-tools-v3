<template>
  <v-data-table
      :headers="headers"
      :items="allocationStore.getSelectedFilteredAllocations"
      class="elevation-1"
      :custom-sort="customSort"
      loading-text="Loading... Please wait"
      mobile-breakpoint="0"
      v-model:sort-by="tableSettingsStore.allocationSettings.sortBy"
      v-model:loading="allocationStore.loading"
      v-model:items-per-page="tableSettingsStore.allocationSettings.itemsPerPage"
      hover
      show-expand
      :expanded="allocationStore.selected"
      :sort-by="[{ key: 'status', order: 'desc' }]"
  >
    <template v-slot:item.deploymentStatus.blocksBehindChainhead="{ item }">
      <v-menu
        min-width="200px"
        rounded
      >
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            v-bind="props"
          >
            <v-badge
              v-if="item.subgraphDeployment.deniedAt"
              bordered
              color="error"
              icon="mdi-currency-usd-off"
              overlap
              avatar
            >
              <v-avatar :color="item.deploymentStatus != undefined ? item.deploymentStatus.color : ''" size="34">
                <v-avatar size="30">
                  <v-img :src="item.subgraphDeployment.versions[0].subgraph.metadata.image" />
                </v-avatar>
              </v-avatar>
            </v-badge>
            <v-avatar v-if="!item.subgraphDeployment.deniedAt" :color="item.deploymentStatus != undefined ? item.deploymentStatus.color : ''" size="34">
              <v-avatar size="30" v-if="!item.subgraphDeployment.deniedAt">
                <v-img :src="item.subgraphDeployment.versions[0].subgraph.metadata.image" />
              </v-avatar>
            </v-avatar>
          </v-btn>
        </template>
        <v-card>
          <v-card-text>
            <div class="mx-auto text-center">
              <v-avatar
                size="25"
                :color="item.deploymentStatus?.color != undefined ? item.deploymentStatus.color : 'white'"
              >
                <v-icon :icon="item.deploymentStatus?.icon != undefined ? item.deploymentStatus.icon : 'mdi-close'"></v-icon>
              </v-avatar>
              <h4 class="mt-1">{{item.deploymentStatus?.health != undefined ? item.deploymentStatus.health.toUpperCase() : "Not Deployed"}}</h4>
              <v-divider v-if="item.deploymentStatus?.health != undefined && item.deploymentStatus?.health == 'failed' && item.deploymentStatus?.fatalError" class="my-2"></v-divider>
              <div v-if="item.deploymentStatus?.health != undefined && item.deploymentStatus?.health == 'failed' && item.deploymentStatus?.fatalError">
                <p class="mt-2">
                  Deterministic: <v-icon :icon="item.deploymentStatus.fatalError.deterministic ? 'mdi-check' : 'mdi-close'"></v-icon>
                </p>
                <v-btn
                  rounded
                  variant="text"
                  @click="copyToClipboard(item.deploymentStatus?.fatalError?.block?.number)"
                >
                  Block: {{ item.deploymentStatus?.fatalError?.block?.number }}
                </v-btn>
                <br>
                <v-btn
                  rounded
                  variant="text"
                  @click="copyToClipboard(item.deploymentStatus?.fatalError?.block?.hash)"
                >
                  Hash: {{ item.deploymentStatus?.fatalError?.block?.hash.slice(0,6) }}...{{ item.deploymentStatus.fatalError.block.hash.slice(item.deploymentStatus.fatalError.block.hash.length-4,item.deploymentStatus.fatalError.block.hash.length) }}
                </v-btn>
                <br>
                <v-btn
                  rounded
                  variant="text"
                  @click="copyToClipboard(item.deploymentStatus?.fatalError?.message)"
                >
                  Copy Error
                </v-btn>
              </div>
              
              <v-divider class="my-2"></v-divider>
              <p class="text-caption mt-2">
                First block: {{ item.deploymentStatus?.chains?.[0]?.earliestBlock?.number != undefined ? item.deploymentStatus.chains[0].earliestBlock.number : '-' }}
              </p>
              <p class="text-caption">
                Last block: {{ item.deploymentStatus?.chains?.[0]?.latestBlock?.number != undefined ? item.deploymentStatus.chains[0].latestBlock.number: '-' }}
              </p>
              <p class="text-caption mb-1">
                Chainhead: {{ item.deploymentStatus?.chains?.[0]?.chainHeadBlock?.number != undefined ? item.deploymentStatus.chains[0].chainHeadBlock.number: '-' }}
              </p>
              {{ item.deploymentStatus?.chains?.[0]?.earliestBlock?.number != undefined && item.deploymentStatus?.chains?.[0]?.latestBlock?.number != undefined && item.deploymentStatus?.chains[0]?.chainHeadBlock?.number != undefined ? numeral((item.deploymentStatus.chains[0].latestBlock.number - item.deploymentStatus.chains[0].earliestBlock.number) / (item.deploymentStatus.chains[0].chainHeadBlock.number - item.deploymentStatus.chains[0].earliestBlock.number)).format('0.00%') : '-%' }}
              <v-progress-linear class="mt-1" :model-value="item.deploymentStatus?.chains?.[0]?.earliestBlock?.number != undefined && item.deploymentStatus?.chains?.[0]?.latestBlock?.number != undefined && item.deploymentStatus?.chains[0]?.chainHeadBlock?.number != undefined ? (item.deploymentStatus.chains[0].latestBlock.number - item.deploymentStatus.chains[0].earliestBlock.number) / (item.deploymentStatus.chains[0].chainHeadBlock.number - item.deploymentStatus.chains[0].earliestBlock.number)*100 : 0"></v-progress-linear>
            </div>
          </v-card-text>
        </v-card>
      </v-menu>
    </template>
    <template v-slot:item.id="{ item }" style="width:100;max-width:100px;min-width:100px;overflow-x: scroll;">
      <p style="width:100;max-width:100px;min-width:100px;overflow-x: scroll;">{{ item.id }}</p>
    </template>
    <template v-slot:item.allocatedTokens="{ item }">
      {{ numeral(Web3.utils.fromWei(item.allocatedTokens.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.createdAt="{ item }">
      <span :timestamp="item.createdAt">
        <v-tooltip theme="dark" location="top">
          <template v-slot:activator="{ props }">
            <span
              v-bind="props"
            >
            Epoch {{ item.createdAtEpoch }}
            </span>
          </template>
          <span>{{ moment(item.createdAt + "000", "x").format("MMM D, YYYY HH:mm") }}</span>
        </v-tooltip>
      </span>
    </template>
    <template v-slot:item.activeDuration="{ item }">
      <span :timestamp="item.activeDuration">
        <v-tooltip theme="dark" location="top">
          <template v-slot:activator="{ props }">
            <span
              v-bind="props"
            >
            {{ item.epochDuration }} epochs
            </span>
          </template>
          <span>{{ item.readableDuration }}</span>
        </v-tooltip>
      </span>
    </template>
    <template v-slot:item.subgraphDeployment.signalledTokens="{ item }">
      {{ numeral(Web3.utils.fromWei(item.subgraphDeployment.signalledTokens.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.subgraphDeployment.indexingRewardAmount="{ item }">
      {{ numeral(Web3.utils.fromWei(item.subgraphDeployment.indexingRewardAmount.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.subgraphDeployment.queryFeesAmount="{ item }">
      {{ numeral(Web3.utils.fromWei(item.subgraphDeployment.queryFeesAmount.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.subgraphDeployment.stakedTokens="{ item }">
      {{ numeral(Web3.utils.fromWei(item.subgraphDeployment.stakedTokens.toString())).format('0,0') }} GRT
    </template>
    <template v-slot:item.proportion="{ item }">
      {{ numeral(item.proportion).format('0,0.0000') }}
    </template>
    <template v-slot:item.apr="{ item }">
      {{ numeral(item.apr).format('0,0.00') }}%
    </template>
    <template v-slot:item.dailyRewards="{ item }">
      {{ numeral(Web3.utils.fromWei(Web3.utils.toBN(item.dailyRewards))).format('0,0') }} GRT
    </template>
    <template v-slot:item.dailyRewardsCut="{ item }">
      {{ numeral(Web3.utils.fromWei(Web3.utils.toBN(item.dailyRewardsCut))).format('0,0') }} GRT
    </template>
    <template v-slot:item.pendingRewards.value="{ item }">
      <span
        v-if="!item.pendingRewards.loading && !item.pendingRewards.loaded"
        >
        <v-icon left @click="allocationStore.fetchPendingRewards(item.id);">
          mdi-download
        </v-icon>
      </span>
      <v-progress-circular
          indeterminate
          color="purple"
          v-if="item.pendingRewards.loading && !item.pendingRewards.loaded"
      ></v-progress-circular>
      <div 
       v-if="!item.pendingRewards.loading && item.pendingRewards.loaded"
       class="d-flex"
      >
        <span>
        {{ numeral(Web3.utils.fromWei(Web3.utils.toBN(item.pendingRewards.value))).format('0,0') }} GRT
      </span>
      <v-tooltip
          location="top"
          v-if="item.subgraphDeployment.deniedAt"
        >
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" size="12" class="mb-2 mr-3">
              mdi-information
            </v-icon>
          </template>
          <span>Rewards Denied for Subgraph</span>
        </v-tooltip>
      </div>
      
    </template>
    <template v-slot:item.pendingRewardsCut="{ item }">
      <span
        v-if="!item.pendingRewards.loading && !item.pendingRewards.loaded"
        >
        <v-icon left @click="allocationStore.fetchAllPendingRewards();">
          mdi-download-multiple
        </v-icon>
      </span>
      <v-progress-circular
          indeterminate
          color="purple"
          v-if="item.pendingRewards.loading && !item.pendingRewards.loaded"
      ></v-progress-circular>
      <div 
       v-if="!item.pendingRewards.loading && item.pendingRewards.loaded"
       class="d-flex"
      >
        <span>
          {{ numeral(Web3.utils.fromWei(Web3.utils.toBN(item.pendingRewardsCut))).format('0,0') }} GRT
      </span>
      <v-tooltip
          location="top"
          v-if="item.subgraphDeployment.deniedAt"
        >
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" size="12" class="mb-2 mr-3">
              mdi-information
            </v-icon>
          </template>
          <span>Rewards Denied for Subgraph</span>
        </v-tooltip>
      </div>
    </template>
    <template v-slot:expanded-row="{ item }">
      <tr>
        <td></td>
        <td>
          <v-text-field 
              class="mt-4 pt-0"
              style="width: 250px"
              v-model="customPOIs[item.subgraphDeployment.ipfsHash]"
              hint="Manual POI"
          ></v-text-field>
        </td>
      </tr>
      
    </template>
  </v-data-table>
</template>

<script setup>
import { ref, watch } from "vue";
import moment from "moment";
import numeral from "numeral";
import Web3 from "web3";
import { useAllocationStore } from "@/store/allocations";
import { useAccountStore } from "@/store/accounts";
import { storeToRefs } from "pinia";
import { useSubgraphSettingStore } from "@/store/subgraphSettings";
import { useChainStore } from "@/store/chains";
import { useTableSettingStore } from "@/store/tableSettings";
import { useNewAllocationSetterStore } from "@/store/newAllocationSetter";

const allocationStore = useAllocationStore();
const accountStore = useAccountStore();
const subgraphSettingsStore = useSubgraphSettingStore();
const tableSettingsStore = useTableSettingStore();
const newAllocationSetterStore = useNewAllocationSetterStore();
const chainStore = useChainStore();
const { getActiveAccount } = storeToRefs(accountStore);

const { selected, loaded } = storeToRefs(allocationStore);

const { customPOIs } = storeToRefs(newAllocationSetterStore);

defineProps({
  selectable: {
    type: Boolean,
    default: false,
  },
})

function copyToClipboard (copy) {
  navigator.clipboard.writeText(copy)
}

const headers = ref([
    {
      title: 'Status',
      align: 'start',
      key: 'deploymentStatus.blocksBehindChainhead',
    },
    { title: 'Name', key: 'subgraphDeployment.versions[0].subgraph.metadata.displayName' },
    { title: 'Allocated', key: 'allocatedTokens'},
    { title: 'Created', key: 'createdAt' },
    { title: 'Current Signal', key: 'subgraphDeployment.signalledTokens'},
    { title: 'Current Allocations', key: 'subgraphDeployment.stakedTokens'},
    { title: 'Total Query Fees', key: 'subgraphDeployment.queryFeesAmount'},
    { title: 'Total Indexing Rewards', key: 'subgraphDeployment.indexingRewardAmount'},
    { title: 'Deployment ID', key: 'subgraphDeployment.ipfsHash', sortable: false },
    { title: 'Allocation ID', key: 'id', sortable: false, width: "100px" },
  ]);
</script>