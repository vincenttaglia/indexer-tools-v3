<template>
  <v-app-bar flat>
    <v-app-bar-title>
      <v-icon icon="mdi-circle-slice-6" />

      Indexer Tools v3
    </v-app-bar-title>
    <v-btn
        variant="text"
        to="/"
        class="ml-5 mr-2"
        exact
    >
      Subgraphs Dashboard
    </v-btn>
    <v-btn
        variant="text"
        to="/allocations"
        class="ml-2 mr-2"
    >
      Allocations Dashboard
    </v-btn>
    <v-btn
        variant="text"
        to="/wizard"
        class="ml-2 mr-2"
    >
      Allocation Wizard
    </v-btn>
    <accounts-dropdown></accounts-dropdown>
  </v-app-bar>
</template>

<script setup>
  import AccountsDropdown from '@/components/AccountsDropdown.vue';
</script>
