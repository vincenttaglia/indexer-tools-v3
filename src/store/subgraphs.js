import { defineStore } from 'pinia'

import gql from 'graphql-tag';
import Web3 from 'web3';
const BN = Web3.utils.BN;
import { useNetworkStore } from './network';
import { useAccountStore } from './accounts';
import { useSubgraphSettingStore } from './subgraphSettings';
import { useAllocationStore } from './allocations';
import { useChainStore } from './chains';
const networkStore = useNetworkStore();
const accountStore = useAccountStore();
const allocationStore = useAllocationStore();
const chainStore = useChainStore();
accountStore.fetchData();
const subgraphSettingStore = useSubgraphSettingStore();
import BigNumber from "bignumber.js";
import { calculateNewApr, calculateSubgraphDailyRewards, maxAllo, indexerCut } from '@/plugins/commonCalcs';

export const useSubgraphsStore = defineStore({
  id: 'subgraphs',
  state: () => ({
    subgraphs: [],
    selected: [],
    loading: false,
  }),
  getters: {
    getFilteredSubgraphs: (state) => {
      let subgraphs = state.getSubgraphs;
      
      if(subgraphSettingStore.settings.noRewardsFilter === 0){
        subgraphs = subgraphs.filter((i) => {
          return !i.currentVersion.subgraphDeployment.deniedAt;
        });
      } else if(subgraphSettingStore.settings.noRewardsFilter === 2){
        subgraphs = subgraphs.filter((i) => {
          return i.currentVersion.subgraphDeployment.deniedAt;
        });
      }

      if(subgraphSettingStore.settings.networkFilter.length) {
        subgraphs = subgraphs.filter((i) => {
          return i.currentVersion.subgraphDeployment.network && subgraphSettingStore.settings.networkFilter.includes(i.currentVersion.subgraphDeployment.network.id);
        });
      }

      if(subgraphSettingStore.settings.activateBlacklist) {
        subgraphs = subgraphs.filter((i) => {
          return !subgraphSettingStore.settings.subgraphBlacklist.includes(i.currentVersion.subgraphDeployment.ipfsHash);
        });
      }

      if(subgraphSettingStore.settings.activateSynclist) {
        subgraphs = subgraphs.filter((i) => {
          return subgraphSettingStore.settings.subgraphSynclist.includes(i.currentVersion.subgraphDeployment.ipfsHash);
        });
      }

      if(parseInt(subgraphSettingStore.settings.maxSignal)){
        subgraphs = subgraphs.filter((i) => {
          return BigNumber(i.currentSignalledTokens).isLessThanOrEqualTo(new BigNumber(Web3.utils.toWei(subgraphSettingStore.settings.maxSignal)));
        });
      }

      if(parseInt(subgraphSettingStore.settings.minSignal)){
        subgraphs = subgraphs.filter((i) => {
          return BigNumber(i.currentSignalledTokens).isGreaterThanOrEqualTo(new BigNumber(Web3.utils.toWei(subgraphSettingStore.settings.minSignal)));
        });
      }

      return subgraphs;
    },
    getSubgraphs: (state) => {
      let subgraphs = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        subgraphs[i] = {
          ...state.subgraphs[i],
          ...state.getProportions[i],
          ...state.getAprs[i],
          ...state.getDailyRewards[i],
          ...state.getDailyRewardsCuts[i],
          ...state.getNewAprs[i],
          ...state.getMaxAllos[i],
          ...state.getCurrentlyAllocated[i],
        };
      }
      return subgraphs;
    },
    getSelectedSubgraphs: (state) => {
      let selectedSubgraphs = [];
      for(let i = 0; i < state.selected.length; i++){
        let subgraphIndex = state.subgraphs.findIndex((e) => e.id == state.selected[i])
        selectedSubgraphs[i] = {
          ...state.subgraphs[subgraphIndex],
          ...state.getProportions[subgraphIndex],
          ...state.getAprs[subgraphIndex],
          ...state.getMaxAllos[subgraphIndex],
          ...state.getCurrentlyAllocated[subgraphIndex],
        };
      }
      return selectedSubgraphs;
    },
    getProportions: (state) => {
      let proportions = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        let subgraph = state.subgraphs[i];
        if(subgraph.currentVersion.subgraphDeployment.stakedTokens > 0)
            proportions[i] = { proportion: subgraph.currentSignalledTokens / subgraph.currentVersion.subgraphDeployment.stakedTokens };
          else
            proportions[i] = { proportion: 0 };
      }
      return proportions;
    },
    getAprs: (state) => {
      let aprs = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        let subgraph = state.subgraphs[i];
        if(subgraph.currentSignalledTokens > 0) {
          aprs[i] = { apr: calculateNewApr(subgraph.currentSignalledTokens, subgraph.currentVersion.subgraphDeployment.stakedTokens, networkStore, "0") }
        }else{
          aprs[i] = { apr: 0 }
        }
      }
      return aprs;
    },
    getFutureStakedTokens: (state) => {
      let futureStakedTokens = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        let subgraph = state.subgraphs[i];
        let associatedAllocation = allocationStore.getSelectedAllocations.find((e) => e.subgraphDeployment.ipfsHash == subgraph.currentVersion.subgraphDeployment.ipfsHash);
        if(associatedAllocation){
          futureStakedTokens[i] = { futureStakedTokens: new BigNumber(subgraph.currentVersion.subgraphDeployment.stakedTokens).minus(associatedAllocation.allocatedTokens) };
        }else{
          futureStakedTokens[i] = { futureStakedTokens: new BigNumber(subgraph.currentVersion.subgraphDeployment.stakedTokens) };
        }
      }
      return futureStakedTokens;
    },
    getNewAprs: (state) => {
      let newAprs = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        let subgraph = state.subgraphs[i];
        if(subgraph.currentSignalledTokens > 0) {
          newAprs[i] = { newApr: calculateNewApr(subgraph.currentSignalledTokens, state.getFutureStakedTokens[i].futureStakedTokens, networkStore, subgraphSettingStore.settings.newAllocation)};
        }else{
          newAprs[i] = { newApr: 0 };
        }
      }
      return newAprs;
    },
    getDailyRewards: (state) => {
      let dailyRewards = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        let subgraph = state.subgraphs[i];
        if(subgraph.currentSignalledTokens > 0) {
          dailyRewards[i] = { dailyRewards: calculateSubgraphDailyRewards(subgraph.currentSignalledTokens, state.getFutureStakedTokens[i].futureStakedTokens, networkStore, subgraphSettingStore.settings.newAllocation) }
        }else{
          dailyRewards[i] = { dailyRewards: 0 }
        }
      }
      return dailyRewards;
    },
    getDailyRewardsCuts() {
      let dailyRewardsCuts = [];
      for(let i = 0; i < this.subgraphs.length; i++){
        let subgraph = this.subgraphs[i];
        if (subgraph.currentVersion.subgraphDeployment.stakedTokens > 0 && !accountStore.loading){
          dailyRewardsCuts[i] = { dailyRewardsCut: indexerCut(this.getDailyRewards[i].dailyRewards, accountStore.cut) };
        }else{
          dailyRewardsCuts[i] = { dailyRewardsCut: 0 };
        }
      }
      return dailyRewardsCuts;
    },
    getMaxAllos: (state) => {
      let maxAllos = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        let subgraph = state.subgraphs[i];
        if(subgraph.currentSignalledTokens > 0) {
          maxAllos[i] = { maxAllo: maxAllo(subgraphSettingStore.settings.targetApr, subgraph.currentSignalledTokens, networkStore, state.getFutureStakedTokens[i].futureStakedTokens) }
        }else{
          maxAllos[i] = { maxAllo: 0 }
        }
      }
      return maxAllos;
    },
    getCurrentlyAllocated: (state) => {
      let currentlyAllocated = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        let subgraph = state.subgraphs[i];
        let allo = allocationStore.getAllocations.find(e => {
          return e.subgraphDeployment.ipfsHash === subgraph.currentVersion.subgraphDeployment.ipfsHash;
        });
        let unallo = allocationStore.getSelectedAllocations.find(e => {
          return e.subgraphDeployment.ipfsHash === subgraph.currentVersion.subgraphDeployment.ipfsHash;
        });
        if(allo && !unallo) {
          currentlyAllocated[i] = { currentlyAllocated: true }
        }else{
          currentlyAllocated[i] = { currentlyAllocated: false }
        }
      }
      return currentlyAllocated;
    },
  },
  actions: {
    async fetch(skip){
      console.log("Fetch " + skip);
      return chainStore.getNetworkSubgraphClient.query({
        query: gql`query subgraphs($skip: Int!){
          subgraphs (skip: $skip){
            id
            displayName
            createdAt
            currentSignalledTokens
            image
            currentVersion{
              subgraphDeployment{
                ipfsHash
                indexingRewardAmount
                queryFeesAmount
                stakedTokens
                createdAt
                deniedAt
                network{
                  id
                }
              }
            }
          }
        }`,
        variables: {
          skip: skip
        },
      })
      .then(({ data, networkStatus }) => {
        if(networkStatus == 7 && data.subgraphs.length == 100){
          return this.fetch(skip + data.subgraphs.length)
          .then((data1) => {
            if(typeof data.subgraphs == "object" && typeof data1.subgraphs == "object")
              data.subgraphs = data.subgraphs.concat(data1.subgraphs).filter((s) => s.currentVersion);
            
            return data;
          })
        }
        
        return data;
      });
    },
    async fetchData(){
      networkStore.init().then(() => {
        this.loading = true;
        this.fetch(0)
        .then((data) => {
          this.subgraphs = data.subgraphs;
          this.loading = false;
        })
      });
      
      
    }
  }
})
