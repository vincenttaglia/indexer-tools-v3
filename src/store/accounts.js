import { defineStore } from 'pinia'
import graphNetworkClient from "@/plugins/graphNetworkSubgraphClient";
import gql from 'graphql-tag';

export const useAccountStore = defineStore('accountStore', {
  state: () => ({
    accounts: [ { address: '0xeddd4ec5d3775de964416b7b9d4da885f530f90a', name: 'vincenttaglia.eth', active: true } ],
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
      return graphNetworkClient.query({
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
        this.cut = data.indexer.indexingRewardCut;
        this.availableStake = data.indexer.availableStake;
        this.loading = false;
      });
    }
  },
  addAccount(address, name){
    let alreadyAdded = state.accounts.find(e => e.address == address.toLowerCase());

    if(!alreadyAdded){
      this.accounts.push({ address: address.toLowerCase(), name: name, active: false});
      this.switchAccount(address);
    }
  },
  switchAccount(address){
    let newAccount = state.accounts.find(e => e.address == address.toLowerCase());
    let oldAccount = this.getActiveAccount;

    if(newAccount){
      oldAccount.active = false;
      newAccount.active = true;
      this.cut = '0';
      this.availableStake = '0';
      this.loading = true;
      this.fetchData();
    }
  },
  removeAccount(address){
    let indexer = state.accounts.find(e => e.address == address.toLowerCase());

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
    }
  }
})
