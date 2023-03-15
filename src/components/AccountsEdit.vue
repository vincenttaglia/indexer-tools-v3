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
          <v-icon @click="removeAccount(indexerAccount.address)" v-if="indexerAccount.address != '0xeddd4ec5d3775de964416b7b9d4da885f530f90a'">mdi-delete</v-icon>
          <span v-if="indexerAccount.address == '0xeddd4ec5d3775de964416b7b9d4da885f530f90a'">(Active)</span>
      </div>
  </div>
</template>
<script setup>
  import { useAccountStore } from '@/store/accounts';
  const accountStore = useAccountStore();
</script>
  
<style scoped>

</style>