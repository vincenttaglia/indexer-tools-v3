#!/bin/sh

NO_ENV_ACCOUNTS='[ { "address": "0x1b92e4cba0f82c85c1298af861247849988c788c", "name": "vincenttaglia-indexer.eth", "active": true, "chain": "arbitrum-one", "agentConnect": false, "agentEndpoint": "", "poiQuery": false, "poiQueryEndpoint": "" } ]'

JSON_STRING="{
  \"DEFAULT_ACCOUNTS\": ${DEFAULT_ACCOUNTS:-$NO_ENV_ACCOUNTS},
  \"DEFAULT_RPC_MAINNET\": \"${DEFAULT_RPC_MAINNET:-https://mainnet.infura.io/v3/659344f230804542a4e653f875172105}\",
  \"DEFAULT_RPC_ARBITRUM\": \"${DEFAULT_RPC_ARBITRUM:-https://arb-mainnet.g.alchemy.com/v2/er8LBcXpoFwlV8xJee-WXFbFG_M8L4JK}\",
  \"DEFAULT_RPC_SEPOLIA\": \"${DEFAULT_RPC_SEPOLIA:-https://eth-sepolia.g.alchemy.com/v2/eKJ8_13LMaVi2bSITYWTMqskgsGiey8K}\",
  \"DEFAULT_RPC_ARBITRUM_SEPOLIA\": \"${DEFAULT_RPC_ARBITRUM_SEPOLIA:-https://arbitrum-sepolia.infura.io/v3/db92de7c459f4d83a2c2c21931a6bdf0}\",
  \"DEFAULT_SUBGRAPH_MAINNET\": \"${DEFAULT_SUBGRAPH_MAINNET:-https://gateway-arbitrum.network.thegraph.com/api/146d8cd439901e24257f3c19d82359da/subgraphs/id/9Co7EQe5PgW3ugCUJrJgRv4u9zdEuDJf8NvMWftNsBH8}\",
  \"DEFAULT_SUBGRAPH_ARBITRUM\": \"${DEFAULT_SUBGRAPH_ARBITRUM:-https://gateway-arbitrum.network.thegraph.com/api/146d8cd439901e24257f3c19d82359da/subgraphs/id/DZz4kDTdmzWLWsV373w2bSmoar3umKKH9y82SUKr5qmp}\",
  \"DEFAULT_SUBGRAPH_SEPOLIA\": \"${DEFAULT_SUBGRAPH_SEPOLIA:-https://gateway-arbitrum.network.thegraph.com/api/146d8cd439901e24257f3c19d82359da/subgraphs/id/8pVKDwHniAz87CHEQsiz2wgFXGZXrbMDkrxgauVVfMJC}\",
  \"DEFAULT_SUBGRAPH_ARBITRUM_SEPOLIA\": \"${DEFAULT_SUBGRAPH_ARBITRUM_SEPOLIA:-https://gateway-arbitrum.network.thegraph.com/api/146d8cd439901e24257f3c19d82359da/subgraphs/id/3xQHhMudr1oh69ut36G2mbzpYmYxwqCeU6wwqyCDCnqV}\",
  \"DEFAULT_QOS_SUBGRAPH\": \"${DEFAULT_SUBGRAPH_ARBITRUM_SEPOLIA:-https://gateway.thegraph.com/api/146d8cd439901e24257f3c19d82359da/subgraphs/id/Dtr9rETvwokot4BSXaD5tECanXfqfJKcvHuaaEgPDD2D}\"
}"

echo $JSON_STRING > /app/public/indexer-tools-config.json

echo $JSON_STRING > /app/dist/indexer-tools-config.json

exec "$@"