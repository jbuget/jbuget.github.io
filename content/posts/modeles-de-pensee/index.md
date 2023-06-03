---
title: "Modèles de pensée"
categories: ["lifestyle"]
keywords:
- modèles de pensée
- 3-tiers
- méthodologie
date: 2023-04-13T23:29:10+01:00
draft: false
summary: Au fil du temps, j'ai développé des modèles de pensée que j'applique comme des automatismes chaque fois que je suis confronté à un problème. 
---

## Table des matières

- [Introduction](#introduction)
- [Conclusion](#conclusion)


## Introduction

## Input-Treatment-Output

À la fin de la phase *Input*, je dois disposer de tout le nécessaire (données récupérées et ou formattées, variables ou constantes déclarées, paramètres validés ou extraits, initialisées et prêtes à l'emploi, authentification et habilitations vérifiées, etc.) pour pouvoir effectuer tous les calculs ou appliquer tous les effets sans avoir à nouveau besoin de me prendre la tête sur la présence ou la viabilité des données.
À la fin de cette étape, je dois être en capacité de dérouler le plus efficacement possible.

Dans certains cas, je pousse le bouchon un peu plus loin et je splitte cette phase en deux : 
1. déclaration des varibles qui seront initialisées / utilisées
2. assignation / affectation / initialisation de celles-ci

## Given-When-Then

Dans le même esprit que le modèle précédent, quel que soit le type de test que je dois écrire (unitaire, intégration, fonctionnel, de charge, performance ou conformité etc.) ou la nature de l'objet testé (une fonction statique, une méthode, une classe, un module, etc.), je respecte et j'applique toujours la même façon de penser et d'organiser mes instructions, inspirée du formalisme Gherkin : 
- **Given** : suite d'instructions visant à préparer complètement le contexte / l'environnement dans lequel je vais déclencher le comportement à évaluer
- **When** : instruction unique dont le but est de déclencher le comportement à évaluer  
- **Then** : suite d'instructions permettant d'effectuer les validations de comportement(s) attendu(s)

Par ailleurs, je me fixe les règles suivantes :
- un test PEUT comporter 0 ou plusieurs instructions `Given`
- un test DOIT comporter *exactement* une et une seule instruction (et même "ligne") `When`
- un test DOIT comporter au moins une instruction de vérification (`assert`, `expect` ou `check`) `Then`

Aussi, je garde toujours à l'esprit de faire en sorte de "laisser l'endroit plus propre que je ne l'ai trouvé", a.k.a. [Boy Scout Rule](https://matheus.ro/2017/12/11/clean-code-boy-scout-rule/).
C'est d'autant plus vrai dans les tests mettant en jeu du stockage de données, comme souvent les tests d'intégration sur des objets de type `repositories`.


```javascript
// Exemple de code de test pour Paastis : https://github.com/paastis/paastis/blob/53482ac7d0af007ad01e36ac5a13dd0cb9147913/test/registry/RunningAppRegistry.test.js#L22-L40 
it('should add to the registry a simple app when it has not yet been registered', async () => {
    // given
    const store = new InMemoryRunningAppStore();
    const factory = new RunningAppFactory();
    const eventStore = new InMemoryEventStore();
    const registry = new RunningAppRegistry(store, factory, eventStore);
    const appKey = 'my-app-pr123-back';
    
    // when
    await registry.registerApp(appKey);
    
    // then
    const registeredApp = await store.get(appKey);
    expect(registeredApp).toBeDefined();
    expect(registeredApp.lastAccessedAt).toStrictEqual(
     new Date('2022-09-27T00:25:00.000Z')
    );
    expect((await store.all()).length).toStrictEqual(1);
});
```

## Model-View-Controller

## Front-Back-Database

## Past-Present-Future

## Business-Technic-Organization

## People-Process-Prodct

## Autres

- Terre-Eau-Air-Feu
- Physique-Technique-Tactique-Psychologique


## Conclusion
