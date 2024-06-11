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
    if(resp.ok){
      const value = await resp.json()

      return {
        variables: {
          accounts: value.DEFAULT_ACCOUNTS,
          rpcMainnet: value.DEFAULT_RPC_MAINNET,
          rpcArbitrum: value.DEFAULT_RPC_ARBITRUM,
          rpcSepolia: value.DEFAULT_RPC_SEPOLIA,
          rpcArbitrumSepolia: value.DEFAULT_RPC_ARBITRUM_SEPOLIA,
          subgraphMainnet: value.DEFAULT_SUBGRAPH_MAINNET,
          subgraphArbitrum: value.DEFAULT_SUBGRAPH_ARBITRUM,
          subgraphSepolia: value.DEFAULT_SUBGRAPH_SEPOLIA,
          subgraphArbitrumSepolia: value.DEFAULT_SUBGRAPH_ARBITRUM_SEPOLIA,
        }
      }

    }else if(import.meta.env.VITE_DEFAULT_ACCOUNTS != undefined){
      return {
        variables: {
          accounts: JSON.parse(import.meta.env.VITE_DEFAULT_ACCOUNTS),
          rpcMainnet: import.meta.env.VITE_DEFAULT_RPC_MAINNET,
          rpcArbitrum: import.meta.env.VITE_DEFAULT_RPC_ARBITRUM,
          rpcSepolia: import.meta.env.VITE_DEFAULT_RPC_SEPOLIA,
          rpcArbitrumSepolia: import.meta.env.VITE_DEFAULT_RPC_ARBITRUM_SEPOLIA,
          subgraphMainnet: import.meta.env.VITE_DEFAULT_SUBGRAPH_MAINNET,
          subgraphArbitrum: import.meta.env.VITE_DEFAULT_SUBGRAPH_ARBITRUM,
          subgraphSepolia: import.meta.env.VITE_DEFAULT_SUBGRAPH_SEPOLIA,
          subgraphArbitrumSepolia: import.meta.env.VITE_DEFAULT_SUBGRAPH_ARBITRUM_SEPOLIA,
        }
      }
    }

    return {
      variables: {
        accounts: [ { "address": "0x1b92e4cba0f82c85c1298af861247849988c788c", "name": "vincenttaglia-indexer.eth", "active": true, "chain": "arbitrum-one", "agentConnect": false, "agentEndpoint": "", "poiQuery": false, "poiQueryEndpoint": "" } ],
        rpcMainnet: "https://mainnet.infura.io/v3/659344f230804542a4e653f875172105",
        rpcArbitrum: "https://arb-mainnet.g.alchemy.com/v2/er8LBcXpoFwlV8xJee-WXFbFG_M8L4JK",
        rpcSepolia: "https://eth-sepolia.g.alchemy.com/v2/eKJ8_13LMaVi2bSITYWTMqskgsGiey8K",
        rpcArbitrumSepolia: "https://arbitrum-sepolia.infura.io/v3/db92de7c459f4d83a2c2c21931a6bdf0",
        subgraphMainnet: "https://gateway-arbitrum.network.thegraph.com/api/146d8cd439901e24257f3c19d82359da/subgraphs/id/9Co7EQe5PgW3ugCUJrJgRv4u9zdEuDJf8NvMWftNsBH8",
        subgraphArbitrum: "https://gateway-arbitrum.network.thegraph.com/api/146d8cd439901e24257f3c19d82359da/subgraphs/id/DZz4kDTdmzWLWsV373w2bSmoar3umKKH9y82SUKr5qmp",
        subgraphSepolia: "https://gateway-arbitrum.network.thegraph.com/api/146d8cd439901e24257f3c19d82359da/subgraphs/id/8pVKDwHniAz87CHEQsiz2wgFXGZXrbMDkrxgauVVfMJC",
        subgraphArbitrumSepolia: "https://gateway-arbitrum.network.thegraph.com/api/146d8cd439901e24257f3c19d82359da/subgraphs/id/3xQHhMudr1oh69ut36G2mbzpYmYxwqCeU6wwqyCDCnqV",
      }
    }
    
    
}