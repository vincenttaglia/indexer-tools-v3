<template>
  <div>
      <div v-for="indexerAccount in accountStore.accounts" :key="indexerAccount.address" class="indexer-edit">
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
          <v-icon @click="removeAccount(indexerAccount.address)" v-if="indexerAccount.address != '0xeddd4ec5d3775de964416b7b9d4da885f530f90a'">mdi-delete</v-icon>
          <span v-if="indexerAccount.address == '0xeddd4ec5d3775de964416b7b9d4da885f530f90a'">(Active)</span>
      </div>
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