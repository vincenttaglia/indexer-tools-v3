// Utilities
import { defineStore } from 'pinia'
import { apolloClient, arbitrumApolloClient, sepoliaApolloClient, arbitrumSepoliaApolloClient } from "@/plugins/graphNetworkSubgraphClient";
import { mainnetEboClient, arbitrumEboClient, sepoliaEboClient, arbitrumSepoliaEboClient } from '@/plugins/eboSubgraphClient';
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
  if(["mainnet", "arbitrum-one", "sepolia", "arbitrum-sepolia"].includes(chain)){
    startChain = chain;
  }else{
    startChain = "arbitrum-one";
  }
}else{
  startChain = "arbitrum-one"
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
      eboSubgraphClient: mainnetEboClient,
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
      eboSubgraphClient: arbitrumEboClient,
      blocksPerDay: 5760,
      active: startChain == "arbitrum-one",
      },
      {
      id: "sepolia",
      default_rpc: defaultsConfig.rpcSepolia,
      block_explorer: "https://sepolia.etherscan.io",
      web3: new Web3(subgraphSettingStore.settings.rpc.sepolia != '' ? subgraphSettingStore.settings.rpc.sepolia : defaultsConfig.rpcSepolia),
      rewardsContractAddress: "0x9a86322dEa5136C74ee6d1b06F4Ab9A6bB2724E0",
      stakingContractAddress: "0x14e9B07Dc56A0B03ac8A58453B5cCCB289d6ec90",
      networkSubgraphClient: sepoliaApolloClient,
      eboSubgraphClient: sepoliaEboClient,
      blocksPerDay: 43200,
      active: startChain == "sepolia",
      },
      {
      id: "arbitrum-sepolia",
      default_rpc: defaultsConfig.rpcArbitrumSepolia,
      block_explorer: "https://sepolia.arbiscan.io",
      web3: new Web3(subgraphSettingStore.settings.rpc.arbitrumSepolia != '' ? subgraphSettingStore.settings.rpc.arbitrumSepolia : defaultsConfig.rpcArbitrumSepolia),
      rewardsContractAddress: "0x00b9d319E3D09E83c62f453B44354049Dd93a345",
      stakingContractAddress: "0x865365C425f3A593Ffe698D9c4E6707D14d51e08",
      networkSubgraphClient: arbitrumSepoliaApolloClient,
      eboSubgraphClient: arbitrumSepoliaEboClient,
      blocksPerDay: 43200,
      active: startChain == "arbitrum-sepolia",
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
