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
import { useQueryFeesStore } from './queryFees';
import { storeToRefs } from 'pinia';
const networkStore = useNetworkStore();
const accountStore = useAccountStore();
const allocationStore = useAllocationStore();
const chainStore = useChainStore();
const deploymentStatusStore = useDeploymentStatusStore();
const queryFeeStore = useQueryFeesStore();
accountStore.fetchData();
const subgraphSettingStore = useSubgraphSettingStore();
import BigNumber from "bignumber.js";
import { calculateNewApr, calculateSubgraphDailyRewards, maxAllo, indexerCut } from '@/plugins/commonCalcs';
import { upgradeIndexerClient } from '@/plugins/upgradeIndexerClient';

const { getDeploymentStatuses } = storeToRefs(deploymentStatusStore);

const SUBGRAPH_QUERY = gql`query subgraphDeploymentManifests($skip: Int!, $minSignal: Int!, $networks: [String]){
  subgraphDeploymentManifests(
    skip: $skip,
    first: 1000,
    where: {deployment_: {signalledTokens_gt: $minSignal}, network_in: $networks}
  ) {
    deployment {
      id
      deniedAt
      createdAt
      indexingRewardAmount
      ipfsHash
      queryFeesAmount
      signalledTokens
      stakedTokens
      manifest {
        network
        poweredBySubstreams
      }
      versions(first: 1, orderBy: version, orderDirection: desc) {
        metadata {
          subgraphVersion {
            subgraph {
              metadata {
                displayName
                image
                description
              }
            }
          }
        }
      }
    }
  }
}`;

const SUBGRAPH_QUERY_NO_NETWORK_FILTER = gql`query subgraphDeploymentManifests($skip: Int!, $minSignal: Int!){
  subgraphDeploymentManifests(
    skip: $skip,
    first: 1000,
    where: {deployment_: {signalledTokens_gt: $minSignal}}
  ) {
    deployment {
      id
      deniedAt
      createdAt
      indexingRewardAmount
      ipfsHash
      queryFeesAmount
      signalledTokens
      stakedTokens
      manifest {
        network
        poweredBySubstreams
      }
      versions(first: 1, orderBy: version, orderDirection: desc) {
        metadata {
          subgraphVersion {
            subgraph {
              metadata {
                displayName
                image
                description
              }
            }
          }
        }
      }
    }
  }
}`;

export const useSubgraphsStore = defineStore({
  id: 'subgraphs',
  state: () => ({
    subgraphs: [],
    selected: [],
    loading: false,
    upgradeIndexer: [],
  }),
  getters: {
    loadingAll: (state) =>{
      return state.loading || deploymentStatusStore.loading || queryFeeStore.loading;
    },
    getFilteredSubgraphs: (state) => {
      let subgraphs = state.getSubgraphs;
      
      if(subgraphSettingStore.settings.noRewardsFilter === 0){
        subgraphs = subgraphs.filter((i) => {
          return !i.deployment.deniedAt;
        });
      } else if(subgraphSettingStore.settings.noRewardsFilter === 2){
        subgraphs = subgraphs.filter((i) => {
          return i.deployment.deniedAt;
        });
      }

      if(subgraphSettingStore.settings.networkFilter.length) {
        subgraphs = subgraphs.filter((i) => {
          return i.deployment.manifest.network && subgraphSettingStore.settings.networkFilter.includes(i.deployment.manifest.network);
        });
      }

      if(subgraphSettingStore.settings.activateBlacklist) {
        subgraphs = subgraphs.filter((i) => {
          return !subgraphSettingStore.settings.subgraphBlacklist.includes(i.deployment.ipfsHash);
        });
      }

      if(subgraphSettingStore.settings.activateSynclist) {
        subgraphs = subgraphs.filter((i) => {
          return subgraphSettingStore.settings.subgraphSynclist.includes(i.deployment.ipfsHash);
        });
      }

      if(parseInt(subgraphSettingStore.settings.maxSignal)){
        subgraphs = subgraphs.filter((i) => {
          return BigNumber(i.deployment.signalledTokens).isLessThanOrEqualTo(new BigNumber(Web3.utils.toWei(subgraphSettingStore.settings.maxSignal)));
        });
      }

      if(parseInt(subgraphSettingStore.settings.minSignal)){
        subgraphs = subgraphs.filter((i) => {
          return BigNumber(i.deployment.signalledTokens).isGreaterThanOrEqualTo(new BigNumber(Web3.utils.toWei(subgraphSettingStore.settings.minSignal)));
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'all'){
        subgraphs = subgraphs.filter((i) => {
          return deploymentStatusStore.getDeploymentStatuses.find((o) => o.subgraph == i.deployment.ipfsHash) != undefined;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'closable'){
        subgraphs = subgraphs.filter((i) => {
          let status = deploymentStatusStore.getDeploymentStatuses.find((o) => o.subgraph == i.deployment.ipfsHash);
            if(status != undefined && status.synced == true && (status.fatalError == undefined || status.fatalError.deterministic == true))
              return true
          return false;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'healthy-synced'){
        subgraphs = subgraphs.filter((i) => {
          let status = deploymentStatusStore.getDeploymentStatuses.find((o) => o.subgraph == i.deployment.ipfsHash);
            if(status != undefined && status.health == 'healthy' && status.synced == true)
              return true
          return false;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'syncing'){
        subgraphs = subgraphs.filter((i) => {
          let status = deploymentStatusStore.getDeploymentStatuses.find((o) => o.subgraph == i.deployment.ipfsHash);
            if(status != undefined && status.health == 'healthy' && status.synced == false)
              return true
          return false;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'failed'){
        subgraphs = subgraphs.filter((i) => {
          let status = deploymentStatusStore.getDeploymentStatuses.find((o) => o.subgraph == i.deployment.ipfsHash);
            if(status != undefined && status.health == 'failed')
              return true
          return false;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'non-deterministic'){
        subgraphs = subgraphs.filter((i) => {
          let status = deploymentStatusStore.getDeploymentStatuses.find((o) => o.subgraph == i.deployment.ipfsHash);
            if(status != undefined && status.health == 'failed' && status.fatalError != undefined && status.fatalError.deterministic == false)
              return true
          return false;
        });
      }

      if(subgraphSettingStore.settings.statusFilter == 'deterministic'){
        subgraphs = subgraphs.filter((i) => {
          let status = deploymentStatusStore.getDeploymentStatuses.find((o) => o.subgraph == i.deployment.ipfsHash);
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
          ...state.getQueryFeeDatas[i],
        };
      }
      return subgraphs;
    },
    getSelectedSubgraphs: (state) => {
      let selectedSubgraphs = [];
      for(let i = 0; i < state.selected.length; i++){
        let subgraphIndex = state.subgraphs.findIndex((e) => e.deployment.ipfsHash == state.selected[i])
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
    getDataDict: (state) => {
      let dict = {};
      state.subgraphs.forEach(
        (el) => (dict[el.deployment.ipfsHash] = el)
      );
      return dict;
    },
    getSubgraphsDict: (state) => {
      let dict = {};
      state.getSubgraphs.forEach(
        (el) => (dict[el.deployment.ipfsHash] = el )
      );
      return dict;
    },
    getDeploymentStatuses: (state) => {
      let deploymentStatuses = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        deploymentStatuses[i] = { deploymentStatus: deploymentStatusStore.getDeploymentStatusDict[state.subgraphs[i].deployment.ipfsHash] || deploymentStatusStore.getBlankStatus }
      }
      return deploymentStatuses;
    },
    getQueryFeeDatas: (state) => {
      let queryFeeDatas = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        const queryFees = queryFeeStore.getQueryFeeDict[state.subgraphs[i].deployment.ipfsHash];
        if(queryFees){
          queryFeeDatas[i] = { queryFees: queryFees };
        }else{
          queryFeeDatas[i] = { };
        }
      }
      return queryFeeDatas;
    },
    getQueryFeeDash: (state) => {
      return queryFeeStore.queryFeeData.filter((e) => state.getSubgraphsDict[e.subgraphDeployment.id]).map((e) => Object.assign({}, e, state.getSubgraphsDict[e.subgraphDeployment.id] || {} ));
    },
    getProportions: (state) => {
      let proportions = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        let subgraph = state.subgraphs[i];
        if(subgraph.deployment.stakedTokens > 0)
            proportions[i] = { proportion: ( subgraph.deployment.signalledTokens / networkStore.getTotalTokensSignalled ) / ( subgraph.deployment.stakedTokens / networkStore.getTotalTokensAllocated ) };
          else
            proportions[i] = { proportion: 0 };
      }
      return proportions;
    },
    getAprs: (state) => {
      let aprs = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        let subgraph = state.subgraphs[i];
        if(subgraph.deployment.signalledTokens > 0) {
          aprs[i] = { apr: calculateNewApr(subgraph.deployment.signalledTokens, subgraph.deployment.stakedTokens, networkStore, "0") }
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
      for(let i = 0; i < state.subgraphs.length; i++){
        let subgraph = state.subgraphs[i];
        if(subgraph.deployment.signalledTokens > 0) {
          newAprs[i] = { newApr: calculateNewApr(subgraph.deployment.signalledTokens, state.getFutureStakedTokens[i].futureStakedTokens, networkStore, subgraphSettingStore.settings.newAllocation)};
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
        if(subgraph.deployment.signalledTokens > 0) {
          dailyRewards[i] = { dailyRewards: calculateSubgraphDailyRewards(subgraph.deployment.signalledTokens, state.getFutureStakedTokens[i].futureStakedTokens, networkStore, subgraphSettingStore.settings.newAllocation) }
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
        if (subgraph.deployment.stakedTokens > 0 && !accountStore.loading){
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
        if(subgraph.deployment.signalledTokens > 0) {
          maxAllos[i] = { maxAllo: maxAllo(subgraphSettingStore.settings.targetApr, subgraph.deployment.signalledTokens, networkStore, state.getFutureStakedTokens[i].futureStakedTokens) }
        }else{
          maxAllos[i] = { maxAllo: Number.MIN_SAFE_INTEGER }
        }
      }
      return maxAllos;
    },
    getCurrentlyAllocated: (state) => {
      let currentlyAllocated = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        let subgraph = state.subgraphs[i];
        let allo = allocationStore.getAllocations.find(e => {
          return e.subgraphDeployment.ipfsHash === subgraph.deployment.ipfsHash;
        });
        let unallo = allocationStore.getSelectedAllocations.find(e => {
          return e.subgraphDeployment.ipfsHash === subgraph.deployment.ipfsHash;
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
      let networks = [];
      for(let i = 0; i < state.subgraphs.length; i++){
        if(state.subgraphs[i]?.deployment?.manifest?.network && !networks.includes(state.subgraphs[i].deployment.manifest.network) && state.subgraphs[i].deployment.manifest.network != 'polygon'){
          networks.push(state.subgraphs[i].deployment.manifest.network);
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
      let subgraph = this.getSubgraphs.find(e => e.deployment?.ipfsHash == subgraphId);
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
            subgraphs: subgraph.deployment?.ipfsHash,
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
        query: subgraphSettingStore.settings.queryFilters.networkFilter.length == 0 ? SUBGRAPH_QUERY_NO_NETWORK_FILTER : SUBGRAPH_QUERY,
        variables: {
          skip: skip,
          minSignal: Number.parseInt(subgraphSettingStore.settings.queryFilters.minSignal) || 0,
          networks: subgraphSettingStore.settings.queryFilters.networkFilter,
        },
      })
      .then(({ data, networkStatus }) => {
        console.log(data);
        if(networkStatus == 7 && data.subgraphDeploymentManifests.length == 1000){
          return this.fetch(skip + data.subgraphDeploymentManifests.length)
          .then((data1) => {
            let concatData = {};
            if(typeof data.subgraphDeploymentManifests == "object" && typeof data1.subgraphDeploymentManifests == "object")
            concatData.subgraphDeploymentManifests = data.subgraphDeploymentManifests.concat(data1.subgraphDeploymentManifests);
            
            return concatData;
          })
        }
        
        return data;
      }).catch((err) => {
        if(err.graphQLErrors){
          alert(`API Error: ${err.graphQLErrors[0].message}`);
        }
      });
    },
    async fetchData(){
      return networkStore.init().then(() => {
        this.loading = true;
        return this.fetch(0)
        .then((data) => {
          // let uniqueSubgraphs = []
          // let subgraphs = [];
          // for(let i = 0; i < data.subgraphDeploymentManifests.length; i++){
          //   if(data.subgraphDeploymentManifests[i].deployment?.ipfsHash && !uniqueSubgraphs.includes(data.subgraphDeploymentManifests[i].deployment?.ipfsHash)){
          //     uniqueSubgraphs.push(data.subgraphDeploymentManifests[i].deployment.ipfsHash);
          //     subgraphs.push(data.subgraphDeploymentManifests[i]);
          //   }
          // }
          this.subgraphs = data.subgraphDeploymentManifests;
          this.upgradeIndexer = Array(data.subgraphDeploymentManifests.length).fill();
          for(let i = 0; i < this.upgradeIndexer.length; i++){
            this.upgradeIndexer[i] = { value: "0", loading: false, loaded: false };
          }
          return this.subgraphs;
        })
        .then(() => {
          return queryFeeStore.fetchData().then(() => {
            this.loading = false;
          });
        })
      });
      
      
    },
    async refreshSubgraphs(){
      this.selected = [];
      this.fetchData();
    },
  }
})
