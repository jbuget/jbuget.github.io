---
title: "Architecture RAG (4/4) — Considérations pour la production"
categories: ["intelligence artificielle"]
keywords:
- RAG
- production
- permissions
- confidentialité
- coûts
- observabilité
- RAGAS
- Langfuse
- amélioration continue
- RGPD
date: 2026-02-16T08:00:00+01:00
draft: true
toc: true
slug: concevoir-un-assistant-documentaire-rag-production
summary: "Permissions, confidentialité, coûts, observabilité et amélioration continue : les sujets qu'on sous-estime toujours quand on met un système RAG en production."
description: "Contrôle d'accès, conformité RGPD, décomposition des coûts, observabilité avec Langfuse et LangSmith, évaluation automatisée avec RAGAS : guide des considérations de production pour un assistant RAG."
---

> Cet article fait partie de la série **[Concevoir un assistant documentaire : retour d'expérience sur l'architecture RAG]({{< ref "/posts/concevoir-un-assistant-documentaire-rag" >}})**. Il en constitue la quatrième et dernière partie, après [Orchestration de génération]({{< ref "/posts/concevoir-un-assistant-documentaire-rag-generation" >}}).

Les trois articles précédents couvrent les aspects techniques du pipeline RAG : ingestion, retrieval, génération. Mais mettre un assistant documentaire en production, c'est aussi — et surtout — gérer des sujets qu'on sous-estime systématiquement lors du prototypage.

## 1. Permissions et confidentialité

Dans un assistant RH, certains documents sont réservés aux managers (grilles salariales, plans de restructuration, dossiers disciplinaires). On ne peut pas se contenter de filtrer après la génération : le filtrage doit intervenir **avant** le retrieval, sinon le LLM a accès à des informations qu'il ne devrait pas voir et peut les laisser fuiter dans sa réponse, même indirectement. C'est un sujet d'architecture, pas de prompt engineering.

### Les niveaux de contrôle d'accès

- **Le filtrage au niveau du corpus** (*tenant isolation*) : chaque organisation ou équipe dispose de son propre espace documentaire, totalement isolé. C'est le plus simple à implémenter et le plus sûr. C'est l'approche retenue dans Raggae (chaque "projet" a son propre corpus).
- **Le filtrage au niveau du document** : chaque document porte des métadonnées d'accès (rôle requis, groupe, département). Lors du retrieval, on ajoute un filtre SQL ou un filtre de métadonnées pour ne remonter que les documents auxquels l'utilisateur a accès. Ça nécessite une gestion propre des ACL et une synchronisation avec le système d'identité de l'organisation.
- **Le filtrage au niveau du chunk** : plus granulaire mais plus complexe. Un même document peut contenir des sections à des niveaux de confidentialité différents (un rapport annuel avec une section "résultats financiers" réservée au comité de direction). Ça demande un enrichissement fin des métadonnées au moment du chunking.

### Les risques spécifiques

- **La fuite indirecte** (*information leakage*) : même sans citer explicitement un document confidentiel, le LLM peut laisser transpirer des informations dans sa réponse si elles étaient présentes dans le contexte. Par exemple, "les conditions de rémunération des cadres dirigeants" pourraient influencer une réponse sur les grilles salariales, même si l'utilisateur n'a pas accès au document source.
- **L'inférence par recoupement** : un utilisateur astucieux peut poser des questions orientées pour reconstituer des informations auxquelles il n'a pas accès ("Est-ce que le budget de la direction commerciale dépasse X ?" → réponse oui/non qui fuit de l'information).
- **La conformité réglementaire** : RGPD, données de santé, secret professionnel — selon le domaine, les exigences de confidentialité peuvent imposer des contraintes techniques fortes (chiffrement des embeddings, hébergement souverain, droit à l'oubli avec suppression des vecteurs associés).

## 2. Coûts

Génération d'embeddings, requêtes vectorielles, reranking, appels LLM — tout a un coût marginal. Sur un assistant avec 50 utilisateurs quotidiens et un corpus de 2 000 documents, ça reste très raisonnable. Mais ça peut vite chiffrer si on ne fait pas attention.

### Décomposition des coûts

- **Ingestion** : le coût initial de génération des embeddings est ponctuel mais non négligeable sur un gros corpus. Avec `text-embedding-3-large` d'OpenAI, compter environ 0,13 $ pour 1 million de tokens. Un corpus de 10 000 pages (~5 millions de tokens) coûte donc moins d'un dollar à indexer. Le coût explose si on réindexe fréquemment ou si on utilise un modèle d'embedding plus coûteux.
- **Retrieval** : la recherche vectorielle elle-même est peu coûteuse (requête sur index en mémoire). Le reranking via API ajoute un coût par requête (quelques centimes chez Cohere pour un lot de 100 passages).
- **Génération** : c'est le poste le plus lourd. Un appel à GPT-4o avec 4 000 tokens de contexte et 500 tokens de réponse coûte environ 0,02-0,03 $. Avec 50 utilisateurs faisant chacun 10 requêtes par jour, on arrive à ~15-30 $/jour. Passer à un modèle plus petit (GPT-4o-mini, Claude Haiku) divise la facture par 10-20 avec une qualité souvent suffisante.
- **Infrastructure** : hébergement de la base vectorielle, du backend, du frontend. Avec PostgreSQL + pgvector sur un serveur modeste, les coûts d'infrastructure restent faibles. Une base vectorielle managée (Pinecone) coûte davantage.

### Leviers d'optimisation

La mise en cache des réponses (pour les questions fréquentes), la limitation du top-K, le choix d'un modèle de génération adapté (pas besoin d'un GPT-4o pour une FAQ simple), la compression contextuelle et la mutualisation des requêtes d'embedding (batching) deviennent rapidement des leviers essentiels. Sur certains projets, un cache sémantique (qui détecte que deux questions formulées différemment sont en fait identiques) peut réduire les coûts de 30 à 50 %.

## 3. Amélioration continue

Un système RAG n'est jamais "terminé". Les premières semaines après la mise en production sont les plus instructives : on découvre les questions sans réponse, les chunks mal découpés, les prompts trop lâches.

### L'observabilité

L'observabilité est indispensable pour piloter l'amélioration continue. Les métriques clés à suivre :

- **Le taux de "je ne sais pas"** : si l'assistant refuse de répondre à plus de 20-30 % des questions, c'est que le corpus est lacunaire ou que le retrieval ne fonctionne pas bien.
- **La latence** : temps de réponse total (retrieval + génération). Au-delà de 5-10 secondes, l'expérience utilisateur se dégrade significativement.
- **Le feedback utilisateur** : pouces en l'air/en bas, commentaires libres. C'est la métrique la plus directe mais la plus difficile à obtenir en volume suffisant.
- **Les requêtes sans résultat de retrieval** : des questions pour lesquelles aucun chunk pertinent n'est remonté — signal fort d'un trou dans le corpus.
- **Les logs de requêtes et de contexte** : permettent de rejouer des cas problématiques et d'itérer sur le chunking, le retrieval ou le prompt.

Des outils comme **LangSmith** (LangChain), **Langfuse** (open source), **Arize Phoenix** ou **Traceloop OpenLLMetry** permettent de tracer l'ensemble du pipeline (requête → reformulation → retrieval → chunks sélectionnés → prompt assemblé → réponse) et de diagnostiquer les points de défaillance.

### L'évaluation automatisée

Pour aller au-delà du feedback manuel, on peut mettre en place une évaluation automatisée avec des frameworks comme **RAGAS** (qui mesure la fidélité, la pertinence du contexte, la pertinence de la réponse) ou des jeux de tests question/réponse annotés manuellement. Ces benchmarks permettent de mesurer objectivement l'impact d'un changement (nouveau modèle d'embedding, modification du chunking, ajustement du prompt) avant de le déployer en production.

Sur un corpus de transcriptions de réunion, on peut s'attendre à itérer plusieurs fois sur le chunking avant de trouver le bon compromis. Sur un assistant RH, c'est le prompt système qui nécessite le plus d'ajustements, surtout pour gérer les cas limites (*"Est-ce que j'ai le droit de…"* → l'assistant ne doit pas donner de conseil juridique). La plateforme doit faciliter ces itérations en rendant chaque composant — chunking, retrieval, prompt — facilement ajustable et mesurable.

---

> **Retour au sommaire** : [Concevoir un assistant documentaire : retour d'expérience sur l'architecture RAG]({{< ref "/posts/concevoir-un-assistant-documentaire-rag" >}})
