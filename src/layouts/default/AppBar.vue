<template>
  <v-app-bar flat>
    <v-app-bar-title>
      <v-icon icon="mdi-circle-slice-6" />

      Indexer Tools v3
    </v-app-bar-title>
    <accounts-dropdown></accounts-dropdown>
  </v-app-bar>
</template>

<script setup>
  import AccountsDropdown from '@/components/AccountsDropdown.vue';
</script>
