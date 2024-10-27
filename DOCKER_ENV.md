# Docker Environment Variables

### GRAPH_API_KEY
#### Description
Set Graph Studio API key. Substitutes `[api-key]` or `{api-key}` in `DEFAULT_SUBGRAPH_*` and `DEFAULT_QOS_SUBGRAPH` ENV variables.
#### Example
```
GRAPH_API_KEY="3bab348a7c385b1870039eb890fd0a5f"
```

### DEFAULT_ACCOUNTS
#### Description
Override default accounts for users with no cache/local storage.
#### Example
```
DEFAULT_ACCOUNTS='[ { "address": "0x1b92e4cba0f82c85c1298af861247849988c788c", "name": "vincenttaglia-indexer.eth", "active": true, "chain": "arbitrum-one", "agentConnect": false, "agentEndpoint": "", "poiQuery": false, "poiQueryEndpoint": "" } ]'
```

### DEFAULT_QOS_SUBGRAPH
#### Description
Override default QoS subgraph.
#### Example
```
DEFAULT_QOS_SUBGRAPH="https://gateway.thegraph.com/api/[api-key]/subgraphs/id/Dtr9rETvwokot4BSXaD5tECanXfqfJKcvHuaaEgPDD2D"
```

### DEFAULT_SUBGRAPH_MAINNET
#### Description
Override default network subgraph for mainnet Ethereum.
#### Example
```
DEFAULT_SUBGRAPH_MAINNET="https://gateway.thegraph.com/api/[api-key]/subgraphs/id/9Co7EQe5PgW3ugCUJrJgRv4u9zdEuDJf8NvMWftNsBH8"
```

### DEFAULT_SUBGRAPH_ARBITRUM
#### Description
Override default network subgraph for Arbitrum.
#### Example
```
DEFAULT_SUBGRAPH_ARBITRUM="https://gateway.thegraph.com/api/[api-key]/subgraphs/id/DZz4kDTdmzWLWsV373w2bSmoar3umKKH9y82SUKr5qmp"
```

### DEFAULT_SUBGRAPH_SEPOLIA
#### Description
Override default network subgraph for Sepolia.
#### Example
```
DEFAULT_SUBGRAPH_SEPOLIA="https://gateway.thegraph.com/api/[api-key]/subgraphs/id/8pVKDwHniAz87CHEQsiz2wgFXGZXrbMDkrxgauVVfMJC"
```
### DEFAULT_SUBGRAPH_ARBITRUM_SEPOLIA
#### Description
Override default network subgraph for Arbitrum Sepolia.
#### Example
```
DEFAULT_SUBGRAPH_ARBITRUM_SEPOLIA="https://gateway.thegraph.com/api/[api-key]/subgraphs/id/3xQHhMudr1oh69ut36G2mbzpYmYxwqCeU6wwqyCDCnqV"
```

### DEFAULT_RPC_MAINNET
#### Description
Override default RPC for mainnet Ethereum. Used for querying pending rewards.
#### Example
```
DEFAULT_RPC_MAINNET="https://mainnet.infura.io/v3/659344f230804542a4e653f875172105"
```

### DEFAULT_RPC_ARBITRUM
#### Description
Override default RPC for Arbitrum. Used for querying pending rewards.
#### Example
```
DEFAULT_RPC_ARBITRUM="https://arb-mainnet.g.alchemy.com/v2/er8LBcXpoFwlV8xJee-WXFbFG_M8L4JK"
```

### DEFAULT_RPC_SEPOLIA
#### Description
Override default RPC for Sepolia. Used for querying pending rewards.
#### Example
```
DEFAULT_RPC_SEPOLIA="https://eth-sepolia.g.alchemy.com/v2/eKJ8_13LMaVi2bSITYWTMqskgsGiey8K"
```

### DEFAULT_RPC_ARBITRUM_SEPOLIA
#### Description
Override default RPC for Arbitrum Sepolia. Used for querying pending rewards.
#### Example
```
DEFAULT_RPC_ARBITRUM_SEPOLIA="https://arbitrum-sepolia.infura.io/v3/db92de7c459f4d83a2c2c21931a6bdf0"
```