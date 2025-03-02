import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'

// HTTP connection to the API
const httpLink = createHttpLink({
  // You should use an absolute URL here
  uri: "https://indexer.upgrade.thegraph.com/status",
});

const cache = new InMemoryCache();

export const upgradeIndexerClient = new ApolloClient({
  link: httpLink,
  cache,
});