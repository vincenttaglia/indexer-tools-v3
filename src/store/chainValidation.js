// Utilities
import { defineStore } from 'pinia'
import { useAccountStore } from './accounts'
import { useChainStore } from './chains';
import { useEpochStore } from './epochStore';
import gql from 'graphql-tag';
const accountStore = useAccountStore();
const chainStore = useChainStore();
const epochStore = useEpochStore();

await epochStore.init();

const CHAIN_MAP = {
  "mainnet":"ethereum",
  "arbitrum-one":"arbitrum",
  "matic":"polygon",
  "mode-mainnet":"mode",
  "blast-mainnet":"blast",
}

export const useChainValidationStore = defineStore('chainValidationStore', {
  state: () => ({
    chainStatus: {},
    loading: false,
    loaded: false,
  }),
  getters: {
    getData: (state) => state.chainStatus,
    getChains: () => epochStore.getChains,
    getBlockNumbers: () => epochStore.getBlockNumbers,
    getChainStatus: (state) => {
      let chainStatus = {};
      for(let i in state.getChains){
        chainStatus[state.getChains[i]] = state.chainStatus[state.getChains[i]]?.externalBlockHash == `0x${state.chainStatus[state.getChains[i]]?.indexerBlockHash}`;
      }
      return chainStatus;
    },
  },
  actions: {
    async init(){
      if(!this.loading && !this.loaded)
        this.fetchData();
    },
    async fetchData(){
      this.loaded = false;
      this.loading = true;
      for(let i in this.getChains){
        this.chainStatus[this.getChains[i]] = {
          blockNumber: this.getBlockNumbers[this.getChains[i]],
          indexerBlockHash: "",
          externalBlockHash: "",
        }
      }


      for(let i in this.getChains){
        console.log(i);
        accountStore.getPOIQueryClient.query({
          query: gql`query blockHashFromNumber($network: String, $blockNumber: Int){ blockHashFromNumber(network: $network, blockNumber: $blockNumber) }`,
          variables: {
            network: this.getChains[i],
            blockNumber: this.chainStatus[this.getChains[i]].blockNumber,
          },
        })
        .then(({ data, networkStatus }) => {
          console.log("HASHDATA");
          console.log(data);
          this.chainStatus[this.getChains[i]].indexerBlockHash = data.blockHashFromNumber;
          if(data.blockHashFromNumber != null){
            var myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            var raw = JSON.stringify({
              "method": "eth_getBlockByNumber",
              "params": [
                `0x${this.chainStatus[this.getChains[i]].blockNumber.toString(16)}`,
                false
              ],
              "id": 1,
              "jsonrpc": "2.0"
            });

            var requestOptions = {
              method: 'POST',
              headers: myHeaders,
              body: raw,
              redirect: 'follow'
            };

            fetch(`https://lb.drpc.org/ogrpc?network=${CHAIN_MAP[this.getChains[i]] || this.getChains[i]}&dkey=AgtfLeG1hEcCoP3Z3d3iRXjHXnqN8zkR74Ro-gTye0yN`, requestOptions)
              .then(response => response.text())
              .then(result => {
                const res = JSON.parse(result);
                console.log("RES123");
                console.log(res)
                this.chainStatus[this.getChains[i]].externalBlockHash = res.result.hash;
              })
              .catch(error => console.log('error', error));
          }
        });
      }
      
    },
    async update(){
      if(!this.loading){
        this.fetchData();
      }
    },
  },
})
