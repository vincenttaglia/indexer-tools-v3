<template>
  <div>
      <v-sheet v-for="indexerAccount in accountStore.accounts" :key="indexerAccount.address" class="indexer-edit px-2 py-3 mt-4" border>
          <v-text-field
              v-model="indexerAccount.name"
              label="Indexer Name"
          ></v-text-field>
          <v-text-field
              v-model="indexerAccount.address"
              label="Indexer Address"
          ></v-text-field>
          <v-select
            v-model="indexerAccount.chain"
            label="Chain"
            class="ml-5 mr-2"
            :items="chainStore.getChains.map(chain => chain.id)"
          ></v-select>
          <v-divider class="mb-4"></v-divider>
          <v-icon @click="accountStore.removeAccount(indexerAccount.address)">mdi-delete</v-icon>
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