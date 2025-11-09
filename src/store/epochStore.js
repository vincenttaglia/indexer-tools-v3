// Utilities
import { defineStore } from 'pinia'
import { useChainStore } from './chains';
import gql from 'graphql-tag';
const chainStore = useChainStore();

export const useEpochStore = defineStore('epochStore', {
  state: () => ({
    currentEpoch: null,
    blockNumbers: {},
    chains: [],
    loading: false,
    loaded: false,
    loadingPromise: new Promise(() => {
      console.log("Promising");
    }),
  }),
  getters: {
    getCurrentEpoch: (state) => state.currentEpoch,
    getBlockNumbers: (state) => state.blockNumbers,
    getChains: (state) => state.chains,
  },
  actions: {
    async init(){
      if(!this.loading && !this.loaded)
        this.loadingPromise = this.fetchData();
      return this.loadingPromise;
    },
    async fetchData(){
      this.loaded = false;
      this.loading = true;
      await chainStore.getEboSubgraphClient.query({
        query: gql`query {
          epoches(first: 1, orderBy: epochNumber, orderDirection: desc) {
            epochNumber
            id
            blockNumbers {
              blockNumber
              id
              network {
                alias
                id
              }
            }
          }
        }`
      })
      .then(({ data, networkStatus }) => {
        this.currentEpoch = data.epoches[0].epochNumber;
        const chainData = data.epoches[0].blockNumbers;
        for(let i = 0; i<chainData.length; i++){
          this.chains.push(chainData[i].network.alias);
          this.blockNumbers[chainData[i].network.alias] = parseInt(chainData[i].blockNumber);
        }
      });

      
    },
    async update(){
      if(!this.loading)
        this.loadingPromise = this.fetchData();
      return this.loadingPromise();
    },
  },
})
