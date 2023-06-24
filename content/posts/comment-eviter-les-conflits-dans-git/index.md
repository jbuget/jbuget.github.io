---
title: "Comment éviter les conflits dans Git"
categories: ["bonnes pratiques"]
keywords:
- git
- organisation
- lifestyle
- methodologie
date: 2023-06-20T00:19:00+01:00
draft: true
summary: Rencontrer des conflits de fusion avec Git et devoir les résoudre est rarement une situation agréable et peut parfois tourner au cauchemar. La meilleure façon de traiter les conflits efficacement est de les éviter, les réduire ou les prévenir autant que possible. Pour ce faire, il existe certaines techniques, bonnes pratiques, outils et autres astuces.
---

## TL;DR

- Comprendre Git et ce qu'est un conflit de fusion
- Découper intelligemment les travaux en amont
- Communiquer, communiquer, communiquer
- Synchroniser très souvent et régulièrement
- Travailler sur des branches distantes
- Faire des commits fréquents et atomqiques
- Disposer d'un harnais de tests automisés et l'exécuter avant chaque commit / push
- Standardiser et contrôler automatiquement des règles de code
- Résoudre les conflits rapidement

--- 


Lorsque l'on travaille sur un projet en équipe, il est courant de rencontrer des conflits d'édition ou fusion de code. C'est une situation tout à fait "normale" de Git.

Si le plus souvent, tout se passe très bien, la résolution de conflit reste un exercice délicat et dans certains cas, la situation peut rapidement déraper et [virer au cauchemar (pendant des heures, des jours, voire des mois)](/posts/techniques-pour-fusionner-deux-versions-d-un-projet-shopify-grace-a-git).

**La meilleure façon de traiter les conflits efficacement est de les éviter, les réduire ou les prévenir autant que possible.** Pour ce faire, il existe certaines techniques, bonnes pratiques, outils et autres astuces.

## 1. Comprendre Git et ce qu'est un conflit de fusion

C'est tout à fait basique, mais la première chose à faire pour éviter des conflits de Git est de comprendre *a minima* comment fonctionne le logiciel de gestion de versions et les concepts qu'il met en œuvre ou implémente : 
- l'aspect décentralisé via les *remotes* (distant et local),
- le suivi et indexation des modifications via la notion d'*areas* (working, staging, commited),
- la façon de modéliser des changements de code à travers les *commits*,
- la parallélisation de chantiers grâce au système de *branches*,
- etc.

Aussi, il est primordial de comprendre ce qu'est un conflit de fusion (aussi appelé "conflit de merge"), ce que cela signifie, pour quel scope, dans quelles circonstances il survient, quand, pourquoi et comment le résoudre ("`git rebase -i` mon ami pour la vie ❤️"), etc. 

Le site d'Atlassian fournit [une bonne explication](https://www.atlassian.com/fr/git/tutorials/using-branches/merge-conflicts) :

> Les conflits surviennent généralement lorsque deux personnes ont modifié les mêmes lignes dans un fichier, ou si un développeur a supprimé un fichier alors qu'un autre développeur le modifiait. Dans ces cas, Git ne peut pas déterminer automatiquement la version correcte. Les conflits n'affectent que le développeur qui effectue le merge, les autres membres de l'équipe ne sont pas conscients du conflit. Git marquera le fichier comme étant en conflit et arrêtera le processus de merge. Il incombe alors aux développeurs de résoudre le conflit.

Il existe plusieurs situations classiques, récurrentes ou banales qui peuvent entraîner l'apparition d'un conflit parmi lesquelles : 
- **modification concurrente** : quand plusieurs développeurs modifient la même ligne de code d'un même fichier et tentent de fusionner le changement sur une même branche ; quand on effectue un *cherry-pick de commit* et que les changements contenus dans celui-ci portent sur le même fichier ou ligne(s) de code
- **suppression de code / fichier** : quand un développeur supprime un fichier (ou une ligne), qu'un autre développeur a édité(e), et que chacun des deux cherchent à fusionner sa modification sur une même branche ;
- **déplacement ou renommage de fichier** : quand un développeur renomme ou déplace un fichier, pendant que dans le même temps, un autre développeur y a apporté des modifications
- **fusion de branches** : lorsqu'un développeur souhaite intégrer une branche sur une autre, toutes deux ayant subies des modifications aux mêmes endroits, ex : au moment de fusionner une pull / merge request (resp. GitHub/GitLab), opération consistant à réintégrer la branche Git correspondante sur la branche principale du repository (`main` ou `master`) ;
- **rebasage de branche** : lorsque l'on effectue une opération de *rebasage* ("action consistant à décaler une série de commits") sur une branche

Ce ne sont là que quelques situations. Il en existe beaucoup d'autres, plus contextuelles ou spécifiques. Je vous laisse et vous souhaite le plaisir de les découvrir par vous-mêmes 😂. *Indice : en général, ça se produit quand on on y est le moins apprêté / propice à gérer ces situations 😭…*

Il existe tout plein de ressources très bien faites (et en français), expliquant comment résoudre un conflit de Git. Je n'aborderai pas ce sujet dans cet article.

## 2. Découper intelligemment les travaux en amont

## 3. Communiquer, communiquer, communiquer

## 4. Synchroniser très souvent et régulièrement


## 5. Travailler sur des branches distantes


## 6. Faire des commits fréquents et atomqiques


## 7. Disposer d'un harnais de tests automisés et l'exécuter avant chaque commit / push


## 8. Standardiser et contrôler automatiquement des règles de code


## 9. Résoudre les conflits rapidement




************

Les conflits de fusion sont courants lorsqu'il s'agit de travailler avec Git, en particulier lorsque plusieurs développeurs modifient le même fichier simultanément. Voici quelques bonnes pratiques, astuces et outils pour prévenir ou éviter les conflits de fusion :

Effectuez des mises à jour régulières : Assurez-vous de tirer régulièrement les dernières modifications du référentiel distant pour vous synchroniser avec les dernières mises à jour effectuées par d'autres développeurs. Cela réduit les chances de conflits lorsque vous fusionnez vos modifications.

Travaillez sur des branches distinctes : Il est recommandé de créer des branches distinctes pour chaque fonctionnalité, correctif de bug ou tâche sur laquelle vous travaillez. Cela vous permet de travailler indépendamment des autres développeurs et de fusionner vos modifications plus facilement par la suite.

Faites des commits fréquents et atomiques : Effectuez des commits réguliers et logiques pour diviser votre travail en modifications cohérentes et plus petites. Cela facilite la gestion des conflits, car vous pouvez fusionner et résoudre les conflits au fur et à mesure de l'avancement de votre travail.

Utilisez des outils de gestion de code source : De nombreux outils de gestion de code source, tels que GitLab, GitHub ou Bitbucket, fournissent des fonctionnalités intégrées pour faciliter la collaboration et la résolution de conflits. Ils offrent des fonctionnalités telles que les demandes de fusion, les commentaires sur le code et la visualisation des différences entre les versions, ce qui facilite la détection et la résolution des conflits.

Effectuez des tests avant de fusionner : Avant de fusionner vos modifications, assurez-vous de tester votre code localement pour vous assurer qu'il fonctionne correctement. Cela peut aider à identifier les conflits potentiels et les problèmes de compatibilité avant la fusion.

Communiquez avec les autres développeurs : Si vous savez qu'un autre développeur travaille sur une partie du code sur laquelle vous allez également intervenir, communiquez avec lui pour coordonner vos efforts et éviter les conflits autant que possible.

Résolvez les conflits rapidement : Si un conflit survient lors de la fusion, il est préférable de le résoudre rapidement. Utilisez des outils de résolution de conflits intégrés à Git pour comprendre les différences et prendre des décisions éclairées lors de la résolution.

En respectant ces bonnes pratiques et en utilisant les outils et fonctionnalités appropriés, vous pouvez réduire les risques de conflits de fusion lors de votre travail avec Git.