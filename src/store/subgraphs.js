import { defineStore } from 'pinia'

import gql from 'graphql-tag';
import Web3 from 'web3';
const BN = Web3.utils.BN;
import { useNetworkStore } from './network';
import { useAccountStore } from './accounts';
import { useSubgraphSettingStore } from './subgraphSettings';
import { useAllocationStore } from './allocations';
import { useChainStore } from './chains';
import { useDeploymentStatusStore } from './deploymentStatuses';
import { storeToRefs } from 'pinia';
const networkStore = useNetworkStore();
const accountStore = useAccountStore();
const allocationStore = useAllocationStore();
const chainStore = useChainStore();
const deploymentStatusStore = useDeploymentStatusStore();
accountStore.fetchData();
const subgraphSettingStore = useSubgraphSettingStore();
import BigNumber from "bignumber.js";
import { calculateNewApr, calculateSubgraphDailyRewards, maxAllo, indexerCut } from '@/plugins/commonCalcs';
import { upgradeIndexerClient } from '@/plugins/upgradeIndexerClient';

const { getDeploymentStatuses } = storeToRefs(deploymentStatusStore);

export const useSubgraphsStore = defineStore({
  id: 'subgraphs',
  state: () => ({
    subgraphs: [],
    selected: [],
    loading: false,
    upgradeIndexer: [],
  }),
  getters: {
    getDeploymentStatusesCall: () => {
      return getDeploymentStatuses.value;
    },
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
          return i.currentVersion.subgraphDeployment.manifest.network && subgraphSettingStore.settings.networkFilter.includes(i.currentVersion.subgraphDeployment.manifest.network);
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

      if(subgraphSettingStore.settings.statusFilter == 'all'){
        subgraphs = subgraphs.filter((i) => {
          return deploymentStatusStore.getDeploymentStatuses.find((o) => o.subgraph == i.currentVersion.subgraphDeployment.ipfsHash) != undefined;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'closable'){
        subgraphs = subgraphs.filter((i) => {
          let status = deploymentStatusStore.getDeploymentStatuses.find((o) => o.subgraph == i.currentVersion.subgraphDeployment.ipfsHash);
            if(status != undefined && status.synced == true && (status.fatalError == undefined || status.fatalError.deterministic == true))
              return true
          return false;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'healthy-synced'){
        subgraphs = subgraphs.filter((i) => {
          let status = deploymentStatusStore.getDeploymentStatuses.find((o) => o.subgraph == i.currentVersion.subgraphDeployment.ipfsHash);
            if(status != undefined && status.health == 'healthy' && status.synced == true)
              return true
          return false;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'syncing'){
        subgraphs = subgraphs.filter((i) => {
          let status = deploymentStatusStore.getDeploymentStatuses.find((o) => o.subgraph == i.currentVersion.subgraphDeployment.ipfsHash);
            if(status != undefined && status.health == 'healthy' && status.synced == false)
              return true
          return false;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'failed'){
        subgraphs = subgraphs.filter((i) => {
          let status = deploymentStatusStore.getDeploymentStatuses.find((o) => o.subgraph == i.currentVersion.subgraphDeployment.ipfsHash);
            if(status != undefined && status.health == 'failed')
              return true
          return false;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'non-deterministic'){
        subgraphs = subgraphs.filter((i) => {
          let status = deploymentStatusStore.getDeploymentStatuses.find((o) => o.subgraph == i.currentVersion.subgraphDeployment.ipfsHash);
            if(status != undefined && status.health == 'failed' && status.fatalError != undefined && status.fatalError.deterministic == false)
              return true
          return false;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'deterministic'){
        subgraphs = subgraphs.filter((i) => {
          let status = deploymentStatusStore.getDeploymentStatuses.find((o) => o.subgraph == i.currentVersion.subgraphDeployment.ipfsHash);
            if(status != undefined && status.health == 'failed' && status.fatalError != undefined && status.fatalError.deterministic == true)
              return true
          return false;
        });
      }

      if(subgraphSettingStore.settings.hideCurrentlyAllocated == true){
        subgraphs = subgraphs.filter((i) => {
          return !i.currentlyAllocated;
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
          ...state.getDeploymentStatuses[i],
          ...state.getUpgradeIndexer[i],
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
    getDeploymentStatuses: (state) => {
      let deploymentStatuses = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        let deploymentStatus = state.getDeploymentStatusesCall.find((e) => e.subgraph == state.subgraphs[i].currentVersion.subgraphDeployment.ipfsHash);
        if(deploymentStatus != undefined){
          if(deploymentStatus.health == 'failed' && deploymentStatus.fatalError && deploymentStatus.fatalError.deterministic == false){
            deploymentStatus.icon = 'mdi-refresh';
            deploymentStatus.color = 'yellow';
          }else if(deploymentStatus.health == 'failed' && deploymentStatus.fatalError && deploymentStatus.fatalError.deterministic == true){
            deploymentStatus.icon = 'mdi-close';
            deploymentStatus.color = 'red';
          }else if(deploymentStatus.health == 'healthy' && deploymentStatus.synced == true){
            deploymentStatus.icon = 'mdi-check';
            deploymentStatus.color = 'green';
          }else if(deploymentStatus.health == 'healthy' && deploymentStatus.synced == false){
            deploymentStatus.icon = 'mdi-minus';
            deploymentStatus.color = 'blue'
          }else{
            deploymentStatus.icon = 'mdi-help';
            deploymentStatus.color = 'default';
          }
          deploymentStatus.blocksBehindChainhead = deploymentStatus?.chains?.[0]?.chainHeadBlock?.number && deploymentStatus.chains?.[0]?.latestBlock?.number ? parseInt(deploymentStatus?.chains[0].chainHeadBlock.number) - parseInt(deploymentStatus.chains[0].latestBlock.number) : Number.MAX_SAFE_INTEGER;
          deploymentStatuses[i] = { deploymentStatus: deploymentStatus }
        }else{
          deploymentStatuses[i] = { deploymentStatus: { icon: 'mdi-close', color: 'default', blocksBehindChainhead: deploymentStatus?.chains?.[0]?.chainHeadBlock?.number && deploymentStatus?.chains?.[0]?.latestBlock?.number ? parseInt(deploymentStatus.chains[0].chainHeadBlock.number) - parseInt(deploymentStatus.chains[0].latestBlock.number) : Number.MAX_SAFE_INTEGER } }
        }
      }
      return deploymentStatuses;
    },
    getProportions: (state) => {
      let proportions = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        let subgraph = state.subgraphs[i];
        if(subgraph.currentVersion.subgraphDeployment.stakedTokens > 0)
            proportions[i] = { proportion: ( subgraph.currentVersion.subgraphDeployment.signalledTokens / networkStore.getTotalTokensSignalled ) / ( subgraph.currentVersion.subgraphDeployment.stakedTokens / networkStore.getTotalTokensAllocated ) };
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
    getSubgraphNetworks: (state) => {
      let networks = ["mainnet","arbitrum-one","matic"];
      for(let i = 0; i < state.subgraphs.length; i++){
        if(state.subgraphs[i]?.currentVersion?.subgraphDeployment?.manifest?.network && !networks.includes(state.subgraphs[i].currentVersion.subgraphDeployment.manifest.network) && state.subgraphs[i].currentVersion.subgraphDeployment.manifest.network != 'polygon'){
          networks.push(state.subgraphs[i].currentVersion.subgraphDeployment.manifest.network);
        }
      }
      return networks;
    },
    getUpgradeIndexer: (state) => {
      let upgradeIndexer = [];
      for(let i = 0; i < state.upgradeIndexer.length; i++){
        upgradeIndexer[i] = { upgradeIndexer: state.upgradeIndexer[i] }
      }
      return upgradeIndexer;
    },
  },
  actions: {
    async fetchNumEntities(subgraphId){
      let subgraph = this.getSubgraphs.find(e => e.currentVersion?.subgraphDeployment?.ipfsHash == subgraphId);
      if(subgraph?.upgradeIndexer && !subgraph?.upgradeIndexer?.loading && !subgraph?.upgradeIndexer?.loaded){
        subgraph.upgradeIndexer.loading = true;

        upgradeIndexerClient.query({
          query: gql`query  indexingStatuses($subgraphs: String!){
            indexingStatuses(subgraphs: [$subgraphs]){
              subgraph
              synced
              health
              entityCount
              fatalError {
                handler
                message
                deterministic
                block {
                  hash
                  number
                }
              }
              chains {
                network
                chainHeadBlock {
                  number
                  hash
                }
                earliestBlock {
                  number
                  hash
                }
                latestBlock {
                  number
                  hash
                }
                lastHealthyBlock {
                  hash
                  number
                }
              }
              node
            }
          }`,
          variables: {
            subgraphs: subgraph.currentVersion?.subgraphDeployment?.ipfsHash,
          }
        })
        .then((data) => {
          console.log(data);
          console.log(data.data?.indexingStatuses[0]?.entityCount);
          if(data.data?.indexingStatuses[0]?.entityCount)
            subgraph.upgradeIndexer.value = data.data.indexingStatuses[0].entityCount;
          subgraph.upgradeIndexer.loaded = true;
          subgraph.upgradeIndexer.loading = false;
        });
      }
      
    },
    async fetch(skip){
      console.log("Fetch " + skip);
      return chainStore.getNetworkSubgraphClient.query({
        query: gql`query subgraphs($skip: Int!){
          subgraphs (skip: $skip, first: 1000){
            id
            metadata{
              displayName
              image
            }
            createdAt
            currentSignalledTokens
            currentVersion{
              subgraphDeployment{
                ipfsHash
                indexingRewardAmount
                queryFeesAmount
                stakedTokens
                signalledTokens
                createdAt
                deniedAt
                manifest{
                  network
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
        if(networkStatus == 7 && data.subgraphs.length == 1000){
          return this.fetch(skip + data.subgraphs.length)
          .then((data1) => {
            let concatData = {};
            if(typeof data.subgraphs == "object" && typeof data1.subgraphs == "object")
            concatData.subgraphs = data.subgraphs.concat(data1.subgraphs).filter((s) => s.currentVersion);
            
            return concatData;
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
          let uniqueSubgraphs = []
          let subgraphs = [];
          for(let i = 0; i < data.subgraphs.length; i++){
            if(data.subgraphs[i].currentVersion?.subgraphDeployment?.ipfsHash && !uniqueSubgraphs.includes(data.subgraphs[i].currentVersion?.subgraphDeployment?.ipfsHash)){
              uniqueSubgraphs.push(data.subgraphs[i].currentVersion.subgraphDeployment.ipfsHash);
              subgraphs.push(data.subgraphs[i]);
            }
          }
          this.subgraphs = subgraphs;
          this.upgradeIndexer = Array(data.subgraphs.length).fill();
          for(let i = 0; i < this.upgradeIndexer.length; i++){
            this.upgradeIndexer[i] = { value: "0", loading: false, loaded: false };
          }
          this.loading = false;
        })
      });
      
      
    }
  }
})
