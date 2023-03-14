import { defineStore } from 'pinia'
import graphNetworkClient from "@/plugins/graphNetworkSubgraphClient";
import { useIndexerStore } from '@/store/indexer';
import gql from 'graphql-tag';

const indexerStore = useIndexerStore();

export const useAllocationStore = defineStore('allocationStore', {
  state: () => ({
    allocations: [],
  }),
  getters: {

  },
  actions: {
    async fetchData(){
      graphNetworkClient.query({
        query: gql`query allocations($indexer: String!){
          allocations(where: {indexer: $indexer, status: Active}, orderBy:createdAtBlockNumber, orderDirection:desc){
            id
            activeForIndexer{
              id
            }
            subgraphDeployment{
              versions(first:1, orderBy:version, orderDirection:desc){
                subgraph{
                  image
                  displayName
                }
              }
              ipfsHash
              createdAt
              originalName
              stakedTokens
              indexingRewardAmount
              signalledTokens
              queryFeesAmount
              deniedAt
            }
            allocatedTokens
            effectiveAllocation
            createdAt
            createdAtEpoch
            createdAtBlockHash
            createdAtBlockNumber
            indexingRewards
            indexingIndexerRewards
            indexingDelegatorRewards
          }
  
        }`,
        variables: {
          indexer: indexerStore.address
        },
      })
      .then(({ data }) => {
        console.log(data);
        this.allocations = data.allocations;
      });
    }
  }
})
