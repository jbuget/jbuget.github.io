# jbuget.github.io

Repository du code source pour le site jbuget.fr.

## Technologie(s)

La version actuelle se base sur le générateur de site statique [Hugo](https://gohugo.io/).

Elle s'appuie sur un thème custom appelé "Bloodywood" (cf. `~/themes/bollywood`), en référence au groupe de Folk Metal indien découvert le jour même.

La recherche de contenu se fait via [Pagefind](https://pagefind.app/).

## Installation

```
git clone git@github.com:jbuget/jbuget.github.io.git
cd jbuget.github.io
hugo serve -D
```

## Indexation et recherche de contenu

L'indexation du site est déclenchée automatiquement, cf. : 

```
# netlify.toml

command = "hugo --gc --minify && npx pagefind --site 'public'"
```

Pour avoir le même résultat en local :

```
hugo --gc --minify
npx -y pagefind --site public
hugo serve -D
```
