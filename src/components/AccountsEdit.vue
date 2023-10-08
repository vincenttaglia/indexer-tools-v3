<template>
  <div>
      <v-sheet v-for="indexerAccount in accountStore.accounts" :key="indexerAccount.address" class="indexer-edit px-2 py-3 mt-4" border>
          <v-text-field
              v-model="indexerAccount.name"
              label="Indexer Name"
              class="mx-3 my-3"
          ></v-text-field>
          <v-text-field
              v-model="indexerAccount.address"
              label="Indexer Address"
              class="mx-3 my-3"
          ></v-text-field>
          <v-select
            v-model="indexerAccount.chain"
            label="Chain"
            :items="chainStore.getChains.map(chain => chain.id)"
            class="mx-3 my-3"
          ></v-select>
          <v-checkbox
              v-model="indexerAccount.agentConnect"
              label="Enable Agent Connect"
              class="mx-3 my-3"
          >
          </v-checkbox>
          <Transition>
            <v-text-field
                v-if="indexerAccount.agentConnect"
                v-model="indexerAccount.agentEndpoint"
                label="Indexer Agent Endpoint"
                class="mx-3 my-3"
            ></v-text-field>
          </Transition>
          <v-divider class="mb-4"></v-divider>
          <v-icon @click="accountStore.removeAccount(indexerAccount.address)" class="mx-4 mb-1">mdi-delete</v-icon>
      </v-sheet>
  </div>
</template>
<script setup>
  import { useAccountStore } from '@/store/accounts';
  import { useChainStore } from '@/store/chains';
  const accountStore = useAccountStore();
  const chainStore = useChainStore();
</script>
  
<style scoped>

</style>