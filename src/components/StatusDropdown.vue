<template>
  <v-snackbar
    v-model="snackbar"
    variant="flat"
    location="top"
    style="margin-top:100px"
  >
    {{ text }}

    <template v-slot:actions>
      <v-btn
        variant="text"
        @click="snackbar = false"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
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
            :model-value="badge"
            bordered
            :color="badgeColor"
            :icon="badgeIcon"
            overlap
            avatar
        >
          <v-avatar :color="ringColor" size="34">
            <v-avatar size="30">
              <v-img :src="metadata?.image ? metadata.image : 'https://api.thegraph.com/ipfs/api/v0/cat?arg=QmdSeSQ3APFjLktQY3aNVu3M5QXPfE9ZRK5LqgghRgB7L9'" />
            </v-avatar>
          </v-avatar>
        </v-badge>
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <div class="mx-auto text-center">
          <v-avatar
            size="25"
            :color="dropdownStatusColor"
          >
            <v-icon :icon="icon"></v-icon>
          </v-avatar>
          <h4 class="mt-1">{{health}}</h4>
          <div v-if="accountStore.getAgentConnectStatus">
            <v-dialog width="500">
              <template v-slot:activator="{ props }">
                <v-icon
                  size="small"
                  class="me-2"
                  v-bind="props"
                >
                  mdi-sync
                </v-icon>
              </template>

              <template v-slot:default="{ isActive }">
                <v-card title="Offchain Sync Subgraph">
                  <v-card-text>
                    Add {{ metadata.displayName }} ({{ subgraph.ipfsHash }}) to list of offchain sync subgraphs?
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                      text="Cancel"
                      @click="isActive.value = false"
                    ></v-btn>
                    <v-btn
                      text="Start syncing"
                      @click="offchainSync(subgraph.ipfsHash); isActive.value = false"
                    ></v-btn>
                  </v-card-actions>
                </v-card>
              </template>
            </v-dialog>
            <v-dialog width="500">
              <template v-slot:activator="{ props }">
                <v-icon
                  size="small"
                  v-bind="props"
                >
                  mdi-sync-off
                </v-icon>
              </template>

              <template v-slot:default="{ isActive }">
                <v-card title="Remove Offchain Subgraph">
                  <v-card-text>
                    Remove {{ metadata.displayName }} ({{  subgraph.ipfsHash }}) from list of offchain sync subgraphs?
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                      text="Cancel"
                      @click="isActive.value = false"
                    ></v-btn>
                    <v-btn
                      text="Stop syncing"
                      @click="removeOffchainSync(subgraph.ipfsHash); isActive.value = false"

                    ></v-btn>
                  </v-card-actions>
                </v-card>
              </template>
            </v-dialog>
          </div>
          <v-divider v-if="hasFatalError" class="my-2"></v-divider>
          <div v-if="hasFatalError">
            <p class="mt-2">
              Deterministic: <v-icon :icon="item.deploymentStatus.fatalError.deterministic ? 'mdi-check' : 'mdi-close'"></v-icon>
            </p>
            <v-btn
              rounded
              variant="text"
              @click="copyToClipboard(errorBlockNumber)"
            >
              Block: {{ errorBlockNumber }}
            </v-btn>
            <br>
            <v-btn
              rounded
              variant="text"
              @click="copyToClipboard(errorBlockHash)"
            >
              Hash: {{ errorBlockHash.slice(0,6) }}...{{ errorBlockHash.slice(errorBlockHash.length-4,errorBlockHash.length) }}
            </v-btn>
            <br>
            <v-btn
              rounded
              variant="text"
              @click="copyToClipboard(errorMsg)"
            >
              Copy Error
            </v-btn>
          </div>
          
          <v-divider class="my-2"></v-divider>
          <p class="text-caption mt-2">
            First block: {{ firstBlock }}
          </p>
          <p class="text-caption">
            Last block: {{ lastBlock }}
          </p>
          <p class="text-caption mb-1">
            Chainhead: {{ chainHead }}
          </p>
          {{ completion }}
          <v-progress-linear class="mt-1" :model-value="completionValue"></v-progress-linear>
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
  <v-dialog
      v-model="copyDialog"
      width="auto"
    >
      <v-card
        max-width="400"
        prepend-icon="mdi-clipboard"
        text="Copying to clipboard not supported with HTTP. Please copy from below:"
        title="Copy Error"
      >
        <v-textarea v-model="copyText" readonly="true" autofocus="true" @focus="$event.target.select()"></v-textarea>
        <template v-slot:actions>
          <v-btn
            class="ms-auto"
            text="Close"
            @click="copyDialog = false"
          ></v-btn>
        </template>
      </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed, toRefs } from 'vue';
import { useAccountStore } from '@/store/accounts';
import { useChainStore } from '@/store/chains';
import numeral from 'numeral';
import gql from 'graphql-tag';
const accountStore = useAccountStore();
const chainStore = useChainStore();

const snackbar = ref(false);
const text = ref("");
const props = defineProps(['item', 'subgraph', 'metadata']);
const { item } = toRefs(props);

const subgraph = computed(() => props.subgraph || item.value.deployment);
const metadata = computed(() => props.metadata || item.value.deployment?.versions[0].metadata.subgraphVersion.subgraph.metadata);
const isDenied = computed(() => subgraph.value?.deniedAt != '0');
const isAllocated = ref(item.value.currentlyAllocated);

const badge = ref(false);
const badgeIcon = ref("");
const badgeColor = ref("");
const copyDialog = ref(false);
const copyText = ref("");

if(isAllocated.value && item.value.deployment){
  badgeIcon.value = "mdi-exclamation-thick";
  badgeColor.value = "warning";
  badge.value = true;
} else if(isDenied.value){
  badgeIcon.value = "mdi-currency-usd-off";
  badgeColor.value = "error";
  badge.value = true;
}

const hasFatalError = computed(() => item.value.deploymentStatus?.health == 'failed' && item.value.deploymentStatus?.fatalError);
const ringColor = computed(() => item.value.deploymentStatus?.color || '');
const dropdownStatusColor = computed(() => ringColor.value || 'white');
const icon = computed(() => item.value.deploymentStatus?.icon || 'mdi-close');
const health = computed(() => item.value.deploymentStatus?.health?.toUpperCase() || "Not Deployed");

const firstBlock = computed(() => item.value.deploymentStatus?.chains?.[0]?.earliestBlock?.number || '-');
const lastBlock = computed(() => item.value.deploymentStatus?.chains?.[0]?.latestBlock?.number || '-');
const chainHead = computed(() => item.value.deploymentStatus?.chains?.[0]?.chainHeadBlock?.number || '-');

const completion = computed(() => numeral((item.value.deploymentStatus?.chains?.[0]?.latestBlock?.number - item.value.deploymentStatus?.chains?.[0]?.earliestBlock?.number) / (item.value.deploymentStatus?.chains?.[0]?.chainHeadBlock?.number - item.value.deploymentStatus?.chains?.[0]?.earliestBlock?.number)).format('0.00%') || '-%');
const completionValue = computed(() => (item.value.deploymentStatus?.chains?.[0]?.latestBlock?.number - item.value.deploymentStatus?.chains?.[0]?.earliestBlock?.number) / (item.value.deploymentStatus?.chains?.[0]?.chainHeadBlock?.number - item.value.deploymentStatus?.chains?.[0]?.earliestBlock?.number)*100 || 0);

const errorBlockNumber = computed(() => item.value.deploymentStatus?.fatalError?.block?.number);
const errorBlockHash = computed(() => item.value.deploymentStatus?.fatalError?.block?.hash);
const errorMsg = computed(() => item.value.deploymentStatus?.fatalError?.message);

function offchainSync(ipfsHash){
  let indexingRuleInput = {
    identifier: ipfsHash,
    identifierType: 'deployment',
    decisionBasis: 'offchain',
    protocolNetwork: chainStore.getActiveChain.id,
  }
  accountStore.getAgentConnectClient.mutate({
    mutation: gql`mutation setIndexingRule($rule: IndexingRuleInput!){
      setIndexingRule(rule: $rule) {
        identifier
        decisionBasis
      }
    }`,
    variables: { rule: indexingRuleInput }
  }).then((data) => {
    console.log("AGENT CONNECT DATA");
    console.log(data);
    if(!data.data.errors){
      text.value = `${data.data.setIndexingRule.identifier.slice(0,7)}... added to offchain sync list`;
      snackbar.value = true;
    }else{
      text.value = 'Indexer Agent error. Check console for details.'
      snackbar.value = true;
    }
  });
}

function removeOffchainSync(ipfsHash){
  let indexingRuleIdentifier = {
    identifier: ipfsHash,
    protocolNetwork: chainStore.getActiveChain.id,
  }
  accountStore.getAgentConnectClient.mutate({
    mutation: gql`mutation deleteIndexingRule($identifier: IndexingRuleIdentifier!){
      deleteIndexingRule(identifier: $identifier) {
        identifier
      }
    }`,
    variables: { identifier: indexingRuleIdentifier }
  }).then((data) => {
    console.log("AGENT CONNECT DATA");
    console.log(data);
    if(!data.data.errors){
      text.value = `Subgraph removed from offchain sync list`;
      snackbar.value = true;
    }else{
      text.value = 'Indexer Agent error. Check console for details.'
      snackbar.value = true;
    }
  });
}

function copyToClipboard (copy) {
  if(window.location.protocol == "https:"){
    navigator.clipboard.writeText(copy);
  }else{
    copyText.value = copy;
    copyDialog.value = true;
  }
  
}
</script>