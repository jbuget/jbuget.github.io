---
title: "Concevoir un assistant documentaire : retour d'expérience sur l'architecture RAG"
categories: ["intelligence artificielle"]
keywords:
- RAG
- retrieval-augmented generation
- assistant documentaire
- LLM
- embeddings
- pgvector
- chunking
- recherche sémantique
- architecture
- IA
date: 2026-02-16T08:00:00+01:00
draft: true
toc: true
slug: concevoir-un-assistant-documentaire-retour-d-experience-sur-l-architecture-rag
summary: "Un assistant documentaire, ce n'est pas un wrapper autour d'un LLM. C'est un système d'information complet. Retour d'expérience sur l'architecture RAG, de l'ingestion au retrieval."
description: "Retour d'expérience concret sur la conception d'une plateforme d'assistants documentaires RAG : pipeline d'ingestion, chunking, embeddings, retrieval hybride, reranking et orchestration de génération."
---

Ces derniers mois, j'ai travaillé sur la conception d'une plateforme permettant de créer des assistants documentaires basés sur du RAG (Retrieval-Augmented Generation), dont le but est d'être utilisée sur de vrais problèmes métier.

Parmi les cas d'usage concrets qui motivent ce projet, prenons l'exemple d'un **assistant RH** : les collaborateurs d'une organisation pourraient poser des questions en langage naturel sur les congés, le télétravail, la mutuelle ou la convention collective, sans déranger systématiquement le service RH ni fouiller dans un intranet labyrinthique. On téléverserait l'ensemble des documents internes (règlement intérieur, accords d'entreprise, notes de service, FAQ) et l'agent répondrait en citant ses sources.

Autre exemple : un **assistant de suivi de projet**, par exemple dans le cadre d'une migration d'ERP. Des dizaines de réunions produisent des heures de comptes rendus et de transcriptions. L'enjeu : pouvoir interroger cette masse d'information a posteriori, avec des questions aussi précises que *"Quelles sont les actions à mener pour la réunion du 20 mai sur la reprise des données comptables ?"*. Au lieu de relire 200 pages de notes, on pose la question à l'agent, et il va chercher la réponse dans les bons documents.

Travailler sur ces cas d'usage m'a appris (et continue de m'apprendre) énormément de choses, notamment : **un assistant documentaire n'est pas qu'un wrapper autour d'un LLM.** C'est un système d'information complet, avec ses propres contraintes d'architecture, d'ingestion, de recherche et de génération. C'est ce que je me propose de détailler dans cette série d'articles.

> Le code source du projet qui accompagne cette série est disponible sur GitHub : [jbuget/raggae](https://github.com/jbuget/raggae). RAGGAE est une plateforme open source pour créer des agents conversationnels RAG, de l'ingestion documentaire au chat contextuel multi-LLM.


## Ce qu'on construit réellement

Avant de plonger dans la technique, posons le cadre. Un assistant documentaire intelligent, c'est un système qui prend en entrée une question formulée en langage naturel par un utilisateur, va chercher les passages les plus pertinents dans un corpus de documents préalablement indexés, et génère une réponse synthétique en s'appuyant exclusivement (ou presque) sur ces passages.

Dit autrement, le LLM ne "sait" rien de votre corpus. Il ne fait que synthétiser ce qu'on lui donne à lire au moment de la requête. Toute la valeur du système réside dans la qualité de ce qu'on lui fournit comme contexte.

On peut découper l'architecture en trois grands blocs :

1. **Le pipeline d'ingestion et d'indexation** : comment préparer et stocker les documents.
2. **Le mécanisme de retrieval** : comment retrouver les bons passages lors d'une question.
3. **L'orchestration de génération** : comment assembler le tout pour produire une réponse fiable.

Chaque bloc a ses propres défis. Et les erreurs les plus coûteuses se font généralement dans le premier.


## Sommaire de la série

1. **[Pipeline d'ingestion : là où tout se joue]({{< ref "/posts/concevoir-un-assistant-documentaire-rag-ingestion" >}})** — Collecte, normalisation, chunking, embeddings et indexation. C'est l'étape la plus sous-estimée et pourtant la plus déterminante.

2. **[Retrieval : trouver les bons passages]({{< ref "/posts/concevoir-un-assistant-documentaire-rag-retrieval" >}})** — Reformulation de requête, recherche hybride, reranking et sélection du contexte. Le cœur du système.

3. **[Orchestration de génération : assembler le puzzle]({{< ref "/posts/concevoir-un-assistant-documentaire-rag-generation" >}})** — Prompt système, injection du contexte documentaire, garde-fous et stratégies de mitigation des hallucinations.

4. **[Considérations pour la production]({{< ref "/posts/concevoir-un-assistant-documentaire-rag-production" >}})** — Permissions, confidentialité, coûts, observabilité et amélioration continue. Les sujets qu'on sous-estime toujours.


## Ce que j'en retiens

Concevoir un assistant documentaire, c'est un problème d'architecture logicielle à part entière. Le LLM n'est qu'une brique parmi d'autres — et probablement pas celle qui demande le plus de travail.

La qualité perçue par l'utilisateur final est l'émergence de décisions prises bien en amont : comment on découpe les documents, comment on indexe, comment on cherche, comment on assemble le contexte. C'est ce qui distingue une démo impressionnante lors d'un comité de direction d'un outil réellement utilisé au quotidien par des équipes.

Si le sujet vous intéresse et que vous voulez explorer le code, le projet [Raggae](https://github.com/jbuget/raggae) est open source. C'est une plateforme conçue pour créer, gérer et publier des agents conversationnels RAG, de l'ingestion documentaire au chat contextuel. Elle est construite en Python (FastAPI) + PostgreSQL/pgvector côté back, Next.js côté front, en Clean Architecture avec du TDD strict.

Et si vous avez des questions ou des retours d'expérience à partager, n'hésitez pas — c'est un sujet sur lequel on apprend beaucoup en confrontant les approches.
