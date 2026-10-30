# jbuget.github.io

Repository du code source pour le site jbuget.fr.

## Technologie(s)

La version actuelle se base sur le générateur de site statique [Hugo](https://gohugo.io/).

Elle s'appuie sur un thème custom appelé "Bloodywood" (cf. `~/themes/bollywood`), en référence au groupe de Folk Metal indien découvert le jour même.

La recherche de contenu se fait via [Pagefind](https://pagefind.app/).

## Installation

Le thème est compilé avec [Dart Sass](https://sass-lang.com/dart-sass/), qui doit être présent dans le `PATH` (cf. `scripts/install-dart-sass.sh` pour la version utilisée sur Netlify).

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


## Usage

### Publication d'articles de blog

### Gestion des CV

Pour ajouter un nouveau CV avec ses déclinaisons par langue :

1. **Créer les fichiers JSON de données** dans `assets/resumes/` :
   - `resume.{type}.fr.json` (version française)
   - `resume.{type}.en.json` (version anglaise)
   
   Ces fichiers doivent respecter le format [JSON Resume Schema](https://jsonresume.org/schema/).

2. **Créer le dossier de contenu** dans `content/resume/{type}/` :
   - `fr.md` avec le front matter : 
     ```yaml
     ---
     layout: "resume"
     type: "page"
     resume_file: "resumes/resume.{type}.fr.json"
     ---
     ```
   - `en.md` avec le front matter :
     ```yaml
     ---
     layout: "resume"
     type: "page"
     resume_file: "resumes/resume.{type}.en.json"
     ---
     ```

3. **Référencer le nouveau CV** dans `data/resumes.yaml` :
   ```yaml
   - type: "{type}"
     title: "Titre du CV en anglais"
     fr:
       title: "Version française 🇫🇷"
       description: "Description de la version française"
       url: "/resume/{type}/fr"
     en:
       title: "English version 🇬🇧"
       description: "English version description"
       url: "/resume/{type}/en"
   ```

**Exemple** : pour un CV orienté "consultant", créer :
- `assets/resumes/resume.consultant.fr.json`
- `assets/resumes/resume.consultant.en.json`
- `content/resume/consultant/fr.md`
- `content/resume/consultant/en.md`
- Ajouter l'entrée correspondante dans `data/resumes.yaml`

