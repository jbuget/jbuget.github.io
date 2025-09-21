---
# Basic
title: "Déployer Shlink sur Scalingo"
slug: "deployer-shlink-sur-scalingo"
date: "2025-09-18T09:30:00+02:00"
lastmod: "2025-09-19T09:00:00+02:00"
draft: false

# SEO
description: "Guide complet pour auto‑héberger Shlink, le raccourcisseur d’URL open source, sur Scalingo. Buildpack custom, configuration PostgreSQL/Redis, variables d’environnement, domaine personnalisé et retours d’expérience."
summary: "Comment déployer Shlink sur Scalingo avec un buildpack custom : prérequis, configuration, déploiement, pièges et bonnes pratiques."
keywords: ["Shlink", "Scalingo", "Buildpack", "PaaS", "raccourcisseur d’URL", "URL shortener", "PHP", "RoadRunner", "Redis", "PostgreSQL", "open source", "self‑hosted"]

# Taxonomy
categories: ["DevOps", "Cloud", "PaaS"]
tags: ["Shlink", "Scalingo", "Buildpack", "URL shortener", "PHP", "RoadRunner", "Redis", "PostgreSQL", "Open Source", "Self‑Hosting"]
series: ["Guides de déploiement"]

# Author & social
author: "Jérémy Buget"
# images: ["/images/posts/deployer-shlink-sur-scalingo/shlink-scalingo.png"]
# canonicalURL: ""

# Options (selon thème Hugo)
# ShowToc: true
# TocOpen: true
# readingTime: true
# comments: true
# disableShare: false
---

**Table des matières**

- [Introduction](#introduction)
- [Pourquoi un raccourcisseur d'URL ?](#pourquoi-un-raccourcisseur-durl-)
- [Shlink, la solution open source de gestion de liens raccourcis](#shlink-la-solution-open-source-de-gestion-de-liens-raccourcis)
- [Scalingo, un hébergeur Platform-as-a-Service français 🇫🇷](#scalingo-un-hébergeur-platform-as-a-service-français-)
- [Auto-héberger une instance Shlink sur Scalingo](#auto-héberger-une-instance-shlink-sur-scalingo)
  - [1. Prérequis](#1-prérequis)
  - [2. Créer l’application dans Scalingo](#2-créer-lapplication-dans-scalingo)
    - [2.1. Déclarer l’application](#21-déclarer-lapplication)
    - [2.2. Ajouter PostgreSQL](#22-ajouter-postgresql)
    - [2.2. Ajouter Redis](#22-ajouter-redis)
  - [3. Configurer les variables d’environnement](#3-configurer-les-variables-denvironnement)
  - [4. Configurer le nom de domaine](#4-configurer-le-nom-de-domaine)
    - [4.1. Chez votre hébergeur DNS](#41-chez-votre-hébergeur-dns)
    - [4.2. Dans Scalingo](#42-dans-scalingo)
  - [5. Déployer le code](#5-déployer-le-code)
    - [Option 1 : via GitHub (recommandé)](#option-1--via-github-recommandé)
    - [Option 2 : via la CLI Scalingo](#option-2--via-la-cli-scalingo)
  - [6. Vérifier et administrer votre instance](#6-vérifier-et-administrer-votre-instance)
- [Le coin de la technique](#le-coin-de-la-technique)
  - [La technologie *buildpack*](#la-technologie-buildpack)
  - [Développement d'un *custom buildpack* pour Scalingo](#développement-dun-custom-buildpack-pour-scalingo)
  - [Développement du buildpack shlink-buildpack](#développement-du-buildpack-shlink-buildpack)
    - [Comment intégrer un environnement (PHP, Node.js, Java, etc.) requis par un buildpack](#comment-intégrer-un-environnement-php-nodejs-java-etc-requis-par-un-buildpack)
    - [Optimisation du build](#optimisation-du-build)
  - [Développement de l'app shlink-scalingo](#développement-de-lapp-shlink-scalingo)
    - [Le cas RoadRunner (RR)](#le-cas-roadrunner-rr)
    - [Problème de rate-limit de GitHub](#problème-de-rate-limit-de-github)
    - [Problème de délai au démarrage](#problème-de-délai-au-démarrage)
    - [Problème de caches de templates au démarrage](#problème-de-caches-de-templates-au-démarrage)
- [Conclusion](#conclusion)

## Introduction

Régulièrement, je vois apparaître le besoin de la part des équipes marketing / déploiement / support de pouvoir raccourcir, contrôler et suivre des URLs. La solution que j'ai pris l'habitude de mettre en place est [Shlink](https://shlink.io), qui se présente sous la forme d'un serveur back-end + API en PHP. Parce que j'aime bien héberger ce type d'applications sur une infrastructure de type Plateform-as-a-Service, j'ai développé récemment un buildpack de Shlink pour Scalingo, le PaaS français souverain.

## Pourquoi un raccourcisseur d'URL ?

J’ai souvent vu émerger le besoin d’un raccourcisseur d’URL, aussi bien dans des projets professionnels que personnels. Au départ, c’est presque toujours pour des raisons très concrètes et pratiques : simplifier des liens trop longs pour les rendre plus lisibles et partageables. Que ce soit dans un tweet, un SMS ou sur une affiche, chaque caractère compte. Un lien court est **plus esthétique, plus simple à saisir et parfois même moins coûteux** — par exemple dans une campagne SMS ou sur des supports imprimés où la place est limitée.

Mais assez vite, on se rend compte qu’un raccourcisseur peut aller bien au-delà de ça. En centralisant les redirections, il devient possible de suivre précisément l’usage qui est fait des liens : combien de clics, à quel moment, depuis quel canal de communication. C’est **un moyen efficace de mesurer l’impact d’une campagne et de prendre des décisions éclairées**, au lieu de travailler à l’aveugle. Dans un contexte marketing ou de communication publique, ces données sont précieuses pour comprendre ce qui fonctionne et optimiser les messages au fil du temps.

Un autre avantage auquel on ne pense pas forcément au début, c’est la flexibilité. Quand on diffuse un lien — ou pire, un QR code imprimé sur des centaines d’affiches —, il est en principe figé pour de bon. S’il y a une erreur dans l’URL ou si la page cible change, c’est souvent trop tard. Avec un raccourcisseur, on peut **mettre à jour la destination d’un lien existant, sans avoir à republier le support initial**. C’est un énorme gain de temps et cela évite bien des crises, notamment dans les campagnes où la réactivité est essentielle.

Et puis, au-delà de l’aspect purement fonctionnel, un raccourcisseur peut aussi **contribuer à l’image de marque**. En utilisant un domaine court et personnalisé — par exemple go.monorganisation.fr —, on renforce la cohérence et la crédibilité des communications. C’est un détail, mais il fait toute la différence entre un lien professionnel et un lien générique qui pointe vers un service tiers comme bit.ly ou tinyurl.com. Cela inspire confiance et donne une impression de sérieux et de maîtrise.

Enfin, il y a un aspect que je considère aujourd’hui comme stratégique : **la souveraineté et la maîtrise des données**. Externaliser ce type de service vers une plateforme étrangère, c’est confier à un tiers des informations sensibles sur votre communication et vos utilisateurs. Dans un contexte réglementaire comme le RGPD, ou tout simplement par souci d’indépendance, avoir votre propre solution — hébergée chez vous ou sur une plateforme cloud souveraine (comme Scalingo, cf. ci-dessous) — est un vrai atout. Cela vous garantit que vos données restent accessibles, sécurisées et sous votre contrôle, sans dépendre des décisions d’un acteur externe.

En bref, un raccourcisseur d’URL est souvent perçu comme un simple outil pratique pour faire des liens plus courts. Mais avec un peu de recul, on réalise que c’est bien plus que ça : un levier stratégique pour la communication, l’analyse et la maîtrise de votre écosystème numérique.

## Shlink, la solution open source de gestion de liens raccourcis

Quand on cherche une solution pour gérer des liens courts, on se rend vite compte qu’il existe beaucoup d’outils différents.
Globalement, on peut les ranger dans deux grandes catégories : les services SaaS clés en main et les solutions open source à héberger soi-même.

Du côté des services SaaS, on retrouve des acteurs bien connus comme Bitly, Rebrandly ou TinyURL. Leur force, c’est la simplicité : on crée un compte, et en quelques minutes on peut commencer à générer des liens courts. Pas besoin de serveurs, pas besoin de configuration compliquée.
Mais cette simplicité a un prix. D’abord, un prix littéral : dès qu’on veut aller un peu plus loin — statistiques avancées, redirections conditionnelles, domaine personnalisé —, il faut passer sur des offres payantes parfois coûteuses.
Ensuite, et c’est encore plus important, les données et la maîtrise de l’outil restent entre les mains du fournisseur. Ça peut vite devenir un problème pour des organisations qui doivent respecter des contraintes légales (RGPD par exemple) ou qui veulent éviter de dépendre d’un service externe pour quelque chose d’aussi central que leurs liens de communication.

À l’inverse, il existe des projets open source qui permettent d’héberger soi-même son raccourcisseur d’URL. L’avantage est évident : on garde le contrôle sur ses données et on peut personnaliser la solution selon ses besoins.
Parmi les plus connus, on peut citer :
- YOURLS : historique et très extensible grâce à ses nombreux plugins (11,5K ⭐️, en PHP) ;
- Kutt : une interface simple et claire, facile à prendre en main (10,1K ⭐️, en Node.js) ;
- Sink : dans la même philosophie que Shlink, avec un socle moderne (5,3K ⭐️, en Nuxt.js / TypeScript) ;
- WR.DO : très riche en fonctionnalités, proche de ce qu’on trouve dans des solutions SaaS comme TinyURL (1,9K ⭐️, en Nuxt.js / TypeScript) ;
- et bien sûr Shlink, dont je vais parler ici plus en détail (4,3K ⭐️, en PHP).

Ces solutions ne se valent pas toutes. Certaines sont très puissantes, mais demandent une vraie expertise pour être installées et maintenues. D’autres sont plus accessibles, mais peuvent vite atteindre leurs limites dans un contexte professionnel. Le choix dépend donc beaucoup de vos besoins et de votre capacité à les opérer.

Personnellement, j’ai choisi Shlink pour plusieurs raisons. D’abord, parce qu’il est **facile à déployer et à exploiter, tout en restant assez robuste pour gérer des usages complexes**. Shlink couvre très bien les besoins courants — créer et éditer des liens courts — mais propose aussi des fonctionnalités avancées comme le tracking détaillé des clics, l’analyse des campagnes ou la gestion dynamique des redirections.
Il expose une API REST complète et une CLI pratique, ce qui le rend facile à intégrer dans un écosystème existant ou dans des automatisations.

Un autre point fort, pour moi essentiel : **Shlink est entièrement open source**. Le code est public, ce qui veut dire que vous pouvez l’auditer, le modifier, ou même contribuer à son amélioration.
C’est un gage de transparence et de pérennité : le projet ne dépend pas d’une seule entreprise et peut continuer à vivre et évoluer, même si ses contributeurs actuels changent.

Enfin, **l’architecture de Shlink est volontairement simple et sûre**. Il repose sur des briques classiques et éprouvées : PHP pour le back-end, une base de données relationnelle pour le stockage. Pas besoin d’une usine à gaz pour le faire tourner, et c’est justement ce qui facilite son déploiement, que ce soit sur un serveur traditionnel ou sur une plateforme PaaS comme Scalingo.

En résumé, Shlink réussit à trouver le bon équilibre : il offre la liberté et la souveraineté d’une solution open source, sans sacrifier la simplicité et la puissance qu’on attend généralement d’un service commercial. C’est ce qui en fait, selon moi, un excellent choix pour toute organisation qui veut mettre en place un raccourcisseur d’URL fiable, sécurisé et évolutif, tout en restant maître de ses données et de ses usages.

## Scalingo, un hébergeur Platform-as-a-Service français 🇫🇷

Lorsqu’on décide d’héberger soi-même une application open source, plusieurs approches sont possibles. On peut installer un serveur ou un cluster (physique ou virtuel), configurer l’environnement à la main, gérer la base de données, la sécurité, les sauvegardes, la supervision, etc. Mais cela demande du temps, des compétences et une équipe technique disponible. Dans de nombreuses organisations — publiques comme privées ou personnelles —, cette approche devient vite lourde et coûteuse, surtout lorsqu’il s’agit de services périphériques mais stratégiques comme un raccourcisseur d’URL.

Cela fait des années que je déploie tout type d'applications Web (spécifiques ou tierces, dans un contexte pro ou perso) chez Scalingo, un hébergeur de type PaaS. J'ai déjà rédigé plusieurs articles sur le sujet (ici ou là).

Si vous souhaitez avoir un aperçu très complet de Scalingo, et pour ne pas alourdir inutilement cet article, je vous recommande chaudement de lire l'article de Stéphane Robert "[Scalingo : plateforme PaaS française souveraine](https://blog.stephane-robert.info/docs/cloud/scalingo/)" ou directement [la documentation officielle de l'éditeur](https://doc.scalingo.com/).

En bref, quand on manque d'une équipe, de compétences et de motivation à gérer soi-même de l'infra, et qu'on a des besoins / velléités de cloud souverain, Scalingo est une solution d'hébergement idéale 💪.

## Auto-héberger une instance Shlink sur Scalingo

Maintenant que nous avons choisi Shlink comme solution de raccourcisseur et suivi d'URL, et Scalingo comme plateforme d’hébergement, passons à la mise en pratique. L’objectif : déployer une instance de Shlink fonctionnelle, sécurisée et prête à être utilisée par vos équipes ou vos outils, le tout en quelques minutes seulement.

Dans cette section, je détaille les différentes étapes nécessaires, de la préparation à la mise en ligne, en passant par la configuration des variables d’environnement et la gestion des domaines personnalisés.

### 1. Prérequis

Avant de vous lancer, vous aurez besoin de trois éléments indispensables pour que Shlink fonctionne correctement :

1. **Une clé d’API GeoLite2** (MaxMind)
Shlink utilise les données de géolocalisation de MaxMind pour déterminer l’origine des clics.
    - Créez un compte gratuit sur [MaxMind](https://www.maxmind.com).
    - Générez une licence GeoLite2 et conservez la clé, que vous utiliserez dans vos variables d’environnement.
2. **Un token d’API GitHub**
Shlink peut être configuré pour récupérer ses mises à jour depuis GitHub.
    - Rendez-vous sur [GitHub – Developer Settings](https://github.com/settings/personal-access-tokens).
    - Générez un Personal Access Token (classic) avec au minimum le scope repo.
    - Notez-le précieusement.
3. **Une clé d’API admin pour Shlink**
Il vous faut une chaîne de caractères aléatoire qui servira de clé d’accès administrateur à l’API Shlink.
Vous pouvez la générer via votre terminal :

```shell
openssl rand -hex 32
```

Conservez bien cette valeur, elle sera à définir dans `INITIAL_API_KEY` (cf. ci-dessous).


### 2. Créer l’application dans Scalingo

Une fois vos clés prêtes, connectez-vous à Scalingo et créez une nouvelle application.

#### 2.1. Déclarer l’application

Depuis l’interface Scalingo ou la CLI :

```shell
scalingo create shlink-mondomaine-fr
```

Laissez la taille par défaut (M = 512 Mo), largement suffisante pour démarrer.

#### 2.2. Ajouter PostgreSQL

Shlink a besoin d’une base de données relationnelle.

```shell
scalingo --app shlink-mondomaine-fr addons-add postgresql postgresql-sandbox
```

L’offre Sandbox suffit pour commencer et peut être mise à niveau à tout moment.


#### 2.2. Ajouter Redis

Redis est utilisé par Shlink pour le caching et le Pub/Sub.

```shell
scalingo --app shlink-mondomaine-fr addons-add redis redis-sandbox
```
### 3. Configurer les variables d’environnement

Shlink repose sur un ensemble de variables d’environnement pour fonctionner correctement.
Certaines sont renseignées automatiquement par Scalingo lors de l’ajout des add-ons (comme `SCALINGO_POSTGRESQL_URL` ou `SCALINGO_REDIS_URL`), d’autres doivent être définies manuellement.

Voici la configuration minimale :

```shell
scalingo --app shlink-mondomaine-fr env-set \
  DB_DRIVER=postgres \
  DB_HOST=<db_host> \
  DB_PORT=<db_port> \
  DB_NAME=<db_name> \
  DB_USER=<db_user> \
  DB_PASSWORD=<db_password> \
  DEFAULT_DOMAIN=s.mondomaine.fr \
  GEOLITE_LICENSE_KEY=<votre_clef_maxmind> \
  GITHUB_TOKEN=<votre_token_github> \
  INITIAL_API_KEY=<votre_clef_api_shlink> \
  IS_HTTPS_ENABLED=true \
  REDIS_PUB_SUB_ENABLED=true \
  REDIS_SERVERS=$SCALINGO_REDIS_URL \
```

**Important** : Shlink n’interprète pas `DATABASE_URL`. Vous devez renseigner explicitement `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` et `DB_PASSWORD`. Ces valeurs se déduisent de `SCALINGO_POSTGRESQL_URL` (fournie automatiquement lors de l’ajout de l’add-on). Pour les extraire et les définir automatiquement :

```shell
APP=shlink-mondomaine-fr
PGURL=$(scalingo --app "$APP" env-get SCALINGO_POSTGRESQL_URL)
# PGURL ressemble à : postgres://user:password@host:port/dbname
DB_USER=$(printf "%s" "$PGURL" | sed -E 's#^postgres://([^:]+):.*#\1#')
DB_PASSWORD=$(printf "%s" "$PGURL" | sed -E 's#^postgres://[^:]+:([^@]+)@.*#\1#')
DB_HOST=$(printf "%s" "$PGURL" | sed -E 's#^postgres://[^@]+@([^:/]+):.*#\1#')
DB_PORT=$(printf "%s" "$PGURL" | sed -E 's#^postgres://[^@]+@[^:]+:([0-9]+)/.*#\1#')
DB_NAME=$(printf "%s" "$PGURL" | sed -E 's#^.*/([^/?]+)(\?.*)?$#\1#')

scalingo --app "$APP" env-set \
  DB_DRIVER=postgres \
  DB_HOST="$DB_HOST" \
  DB_PORT="$DB_PORT" \
  DB_NAME="$DB_NAME" \
  DB_USER="$DB_USER" \
  DB_PASSWORD="$DB_PASSWORD"
```

### 4. Configurer le nom de domaine

Pour que votre raccourcisseur soit accessible via un domaine personnalisé, deux étapes sont nécessaires :

#### 4.1. Chez votre hébergeur DNS

Créez un enregistrement CNAME pointant vers le domaine par défaut fourni par Scalingo (ex : shlink-mondomaine-fr.scalingo.io).

#### 4.2. Dans Scalingo

Associez votre domaine personnalisé :

```shell
scalingo --app shlink-mondomaine-fr domains-add s.mondomaine.fr
```

Scalingo gérera automatiquement le HTTPS via Let’s Encrypt une fois le domaine actif.

### 5. Déployer le code

Deux approches sont possibles pour déployer votre application Shlink sur Scalingo.

#### Option 1 : via GitHub (recommandé)

1. Forkez le dépôt jbuget/shlink-scalingo.
2. Dans Scalingo, configurez le déploiement automatique à partir de votre fork GitHub.
3. À chaque git push sur votre dépôt, Scalingo déploiera la nouvelle version.

#### Option 2 : via la CLI Scalingo

Déployez directement le code depuis une archive :

```shell
scalingo --app shlink-mondomaine-fr deploy https://github.com/jbuget/shlink-scalingo/archive/main.tar.gz
```

Quelques minutes plus tard, votre instance Shlink sera opérationnelle.

### 6. Vérifier et administrer votre instance

Une fois le déploiement terminé, votre instance Shlink est accessible et prête à être utilisée.

Pour l’administration via une interface graphique, deux solutions :

1. Utiliser l’interface officielle hébergée sur [app.shlink.io](https://app.shlink.io/) et y déclarer votre serveur.
2. Héberger votre propre instance du Shlink Web Client, si vous souhaitez un contrôle total. (Cette option sort du cadre de cet article, mais la documentation Shlink l’explique très bien.)

À ce stade, vous devriez disposer d'un raccourcisseur d’URL fonctionnel, sécurisé et souverain, prêt à être intégré dans vos outils internes ou vos campagnes de communication.

Dans la prochaine section, nous allons explorer plus en détail le buildpack custom que j’ai développé pour rendre ce déploiement aussi simple et automatisé que possible.


## Le coin de la technique

### La technologie *buildpack*

Scalingo s’appuie sur la **[spécification buildpacks](https://buildpacks.io/docs/reference/spec/)** (modèle largement popularisé par Heroku / Cloud Native Buildpacks) pour **détecter**, **construire** et **exécuter** les applications. Un buildpack sert à automatiser l’assemblage d'une app au moment du déploiement, sans avoir à gérer des serveurs ou des images à la main. Concrètement, c'est un petit ensemble de scripts qui : (1) reconnaît si l’app lui correspond, (2) prépare l’environnement d’exécution (runtime, extensions, dépendances), puis (3) publie ce qu’il faut pour démarrer l’app.

Un buildpack n’est ni un gestionnaire de paquets généraliste, ni un mécanisme d’héritage. On n"hérite" pas d’un autre buildpack ; on *chaîne* plusieurs buildpacks au niveau de l’application (multi‑buildpacks), chacun faisant sa part dans un ordre défini.

Ainsi, pour déployer une instance Shlink sur Scalingo, j'ai dû créer 2 repositories :
- **[shlink-buildpack](https://github.com/jbuget/shlink-buildpack)** : le buildpack qui permet de télécharger la distribution précompilée de Shlink, depuis l'entrepôt officiel (sur GitHub)
- **[shlink-scalingo](https://github.com/jbuget/shlink-scalingo)** : "l'app coquille" qui invoque successivement – via le fichier de configuration multi-buildpacks `.buildpacks` – le buildpack php-buildpack (propulsé par/pour Scalingo) puis le buildpack shlink-buildpack, avant d'exécuter le process web RoadRunner (serveur web PHP)

### Développement d'un *custom buildpack* pour Scalingo

Développer un buildpack spécifique est une tâche pas si compliquée en soi, mais qui nécessite malgré tout une bonne dose de rigueur, de logique et de patience. Si un seul de ces éléments manque, on peut très rapidement passer des heures à tourner en rond et en venir à (1) au mieux lancer plein de commandes inutiles ou mal exploitées ; (2) abandonner.

La première chose à faire est de regarder sur GitHub / Internet s'il n'existe pas de buildpack officiel ou maintenu par la communauté pour le service concerné. Avec Google et ChatGPT, il peut être intéressant de jeter un œil à [l'organisation GitHub de Scalingo](https://github.com/orgs/Scalingo/repositories?q=buildpack) (avec le filtre "buildpack").

> Dans le cas de Shlink, j'ai bien trouvé un projet [betagouv/shlink-buildpack](https://github.com/betagouv/shlink-buildpack/) (avec son pendant applicatif [betagouv/shlink-app](https://github.com/betagouv/shlink-app/)) mais il ne me paraît pas maintenu d'une part ; et d'autre part, je ne suis pas fan de l'approche retenue. Ce buidlpack part du code source de Shlink pour le compiler. Personnellement, lorsque j'intègre un service tiers, je privilégie de partir de la distribution pré-compilée / packagée. J'ai remarqué que ça accélère le temps de build (télécharger des fichiers vs. les télécharger + compiler des sources) ; les binaires obtenus sont souvent mieux optimisés ; les distributions fournissent le plus souvent des outils d'administration pratiques.

Si vous ne trouvez pas votre bonheur (le buildpack n'existe pas, ou l'existant ne vous satisfait pas – ex : il manque d'options de personnalisation / optimisation), alors il n'y a plus le choix : il faut se lancer dans le développement de son propre buildpack. Pour ce faire, le meilleur point de départ (pour un hébergement sur Scalingo) est de partir de [la documentation officielle de l'éditeur](https://doc.scalingo.com/platform/deployment/buildpacks/custom).

Si vous n'avez encore jamais travaillé avec le concept de buildpack, il peut aussi être intéressant de lire et s'inspirer de la documentation officielle des [Cloud Native Buildpacks](https://buildpacks.io/docs/). Remarque : il est important de garder en tête que l'implémentation par Scalingo diffère légèrement de la spécification, notamment au niveau des phases du cycle de vie. Scalingo s'attend à avoir des scripts Bash **bin/[detect|compile|release]**, quand la spécification attend les scripts **bin/[detect|build]**.

Il est possible de simuler le comportement de Scalingo au moment de charger un buildpack via Docker : 

```bash
# 1. Création d'un conteneur Docker avec la stack Scalingo
docker run --pull always --rm --interactive --tty --env STACK=scalingo-22 --volume /path/to/custom-buildpack:/buildpack --volume /path/to/application:/build scalingo/scalingo-22:latest bash

# 2. Création des répertoires utilisés pas le buildpack
mkdir /tmp/{cache,env}

# 3. Déplacement dans le répertoire /buildpack
cd /buildpack 

# 3. Exécution du script bin/detect
./bin/detect

# 3. Exécution du script bin/compile
./bin/compile /build /tmp/cache /tmp/env

# 4. Exécution du script bin/release
./bin/release
```

💡 Si l'application déployée est multi-buildpacks – exemple ici, la distribution Shlink nécessite d'avoir un environnement PHP prêt à l'emploi pour exécuter certaines commandes au démarrage de l'instance –, vous pouvez récupérer et invoquer [le projet multi-buildpack officiel](https://github.com/Scalingo/multi-buildpack) fourni par Scalingo plutôt que le vôtre.


### Développement du buildpack shlink-buildpack

#### Comment intégrer un environnement (PHP, Node.js, Java, etc.) requis par un buildpack

La communauté de Shlink fournit un effort important pour faciliter la vie des opérateurs qui souhaitent auto-héberger leur instance. Pour ce faire, l'équipe maintient et met à disposition tout un panel d'outils pour télécharger les dépendances. Ces outils prenents la forme de commandes et de CLIs PHP. D'où la nécessité de configurer l'environnement de déploiement de l'application pour qu'il puisse exécuter des programmes PHP.

Malheureusement, comme indiqué ci-haut, il n'est pas possible de faire hériter un buildpack d'un autre buildpack. Ainsi, dans le cas d'un déploiement de Shlink sur Scalingo, 2 options se sont offertes à moi : 
- forcer l'installation et la configuration de PHP dans le buildpack 
  - soit en forkant le repo php-buildpack et en ajoutant le téléchargement de Shlink
  - soit en ajoutant le code de téléchargement / configuration à la main au début du script **bin/compile**
- partir du principe que l'application qui utilisera shlink-buildpack doit fonctionner en mode multi-buildpacks avec php-buidlapck obligatoirement inscrit

Pour des raisons de maintenabilité et d'évolutivité (je n'ai pas envie d'avoir jamais à synchroniser le repository shlink-buildpack avec celui php-buildpack), j'ai opté pour le fonctionnement avec contrainte multi-buidlpacks.

#### Optimisation du build

J’ai activé l’usage de `CACHE_DIR` pour **mettre en cache la distribution Shlink** entre deux déploiements. Résultat : téléchargements plus rapides et builds plus stables, surtout quand on itère.


### Développement de l'app shlink-scalingo

#### Le cas RoadRunner (RR)

En self‑hosted, [Shlink recommande d’exécuter le code PHP via le serveur **RoadRunner**](https://shlink.io/documentation/supported-runtimes/serve-with-roadrunner/). Shlink fournit tout ce qu’il faut pour télécharger/configurer/lancer RR… via un **CLI PHP**. Or, un buildpack custom n’embarque pas d’outillage applicatif par défaut (hors outils Unix). À moins d’installer moi‑même PHP dans le buildpack (peu désirable, cf. paragraphe précédent), je ne pouvais pas appeler ce CLI pendant la phase *compile*. J’ai donc **déporté certaines étapes dans l’"app coquille"** (*shlink‑scalingo*), qui utilise une configuration **multi‑buildpacks** et lance les commandes au bon moment.

Une fois l'environnement et l'application correctement initialisés et prêts à être exécutés, je n'ai eu plus qu'à lancer RR avec les bonnes options.

```bash
echo "-----> Installing RR..."
php ./vendor/bin/rr get --no-interaction --location bin/ && chmod +x "./bin/rr"

echo "-----> Starting Shlink (via RR)..."
exec ./bin/rr serve -c config/roadrunner/.rr.yml
```

À noter que l'installation de RoadRunner par le script utilitaire ./vendor/bin/rr fourni par Shlink génère un fichier **config/roadrunner/.rr.yml**. Ce fichier se trouve directement [dans les sources de Shlink](https://github.com/shlinkio/shlink/blob/98b504a2de4988c3faff4de32c97b8d174bd0f0a/config/roadrunner/.rr.yml#L4).

Il est possible d'invoquer RR avec ses propres options ([cf. doc. officielle](https://github.com/roadrunner-server/roadrunner/blob/master/.rr.yaml)) de la façon suivante : 

```bash
exec ./bin/rr serve -c config/roadrunner/.rr.yml -o logs.channels.jobs.level=info
```

Plutôt que passer par RoadRunner, et dans la mesure où Scalingo fournit un serveur web par défaut, il est possible d'exposer directement les pages PHP via la commande :

```bash
php -d variables_order=EGPCS -S 0.0.0.0:$PORT -t public public/index.php
```

#### Problème de rate-limit de GitHub

Le projet RoadRunner met à disposition sa distribution sur GitHub. Ainsi, chaque fois que l'application se lance, Scalingo (ou plus précisément le script [bin/web.sh](https://github.com/jbuget/shlink-scalingo/blob/main/bin/web.sh)) télécharge le binaire depuis GitHub. À force d'essayer de faire fonctionner le buildpack + app, j'en suis venu à me prendre un rate-limit qui m'a bloqué.

Pour m'en sortir, j'ai dû créer une clé d'API personnelle dans GitHub. Par chance, le script **vendor/bin/rr** détecte la variable d'environnement `GITHUB_TOKEN` et en tient compte lors de la récupération du programme.

#### Problème de délai au démarrage

Scalingo fixe une limite de 60s pour que l'application démarre. Cette contrainte pousse à mettre un maximum de tâches (fetch, compute) en amont (dans le.s buildpack.s) ou dans une tâche annexe (script `postdeploy` ou tâche récurrente type `cron`).

J'ai dû désactiver le chargement des données de géolocalisation (référentiel "maxmind's geolite2") pour accélérer le démarrage de l'application et tenir le délai.


#### Problème de caches de templates au démarrage

J’ai aussi buté sur des erreurs d’initialisation : pendant un temps, il fallait `APP_ENV=dev` pour démarrer correctement (symptômes liés à du cache de templates/ressources). La solution robuste a été d’exécuter *à chaque démarrage* la commande d’initialisation : `vendor/bin/shlink-installer init` (déclenchée dans `web.sh`). Depuis, démarrages propres en production, sans forcer le mode *dev*.


## Conclusion

Mettre en place Shlink sur Scalingo, c’est cocher trois cases d’un coup : l’efficacité d’un raccourcisseur d’URL moderne, la maîtrise d’une solution open source, et la simplicité opérationnelle d’un PaaS souverain. Avec un buildpack dédié et une application coquille, le déploiement devient reproductible, rapide et lisible — sans « cuisine interne » ni serveurs à entretenir.

Dans cet article, vous avez vu les cas d’usage concrets, les raisons de préférer Shlink, puis un chemin de mise en production : création de l’app, ajout des add‑ons PostgreSQL/Redis, configuration des variables, rattachement du domaine, et déploiement via GitHub ou archive. Les deux dépôts publiés — `shlink-buildpack` et `shlink-scalingo` — encapsulent ces choix pour que vous puissiez démarrer vite, mettre à jour facilement et, si besoin, adapter la recette à vos contraintes.

Pour aller plus loin, vous pouvez héberger votre propre Web Client Shlink, brancher un CI/CD pour verrouiller vos mises en production, ajouter de la supervision (logs, métriques, alertes) et cadrer la gouvernance des liens (naming, domaines, durée de vie, rôles). Et si vos besoins évoluent, il suffira d’ajuster la configuration ou de changer la version déployée — sans remettre en cause l’architecture.
