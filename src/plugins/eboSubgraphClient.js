import { loadDefaultsConfig, replaceAPI } from "./defaultsConfig";
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'

const defaultsConfigVariables = await loadDefaultsConfig();
const defaultsConfig = defaultsConfigVariables.variables;

// HTTP connection to the API
const httpLink = createHttpLink({
  // You should use an absolute URL here
  uri: replaceAPI(defaultsConfig.eboMainnet, defaultsConfig.apiKey),
});

const arbitrumHttpLink = createHttpLink({
  // You should use an absolute URL here
  uri: replaceAPI(defaultsConfig.eboArbitrum, defaultsConfig.apiKey),
});

const sepoliaHttpLink = createHttpLink({
  // You should use an absolute URL here
  uri: replaceAPI(defaultsConfig.eboSepolia, defaultsConfig.apiKey),
});

const arbitrumSepoliaHttpLink = createHttpLink({
  // You should use an absolute URL here
  uri: replaceAPI(defaultsConfig.eboArbitrumSepolia, defaultsConfig.apiKey),
});

// Cache implementation
const cache = new InMemoryCache();
const arbitrumCache = new InMemoryCache();
const sepoliaCache = new InMemoryCache();
const arbitrumSepoliaCache = new InMemoryCache();

// Create the apollo client
export const mainnetEboClient = new ApolloClient({
  link: httpLink,
  cache,
});

export const arbitrumEboClient = new ApolloClient({
  link: arbitrumHttpLink,
  cache: arbitrumCache,
});

export const sepoliaEboClient = new ApolloClient({
  link: sepoliaHttpLink,
  cache: sepoliaCache,
});

export const arbitrumSepoliaEboClient = new ApolloClient({
  link: arbitrumSepoliaHttpLink,
  cache: arbitrumSepoliaCache,
});