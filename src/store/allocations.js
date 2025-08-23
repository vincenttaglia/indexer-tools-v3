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

const networkStore = useNetworkStore();
const accountStore = useAccountStore();
const chainStore = useChainStore();
const deploymentStatusStore = useDeploymentStatusStore();
const subgraphSettingStore = useSubgraphSettingStore();
const qosStore = useQosStore();
const queryFeeStore = useQueryFeesStore();

networkStore.init();
accountStore.fetchData()
.then(() => {
  deploymentStatusStore.init();
});

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
    error: false,
    // Performance optimization: memoized computed data
    computedData: new Map(),
    lastComputationTime: 0,
    computationCacheTimeout: 5000, // 5 seconds cache
  }),
  getters: {
    loadingAll: (state) => {
      return state.loading || deploymentStatusStore.loading || qosStore.loading || queryFeeStore.loading
    },

    // Optimized filtered allocations with pagination support
    getFilteredAllocations: (state) => {
      const cacheKey = `filtered_${subgraphSettingStore.settings.statusFilter}_${state.activateBlacklist}_${state.activateSynclist}_${state.networkFilter.join(',')}`;

      // Check if we have cached filtered results
      if (state.computedData.has(cacheKey)) {
        const cached = state.computedData.get(cacheKey);
        if (Date.now() - cached.timestamp < state.computationCacheTimeout) {
          return cached.data;
        }
      }

      // Apply filters efficiently
      let allocations = state.allocations;

      // Apply status filters
      if (subgraphSettingStore.settings.statusFilter !== 'none') {
        allocations = allocations.filter((i) => {
          const status = deploymentStatusStore.getDeploymentStatusDict[i.subgraphDeployment.ipfsHash];
          if (!status) return false;

          switch (subgraphSettingStore.settings.statusFilter) {
            case 'all':
              return true;
            case 'closable':
              return status.synced && (!status.fatalError || status.fatalError.deterministic);
            case 'healthy-synced':
              return status.health === 'healthy' && status.synced;
            case 'syncing':
              return status.health === 'healthy' && !status.synced;
            case 'failed':
              return status.health === 'failed';
            case 'non-deterministic':
              return status.health === 'failed' && status.fatalError && !status.fatalError.deterministic;
            case 'deterministic':
              return status.health === 'failed' && status.fatalError && status.fatalError.deterministic;
            default:
              return true;
          }
        });
      }

      // Apply blacklist filter
      if (state.activateBlacklist) {
        allocations = allocations.filter((i) => {
          return !subgraphSettingStore.settings.subgraphBlacklist.includes(i.subgraphDeployment.ipfsHash);
        });
      }

      // Apply synclist filter
      if (state.activateSynclist) {
        allocations = allocations.filter((i) => {
          return subgraphSettingStore.settings.subgraphSynclist.includes(i.subgraphDeployment.ipfsHash);
        });
      }

      // Apply network filter
      if (state.networkFilter.length) {
        allocations = allocations.filter((i) => {
          return i.subgraphDeployment.manifest.network && state.networkFilter.includes(i.subgraphDeployment.manifest.network);
        });
      }

      // Cache the filtered results
      state.computedData.set(cacheKey, {
        data: allocations,
        timestamp: Date.now()
      });

      return allocations;
    },

    getSelectedFilteredAllocations: (state) => {
      const selectedIds = new Set(state.selected);
      return state.getFilteredAllocations.filter(allocation => selectedIds.has(allocation.id));
    },

    // Optimized getter that only computes data when needed
    getAllocations: (state) => {
      const now = Date.now();

      // Check if we need to recompute
      if (state.computedData.has('enriched_allocations') &&
          now - state.computedData.get('enriched_allocations').timestamp < state.computationCacheTimeout) {
        return state.computedData.get('enriched_allocations').data;
      }

      // Compute enriched data efficiently
      const enrichedAllocations = state.allocations.map((allocation, index) => {
        const activeDuration = now - allocation.createdAt;
        const epochDuration = networkStore.getCurrentEpoch - allocation.createdAtEpoch;

        // Calculate proportion and APR only if needed
        let proportion = 0;
        let apr = 0;
        let dailyRewards = 0;
        let dailyRewardsCut = 0;

        if (allocation.subgraphDeployment.stakedTokens > 0) {
          proportion = (allocation.subgraphDeployment.signalledTokens / networkStore.getTotalTokensSignalled) /
                     (allocation.subgraphDeployment.stakedTokens / networkStore.getTotalTokensAllocated);
          apr = calculateApr(allocation.subgraphDeployment.signalledTokens, allocation.subgraphDeployment.stakedTokens, networkStore);
          dailyRewards = calculateAllocationDailyRewards(
            allocation.subgraphDeployment.signalledTokens,
            allocation.subgraphDeployment.stakedTokens,
            allocation.allocatedTokens,
            networkStore
          );
          dailyRewardsCut = indexerCut(dailyRewards, accountStore.cut);
        }

        // Get cached data from other stores
        const qos = qosStore.getQosDict[allocation.subgraphDeployment.ipfsHash];
        const queryFeeData = queryFeeStore.getQueryFeeDict[allocation.subgraphDeployment.ipfsHash];
        const deploymentStatus = deploymentStatusStore.getDeploymentStatusDict[allocation.subgraphDeployment.ipfsHash] ||
                               deploymentStatusStore.getBlankStatus;
        const pendingReward = state.pendingRewards[index] || { value: BigNumber(0), loading: false, loaded: false };

        return {
          ...allocation,
          activeDuration,
          readableDuration: calculateReadableDuration(activeDuration),
          epochDuration,
          proportion,
          apr: apr.toString(),
          dailyRewards,
          dailyRewardsCut,
          pendingRewards: pendingReward,
          pendingRewardsCut: pendingReward.value > 0 ? indexerCut(pendingReward.value, accountStore.cut) : BigNumber(0),
          deploymentStatus,
          qos: qos ? { qos } : {},
          queryFees: queryFeeData ? { queryFees: queryFeeData } : {},
        };
      });

      // Cache the enriched data
      state.computedData.set('enriched_allocations', {
        data: enrichedAllocations,
        timestamp: now
      });

      return enrichedAllocations;
    },

    // Optimized getters that use the enriched data
    getQosDatas: (state) => {
      return state.getAllocations.map(allocation => allocation.qos || {});
    },

    getQueryFeeDatas: (state) => {
      return state.getAllocations.map(allocation => allocation.queryFees || {});
    },

    getActiveDurations: (state) => {
      return state.getAllocations.map(allocation => ({ activeDuration: allocation.activeDuration }));
    },

    getReadableDurations: (state) => {
      return state.getAllocations.map(allocation => ({ readableDuration: allocation.readableDuration }));
    },

    getEpochDurations: (state) => {
      return state.getAllocations.map(allocation => ({ epochDuration: allocation.epochDuration }));
    },

    getProportions: (state) => {
      return state.getAllocations.map(allocation => ({ proportion: allocation.proportion }));
    },

    getAprs: (state) => {
      return state.getAllocations.map(allocation => ({ apr: allocation.apr }));
    },

    getDailyRewards: (state) => {
      return state.getAllocations.map(allocation => ({ dailyRewards: allocation.dailyRewards }));
    },

    getDailyRewardsCuts: (state) => {
      return state.getAllocations.map(allocation => ({ dailyRewardsCut: allocation.dailyRewardsCut }));
    },

    getPendingRewards: (state) => {
      return state.getAllocations.map(allocation => ({ pendingRewards: allocation.pendingRewards }));
    },

    getPendingRewardsCuts: (state) => {
      return state.getAllocations.map(allocation => ({ pendingRewardsCut: allocation.pendingRewardsCut }));
    },

    getDeploymentStatuses: (state) => {
      return state.getAllocations.map(allocation => ({ deploymentStatus: allocation.deploymentStatus }));
    },

    getSelectedAllocations: (state) => {
      const selectedIds = new Set(state.selected);
      return state.allocations.filter(allocation => selectedIds.has(allocation.id));
    },

    getSubgraphNetworks: (state) => {
      const networks = new Set(["mainnet", "arbitrum-one", "matic"]);
      state.allocations.forEach(allocation => {
        if (allocation?.subgraphDeployment?.manifest?.network &&
            allocation.subgraphDeployment.manifest.network !== 'polygon') {
          networks.add(allocation.subgraphDeployment.manifest.network);
        }
      });
      return Array.from(networks);
    },

    totalAllocatedStake: (state) => {
      return state.allocations.reduce((total, allocation) =>
        total.plus(allocation.allocatedTokens), new BigNumber(0));
    },

    totalRewardsPerYear: (state) => {
      return state.getAllocations.reduce((total, allocation) => {
        if (allocation.allocatedTokens > 0 &&
            allocation.subgraphDeployment.signalledTokens > 0 &&
            !allocation.subgraphDeployment.deniedAt) {
          return total.plus(
            new BigNumber(allocation.subgraphDeployment.signalledTokens)
              .dividedBy(networkStore.getTotalTokensSignalled)
              .multipliedBy(networkStore.getIssuancePerYear)
              .multipliedBy(
                new BigNumber(allocation.allocatedTokens).dividedBy(allocation.subgraphDeployment.stakedTokens)
              )
          );
        }
        return total;
      }, new BigNumber(0));
    },

    avgAPR: (state) => {
      return state.totalRewardsPerYear.dividedBy(state.totalAllocatedStake.plus(accountStore.availableStake));
    },

    calculatedClosingRewardsPerYear: (state) => {
      const selectedIds = new Set(state.selected);
      return state.getAllocations.reduce((total, allocation) => {
        if (selectedIds.has(allocation.id) && !allocation.subgraphDeployment.deniedAt) {
          return total.plus(
            new BigNumber(allocation.subgraphDeployment.signalledTokens)
              .dividedBy(networkStore.getTotalTokensSignalled)
              .multipliedBy(networkStore.getIssuancePerYear)
              .multipliedBy(
                new BigNumber(allocation.allocatedTokens).dividedBy(allocation.subgraphDeployment.stakedTokens)
              )
          );
        }
        return total;
      }, new BigNumber(0));
    },

    calculatedClosingStake: (state) => {
      const selectedIds = new Set(state.selected);
      return state.getAllocations.reduce((total, allocation) => {
        if (selectedIds.has(allocation.id)) {
          return total.plus(allocation.allocatedTokens);
        }
        return total;
      }, new BigNumber(0));
    },

    closingAvgAPR: (state) => {
      return state.calculatedClosingRewardsPerYear.dividedBy(state.calculatedClosingStake);
    },

    pendingRewardsCutSum: (state) => {
      return state.getAllocations.reduce((sum, cur) =>
        cur.pendingRewardsCut && !cur.subgraphDeployment.deniedAt ? sum.plus(cur.pendingRewardsCut) : sum,
        new BigNumber(0));
    },

    pendingRewardsSum: (state) => {
      return state.getAllocations.reduce((sum, cur) =>
        cur.pendingRewards.loaded && !cur.subgraphDeployment.deniedAt ? sum.plus(cur.pendingRewards.value) : sum,
        new BigNumber(0));
    },

    dailyRewardsCutSum: (state) => {
      return state.getAllocations.reduce((sum, cur) =>
        cur.subgraphDeployment.deniedAt ? sum : sum.plus(cur.dailyRewardsCut),
        new BigNumber(0));
    },

    dailyRewardsSum: (state) => {
      return state.getAllocations.reduce((sum, cur) =>
        cur.subgraphDeployment.deniedAt ? sum : sum.plus(cur.dailyRewards),
        new BigNumber(0));
    },
  },
  actions: {
    // Clear cache when data changes
    clearCache() {
      this.computedData.clear();
      this.lastComputationTime = 0;
    },

    async fetchAllPendingRewards(){
      const allocations = this.getAllocations;
      const batchSize = 50;

      // Mark all as loading
      allocations.forEach(allocation => {
        if (!allocation.pendingRewards.loading && !allocation.pendingRewards.loaded) {
          allocation.pendingRewards.loading = true;
        }
      });

      // Process in batches
      for (let i = 0; i < allocations.length; i += batchSize) {
        const batch = allocations.slice(i, i + batchSize);
        const batchRequest = new chainStore.getActiveChain.web3.BatchRequest();

        batch.forEach(allocation => {
          if (allocation.pendingRewards.loading && !allocation.pendingRewards.loaded) {
            batchRequest.add(chainStore.getRewardsContract.methods.getRewards(allocation.id).call.request((error, value) => {
              if (value !== undefined) {
                allocation.pendingRewards.value = BigNumber(value);
                allocation.pendingRewards.loaded = true;
              }
              allocation.pendingRewards.loading = false;
            }));
          }
        });

        await batchRequest.execute();

        // Add delay between batches to prevent rate limiting
        if (i + batchSize < allocations.length) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      // Clear cache after updating pending rewards
      this.clearCache();
    },

    async fetchPendingRewards(allocationId){
      const allocation = this.getAllocations.find(e => e.id === allocationId);
      if (!allocation || allocation.pendingRewards.loading || allocation.pendingRewards.loaded) return;

      allocation.pendingRewards.loading = true;

      try {
        const value = await chainStore.getRewardsContract.methods.getRewards(allocation.id).call();
        if (value !== undefined) {
          allocation.pendingRewards.value = BigNumber(value);
          allocation.pendingRewards.loaded = true;
        }
      } catch (error) {
        console.error('Error fetching pending rewards:', error);
      } finally {
        allocation.pendingRewards.loading = false;
        this.clearCache();
      }
    },

    async init(){
      if (!this.loaded && !this.loading) {
        return this.fetchData();
      }
    },

    async fetchData(){
      this.error = false;
      this.loading = true;
      this.clearCache();

      try {
        const [fetchResult, qosResult, queryFeesResult] = await Promise.all([
          networkStore.init().then(() => this.fetch(0)),
          qosStore.fetchData(),
          queryFeeStore.fetchData()
        ]);

        if (fetchResult) {
          this.allocations = fetchResult.allocations;
          this.pendingRewards = Array(fetchResult.allocations.length).fill().map(() => ({
            value: BigNumber(0),
            loading: false,
            loaded: false
          }));
        }

        this.loaded = true;
        this.loading = false;
      } catch (error) {
        console.error('Error fetching data:', error);
        this.loading = false;
        this.error = true;
      }
    },

    async fetch(skip){
      this.selected = [];
      console.log("Fetch " + skip);

      try {
        const { data, networkStatus } = await chainStore.getNetworkSubgraphClient.query({
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
        });

        if (networkStatus === 7 && data.allocations.length === 1000) {
          const nextData = await this.fetch(skip + data.allocations.length);
          if (nextData && nextData.allocations) {
            return {
              allocations: [...data.allocations, ...nextData.allocations]
            };
          }
        }

        return data;
      } catch (err) {
        this.loading = false;
        if (err.graphQLErrors?.[0]?.message) {
          console.error(`Allocations API error: ${err.graphQLErrors[0].message}`);
          if (!this.error) {
            alert(`Allocations API Error: ${err.graphQLErrors[0].message}`);
            this.error = true;
          }
        }
        if (err.message) {
          console.error(`Allocations query error: ${err.message}`);
          if (!this.error) {
            alert(`Allocations Error: ${err.message}`);
            this.error = true;
          }
        }
        throw err;
      }
    }
  }
})
