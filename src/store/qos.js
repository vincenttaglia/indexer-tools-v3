import { defineStore } from 'pinia'
import { useSubgraphSettingStore } from './subgraphSettings';
import gql from 'graphql-tag';
import { qosSubgraphClient } from "@/plugins/qosSubgraphClient";


const subgraphSettingStore = useSubgraphSettingStore();

const QOS_QUERY_NO_FILTER = gql`query queryDailyDataPoints($dayNumber: Int!){
  queryDailyDataPoints(
    orderBy: total_query_fees
    where: {dayNumber: $dayNumber}
    orderDirection: desc,
    first: 1000
  ) {
    dayNumber
    chain_id
    avg_query_fee
    avg_gateway_latency_ms
    gateway_query_success_rate
    query_count
    total_query_fees
    subgraphDeployment {
      id
    }
  }
}`;
const QOS_QUERY = gql`query queryDailyDataPoints($dayNumber: Int!, $networkFilter: [String]!){
  queryDailyDataPoints(
    orderBy: total_query_fees
    where: {dayNumber: $dayNumber, chain_id_in: $networkFilter}
    orderDirection: desc,
    first: 1000
  ) {
    dayNumber
    chain_id
    avg_query_fee
    avg_gateway_latency_ms
    gateway_query_success_rate
    query_count
    total_query_fees
    subgraphDeployment {
      id
    }
  }
}`;

export const useQosStore = defineStore('app', {
  state: () => ({
    qosData: [],
    loading: true,
  }),
  getters: {
    getQosDict: (state) => {
      let dict = {};
      state.qosData.forEach(
        (el) => (dict[el.subgraphDeployment.id] = el )
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
          query: subgraphSettingStore.settings.queryFilters.networkFilter.length > 0 ? QOS_QUERY : QOS_QUERY_NO_FILTER,
          variables: {
            dayNumber: data.queryDailyDataPoints[0].dayNumber - 1,
            networkFilter: subgraphSettingStore.settings.queryFilters.networkFilter,
          }
        }).then(({ data }) => {
          console.log("QUERY DAILY DATA POINTS");
          console.log(data.queryDailyDataPoints);
          this.qosData = data.queryDailyDataPoints;
          console.log(this.qosData);
          this.loading = false;
          return data.queryDailyDataPoints;
        })
      });
    }
  },
})
