---
title: "Architecture RAG (2/4) — Retrieval : trouver les bons passages"
categories: ["intelligence artificielle"]
keywords:
- RAG
- retrieval
- recherche hybride
- BM25
- reranking
- cross-encoder
- recherche vectorielle
- recherche sémantique
- RRF
date: 2026-02-16T08:00:00+01:00
draft: true
toc: true
slug: concevoir-un-assistant-documentaire-rag-retrieval
summary: "Le retrieval est le cœur d'un système RAG. Reformulation de requête, recherche hybride, reranking et sélection du contexte : tout se joue ici."
description: "Reformulation de requête (HyDE, multi-query), recherche hybride vectorielle + lexicale, reranking par cross-encoder, sélection et optimisation du contexte pour un assistant documentaire RAG."
---

> Cet article fait partie de la série **[Concevoir un assistant documentaire : retour d'expérience sur l'architecture RAG]({{< ref "/posts/concevoir-un-assistant-documentaire-rag" >}})**. Il en constitue la deuxième partie, après [Pipeline d'ingestion]({{< ref "/posts/concevoir-un-assistant-documentaire-rag-ingestion" >}}).

Le retrieval est le cœur du système. C'est ici que se joue la pertinence des réponses. Un retrieval médiocre, et le LLM le plus puissant du monde ne pourra pas produire une bonne réponse — parce qu'il n'aura pas les bons éléments sous les yeux.

## 1. Reformuler la requête

La question d'un utilisateur est rarement optimale pour la recherche. Elle peut être ambiguë, incomplète ou contextuellement implicite. Prenez un collaborateur qui demanderait à un assistant RH : *"J'ai droit à combien ?"* — sans préciser s'il parle de congés, de RTT ou de tickets restaurant.

### Les problèmes typiques

- **L'ambiguïté** : un même mot peut désigner des concepts différents selon le contexte métier ("plan" dans un contexte RH vs. projet vs. architecture).
- **L'implicite conversationnel** : dans un échange multi-tours, l'utilisateur dit "et pour les cadres ?" en s'attendant à ce que le système comprenne qu'il poursuit la question précédente sur les congés.
- **Les fautes de frappe et approximations** : "combient de jour de télétrvail" doit quand même fonctionner.
- **Les requêtes multi-intentions** : "Quels sont les jours de congé et comment poser un arrêt maladie ?" — deux questions en une, qui nécessitent potentiellement des chunks différents.

### Les techniques de reformulation

Plusieurs approches existent, souvent combinées :

- **L'expansion de requête** (*query expansion*) : un LLM reformule la question de l'utilisateur en une version plus explicite et plus riche en termes de recherche, en ajoutant des synonymes ou des termes liés.
- **HyDE** (*Hypothetical Document Embedding*) : au lieu de chercher directement avec la question, on demande au LLM de générer une réponse hypothétique, puis on utilise l'embedding de cette réponse comme requête de recherche. L'intuition : un passage de réponse ressemble davantage aux chunks du corpus qu'une question.
- **La multi-requête** (*multi-query*) : on génère plusieurs reformulations de la même question et on lance les recherches en parallèle, puis on fusionne les résultats. Cela élargit le rappel en couvrant plusieurs angles sémantiques.
- **La décomposition** (*query decomposition*) : pour les questions complexes ou multi-intentions, on découpe la requête en sous-questions indépendantes, chacune traitée séparément.
- **Le step-back prompting** : on reformule la question en une version plus abstraite ou plus générale, pour capter des passages qui traitent du sujet de façon englobante.
- **La reformulation contextuelle** (*conversation-aware*) : dans un échange multi-tours, on injecte l'historique de la conversation pour résoudre les pronoms et les références implicites ("et pour les cadres ?" → "Quels sont les jours de congé pour les cadres ?").

En pratique, l'expansion de requête simple via un LLM rapide (type Haiku ou GPT-4o-mini) offre le meilleur rapport coût/bénéfice. HyDE est puissant mais double le coût et la latence. La multi-requête est utile sur des corpus très hétérogènes.

## 2. Combiner recherche vectorielle et lexicale

La recherche vectorielle capture la proximité sémantique : elle comprend que "congé parental" et "absence pour naissance" sont liés, même si les mots sont différents. Mais elle peut rater des correspondances exactes, notamment pour des termes techniques, des identifiants ou des acronymes.

C'est pourquoi un bon système combine recherche vectorielle (par embedding, cosine similarity) et recherche lexicale (type BM25, correspondance exacte de termes). Sur des corpus techniques — code, normes, procédures, comptes rendus avec des noms propres — la recherche full-text reste indispensable.

### Les modes de recherche

- **Recherche vectorielle pure** (*dense retrieval*) : on compare l'embedding de la requête avec les embeddings des chunks via une mesure de similarité (cosine, dot product, distance euclidienne). Forces : compréhension sémantique, tolérance aux reformulations. Faiblesses : mauvaise gestion des termes rares, acronymes, identifiants, noms propres.
- **Recherche lexicale pure** (*sparse retrieval*) : algorithmes comme BM25, TF-IDF, ou full-text search natif (PostgreSQL `tsvector/tsquery`, Elasticsearch). Forces : correspondance exacte, rapidité, explicabilité. Faiblesses : aucune compréhension sémantique — "voiture" et "automobile" sont deux termes différents.
- **Recherche hybride** : on exécute les deux recherches en parallèle et on fusionne les résultats. C'est l'approche qui donne les meilleurs résultats dans la majorité des cas.

### La fusion des résultats

La fusion des résultats de recherche hétérogènes est un problème en soi. Les scores de similarité vectorielle et les scores BM25 ne sont pas sur la même échelle — on ne peut pas simplement les additionner. Plusieurs stratégies existent :

- **RRF** (*Reciprocal Rank Fusion*) : on fusionne les résultats en se basant sur leur rang dans chaque liste, pas sur leur score brut. C'est simple, robuste, et ne nécessite aucun calibrage. C'est la méthode la plus utilisée en pratique.
- **Fusion pondérée normalisée** : on normalise les scores de chaque source (min-max ou z-score), puis on calcule une moyenne pondérée. Plus flexible que RRF, mais nécessite de calibrer les poids — ce qui revient à un hyperparamètre supplémentaire à tuner.
- **Fusion apprise** (*learned fusion*) : un modèle entraîné apprend à combiner les signaux. Plus performant en théorie, mais nécessite des données d'évaluation annotées.

Certaines bases vectorielles supportent nativement la recherche hybride (Weaviate, Qdrant, Elasticsearch). Avec pgvector, il faut combiner la recherche vectorielle et le full-text PostgreSQL soi-même, mais la flexibilité SQL compense largement.

## 3. Reranking

La pratique industrielle consiste à fusionner les résultats des deux types de recherche, puis à appliquer un reranking via un modèle dédié, plus coûteux mais beaucoup plus précis. Contrairement aux bi-encoders utilisés pour les embeddings (qui encodent requête et passage séparément), un reranker évalue chaque paire (requête, passage) conjointement et produit un score de pertinence plus fin.

### Les approches de reranking

- **Les cross-encoders** : modèles comme `ms-marco-MiniLM` ou `bge-reranker-v2-m3`. Ils prennent en entrée la concaténation de la requête et du passage et produisent un score de pertinence. Très précis, mais lents (on ne peut pas pré-calculer les représentations — chaque paire doit être évaluée au moment de la requête).
- **Les rerankers via API** : Cohere Rerank, Jina Reranker, Voyage Rerank. Faciles à intégrer, performants, mais avec une dépendance cloud et un coût par requête.
- **ColBERT** (*Contextualized Late Interaction over BERT*) : un compromis entre bi-encoders et cross-encoders. Il pré-calcule des représentations par token (pas par passage entier), ce qui permet un reranking rapide tout en capturant les interactions fines entre requête et passage.
- **Le reranking par LLM** : on demande directement à un LLM de classer les passages par pertinence. Surprenamment efficace, mais coûteux et lent. Utile comme solution de dernier recours ou pour des benchmarks.

### L'architecture en cascade

En pratique, on adopte souvent une architecture en cascade (*pipeline*) : une première étape rapide et peu coûteuse (recherche vectorielle + BM25) ramène un large ensemble de candidats (50-100 passages), puis le reranker affine le classement sur ce sous-ensemble réduit. Cela permet de bénéficier de la précision du cross-encoder sans payer le coût de l'appliquer à l'ensemble du corpus.

C'est souvent ici que se joue la différence entre un prototype convaincant en démo et un système robuste en production. Sur un corpus de comptes rendus de réunion, par exemple, le reranking est déterminant : sans lui, les résultats de recherche remontent régulièrement des passages thématiquement proches mais factuellement hors sujet (une réunion sur la "reprise des données" vs. une réunion sur la "reprise d'activité").

## 4. Sélection du contexte

Les chunks sélectionnés doivent tenir dans la fenêtre de contexte du LLM. Le dimensionnement du top-K est un arbitrage constant entre coût, latence et risque d'hallucination : trop peu de contexte pousse le modèle à inventer ; trop de contexte dilue l'information pertinente.

### Les problématiques de sélection

- **Le phénomène "Lost in the Middle"** : des travaux de recherche ont montré que les LLM ont tendance à sous-exploiter les informations situées au milieu d'un long contexte, privilégiant le début et la fin. L'ordre dans lequel on injecte les chunks a donc une importance. Placer les passages les plus pertinents en premier et en dernier peut améliorer la qualité des réponses.
- **La redondance** : si plusieurs chunks disent la même chose (ce qui arrive fréquemment avec l'overlap ou quand le même sujet est abordé dans plusieurs documents), on gaspille des tokens sans apporter d'information supplémentaire.
- **Les contradictions** : pire que la redondance, deux chunks peuvent se contredire (un document obsolète et sa version mise à jour, deux sources avec des chiffres différents). Le LLM doit pouvoir résoudre ou signaler cette ambiguïté — encore faut-il que le prompt l'y encourage.

### Les stratégies d'optimisation

- **Le fenêtrage contextuel** (*contextual window expansion*) : quand un chunk est sélectionné, on inclut ses chunks adjacents (le passage avant et après dans le document d'origine) pour améliorer la cohérence locale. C'est une variante simplifiée de l'approche parent-enfant.
- **MMR** (*Maximum Marginal Relevance*) : au lieu de sélectionner les K passages les plus similaires à la requête, on diversifie : chaque nouveau passage sélectionné doit être pertinent par rapport à la requête mais aussi différent des passages déjà sélectionnés. Cela réduit la redondance et couvre plus de facettes de la question.
- **La compression contextuelle** (*contextual compression*) : un modèle intermédiaire résume ou extrait les passages clés de chaque chunk avant injection, réduisant la consommation de tokens tout en conservant l'information essentielle. LangChain propose un `ContextualCompressionRetriever` qui implémente cette approche.
- **Le map-reduce** : pour les questions qui nécessitent de synthétiser de nombreux passages (ex : "Résumez toutes les décisions prises lors des réunions de janvier"), on peut d'abord traiter chaque chunk individuellement (map), puis synthétiser les résultats partiels (reduce). C'est plus coûteux en appels LLM mais permet de traiter des corpus qui dépassent largement la fenêtre de contexte.

---

> **Article suivant** : [Orchestration de génération : assembler le puzzle]({{< ref "/posts/concevoir-un-assistant-documentaire-rag-generation" >}})
