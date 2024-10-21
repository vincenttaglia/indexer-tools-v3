//import { App, Plugin } from 'vue';

export const defaultsConfig = {
    install: (app, options) => {
        // Default configuration variables can be accessed from injection : `defaultsConfig`.
        app.config.globalProperties.$defaultsConfig = options.variables

        // They can also be accessed from global property `$defaultsConfig`
        app.provide("defaultsConfig", options.variables)
    }
}

/**
 * Tries loading default configuration from static file (in /public folder), then build time ENV variables, then hard coded defaults
 */
export const loadDefaultsConfig = async () => {
    const resp = await fetch('/indexer-tools-config.json');
    let value;
    let json;

    if(resp.ok){
      value = await resp.json();
    }else{
      value = {}
    }
    
    if(import.meta.env.VITE_DEFAULT_ACCOUNTS){
      json = JSON.parse(import.meta.env.VITE_DEFAULT_ACCOUNTS);
    }else{
      json = "";
    }


    return {
      variables: {
        accounts: value.DEFAULT_ACCOUNTS || json || [ { "address": "0x1b92e4cba0f82c85c1298af861247849988c788c", "name": "vincenttaglia-indexer.eth", "active": true, "chain": "arbitrum-one", "agentConnect": false, "agentEndpoint": "", "poiQuery": false, "poiQueryEndpoint": "" } ],
        rpcMainnet: value.DEFAULT_RPC_MAINNET || import.meta.env.VITE_DEFAULT_RPC_MAINNET || "https://mainnet.infura.io/v3/659344f230804542a4e653f875172105",
        rpcArbitrum: value.DEFAULT_RPC_ARBITRUM || import.meta.env.VITE_DEFAULT_RPC_ARBITRUM || "https://arb-mainnet.g.alchemy.com/v2/er8LBcXpoFwlV8xJee-WXFbFG_M8L4JK",
        rpcSepolia: value.DEFAULT_RPC_SEPOLIA || import.meta.env.VITE_DEFAULT_RPC_SEPOLIA || "https://eth-sepolia.g.alchemy.com/v2/eKJ8_13LMaVi2bSITYWTMqskgsGiey8K",
        rpcArbitrumSepolia: value.DEFAULT_RPC_ARBITRUM_SEPOLIA || import.meta.env.VITE_DEFAULT_RPC_ARBITRUM_SEPOLIA || "https://arbitrum-sepolia.infura.io/v3/db92de7c459f4d83a2c2c21931a6bdf0",
        subgraphMainnet: value.DEFAULT_SUBGRAPH_MAINNET || import.meta.env.VITE_DEFAULT_SUBGRAPH_MAINNET || "https://gateway.thegraph.com/api/[api-key]/subgraphs/id/9Co7EQe5PgW3ugCUJrJgRv4u9zdEuDJf8NvMWftNsBH8",
        subgraphArbitrum: value.DEFAULT_SUBGRAPH_ARBITRUM || import.meta.env.VITE_DEFAULT_SUBGRAPH_ARBITRUM || "https://gateway.thegraph.com/api/[api-key]/subgraphs/id/DZz4kDTdmzWLWsV373w2bSmoar3umKKH9y82SUKr5qmp",
        subgraphSepolia: value.DEFAULT_SUBGRAPH_SEPOLIA || import.meta.env.VITE_DEFAULT_SUBGRAPH_SEPOLIA || "https://gateway.thegraph.com/api/[api-key]/subgraphs/id/8pVKDwHniAz87CHEQsiz2wgFXGZXrbMDkrxgauVVfMJC",
        subgraphArbitrumSepolia: value.DEFAULT_SUBGRAPH_ARBITRUM_SEPOLIA || import.meta.env.VITE_DEFAULT_SUBGRAPH_ARBITRUM_SEPOLIA || "https://gateway.thegraph.com/api/[api-key]/subgraphs/id/3xQHhMudr1oh69ut36G2mbzpYmYxwqCeU6wwqyCDCnqV",
        qosSubgraph: value.DEFAULT_QOS_SUBGRAPH || import.meta.env.VITE_DEFAULT_QOS_SUBGRAPH || "https://gateway.thegraph.com/api/[api-key]/subgraphs/id/Dtr9rETvwokot4BSXaD5tECanXfqfJKcvHuaaEgPDD2D",
        apiKey: value.GRAPH_API_KEY || import.meta.env.VITE_GRAPH_API_KEY || "146d8cd439901e24257f3c19d82359da",
      }
    }    
    
}

export function replaceAPI(string, apiKey){
  return string.replace("[api-key]", apiKey).replace("{api-key}", apiKey);
}