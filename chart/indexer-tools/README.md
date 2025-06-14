# Helm Chart Indexer-tools-v3

## Author: @pamanseau by Chain-Insights.io

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) ![Version: 1.0.4](https://img.shields.io/badge/Version-1.0.4-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square)


## Specifications

Dependencies:

- Kubernetes v1.28+
- Cert-manager


 ClusterIP Ports:

 - POD 3000 http
 - Ingress 80:3000

## Docker File build command

If you would like to build your own Docker Image. The helm chart is using the official one.

Change the prefix `pamanseau` for your repository name

```sh
export TAG="3.3.6-hotfix"
docker build --platform=linux/amd64 -t pamanseau/indexer-tools:$TAG -f Dockerfile . \
&& docker tag pamanseau/indexer-tools:$TAG pamanseau/indexer-tools:latest \
&& docker login \
&& docker push pamanseau/indexer-tools:$TAG \
&& docker push pamanseau/indexer-tools:latest
```

## Helm Values.yaml

Copy values.yaml to values-prod.yaml and make the necessary changes in values-prod.yaml for:

- `config:` Configuration variables that creates the `/app/public/indexer-tools-config.json`
- `ingress:` Configure your ingress with SSL and annotate depending on your cert-manager

See [Configuration Documentation](https://github.com/vincenttaglia/indexer-tools-v3/blob/master/DOCKER_ENV.md)

## Helm Deployment

> [!IMPORTANT] Change the namespace to be in the same namespace of your graph node deployment.

```sh
helm upgrade --install indexer-tools chart/indexer-tools --namespace graph-node -f chart/indexer-tools/values-prod.yaml
```

## Port Forward Network-Indexer-Agent

> [!WARNING] To keep your network-indexer-agent secure we do a port-forward to your local

> [!IMPORTANT] Change the namespace to be where you deployed the indexer-tools

```sh
kubectl port-forward service/graph-network-indexer-agent 8000:8000 -n graph-node
```

### Visit your ingress address