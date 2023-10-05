import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'

// HTTP connection to the API
const httpLink = createHttpLink({
  // You should use an absolute URL here
  uri: "http://10.0.11.206:18000",
});

// Cache implementation
const cache = new InMemoryCache();

// Create the apollo client
export const agentApolloClient = new ApolloClient({
  link: httpLink,
  cache,
});