// Utilities
import { defineStore } from 'pinia'
import { apolloClient, arbitrumApolloClient, goerliApolloClient } from "@/plugins/graphNetworkSubgraphClient";
import { useSubgraphSettingStore } from './subgraphSettings';
import Web3 from 'web3';
import RewardsContractABI from '@/abis/rewardsContractABI.json';
import { loadDefaultsConfig } from '@/plugins/defaultsConfig';

const defaultsConfigVariables = await loadDefaultsConfig();
const defaultsConfig = defaultsConfigVariables.variables;

const subgraphSettingStore = useSubgraphSettingStore();
let startChain;

if(localStorage.accounts){
  const chain = JSON.parse(localStorage.accounts).find((a) => a.active).chain;
  if(["mainnet", "arbitrum-one", "goerli"].includes(chain)){
    startChain = chain;
  }else{
    startChain = "mainnet";
  }
}else{
  startChain = "mainnet"
}
export const useChainStore = defineStore('chainStore', {
  state: () => ({
    chains: [
      {
      id: "mainnet",
      default_rpc: defaultsConfig.rpcMainnet,
      block_explorer: "https://etherscan.io",
      web3: new Web3(subgraphSettingStore.settings.rpc.mainnet != '' ? subgraphSettingStore.settings.rpc.mainnet : defaultsConfig.rpcMainnet),
      rewardsContractAddress: "0x9Ac758AB77733b4150A901ebd659cbF8cB93ED66",
      stakingContractAddress: "0xF55041E37E12cD407ad00CE2910B8269B01263b9",
      networkSubgraphClient: apolloClient,
      blocksPerDay: 7200,
      active: startChain == "mainnet",
      },
      {
      id: "arbitrum-one",
      default_rpc: defaultsConfig.rpcArbitrum,
      block_explorer: "https://arbiscan.io",
      web3: new Web3(subgraphSettingStore.settings.rpc.arbitrum != '' ? subgraphSettingStore.settings.rpc.arbitrum : defaultsConfig.rpcArbitrum),
      rewardsContractAddress: "0x971B9d3d0Ae3ECa029CAB5eA1fB0F72c85e6a525",
      stakingContractAddress: "0x00669A4CF01450B64E8A2A20E9b1FCB71E61eF03",
      networkSubgraphClient: arbitrumApolloClient,
      blocksPerDay: 5760,
      active: startChain == "arbitrum-one",
      },
      {
      id: "goerli",
      default_rpc: defaultsConfig.rpcGoerli,
      block_explorer: "https://goerli.etherscan.io",
      web3: new Web3(subgraphSettingStore.settings.rpc.goerli != '' ? subgraphSettingStore.settings.rpc.goerli : defaultsConfig.rpcGoerli),
      rewardsContractAddress: "0x1246D7c4c903fDd6147d581010BD194102aD4ee2",
      stakingContractAddress: "0x35e3Cb6B317690d662160d5d02A5b364578F62c9",
      networkSubgraphClient: goerliApolloClient,
      blocksPerDay: 43200,
      active: startChain == "goerli",
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
    getNetworkSubgraphClient: (state) => state.getActiveChain.networkSubgraphClient,
    getRewardsContract: (state) => new state.getActiveChain.web3.eth.Contract(RewardsContractABI, state.getRewardsContractAddress),
    getBlocksPerDay: (state) => state.getActiveChain.blocksPerDay,
    getBlocksPerYear: (state) => state.getActiveChain.blocksPerDay * 365,
    getBlockExplorer: (state) => state.getActiveChain.block_explorer,
  },
  actions: {
    setChain(id){
      let oldChain = this.getActiveChain;
      console.log(id);
      console.log(this.chains.map((c) => c.id));
      let newChain = this.chains.find(chain => chain.id == id);
      if(newChain && newChain != oldChain){
        newChain.active = true;
        delete oldChain.active;
      }
      
    }
  },
})
