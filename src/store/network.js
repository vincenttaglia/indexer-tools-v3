// Utilities
import { defineStore } from 'pinia'
import graphNetworkClient from "../plugins/graphNetworkSubgraphClient";
import gql from 'graphql-tag';
import web3 from 'web3';
import BigNumber from 'bignumber.js';

export const useNetworkStore = defineStore('network', {
  state: () => ({
    totalTokensSignalled: "0",
    networkGRTIssuance: "0",
    totalSupply: "0",
    currentEpoch: "0",
  }),
  getters: {
    getTotalTokensSignalled: (state) => state.totalTokensSignalled,
    getNetworkGRTIssuance: (state) => state.networkGRTIssuance,
    getTotalSupply: (state) => state.totalSupply,
    getCurrentEpoch: (state) => state.currentEpoch,
    getPctIssuancePerBlock: (state) => {
      return state.getNetworkGRTIssuance == "0" ? new BigNumber("0") : new BigNumber(web3.utils.fromWei(state.getNetworkGRTIssuance).toString()).minus(1);
    },
    getPctIssuancePerYear: (state) => {
      return new BigNumber(state.getPctIssuancePerBlock).plus(1).pow(2354250).minus(1);
    },
    getIssuancePerBlock: (state) => {
      return new BigNumber(state.getPctIssuancePerBlock).multipliedBy(state.getTotalSupply);
    },
    getIssuancePerYear: (state) => {
      return new BigNumber(state.getPctIssuancePerYear).multipliedBy(state.getTotalSupply);
    }
  },
  actions: {
    async init(){
      return graphNetworkClient.query({
        query: gql`query{
          graphNetwork(id: 1){
            totalTokensSignalled
            networkGRTIssuance
            totalSupply
            currentEpoch
          }
        }`,
      }).then((data) => {
        console.log(data);
        this.totalTokensSignalled = data.data.graphNetwork.totalTokensSignalled;
        this.networkGRTIssuance = data.data.graphNetwork.networkGRTIssuance;
        this.totalSupply = data.data.graphNetwork.totalSupply;
        this.currentEpoch = data.data.graphNetwork.currentEpoch;
      });
    }
  }
})
