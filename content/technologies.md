---
title: Stack technique
date: 2017-03-23
draft: false
---

> 💡 Cette page est susceptible d'être mise à jour à chaque évolution de la stack technique du site.
> _Dernière mise à jour : le **11/04/2022**_

## Table des matières

- [Application](#application)
  - [Architecture](#architecture)
  - [Framework](#framework)
  - [Styles](#styles)
  - [Fonts](#fonts)
- [Infrastructure](#infrastructure)
  - [DNS](#dns)
  - [Hébergement](#hébergement)
- [Propriété intellectuelle](#propriété-intellectuelle)
  - [Code source](#code-source)
  - [Licence](#licence)
- [Misc](#misc)
  - [Environnement de développement](#environnement-de-développement)
  - [Web Analytics](#web-analytics)
  - [Raccourcisseur d'URL](#raccourcisseur-durl)

## Application

### Architecture

Le site [jbuget.fr](https://jbguet.fr) adopte une architecture de type **Static Website** (site statique).

Dans la mesure où il s'agit principalement d'un **site éditorial** - présentation d'informations, articles, mise à disposition et publication de ressources - avec très peu d'interactions et _peu d'intelligence métier_, je ne voyais pas l'intérêt d'opter pour une architecture plus complexe type Single Page Application (SPA), Server Side Rendering (SSR) ou Progressive Webapp (PWA).

Mes principales préoccupations pour ce site sont : **la clarté et pertinence du contenu, la navigation, l'accessibilité et le référencement**.
En second focus, je conserve une attention et un soin particulier pour la sécurité (HTTPS), la performance et le respect des données personnelles (limiter les traqueurs, ou à tout le moins les contrôler le plus finement, en toute transparence).

### Framework

Le framework utilisé est **[Hugo](https://gohugo.io/)**, un générateur de sites statiques open source.

Hugo offre propose nativement un ensemble très complet et très bien pensé de fonctionnalités et autres conventions.
En une commande (via le [CLI](https://gohugo.io/commands/)) il est possible de générer un site prêt-à-l'emploi avec un outillage efficace.
D'autant plus que la techno est développée en [Go](https://go.dev), ce qui rend toutes les opérations (processing, compilations, etc.) extrêmement rapides et peu gourmandes en ressources.

Même si je ne compte pas mettre à disposition le thème et les outils du site, j'ai pris le parti de mettre un maximum de choses (layouts, styles, fonts, scripts) dans un [_thème custom_](https://gohugobrasil.netlify.app/themes/creating/) baptisé `Bloodywood` (en référence au groupe de Metal Indien, découvert le jour de la création du site ^^). 

### Styles

Pour gérer les styles, j'utilise le langage **[SCSS](https://gohugo.io/hugo-pipes/scss-sass/)**, intégré et supporté nativement dans Hugo.
SCSS est un sur-ensemble du langage CSS, qui couvre toutes les fonctionnalités de celui-ci et en ajoute d'autres (ex : nesting, reference, interpolation, fonctions, etc.).

### Fonts

La police d'écriture utilisée sur le site est **[Nunito](https://fonts.google.com/specimen/Nunito)**.
Pour des raisons de respect des données personnelles et de confidentialité des visiteurs, j'ai pris le parti de les héberger localement.
J'ai rédigé un article à ce propos : "[Utiliser des fonts Google localement avec Hugo](/posts/utiliser-des-fonts-google-localement-avec-hugo)".

## Infrastructure

### DNS

Le nom de domaine `jbuget.fr` est hébergé chez le fournisseur français **[Gandi](https://www.gandi.net/fr)**.

### Hébergement

Le site Web est déployé sur la plateforme d'hébergement Cloud **[Netlify](https://netlify.com)**.

Celle-ci propose un [support complet pour les applications Hugo](https://gohugo.io/hosting-and-deployment/hosting-on-netlify/) : CDN, déploiement continu, HTTPS, review apps, interface d'administration, etc.
Netlify se charge tout seul de générer et packager les ressources statiques depuis le code source.

Par ailleurs, l'hébergement est gratuit pour les sites de taille modeste, comme un site Web / blog personnel.
Le combo avec Hugo est d'autant plus rentable que la tarification de Netlify se base sur le _temps de build_, fortement réduit et optimisé par le CMS. 

## Propriété intellectuelle

### Code source

Le code source est publié et disponible sur **GitHub** : https://github.com/jbuget/jbuget.github.io.

### Licence

Le code source est distribué sous **[licence AGPL](https://fr.wikipedia.org/wiki/GNU_Affero_General_Public_License)** (v3).

Il s'agit d'une licence dite "permissive", au sens où "\[elle\] impose des restrictions minimales sur la manière dont les autres peuvent utiliser les composants open source" (cf. [open-source.developpez.com](https://open-source.developpez.com/actu/291693/Licences-open-source-2020-les-licences-permissives-en-croissance-continue-tandis-que-les-licences-copyleft-connaissent-un-lent-declin-selon-un-rapport/#:~:text=Une%20licence%20open%20source%20permissive,utiliser%20les%20composants%20open%20source.)).

Vous pouvez récupérer le code source, le modifier et même l'exploiter à toutes fins (dont commerciale).
Ce faisant, vous êtes tenus de rendre disponible le code source du logiciel (en l'occurrence, ce site Web) modifié lorsque ce dernier est mis à disposition du public par le biais d’un réseau à distance.

> 💡 Dans un monde idéal, j'aurais aimé séparer la licence du contenant (thème, scrips, ressources, configurations) de celle du contenu (dossier `/content` et `/data`) :
> couvrir les composants techniques avec une licence AGPL-3.0 et protéger le contenu intellectuel via une [licence CC-NC](https://creativecommons.org/licenses/by-nc/2.0/fr/)
>
> Dans les faits, pour rendre explicite cette intention, il semblerait que je doive gérer 2 entrepôts de code source.
> Cela irait à l'encontre de mes choix de design (stack simple, avec le minimum d'industrialisation et d'ingénierie) et des contraintes qui sont les miennes.
>
> Finalement, et dans la mesure où le droit de la propriété intellectuelle où la licence CC-NC ne pourrait pas s'appliquer aux 2 répertoires cités ci-dessus, je compte sur le civisme, le respect et la reconnaissance de tout un chacun pour ne pas diffuser mon contenu à des fins commerciales ou dans des conditions portant préjudice à mon travail.

## Misc

### Environnement de développement

Je ne m'empêche d'utiliser aucun outil ou éditeur de texte / code pour produire le contenu de ce site.

Dans les faits, au quotidien et le plus souvent, j'utilise l'IDE **[WebStorm](https://www.jetbrains.com/fr-fr/webstorm/)** de jetBrains.

La machine que j'utilise pour développer le site et produire le contenu est un **MacBook Pro d'Apple** : 15 pouces de 2016, 2,7 GHz Intel Core i7 quatre cœurs, 16 Go 2133 MHz LPDDR3, macOS BigSur.

En guise de navigateur Web, j'alterne à l'envie entre Chrome, Firefox et **Brave**, ce dernier ayant tout de même ma préférence. 

### Web Analytics

Le site intègre une solution de Web Analytics - **[Plausible](https://plausible.io/)** - afin de suivre et comprendre l'audience du site, et ainsi pouvoir proposer un contenu et une expérience utilisateur pertinente et de qualité.
Vous pouvez consulter en toute transparence les données récoltées à la page [/stats](/stats).

J'héberge moi-même la solution sur un VPS dédié, hébergé chez [PulseHeberg](https://pulseheberg.com/).
J'ai là aussi rédigé une série d'articles sur le sujet : "[Héberger ses propres services managés sur un VPS avec Træfik et Docker / Compose (part. 3)](/posts/héberger-ses-propres-services-managés-sur-un-vps-avec-traefik-et-docker-compose/part-3/)".

### Raccourcisseur d'URL

La communication et le référencement sont pour moi des éléments importants relatifs au site.

Pour pouvoir disposer de souplesse, flexibilité, résilience, contrôle et métriques par rapport aux liens que je communique à chaque publication d'une nouvelle page ou article, j'utilise une application de gestion des URL.

J'ai opté pour **[Shlink](https://shlink.io)**, une solution open source que j'auto-héberge sur mon VPS PulseHeberg.
