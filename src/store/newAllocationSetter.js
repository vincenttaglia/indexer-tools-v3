import { defineStore } from 'pinia'
import { useSubgraphsStore } from './subgraphs';
import { useNetworkStore } from './network';
import { useAccountStore } from './accounts';
import { useAllocationStore } from './allocations';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { calculateNewApr, calculateSubgraphDailyRewards, maxAllo, indexerCut } from '@/plugins/commonCalcs';
import { useChainStore } from './chains';
const subgraphStore = useSubgraphsStore();
const networkStore = useNetworkStore();
const accountStore = useAccountStore();
const allocationStore = useAllocationStore();
const chainStore = useChainStore();


export const useNewAllocationSetterStore = defineStore('allocationSetter', {
  state: () => ({
    newAllocations: {},
  }),
  getters: {
    getSelected: () => subgraphStore.selected,
    getSelectedS: () => subgraphStore.getSelectedSubgraphs,
    getSelectedSubgraphs: (state) => {
      let selectedSubgraphs = [];
      for(let i = 0; i < subgraphStore.getSelectedSubgraphs.length; i++){
        selectedSubgraphs[i] = {
          ...state.getSelectedS[i],
          ...state.getNewAprs[i],
          ...state.getDailyRewards[i],
          ...state.getDailyRewardsCuts[i],
          ...state.getFutureStakedTokens[i],
          ...state.getNewProportions[i],
        };
      }
      return selectedSubgraphs;
    },
    getFutureStakedTokens: (state) => {
      let futureStakedTokens = [];
      for(let i = 0; i < state.getSelectedS.length; i++){
        let subgraph = state.getSelectedS[i];
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
      for(let i = 0; i < state.getSelectedS.length; i++){
        let subgraph = state.getSelectedS[i];
        if(subgraph.currentSignalledTokens != "0") {
          newAprs[i] = { newApr: calculateNewApr(subgraph.currentSignalledTokens, state.getFutureStakedTokens[i].futureStakedTokens, networkStore, (state.newAllocations[subgraph.currentVersion.subgraphDeployment.ipfsHash] ? state.newAllocations[subgraph.currentVersion.subgraphDeployment.ipfsHash].toString() : "0"))};
        }else{
          newAprs[i] = { newApr: 0 };
        }
      }
      return newAprs;
    },
    getNewProportions: (state) => {
      let proportions = [];
      for(let i = 0; i < state.getSelectedS.length; i++){
        let subgraph = state.getSelectedS[i];
        console.log("FUTURE STAKED TOKENS");
        console.log(state.getFutureStakedTokens[i].futureStakedTokens.toString());
        const newAllocation = state.newAllocations[subgraph.currentVersion.subgraphDeployment.ipfsHash] ? state.newAllocations[subgraph.currentVersion.subgraphDeployment.ipfsHash] : 0;
        console.log(newAllocation);
        if(state.getFutureStakedTokens[i].futureStakedTokens.plus(new BigNumber(newAllocation*10**18)) > 0)
            proportions[i] = { newProportion: subgraph.currentSignalledTokens / state.getFutureStakedTokens[i].futureStakedTokens.plus(new BigNumber(newAllocation*10**18)) };
          else
            proportions[i] = { newProportion: 0 };
      }
      return proportions;
    },
    getDailyRewards: (state) => {
      let dailyRewards = [];
      for(let i = 0; i < state.getSelectedS.length; i++){
        let subgraph = state.getSelectedS[i];
        if(subgraph.currentVersion.subgraphDeployment.stakedTokens != "0" && !accountStore.loading) {
          dailyRewards[i] = { dailyRewards: calculateSubgraphDailyRewards(subgraph.currentSignalledTokens, state.getFutureStakedTokens[i].futureStakedTokens, networkStore, (state.newAllocations[subgraph.currentVersion.subgraphDeployment.ipfsHash] ? state.newAllocations[subgraph.currentVersion.subgraphDeployment.ipfsHash].toString() : "0")) }
        }else{
          dailyRewards[i] = { dailyRewards: 0 }
        }
      }
      return dailyRewards;
    },
    getDailyRewardsCuts: (state) => {
      let dailyRewardsCuts = [];
      for(let i = 0; i < state.getSelectedS.length; i++){
        let subgraph = state.getSelectedS[i];
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
    calculatedOpeningStake: (state) => {
      let total = 0;
      for(let i in state.getSelectedS){
        if(state.newAllocations[state.getSelectedS[i].currentVersion.subgraphDeployment.ipfsHash])
          total += parseInt(state.newAllocations[state.getSelectedS[i].currentVersion.subgraphDeployment.ipfsHash]);
        console.log(total);
      }
      return total;
    },
    avgAPR: (state) => {
      return allocationStore.totalRewardsPerYear.dividedBy(allocationStore.totalAllocatedStake.plus(state.availableStake));
    },
    availableStake: () => {
      return accountStore.availableStake;
    },
    calculatedAvailableStake: (state) => {
      let calc = BigNumber(state.availableStake).plus(allocationStore.calculatedClosingStake).minus(Web3.utils.toWei(state.calculatedOpeningStake.toString()));
      if(calc.toString() != "NaN")
        return calc
      else
        return BigNumber(0);
    },
    calculatedOpeningRewardsPerYear: (state) => {
      let totalRewardsPerYear = new BigNumber(0);

      if(state.getSelectedSubgraphs.length > 0) {
        for (const i in state.getSelectedSubgraphs) {
          let newAllocationSize = state.newAllocations[state.getSelectedSubgraphs[i].currentVersion.subgraphDeployment.ipfsHash] ? state.newAllocations[state.getSelectedSubgraphs[i].currentVersion.subgraphDeployment.ipfsHash] : 0;

          if (newAllocationSize) {
            let closingAllocation = allocationStore.getSelectedAllocations.find(e => {
              return e.subgraphDeployment.ipfsHash === state.getSelectedSubgraphs[i].currentVersion.subgraphDeployment.ipfsHash;
            });

            if (closingAllocation) {
              totalRewardsPerYear = totalRewardsPerYear.plus(
                  new BigNumber(state.getSelectedSubgraphs[i].currentSignalledTokens)
                      .dividedBy(networkStore.getTotalTokensSignalled)
                      .multipliedBy(networkStore.getIssuancePerYear)
                      .multipliedBy(newAllocationSize)
                      .dividedBy(new BigNumber(state.getSelectedSubgraphs[i].currentVersion.subgraphDeployment.stakedTokens).minus(closingAllocation.allocatedTokens).plus(new BigNumber(newAllocationSize).multipliedBy("1000000000000000000")))
              );
            } else {
              totalRewardsPerYear = totalRewardsPerYear.plus(
                  new BigNumber(state.getSelectedSubgraphs[i].currentSignalledTokens)
                      .dividedBy(networkStore.getTotalTokensSignalled)
                      .multipliedBy(networkStore.getIssuancePerYear)
                      .multipliedBy(newAllocationSize)
                      .dividedBy(new BigNumber(state.getSelectedSubgraphs[i].currentVersion.subgraphDeployment.stakedTokens).plus(new BigNumber(newAllocationSize).multipliedBy("1000000000000000000")))
              );

            }

          }
        }
      }
      return totalRewardsPerYear;
    },
    calculatedOpeningAPR: (state) => {
      return state.calculatedOpeningRewardsPerYear.dividedBy(state.calculatedOpeningStake);
    },
    calculatedAfterOpeningAPR: (state) => {
      let simulatedTotalStake = allocationStore.totalAllocatedStake.minus(allocationStore.calculatedClosingStake).plus(state.calculatedOpeningStake).plus(state.calculatedAvailableStake);
      let simulatedTotalRewardsPerYear = allocationStore.totalRewardsPerYear.minus(allocationStore.calculatedClosingRewardsPerYear).plus(state.calculatedOpeningRewardsPerYear);

      return simulatedTotalRewardsPerYear.dividedBy(simulatedTotalStake);
    },
    buildCommands: (state) => {
      let commands = "";
      for(const i in allocationStore.getSelectedAllocations){
        commands += `graph indexer rules delete ${allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash} --network ${chainStore.getActiveChain.id}\n`
      }
      for(const i in state.getSelectedS){
        if(state.newAllocations[state.getSelectedS[i].currentVersion.subgraphDeployment.ipfsHash] > 0)
          commands += `graph indexer rules set ${state.getSelectedS[i].currentVersion.subgraphDeployment.ipfsHash} allocationAmount ${state.newAllocations[state.getSelectedS[i].currentVersion.subgraphDeployment.ipfsHash]} decisionBasis always --network ${chainStore.getActiveChain.id}\n`
      }
      return commands;
    },
    actionsQueueBuildCommands: (state) => {
      let unallocate = "";
      let reallocate = "";
      let allocate = "";
      let skip = [];
      for(const i in allocationStore.getSelectedAllocations){
        if(Object.keys(state.newAllocations).includes(allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash)){
          reallocate += `graph indexer actions queue reallocate ${allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash} ${allocationStore.getSelectedAllocations[i].id} ${state.newAllocations[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash]} --network ${chainStore.getActiveChain.id}\n`
          skip.push(allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash);
        }else{
          unallocate += `graph indexer actions queue unallocate ${allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash} ${allocationStore.getSelectedAllocations[i].id} --network ${chainStore.getActiveChain.id}\n`
        }
      }
      for(const i in state.getSelectedS){
        if(state.newAllocations[state.getSelectedS[i].currentVersion.subgraphDeployment.ipfsHash] > 0 && !skip.includes(state.getSelectedS[i].currentVersion.subgraphDeployment.ipfsHash))
          allocate += `graph indexer actions queue allocate ${state.getSelectedS[i].currentVersion.subgraphDeployment.ipfsHash} ${state.newAllocations[state.getSelectedS[i].currentVersion.subgraphDeployment.ipfsHash]} --network ${chainStore.getActiveChain.id}\n`
      }
      return `${unallocate}${reallocate}${allocate}`;
    },
  },
  actions: {
    async update(){
      for(let i = 0; i < this.getSelectedSubgraphs.length; i++){
        this.newAllocations[this.getSelectedSubgraphs[i].currentVersion.subgraphDeployment.ipfsHash] ||= 0;
      }
    }
  },
})
