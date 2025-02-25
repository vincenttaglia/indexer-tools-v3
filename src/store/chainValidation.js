// Utilities
import { defineStore } from 'pinia'
import { useAccountStore } from './accounts'
import { useChainStore } from './chains';
import gql from 'graphql-tag';
const accountStore = useAccountStore();
const chainStore = useChainStore();

const CHAIN_MAP = {
  "mainnet":"ethereum",
  "arbitrum-one":"arbitrum",
  "matic":"polygon",
  "mode-mainnet":"mode",
  "blast-mainnet":"blast",
}

export const useChainValidationStore = defineStore('chainValidationStore', {
  state: () => ({
    chains: [],
    chainStatus: {},
    loading: false,
    loaded: false,
  }),
  getters: {
    getIndexerUrl: () => accountStore.getActiveUrl,
    getData: (state) => state.chainStatus,
    getChains: (state) => state.chains,
    getChainStatus: (state) => {
      let chainStatus = {};
      for(let i in state.chains){
        chainStatus[state.chains[i]] = state.chainStatus[state.chains[i]].externalBlockHash == `0x${state.chainStatus[state.chains[i]].indexerBlockHash}`;
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
        console.log("EPOCH");
        console.log(data);
        const chainData = data.epoches[0].blockNumbers;
        for(let i = 0; i<chainData.length; i++){
          this.chains.push(chainData[i].network.alias);
          this.chainStatus[chainData[i].network.alias] = {
            blockNumber: parseInt(chainData[i].blockNumber),
            indexerBlockHash: "",
            externalBlockHash: "",
          }
        }
      });
      console.log("UPDATE CHAIN STATUS");
      console.log(accountStore.getPOIQueryEndpoint);
      for(let i = 0; i < this.chains.length; i++){
        console.log(i);
        accountStore.getPOIQueryClient.query({
          query: gql`query blockHashFromNumber($network: String, $blockNumber: Int){ blockHashFromNumber(network: $network, blockNumber: $blockNumber) }`,
          variables: {
            network: this.chains[i],
            blockNumber: this.chainStatus[this.chains[i]].blockNumber,
          },
        })
        .then(({ data, networkStatus }) => {
          console.log("HASHDATA");
          console.log(data);
          this.chainStatus[this.chains[i]].indexerBlockHash = data.blockHashFromNumber;
          if(data.blockHashFromNumber != null){
            var myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            var raw = JSON.stringify({
              "method": "eth_getBlockByNumber",
              "params": [
                `0x${this.chainStatus[this.chains[i]].blockNumber.toString(16)}`,
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

            fetch(`https://lb.drpc.org/ogrpc?network=${CHAIN_MAP[this.chains[i]] || this.chains[i]}&dkey=AgtfLeG1hEcCoP3Z3d3iRXjHXnqN8zkR74Ro-gTye0yN`, requestOptions)
              .then(response => response.text())
              .then(result => {
                const res = JSON.parse(result);
                console.log("RES123");
                console.log(res)
                this.chainStatus[this.chains[i]].externalBlockHash = res.result.hash;
              })
              .catch(error => console.log('error', error));
          }
        });
      }

      for(let i = 0; i < this.chains.length; i++){}

      
    },
    async update(){
      if(!this.loading){
        this.fetchData();
      }
    },
  },
})
