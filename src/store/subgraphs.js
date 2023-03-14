import { defineStore } from 'pinia'

import graphNetworkClient from "../plugins/graphNetworkSubgraphClient";
import gql from 'graphql-tag';
import Web3 from 'web3';
const BN = Web3.utils.BN;
import { useNetworkStore } from './network';
import { useSubgraphSettingStore } from './subgraphSettings';
const networkStore = useNetworkStore();
const subgraphSettingStore = useSubgraphSettingStore();
import BigNumber from "bignumber.js";

BigNumber.config({ POW_PRECISION: 1000 });

function calculateNewApr(currentSignalledTokens, stakedTokens, newAllocation){
  try{
    // signalledTokens / totalTokensSignalled * issuancePerYear / (stakedTokens + newAllocation)
    return new BigNumber(currentSignalledTokens)
          .dividedBy(networkStore.getTotalTokensSignalled)
          .multipliedBy(networkStore.getIssuancePerYear)
          .dividedBy(
              new BigNumber(stakedTokens).plus(Web3.utils.toWei(newAllocation))
          ).multipliedBy(100);
  }
  catch(e){
    return new BigNumber(0);
  }
}

function calculateDailyRewards(currentSignalledTokens, stakedTokens, newAllocation){
  try{
    // currentSignalledTokens / totalTokensSignalled * issuancePerBlock * blocks per day * (new_allocation / (stakedTokens + newAllocation))
    return new BigNumber(currentSignalledTokens)
          .dividedBy(networkStore.getTotalTokensSignalled)
          .multipliedBy(networkStore.getIssuancePerBlock)
          .multipliedBy(6450)
          .multipliedBy(
              new BigNumber(Web3.utils.toWei(newAllocation)).dividedBy(new BigNumber(stakedTokens).plus(Web3.utils.toWei(newAllocation)))
          ).dp(0);
  }
  catch(e){
    return new BigNumber(0);
  }
}

export const useSubgraphsStore = defineStore({
  id: 'subgraphs',
  state: () => ({
    subgraphs: [],
  }),
  getters: {
    getSubgraphs: (state) => {
      let subgraphs = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        subgraphs[i] = {
          ...state.subgraphs[i],
          ...state.getProportions[i],
          ...state.getAprs[i],
          ...state.getDailyRewards[i]
        };
      }
      return subgraphs;
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
          aprs[i] = { apr: calculateNewApr(subgraph.currentSignalledTokens, subgraph.currentVersion.subgraphDeployment.stakedTokens, "0") }
        }else{
          aprs[i] = { apr: 0 }
        }
      }
      return aprs;
    },
    getDailyRewards: (state) => {
      let dailyRewards = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        let subgraph = state.subgraphs[i];
        if(subgraph.currentSignalledTokens > 0) {
          dailyRewards[i] = { dailyRewards: calculateDailyRewards(subgraph.currentSignalledTokens, subgraph.currentVersion.subgraphDeployment.stakedTokens, subgraphSettingStore.newAllocation) }
        }else{
          dailyRewards[i] = { dailyRewards: 0 }
        }
      }
      return dailyRewards;
    },
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
