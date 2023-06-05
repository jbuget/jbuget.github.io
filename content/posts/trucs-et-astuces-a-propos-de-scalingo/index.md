---
title: "Trucs et astuces à propos de Scalingo"
date: 2023-06-03T14:30:00+02:00
categories: ['scalingo', 'paas']
keywords:
- Scalingo
- PaaS
- infrastructure
- ops
- devops
draft: false
summary: 
---

## TL;DR

- [Déployer une application via une archive de code au format tar.gz](/deployer)
- optimiser ses review apps grâce à Paastis (instant auto-promo)
- ouvrir une session Bash sur un one-off container
- se connecter à une base de données PostgreSQL
- ouvrir un tunnel SSH pour éviter de publier sa base sur Internet
- accéder à une instance Adminer
- déployer un S3 sur Scalingo
- faire tourner une stack ELK
- [Account] localiser ses identifiants de connexion sur son poste
- [Notification] brancher les notifs sur Mattermost (via les wbhooks Slack)
- faire tourner un CRON
- reproduire le cycle de build exact de Scalingo sur son poste
- ajouter des varenv depuis un fichier `.env` (merci François 2 Metz)
- bonne pratique : bien séparer dev / prod

## Déployer une application via une archive de code au format tar.gz

La façon la plus évidente, simple, basique, rapide, pratique et par défaut de déployer du code sur une infrastructure de type PaaS – ici Scalingo – est d'[associer directement le dépôt (ainsi que la ou les branches) GitHub ou GitLab à l'application](https://doc.scalingo.com/platform/deployment/deploy-with-github). Ainsi, lorsque l'on pousse un changement, la plateforme le détecte et met à jour l'application automatiquement. 

C'est exactement le confort et la productivité recherchés en phase de *build* ou pour des petites applications #DeveloperExperience.

Mes années de pratiques DevOps m'incitent toutefois à ne jamais mélanger l'environnement de production des autres environnements (développement, review apps, integration, qualification, staging, recette, etc.). Une escalade de droits malheureuse ou un leak de ssecrets de production via des environnements de dev mal isolés est si vite arrivé #vécu 😱.

Pour pallier à ce genre de risque, une pratique que j'ai adoptée, notamment avec Scalingo, est de créer 2 comptes (build/dev et run/prod) bien distincts, et qui ne partagent aucune application, ni aucun secret en commun. Aussi, je m'interdis d'associer la moindre application détenue par le compte de production à un quelconque repository de code tierce (GitHub, GitLab, autre).

Pour pousser en production une version - puisqu'à un moment, il faut bien envoyer du code à Scalingo ! - je passe par la fonctionnalité de [déploiement depuis une archive](https://doc.scalingo.com/platform/deployment/deploy-from-archive).

> 🏆 Protip : GitHub permet, pour tout objet (commit, branche, ou tag), de [générer et télécharger à la volée et via une URL une archive au format `tar.gz`](https://docs.github.com/fr/rest/repos/contents?apiVersion=2022-11-28#download-a-repository-archive-tar) du code concerné. Pour ce faire, il suffit de récupérer l'URL de l'archive `zip` associé à l'objet et de modifier l'extension.

Par exemple, pour récupérer une archive au format `tar.gz` de la branche principale de ce blog, il suffit d'accéder à l'URL : https://github.com/jbuget/jbuget.github.io/archive/refs/heads/main.tar.gz.

En ligne de commande, ça donne : 

```shell
$ curl -O -L https://github.com/jbuget/jbuget.github.io/archive/refs/heads/main.tar.gz
```

Ainsi, pour déployer n'importe quel code sur une application Scalingo, il suffit d'utiliser la commande `scalingo deploy <tar_gz_archive_url>` : 

```shell
$ scalingo --region osc-secnum-fr1 --app my-app deploy https://github.com/my-orga/my-app/archive/refs/heads/main.tar.gz
```

Si vous avez les droits sur l'application et que l'URL est correcte, alors, ça devrait déclencher un déploiement 🚀.




