#!/bin/sh

NO_ENV_ACCOUNTS='[ { "address": "0xeddd4ec5d3775de964416b7b9d4da885f530f90a", "name": "vincenttaglia.eth WORKSS", "active": true, "chain": "mainnet", "agentConnect": false, "agentEndpoint": "" }, { "address": "0x1b92e4cba0f82c85c1298af861247849988c788c", "name": "vincenttaglia-indexer.eth", "active": true, "chain": "arbitrum-one", "agentConnect": false, "agentEndpoint": "" } ]'

JSON_STRING="{
  \"DEFAULT_ACCOUNTS\": ${DEFAULT_ACCOUNTS:-$NO_ENV_ACCOUNTS},
  \"DEFAULT_RPC_MAINNET\": \"${DEFAULT_RPC_MAINNET:-https://mainnet.infura.io/v3/659344f230804542a4e653f875172105}\",
  \"DEFAULT_RPC_ARBITRUM\": \"${DEFAULT_RPC_ARBITRUM:-https://arb-mainnet.g.alchemy.com/v2/er8LBcXpoFwlV8xJee-WXFbFG_M8L4JK}\",
  \"DEFAULT_RPC_GOERLI\": \"${DEFAULT_RPC_GOERLI:-https://goerli.infura.io/v3/659344f230804542a4e653f875172105}\"
}"

echo $JSON_STRING > /app/public/indexer-tools-config.json

echo $JSON_STRING > /app/dist/indexer-tools-config.json

exec "$@"