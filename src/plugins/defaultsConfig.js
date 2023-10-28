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
    console.log("RESP");
    console.log(resp);
    console.log(import.meta.env.VITE_DEFAULT_ACCOUNTS);
    if(resp.ok){
      const value = await resp.json()

      return {
          variables: {
            accounts: value.DEFAULT_ACCOUNTS,
            rpcMainnet: value.DEFAULT_RPC_MAINNET,
            rpcArbitrum: value.DEFAULT_RPC_ARBITRUM,
            rpcGoerli: value.DEFAULT_RPC_GOERLI,
          }
      }

    }else if(import.meta.env.VITE_DEFAULT_ACCOUNTS != undefined){
      return {
        variables: {
          accounts: JSON.parse(import.meta.env.VITE_DEFAULT_ACCOUNTS),
          rpcMainnet: import.meta.env.VITE_DEFAULT_RPC_MAINNET,
          rpcArbitrum: import.meta.env.VITE_DEFAULT_RPC_ARBITRUM,
          rpcGoerli: import.meta.env.VITE_DEFAULT_RPC_GOERLI,
        }
      }
    }

    return {
      variables: {
        accounts: [ { "address": "0xeddd4ec5d3775de964416b7b9d4da885f530f90a", "name": "vincenttaglia.eth", "active": true, "chain": "mainnet", "agentConnect": false, "agentEndpoint": "" }, { "address": "0x1b92e4cba0f82c85c1298af861247849988c788c", "name": "vincenttaglia-indexer.eth", "active": true, "chain": "arbitrum-one", "agentConnect": false, "agentEndpoint": "" } ],
        rpcMainnet: "https://mainnet.infura.io/v3/659344f230804542a4e653f875172105",
        rpcArbitrum: "https://arb-mainnet.g.alchemy.com/v2/er8LBcXpoFwlV8xJee-WXFbFG_M8L4JK",
        rpcGoerli: "https://goerli.infura.io/v3/659344f230804542a4e653f875172105",
      }
    }
    
    
}