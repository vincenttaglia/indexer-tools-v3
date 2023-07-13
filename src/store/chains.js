// Utilities
import { defineStore } from 'pinia'

import { apolloClient, arbitrumApolloClient, goerliApolloClient } from "@/plugins/graphNetworkSubgraphClient";


export const useChainStore = defineStore('chainStore', {
  state: () => ({
    chains: [
      {
      id: "mainnet",
      rpc: "https://mainnet.infura.io/v3/659344f230804542a4e653f875172105",
      rewardsContract: "0x9Ac758AB77733b4150A901ebd659cbF8cB93ED66",
      stakingContract: "0xF55041E37E12cD407ad00CE2910B8269B01263b9",
      networkSubgraphClient: apolloClient,
      active: true,
      },
      {
      id: "arbitrum",
      rpc: "https://arb-mainnet.g.alchemy.com/v2/er8LBcXpoFwlV8xJee-WXFbFG_M8L4JK",
      rewardsContract: "0x971B9d3d0Ae3ECa029CAB5eA1fB0F72c85e6a525",
      stakingContract: "0x00669A4CF01450B64E8A2A20E9b1FCB71E61eF03",
      networkSubgraphClient: arbitrumApolloClient,
      },
      {
      id: "goerli",
      rpc: "https://goerli.infura.io/v3/659344f230804542a4e653f875172105",
      rewardsContract: "0x1246D7c4c903fDd6147d581010BD194102aD4ee2",
      stakingContract: "0x35e3Cb6B317690d662160d5d02A5b364578F62c9",
      networkSubgraphClient: goerliApolloClient,
      },
    ],
  }),
  getters: {
    getChains: (state) => state.chains,
    getActiveChain: (state) => state.chains.find(chain => chain.active),
    getChainID: (state) => state.getActiveChain.id,
    getRPC: (state) => state.getActiveChain.rpc,
    getRewardsContract: (state) => state.getActiveChain.rewardsContract,
    getStakingContract: (state) => state.getActiveChain.stakingContract,
    getNetworkSubgraph: (state) => state.getActiveChain.networkSubgraph,
  },
  actions: {
    setChain(id){
      let oldChain = this.getActiveChain;
      console.log(id);
      console.log(this.chains.map((c) => c.id));
      let newChain = this.chains.find(chain => chain.id == id);
      if(newChain){
        newChain.active = true;
        delete oldChain.active;
      }
      
    }
  },
})
