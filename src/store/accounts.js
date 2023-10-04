import { defineStore } from 'pinia'
import { useChainStore } from './chains';
import gql from 'graphql-tag';

const chainStore = useChainStore();


export const useAccountStore = defineStore('accountStore', {
  state: () => ({
    accounts: localStorage.accounts ? JSON.parse(localStorage.accounts) : [ { address: '0xeddd4ec5d3775de964416b7b9d4da885f530f90a', name: 'vincenttaglia.eth', active: true, chain: "mainnet" } ],
    loading: true,
    cut: '0',
    url: '',
    availableStake: '0',
  }),
  getters: {
    getActiveAccount: (state) => {
      return state.accounts.find(e => e.active);
    },
    getActiveUrl: (state) => {
      return state.url;
    }
  },
  actions: {
    async fetchData(){
      return chainStore.getNetworkSubgraphClient.query({
        query: gql`query indexercut($indexer: String!){
          indexer(id: $indexer){
            indexingRewardCut
            availableStake
            url
          }
        }`,
        variables: {
          indexer: this.getActiveAccount.address
        },
      })
      .then((data) => {
        this.cut = data.data.indexer.indexingRewardCut;
        this.availableStake = data.data.indexer.availableStake;
        this.url = data.data.indexer.url;
        this.loading = false;
      });
    },
    addAccount(address, name, chain){
      let alreadyAdded = this.accounts.find(e => e.address == address.toLowerCase() && e.chain == chain);
  
      if(!alreadyAdded){
        this.accounts.push({ address: address.toLowerCase(), name: name, active: false, chain: chain});
        this.switchAccount(address, chain);
      }
    },
    switchAccount(address, chain){
      let newAccount = this.accounts.find(e => e.address == address.toLowerCase() && e.chain == chain);
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
        return newAccount;
      }
      return null;
    },
    removeAccount(address){
      let indexer = this.accounts.find(e => e.address == address.toLowerCase());
  
      if(indexer){
        if(indexer.active){
          if(this.accounts.length == 1 && !(indexer.address == '0xeddd4ec5d3775de964416b7b9d4da885f530f90a' && indexer.chain == 'mainnet')){
            this.accounts.push({ address: '0xeddd4ec5d3775de964416b7b9d4da885f530f90a', name: 'vincenttaglia.eth', active: false, chain: "mainnet" });
          }
          if(this.accounts.length > 1){
            for(let i = 0; i < this.accounts.length; i++){
              if(this.accounts[i].address != indexer.address && this.accounts[i].chain != indexer.chain){
                this.switchAccount(this.accounts[i].address, this.accounts[i].chain);
                break;
              }
            }
          }
          
        }
        if(this.accounts.length > 1){
          this.accounts = this.accounts.filter((e) => { return !(e.address == indexer.address && e.chain == indexer.chain); });
          localStorage.accounts = JSON.stringify(this.accounts);
        }
        
      }
    }
  },
})
