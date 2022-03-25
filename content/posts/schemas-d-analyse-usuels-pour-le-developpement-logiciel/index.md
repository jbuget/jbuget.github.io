---
title: "Schémas d'analyse usuels pour le développement logiciel"
categories: ["architecture"]
date: 2022-03-26T00:09:49+01:00
draft: true
summary: Le quotidien de toute développeur se résume à être confronté à des problèmes, élaborer des solutions adéquates, et les mettre en œuvre de la meilleure façon possible. S'en sortir et s'épanouir dans le chaos apparent de complexité qui en découle n'est pas chose aisée. Un moyen simple et efficace d'y parvenir est de développer et d'exploiter des _schémas de réflexion_, sortes d'arbres de modélisation & décision plus ou moins génériques servant de guides à l'effort d'ingénierie logicielle.

---

## TL;DR

Le quotidien de toute développeur se résume à être confronté à des problèmes, élaborer des solutions adéquates, et les mettre en œuvre de la meilleure façon possible.
C'est une activité qui implique de se confronter en continu à tout un tas de questions ; évaluer sans cesse un éventail de réponses plus ou moins claires, maîtrisées, adaptées ; pour finalement prendre des décisions aux conséquences inévitables, dans des contextes avec des conditions chaque fois différentes, fluctuantes ou difficilement maîtrisables.

S'en sortir et s'épanouir dans ce chaos apparent de complexité n'est pas chose aisée.
Un moyen simple et efficace d'y parvenir est de développer et d'exploiter des **_schémas d'analyse_, sortes d'arbres de modélisation & décision plus ou moins génériques** servant de guides à l'effort d'ingénierie logicielle.

Ceux-ci peuvent être binaires ("read/query VS. write/command", "transactionnel VS. décisionnel", "structurel VS. comportemental", "temps réel VS. batch") ou multidimensionnels ("MVC/3-tiers", "ETL/IPOS").
Les premiers favorisent une réflexion / projection / interprétation en vue de comparer, éliminer ou trancher.
Les seconds inclinent à catégoriser, répartir ou équilibrer des forces ou responsabilités.

## Table des matières

- [Introduction](#introduction)
- [Conclusion](#conclusion)

## Introduction

Avec le temps et les expériences, lorsqu'il s'agit de développement pur (*), j'ai de plus en plus l'impression d'être confronté à des situations déjà vécues, ou à tout le moins, pas tout à fait inconnues.

> (*) Pour ce qui est des situations managériales, organisationnelles, culturelles ou impliquant des humains, en revanche, le "sentiment de contrôle" est bien plus subtil, voire risqué.

C'est le cas quand je suis confronté à un challenge d'implémentation ; un bug de production ; un problème de perf / sécu / accessibilité / internationalisation ; la découverte d'une nouvelle technologie ; l'industrialisation ou l'automatisation de certaines tâches ou process.

À chaque fois, j'en viens rapidement à me dire : "hum… ça me rappelle telle ou telle chose, ou cette fois-là quand (bla bla bla)… etc.".
Bref, **j'ai le sentiment de plus en plus profond et grand que _c'est toujours la même chose_.**

Attention ! je ne parle pas de lassitude du métier et de l'activité de développement informatique.
Au contraire, je suis content et rassuré d'avoir toujours cette impression de "pouvoir / savoir faire".
Elle me permet d'aborder une situation, peut-être parfois compliquée, voire complexe, de façon plus sereine, moins stressante.
De fait, cette sensation de confiance et de maîtrise me permet de me lancer et donc d'avancer plus vite (au moins au début).
Reste à m'assurer que c'est dans la bonne direction, ou que dans le contraire, l'échec ne me coûte pas trop.

Malgré les années, je pense qu'il me reste encore énormément de choses à apprendre, découvrir, approfondir pour devenir un meilleur développeur.
Je reste motivé comme jamais par ce métier que j'aime et qui m'offre le luxe de très bien vivre et mon envie de m'améliorer est intacte.

**Une façon de progresser est de m'interroger sans cesse sur ce que je ne sais pas, ce que j'aimerais savoir, mais surtout de remettre en cause ou en perspective ce que je sais (ou crois savoir) et ce que je fais (et comment).**

> _« Ce que l'on conçoit bien s’énonce clairement,
> et les mots pour le dire viennent aisément »_
> 
> -- Nicolas Boileau-Despréaux

Théoriser sur mes pratiques ou mes états d'esprits est pour moi un passage obligatoire pour prétendre à un niveau supérieur.

C'est dans cette optique que je me suis penché sur cette fameuse impression de contrôle évoquée ci-haut, pourquoi je la ressens et comment l'exploiter au mieux.

Et la meilleure réponse que j'y trouve actuellement est que j'ai développé et j'utilise (plus ou moins consciemment) **toute une panoplie de questionnements préliminaires à l'étude d'un problème, que j'appelle "schémas d'analyse"**.
 
## Définition d'un "schéma d'analyse"

> Quand on évoque les méthodes d'analyse de problème, [la méthode des 5Ws](https://en.wikipedia.org/wiki/Five_Ws) ([QQOQCCP](https://fr.wikipedia.org/wiki/QQOQCCP) en 🇫🇷) vient assez rapidement.
> Il s'agit d'une excellente méthode de questionnement générale qui offre un très bon cadre d'analyse.
> Mais elle ne satisfait pas à mon propos.
> 
> Le type de réflexion qui m'intéresse est exclusivement centré sur la technique, l'implémentation ou l'architecture (applicative ou de SI).  

**J'appelle "schéma d'analyse", la réflexion, pour un problème donné, sur un aspect particulier, parmi l'ensemble des dimensions à considérer pour bien comprendre une situation et pouvoir prendre la meilleure décision.**

Exemples : 
- est-ce qu'une approche ETL (Extract-Transform-Load de données) est pertinente ? si oui, comment ? qu'est-ce qu'il faut ?
- dans quelle mesure une approche MVC/3-tiers est-elle adaptée ?
- est-ce que la problématique traitée est plutôt structurelle (organisation des sources/composants logiciels) ou comportementale (gestion de fonctionnalités, briques/couches/dépendances logicielles) ?

## Schéma d'analyse binaires ou multidimensionnels

Je distingue 2 types de schémas d'analyse :
- binaires
- multidimensionnels

**Les schémas binaires** ont pour enjeu de décider qu'un problème, dans son contexte, dispose plutôt (ou complètement) de la caractéristique A ou B.
Ils favorisent une réflexion / projection / interprétation en vue de comparer, éliminer ou trancher.

**Les schémas multidimensionnels** ont pour enjeu de pondérer les caractéristiques d'un problème parmi un ensemble défini de propriétés possibles.
Ils inclinent à catégoriser, répartir ou équilibrer des forces ou responsabilités.

> Le terme multidimensionnel est emprunté au champ lexical des mathématiques qui l'associe à un espace à plus (au sens, "au moins") trois dimensions.

## Quantification, taxonomie et usage

Tout comme il existe une quasi-infinité d'outils, de techniques et de façons de s'en servir, j'estime qu'**il existe une infinité de schémas d'analyse**.

Je pars du principe que les schémas d'analyse que je présente ci-dessous me sont propres, même si je pense qu'ils sont suffisamment génériques pour pouvoir être partagés et se révéler utiles pour le plus grand nombre.

Rien n'empêche tout un chacun de les ignorer ou se façonner les siens.

## Lecture VS. écriture

Le tout premier point que je considère à chaque fois est le côté "avec ou sans effet de bord sur le système" d'une problématique ou sa solution.

Le terme "[effet de bord](https://fr.wikipedia.org/wiki/Effet_de_bord_(informatique))" désigne la modification d'un état interne du système par un stimulus ou évènement extérieur.
La modification d'une ligne en base de données suite à une interaction IHM ou API est un effet de bord.
Idem pour la modification d'une ressource en mémoire ou en cache, d'un fichier, ou encore la sollicitation d'un Web Service ou API externe elle-même à effet de bord.

Parmi les synonymes du terme effet de bord, on trouve : _side effect_, mutation, commande ([au sens CQRS](https://martinfowler.com/bliki/CQRS.html)) écriture, édition, modification, mise à jour, etc.

Plus simplement, la première question que je me pose est : "suis-je en présence d'un problème de lecture ou d'écriture ?"



## Transactionnel VS. décisionnel

## Structurel VS. comportemental

## Séquentiel VS. parallèle

## Synchrone VS. asynchrone

## Real-time VS. batch processing

## One-shot VS. durable

## MVC / 3-tiers

## ETL & IPOS




## Conclusion 

Le développement logiciel offre une infinité de situations, problématiques et solutions.
D'autant plus qu'il est mis en œuvre par des équipes et des individualités qui elles-mêmes sont toutes différentes et amenées à évoluer.
Il existe rarement une seule et unique façon de résoudre un problème et c'est bien là l'enjeu et la difficulté du métier.

Avec le temps, chacun se construit et cultive sa propre trousse à outils technologiques et méthodologiques.
Les schémas d'analyse sont l'un d'entre eux.
Ils ne sont pas une réponse immédiate et universelle à tous les problèmes.
Mais ils sont très souvent un bon point de départ qui permet de rapidement se repérer dans un contexte, considérer des directions possibles ou souhaitables et se lancer sur l'un des chemins avec suffisamment de confiance.

Finalement, que ce soit avec un GPS, une carte, une boussole ou juste les étoiles comme guide, la destination et l'issue dépendront toujours du talent – et de l'état d'esprit – des personnes ayant pris part au voyage.
