<template>
  <v-data-table
      :headers="headers"
      :items="this.$store.state.allocations"
      item-key="subgraphDeployment.ipfsHash"
      class="elevation-1"
      :search="search"
      :custom-sort="customSort"
      :footer-props="{
        'items-per-page-options': [5, 10, 15, 20, 25, 30, 40, 50, 100]
      }"
      loading-text="Loading... Please wait"
      mobile-breakpoint="0"
  >
    <template v-slot:item.subgraphDeployment.versions[0].subgraph.image="{ item }">
      <v-badge
          :value="item.raw.subgraphDeployment.deniedAt"
          bordered
          color="error"
          icon="mdi-currency-usd-off"
          overlap
          avatar
      >
        <v-avatar size="30">
          <v-img :src="item.raw.subgraphDeployment.versions[0].subgraph.image" />
        </v-avatar>
      </v-badge>
    </template>
  </v-data-table>
</template>