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

1. [Comprendre Git et ce qu'est un conflit de fusion](/)
1. [Organiser intelligemment les travaux en amont](/)
1. [Modulariser suffisamment son code](/)
1. [Synchroniser son travail très souvent et régulièrement](/)
1. [Travailler sur des branches séparées](/)
1. [Faire des commits fréquents et atomqiques](/)
1. [S'appuyer sur des tests automatisés exécutés avant chaque commit ou push](/)
1. [Standardiser et contrôler automatiquement des règles de code](/)
1. [Résoudre les conflits rapidement](/)
1. [Communiquer, communiquer, communiquer](/)

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

Le souci des conflits de code que je vois sont les suivants : 
- c'est une opération qui peut être compliquée, avec pour conséquence, si elle est n'est pas parfaite, d'introduire un bug ou une régression, ou de "perdre" une évolution ou fonctionnalité nouvellement ajoutée ;
- c'est ce qui la rend stressante ;
- d'autant plus qu'une telle situation intervient souvent à un moment inopportun. Ex : lorsque l'on voit le bout d'un chantier et qu'on ne souhaite qu'une chose, l'envoyer en validation (relecture de code, recette fonctionnelle). Ex : le matin, au moment de faire un rebasage routinier pour bien se lancer ("et mince ! je vais devoir perdre plusieurs minutes à me projeter sur le code des autres plutôt que juste reprendre où j'en étais la veille…")
- c'est un évènement qui vient interrompre "[l'état de flow](https://www.cairn.info/revue-staps-2008-1-page-9.htm)" dans lequel on se situe parfois et qui entraîne un fort changement de colntexte (a.k.a. "context switching"). C'est coûteux en temps, en énergie, en motivation.

## 2. Organiser intelligemment les travaux en amont

Les conflits de code proviennent de travaux plus ou moins parallèles, sur un même pans de code, plus ou moins étendu.

Quelque soit le méthode de développement ou de gestion de projet qui est la vôtre, il existe toujours une phase en amont de la tâche / fonctionnalité / chantier de projection et d'organisation du travail de l'équipe et des équipiers (ou prestataires ou partenaires).

Exemples de situations qu'il est possible d'éviter avec une organisation qui tient compte et tente de prévenir les conflits de code : 
- lancer et gérer 2 chantiers conséquents par 2 sous-traitants indépendants dont l'impact porte sur tout ou grande partie du code (encore une fois, cf. [cette expérience](/posts/techniques-pour-fusionner-deux-versions-d-un-projet-shopify-grace-a-git/))
- ajouter en continu des exigences ou critères d'acceptation à une MR / PR / branche ouverte depuis plusieurs semaines - les grosses branches qui durent sont une calamité
- planifier un sprint technique - *NDLA : plus le temps passe, mois je suis fan de ce type de tactique, approche ou initiative* -  mêlant l'upgrade majeure du framework principal de l'application tout en menant un refactoring conséquent

Au moment de la phase de planification des tâches, **se poser la question de l'intersection des modifications, fichiers, bouts d'application éventuellement impactés** peut économiser pas mal de ressources (et de soucis) à l'équipe. Je ne dis pas qu'il est toujours possible d'éviter tout conflit, mais le cas échéant, l'équipe est mieux armée et peut réagir plus rapidement, efficacement, sereinement.

## 3. Modulariser suffisamment son code

De ce que j'ai pu constater, les applications les plus modulaires ou modularisées comptent parmi celles qui permettent le mieux d'éviter les conflits de code.

La contre-partie, c'est que ça fait beaucoup d'abstractions, de packages, de modules, de répertoires, de fichiers (parfois très similaires) à tenir compte. Ça induit une "charge mentale". Cela peut être intimidant et long à appréhender pour des profils juniors ou des nouveaux membres de l'équipe.

L'intérêt des abstractions (interfaces, classes abstraires, wrapper, clients, etc.) c'est que ça pousse naturellement et en priorité les changements de code de l'équipe vers de l'ajout d'objets (fichiers, méthodes) plutôt que de la modification et la manipulation de l'existant.

Il vaut mieux travailler sur des fonctions de petites tailles, bien distinctes les uns des autres et restreintes à une même typololgie de traitements / instruction, plutôt que sur une même fonction de 100-200 lignes mêlant des vérifications d'arguments, des contrôles de permissions et accès, des calculs métiers avancés, du stockage, du formattage, etc.

Bref, vive [les principes SOLID](https://fr.wikipedia.org/wiki/SOLID_%28informatique%29) (*) !

> (*) À mon sens, les principes SOLID sont valables dans tous les styles ou paradgimes de programmation, pas juste la Programmation Orientée Objet.

## 4. Synchroniser son travail très souvent et régulièrement

C'est la base d'une bonne hygiène Git : il faut rebaser très souvent et très régulièrement sa branche ou son code avec la branche principale.

À titre perso, je le fais a minima tous les matins, sur chacune de mes branches (en général, je n'en ai qu'une, mais lorsqu'elles sont petites, je peux en avoir plusieurs en parallèle). J'ai pris l'habitude ces dernières années de le faire aussi très souvent en fin de journée (dans le voyage du train).

Je préfère faire régulièrement des petits efforts, alors que je dispose de mes pleins moyens de concentration et motivation, plutôt que me prendre d'un coup une énorme charge imprévue, dans un moment et un état de relâchement (fin de tâche).  


## 5. Travailler sur des branches séparées

C'est la base. Les mécanismes et fonctionnalités autours de la gestion des branches sont un élément central de Git, la façon dont le logiciel est conçu et implémenté. Ce serait dommage de passer à côté.

Au-delà de la satisfaction intellectuelle de comprendre et mettre en œuvre les concepts inhérents au branching Git, exploiter les branches permet de simplifier sensiblement la gestion des conflits de code.

Mener des chantiers sur des branches parallèles permet d'éviter les conflits le temps de son développement. Ce qui est déjà un avantage.

Ensuite, une fois qu'un développement est accompli, il est possible de *squash* les commits (rassembler plusieurs commits en un seul) pour n'avoir plus qu'un commit, et limiter là aussi le nombre de commits à confronter avec les autres branches et à gérer en cas de conflit.

Personnellement, je ne suis pas particulièrement fan de squasher les commits d'une branche. Je n'ai absolument rien contre. Il y a des "pour" et des "contre". C'est une simple question de goût personnel.

## 6. Faire des commits fréquents et atomiques

> En vrai, ce point ne rentre pas complètement dans le cadre du sujet et concerne plutôt la résolution de conflits plutôt que leur prévention. Mais je ressens qu'il est quand même important de l'évoquer ici, et qu'il peut être utile pour la suite.

[Qu'est-ce qu'un bon commit Git ?](posts/qu-est-ce-qu-un-bon-commit-git)

## 7. S'appuyer sur des tests automatisés exécutés avant chaque commit ou push

> Même cas que le point précédent.

Disposer d'un harnais de tests conséquent, qui s'exécute rapidement et qui couvre les parties critiques, majeures ou essentielles du code permet de faire diminuer drastiquement tous les risques liés à la gestion de conflits Git.

S'il s'exécute rapidement, qu'il est suffisamment stable et pratique à fixer, on aura plus facilement tendance à le lancer régulièrement. Cela va augmenter les chances de faire et pousser des commits vert (cf. point précédent). On va ainsi réduire drastiquement la difficulté et le risque de résoudre des conflits.

Il existe un outil pour exécuter automatiquement des tâches avant chaque commit / push : Husky.

## 8. Standardiser et contrôler automatiquement des règles de code

Mettre en place des outils de formattage de code tels que ESlint, Prettier.

Mettre en place un outil de gestion de tâches pre/post-commits (ex : Husky)

Mettre en place des règles d'organisation des imports (ex : par nombre de "dossiers" intermédiaire, par ordre alphabétique, par vendors / internals, etc.)

## 9. Résoudre les conflits rapidement

En termes de gestion de conflits, il ne faut pas laisser une situation s'envenimer. C'est pareil avec Git. Plus on traîne à synchroniser une branche et résoudre les problèmes, plus ils vont s'accumuler et rendre la tâche compliquée, voire complexe et risquée.


## 10. Communiquer, communiquer, communiquer




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