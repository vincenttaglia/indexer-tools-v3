import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'

// HTTP connection to the API
const httpLink = createHttpLink({
  // You should use an absolute URL here
  uri: "https://gateway.thegraph.com/api/146d8cd439901e24257f3c19d82359da/subgraphs/id/Dtr9rETvwokot4BSXaD5tECanXfqfJKcvHuaaEgPDD2D",
});

const cache = new InMemoryCache();

export const qosSubgraphClient = new ApolloClient({
  link: httpLink,
  cache,
});