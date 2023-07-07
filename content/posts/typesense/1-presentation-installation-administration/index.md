---
title: À la découverte de Typesense, le moteur de recherche open source (part. 1)
categories: ["technology"]
keywords:
- typesense
- search engine
- open source
date: 2023-07-05T08:35:00-01:00
draft: true
summary: Typesense est un moteur d'indexation et recherche distribué sous licence open source. C'est une alternative crédible à Algolia (SaaS), ElasticSearch (ex-open source), OpenSearch (fork open source de ElasticSearch initié et mené par Amazon) ou MeiliSearch (autre moteur open source).
---

## Table des matières

- [Introduction](#introduction)
- [Présentation](#présentation)
- [Installation](#installation--configuration)
    - [1. Configurer la zone DNS](#1-configurer-la-zone-dns)
    - [2. Définir la stack Docker Compose](#2-définir-la-stack-docker-compose)
    - [3. Démarrer les services Traefik et Typesense](#3-démarrer-les-services-traefik-et-typesense)
    - [(option) Installation locale avec Docker](#option-installation-locale-avec-docker)
- [Usage](#usage)
- [Administration](#exploitation--administration)
    - [Endpoints](#endpoints)
    - [Dashboard](#dashboard)
- [Intégration](#intégration)
- [Conclusion](#conclusion)


## Introduction

Voilà plusieurs mois que j'entendais parler de Typesense, un moteur d'indexation et de recherche, alternative à Algolia ou ElasticSearch. La première fois, c'était lorsque je cherchais une solution pour proposer de la recherche sur mon mon site (celui-là même où vous lisez ces lignes), un site statique généré grâce au CMS Hugo. 

Récemment, un collègue – Louis-Jean, si tu passes par là 😘 – a monté un POC basé sur MeiliSearch, une autre alternative open source du domaine. Je me suis dit que c'était l'occasion d'étudier la solution et son écosystème.

## Présentation

Typesense est un moteur d'indexation et recherche distribué sous licence open source (TODO: indiquer licence). C'est une alternative à Algolia (SaaS), ElasticSearch (ex-*vrai* open source), OpenSearch (fork open source de ElasticSearch initié et mené par Amazon) ou MeiliSearch (autre moteur open source).

Typesense permet d'indexer des *collections* de *documents* afin de faire de la recherche full-text sur les champs définis / requêtés des documents indexés.
{.pros}

Typesense propose plusieurs modes d'installations, ainsi qu'un déploiement en cluster pour les architectures et systèmes traitant de gros volumes de données.
{.pros}

Je trouve que Typesense est plus simple à appréhender, installer, configurer et administrer qu'ElasticSearch ou son fork, OpenSearch. Plus simple aussi, à mon sens, que MeiliSearch, l'autre alternative open source aux deux premiers, qui nécessite de gérer un serveur frontal (Nginx, Caddy, Apache, HA Proxy) en amont.
{.pros}

Tout comme les autres solutions concurrentes du marché, Typesense se gère principalement via une API RESTful, elle aussi très accessible :
- des endpoints en écriture pour déclarer les schémas de documents
- un endpoint en écriture pour insérer et indexer les données
- un endpoint en lecture pour requêter des documents (avec des paramètres de filtrage, tri, pagination, sélection de champs, etc.)
- des endpoints d'administration et monitoring
{.pros}

Pour permettre aux utilisateurs d'un site d'effectuer des recherches via Typesense, il convient d'ajouter du code ou d'intégrer des composants / libs UI côté front-end.

Typesense est compatible avec `InstantSearch.js` le composant de barre de recherche intelligente initié, développé et maintenu par Algolia (merci à eux). La lib d'adaptation est `typesense-instantsearch-adapter`.
{.pros}

## Installation

Typesense propose une offre SaaS appelée [Typesense Cloud](https://cloud.typesense.org/).

Ce qui m'intéresse plus est la possiblité d'installer le système sur sa machine ou en mode *self-hosting*.

Ci-dessous, la procédure pour installer et configurer une instance de Typesense sur un VPS (dans mon cas hébergé chez PulseHeberg) supervisé via Traefik avec Docker & Compose.

### 1/ Configurer la zone DNS

Je recommande de commencer par cette étape afin d'éviter des soucis de génération de certificats Let's Encrypt par Traefik (au moment où il découvre et se met à gérer un service Docker).

```yaml
# Extrait de la zone DNS pour example.com
traefik 10800 IN A 12.34.56.78
typesense 10800 IN CNAME traefik.example.com.
```

> On utilisera le domaine `example.com` pour illustrer les exemples de l'article. L'IP `12.34.56.78` est celle du serveur sur lequel est déployé l'instance de Traefik.

### 2/ Définir la stack Docker Compose

Celle-ci définit : 
- 1 conteneur Traefik
- 1 conteneur TYpesense
- 1 réseau "web" externe (auquel peuvent se brancher d'autres conteneurs, sur d'autres stacks)

> 💡 J'ai rédigé une série d'articles pour découvrir comment [héberger ses propres services managés sur un VPS avec Træfik et Docker / Compose](/posts/héberger-ses-propres-services-managés-sur-un-vps-avec-traefik-et-docker-compose/part-1/).

```yaml
# docker-compose.yml
version: '3'

services:

  traefik:
    image: traefik:v2.10.3
    command:
      - "--api"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.file.directory=/etc/traefik"
      - "--providers.file.watch=true"
      - "--entrypoints.http.address=:80"
      - "--entrypoints.http.http.redirections.entryPoint.to=https"
      - "--entrypoints.http.http.redirections.entrypoint.scheme=https"
      - "--entrypoints.https=true"
      - "--entrypoints.https.address=:443"
      - "--certificatesresolvers.myresolver.acme.tlschallenge=true"
      - "--certificatesresolvers.myresolver.acme.email=admin@example.com"
      - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=web"
      - "traefik.http.routers.api.rule=Host(`traefik.example.com`)"
      - "traefik.http.routers.api.entrypoints=https"
      - "traefik.http.routers.api.tls.certresolver=myresolver"
      - "traefik.http.routers.api.service=api@internal"
    networks:
      - web
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - "./letsencrypt:/letsencrypt"
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./traefik:/etc/traefik"
      - "./traefik/log:/var/log"

  typesense:
    image: typesense/typesense:0.24.1
    command: '--data-dir /data --api-key=vive_l_eau_petillante --enable-cors'
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=web"
      - "traefik.http.routers.typesense.rule=Host(`typesense.example.com`)"
      - "traefik.http.routers.typesense.entrypoints=https"
      - "traefik.http.routers.typesense.tls.certresolver=myresolver"
      - "traefik.tcp.routers.typesense.tls.passthrough=true"
      - "traefik.http.services.typesense.loadbalancer.server.port=8108"
    networks:
      - web
    volumes:
      - ./typesense-data:/data

networks:
  web:
    external: true
```

> ℹ️ À titre perso, sur mon serveur, le service Traefik est défini dans un fichier `docker-compose.yml` spécifique et dédié. Comme je propulse et administre une douzaine de services, ça me permet de mieux organiser et découper mon infra.

Suite à des expériences douloureuses de conteneurs Docker qui s'auto-update… et plantent, j'ai pris l'habitude de spécifier la version des composants et services que je déclare. En l'occurrence, ici, j'utilise l'image `traefik:v2.10.3` ([lien](https://hub.docker.com/layers/library/traefik/v2.10.3/images/sha256-79c24d0686fa0679cde49f275e694afb7ef6d182b9fe21a219463e2a6bfe4ece?context=explore)) et `typesense:0.24.1` ([lien](https://hub.docker.com/layers/typesense/typesense/0.24.1/images/sha256-e6ef6a082a62fb19c7fa80f596293f6519ce445670a59ae6ec4b750283865859?context=explore)).

Quand on déclare un conteneur Typesense, le plus simple (mais il est possible et même recommander d'aller plus loin pour la production) pour pouvoir l'exploiter en sécurité est d'expliciter une clé d'API via l'argument `--api-key=xxx`.

Surtout, on n'oublie pas de dire à Traefik d'exposer le port `8108`, port exposé par défaut par l'image Typesense.

### 3/ Démarrer les services Traefik et Typesense

C'est aussi simple que faire : 

```shell
$ docker compose up -d
```

À partir de là, l'instance est fonctionnelle, écoute en interne (sur le réseau `web`) sur le port 8108, et est accessible depuis l'extérieur, à l'adresse `typesense.example.com`. Grâce à Traefik (et le libellé Docker `"traefik.http.services.typesense.loadbalancer.server.port=8108"`) il n'y a pas besoin de préciser de port (par défaut, il s'agira du port `80`).

### (option) Installation locale avec Docker

Pour celles et ceux qui veulent juste lancer une instance de Typesense en local pour voir vite fait ce que ça donne :

```yaml
# docker-compose.yml
version: '3'

services:

  typesense:
    image: typesense/typesense:0.24.1
    volumes:
      - ./typesense-data:/data
    command: '--data-dir /data --api-key=vive_l_eau_petillante --enable-cors'
    ports:
      - "8108:8108"
```

## Usage

Maintenant qu'on a une instance qui tourne, accessible sur Internet, nous pouvons commencer à définir des indexes, schémas de données, collections et documents.

**1. Déclarer un schéma de données "books"**

```shell
$ curl https://typesense.example.com/collections \
        -X POST \
        -H "X-TYPESENSE-API-KEY: vive_l_eau_petillante" \
        -d '{
              "name": "books",
              "fields": [
                {"name": "title", "type": "string" },
                {"name": "author", "type": "string" },
                {"name": "ratings", "type": "int32" }
              ],
              "default_sorting_field": "ratings"
            }'
```

Les différents types possibles sont définis dans [cette section](https://typesense.org/docs/0.24.1/api/collections.html#field-types).

**2. Injecter des documents de type "books"**

```shell
$ curl https://typesense.example.com/collections/books/documents/import \
        -X POST \
        -H "X-TYPESENSE-API-KEY: vive_l_eau_petillante" \
        -d '
          {"title":"Book 1","author":"Author1","ratings":24}
          {"title":"Book 2","author":"Author2","ratings":31}
          {"title":"Book 3","author":"Author3","ratings":30}'
```

**3. Récupérer tous les "books"**

```shell
$ curl https://typesense.example.com/collections/books \
        -H "X-TYPESENSE-API-KEY: vive_l_eau_petillante" \
        | jq
```

> 💡 Comme d'habitude, dès que je dois manipuler des données JSON, je sors `jq` 🔥

## Administration

### Endpoints

> **🚧 TODO** Ajouter `/metrics`, `healthz`, `/admin` ?

### CLI

> **🚧 TODO** Ajouter https://github.com/AlexBV117/typesense-cli

### Collection Postman

Typesense maintient et met à disposition une collection Postman avec les différents services consommables via l'API Restful

> **🚧 TODO** Ajouter https://github.com/typesense/postman
>
> Maintenue à jour ?

### Dashboard

Par défaut, Typesense ne fournit aucune interface graphique d'administration de la plateforme ou des objets (collections, documents). En revanche, ils en proposent une avec la version SaaS.
{.cons}

Heureusement, des âmes charitables se sont emparé du sujet et proposent une application web open source : [typesense-dashboard](https://github.com/bfritscher/typesense-dashboard).
{.pros}

La même équipe expose gratuitement [une instance](https://bfritscher.github.io/typesense-dashboard/#/collection/structures/search) sur internet, via GitHub Pages.

> ⚠️ Attention ! Il s'agit d'une application pure front-end (avec des appels AJAX) qui vous demande de saisir vos identifiants de serveur Typesense. On ne peut jamais être certain de ce qui est déployé sur Internet. L'application me paraît saine à utiliser mais pour des systèmes complexes et critiques en production, je déconseille l'usage de cette application au profit de votre propre client ou isntance.

> **🚧 TODO** Ajouter une capture d'écran

Typesense Dashboard est plutôt complète et permet de connaître l'état du système (ressources consommées, mémoire, etc.), de gérer (CRUD) les collections et documents, d'effectuer des recherches, de tester des requêtes, etc.
{.pros}

## Intégration

Contrairement à Algolia, Typesense ne propose pas de bibliothèques de composants UI sur étagère ou *built-in*.
{.cons}

Cependant, Typesense maintient et met à disposition [plusieurs clients dans différents langages](https://typesense.org/docs/guide/installing-a-client.html) (JavaScript, PHP, Python, etc.).

Le plus simple, pour intégrer le moteur de recherche à son site, est de suivre [le guide officiel](https://typesense.org/docs/guide/building-a-search-application.html).


https://github.com/typesense/typesense-instantsearch-demo 

## Conclusion

Cet article n'est qu'une introduction à Typesense.

La simplicité de mise en œuvre et d'utilisation me pousse à croire que la solution est moins avancée que des solutions plus établies comme ElasticSearch (et la suite ELK), OpenSearch (géré par Amazon qui propose des commodités d'infra, via ses services AWS) ou un éditeur SaaS tel qu'Algolia (mais qui facture une blinde).

Cela dit, de tout ce que j'ai vu et testé jusqu'à présent, la solution a l'air déjà très mature et me semble couvrir tous les besoins généraux pour des systèmes classiques de petite et moyennes tailles (au pif, < 100 000 documents, < 100 000 utilisateurs/jours).

Je ne sais pas ce que ça vaut en termes de clustering et scaling horizontal.

J'ai vu des pages de documentaion à propos de la recherche géo-spatiale ou vectorielle. Je n'ai pas testé. Je ne sais pas dans quelle mesure elle est efficace, pratique et facile à mettre en œuvre.

Enfin, je vois des intégrations pour pas mal de frameworks. Malheureusement, pas d'intégration pour Hugo 😢. Je ne sais pas dans quelle mesure c'est simple à intégrer au cycle de compilation en vue de l'industrialiser.

Finalement, c'est une très belle surprise et une nouvelle arme précieuse dans mon arsenal technique ✅.