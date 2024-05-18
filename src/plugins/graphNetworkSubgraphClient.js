import { loadDefaultsConfig } from "./defaultsConfig";
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'

const defaultsConfigVariables = await loadDefaultsConfig();
const defaultsConfig = defaultsConfigVariables.variables;
console.log("URI");
console.log(defaultsConfig.subgraphArbitrum);
// HTTP connection to the API
const httpLink = createHttpLink({
  // You should use an absolute URL here
  uri: defaultsConfig.subgraphMainnet,
});

const arbitrumHttpLink = createHttpLink({
  // You should use an absolute URL here
  uri: defaultsConfig.subgraphArbitrum,
});

const goerliHttpLink = createHttpLink({
  // You should use an absolute URL here
  uri: "https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-goerli",
});

const sepoliaHttpLink = createHttpLink({
  // You should use an absolute URL here
  uri: defaultsConfig.subgraphSepolia,
});

const arbitrumSepoliaHttpLink = createHttpLink({
  // You should use an absolute URL here
  uri: defaultsConfig.subgraphArbitrumSepolia,
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