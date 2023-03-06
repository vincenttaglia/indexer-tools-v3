import { defineStore } from 'pinia'

import graphNetworkClient from "../plugins/graphNetworkSubgraphClient";

import gql from 'graphql-tag';

export const useSubgraphsStore = defineStore({
  id: 'subgraphs',
  state: () => ({
    subgraphs: [],
  }),
  getters: {
    getSubgraphs: (state) => state.subgraphs,
  },
  actions: {
    async fetch(skip){
      console.log("Fetch " + skip);
      return graphNetworkClient.query({
        query: gql`query subgraphs($skip: Int!){
          subgraphs (skip: $skip){
            id
            displayName
            createdAt
            currentSignalledTokens
            image
            currentVersion{
              subgraphDeployment{
                ipfsHash
                indexingRewardAmount
                queryFeesAmount
                stakedTokens
                createdAt
                deniedAt
                network{
                  id
                }
              }
            }
          }
        }`,
        variables: {
          skip: skip
        },
      })
      .then(({ data, networkStatus }) => {
        if(networkStatus == 7 && data.subgraphs.length == 100){
          return this.fetch(skip + data.subgraphs.length)
          .then((data1) => {
            if(typeof data.subgraphs == "object" && typeof data1.subgraphs == "object")
              data.subgraphs = data.subgraphs.concat(data1.subgraphs);
            
            return data;
          })
        }
        
        return data;
      });
    },
    async fetchData(){
      this.fetch(0)
      .then((data) => {
        this.subgraphs = data.subgraphs;
      })
      
    }
  }
})
