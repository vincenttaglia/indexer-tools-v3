import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'

// HTTP connection to the API
const httpLink = createHttpLink({
  // You should use an absolute URL here
  uri: "https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-mainnet",
});

const arbitrumHttpLink = createHttpLink({
  // You should use an absolute URL here
  uri: "https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-arbitrum",
});

const goerliHttpLink = createHttpLink({
  // You should use an absolute URL here
  uri: "https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-goerli",
});

const sepoliaHttpLink = createHttpLink({
  // You should use an absolute URL here
  uri: "https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-sepolia",
});

const arbitrumSepoliaHttpLink = createHttpLink({
  // You should use an absolute URL here
  uri: "https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-arbitrum-sepolia",
});

// Cache implementation
const cache = new InMemoryCache();
const arbitrumCache = new InMemoryCache();
const goerliCache = new InMemoryCache();
const sepoliaCache = new InMemoryCache();
const arbitrumSepoliaCache = new InMemoryCache();

// Create the apollo client
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache,
});

export const arbitrumApolloClient = new ApolloClient({
  link: arbitrumHttpLink,
  cache: arbitrumCache,
});

export const goerliApolloClient = new ApolloClient({
  link: goerliHttpLink,
  cache: goerliCache,
});

export const sepoliaApolloClient = new ApolloClient({
  link: sepoliaHttpLink,
  cache: sepoliaCache,
});

export const arbitrumSepoliaApolloClient = new ApolloClient({
  link: arbitrumSepoliaHttpLink,
  cache: arbitrumSepoliaCache,
});