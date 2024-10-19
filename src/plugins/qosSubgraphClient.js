import { loadDefaultsConfig } from "./defaultsConfig";
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'

const defaultsConfigVariables = await loadDefaultsConfig();
const defaultsConfig = defaultsConfigVariables.variables;

// HTTP connection to the API
const httpLink = createHttpLink({
  // You should use an absolute URL here
  uri: defaultsConfig.qosSubgraph,
});

const cache = new InMemoryCache();

export const qosSubgraphClient = new ApolloClient({
  link: httpLink,
  cache,
});