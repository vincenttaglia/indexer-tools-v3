<template>
  <v-data-table
      :headers="headers"
      :items="qosData"
      class="elevation-1"
      loading-text="Loading... Please wait"
      mobile-breakpoint="0"
      hover
  >
    <template v-slot:no-data>
      <p class="mt-4">
        No data available
      </p>
      <br>
      <v-btn
        rounded
        variant="text"
        @click="resetFilters()"
        class="mb-4 mt-2"
      >
        Reset Filters
      </v-btn>
    </template>
  </v-data-table>
</template>

<script setup>
import { ref } from "vue";
import gql from "graphql-tag";
import { useAccountStore } from "@/store/accounts";
import { storeToRefs } from "pinia";
import { qosSubgraphClient } from "@/plugins/qosSubgraphClient";

const accountStore = useAccountStore();
//const { getActiveAccount } = storeToRefs(accountStore);
const qosData = ref([]);

console.log("QOS DATA");
qosSubgraphClient.query({
  query: gql`query{
    queryDailyDataPoints(orderBy: dayNumber, first: 1) {
      dayNumber
    }
  }`,
})
.then(({ data }) => {
  console.log("DAY NUMBER");
  console.log(data);
  return qosSubgraphClient.query({
    query: gql`query queryDailyDataPoints($dayNumber: Int!){
      queryDailyDataPoints(
        orderBy: total_query_fees
        where: {dayNumber: $dayNumber}
        orderDirection: desc
      ) {
        dayNumber
        chain_id
        avg_query_fee
        avg_gateway_latency_ms
        gateway_query_success_rate
        id
        query_count
        total_query_fees
      }
    }`,
    variables: {
      dayNumber: data.queryDailyDataPoints[0].dayNumber
    }
  }).then(({ data }) => {
    console.log("QUERY DAILY DATA POINTS");
    console.log(data.queryDailyDataPoints);
    qosData.value = data.queryDailyDataPoints;
  })
});

function resetFilters () {

}

const headers = ref([
  { title: 'ID', key: 'id' },
  //{ title: 'Chain ID', key: 'chain_id'},
  { title: 'Query Count', key: 'query_count' },
  { title: 'Query Fees (1d)', key: 'total_query_fees'},
  { title: 'Avg Latency', key: 'avg_gateway_latency_ms' },
  { title: 'Avg Query Fee', key: 'avg_query_fee'},
  { title: 'Success Rate', key: 'gateway_query_success_rate' },
]);
</script>