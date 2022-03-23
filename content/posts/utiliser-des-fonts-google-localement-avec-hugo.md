---
title: "Utiliser des fonts Google localement avec Hugo"
publishDate: 2022-03-22T10:56:16+01:00
---

## TL;DR

Google Fonts permet d'accéder à des milliers de polices d'écriture d'excellente facture et de les intégrer très facilement et rapidement à ses applications ou sites Web.
En contrepartie, Google trace le comportement des utilisateurs qui les visitent.
Une solution consiste à récupérer lesdites fonts et les héberger soi-même, sur son infra / site.
La technique pour y parvenir est plutôt simple à mettre en œuvre, notamment pour un site Web généré avec le framework Hugo.

## Le problème avec Google Fonts

[Google Fonts](https://fonts.google.com/) est le service d’hébergement gratuit de polices d’écritures pour le Web propulsé par Google.
La plateforme propose des milliers de _fonts_ utilisées dans des millions de sites.
Parmi les polices d'écriture les plus célèbres, nous pouvons citer : Open Sans, Lato, Roboto, Poppins, Raleway, Playfair Display, Montserrat, etc.

L'intérêt de passer par Google Fonts est de **disposer gratuitement de fonts de grande qualité, standardisées et très largement répandues.**
Tant et si bien que ce n'est pas toujours simple de faire son choix.
Google propose d'ailleurs [une série de guides](https://fonts.google.com/knowledge/choosing_type) pour nous aider.

Dans la suite de l'article, je baserai mes exemples sur la police [Nunito](https://fonts.google.com/specimen/Nunito), utilisée dans la version actuelle du présent site (23/03/2022), et que vous pouvez retrouver dans [le code source](https://github.com/jbuget/jbuget.github.io).

Un second avantage avéré de passer par Google Fonts est sa **simplicité d'intégration.**

Basiquement, l'intégration d'une police se fait en ajoutant un lien de ressource externe via [l'élément HTML `<link>`](https://developer.mozilla.org/fr/docs/Web/HTML/Element/link).
Il devient alors possible d'utiliser directement la police dans le code CSS.

```html
<html>
  <head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Nunito">
    <style>
      body {
        font-family: 'Nunito', sans-serif;
        font-size: 18px;
      }
    </style>
  </head>
  <body>
    <div>Ceci est un texte avec la police Nunito.</div>
  </body>
</html>
```

Un autre intérêt de cette technique est de **disposer de la puissance de mise à disposition des ressources de Google** et sa couverture d'infrastructure planétaire.
On peut difficilement espérer mieux en termes de temps de réponse de récupération des fonts que ce que fournit Google et son CDN.

Un dernier avantage de cette pratique est de **bénéficier automatiquement des éventuelles mises à jour** (ex : support de nouvelles graisses, corrections ou améliorations du rendu).

Ce qui nous fait basculer du côté des inconvénients.

> _« Si c'est gratuit, c'est que vous êtes le produit »_
> 
> -- Bruce Willis (enfin, [sa voix française](https://webdeveloppementdurable.com/bruce-willis-vous-explique-si-cest-gratuit-vous-etes-le-produit/) !)

Si la technique ci-dessus présente l'avantage d'être facile et rapide à mettre en œuvre, elle recèle en revanche un inconvénient majeur : elle permet à Google de tracer les visiteurs qui accèdent à votre site.
[Google ne s'en cache pas](https://developers.google.com/fonts/faq#what_does_using_the_google_fonts_api_mean_for_the_privacy_of_my_users) et l'écrit noir sur blanc sur la documentation en ligne à l'usage des développeurs :

> _« Google Fonts logs records of the CSS and the font file requests, and access to this data is kept secure. 
> Aggregate usage numbers track how popular font families are and are published on our analytics page. 
> We use data from Google’s web crawler to detect which websites use Google fonts. 
> To learn more about the information Google collects and how it is used and secured, see Google's Privacy Policy. »_

À noter que, pour ce faire, Google ne dépose pas de cookie tiers sur le navigateur de vos visiteurs au passage sur votre site.
Il n'est donc pas nécessaire d'ajouter un bandeau cookie spécifique (dans le cas où vous n'en n'auriez pas déjà un) ou de les gérer dans les options de consentement.
Il convient toutefois de rester très vigilant sur le sujet, car les autorités dédiées, elles, le sont et n'hésitent pas intervenir, [comme en Allemagne](https://web.developpez.com/actu/330644/Un-site-Web-condamne-a-une-amende-par-un-tribunal-allemand-pour-avoir-divulgue-l-adresse-IP-d-un-visiteur-via-Google-Fonts-le-proprietaire-du-site-risque-une-peine-de-prison-en-cas-de-recidive/).

## La solution pour un site généré avec Hugo

> Pour rappel, [Hugo](https://gohugo.io/) est un logiciel libre, générateur de site statique écrit en langage Go. 
> C'est le framework utilisé pour développer ce site.

Les étapes ci-dessous expliquent :
- comment récupérer gratuitement les fichiers de police d'écriture depuis la plateforme Google Fonts, 
- où les mettre dans son projet de site Web développé avec le framework Hugo
- comment définir les classes de police CSS
- comment intégrer les sources CSS (avec Sass)

### 0/ Préambule

Avant toute chose, je me dois de préciser 2 éléments contextuels :

1. Ma pratique d'Hugo se limite à quelques semaines.
Auparavant, j'ai pratiqué pas mal de frameworks Web / front-end de différentes natures, dont des générateurs de sites statiques tel que Jekyll, mais il est possible que je passe à côté ou me méprends sur certains aspects techniques.
Je vous invite à me corriger en commentaire ou sur Twitter le cas échéant

2. Je rédige cet article dans le cadre du développement de la nouvelle mouture de mon site Web personnel.
En particulier, la mise en place de fonts custom a été la toute première opération que j'ai réalisée sur ce site.
Ceci explique le focus sur l'étape 4 à propos de Sass et de l'_asset processing_.
Il est possible que cette étape soit déjà réalisée sur votre propre projet.

### 1/ Récupérer la font et ses fichiers

La première chose à faire, une fois la police d'écriture sélectionnée, consiste à la télécharger.

Depuis la page de présentation de la police, il est possible de la récupérer très facilement en cliquant sur le bouton "Download family" disposé en haut à droite.

![img.png](/posts/img.png)

On obtient une archive au format ZIP, qui contient différents fichiers, notamment tout un tas de fichiers au format [TTF](https://fr.wikipedia.org/wiki/TTF). Ce sont ces derniers qui vont vraiment nous intéresser.

![img_1.png](/posts/img_1.png)

> Pour les amateurs de performance, il est possible de sélectionner un sous-ensemble de fonts, dans le cas où l'on anticipe que tous les styles relatifs à une police d'écriture donnée ne seront pas nécessaires.
> Pour ce faire, il faut sélectionner lesdits styles et accéder au lien indiqué dans l'encart "Use on the web".
> Une page de CSS s'ouvre alors avec la définition des différentes fonts / styles.
> 
> On remarque que le format de police indiqué n'est plus du TTF mais du WOFF2, qui est un format de données typographique optimisé pour le Web.
> Celui-ci est une évolution des formats standards (et un peu datés) OTF et TTF avec des meta-données supplémentaires permettant la compression des données et un temps de chargement réduit, compatible avec tous les navigateurs.
> 
> Bref, c'est la Ferrari des polices d'écriture, mais elle nécessite un petit plus de travail en aval, telle que la récupération individuelle de chaque style de police.

### 2/ Ajout les fichiers de fonts au projet

Dans mon cas, je pars du principe que j'aurais besoin de la majorité des styles proposés.
Je considère que les quelques polices inutilisées ne justifient pas la complexité de gérer des fonts individuellement.

> À noter que dans le cadre de mon site, je passe par un thème _custom_ (a.k.a. "bloodywood").
> La plupart des ressources que je traite sont gérées dans le répertoire `~/themes/bloodywood/*`.

Je copie les 2 fichiers TTF à la racine de l'archive `Nunito-VariableFont_wght` et `Nunito-Italic-VariableFont_wght` dans le répertoire des ressources statiques : `~/themes/bloodywood/static/fonts`.

![img_2.png](/posts/img_2.png)

### 3/ Définir les polices CSS

La glue entre les fichiers de fonts TTF et la prise en compte par les navigateurs va s'effectuer côté CSS.
C'est dans les fichiers de styles que l'on indique, pour chaque élément HTML, quelle sera sa famille de police d'écriture (grâce à la classique option `font-family`).
Il faut au préalable définir les règles de police d'écriture - a.k.a. `@font-face` - pour les indiquer au moteur CSS.

```css
/* Nunito-regular - latin */
@font-face {
	font-family: 'Nunito';
	font-style: normal;
	font-weight: 400;
	font-display: swap;
	src: url("../fonts/Nunito-VariableFont_wght.ttf");
}

/* Nunito-italic - latin */
@font-face {
	font-family: 'Nunito';
	font-style: italic;
	font-weight: 400;
	font-display: swap;
	src: url("../fonts/Nunito-Italic-VariableFont_wght.ttf");
}

/* Nunito-regular - latin */
@font-face {
	font-family: 'Nunito';
	font-style: normal;
	font-weight: 600;
	font-display: swap;
	src: url("../fonts/Nunito-VariableFont_wght.ttf");
}

/* Nunito-italic - latin */
@font-face {
	font-family: 'Nunito';
	font-style: italic;
	font-weight: 600;
	font-display: swap;
	src: url("../fonts/Nunito-Italic-VariableFont_wght.ttf");
}
```

### 4/ Activer les CSS du projet (option)

Dans mon cas, je suis parti d'un projet _from scratch_, avec un thème sur-mesure créé au démarrage du site. Comme énoncé en préambule, il est possible que votre projet soit déjà configuré pour gérer le processing de ressources.

J'ai pris le parti personnel d'utiliser Sass, [fourni de base par Hugo](https://gohugo.io/hugo-pipes/scss-sass/).

À cette fin, je dois utiliser le mécanisme de Pipes promulgué par Hugo pour accomplir le processing des fichiers de style `.scss`.

Concrètement, cela revient à ajouter les lignes ci-dessous dans la partie `<head>` des documents HTML.

>  Dans mon cas, et suite à la génération du thème par le CLI Hugo, ces lignes sont à insérer dans le fichier `~/themes/bloodywood/layouts/partials/head.html`.

```html
<head>
  <!-- ... autres instructions head -->
  {{ $styleSass := resources.Get "css/styles.scss" }}
  {{ $styleCSS := $styleSass | resources.ToCSS }}
  <link rel="stylesheet" href="{{ $styleCSS.RelPermalink }}">
</head>
```

### 5/ Utiliser les familles de font

À partir de là, il ne reste plus qu'à utiliser les fonts ainsi définies.

```css
html {
    font-family: Nunito, sans-serif;
    font-size: 18px;
}
```

Et voilà !

![img_3.png](/posts/img_3.png)

## Conclusion

