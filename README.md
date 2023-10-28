# Indexer Tools v3
### [Website](https://indexer-tools.vincenttaglia.com)

## About
Indexer tools aims to be the one-stop-shop for indexers that are a part of the Graph Protocol's decentralized network. View allocations via the Allocation Dashboard, filter subgraphs in the Subgraph Dashboard, calculate the effectiveness of potential allocations in the Allocation Wizard, and more to come soon!

Indexer Tools utilizes Vue 3's Composition API and Vuetify 3's component framework in an effort to create a more sustainable project architecture.

## Requirements
* Node v16
* Yarn

## Project setup

```
yarn
```

### Compiles and hot-reloads for development

```
yarn dev
```

### Set default variables

#### Build-time
```
cp .env.example .env
```
#### Runtime
```
cp indexer-tools-config.json.example public/indexer-tools-config.json
```

### Compiles and minifies for production

```
yarn build
```

### Serve compiled app
```
yarn start
```

### Lints and fixes files

```
yarn lint
```

### Customize configuration

See [Configuration Reference](https://vitejs.dev/config/).
