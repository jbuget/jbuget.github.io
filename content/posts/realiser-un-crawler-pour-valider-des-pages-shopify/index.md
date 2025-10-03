---
title: "Réaliser un crawler pour valider des pages d'un site e-commerce avec Shopify"
slug: "realiser-un-crawler-pour-valider-des-pages-shopify"
date: "2025-10-02T09:00:00+02:00"
lastmod: "2025-10-02T09:00:00+02:00"
draft: false
description: "Comment j'ai construit un crawler Shopify en Node.js pour vérifier la présence des fiches PDF produit : Playwright, Cheerio, gestion du rate limit et retours d'expérience sur le vibe coding."
summary: "Retour d'expérience sur la création d'un CLI Node.js qui contrôle les pages produits Shopify, gère le rate limit et vérifie les liens PDF avant mise en production."
keywords:
- shopify
- crawler
- node.js
- playwright
- cheerio
- pdf
- automation
- cli
tags: ["Shopify", "Crawler", "Node.js", "Playwright", "Cheerio", "Automation", "CLI"]
categories: ["shopify", "node.js", "automation"]
---

## Table des matières

- [Problème](#problème)
- [Solution](#solution)
- [Retour d'expérience](#retour-dexpérience)
  - [1. Rate limit et IP-ban](#1-rate-limit-et-ip-ban)
  - [2. Traitements post-rendu HTML](#2-traitements-post-rendu-html)
  - [3. Analyse d'une page HTML](#3-analyse-dune-page-html)
  - [4. Validation des PDF](#4-validation-des-pdf)
  - [5. Input / Output](#5-input--output)
  - [6. Exécution d'un CLI Node.js](#6-exécution-dun-cli-nodejs)
- [Conclusion](#conclusion)

## Problème

Récemment, j'ai été amené à développer un petit outil pour automatiser la validation en masse de pages produit d'un site e-commerce refondu avec Shopify. Le site propose plusieurs milliers de références (~5000), dans plusieurs langues. Le projet de refonte arrive à son terme, avec une mise en production est prévue pour très bientôt. Un des critères de validité bloquants d'une page produit est la présence de 2 liens vers les fiches (1) techniques et (2) de sécurité vers les documents PDF respectifs, valides et accessibles (hébergés chez OVH).

Pour un humain, effectuer un tel type de vérification sur un tel volume est un travail colossal (plusieurs jours) ; fastidieux (où le risque d'erreurs ou de problèmes est élevé) ; avec une plus-value intrinsèque personnelle et collective quasi nulle (personne n'y gagne aucune compétence, connaissance professionnelle ou dynamique inter-personnelle profitable).

Mais surtout, c'est le genre de petites tâches qui s'automatise très facilement et *relativement* rapidement. Je mets un bémol, car les pièges ou situations imprévues sont nombreuses. D'où l'intérêt pour moi de consigner mes quelques apprentissages et de les partager.

> Malheureusement, par souci de confidentialité, je ne peux révéler le nom de l'entreprise ou du produit. Je n'aurais donc pas de capture d'écran mouf-mouf dans cet article.

## Solution

La solution prend la forme d'une interface en ligne de commande (CLI), en Node.js/TypeScript.

Les dépendances majeures utilisées :
* [**Commander**](https://github.com/tj/commander.js) pour gérer les commandes / paramètres
* [**Playwright**](https://playwright.dev/) pour charger les pages, au plus proche du rendu utilisateur
* [**Cheerio**](https://cheerio.js.org/) pour parcourir et analyser le DOM côté Node.js

Le code source est disponible depuis le dépôt GitHub [jbuget/shopify-product-page-validator](https://github.com/jbuget/shopify-product-page-validator).

```shell
$ npx shopify-product-page-validator -h

Usage: shopify-product-page-validator [options]

CLI pour valider la présence des fiches PDF sur les pages produits

Options:
  -i, --input <path>     Fichier CSV d’entrée (default: "input/products.csv")
  -o, --output <path>    Fichier CSV de sortie (default: "output/results.csv")
  -d, --delay <ms>       Délai entre les requêtes HTTP (ms) (default: "200")
  --skip-pdf-validation  Désactive la vérification des liens PDF
  --pdf-validation       Force la vérification des liens PDF (valeur par défaut)
  -h, --help             Affiche cette aide
```

## Retour d'expérience

### 1. Rate limit et IP-ban
Avec une configuration de 8 agents de validation concurrents max, cela m'a pris 1h20 pour vérifier un premier lot de 1690 produits. Cela peut paraître lent (c'est mon cas), mais – malheureusement – c'est voulu.

Au tout début, je me contentais d'appeler [l'API Node Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) (via la fonction `fetch`) dès que possible, pour chaque URL. 
Très vite j'ai eu des [erreurs HTTP `429`](https://developer.mozilla.org/fr/docs/Web/HTTP/Reference/Status/429) ("Too Many Requests") qui indique que le serveur cible (Shopify pour les pages produit, OVH pour les documents PDF) estime que je le surcharge et préfère me refuser l'accès à ses ressources pour éviter de finir saturé.
C'était surtout vrai pour OVH et les fiches PDF de sécurité et technique.

J'ai tenté (sans grand espoir) de modifier l'en-tête `User-Agent` en option de la requête `fetch` pour faire passer le programme pour un utilisateur humain derrière un navigateur valide, mais évidemment, ça n'a pas fonctionné.

J'ai fini par :

1. forcer un délai entre 2 requêtes HTTP effectuées par le programme
2. charger les pages HTML via le toolkit [Playwright](https://playwright.dev/) plutôt que directement via la méthode `fetch`

### 2. Traitements post-rendu HTML

Ce deuxième dispositif – Playwright – est particulièrement critique et la solution a deux autres soucis que j'ai rencontrés.

Le premier, c'est que certaines URLs à vérifier concernent des produits privés, qui nécessitent d'être connecté au site avec un certain type d'utilisateur.
Au début du projet, je ne le savais. Personne ne me l'avait dit.

Après exécution du programme, certaines lignes remontaient en [KO] (documents manquants) de façon très étrange. 
Et, lorsque j'accédais à la page en question, j'étais redirigé vers la page d'accueil.
J'ai eu la réponse au problème lorsque j'en ai parlé avec l'équipe.
Il s'agit d'un comportement qui a été demandé à l'intégrateur Shopify.

Ce n'était pas le seul.
On lui a aussi demandé de cacher les liens vers les fiches PDF, voire la section entière, si le préchargement des PDF a échoué, après rendu de la page HTML.
Quand je dis cacher, je veux plutôt dire "supprimer les éléments HTML du DOM".

Côté utilisateur, c'est très surprenant (la page se charge, avec les 2 liens, puis l'un ou l'autre ou les deux disparaissent).
D'un point de vue référencement (SEO), c'est aussi fortement déconseillé car ça ne respecte pas certains critères des [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals?hl=fr), scrupuleusement suivis par le Google Search Engine.
Et côté vérificateur, je me retrouvais avec un paquet de fausses valididités (présence du lien OK alors qu'en fait non).

Ces 2 points ont été résolu en laissant Playwright afficher la page produit correspondant à l'URL, "comme pour un utilisateur".

### 3. Analyse d'une page HTML

Notre CLI est un programme Node.js. 
De base, il n'a pas accès aux API Web / HTML des navigateurs.
Pour pouvoir parcourir, analyser ou jouer avec une page HTML côté backend, il existe une bibliothèque, [Cheerio](https://cheerio.js.org/), qui permet de charger une page ou une arborescence DOM.

> J'en profite pour dire que, par rapport au problème précédent, j'ai tenté la méthode `fromUrl` de Cheerio, mais je me suis retrouvé dans le cas où la page chargée contenait par défaut les 2 liens PDF et renvoyait toujours [OK] même quand il étaient supprimés juste après. Donc, non, Playwright est bien la seule solution valable

Je me suis demandé si j'avais vraiment besoin de Cheerio en plus de Playwright.
Peut-être le toolkit embarque-t-il le nécessaire pour manipuler le DOM ?
Réponse : non.
Il est donc bien pertinent d'avoir les deux libs.

Concrètement, Cheerio se manipule comme jQuery.
C'est hyper pratique, simple et efficace.

Exemple :

```javascript
// Playwright
const browser = await getBrowser();
const context = await browser.newContext();
const page = await context.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
const html = await page.content();

// Cheerio
const $ = load(html);
const section = $('.page__content.rte.text-subtext.product-documentation').first();
const links = section.children('a');
```

### 4. Validation des PDF

Si on revient du côté des liens et des fiches PDF, ma première implémentation, naïve, consistait à faire un `fetch(GET)` sur les 2 liens PDF de la page produit.
Ca ralentissait énormément les traitements, en plus de consommer inutilement d'autres ressources (stockage, bande-passante).

J'avais déjà été confronté à cette problématique dans le passé.
La solution qui avait fonctionné à l'époque et qui me paraît toujours d'actualité et pertinente pour mon besoin est d'effectuer une [requête `HEAD`](https://developer.mozilla.org/fr/docs/Web/HTTP/Reference/Methods/HEAD) (qui se contente de vérifier l'accessibilité de la ressource et récupérer les metadonnées de la cible) plutôt qu'une requête `GET`.

Une fois que la requête HEAD est complétée, alors on accomplit quelques vérifications supplémentaires (content-type et media extension). 

```javascript
async function isValidPdfLink(baseUrl: string, href: string, delayMs: number): Promise<boolean> {
    try {
        const absoluteUrl = resolveUrl(baseUrl, href);
        const response = await fetchWithDelay(absoluteUrl, {
            method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:115.0) Gecko/20100101 Firefox/115.0',
      },
        }, delayMs);
        if (!response.ok) {
            return false;
        }
        const contentType = response.headers.get('content-type') ?? '';
        const contentDisposition = response.headers.get('content-disposition') ?? '';
        const finalUrl = response.url ?? absoluteUrl;
        const isPdfHeader = contentType.toLowerCase().includes('application/pdf')
            || contentDisposition.toLowerCase().includes('application/pdf')
            || contentDisposition.toLowerCase().includes('.pdf');
        const isPdfUrl = /\.pdf(?:[?#]|$)/i.test(finalUrl);
        return isPdfHeader || isPdfUrl;
    } catch (error) {
        return false;
    }
}
```


### 5. Input / Output

Un peu par défaut et par habitude, je suis parti sur du CSV, en entrée comme en sortie.
Le programme s'attend à ce que le fichier input contienne l'en-tête "URL".

En vrai, pour l'input, j'aurais pu me contenter d'un fichier texte avec une URL par ligne.

J'aurais pu utiliser la lib [**csv**](https://csv.js.org/) pour me simplifier la vie.

**Input :**
```plaintext
URL
https://mon-site-shopify/products/product-A
https://mon-site-shopify/products/product-B
https://mon-site-shopify/products/product-C
https://mon-site-shopify/products/product-E
https://mon-site-shopify/products/product-F
```

**Output :**
```plaintext
URL;result;comments
https://mon-site-shopify/products/product-A;OK
https://mon-site-shopify/products/product-B;KO;Redirection client vers https://mon-site-shopify.fr/
https://mon-site-shopify/products/product-C;KO;Section product-documentation absente (fiche de sécurité et technique manquantes)
https://mon-site-shopify/products/product-E;KO;Fiche technique manquante
https://mon-site-shopify/products/product-F;KO;Lien fiche de sécurité invalide

```


### 6. Exécution d'un CLI Node.js

Peut-être que je suis le dernier imbécile sur Terre qui ne le savait pas, mais lorsqu'on développe un programme et surtout une CLI avec Node.js, il est possible d'utiliser npx directement sans même désormais à avoir à générer de lien symbolique, comme il y a longtemps.

```json
{
  "name": "shopify-product-page-validator",
  "version": "1.0.0",
  "description": "CLI pour valider la présence des fiches PDF sur les pages produits",
  "main": "dist/index.js",
  "bin": {
    "shopify-product-page-validator": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "npm run build && node dist/index.js",
    // ...
  },
  // ...
}
```

Ainsi, – modulo avoir fait `npm run build` pour transpiler le fichier vers dist/index.js – la commande suivante fonctionne parfaitement :

```shell
npx shopify-product-page-validator -h
```

Je n'ai pas eu d'autre choix que de découvrir cette mécanique lorsque j'ai été confronté à des problèmes de passage d'arguments au CLI via `npm start`.
J'avais beau faire...

```shell
npm start -- --mon-option ma_valeur
```

... la valeur de `mon-option` n'était jamais prise en compte. À en devenir fou !

Mieux vaut tard que jamais 😅

## Conclusion

Je pensais passer 2~4 heures sur ce projet. Finalement, il m'auras pris 8~12h (dont 3h de refactoring à la fin, pour découper le code en plusieurs fichiers, car ça devenait inmaintenable et que je commençais à avoir honte de poster ça sur mon GitHub, aussi one-shot le projet est-il).

Playwright et Cheerio sont mes gars sûrs. De même que npx. Tout le monde parle de Claud Code, mais Codex avec VS Code fonctionne super bien à mon sens (modulo que j'ai des tonnes de progrès à faire pour mieux utiliser l'IA, et surtout mieux l'appréhender psychologiquement parlant).

Pour finir, j'ai un logiciel qui fonctionne et qui a répondu au problème, avec un code convenable.
