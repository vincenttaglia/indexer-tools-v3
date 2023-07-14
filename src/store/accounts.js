import { defineStore } from 'pinia'
import { useChainStore } from './chains';
import gql from 'graphql-tag';

const chainStore = useChainStore();

export const useAccountStore = defineStore('accountStore', {
  state: () => ({
    accounts: localStorage.accounts ? JSON.parse(localStorage.accounts) : [ { address: '0xeddd4ec5d3775de964416b7b9d4da885f530f90a', name: 'vincenttaglia.eth', active: true, chain: "mainnet" } ],
    loading: true,
    cut: '0',
    availableStake: '0',
  }),
  getters: {
    getActiveAccount: (state) => {
      return state.accounts.find(e => e.active);
    }
  },
  actions: {
    async fetchData(){
      return chainStore.getNetworkSubgraphClient.query({
        query: gql`query indexercut($indexer: String!){
          indexer(id: $indexer){
            indexingRewardCut
            availableStake
          }
        }`,
        variables: {
          indexer: this.getActiveAccount.address
        },
      })
      .then((data) => {
        this.cut = data.data.indexer.indexingRewardCut;
        this.availableStake = data.data.indexer.availableStake;
        this.loading = false;
      });
    },
    addAccount(address, name, chain){
      let alreadyAdded = this.accounts.find(e => e.address == address.toLowerCase());
  
      if(!alreadyAdded){
        this.accounts.push({ address: address.toLowerCase(), name: name, active: false, chain: chain});
        this.switchAccount(address);
      }
    },
    switchAccount(address){
      let newAccount = this.accounts.find(e => e.address == address.toLowerCase());
      let oldAccount = this.getActiveAccount;
  
      if(newAccount){
        if(chainStore.getChainID != newAccount.chain && chainStore.getChains.find((c) => c.id == newAccount.chain)){
          chainStore.setChain(newAccount.chain);
        }
        oldAccount.active = false;
        newAccount.active = true;
        this.cut = '0';
        this.availableStake = '0';
        this.loading = true;
        this.fetchData();
        localStorage.accounts = JSON.stringify(this.accounts);
      }
    },
    removeAccount(address){
      let indexer = this.accounts.find(e => e.address == address.toLowerCase());
  
      if(indexer){
        if(indexer.active){
          if(this.accounts.length == 1){
            this.accounts.push({ address: '0xeddd4ec5d3775de964416b7b9d4da885f530f90a', name: 'vincenttaglia.eth', active: false });
          }
          for(let i = 0; i < this.accounts.length; i++){
            if(this.accounts[i].address != indexer.address){
              this.switchAccount(this.accounts[i].address);
              break;
            }
          }
        }
        this.accounts = this.accounts.filter((e) => { return e.address != indexer.address; });
        localStorage.accounts = JSON.stringify(this.accounts);
      }
    }
  },
})
