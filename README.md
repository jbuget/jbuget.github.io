# jbuget.github.io

Repository du code source pour le site jbuget.fr.

## Technologie(s)

La version actuelle se base sur le générateur de site statique [Hugo](https://gohugo.io/).

Elle s'appuie sur un thème custom appelé "Bloodywood" (cf. `~/themes/bollywood`), en référence au groupe de Folk Metal indien découvert le jour même.

## Installation

```
git clone git@github.com:jbuget/jbuget.github.io.git
cd jbuget.github.io
hugo serve -D
```

## Indexation

Dans le répertoire `/themes/bloodywood/search/` :

1. Copier / renommer le fichier `.env.example` en `.env` et renseigner les valeurs en conséquences. 
2. Installer les dépendances :
```shell
$ npm install
```
3. Exécuter la commande :
```shell
$ npm run algolia
```
