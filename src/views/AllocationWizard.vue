<template>
  <div>
    <Steppy v-model:step="currentStep" v-model:tabs="tabs">
      <template #1>
        <AllocationsDashboard selectable />
        <div class="mt-12 mb-10 ml-5">
          <v-btn
              color="primary"
              @click="currentStep++"
          >
            Continue
          </v-btn>
        </div>
      </template>
      <template #2>
        <SubgraphsDashboard selectable />
        <div class="mt-12 mb-10 ml-5">
          <v-btn
              color="primary"
              @click="currentStep++"
          >
            Continue
          </v-btn>
          <v-btn
              variant="text"
              @click="currentStep--"
          >
            Back
          </v-btn>
        </div>
      </template>
      <template #3>
        <AllocationSetter />
        <div class="mt-12 mb-10 ml-5">
          <v-btn
              color="primary"
              @click="currentStep++"
          >
            Continue
          </v-btn>
          <v-btn
              text
              @click="currentStep--"
          >
            Back
          </v-btn>
        </div>
      </template>
      <template #4>
        <div class="mt-12 mb-10 ml-5">
          <h3>Action Queue Commands <small>(>=v0.20.0)</small></h3>
          <v-textarea readonly ></v-textarea>
          <h3>Indexing Rule Commands</h3>
          <v-textarea readonly ></v-textarea>
          
          <v-btn
              text
              @click="currentStep--"
          >
            Back
          </v-btn>
        </div>
      </template>
    </Steppy>
    <v-card height="500px">
      <v-footer
          :fixed="true"
          :padless="true"
          position="fixed"
          absolute
      >
        <v-card
            flat
            tile
            width="100%"
            style=""
            class="text-center white--text d-flex flex-row align-content-center justify-center bottom-row"
        >
          <v-card>
            <v-card-text>
              Before Overall APR:
              <h1 class="pt-2">{{ numeral(0).format("0,0.00") }}%</h1>
            </v-card-text>
          </v-card>
          <v-card>
            <v-card-text>
              Closing Allocations APR:
              <h1 class="pt-2">{{ numeral(0).format("0,0.00") }}%</h1>
            </v-card-text>
          </v-card>
          <v-card>
            <v-card-text>
                Allocation Remaining:
                <h1 class="pt-2">{{ numeral(0).format('0,0') }}</h1>
            </v-card-text>
          </v-card>

          <v-card>
            <v-card-text>
              Opening Allocations APR:
              <h1 class="pt-2">{{ numeral(0).format("0,0.00") }}%</h1>
            </v-card-text>
          </v-card>

          <v-card>
            <v-card-text>
              After Overall APR:
              <h1 class="pt-2">{{ numeral(0).format("0,0.00") }}%</h1>
            </v-card-text>
          </v-card>

        </v-card>
      </v-footer>
    </v-card>
  </div>
</template>

<script setup>
import moment from "moment";
import numeral from "numeral";
import Web3 from "web3";
import { Steppy } from 'vue3-steppy';
import { ref, computed } from "vue";
import AllocationsDashboard from "./AllocationsDashboard.vue";
import SubgraphsDashboard from "./SubgraphsDashboard.vue";
import AllocationSetter from "@/components/AllocationSetter.vue";
import { useAllocationStore } from "@/store/allocations";
import { useNetworkStore } from "@/store/network";

const allocationStore = useAllocationStore();
const networkStore = useNetworkStore();

const currentStep = ref(1);

const tabs = ref([
  {
    title: 'Close Allocations',
  },
  {
    title: 'Pick Subgraphs',
  },
  {
    title: 'Set Allocations',
  },
  {
    title: 'Execute Actions',
  }
])

const avgAPR = computed(() => {
  return new BigNumber(networkStore.totalRewardsPerYear).dividedBy(this.totalAllocatedStake.plus(this.availableStake)).multipliedBy(100).dp(2);
})


</script>

<style>
.wrapper-steppy{
  padding-left: 0!important;
  padding-right: 0!important;
}
.steppy{
  margin: 0 60px;
}
.steppy-pane{
  padding: 0!important;
  background-color: #12121200!important;
}
.steppy-item-counter{
  height: 50px!important;
  width: 50px!important;
  background-color:bisque!important;
  color: black;
}
.steppy-item.current .steppy-item-counter{
  background-color:goldenrod!important;
}
.steppy-item-title{
  width: 100%;
}
.controls{
  display: none!important;
}
</style>