// Utilities
import { defineStore } from 'pinia'
import { useAccountStore } from './accounts'
import { useChainValidationStore } from './chainValidation';
import { upgradeIndexerClient } from '@/plugins/upgradeIndexerClient';
import gql from 'graphql-tag';
import { apolloClient, arbitrumApolloClient, sepoliaApolloClient, arbitrumSepoliaApolloClient } from "@/plugins/graphNetworkSubgraphClient";
import { useChainStore } from './chains';
const accountStore = useAccountStore();
const chainValidationStore = useChainValidationStore();
const chainStore = useChainStore();

export const useDeploymentStatusStore = defineStore('deploymentStatusStore', {
  state: () => ({
    status: {},
    indexerUrls: {},
    indexerStatuses: {},
    loading: false,
    loaded: false,
  }),
  getters: {
    getIndexerUrl: () => accountStore.getActiveUrl,
    getData: (state) => state.status,
    getUpgradeIndexerFailedStatus: (state) => state.upgradeIndexerFailedStatus,
    getDeploymentStatusDict: (state) => {
      let dict = {};
      state.getDeploymentStatuses.forEach(
        (el) => (dict[el.subgraph] = el )
      );
      return dict;
    },
    getDeploymentStatuses: (state) => {
      let deploymentStatuses = [];
      for(let i = 0; i < state.status.length; i++){
        deploymentStatuses[i] = state.status[i];
        if(deploymentStatuses[i].health == 'failed' && deploymentStatuses[i].fatalError && deploymentStatuses[i].fatalError.deterministic == false){
          deploymentStatuses[i].icon = 'mdi-refresh';
          deploymentStatuses[i].color = 'yellow';
        }else if(deploymentStatuses[i].health == 'failed' && deploymentStatuses[i].fatalError && deploymentStatuses[i].fatalError.deterministic == true){
          deploymentStatuses[i].icon = 'mdi-close';
          deploymentStatuses[i].color = 'red';
        }else if(deploymentStatuses[i].health == 'healthy' && deploymentStatuses[i].synced == true){
          deploymentStatuses[i].icon = 'mdi-check';
          deploymentStatuses[i].color = 'green';
        }else if(deploymentStatuses[i].health == 'healthy' && deploymentStatuses[i].synced == false){
          deploymentStatuses[i].icon = 'mdi-minus';
          deploymentStatuses[i].color = 'blue'
        }else{
          deploymentStatuses[i].icon = 'mdi-help';
          deploymentStatuses[i].color = 'default';
        }
        deploymentStatuses[i].blocksBehindChainhead = deploymentStatuses[i]?.chains?.[0]?.chainHeadBlock?.number && deploymentStatuses[i].chains?.[0]?.latestBlock?.number ? parseInt(deploymentStatuses[i]?.chains[0].chainHeadBlock.number) - parseInt(deploymentStatuses[i].chains[0].latestBlock.number) : Number.MAX_SAFE_INTEGER;
      }
      return deploymentStatuses;
    },
    getBlankStatus: () => {
      return { icon: 'mdi-close', color: 'default', blocksBehindChainhead: Number.MAX_SAFE_INTEGER } 
    },
  },
  actions: {
    async init(){
      if(!this.loading && !this.loaded)
        this.fetchData();
    },
    async fetchUserData(){

    },
    async fetchIndexerData(){
      return chainStore.getActiveChain.networkSubgraphClient.query({
        query: gql`query{
          indexers(where: {allocationCount_gt: 0}) {
            url
            account {
              id
            }
          }
        }`,
      }).then((data) =>{
        for(let i in data.data.indexers){
          if(data.data.indexers[i].account.id != accountStore.getActiveAccount.address)
            this.indexerUrls[data.data.indexers[i].account.id] = data.data.indexers[i].url;
        }
      });
    },
    async fetchUserStatuses(){
      return this.fetchIndexerStatuses(indexers[i])
      .then((json) => {
        this.status = new Map(json.data.indexingStatuses.map((e) => [e.subgraph, e]));
      })
    },
    async fetchIndexerStatuses(){
      let promises = [];
      for(let indexer in this.indexerUrls){
        promises.push(
          this.fetchIndexerStatuses(this.indexerUrls[i])
          .then((json) => {
            this.indexerStatuses[indexer] = new Map(json.data.indexingStatuses.map((e) => [e.subgraph, e]));
          })
        );
      }
      this.loading = false;
      this.loaded = true;
      return Promise.all(promises);
    },
    async fetchIndexerStatus(url){
      const url = new URL('/status', url);
      return fetch(url.href,  {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({query: "{ indexingStatuses { subgraph synced health fatalError{ message deterministic block{ hash number } } node chains{ latestBlock{number} chainHeadBlock{number} earliestBlock{number} } } }"}),
      })
      .then((res) => res.json())
      .catch((error) => {
        console.error(`Deployment status query error: ${error.message}`);
        this.loading = false;
      });
    },
    async update(){
      if(!this.loading){
        this.fetchData();
      }
    },
  },
})
