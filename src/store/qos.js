import { defineStore } from 'pinia'
import gql from 'graphql-tag';
import { qosSubgraphClient } from "@/plugins/qosSubgraphClient";
import { useAccountStore } from './accounts';


const accountStore = useAccountStore();

const QOS_QUERY = gql`query queryDailyDataPoints($dayNumber: Int!, $indexer: String!){
  indexer(id: $indexer) {
    id
    allocationDailyDataPoints(first: 1000, where: {dayNumber: $dayNumber}) {
      avg_indexer_blocks_behind
      dayNumber
      chain_id
      subgraph_deployment_ipfs_hash
      avg_indexer_latency_ms
      avg_query_fee
      id
      max_query_fee
      max_indexer_latency_ms
      max_indexer_blocks_behind
      num_indexer_200_responses
      proportion_indexer_200_responses
      query_count
      total_query_fees
    }
  }
}`;

export const useQosStore = defineStore('qosStore', {
  state: () => ({
    qosData: [],
    loading: true,
  }),
  getters: {
    getQosDict: (state) => {
      let dict = {};
      state.qosData.forEach(
        (el) => (dict[el.subgraph_deployment_ipfs_hash] = el )
      );
      return dict;
    },
  },
  actions: {
    async fetchData(){
      console.log("QOS DATA");
      this.loading = true;

      qosSubgraphClient.query({
        query: gql`query{
          queryDailyDataPoints(orderBy: dayNumber, first: 1, orderDirection: desc) {
            dayNumber
          }
        }`,
      })
      .then(({ data }) => {
        console.log("DAY NUMBER");
        console.log(data);
        return qosSubgraphClient.query({
          query: QOS_QUERY,
          variables: {
            dayNumber: data.queryDailyDataPoints[0].dayNumber - 1,
            indexer: accountStore.getActiveAccount.address,
          }
        }).then(({ data }) => {
          console.log("QUERY QOS INDEXER");
          console.log(data.indexer);
          this.qosData = data.indexer.allocationDailyDataPoints;
          console.log(this.qosData);
          this.loading = false;
          return data.indexer.allocationDailyDataPoints;
        })
      });
    }
  },
})
