---
title: "Mesurer la valeur et l'impact d'un service numérique"
date: "2026-02-08T10:00:00+01:00"
draft: true
toc: true
categories: ["Produit", "Management", "Tech"]
keywords: ["métriques", "KPI", "impact", "produit", "3U", "North Star Metric", "vanity metrics", "Goodhart", "HEART", "AARRR", "product analytics", "SQL", "leading indicator", "lagging indicator"]
summary: "Retour d'expérience sur la difficulté de mesurer la valeur d'un service numérique, et présentation du modèle 3U (Utilisable, Utilisé, Utile) — avec des exemples concrets, des requêtes SQL et les pièges à éviter."
description: "Comment structurer ses métriques produit avec le modèle 3U (Utilisable, Utilisé, Utile), identifier sa North Star Metric, éviter les vanity metrics et les biais de Goodhart — illustré par un cas concret de gestion d'incidents avec des requêtes SQL."
---

Pendant près de 10 ans, j'ai travaillé au sein de [beta.gouv.fr](https://beta.gouv.fr), l'incubateur de services numériques de l'État — chez [Pix](https://pix.fr) puis à la [Plateforme de l'inclusion](https://inclusion.beta.gouv.fr). L'une des forces de beta.gouv, c'est d'imposer une discipline simple mais radicale : **piloter chaque produit par l'impact**. Concrètement, chaque service incubé doit exposer une page `/stats` publique rendant compte de ses résultats. Pas de métriques, pas de financement (*).

> (*) Pensée émue à [Carnet de bord](https://beta.gouv.fr/startups/carnet.de.bord.html) 🪦 et l'équipe : Laëtitia, Vincent, Lionel, GUL et JOP 💪 ❤️

Je suis d'abord un ingénieur technique — développeur, tech lead, solution architect, CTO. Ce n'est pas forcément le profil qu'on attend sur un sujet de métriques produit. Mais je suis convaincu que **les meilleurs développeurs sont celles et ceux qui ont compris que la technique est au service du produit, pas l'inverse**. Comprendre le métier, la stratégie, le "pourquoi" derrière chaque fonctionnalité, ce n'est pas sortir de son rôle — c'est l'exercer pleinement. Et quand il s'agit de définir les bonnes métriques, l'avis des techs compte : ce sont eux qui savent ce qui est mesurable, à quel coût, et avec quelle fiabilité.

Cette conviction m'a confronté à une réalité souvent sous-estimée : **définir les bonnes métriques est extrêmement difficile**. On confond vite les types de métriques, ce qu'on peut en déduire, ce qu'on doit en faire. On mesure le nombre de comptes créés en pensant mesurer l'adoption. On suit le temps de réponse du serveur en croyant mesurer la qualité du service. On affiche des courbes qui montent pour rassurer, sans jamais répondre à la vraie question : **est-ce que ce service est utile ?**

Au fil des projets, j'en suis venu à structurer ma réflexion autour d'un cadre simple — le **modèle 3U** :

- **Utilisable** → est-ce que ça fonctionne ?
- **Utilisé** → est-ce que les gens s'en servent ?
- **Utile** → est-ce que ça crée de la valeur ?

Ce triptyque n'est pas une invention personnelle. La [règle des 3U](https://lisio.fr/blog/article/la-regle-des-3u-utile-utilisable-utilise) — Utile, Utilisable, Utilisé — est un principe bien établi en UX et en conception produit, que l'on retrouve dans la communauté du [numérique responsable](https://fr.wiki.isit-europe.org/nr/Utile_Utilisable_Utilis%C3%A9), ou encore dans la [démarche agile](https://fr.linkedin.com/pulse/les-3u-utile-utilisable-utilis%C3%A9-et-sa-mise-en-via-lo%C3%AFc-albarracin). Ici, je l'emploie volontairement dans l'ordre **Utilisable → Utilisé → Utile** pour piloter la chaîne causale opérationnelle, tout en gardant en tête que la finalité reste la **valeur créée**. Ma contribution ici est de le **réinterpréter sous l'angle des métriques** — en associant à chaque dimension un type d'indicateur concret — et de l'appliquer au pilotage par l'impact d'un service numérique.

Ces trois dimensions forment une chaîne de causalité : `Fonctionnement → Usage → Impact`. Un maillon faible compromet l'ensemble, mais cette séquence permet aussi de **diagnostiquer précisément** où se situe un blocage — technique, adoption ou création de valeur. L'ordre de lecture sert l'analyse ; la priorité de décision reste l'**impact**.

> Le modèle 3U s'inscrit dans la lignée du [HEART Framework](https://research.google/pubs/measuring-the-user-experience-on-a-large-scale-user-centered-metrics-for-web-applications/) (Google, 2010) et des [Pirate Metrics - AARRR](https://en.wikipedia.org/wiki/AARRR) (Dave McClure, 2007), en y ajoutant une dimension "Fonctionnement" critique pour les outils à forte composante technique. En contexte B2B interne, l'adoption n'est pas virale mais **accompagnée**, et le ROI se mesure en **efficacité opérationnelle** plutôt qu'en chiffre d'affaires.
>
> *Références* : Rodden et al. (2010), McClure (2007), Croll & Yoskovitz (2013) - *Lean Analytics*

Dans la suite de cet article, je détaille chaque dimension, les leviers de valeur qu'elle recouvre, et les bonnes pratiques pour choisir ses indicateurs — le tout illustré par un cas concret.


## Cas d'usage

Pour rendre tout ça concret, le plus simple est de s'appuyer sur un exemple. Pour la suite de l'article, nous allons prendre comme fil rouge un cas fictif : celui d'un **opérateur de bornes interactives** (billetterie, information, services) qui déploie et maintient un parc de bornes chez des clients B2B et B2C.

Cet opérateur a développé en interne une **application de gestion d'incidents**. Elle :

- **détecte les incidents** à partir d'événements remontés par différentes sources et systèmes tiers (télémétrie, supervision réseau, ticketing, GMAO, etc.) ;
- **fournit des outils de diagnostic et de suivi**, incluant des mécanismes de résolution automatique s'appuyant entre autres sur l'IA ;
- **propose des tableaux de bord de pilotage et de supervision** permettant de connaître l'état du parc en temps réel, avec des filtres par zone géographique, client ou criticité.

C'est un bon terrain de jeu pour notre sujet : forte composante technique, utilisateurs métier aux attentes concrètes, et nécessité de démontrer une valeur business tangible. Exactement le genre de service où la question "comment mesurer la valeur ?" se pose à chaque comité de pilotage.


## Les trois types de métriques

### Fonctionnement → *utilisable* : "Le système fait-il ce qu'il est censé faire ?"

Les métriques de fonctionnement mesurent la santé technique et l'intégrité opérationnelle de la plateforme. Elles vérifient que les composants critiques — interconnexions partenaires, automatisations, flux de données — fonctionnent comme attendu. Ce sont les premières à surveiller : sans fiabilité technique, rien d'autre ne tient.

_Exemples :_

* Taux de liaison automatique avec le système de ticketing
* Nombre d'incidents avec synchronisation GMAO réussie
* Taux de résolution automatique des déconnexions < 2h

### Usage → *utilisé* : "Les utilisateurs se sont-ils approprié l'outil ?"

Une fois la fiabilité technique acquise, encore faut-il que les utilisateurs s'en servent. Les métriques d'usage quantifient l'adoption et les comportements : qui utilise le service, à quelle fréquence, pour quelles actions. Elles révèlent si les workflows sont adoptés et permettent d'identifier les points de friction ou d'abandon.

_Exemples :_

* Nombre d'utilisateurs actifs (≥ 1 action métier sur 7j)
* Taux d'engagement (utilisateurs modifiant des statuts)
* Volume d'incidents traités par semaine
* Taux d'utilisation d'une fonctionnalité clé (ex. diagnostic automatique)

### Impact → *utile* : "Le produit apporte-t-il la valeur attendue ?"

Un service peut fonctionner parfaitement et être largement utilisé sans pour autant créer de la valeur. Les métriques d'impact évaluent la contribution concrète du service aux objectifs métier de l'organisation : gains de temps, qualité de service, retour sur investissement.

_Exemples :_

* Réduction du temps moyen de résolution des incidents
* Temps cumulé gagné grâce au traitement via la plateforme
* Amélioration du taux de résolution au premier niveau (vs. escalade maintenance)
* Satisfaction utilisateurs sur les diagnostics proposés


## Les leviers de création de valeur

La troisième dimension — l'impact — mérite qu'on s'y attarde. Qu'est-ce que "créer de la valeur", concrètement ? Au bout du compte, c'est presque toujours une question d'argent — gagné, économisé ou non perdu. Mais les chemins pour y parvenir sont multiples.

**Réduction des temps d'exécution et délais de traitement.** C'est le levier le plus visible : ce qui prenait des heures manuellement se fait en minutes. Le temps gagné se réinvestit dans des tâches à plus forte valeur ajoutée.

**Capacité à monter en échelle.** Qui dit plus vite, dit aussi plus. Le service permet d'adresser des volumétries et des problématiques qu'on n'oserait pas — ou ne pourrait pas — gérer autrement. C'est un changement de nature, pas seulement de degré.

**Réduction des coûts intrinsèques.** Ce passage à l'échelle ouvre un autre levier : la négociation. En automatisant des traitements à grande échelle, le service génère des données de volumétrie qui servent de base pour renégocier les conditions auprès des fournisseurs et prestataires.

**Fiabilisation et traçabilité de la donnée.** Répéter et enchaîner des tâches minutieuses manipulant des montants ou des valeurs critiques conduit inévitablement à une baisse d'attention, et par conséquent à des erreurs de saisie ou de validation. Ces erreurs peuvent avoir des répercussions en cours ou en bout de chaîne — logistique opérationnelle, ou pire, direction financière. Automatiser des traitements avec des règles claires, précises et documentées limite fortement ces risques. Et l'automatisation apporte un bénéfice supplémentaire : chaque traitement laisse une trace. C'est critique en cas d'audit réglementaire ou de problème de sécurité — c'est de la gestion de risque. Au-delà, cet historique structuré se révèle précieux pour des travaux prospectifs en Business Intelligence ou en IA.

**Amélioration de la reprise sur erreur.** Les dossiers à la marge, les cas complexes, les exceptions : c'est là que les processus manuels échouent le plus souvent. Un service numérique bien conçu permet de détecter, isoler et retraiter ces cas de manière structurée.

**Réduction de la pénibilité et amélioration de l'expérience salarié.** Au-delà des systèmes, il y a les humains qui les utilisent. Des tâches répétitives ou des conditions de travail médiocres usent les collaborateurs. Au mieux, ils quittent l'entreprise. Au pire, ils mettent leur talent et leur énergie au service de la concurrence. Or recruter, former et fidéliser un collaborateur est long, coûteux et énergivore. La perte d'un collaborateur productif — par son savoir, son savoir-faire, son implication — peut rapidement devenir un coût critique : monétaire, culturel et capacitaire. Un outil bien conçu contribue au plaisir de travail, à la motivation et à la fidélisation.

**Rayonnement interne et externe.** Enfin, un service qui fonctionne bien devient un atout de crédibilité — métier, méthodologique, technique, culturel. Il attire les talents, inspire les équipes voisines et peut devenir un argument commercial ou partenarial.


## Choisir les bonnes périodes d'analyse

Une fois les métriques identifiées, reste une question pratique : **sur quelle fenêtre de temps les observer ?** Les périodes pertinentes varient selon la nature de l'indicateur :

* 7 jours (semaine)
* 30 jours (mois)
* 90 jours (trimestre)
* 180 jours (semestre)
* 365 jours (année)

Mais toutes les métriques ne sont **pas pertinentes** sur toutes les périodes. Un indicateur d'usage a du sens à la semaine ; un indicateur de tendance structurelle n'en a qu'au trimestre ou au-delà :

| Métrique | 7j | 30j | 90j | 180j | 365j |
|---|---|---|---|---|---|
| **Utilisateurs actifs** | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| **Incidents traités** | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Temps moyen de résolution** | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| **Taux de liaison ticketing** | ❌ | ✅ | ✅ | ✅ | ✅ |

À noter que la multiplication des périodes engendre une forte augmentation de la complexité technique. Mieux vaut commencer avec deux ou trois fenêtres bien choisies que de vouloir tout couvrir d'emblée.

Le choix de la période dépend aussi de la **nature prédictive** de l'indicateur. En product analytics, on distingue les ***leading indicators*** (indicateurs avancés) des ***lagging indicators*** (indicateurs retardés). Un *leading indicator* signale un problème à venir — par exemple, une hausse des incidents stagnants annonce une saturation de l'équipe. Un *lagging indicator* constate un résultat passé — le temps moyen de résolution mesure une performance déjà réalisée. Les premiers se lisent à la semaine pour réagir vite ; les seconds prennent leur sens au mois ou au trimestre pour dégager des tendances.


## Des métriques qui évoluent avec le produit

Il y a un piège plus insidieux que de mal mesurer : **continuer à mesurer la bonne chose au mauvais moment**.

Au lancement d'un produit, suivre le nombre d'utilisateurs inscrits ou actifs est légitime — c'est même vital. On a besoin de savoir si le service trouve son public, si l'adoption progresse, si les efforts de déploiement portent leurs fruits. Mais passé un certain seuil — une base d'utilisateurs stabilisée, une part de marché atteinte, un usage intégré dans les habitudes — ce même indicateur perd sa valeur stratégique. Il continue de monter (ou de se maintenir), et c'est rassurant. Sauf que la criticité s'est déportée ailleurs.

C'est exactement ce qu'est une **[vanity metric](https://matthieu-sanogho.com/vanity-metrics-definition/)** : un indicateur qui donne l'illusion que tout va bien, sur lequel on se concentre par confort, mais qui ne guide plus aucune décision. Le nombre de comptes créés, le volume de pages vues, le total cumulé de tickets traités depuis le lancement — autant de chiffres qui impressionnent dans un rapport, mais qui ne disent rien sur la valeur réellement produite aujourd'hui.

Le modèle 3U aide à s'en prémunir, à condition d'accepter une règle : **les métriques doivent évoluer avec le produit**. À chaque étape de maturité, la question dominante change :

- **Phase de lancement** → Le système fonctionne-t-il ? *(focus Fonctionnement)*
- **Phase d'adoption** → Les utilisateurs s'en servent-ils ? *(focus Usage)*
- **Phase de maturité** → Le service crée-t-il la valeur attendue ? *(focus Impact)*

Une métrique pertinente en phase d'adoption peut devenir vaniteuse en phase de maturité. Le nombre d'utilisateurs actifs, si critique au démarrage, finit par n'être qu'un indicateur de maintenance une fois le service installé. La vraie question devient alors : qu'est-ce que ces utilisateurs **accomplissent** grâce à l'outil, et à quel coût ?

Réévaluer régulièrement ses métriques — en supprimer, en ajouter, en faire évoluer les seuils — n'est pas un signe d'instabilité. C'est le signe d'un pilotage qui reste aligné avec la réalité du terrain.

## La North Star Metric

À l'opposé des vanity metrics, il existe la notion de **[North Star Metric](https://amplitude.com/blog/product-north-star-metric)** (NSM) : l'indicateur unique qui capture le mieux la valeur que le produit crée pour ses utilisateurs, et autour duquel toutes les autres métriques gravitent. Une bonne NSM a la particularité de "tirer" l'ensemble du produit : si elle progresse, c'est que tout le reste fonctionne.

Pour donner un exemple concret : du temps où je travaillais chez [Pix](https://pix.fr), ce que je considérais être la North Star Metric était le **nombre de certifications délivrées**. Ce seul chiffre entraînait tout le reste dans son sillage : la qualité du référentiel de questions, le fait que les utilisateurs devaient y répondre pour se positionner dans la matrice de niveaux, la nécessité de fournir une expérience d'accompagnement et de prescription adaptée, ainsi que les outils et moyens pour assurer la logistique de certification. Un indicateur, une chaîne de valeur complète.

Pour reprendre notre fil rouge : dans le cas de la plateforme de gestion d'incidents pour bornes interactives, la North Star Metric serait le **taux de disponibilité opérationnelle du parc**. Ce seul chiffre entraîne toute la chaîne : pour qu'il progresse, il faut détecter les incidents rapidement (fonctionnement), que les équipes les traitent efficacement (usage), et que les diagnostics automatiques soient pertinents (impact). Un indicateur unique, compréhensible de l'équipe technique au CODIR, et qui résume l'essentiel : est-ce que les bornes marchent ?

Identifier sa NSM est un exercice difficile mais salutaire. Elle évolue avec le produit — et quand on n'arrive plus à la formuler clairement, c'est souvent le signe qu'on a perdu de vue ce que le service est censé apporter.

## Quand la mesure corrompt l'objectif

Même avec les bonnes métriques, il reste un risque. Deux lois bien connues en sciences sociales mettent en garde contre ce qui se passe quand une mesure devient un objectif :

- La **[loi de Goodhart](https://en.wikipedia.org/wiki/Goodhart%27s_law)**, formulée par l'économiste Charles Goodhart en 1975 et popularisée par l'anthropologue Marilyn Strathern en 1997 : ***"When a measure becomes a target, it ceases to be a good measure"*** — quand une mesure devient un objectif, elle cesse d'être une bonne mesure. Goodhart l'avait observé dans le domaine de la politique monétaire britannique ; Strathern l'a généralisé à tout système d'évaluation.
- La **[loi de Campbell](https://en.wikipedia.org/wiki/Campbell%27s_law)**, énoncée par le psychologue Donald T. Campbell en 1979 : *"The more any quantitative social indicator is used for social decision-making, the more subject it will be to corruption pressures and the more apt it will be to distort and corrupt the social processes it is intended to monitor"* — plus un indicateur quantitatif est utilisé pour prendre des décisions, plus il est soumis à des pressions de corruption et plus il tend à déformer les processus qu'il est censé observer.

Autrement dit : dès qu'un indicateur sert à évaluer, récompenser ou sanctionner, les acteurs trouvent des moyens de le satisfaire sans nécessairement produire l'effet recherché. On optimise la métrique, pas l'objectif. Le nombre de tickets clôturés augmente — mais les incidents complexes sont découpés artificiellement. Le temps moyen de résolution baisse — mais les cas difficiles sont requalifiés pour sortir des statistiques.

C'est pourquoi les métriques ne doivent jamais être lues isolément, et pourquoi la structure en trois dimensions du modèle 3U est un garde-fou : si l'usage progresse mais que l'impact stagne, c'est le signal qu'on optimise peut-être le mauvais indicateur.


## En pratique : exemples de requêtes SQL

La théorie, c'est bien. Mais au quotidien, une métrique n'existe que si on sait l'extraire. Voici 3 requêtes SQL (PostgreSQL), une par dimension du modèle 3U, pour garder uniquement l'essentiel.

### Utilisable — Fonctionnement : les incidents stagnants

Avant de parler d'impact, il faut s'assurer que l'opérationnel tourne. Cette requête détecte les incidents ouverts qui ne bougent plus depuis plus de 7 jours.

```sql
SELECT COUNT(*) AS stale_incidents
FROM incidents
WHERE status IN ('A traiter', 'En cours')
AND updated_at < NOW() - INTERVAL '7 days';
```

**Lecture.** Si ce volume monte durablement, le service n'est plus réellement *utilisable* : la chaîne de traitement se bloque.

### Utilisé — Usage : les utilisateurs actifs (7j)

L'adoption réelle se mesure par les actions métier, pas par le nombre de comptes créés.

```sql
SELECT COUNT(DISTINCT user_id) AS active_users
FROM user_actions
WHERE action_type IN (
  'status_change',
  'comment',
  'ticketing_link',
  'diagnostic_feedback',
  'incident_detail_view'
)
AND performed_at > NOW() - INTERVAL '7 days';
```

**Lecture.** Une baisse des actifs signale souvent un problème d'UX, de formation ou de pertinence fonctionnelle.

### Utile — Impact : le taux de suivi des recommandations

Pour chaque incident détecté, le service permet de générer un diagnostic via IA, avec des suggestions d'actions de supervision ou de tâches de maintenance à effectuer.

La valeur n'existe que si ces recommandations changent effectivement les décisions de terrain.

```sql
SELECT
  COUNT(*) AS total_proposed,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'completed') / COUNT(*),
  1) AS completion_rate_pct
FROM supervision_actions
WHERE created_at > NOW() - INTERVAL '7 days';
```

**Lecture.** Un taux élevé indique un service réellement *utile*. Un taux faible révèle un décalage entre les suggestions du produit et la réalité métier.


## Ce que les chiffres ne disent pas

Les requêtes SQL présentées ci-dessus mesurent le *quoi* et le *combien*. Mais elles ne répondent jamais au *pourquoi*.

Un taux de suivi des recommandations à 80% est un excellent signal. Mais pourquoi les utilisateurs suivent-ils ces recommandations ? Par confiance dans l'outil ? Par obligation hiérarchique ? Par habitude ? La réponse change radicalement l'interprétation — et les décisions produit qui en découlent.

C'est là qu'intervient le **qualitatif** : entretiens utilisateurs, observations terrain, verbatims collectés dans les tickets, enquêtes de satisfaction (NPS, SUS). Ces données ne se mettent pas dans un dashboard, mais elles sont souvent les plus éclairantes. Quelques pratiques simples à mettre en place :

- **Entretiens réguliers** (même 15 min/mois) avec des utilisateurs représentatifs — pas les power users, mais ceux qui peinent ou abandonnent.
- **Verbatims structurés** : collecter systématiquement les retours libres (commentaires dans les tickets, messages Slack, demandes de support) et les catégoriser.
- **Enquêtes flash** : une question unique envoyée après une action clé ("Ce diagnostic vous a-t-il été utile ? Oui / Non / Partiellement"). Le taux de réponse est faible, mais les résultats sont exploitables.

**Le quantitatif dit *où* regarder. Le qualitatif dit *quoi* comprendre.** Les deux sont indispensables — et le modèle 3U s'applique aussi bien à l'un qu'à l'autre : on peut recueillir du feedback qualitatif sur le fonctionnement ("l'interface rame le matin"), l'usage ("je n'utilise pas cette fonctionnalité parce que...") et l'impact ("grâce à cet outil, j'ai pu traiter le double d'incidents").


## Exemples de pages `/stats` et bonnes pratiques

Si vous cherchez des références concrètes, voici quelques pages utiles à parcourir :

- [Indicateurs de beta.gouv.fr](https://beta.gouv.fr/stats) : un bon exemple de pilotage multi-niveaux (produits, standards, impact), avec publication publique assumée.
- [Mes Aides Réno — /stats](https://mesaidesreno.beta.gouv.fr/stats) : bon équilibre entre objectifs explicites, métriques d'usage et indicateurs de conversion.
- [France Chaleur Urbaine — /stats](https://france-chaleur-urbaine.beta.gouv.fr/stats) : bon exemple de mise en avant d'indicateurs d'impact métier lisibles (raccordements, CO2 évité, passage à l'action).
- [Recommandations-collaboratives — Statistiques d'impact](https://recommandations-collaboratives.beta.gouv.fr/stats-impact/) : intéressant pour la clarté de la North Star Metric et le suivi du "passage à l'action".

Ce qu'on retrouve dans les meilleures pages `/stats` :

- **Mettre en premier et en avant la valeur créée (dimension "Utile").** La première information visible doit répondre à la question : "quelle valeur concrète est créée ?"
- **Une métrique d'impact centrale (North Star) clairement formulée.** Le lecteur doit comprendre en 10 secondes ce que le produit améliore concrètement.
- **Un chaînage explicite entre fonctionnement, usage et impact.** Montrer les 3U évite les lectures trompeuses ("beaucoup d'usage" sans valeur créée, par exemple).
- **Des définitions sans ambiguïté.** Pour chaque indicateur : périmètre, formule, période d'observation, exclusions éventuelles.
- **Une date de fraîcheur visible.** Afficher "données au JJ/MM/AAAA" pour éviter les interprétations sur des chiffres obsolètes.
- **Des objectifs ou seuils de lecture.** Une courbe seule ne dit rien ; une cible ou un seuil d'alerte rend la métrique actionnable.
- **Un focus sur les décisions, pas sur les vanity metrics.** Garder peu d'indicateurs, mais ceux qui déclenchent des arbitrages produit.
- **De la transparence sur les limites.** Biais connus, angles morts, hypothèses de calcul : mieux vaut les expliciter que sur-vendre la précision.
- **Une page maintenable.** Si l'actualisation dépend d'un export manuel, la page mourra ; privilégier des calculs automatisés.

Quand j'ouvre une page `/stats`, je regarde d'abord la valeur produite, puis je descends vers l'usage et enfin le fonctionnement pour comprendre ce qui l'explique.

Une règle simple pour démarrer : **1 métrique "Utilisable", 1 métrique "Utilisé", 1 métrique "Utile", puis seulement ensuite enrichir**. Mais dans la page elle-même, affichez d'abord la métrique de valeur.


## Le coût de la mesure

Il y a un sujet rarement abordé mais crucial quand on est tech : **mesurer a un prix**.

Chaque métrique suppose une chaîne complète : instrumentation du code (événements, logs, tracking), pipeline de données (extraction, transformation, stockage), visualisation (dashboards, alertes) et maintenance dans la durée (montées de version, évolutions de schéma, corrections de bugs silencieux). Sans compter le temps humain d'analyse et d'interprétation.

Ce coût n'est pas négligeable. J'ai vu des équipes passer plus de temps à maintenir leurs dashboards qu'à exploiter ce qu'ils affichaient. Le risque est réel : on finit par mesurer ce qui est *facile* à mesurer plutôt que ce qui est *utile* à mesurer — un piège qui ramène directement aux vanity metrics.

Quelques principes pour garder le cap :

- **Commencer petit.** Trois à cinq métriques bien choisies valent mieux que vingt indicateurs que personne ne regarde. On peut toujours en ajouter.
- **Automatiser tôt.** Une métrique qu'il faut extraire manuellement chaque semaine sera abandonnée au bout d'un mois. Si elle vaut la peine d'exister, elle vaut la peine d'être automatisée.
- **Supprimer sans remords.** Si un indicateur n'a déclenché aucune décision en trois mois, il ne sert à rien. Le retirer allège la charge technique et clarifie la lecture.
- **Budgéter la mesure.** Comme n'importe quelle fonctionnalité, l'observabilité a un coût de développement et de maintenance. L'intégrer au backlog produit, pas dans un coin.


## Conclusion

Depuis mes tout débuts dans l'informatique et mon stage de fin d'études en entreprise, on m'a répété l'importance de s'intéresser au métier, au fonctionnel, à la stratégie dans laquelle un produit s'inscrit. On m'a très tôt parlé du [Golden Circle de Simon Sinek](https://simonsinek.com/golden-circle/) — *Why, How, What* — et de l'importance de commencer par le *Why*. Cette conviction ne m'a jamais quitté. Mais entre le principe et la pratique, il peut y avoir un fossé important : savoir qu'il faut mesurer la valeur est une chose, savoir *comment* en est une autre.

Le modèle 3U — **Utilisable, Utilisé, Utile** — n'est pas un framework de plus à plaquer sur un dashboard. C'est une grille de lecture pour se poser les bonnes questions au bon moment. Est-ce que ça marche ? Est-ce que les gens s'en servent ? Est-ce que ça change quelque chose ? Trois questions simples, mais qui demandent une vraie discipline pour y répondre honnêtement.

Si vous ne retenez qu'une chose de cet article : **commencez par une métrique par dimension**. Une métrique de fonctionnement, une métrique d'usage, une métrique d'impact. Trois chiffres. Pas plus. Si ces trois chiffres racontent une histoire cohérente, vous êtes sur la bonne voie. S'ils se contredisent, vous venez de trouver où creuser.
