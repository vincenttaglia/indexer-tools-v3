import { defineStore } from 'pinia'

import graphNetworkClient from "../plugins/graphNetworkSubgraphClient";
import gql from 'graphql-tag';
import Web3 from 'web3';
const BN = Web3.utils.BN;
import { useNetworkStore } from './network';
import { useAccountStore } from './accounts';
import { useSubgraphSettingStore } from './subgraphSettings';
const networkStore = useNetworkStore();
const accountStore = useAccountStore();
accountStore.fetchData();
const subgraphSettingStore = useSubgraphSettingStore();
import BigNumber from "bignumber.js";
import { calculateNewApr, calculateSubgraphDailyRewards, maxAllo, indexerCut } from '@/plugins/commonCalcs';


export const useSubgraphsStore = defineStore({
  id: 'subgraphs',
  state: () => ({
    subgraphs: [],
    selected: [],
  }),
  getters: {
    getFilteredSubgraphs: (state) => {
      let subgraphs = state.getSubgraphs;
      
      if(subgraphSettingStore.noRewardsFilter === 0){
        subgraphs = subgraphs.filter((i) => {
          return !i.currentVersion.subgraphDeployment.deniedAt;
        });
      } else if(subgraphSettingStore.noRewardsFilter === 2){
        subgraphs = subgraphs.filter((i) => {
          return i.currentVersion.subgraphDeployment.deniedAt;
        });
      }

      if(subgraphSettingStore.networkFilter.length) {
        subgraphs = subgraphs.filter((i) => {
          return i.currentVersion.subgraphDeployment.network && subgraphSettingStore.networkFilter.includes(i.currentVersion.subgraphDeployment.network.id);
        });
      }

      if(subgraphSettingStore.activateBlacklist) {
        subgraphs = subgraphs.filter((i) => {
          return !subgraphSettingStore.subgraphBlacklist.includes(i.currentVersion.subgraphDeployment.ipfsHash);
        });
      }

      if(subgraphSettingStore.activateSynclist) {
        subgraphs = subgraphs.filter((i) => {
          return subgraphSettingStore.subgraphSynclist.includes(i.currentVersion.subgraphDeployment.ipfsHash);
        });
      }

      if(parseInt(subgraphSettingStore.maxSignal)){
        subgraphs = subgraphs.filter((i) => {
          return BigNumber(i.currentSignalledTokens).isLessThanOrEqualTo(new BigNumber(Web3.utils.toWei(subgraphSettingStore.maxSignal)));
        });
      }

      if(parseInt(subgraphSettingStore.minSignal)){
        subgraphs = subgraphs.filter((i) => {
          return BigNumber(i.currentSignalledTokens).isGreaterThanOrEqualTo(new BigNumber(Web3.utils.toWei(subgraphSettingStore.minSignal)));
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
    getNewAprs: (state) => {
      let newAprs = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        let subgraph = state.subgraphs[i];
        if(subgraph.currentSignalledTokens > 0) {
          newAprs[i] = { newApr: calculateNewApr(subgraph.currentSignalledTokens, subgraph.currentVersion.subgraphDeployment.stakedTokens, networkStore, subgraphSettingStore.newAllocation)};
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
          dailyRewards[i] = { dailyRewards: calculateSubgraphDailyRewards(subgraph.currentSignalledTokens, subgraph.currentVersion.subgraphDeployment.stakedTokens, networkStore, subgraphSettingStore.newAllocation) }
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
          maxAllos[i] = { maxAllo: maxAllo(subgraphSettingStore.targetApr, subgraph.currentSignalledTokens, networkStore, subgraph.currentVersion.subgraphDeployment.stakedTokens) }
        }else{
          maxAllos[i] = { maxAllo: 0 }
        }
      }
      return maxAllos;
    }
  },
  actions: {
    async fetch(skip){
      console.log("Fetch " + skip);
      return graphNetworkClient.query({
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
              data.subgraphs = data.subgraphs.concat(data1.subgraphs);
            
            return data;
          })
        }
        
        return data;
      });
    },
    async fetchData(){
      networkStore.init().then(() => {
        this.fetch(0)
        .then((data) => {
          this.subgraphs = data.subgraphs;
        })
      });
      
      
    }
  }
})
