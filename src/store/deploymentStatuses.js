// Utilities
import { defineStore } from 'pinia'
import { useAccountStore } from './accounts'
import { useChainValidationStore } from './chainValidation';
import { upgradeIndexerClient } from '@/plugins/upgradeIndexerClient';
import gql from 'graphql-tag';
const accountStore = useAccountStore();
const chainValidationStore = useChainValidationStore();

export const useDeploymentStatusStore = defineStore('deploymentStatusStore', {
  state: () => ({
    status: [],
    failedSubgraphs: [],
    upgradeIndexerFailedStatus: {},
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
    async fetchData(){
      console.log("UPDATE STATUS");
      const url = new URL('/status', this.getIndexerUrl);
      console.log(url.href);
      fetch(url.href,  {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({query: "{ indexingStatuses { subgraph synced health fatalError{ message deterministic block{ hash number } } node chains{ latestBlock{number} chainHeadBlock{number} earliestBlock{number} } } }"}),
      })
      .then((res) => res.json())
      .then((json) => {
        this.status = json.data.indexingStatuses;
        for(let i in json.data.indexingStatuses){
          if(json.data.indexingStatuses[i].health == 'failed' && json.data.indexingStatuses[i].fatalError && json.data.indexingStatuses[i].fatalError.deterministic == true)
            this.failedSubgraphs.push(json.data.indexingStatuses[i].subgraph);
        }
        upgradeIndexerClient.query({
          query: gql`query  indexingStatuses($subgraphs: [String!]){
            indexingStatuses(subgraphs: $subgraphs){
              health
              subgraph
              fatalError {
                handler
                message
                deterministic
                block {
                  hash
                  number
                }
              }
            }
          }`,
          variables: {
            subgraphs: this.failedSubgraphs,
          }
        })
        .then((data) => {
          for(let i in data.data.indexingStatuses){
            this.upgradeIndexerFailedStatus[data.data.indexingStatuses[i].subgraph] = data.data.indexingStatuses[i];
          }
        });
        this.loading = false;
        this.loaded = true;
      }).catch((error) => {
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
