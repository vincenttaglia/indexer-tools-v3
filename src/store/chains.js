// Utilities
import { defineStore } from 'pinia'
import { apolloClient, arbitrumApolloClient, goerliApolloClient } from "@/plugins/graphNetworkSubgraphClient";
import Web3 from 'web3';
import RewardsContractABI from '@/abis/rewardsContractABI.json';


const web3 = new Web3("https://mainnet.infura.io/v3/659344f230804542a4e653f875172105");
const arbitrumWeb3 = new Web3("https://arb-mainnet.g.alchemy.com/v2/er8LBcXpoFwlV8xJee-WXFbFG_M8L4JK");
const goerliWeb3 = new Web3("https://goerli.infura.io/v3/659344f230804542a4e653f875172105");

export const useChainStore = defineStore('chainStore', {
  state: () => ({
    chains: [
      {
      id: "mainnet",
      rpc: "https://mainnet.infura.io/v3/659344f230804542a4e653f875172105",
      web3: new Web3("https://mainnet.infura.io/v3/659344f230804542a4e653f875172105"),
      rewardsContractAddress: "0x9Ac758AB77733b4150A901ebd659cbF8cB93ED66",
      stakingContractAddress: "0xF55041E37E12cD407ad00CE2910B8269B01263b9",
      networkSubgraphClient: apolloClient,
      blocksPerDay: 7200,
      active: true,
      },
      {
      id: "arbitrum",
      rpc: "https://arb-mainnet.g.alchemy.com/v2/er8LBcXpoFwlV8xJee-WXFbFG_M8L4JK",
      web3: new Web3("https://arb-mainnet.g.alchemy.com/v2/er8LBcXpoFwlV8xJee-WXFbFG_M8L4JK"),
      rewardsContractAddress: "0x971B9d3d0Ae3ECa029CAB5eA1fB0F72c85e6a525",
      stakingContractAddress: "0x00669A4CF01450B64E8A2A20E9b1FCB71E61eF03",
      networkSubgraphClient: arbitrumApolloClient,
      blocksPerDay: 5760,
      },
      {
      id: "goerli",
      rpc: "https://goerli.infura.io/v3/659344f230804542a4e653f875172105",
      web3: new Web3("https://goerli.infura.io/v3/659344f230804542a4e653f875172105"),
      rewardsContractAddress: "0x1246D7c4c903fDd6147d581010BD194102aD4ee2",
      stakingContractAddress: "0x35e3Cb6B317690d662160d5d02A5b364578F62c9",
      networkSubgraphClient: goerliApolloClient,
      blocksPerDay: 43200,
      },
    ],
  }),
  getters: {
    getChains: (state) => state.chains,
    getActiveChain: (state) => state.chains.find(chain => chain.active),
    getChainID: (state) => state.getActiveChain.id,
    getRPC: (state) => state.getActiveChain.rpc,
    getRewardsContractAddress: (state) => state.getActiveChain.rewardsContractAddress,
    getStakingContractAddress: (state) => state.getActiveChain.stakingContractAddress,
    getNetworkSubgraph: (state) => state.getActiveChain.networkSubgraph,
    getRewardsContract: (state) => new state.getActiveChain.web3.eth.Contract(RewardsContractABI, state.getRewardsContractAddress),
    getBlocksPerDay: (state) => state.getActiveChain.blocksPerDay,
    getBlocksPerYear: (state) => state.getActiveChain.blocksPerDay * 365,
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
