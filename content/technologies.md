---
title: Technologies
date: 2017-03-23
draft: false
toc: true
---

> 💡 Cette page est susceptible d'être mise à jour à chaque évolution de la stack technique du site.
> _Dernière mise à jour : le **{{< last-modified >}}**_

## Application

### Architecture

Le site [jbuget.fr](https://jbuget.fr) adopte une architecture de type **Static Website** (site statique).

Dans la mesure où il s'agit principalement d'un **site éditorial** - présentation d'informations, articles, mise à disposition et publication de ressources - avec très peu d'interactions et _peu d'intelligence métier_, je ne voyais pas l'intérêt d'opter pour une architecture plus complexe type Single Page Application (SPA), Server Side Rendering (SSR) ou Progressive Webapp (PWA).

Mes principales préoccupations pour ce site sont : **la clarté et pertinence du contenu, la navigation, l'accessibilité et le référencement**.
En second focus, je conserve une attention et un soin particulier pour la sécurité (HTTPS), la performance et le respect des données personnelles (limiter les traqueurs, ou à tout le moins les contrôler le plus finement, en toute transparence).

### Framework

Le framework utilisé est **[Hugo](https://gohugo.io/)** (v{{< hugo-version >}}), un générateur de sites statiques open source.

Hugo offre propose nativement un ensemble très complet et très bien pensé de fonctionnalités et autres conventions.
En une commande (via le [CLI](https://gohugo.io/commands/)) il est possible de générer un site prêt-à-l'emploi avec un outillage efficace.
D'autant plus que la techno est développée en [Go](https://go.dev), ce qui rend toutes les opérations (processing, compilations, etc.) extrêmement rapides et peu gourmandes en ressources.

Même si je ne compte pas mettre à disposition le thème et les outils du site, j'ai pris le parti de mettre un maximum de choses (layouts, styles, fonts, scripts) dans un [_thème custom_](https://gohugobrasil.netlify.app/themes/creating/) baptisé `Bloodywood` (en référence au groupe de Metal Indien, découvert le jour de la création du site ^^). 

### Styles

Pour gérer les styles, j'utilise le langage **[SCSS](https://gohugo.io/hugo-pipes/scss-sass/)**, intégré et supporté nativement dans Hugo.
SCSS est un sur-ensemble du langage CSS, qui couvre toutes les fonctionnalités de celui-ci et en ajoute d'autres (ex : nesting, reference, interpolation, fonctions, etc.).

### Icônes

Les icônes du site proviennent de **[Font Awesome](https://fontawesome.com/)**, une bibliothèque d'icônes vectorielles très répandue.
Seul un sous-ensemble d'icônes (style _solid_) est intégré dans le thème afin de limiter le poids des ressources chargées.

### Recherche

Le site intègre **[Pagefind](https://pagefind.app/)** pour la recherche côté client.
Pagefind est une solution légère qui indexe le contenu statique au moment du build et permet une recherche instantanée directement dans le navigateur, sans serveur ni service tiers.
L'indexation est automatique à chaque déploiement via la commande `npx pagefind --site public`.

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

### CI/CD

Le déploiement du site est entièrement automatisé via **[Netlify](https://netlify.com)**.
À chaque push sur la branche `main` du dépôt GitHub, Netlify déclenche un pipeline de build qui :

1. Génère le site statique avec Hugo (`hugo --gc --minify`)
2. Indexe le contenu pour la recherche avec Pagefind (`npx pagefind --site public`)
3. Déploie les fichiers sur le CDN

Les _deploy previews_ sont également activées : chaque pull request génère un aperçu du site accessible via une URL temporaire.

## Propriété intellectuelle

### Code source

Le code source est publié et disponible sur **GitHub** : https://github.com/jbuget/jbuget.github.io.

### Licence

Le code source est distribué sous **[licence AGPL](https://fr.wikipedia.org/wiki/GNU_Affero_General_Public_License)** (v3).

Il s'agit d'une licence dite "permissive", au sens où "\[elle\] impose des restrictions minimales sur la manière dont les autres peuvent utiliser les composants open source" (cf. [open-source.developpez.com](https://open-source.developpez.com/actu/291693/Licences-open-source-2020-les-licences-permissives-en-croissance-continue-tandis-que-les-licences-copyleft-connaissent-un-lent-declin-selon-un-rapport/#:~:text=Une%20licence%20open%20source%20permissive,utiliser%20les%20composants%20open%20source.)).

Vous pouvez récupérer le code source, le modifier et même l'exploiter à toutes fins (dont commerciale).
Ce faisant, vous êtes tenus de rendre disponible le code source du logiciel (en l'occurrence, ce site Web) modifié lorsque ce dernier est mis à disposition du public par le biais d’un réseau à distance.

> 💡 Dans un monde idéal, j'aurais aimé séparer la licence du contenant (thème, scripts, ressources, configurations) de celle du contenu (dossier `/content` et `/data`) :
> couvrir les composants techniques avec une licence AGPL-3.0 et protéger le contenu intellectuel via une [licence CC-NC](https://creativecommons.org/licenses/by-nc/2.0/fr/)
>
> Dans les faits, pour rendre explicite cette intention, il semblerait que je doive gérer 2 entrepôts de code source.
> Cela irait à l'encontre de mes choix de design (stack simple, avec le minimum d'industrialisation et d'ingénierie) et des contraintes qui sont les miennes.
>
> Finalement, et dans la mesure où le droit de la propriété intellectuelle où la licence CC-NC ne pourrait pas s'appliquer aux 2 répertoires cités ci-dessus, je compte sur le civisme, le respect et la reconnaissance de tout un chacun pour ne pas diffuser mon contenu à des fins commerciales ou dans des conditions portant préjudice à mon travail.

## Misc

### Environnement de développement

Je ne m'empêche d'utiliser aucun outil ou éditeur de texte / code pour produire le contenu de ce site.

Dans les faits, au quotidien et le plus souvent, j'utilise **[VSCode](https://code.visualstudio.com/)**.

Comme tout dev moderne, j'ai intégré l'IA dans mon quotidien. J'utilise en priorité **[Claude Code](https://claude.ai/code)**, ou [ChatGPT](https://chat.openai.com/) (pour économiser des tokens pour autre chose que du dev).

La machine que j'utilise pour développer le site et produire le contenu est un **MacBook Pro 14 pouces 2023 d'Apple** : Apple M2 Max, 64 Go de RAM (le grand luxe !).

En guise de navigateur Web, j'alterne entre Chrome, Brave et **[Firefox](https://www.mozilla.org/fr/firefox/)**, ce dernier ayant ma préférence depuis quelques années.

### Web Analytics

Le site intègre **[Google Analytics](https://analytics.google.com/)** afin de suivre et comprendre l'audience du site, et ainsi pouvoir proposer un contenu et une expérience utilisateur pertinente et de qualité.

### SEO et référencement

Hugo génère automatiquement plusieurs ressources utiles au référencement :

- **[Sitemap XML](/sitemap.xml)** : plan du site mis à jour à chaque build
- **[Flux RSS](/index.xml)** : pour les lecteurs de flux
- **robots.txt** : fichier de directives pour les moteurs de recherche
- **Balises Open Graph et Twitter Cards** : intégrées dans le `<head>` de chaque page pour un rendu optimisé lors du partage sur les réseaux sociaux

### Raccourcisseur d'URL

La communication et le référencement sont pour moi des éléments importants relatifs au site.

Pour pouvoir disposer de souplesse, flexibilité, résilience, contrôle et métriques par rapport aux liens que je communique à chaque publication d'une nouvelle page ou article, j'utilise une application de gestion des URL.

J'ai opté pour **[Shlink](https://shlink.io)**, une solution open source que j'auto-héberge sur mon VPS PulseHeberg.
