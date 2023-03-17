import { defineStore } from 'pinia'
import graphNetworkClient from "@/plugins/graphNetworkSubgraphClient";
import { useNetworkStore } from '@/store/network';
import { useAccountStore } from '@/store/accounts';
import gql from 'graphql-tag';
import moment from 'moment';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import RewardsContractABI from '@/abis/rewardsContractABI.json';
import { calculateApr, calculateReadableDuration, calculateAllocationDailyRewards, indexerCut } from '@/plugins/commonCalcs';


const networkStore = useNetworkStore();
const accountStore = useAccountStore();
const ProxyContract = new (new Web3("https://mainnet.infura.io/v3/659344f230804542a4e653f875172105")).eth.Contract(RewardsContractABI, "0x9Ac758AB77733b4150A901ebd659cbF8cB93ED66");
networkStore.init();
accountStore.fetchData();


export const useAllocationStore = defineStore('allocationStore', {
  state: () => ({
    allocations: [],
    pendingRewards: [],
    selected: [],
    loaded: false,
  }),
  getters: {
    getAllocations: (state) => {
      let allocations = [];
      for(let i = 0; i < state.allocations.length; i++){
        allocations[i] = {
          ...state.allocations[i],
          ...state.getActiveDurations[i],
          ...state.getReadableDurations[i],
          ...state.getEpochDurations[i],
          ...state.getProportions[i],
          ...state.getAprs[i],
          ...state.getDailyRewards[i],
          ...state.getDailyRewardsCuts[i],
          ...state.getPendingRewards[i],
          ...state.getPendingRewardsCuts[i],
        };
      }
      return allocations;
    },
    getActiveDurations: (state) => {
      let activeDurations = [];
      for(let i = 0; i < state.allocations.length; i++){
        let allocation = state.allocations[i];
        activeDurations[i] = { activeDuration: moment().unix() - allocation.createdAt }
      }
      return activeDurations;
    },
    getReadableDurations: (state) => {
      let readableDurations = [];
      for(let i = 0; i < state.allocations.length; i++){

        readableDurations[i] = { readableDuration: calculateReadableDuration(state.getActiveDurations[i].activeDuration) }
      }
      return readableDurations;
    },
    getEpochDurations: (state) => {
      let epochDurations = [];
      for(let i = 0; i < state.allocations.length; i++){
        let allocation = state.allocations[i];
        epochDurations[i] = { epochDuration:networkStore.currentEpoch - allocation.createdAtEpoch };
      }
      return epochDurations;
    },
    getProportions: (state) => {
      let proportions = [];
      for(let i = 0; i < state.allocations.length; i++){
        let allocation = state.allocations[i];
        if (allocation.subgraphDeployment.stakedTokens > 0)
          proportions[i] = { proportion: allocation.subgraphDeployment.signalledTokens / allocation.subgraphDeployment.stakedTokens };
        else
          proportions[i] = { proportion:  0 };
      }
      return proportions;
    },
    getAprs: (state) => {
      let aprs = [];
      for(let i = 0; i < state.allocations.length; i++){
        let allocation = state.allocations[i];
        if (allocation.subgraphDeployment.stakedTokens > 0)
          aprs[i] = { apr: calculateApr(allocation.subgraphDeployment.signalledTokens, allocation.subgraphDeployment.stakedTokens, networkStore).toString()};
        else
          aprs[i] = { apr: 0 };
      }
      return aprs;
    },
    getDailyRewards: (state) => {
      let dailyRewards = [];
      for(let i = 0; i < state.allocations.length; i++){
        let allocation = state.allocations[i];
        if (allocation.subgraphDeployment.stakedTokens > 0){
          dailyRewards[i] = { dailyRewards: calculateAllocationDailyRewards(allocation.subgraphDeployment.signalledTokens, allocation.subgraphDeployment.stakedTokens, allocation.allocatedTokens, networkStore)}
        }else{
          dailyRewards[i] = { dailyRewards: 0 };
        }
      }
      return dailyRewards;
    },
    getDailyRewardsCuts() {
      let dailyRewardsCuts = [];
      for(let i = 0; i < this.allocations.length; i++){
        let allocation = this.allocations[i];
        if (allocation.subgraphDeployment.stakedTokens > 0 && !accountStore.loading){
          dailyRewardsCuts[i] = { dailyRewardsCut: indexerCut(this.getDailyRewards[i].dailyRewards, accountStore.cut) };
        }else{
          dailyRewardsCuts[i] = { dailyRewardsCut: 0 };
        }
      }
      return dailyRewardsCuts;
    },
    getPendingRewards: (state) => {
      let pendingRewards = [];
      for(let i = 0; i < state.pendingRewards.length; i++){
        pendingRewards[i] = { pendingRewards: state.pendingRewards[i] }
      }
      return pendingRewards;
    },
    getPendingRewardsCuts() {
      let pendingRewardsCuts = [];
      for(let i = 0; i < this.pendingRewards.length; i++){
        let pendingReward = this.pendingRewards[i];
        if(pendingReward.value > 0 && !accountStore.loading){
          pendingRewardsCuts[i] = { pendingRewardsCut: indexerCut(this.getPendingRewards[i].pendingRewards.value, accountStore.cut) };
        }else{
          pendingRewardsCuts[i] = { pendingRewardsCut: BigNumber(0) };
        }
      }
      return pendingRewardsCuts;
    },
  },
  actions: {
    async fetchAllPendingRewards(){
      for(let i = 0; i < this.allocations.length; i++){
        this.fetchPendingRewards(this.getAllocations[i].id);
      }
    },
    fetchPendingRewards(allocationId){
      let allocation = this.getAllocations.find(e => e.id == allocationId);

      if(!allocation.pendingRewards.loading && !allocation.pendingRewards.loaded){

        allocation.pendingRewards.loading = true;

        ProxyContract.methods.getRewards(allocation.id).call(function(error, value){
          if(value === undefined)
            allocation.pendingRewards.error = true;
          else
            allocation.pendingRewards.value = BigNumber(value);
          
          allocation.pendingRewards.loaded = true;
          allocation.pendingRewards.loading = false;
        })
      }
    },
    async init(){
      if(!this.loaded)
        return this.fetchData();
    },
    async fetchData(){
      this.selected = [];
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
          indexer: accountStore.getActiveAccount.address
        },
      })
      .then(({ data }) => {
        console.log(data);
        this.loaded = true;
        this.allocations = data.allocations;
        this.pendingRewards = Array(data.allocations.length).fill();
        for(let i = 0; i < this.pendingRewards.length; i++){
          this.pendingRewards[i] = { value: BigNumber(0), loading: false, loaded: false };
        }
      });
    }
  }
})
