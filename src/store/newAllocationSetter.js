import { defineStore } from 'pinia'
import { useSubgraphsStore } from './subgraphs';
import { useNetworkStore } from './network';
import { useAccountStore } from './accounts';
import { useAllocationStore } from './allocations';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { calculateNewApr, calculateSubgraphDailyRewards, maxAllo, indexerCut } from '@/plugins/commonCalcs';
const subgraphStore = useSubgraphsStore();
const networkStore = useNetworkStore();
const accountStore = useAccountStore();
const allocationStore = useAllocationStore();


export const useNewAllocationSetterStore = defineStore('allocationSetter', {
  state: () => ({
    newAllocations: {},
  }),
  getters: {
    getNewAllocations: (state) => {
      let newAllocations = {};
      for(let i = 0; i < state.getSelected.length; i++){
        if(state.newAllocations[state.getSelected[i]]){
          newAllocations[state.getSelected[i]] = state.newAllocations[state.getSelected[i]];
        }else{
          newAllocations[state.getSelected[i]] = 0;
        }
      }
      return newAllocations;
    },
    getSelected: () => subgraphStore.selected,
    getSelectedSubgraphs: (state) => {
      let selectedSubgraphs = [];
      for(let i = 0; i < subgraphStore.getSelectedSubgraphs.length; i++){
        selectedSubgraphs[i] = {
          ...subgraphStore.getSelectedSubgraphs[i],
          ...state.getNewAprs[i],
          ...state.getDailyRewards[i],
          ...state.getDailyRewardsCuts[i],
        };
      }
      return selectedSubgraphs;
    },
    getNewAprs: (state) => {
      let newAprs = [];
      for(let i = 0; i < subgraphStore.getSelectedSubgraphs.length; i++){
        let subgraph = subgraphStore.getSelectedSubgraphs[i];
        if(subgraph.currentSignalledTokens > 0) {
          newAprs[i] = { newApr: calculateNewApr(subgraph.currentSignalledTokens, subgraph.currentVersion.subgraphDeployment.stakedTokens, networkStore, state.newAllocations[subgraph.id])};
        }else{
          newAprs[i] = { newApr: 0 };
        }
      }
      return newAprs;
    },
    getDailyRewards: (state) => {
      let dailyRewards = [];
      for(let i = 0; i < subgraphStore.getSelectedSubgraphs.length; i++){
        let subgraph = subgraphStore.getSelectedSubgraphs[i];
        if(subgraph.currentSignalledTokens > 0) {
          dailyRewards[i] = { dailyRewards: calculateSubgraphDailyRewards(subgraph.currentSignalledTokens, subgraph.currentVersion.subgraphDeployment.stakedTokens, networkStore, state.newAllocations[subgraph.id]) }
        }else{
          dailyRewards[i] = { dailyRewards: 0 }
        }
      }
      return dailyRewards;
    },
    getDailyRewardsCuts: (state) => {
      let dailyRewardsCuts = [];
      for(let i = 0; i < subgraphStore.getSelectedSubgraphs.length; i++){
        let subgraph = subgraphStore.getSelectedSubgraphs[i];
        if (subgraph.currentVersion.subgraphDeployment.stakedTokens > 0 && !accountStore.loading){
          dailyRewardsCuts[i] = { dailyRewardsCut: indexerCut(state.getDailyRewards[i].dailyRewards, accountStore.cut) };
        }else{
          dailyRewardsCuts[i] = { dailyRewardsCut: 0 };
        }
      }
      return dailyRewardsCuts;
    },
    totalClosing: (state) => {
      return state.getSelectedSubgraphs.reduce((sum, cur) => sum.plus(cur.allocatedTokens), BigNumber(0))
    },
    avgAPR: (state) => {
      return allocationStore.getTotalRewardsPerYear.dividedBy(allocationStore.getTotalAllocatedStake.plus(state.availableStake));
    },
    availableStake: () => {
      return accountStore.availableStake;
    },
    calculatedAvailableStake: (state) => {
      return BigNumber(state.availableStake).plus(state.totalClosing).minus(Web3.utils.toWei(state.totalOpening.toString()));
    },
    totalOpening: (state) => {
      let totalOpening = 0;
      for(const i in state.newAllocations){
        totalOpening += parseInt(state.newAllocations[i]);
      }
      return totalOpening;
    },
  },
  actions: {
    async update(){
      for(let i = 0; i < subgraphStore.selected.length; i++){
        this.newAllocations[subgraphStore.selected[i]] ||= 0;
      }
    }
  },
})
