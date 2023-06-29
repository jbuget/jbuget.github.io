---
title: "Moyens de communication entre deux systèmes d'information"
categories: ["architecture"]
keywords:
- architecture
- REST
- API
- GraphQL
- RPC
- CLI
- lib
- RPC
date: 2023-06-29T02:23:00+01:00
draft: true
summary: Il existe un grande nombre de façons de faire communiquer 2 systèmes.
---

## TL;DR

Il existe un grand nombre de façons de faire communiquer deux systèmes d'informations, que ce soit pour récupérer/envoyer de la données ou (faire) exécuter un traitement sur une machine à partir de l'autre.

- API web
- Webhooks
- CLI
- Libraries
  - API Client Wrappers
  - Widgets
- Iframes
- Web Components
- File System / (S)FTP + cron ou `sfwatch`
- Message Queues
- Publish/Subscribe (Pub/Sub) pattern
- RPC
- Shared Databases
- Messaging Protocols, ex : MQTT, AMQP, STOMP
- WebSockets
- Server-sent events

## Introduction

## API Web

Une API est un ensemble de définitions (ressources, méthodes) et de protocoles par lesquelles un programme peut interagir avec un autre.

On parle d'API web quand celle-ci est mise à disposition en exploitant le protocole HTTP et ses verbes `GET`, `POST`, `PUT`, `DELETE`, etc. Il existe différents types ou styles de *web services* : REST (à l'heure actuelle, le plus connu et répandu), GraphQL, SOAP, gRPC, etc.

Exemples d'API :
- [GitHub API](https://docs.github.com/en/rest/guides/getting-started-with-the-rest-api?apiVersion=2022-11-28)
- [PokeApi](https://pokeapi.co/)
- [IMDb API](https://aws.amazon.com/marketplace/pp/prodview-3n67c76ppu2yy?sr=0-1&ref_=beagle&applicationId=AWSMPContessa)
- [Beeceptor](https://beeceptor.com/)

## Webhooks

Un webhook est une "fonction de rappel" (i.e. *callback*) basée sur le protocole HTTP. Les webhooks permettent de déclencher une action suite à un événement, sur un mode proche du "semi-temps réel".

Exemples de cas d'usage : 
- notifier un système de livraison qu'un paiement opéré sur un système bancaire a bien été effectué, afin que la commande puisse être délivrée

Les webhooks peuvent être utilisés de deux façons :
- Pour recevoir une notification d’événement et la stocker => mode "push"
- Pour recevoir une notification d’événement et la transmettre => mode "pipe"

Les webhooks sont aussi parfois appelés "reverse API"

Liens
- [Qu’est-ce qu’un webhook et pourquoi l’utiliser ?](https://www.mailjet.com/fr/blog/bonnes-pratiques-emailing/webhook/#chapter-1)
- [Découvrir et mettre en œuvre les webhooks](https://mylittleneuron.com/2020/08/02/decouvrir-et-mettre-en-oeuvre-les-webhooks/)
- [L’usage des Webhooks dans les APIs](https://antistatique.net/blog/webhooks)
- [Webhooks.fyi](https://webhooks.fyi/)

## CLI