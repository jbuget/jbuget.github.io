---
title: "Sequence vs. UUID"
categories: ["database", "sql", "uuid", "sequence"]
date: 2023-02-13T08:25:18+01:00
draft: true
summary:  
---

Cet article est la mise par écrit d'une réflexion que j'ai partagée récemment avec un ami-CTO-développeur.
Il a entrepris la réécriture du back-end de leur SI, une plateforme de prise de rendez-vous intelligente en ligne.
Dans le cadre de ce projet, il voulait connaître mon point de vue quant à la question : **faut-il privilégier une Séquence ou un UUID en tant que clé primaire des objets de la base de données ?**

Comme tout bon consultant / professionnel du code avec un minimum d'expérience, la première et meilleure réponse qui me vint en tête fut : ça dépend 🤷‍♂️.
Mais bon, vous en conviendrez, la justesse de la réponse ne la rend pas très utile pour autant.

## Définitions

### Séquence



### UUID


---

Lorsqu'il s'agit de choisir une clé primaire pour une table de base de données, les deux options les plus courantes sont les séquences et les identificateurs universels uniques (UUID). Chacun de ces deux types de clés présente des avantages et des inconvénients qui peuvent affecter les performances et la gestion des données.

Les séquences sont des nombres entiers uniques générés automatiquement par le système de base de données. Ils sont souvent utilisés pour créer des clés primaires parce qu'ils sont rapides à générer et à utiliser, et qu'ils permettent une indexation efficace des données. Cependant, les séquences peuvent être déduites en analysant les données, ce qui peut poser des problèmes de sécurité pour certaines applications sensibles.

Les UUID, également connus sous le nom de GUID (identificateurs globaux uniques), sont des nombres hexadécimaux aléatoires générés pour identifier de manière unique des objets ou des enregistrements dans une base de données. Les UUID peuvent être générés sur n'importe quel ordinateur ou système sans risque de collision, ce qui les rend idéaux pour les applications distribuées. Cependant, les UUID sont plus lents à générer et à utiliser que les séquences et peuvent prendre plus de place dans la base de données en raison de leur longueur.

En conclusion, le choix entre une séquence et un UUID comme clé primaire dépend des exigences de votre application. Si vous avez besoin d'une clé primaire rapide et efficace, une séquence peut être la meilleure option. Cependant, si la sécurité et la compatibilité avec les systèmes distribués sont des préoccupations majeures, un UUID peut être un choix plus judicieux.

Bien sûr ! Une séquence est une série de nombres entiers générés automatiquement par le système de base de données. Les séquences sont souvent utilisées pour générer des clés primaires uniques pour les enregistrements dans une table de base de données.

Lors de l'insertion d'un nouvel enregistrement dans une table avec une clé primaire générée à partir d'une séquence, le système de base de données génère automatiquement le prochain nombre de la séquence et l'utilise comme valeur pour la clé primaire. Par exemple, si la séquence actuelle est à 1, lors de l'insertion du premier enregistrement, la clé primaire sera 1. Lors de l'insertion du deuxième enregistrement, la séquence sera incrémentée à 2 et la clé primaire sera 2, et ainsi de suite.

Lors de la consultation ou de la recherche d'un enregistrement dans une table avec une clé primaire générée à partir d'une séquence, la séquence peut être utilisée pour trouver rapidement et efficacement un enregistrement spécifique en utilisant une requête de recherche basée sur la clé primaire. Par exemple, pour trouver un enregistrement avec une clé primaire égale à 5, vous pouvez exécuter la requête suivante :

sql

SELECT * FROM table_name WHERE id = 5;

Il est important de noter que les séquences ne sont pas nécessairement consécutives. Il est possible de définir un intervalle pour la séquence, ce qui signifie que le nombre suivant dans la séquence peut être incrémenté de plus d'un. Par exemple, si l'intervalle de la séquence est défini sur 10, le prochain nombre dans la séquence sera 11, puis 21, etc. Cela peut être utile pour éviter les collisions de clé primaire lors de la suppression d'enregistrements dans la table.
