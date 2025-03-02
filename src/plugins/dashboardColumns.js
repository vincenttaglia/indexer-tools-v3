const allocationsDashboardColumns = [
  {
    title: 'Status',
    align: 'start',
    key: 'deploymentStatus.blocksBehindChainhead',
  },
  { title: 'Status Checks', key: 'deploymentStatus.health'},
  { title: 'Name', key: 'subgraphDeployment.versions[0].subgraph.metadata.displayName' },
  { title: 'Allocated', key: 'allocatedTokens'},
  { title: 'Network', key: 'subgraphDeployment.manifest.network'},
  { title: 'Created', key: 'createdAt' },
  { title: 'Allocation Duration', key: 'activeDuration'},
  { title: 'Current APR', key: 'apr'},
  { title: 'Est Daily Rewards', key: 'dailyRewards'},
  { title: 'Est Daily Rewards (After Cut)', key: 'dailyRewardsCut'},
  { title: 'Pending Rewards', key: 'pendingRewards.value'},
  { title: 'Pending Rewards (After Cut)', key: 'pendingRewardsCut'},
  { title: 'Current Signal', key: 'subgraphDeployment.signalledTokens'},
  { title: 'Current Proportion', key: 'proportion'},
  { title: 'Current Allocations', key: 'subgraphDeployment.stakedTokens'},
  { title: 'Total Query Fees', key: 'subgraphDeployment.queryFeesAmount'},
  { title: 'Total Indexing Rewards', key: 'subgraphDeployment.indexingRewardAmount'},
  { title: 'Deployment ID', key: 'subgraphDeployment.ipfsHash', sortable: false },
  { title: 'Allocation ID', key: 'id', sortable: false, width: "100px" },
  { title: 'Query Fees (1d)', key: 'qos.total_query_fees'},
  { title: 'Query Count (1d)', key: 'qos.query_count' },
  //{ title: 'Entities', key: 'upgradeIndexer'},
  { title: 'Avg Latency', key: 'qos.avg_indexer_latency_ms' },
  { title: 'Avg Query Fee', key: 'qos.avg_query_fee'},
  { title: 'Success Rate', key: 'qos.proportion_indexer_200_responses' },
  { title: 'Avg Blocks Behind', key: 'qos.avg_indexer_blocks_behind'},
  { title: 'Max Latency', key: 'qos.max_indexer_latency_ms'},
  { title: 'Max Blocks Behind', key: 'qos.max_indexer_blocks_behind'},
  { title: 'Successful Queries', key: 'qos.num_indexer_200_responses'},
  { title: 'Avg Query Fee', key: 'qos.avg_query_fee' },
  { title: 'Max Query Fee', key: 'qos.max_query_fee' },
  { title: 'Network Query Fees (1d)', key: 'queryFees.total_query_fees'},
  { title: 'Network Queries (1d)', key: 'queryFees.query_count'},
  { title: 'Avg Network Latency', key: 'queryFees.avg_gateway_latency_ms' },
  { title: 'Avg Network Query Fee', key: 'queryFees.avg_query_fee'},
  { title: 'Network Success Rate', key: 'queryFees.gateway_query_success_rate' },
];
const subgraphsDashboardColumns = [
  { title: 'Status', key: 'deploymentStatus.blocksBehindChainhead', align: 'start' },
  { title: 'Name', key: 'deployment.versions[0].metadata.subgraphVersion.subgraph.metadata.displayName' },
  { title: 'Network', key: 'deployment.manifest.network'},
  { title: 'Created', key: 'deployment.createdAt' },
  { title: 'Current APR', key: 'apr'},
  { title: 'New APR', key: 'newApr'},
  { title: 'Max Allocation', key: 'maxAllo'},
  { title: 'Est Daily Rewards (Before Cut)', key: 'dailyRewards'},
  { title: 'Est Daily Rewards (After Cut)', key: 'dailyRewardsCut'},
  { title: 'Current Signal', key: 'deployment.signalledTokens'},
  { title: 'Entities', key: 'upgradeIndexer'},
  { title: 'Current Proportion', key: 'proportion'},
  { title: 'Current Allocations', key: 'deployment.stakedTokens'},
  //{ title: 'Total Query Fees', key: 'deployment.queryFeesAmount'},
  //{ title: 'Total Indexing Rewards', key: 'deployment.indexingRewardAmount'},
  { title: 'Query Fees (1d)', key: 'queryFees.total_query_fees'},
  { title: 'Queries (1d)', key: 'queryFees.query_count'},
  { title: 'Deployment ID', key: 'deployment.ipfsHash', sortable: false },
  { title: 'Avg Latency', key: 'queryFees.avg_gateway_latency_ms' },
  { title: 'Avg Query Fee', key: 'queryFees.avg_query_fee'},
  { title: 'Success Rate', key: 'queryFees.gateway_query_success_rate' },
];

export { subgraphsDashboardColumns, allocationsDashboardColumns };