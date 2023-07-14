// Utilities
import { defineStore } from 'pinia'
import { useChainStore } from './chains';
import gql from 'graphql-tag';
import web3 from 'web3';
import BigNumber from 'bignumber.js';

const chainStore = useChainStore();

export const useNetworkStore = defineStore('network', {
  state: () => ({
    totalTokensSignalled: "0",
    issuancePerBlock: "0",
    issuancePerYear: "0",
    totalSupply: "0",
    currentEpoch: "0",
  }),
  getters: {
    getTotalTokensSignalled: (state) => state.totalTokensSignalled,
    getTotalSupply: (state) => state.totalSupply,
    getCurrentEpoch: (state) => state.currentEpoch,
    getIssuancePerBlock: (state) => state.issuancePerBlock,
    getIssuancePerYear: (state) => state.issuancePerYear,
  },
  actions: {
    async init(){
      return chainStore.getNetworkSubgraphClient.query({
        query: gql`query{
          graphNetwork(id: 1){
            totalTokensSignalled
            networkGRTIssuancePerBlock
            totalSupply
            currentEpoch
          }
        }`,
      }).then((data) => {
        console.log(data);
        this.totalTokensSignalled = data.data.graphNetwork.totalTokensSignalled;
        this.issuancePerBlock = data.data.graphNetwork.networkGRTIssuancePerBlock;
        this.totalSupply = data.data.graphNetwork.totalSupply;
        this.currentEpoch = data.data.graphNetwork.currentEpoch;
        this.issuancePerYear = data.data.graphNetwork.networkGRTIssuancePerBlock * chainStore.getBlocksPerYear;
      });
    }
  }
})
