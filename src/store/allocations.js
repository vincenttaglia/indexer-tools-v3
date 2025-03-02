import { defineStore } from 'pinia'
import { useNetworkStore } from '@/store/network';
import { useAccountStore } from '@/store/accounts';
import { useChainStore } from '@/store/chains';
import { useDeploymentStatusStore } from './deploymentStatuses';
import gql from 'graphql-tag';
import moment from 'moment';
import BigNumber from 'bignumber.js';
import { storeToRefs } from 'pinia';
import { calculateApr, calculateReadableDuration, calculateAllocationDailyRewards, indexerCut } from '@/plugins/commonCalcs';
import { useSubgraphSettingStore } from './subgraphSettings';
import { useQosStore } from './qos';
import { useQueryFeesStore } from './queryFees';
import { useChainValidationStore } from './chainValidation';
import { useEpochStore } from './epochStore';

const networkStore = useNetworkStore();
const accountStore = useAccountStore();
const chainStore = useChainStore();
const deploymentStatusStore = useDeploymentStatusStore();
const subgraphSettingStore = useSubgraphSettingStore();
const qosStore = useQosStore();
const queryFeeStore = useQueryFeesStore();
const chainValidation = useChainValidationStore();
const epochStore = useEpochStore();

networkStore.init();
accountStore.fetchData()
.then(() => {
  deploymentStatusStore.init();
});
epochStore.init();
chainValidation.init();


export const useAllocationStore = defineStore('allocationStore', {
  state: () => ({
    allocations: [],
    pendingRewards: [],
    selected: [],
    loaded: false,
    loading: false,
    activateSynclist: false,
    activateBlacklist: false,
    networkFilter: [],
  }),
  getters: {
    loadingAll: (state) => {
      return state.loading || deploymentStatusStore.loading || qosStore.loading || queryFeeStore.loading
    },
    getFilteredAllocations: (state) => {
      let allocations = state.getAllocations;
      
      if(subgraphSettingStore.settings.statusFilter == 'all'){
        allocations = allocations.filter((i) => {
          return deploymentStatusStore.getDeploymentStatusDict[i.subgraphDeployment.ipfsHash] != undefined;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'closable'){
        allocations = allocations.filter((i) => {
          const status = deploymentStatusStore.getDeploymentStatusDict[i.subgraphDeployment.ipfsHash];
          if(status != undefined && status.synced == true && (status.fatalError == undefined || status.fatalError.deterministic == true))
            return true
          return false;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'healthy-synced'){
        allocations = allocations.filter((i) => {
          const status = deploymentStatusStore.getDeploymentStatusDict[i.subgraphDeployment.ipfsHash];
          if(status != undefined && status.health == 'healthy' && status.synced == true)
            return true
          return false;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'syncing'){
        allocations = allocations.filter((i) => {
          const status = deploymentStatusStore.getDeploymentStatusDict[i.subgraphDeployment.ipfsHash];
          if(status != undefined && status.health == 'healthy' && status.synced == false)
            return true
          return false;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'failed'){
        allocations = allocations.filter((i) => {
          const status = deploymentStatusStore.getDeploymentStatusDict[i.subgraphDeployment.ipfsHash];
          if(status != undefined && status.health == 'failed')
            return true
          return false;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'non-deterministic'){
        allocations = allocations.filter((i) => {
          const status = deploymentStatusStore.getDeploymentStatusDict[i.subgraphDeployment.ipfsHash];
          if(status != undefined && status.health == 'failed' && status.fatalError != undefined && status.fatalError.deterministic == false)
            return true
          return false;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'deterministic'){
        allocations = allocations.filter((i) => {
          const status = deploymentStatusStore.getDeploymentStatusDict[i.subgraphDeployment.ipfsHash];
          if(status != undefined && status.health == 'failed' && status.fatalError != undefined && status.fatalError.deterministic == true)
            return true
          return false;
        });
      }

      // Blacklist Filter
      if(state.activateBlacklist) {
        allocations = allocations.filter((i) => {
          return !subgraphSettingStore.settings.subgraphBlacklist.includes(i.subgraphDeployment.ipfsHash);
        });
      }

      // Synclist Filter
      if(state.activateSynclist) {
        allocations = allocations.filter((i) => {
          return subgraphSettingStore.settings.subgraphSynclist.includes(i.subgraphDeployment.ipfsHash);
        });
      }

      // Network Filter
      if(state.networkFilter.length) {
        allocations = allocations.filter((i) => {
          return i.subgraphDeployment.manifest.network && state.networkFilter.includes(i.subgraphDeployment.manifest.network);
        });
      }

      return allocations;
    },
    getSelectedFilteredAllocations: (state) => {
      let allocations = [];
      for(let i = 0; i < state.selected.length; i++){
        let allocation = state.getFilteredAllocations.find((e) => e.id == state.selected[i]);
        if(allocation){
          allocations[i] = {
            ...allocation,
          }
        }
      }
      return allocations;
    },
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
          ...state.getDeploymentStatuses[i],
          ...state.getQosDatas[i],
          ...state.getQueryFeeDatas[i],
          ...state.getStatusChecks[i],
        };
      }
      console.log(state.allocations);
      console.log(allocations);
      return allocations;
    },
    getSelectedAllocations: (state) => {
      let allocations = [];
      for(let i = 0; i < state.selected.length; i++){
        let allocation = state.allocations.find((e) => e.id == state.selected[i]);
        allocations[i] = {
          ...allocation,
        }
      }
      return allocations;
    },
    getQosDatas: (state) => {
      let qosDatas = [];
      for(let i = 0; i < state.allocations.length; i++){
        const qos = qosStore.getQosDict[state.allocations[i].subgraphDeployment.ipfsHash];
        if(qos){
          qosDatas[i] = { qos: qos };
        }else{
          qosDatas[i] = { };
        }
      }
      return qosDatas;
    },
    getQueryFeeDatas: (state) => {
      let queryFeeDatas = [];
      for(let i = 0; i < state.allocations.length; i++){
        const queryFeeData = queryFeeStore.getQueryFeeDict[state.allocations[i].subgraphDeployment.ipfsHash];
        if(queryFeeData){
          queryFeeDatas[i] = { queryFees: queryFeeData }
        }else{
          queryFeeDatas[i] = { }
        }
      }
      return queryFeeDatas;
    },
    getStatusChecks: (state) => {
      let statusChecksData = [];
      for(let i = 0; i < state.allocations.length; i++){
        const deploymentStatus = deploymentStatusStore.getDeploymentStatusDict[state.allocations[i].subgraphDeployment.ipfsHash];

        const validChain = accountStore.getPOIQueryStatus ? chainValidation.getChainStatus[state.allocations[i].subgraphDeployment.manifest.network] : null;
        const synced = epochStore.getBlockNumbers[state.allocations[i].subgraphDeployment.manifest.network] <= deploymentStatus?.chains?.[0]?.latestBlock?.number;
        const deterministicFailure = synced ? null : deploymentStatus?.health == 'failed' && deploymentStatus?.fatalError && deploymentStatus?.fatalError?.deterministic == true;

        let deterministicSameBlock = null;
        if(deterministicFailure && !synced){
          const upgradeIndexerFailedStatus = deploymentStatusStore.getUpgradeIndexerFailedStatus[state.allocations[i].subgraphDeployment.ipfsHash];
          deterministicSameBlock = 
            upgradeIndexerFailedStatus?.health == 'failed'
            && upgradeIndexerFailedStatus?.fatalError
            && upgradeIndexerFailedStatus?.fatalError?.deterministic == true
            && upgradeIndexerFailedStatus?.fatalError?.block?.hash == deploymentStatus?.fatalError?.block?.hash;
        }
        let statusChecks = {
          synced: synced,
          deterministicFailure: deterministicFailure,
          deterministicSameBlock: deterministicSameBlock,
          validChain: validChain,
        };
        statusChecksData[i] = { statusChecks: statusChecks };
      }
      return statusChecksData;
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
        epochDurations[i] = { epochDuration:networkStore.getCurrentEpoch - allocation.createdAtEpoch };
      }
      return epochDurations;
    },
    getProportions: (state) => {
      let proportions = [];
      for(let i = 0; i < state.allocations.length; i++){
        let allocation = state.allocations[i];
        if (allocation.subgraphDeployment.stakedTokens > 0)
          proportions[i] = { proportion: ( allocation.subgraphDeployment.signalledTokens / networkStore.getTotalTokensSignalled ) / ( allocation.subgraphDeployment.stakedTokens / networkStore.getTotalTokensAllocated ) };
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
    getDeploymentStatuses: (state) => {
      let deploymentStatuses = [];
      for(let i = 0; i < state.allocations.length; i++){
        deploymentStatuses[i] = { deploymentStatus: deploymentStatusStore.getDeploymentStatusDict[state.allocations[i].subgraphDeployment.ipfsHash] || deploymentStatusStore.getBlankStatus }
      }
      return deploymentStatuses;
    },
    getSubgraphNetworks: (state) => {
      let networks = ["mainnet","arbitrum-one","matic"];
      for(let i = 0; i < state.allocations.length; i++){
        if(state.allocations[i]?.subgraphDeployment?.manifest?.network && !networks.includes(state.allocations[i].subgraphDeployment.manifest.network) && state.allocations[i].subgraphDeployment.manifest.network != 'polygon'){
          networks.push(state.allocations[i].subgraphDeployment.manifest.network);
        }
      }
      return networks;
    },
    totalAllocatedStake: (state) => {
      let totalAllocatedStake = new BigNumber(0);
      if(state.allocations.length > 0){
        for(const i in state.allocations){
          totalAllocatedStake = totalAllocatedStake.plus(state.allocations[i].allocatedTokens);
        }
      }
      return totalAllocatedStake;
    },
    totalRewardsPerYear: (state) => {
      let totalRewardsPerYear = new BigNumber(0);
      if(state.allocations.length > 0){
        for(const i in state.allocations){
          if(!new BigNumber(state.allocations[i].allocatedTokens).isEqualTo(new BigNumber(0)) && !new BigNumber(state.allocations[i].subgraphDeployment.signalledTokens).isEqualTo(new BigNumber(0)) && !state.allocations[i].subgraphDeployment.deniedAt){
            totalRewardsPerYear = totalRewardsPerYear.plus(
                new BigNumber(state.allocations[i].subgraphDeployment.signalledTokens)
                    .dividedBy(networkStore.getTotalTokensSignalled)
                    .multipliedBy(networkStore.getIssuancePerYear)
                    .multipliedBy(
                        new BigNumber(state.allocations[i].allocatedTokens).dividedBy(state.allocations[i].subgraphDeployment.stakedTokens)
                    )
            );
          }
        }
      }
      return totalRewardsPerYear;
    },
    avgAPR: (state) => {
      return state.totalRewardsPerYear.dividedBy(state.totalAllocatedStake.plus(accountStore.availableStake));
    },
    calculatedClosingRewardsPerYear: (state) => {
      let totalRewardsPerYear = new BigNumber(0);
      if(state.selected.length > 0){
        for(const i in state.selected){
          let allocation = state.allocations.find((e) => e.id == state.selected[i]);
          if(!allocation.subgraphDeployment.deniedAt){
            totalRewardsPerYear = totalRewardsPerYear.plus(
              new BigNumber(allocation.subgraphDeployment.signalledTokens)
                  .dividedBy(networkStore.getTotalTokensSignalled)
                  .multipliedBy(networkStore.getIssuancePerYear)
                  .multipliedBy(
                      new BigNumber(allocation.allocatedTokens).dividedBy(allocation.subgraphDeployment.stakedTokens)
                  )
            );
          }
          
        }
      }
      return totalRewardsPerYear;
    },
    calculatedClosingStake: (state) => {
      let totalAllocatedStake = new BigNumber(0);
      if(state.selected.length > 0){
        for(const i in state.selected){
          totalAllocatedStake = totalAllocatedStake.plus(state.allocations.find((e) => e.id == state.selected[i]).allocatedTokens);
        }
      }
      return totalAllocatedStake;
    },
    closingAvgAPR: (state) => {
      return state.calculatedClosingRewardsPerYear.dividedBy(state.calculatedClosingStake);
    },
    pendingRewardsCutSum: (state) => {
      return state.getAllocations.reduce((sum, cur) => cur.pendingRewardsCut && !cur.subgraphDeployment.deniedAt ? sum.plus(cur.pendingRewardsCut): sum, new BigNumber(0));
    },
    pendingRewardsSum: (state) => {
      console.log("PENDING REWARDS");
      console.log(state.getPendingRewards);
      return state.getAllocations.reduce((sum, cur) => cur.pendingRewards.loaded && !cur.subgraphDeployment.deniedAt ? sum.plus(cur.pendingRewards.value) : sum, new BigNumber(0));
    },
    dailyRewardsCutSum: (state) => {
      return state.getAllocations.reduce((sum, cur) => cur.subgraphDeployment.deniedAt ? sum : sum.plus(cur.dailyRewardsCut), new BigNumber(0));
    },
    dailyRewardsSum: (state) => {
      return state.getAllocations.reduce((sum, cur) => cur.subgraphDeployment.deniedAt ? sum : sum.plus(cur.dailyRewards), new BigNumber(0));
    },
  },
  actions: {
    async fetchAllPendingRewards(){
      for(let i = 0; i < this.getAllocations.length; i++){
        let allocation = this.getAllocations[i];
        if(!allocation.pendingRewards.loading && !allocation.pendingRewards.loaded)
          allocation.pendingRewards.loading = true;
      }
      let y = 0;
      while(y < this.getAllocations.length){
        const max = y + 50 < this.getAllocations.length ? y + 50 : this.getAllocations.length;
        let batch = new chainStore.getActiveChain.web3.BatchRequest();
        for(let i = y; i < max; i++){
          let allocation = this.getAllocations[i];
          if(allocation.pendingRewards.loading && !allocation.pendingRewards.loaded){
            batch.add(chainStore.getRewardsContract.methods.getRewards(allocation.id).call.request(function(error, value){
              if(value != undefined){
                allocation.pendingRewards.value = BigNumber(value);
                allocation.pendingRewards.loaded = true;
              }
              
              allocation.pendingRewards.loading = false;
            }));
          }
        }
        await batch.execute();

        y = y + 50 < this.getAllocations.length ? y + 50 : this.getAllocations.length;
        if(y < this.getAllocations.length - 1){
            await new Promise(r => setTimeout(r, 1500));
        }
      }
    },
    async fetchPendingRewards(allocationId){
      let allocation = this.getAllocations.find(e => e.id == allocationId);

      if(!allocation.pendingRewards.loading && !allocation.pendingRewards.loaded){

        allocation.pendingRewards.loading = true;

        chainStore.getRewardsContract.methods.getRewards(allocation.id).call(function(error, value){
          if(value != undefined){
            allocation.pendingRewards.value = BigNumber(value);
            allocation.pendingRewards.loaded = true;
          }
          
          allocation.pendingRewards.loading = false;
        })
      }
    },
    async init(){
      if(!this.loaded && !this.loading)
        return this.fetchData();
    },
    async fetchData(){
      this.loading = true;
      const fetch = networkStore.init().then(() => {
        this.fetch(0)
        .then((data) => {
          console.log(data);
          this.allocations = data.allocations;
          this.pendingRewards = Array(data.allocations.length).fill();
          for(let i = 0; i < this.pendingRewards.length; i++){
            this.pendingRewards[i] = { value: BigNumber(0), loading: false, loaded: false };
          }
          return this.allocations;
        });
      });
      const qos = qosStore.fetchData();
      const queryFees = queryFeeStore.fetchData();
      return Promise.all([fetch, qos, queryFees]).then(() => {
        this.loaded = true;
        this.loading = false;
      });
    },
    async fetch(skip){
      this.selected = [];
      console.log("Fetch " + skip);
      return chainStore.getNetworkSubgraphClient.query({
        query: gql`query allocations($indexer: String!, $skip: Int!){
          allocations(first: 1000, where: {activeForIndexer_contains_nocase: $indexer, status: Active}, orderBy:createdAtBlockNumber, orderDirection:desc, skip: $skip){
            id
            activeForIndexer{
              id
            }
            subgraphDeployment{
              versions(first:1, orderBy:version, orderDirection:desc){
                subgraph{
                  id
                  metadata{
                    image
                    displayName
                  }
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
              manifest{
                network
              }
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
          indexer: accountStore.getActiveAccount.address,
          skip: skip
        },
      })
      .then(({ data, networkStatus }) => {
        console.log(data);
        if(networkStatus == 7 && data.allocations.length == 1000){
          return this.fetch(skip + data.allocations.length)
          .then((data1) => {
            let concatData = {};
            console.log(data1);
            if(typeof data.allocations == "object" && typeof data1.allocations == "object")
              concatData.allocations = data.allocations.concat(data1.allocations);
            
            return concatData;
          })
        }
        return data;
      }).catch((err) => {
        this.loading = false;
        if(err.graphQLErrors[0]?.message){
          console.error(`Allocations API error: ${err.graphQLErrors[0].message}`)
          alert(`Allocations API Error: ${err.graphQLErrors[0].message}`);
        }
        if(err.message){
          console.error(`Allocations query error: ${err.message}`);
          alert(`Allocations Error: ${err.message}`);
        }
      });
    }
  }
})
