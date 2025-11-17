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
    getDeploymentStatuses: (state) => {
      let deploymentStatuses = {};
      for(let i in state.status){
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
    getDeploymentFailures: (state) => {
      let deploymentFailures = {};
      for(let i in state.indexerStatuses){
        for(let d in state.indexerStatuses[i]){
          if(deploymentFailures[d] == null)
            deploymentFailures[d] = { healthy: 0, failed: 0, other: 0 }
          if(state.indexerStatuses[i][d].health == 'healthy')
            deploymentFailures[d].healthy += 1
          else if(state.indexerStatuses[i][d].health == 'failed')
            deploymentFailures[d].failed += 1
          else
            deploymentFailures[d].other += 1
        }
      }
      return deploymentFailures;
    },
    getDeploymentEntities: (state) => {
      let deploymentEntities = {};
      for(let i in state.indexerStatuses){
        for(let d in state.indexerStatuses[i]){
          if(deploymentEntities[d] == null)
            deploymentEntities[d] = 0
          if(state.indexerStatuses[i][d].entityCount > deploymentEntities[d])
            deploymentEntities[d] = state.indexerStatuses[i][d].entityCount
        }
      }
      return deploymentEntities;
    },
  },
  actions: {
    async init(){
      if(!this.loading && !this.loaded){
        this.loading = true;
        let userStatus = this.fetchUserStatuses().then(() => {
           this.loading = false;
           this.loaded = true;
        });
        let indexerStatuses = this.fetchIndexerData().then(() => {
          return this.fetchIndexerStatuses();
        });
        return Promise.all([userStatus, indexerStatuses]);
      }
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
      return this.fetchStatus(accountStore.getActiveUrl)
      .then((json) => {
        try{
          this.status = json.data.indexingStatuses.reduce((obj, status) => {
            return {
              ...obj,
              [status.subgraph]: status
            };
          }, {});
        }catch(e){
          console.error(e);
        }
      })
    },
    async fetchIndexerStatuses(){
      let promises = [];
      for(let indexer in this.indexerUrls){
        promises.push(
          this.fetchStatus(this.indexerUrls[indexer])
          .then((json) => {
            this.indexerStatuses[indexer] = json.data.indexingStatuses.reduce((obj, status) => {
              return {
                ...obj,
                [status.subgraph]: status
              };
            }, {});
          })
        );
      }
      return Promise.all(promises);
    },
    async fetchStatus(indexerUrl){
      const url = new URL('/status', indexerUrl);
      return fetch(url.href,  {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({query: "{ indexingStatuses { subgraph synced health entityCount fatalError{ message deterministic block{ hash number } } node chains{ latestBlock{number} chainHeadBlock{number} earliestBlock{number} } } }"}),
      })
      .then((res) => res.json())
      .catch((error) => {
        console.error(`Deployment status query error: ${error.message}`);
      });
    },
    async update(){
      if(!this.loading){
        this.loaded = false;
        this.init();
      }
    },
  },
})
