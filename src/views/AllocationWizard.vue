<template>
  <div>
    <v-stepper
      alt-labels
      editable
      :items="['Close Allocations', 'Pick Subgraphs', 'Set Allocations', 'Execute Allocations']"
    >
      <template v-slot:item.1>
        <AllocationsDashboard selectable />
      </template>

      <template v-slot:item.2>
        <SubgraphsDashboard selectable />
      </template>

      <template v-slot:item.3>
        <AllocationSetter />
      </template>
      <template v-slot:item.4>
        <div
          class="mb-15 mx-5"
          v-if="accountStore.getAgentConnectStatus"
        >
          <ActionQueueManager></ActionQueueManager>
        </div>
        <div class="mt-12 mb-10 ml-5">
          <h3>Action Queue Commands <small>(>=v0.20.0)</small></h3>
          <v-textarea readonly :value="newAllocationSetterStore.actionsQueueBuildCommands" rows="10" ></v-textarea>
          <h3>Indexing Rule Commands</h3>
          <v-textarea readonly :value="newAllocationSetterStore.buildCommands" rows="10" ></v-textarea>
        </div>
      </template>
    </v-stepper>
    <v-footer
        :fixed="true"
        :padless="true"
        position="fixed"
        app="true"
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
            <h1 class="pt-2">{{ numeral(allocationStore.avgAPR).format("0,0.00%") }}</h1>
          </v-card-text>
        </v-card>
        <v-card>
          <v-card-text>
            Closing Allocations APR:
            <h1 class="pt-2">{{ numeral(allocationStore.closingAvgAPR).format("0,0.00%") }}</h1>
          </v-card-text>
        </v-card>
        <v-card>
          <v-card-text>
              Allocation Remaining:
              <h1 class="pt-2">{{ numeral(Web3.utils.fromWei(Web3.utils.toBN(newAllocationSetterStore.calculatedAvailableStake))).format('0,0') }}</h1>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-text>
            Opening Allocations APR:
            <h1 class="pt-2">{{ numeral(newAllocationSetterStore.calculatedOpeningAPR).format("0,0.00%") }}</h1>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-text>
            After Overall APR:
            <h1 class="pt-2">{{ numeral(newAllocationSetterStore.calculatedAfterOpeningAPR).format("0,0.00%") }}</h1>
          </v-card-text>
        </v-card>

      </v-card>
    </v-footer>
  </div>
</template>

<script setup>
import numeral from "numeral";
import Web3 from "web3";
import AllocationsDashboard from "./AllocationsDashboard.vue";
import SubgraphsDashboard from "./SubgraphsDashboard.vue";
import AllocationSetter from "@/components/AllocationSetter.vue";
import ActionQueueManager from "./ActionQueueManager.vue";
import { useAllocationStore } from "@/store/allocations";
import { useNewAllocationSetterStore } from "@/store/newAllocationSetter";
import { VStepper } from 'vuetify/components/VStepper'
import { useAccountStore } from "@/store/accounts";

const accountStore = useAccountStore();
const allocationStore = useAllocationStore();
const newAllocationSetterStore = useNewAllocationSetterStore();

</script>

<style>
.controls{
  display: none!important;
}
.v-stepper-window{
  margin: 0!important;
}
</style>