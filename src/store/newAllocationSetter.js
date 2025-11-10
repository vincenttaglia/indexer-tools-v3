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
    minAllocation: 0,
    minAllocation0Signal: 0,
    customPOIs: {},
    customBlockHeights: {},
    customPublicPOIs: {},
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
        let associatedAllocation = allocationStore.getSelectedAllocations.find((e) => e.subgraphDeployment.ipfsHash == subgraph.deployment.ipfsHash);
        if(associatedAllocation){
          futureStakedTokens[i] = { futureStakedTokens: new BigNumber(subgraph.deployment.stakedTokens).minus(associatedAllocation.allocatedTokens) };
        }else{
          futureStakedTokens[i] = { futureStakedTokens: new BigNumber(subgraph.deployment.stakedTokens) };
        }
      }
      return futureStakedTokens;
    },
    getNewAprs: (state) => {
      let newAprs = [];
      for(let i = 0; i < state.getSelectedS.length; i++){
        let subgraph = state.getSelectedS[i];
        if(subgraph.deployment.signalledTokens != "0") {
          newAprs[i] = { newApr: calculateNewApr(subgraph.deployment.signalledTokens, state.getFutureStakedTokens[i].futureStakedTokens, networkStore, (state.newAllocations[subgraph.deployment.ipfsHash] ? state.newAllocations[subgraph.deployment.ipfsHash].toString() : "0"))};
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
        const newAllocation = state.newAllocations[subgraph.deployment.ipfsHash] ? state.newAllocations[subgraph.deployment.ipfsHash] : 0;
        console.log(newAllocation);
        if(state.getFutureStakedTokens[i].futureStakedTokens.plus(new BigNumber(newAllocation*10**18)) > 0)
            proportions[i] = { newProportion: ( subgraph.deployment.signalledTokens / networkStore.getTotalTokensSignalled ) / ( state.getFutureStakedTokens[i].futureStakedTokens.plus(new BigNumber(newAllocation*10**18)) / networkStore.getTotalTokensAllocated ) };
          else
            proportions[i] = { newProportion: 0 };
      }
      return proportions;
    },
    getDailyRewards: (state) => {
      let dailyRewards = [];
      for(let i = 0; i < state.getSelectedS.length; i++){
        let subgraph = state.getSelectedS[i];
        if(subgraph.deployment.stakedTokens != "0" && !accountStore.loading) {
          dailyRewards[i] = { dailyRewards: calculateSubgraphDailyRewards(subgraph.deployment.signalledTokens, state.getFutureStakedTokens[i].futureStakedTokens, networkStore, (state.newAllocations[subgraph.deployment.ipfsHash] ? state.newAllocations[subgraph.deployment.ipfsHash].toString() : "0")) }
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
        if (subgraph.deployment.stakedTokens > 0 && !accountStore.loading){
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
        if(state.newAllocations[state.getSelectedS[i].deployment.ipfsHash])
          total += parseInt(state.newAllocations[state.getSelectedS[i].deployment.ipfsHash]);
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
      let calc = BigNumber(state.availableStake)
        .plus(allocationStore.calculatedClosingStake)
        .minus(Web3.utils.toWei(state.calculatedOpeningStake.toString()))
        .integerValue(BigNumber.ROUND_FLOOR);
      if(calc.toString() != "NaN")
        return calc
      else
        return BigNumber(0);
    },
    calculatedOpeningRewardsPerYear: (state) => {
      let totalRewardsPerYear = new BigNumber(0);

      if(state.getSelectedSubgraphs.length > 0) {
        for (const i in state.getSelectedSubgraphs) {
          if(!state.getSelectedSubgraphs[i].deployment.deniedAt){
            let newAllocationSize = state.newAllocations[state.getSelectedSubgraphs[i].deployment.ipfsHash] ? state.newAllocations[state.getSelectedSubgraphs[i].deployment.ipfsHash] : 0;

            if (newAllocationSize) {
              let closingAllocation = allocationStore.getSelectedAllocations.find(e => {
                return e.subgraphDeployment.ipfsHash === state.getSelectedSubgraphs[i].deployment.ipfsHash;
              });

              if (closingAllocation) {
                totalRewardsPerYear = totalRewardsPerYear.plus(
                    new BigNumber(state.getSelectedSubgraphs[i].deployment.signalledTokens)
                        .dividedBy(networkStore.getTotalTokensSignalled)
                        .multipliedBy(networkStore.getIssuancePerYear)
                        .multipliedBy(newAllocationSize)
                        .dividedBy(new BigNumber(state.getSelectedSubgraphs[i].deployment.stakedTokens).minus(closingAllocation.allocatedTokens).plus(new BigNumber(newAllocationSize).multipliedBy("1000000000000000000")))
                );
              } else {
                totalRewardsPerYear = totalRewardsPerYear.plus(
                    new BigNumber(state.getSelectedSubgraphs[i].deployment.signalledTokens)
                        .dividedBy(networkStore.getTotalTokensSignalled)
                        .multipliedBy(networkStore.getIssuancePerYear)
                        .multipliedBy(newAllocationSize)
                        .dividedBy(new BigNumber(state.getSelectedSubgraphs[i].deployment.stakedTokens).plus(new BigNumber(newAllocationSize).multipliedBy("1000000000000000000")))
                );

              }

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
    calculatedSelectedMaxAllos: (state) => {
      let selectedMaxAllos = new BigNumber(0);
      if(state.getSelectedSubgraphs.length > 0) {
        for (const i in state.getSelectedSubgraphs) {
          if(!state.getSelectedSubgraphs[i].deployment.deniedAt && state.getSelectedSubgraphs[i].deployment.signalledTokens > 0 && state.getSelectedSubgraphs[i].maxAllo > 0){
            selectedMaxAllos = selectedMaxAllos.plus(BigNumber(state.getSelectedSubgraphs[i].maxAllo));
          }
        }
      }
      return selectedMaxAllos;
    },
    buildCommands: (state) => {
      let commands = "";
      for(const i in allocationStore.getSelectedAllocations){
        commands += `graph indexer rules delete ${allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash} --network ${chainStore.getActiveChain.id}\n`
      }
      for(const i in state.getSelectedS){
        if(state.newAllocations[state.getSelectedS[i].deployment.ipfsHash] > 0)
          commands += `graph indexer rules set ${state.getSelectedS[i].deployment.ipfsHash} allocationAmount ${state.newAllocations[state.getSelectedS[i].deployment.ipfsHash]} decisionBasis always --network ${chainStore.getActiveChain.id}\n`
      }
      return commands;
    },
    actionsQueueBuildCommands: (state) => {
      let unallocate = "";
      let reallocate = "";
      let allocate = "";
      let reallocate2 = "";
      let skip = [];
      for(const i in allocationStore.getSelectedAllocations){
        let customPOI = "";
        if(state.customPOIs[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash]){
          if(state.customPOIs[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash] == "0x0"){
            customPOI = "0x0000000000000000000000000000000000000000000000000000000000000000 true 0 0x0000000000000000000000000000000000000000000000000000000000000000 ";
          } else{
            customPOI = `${state.customPOIs[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash]} true ${state.customBlockHeights[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash]} ${state.customPublicPOIs[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash]} `;
          }
        }
        if(subgraphStore.selected.includes(allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash)){
          if(BigNumber(allocationStore.getSelectedAllocations[i].allocatedTokens).dividedBy(10**18).gt(BigNumber(state.newAllocations[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash]))){
            reallocate += `graph indexer actions queue reallocate ${allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash} ${allocationStore.getSelectedAllocations[i].id} ${state.newAllocations[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash]} ${customPOI}--network ${chainStore.getActiveChain.id}\n`;
          } else{
            reallocate2 += `graph indexer actions queue reallocate ${allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash} ${allocationStore.getSelectedAllocations[i].id} ${state.newAllocations[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash]} ${customPOI}--network ${chainStore.getActiveChain.id}\n`;
          }
          skip.push(allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash);
        }else{
          unallocate += `graph indexer actions queue unallocate ${allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash} ${allocationStore.getSelectedAllocations[i].id} ${customPOI}--network ${chainStore.getActiveChain.id}\n`
        }
      }
      for(const i in state.getSelectedS){
        if(state.newAllocations[state.getSelectedS[i].deployment.ipfsHash] > 0 && !skip.includes(state.getSelectedS[i].deployment.ipfsHash))
          allocate += `graph indexer actions queue allocate ${state.getSelectedS[i].deployment.ipfsHash} ${state.newAllocations[state.getSelectedS[i].deployment.ipfsHash]} --network ${chainStore.getActiveChain.id}\n`
      }
      return `${unallocate}${reallocate}${allocate}${reallocate2}`;
    },
    actionsQueueBuildAPIObject: (state) => {
      let unallocate = [];
      let reallocate = [];
      let allocate = [];
      let skip = [];
      for(const i in allocationStore.getSelectedAllocations){
        let allo = {};
        if(subgraphStore.selected.includes(allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash)){
          //console.log("CHECK");
          //console.log(BigNumber(allocationStore.getSelectedAllocations[i].allocatedTokens).dividedBy(10**18).toString());
          //console.log(state.newAllocations[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash]);
          if(BigNumber(allocationStore.getSelectedAllocations[i].allocatedTokens).dividedBy(10**18).gt(BigNumber(state.newAllocations[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash]))){
            allo = {
              status: 'queued',
              type: 'reallocate',
              deploymentID: allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash,
              allocationID: allocationStore.getSelectedAllocations[i].id,
              amount: state.newAllocations[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash].toString(),
              protocolNetwork: chainStore.getActiveChain.id,
              source: 'Indexer Tools - Agent Connect',
              reason: 'Allocation Wizard',
              priority: 1,
              isLegacy: allocationStore.getSelectedAllocations[i].isLegacy,
            };
          } else{
            allo = {
              status: 'queued',
              type: 'reallocate',
              deploymentID: allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash,
              allocationID: allocationStore.getSelectedAllocations[i].id,
              amount: state.newAllocations[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash].toString(),
              protocolNetwork: chainStore.getActiveChain.id,
              source: 'Indexer Tools - Agent Connect',
              reason: 'Allocation Wizard',
              priority: 2,
              isLegacy: allocationStore.getSelectedAllocations[i].isLegacy,
            };
          }
          if(state.customPOIs[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash]){
            allo.poi = state.customPOIs[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash]
            allo.poiBlockNumber = parseInt(state.customBlockHeights[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash])
            allo.publicPOI = state.customPublicPOIs[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash]
            allo.force = true;
          }
          reallocate.push(allo);
          skip.push(allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash);
        }else{
          allo = {
            status: 'queued',
            type: 'unallocate',
            deploymentID: allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash,
            allocationID: allocationStore.getSelectedAllocations[i].id,
            protocolNetwork: chainStore.getActiveChain.id,
            source: 'Indexer Tools - Agent Connect',
            reason: 'Allocation Wizard',
            priority: 1,
            isLegacy: allocationStore.getSelectedAllocations[i].isLegacy,
          };
          if(state.customPOIs[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash]){
            if(state.customPOIs[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash] == "0x0"){
              allo.poi = "0x0000000000000000000000000000000000000000000000000000000000000000";
              allo.poiBlockNumber = 0 ;
              allo.publicPOI = "0x0000000000000000000000000000000000000000000000000000000000000000";
            } else{
              allo.poi = state.customPOIs[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash]
              allo.poiBlockNumber = parseInt(state.customBlockHeights[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash])
              allo.publicPOI = state.customPublicPOIs[allocationStore.getSelectedAllocations[i].subgraphDeployment.ipfsHash]
            }
            allo.force = true;
          }
          unallocate.push(allo);
        }
      }
      for(const i in state.getSelectedS){
        if(state.newAllocations[state.getSelectedS[i].deployment.ipfsHash] > 0 && !skip.includes(state.getSelectedS[i].deployment.ipfsHash)){
          allocate.push({
            status: 'queued',
            type: 'allocate',
            deploymentID: state.getSelectedS[i].deployment.ipfsHash,
            amount: state.newAllocations[state.getSelectedS[i].deployment.ipfsHash].toString(),
            protocolNetwork: chainStore.getActiveChain.id,
            source: 'Indexer Tools - Agent Connect',
            reason: 'Allocation Wizard',
            priority: 2,
            isLegacy: !networkStore.isNetworkHorizon,
          });
        }
          
      }
      return unallocate.concat(reallocate).concat(allocate);
    },
  },
  actions: {
    async update(){
      for(let i = 0; i < this.getSelectedSubgraphs.length; i++){
        if(this.getSelectedSubgraphs[i].deployment.signalledTokens == 0)
          this.newAllocations[this.getSelectedSubgraphs[i].deployment.ipfsHash] ||= this.minAllocation0Signal;
        else
          this.newAllocations[this.getSelectedSubgraphs[i].deployment.ipfsHash] ||= this.minAllocation;
      }
    },
    async setMinimums(){
      for(let i = 0; i < this.getSelectedSubgraphs.length; i++){
        if(this.getSelectedSubgraphs[i].deployment.signalledTokens > 0 && !this.getSelectedSubgraphs[i].deployment.deniedAt && this.newAllocations[this.getSelectedSubgraphs[i].deployment.ipfsHash] < this.minAllocation)
          this.newAllocations[this.getSelectedSubgraphs[i].deployment.ipfsHash] = this.minAllocation;
      }
    },
    async setMinimums0Signal(){
      for(let i = 0; i < this.getSelectedSubgraphs.length; i++){
        if((this.getSelectedSubgraphs[i].deployment.signalledTokens == 0 || this.getSelectedSubgraphs[i].deployment.deniedAt) && this.newAllocations[this.getSelectedSubgraphs[i].deployment.ipfsHash] < this.minAllocation0Signal)
          this.newAllocations[this.getSelectedSubgraphs[i].deployment.ipfsHash] = this.minAllocation0Signal;
      }
    },
    async setAllMinimums(){
      return new Promise([this.setMinimums(), this.setMinimums0Signal()]);
    },
    async setAllMaxAllos(){
      for(let i = 0; i < this.getSelectedSubgraphs.length; i++){
        if(this.getSelectedSubgraphs[i].maxAllo != Number.MIN_SAFE_INTEGER && Math.floor(this.getSelectedSubgraphs[i].maxAllo) > 0)
          this.newAllocations[this.getSelectedSubgraphs[i].deployment.ipfsHash] = Math.floor(this.getSelectedSubgraphs[i].maxAllo);
      }
    },
    async resetAllos(){
      for(let i = 0; i < this.getSelectedSubgraphs.length; i++){
      this.newAllocations[this.getSelectedSubgraphs[i].deployment.ipfsHash] = 0;
      }
    },
  },
})
