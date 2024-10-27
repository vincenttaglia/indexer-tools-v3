# Indexer Tools v3
### [Official Deployment](https://indexer-tools.vincenttaglia.com)

## About
Indexer tools aims to be the one-stop-shop for indexers that are a part of the Graph Protocol's decentralized network. View allocations via the Allocation Dashboard, filter subgraphs in the Subgraph Dashboard, calculate the effectiveness of potential allocations in the Allocation Wizard, and more to come soon!

Indexer Tools utilizes Vue 3's Composition API and Vuetify 3's component framework in an effort to create a more sustainable project architecture.

# Custom Deployments
### API Keys
Custom deployments require a Graph Studio API key, available here:

https://thegraph.com/studio/apikeys/
## Docker
### Requirements
* Docker
* Graph Protocol API Key

### Pull Docker Image
```
docker pull ghcr.io/vincenttaglia/indexer-tools:latest
```
### Run Image
List of available ENV variables [here](./DOCKER_ENV.md)
```
docker run \
  -p 3000:3000 \
  -e GRAPH_API_KEY=your-api-key \
  ghcr.io/vincenttaglia/indexer-tools
```

## Build Manually
### Requirements
* Node v16
* Yarn
* Graph Protocol API Key

### Install Dependencies
```
yarn
```

### Set default variables
```
cp .env.example .env
```
```
sed -i "/VITE_GRAPH_API_KEY=/c\VITE_GRAPH_API_KEY=your-api-key" .env
```

### Compile and minifiy for production

```
yarn build
```

### Serve compiled app
```
yarn start
```