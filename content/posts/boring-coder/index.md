---
title: "Je suis un développeur ennuyeux"
categories: ["lifestyle", "boring coder", "chatgpt"]
keywords:
- développeur
- web developer
- lifestyle
- chatgpt
date: 2023-02-26T23:17:00+01:00
draft: false
summary: Je suis un développeur ennuyeux qui privilégie des choix (techno, archi, infra, méthodo) simples et éprouvés à des alternatives plus créatives.
---
Je suis un développeur ennuyeux. Je ne l'ai pas toujours été. Et lorsque c'est arrivé, je ne l'ai pas toujours assumé. Aujourd'hui encore, j'éprouve de temps en temps des diffcultés pour assumer cette posture ou évolution de nature.

## Simple. Basique.

> 🇬🇧 Histoire d'alléger le style et de varier les formes d'écriture, j'alternerai par la suite et indistinctement les termes de *boring developer*, *boring coder* ou développeur ennuyeux.

Ce que j'appelle "être un *boring developer*", c'est une manière d'aborder le développement logiciel à travers une recherche de la simplicité, de la sérénité et de la solidité.

En même temps que j'écris, je me dis qu'un terme tout à fait adapté pourrait être l'adjectif "rustique". Nous sommes vraiment dans cette idée d'une notion intrinsèquement et suffisamment basique qui permet un résultat *résilient* capable de passer à l'échelle sans nécessité de grand entretien.

**Être un développeur ennuyeux, c'est privilégier des choix (technologiques, architecturaux, méthodologiques, ergonomiques, etc.) ordinaires, éprouvés, connus qui représentent une forme de simplicité et valeur sûre.**

Des exemples de "choix technologiques ennuyeux" :

- Base de données : privilégier PostgreSQL plutôt que MongoDB
- Gestionnaire de paquets : utiliser `npm` plutôt que `yarn` ou `pnpm`, même si l'un apporte des fonctionnalités intéressantes et le second des temps d'exécution meilleurs
- Framework web : choisir Django, SpringMVC ou Express plutôt que Meteor.
- Framework JS : pencher pour React, Vue ou ~~Angular~~ (non, là ce n'est pas possible) plutôt que des technos pourtant brillantes comme Elm ou Elixir
- Infrastructure : opter pour un hébergeur de type PaaS (Scalingo, Clever Cloud, Heroku, Netlify, Vercel) plutôt que gérer son infra soi-même en IaaS avec Kubernetes
- Architecture : s'en tenir à la bonne vieille approche 3-tiers, plutôt que tenter des approches type Hasura (au demeurant une excellente techno) ou Event Driven Architecture (EDA pour les intimes)
- Style de programmation : privilégier une approche procédurale/objet plutôt que fonctionnelle ; privilégier un style de code simple plutôt que des patterns et du sur-découpage de fichiers / méthodes dans tous les sens

Je ne doute pas que toutes les technos à droite soit intelligentes et optimisées par rapport à tel ou tel type d'usage. Au contraire, je loue et j'admire la réflexion qu'elles portent et tous les efforts qu'elles ont nécessités. C'est justement parce que ce sont des évolutions spécifiques à des contextes et enjeux bien particulier qui me fait "me méfier" de ces technos.

Tout le monde n'est pas Google ou Netflix. Rares sont les produits qui ont un besoin de scaling de 2 à 30 instances en quelques secondes ; d'avoir un cache avec une capacité de réplication et résilience de plusieurs TO à travers la planète ; d'avoir une élasticité de modélisation telle que le modèle ACID ne fonctionne plus ; etc.

![Dessin humouristique : courbe d'évolution du style de programmation entre un dev junio, medior, senior](evolution_dev_code_style.webp)

[source : reddit.com/r/ProgrammerHumor](https://www.reddit.com/r/ProgrammerHumor/comments/x5sle0/something_i_have_noticed_as_juniors_become/)

## L'âge de raison

Je suis biaisé par ma propre expérience. J'ai eu la chance de partiper et monter des projets qui sont passés à l'échelle plutôt rapidement :
- une plateforme en ligne et internationale de présentation des produits financiers d'une grande banque française (France, Angleterre, Allemagne, Espagne et Italie)
- la refonte de la billetterie en ligne de Roland-Garros : supporter le passage de 100 à 40000 utilisateurs le jour de l'ouverture grand public (la bascule 9h59 → 10h00) pour une audience max de 10M de visiteurs / jour
- les campagnes de positionnement ou certification intensives sur Pix (rentrée scolaire, fin d'année civile et fin d'année scolaire) avec des pointes à 150K users/jour

> ⚠️ Le but n'est pas de "faire autorité" mais de contextualiser ma réflexion et teinter mon propos pour que vous puissiez vous faire votre propre opinion et remettre mes dires en perspectives. Il ne s'agit pas de science. Encore moins de dogme. Chacun sa vérité. Restez critiques et alertes.

Comme le disait de façon un peu provocante Christian Faure lors d'un USI, 95% du web, ce sont des formulaires en ligne, sur des sites vitrines ou bureautique. Je ne sais pas dans quelle mesure la stat est vraie, mais je me dis ou je crois constater qu'en ordre de grandeur et dans l'idée, on ne doit pas en être très loin.

J'adore l'idée et la puissance permise par l'Event Sourcing. Je trouve l'approche vraiment belle. La promesse de pouvoir simplement rejouer précisément un contexte pour comprendre, analyser, débugger est alléchante mais aussi bien réelle. Il m'est arrivé de jouer avec sur des projets perso. J'ai même été jusqu'à en injecter un peu sur une application de formulaire de santé en ligne pour une assurance suisse. Pourtant, je n'en ferai pas un choix par défaut comme certains le clament. Ça reste une approche particulière, moins documentée, moins maîtrisée par la communauté, non enseignée à l'école ou en formations. Elle nécessite une culture et des compétences spécifiques. En découle un coût d'investissement supérieur (temps d'adaptation / formation, TJM / salaire, outillage et procédures).

**Je suis devenu un *boring developer* à force de devoir assumer mes choix.**

C'est une chose de bâtir une refonte d'un système sur Play Framework. C'en est une autre de trouver des développeurs qui ont envie de s'y mettre, capable de le faire rapidement ; et je ne parle pas des breaking changes importants qui font qu'on rechigne à effectuer la montée de version ou qu'elle prend des semaines entières (pas marrantes).

Autre exemple : j'étais Tech Lead / archi sur un projet d'innovation pour une grande assurance 🇫🇷 du temps ou les SPA et frameworks JS n'étaient pas encore la norme. J'ai poussé pour faire du SpringBoot + BackboneJS. Le projet cartonnait et l'équipe était louée pour le rythme de dev, les performances ou la réactivité de l'interface. Le jour où il a fallu le réintégrer au SI classique, qui n'était pas encore prêt pour ce type de projets, fut beaucoup moins drôle ([cf. ma meilleure question sur Stack Overflow](https://stackoverflow.com/questions/28310251/application-does-not-start-with-spring-boot-1-2-1-spring-security-servlet-2)). Idem quand il a fallu trouver quelqu'un pour reprendre le code et le faire évoluer. En même temps, changer d'avis et décider finalement d'envoyer le POC/MVP en production… pas besoin de vous raconer l'histoire 🤣

Je l'expliquerai mieux un autre jour peut-être dans un prochain article : pour moi, **en tant que dev, il est préférable d'investir véritablement et durablement dans les concepts, standards et autres conventions plutôt que tenter de s'accrocher désespéramment au _train de la hype_**.

## Des bienfaits de l'ennui

Être un développeur ennuyeux peut sembler peu excitant au premier abord. En réalité, cette approche comporte quelques avantages significatifs.

Un développeur ennuyeux aura tendance à privilégier le pragmatisme et la stabilité plutôt que les dernières nouveautés ou l'over-engineering. Cela peut sembler peu passionnant, mais en fin de compte, cela permet d'économiser du temps, de l'énergie et de l'argent. Voici quelques raisons pour lesquelles être un développeur ennuyeux peut être une bonne chose :

- le pragmatisme : en tant que développeur ennuyeux, vous allez privilégier les solutions pragmatiques plutôt que les solutions les plus cool ou les plus récentes. Cela signifie que vous allez choisir les outils qui fonctionnent le mieux pour le travail en question, plutôt que de vous laisser séduire par les dernières tendances ou les technologies les plus à la mode. Le pragmatisme vous permet d'aller droit au but et de ne pas vous égarer dans des choix technologiques inutilement compliqués ou risqués.

- la stabilité : en choisissant des outils standards plutôt que les dernières nouveautés, vous minimisez les risques d'instabilité et de bugs. Les technologies les plus récentes peuvent se montrer plus instables, car elles n'ont pas encore été testées à grande échelle. En choisissant des outils plus éprouvés, vous évitez les problèmes de stabilité et vous pouvez vous concentrer sur votre travail plutôt que de passer votre temps à résoudre des problèmes techniques.

- l'économie : les technologies les plus à la mode sont souvent plus coûteuses que les solutions plus standard. En optant pour des solutions plus économiques, vous pouvez économiser de l'argent pour votre entreprise ou pour vos clients, tout en obtenant des résultats de qualité.

- la simplicité : en choisissant des technologies standard et éprouvées, vous pouvez simplifier votre travail. Les technologies les plus récentes peuvent souvent être très compliquées, ce qui peut rendre votre travail plus difficile et plus fastidieux. En optant pour des solutions plus simples, vous pouvez vous concentrer sur l'essentiel et éviter les distractions inutiles.

En fin de compte, être un développeur ennuyeux ne signifie pas que vous manquez de créativité ou d'originalité. Cela signifie simplement que vous êtes pragmatique et que vous privilégiez la stabilité, l'économie et la simplicité. En adoptant cette approche, vous pouvez réaliser votre travail de manière plus efficace et plus efficiente, tout en fournissant des résultats de qualité pour votre entreprise, vos clients ou vous-mêmes.

## Fruit de la passion

Je ne me considère pas seulement comme un développeur ennuyeux. **Je me définis aussi comme un développeur passionné. Je n'oppose pas les deux qualités. J'ai même plutôt tendance à penser que ce sont deux caractéristiques complémentaires.** C'est parce que je passe du temps (souvent perso, je le concède) à regarder des choses nouvelles, me tenir au courant, expérimenter, que je constate le niveau de maturité et les difficultés inhérentes à tel concept ou techno. Aussi, ma curiosité et ma soif de découvrir / apprendre s'en trouve épanchée. Il devient plus facile et moins frustrant de faire des choix basiques, simples. Le fait de me confronter régulièrement à la nouveauté permet de challenger et approfondir ma maîtrise des classiques.

Le classicisme, ça pourrait être un énième qualificatif pour dessiner les contours du profil *boring coder*.

## Inspiration

J'ai eu l'idée de cette personnalité grâce aux travaux des équipes de Doctolib (👋 coucou les ex-Octos Michel Domenjoud et Nicolas de Nayer) autour de la "Boring Architecture". Je vous invite à regarder, si ce n'est déjà fait, [leur très bon talk à Devoxx 2019](https://www.youtube.com/watch?v=ui_FlkhtxRE) à ce propos.

{{< youtube ui_FlkhtxRE >}}

De leur aveu même, suite à la COVID et l'explosion de l'usage et de la plateforme, ils n'ont plus une architecture et une organisation aussi *boring*, mais c'est complètement justifié par l'évolution de l'entreprise et du (des) produits. La recherche de simplicité, la frugalité et le pragmatisme restent au cœur de leur démarche technique. Là aussi, go regarder [leur dernier talk sur le sujet (Devoxx 2022)](https://www.youtube.com/watch?v=uo73C2ck1aU) (par David Gageot et Nicolas de Nayer).


## Conclusion

Je ne m'attendais pas à avoir autant de choses à dire sur le sujet. Comme quoi, on peut être un développeur ennuyeux mais avoir tout de même des choses (que j'espère 😅) intéressantes à partager. Je pense que je tiens là ma meilleure conclusion.

***

***Plot twist***

Peu après avoir rédigé les premiers paragraphes de cet article, j'ai été pris de curiosité et j'ai sollicité l'aide de ChatGPT. Je me demandais ce qu'il allait pouvoir me sortir comme réponse, sur un concept "un peu créatif" (rappel : on peut être ennuyeux et créatif à la fois) comme celui-ci.

Au début, il n'a pas compris la subtilité. Pire que ça, il m'a pris en pitié 😭. Dès mon input suivant, il s'est vite rattrapé pour me proposer, moyennant pas mal de paraphrase, une réponse beaucoup plus appropriée.

J'ai poussé le bouchon un peu plus loin et ai évalué sa capacité à extrapôler, et dans une certaines mesure "inventer", via des exemples. Le résultat, sans être totalement bluffant, est tout de même assez impressionnant. Je pense que si je l'avais correctement récompensé (comme précédemment "c'est bien, donne m'en plus"), il aurait pu aller un cran plus loin encore. Mais bon, j'ai vu Terminator. Je me méfie de Skynet… 😎

Finalement, je me suis arrêté à la demande d'exemples. Dans l'article, j'ai repris la partie "Avantages" quasi entièrement, ainsi que les 2 exemples supplémentaires qu'il m'a fournis, que j'ai retravaillés et complétés.

Tout le reste du texte est mon œuvre, soit 75% (~451/1758 mots) du texte (hors cette section, totalement originale).

Mon but à travers ce blog est de partager, le plus sincèrement et précisément possible, mon expérience, mon vécu, mes réflexions. Je ne cherche pas à faire du chiffre ou du sensationnel. Il m'importe d'être le plus honnête et intègre possible. Je ne dis pas que je n'utiliserais jamais ChatGPT (ou équivalent) à l'avenir. Mais je préviendrai à chaque fois. Par respect pour les lecteurs… et pour moi.[CQFD](#conclusion)

![Input ChatGPT 1](chatgpt_1.png)
![Input ChatGPT 2](chatgpt_2.png)
![Input ChatGPT 3](chatgpt_3.png)
![Input ChatGPT 4](chatgpt_4.png)



