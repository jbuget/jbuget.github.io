---
title: "Architecture RAG (3/4) — Orchestration de génération : assembler le puzzle"
categories: ["intelligence artificielle"]
keywords:
- RAG
- génération
- prompt système
- hallucination
- guardrails
- LLM
- injection de contexte
- citation
- NeMo Guardrails
date: 2026-02-16T08:00:00+01:00
draft: true
toc: true
slug: concevoir-un-assistant-documentaire-rag-generation
summary: "La génération dans un système RAG, ce n'est pas un simple chatCompletion(). C'est une orchestration précise du contexte, des instructions et des garde-fous."
description: "Prompt système, injection du contexte documentaire, garde-fous contre les hallucinations et stratégies de mitigation : guide complet de l'orchestration de génération pour un assistant RAG."
---

> Cet article fait partie de la série **[Concevoir un assistant documentaire : retour d'expérience sur l'architecture RAG]({{< ref "/posts/concevoir-un-assistant-documentaire-rag" >}})**. Il en constitue la troisième partie, après [Retrieval]({{< ref "/posts/concevoir-un-assistant-documentaire-rag-retrieval" >}}).

La génération, ce n'est pas un simple `chatCompletion()`. C'est une orchestration précise du contexte, des instructions et des contraintes.

## 1. Le prompt système

L'assistant fonctionne sur la base d'un prompt système (aussi appelé *system prompt*) qui définit son comportement, sa personnalité et ses garde-fous. C'est la "colonne vertébrale" de l'agent. Ce prompt vient s'ajouter au prompt administrateur de la plateforme sur laquelle tourne le LLM (OpenAI, Anthropic, etc.) et n'est pas visible par l'utilisateur final.

Typiquement, on y définit :
- Le rôle et le périmètre de l'assistant (*"Vous êtes un assistant expert en droit du travail, spécialisé dans la convention collective Syntec"*).
- L'obligation de s'appuyer uniquement sur les documents fournis en contexte.
- L'interdiction d'inventer des informations (hallucination).
- Le format attendu des réponses (structuré, avec citation des sources).
- La conduite à tenir en cas d'information manquante (*"Si la réponse n'est pas dans les documents, dites-le clairement"*).
- Les limites du rôle (*"Vous n'êtes pas un conseiller juridique. Orientez l'utilisateur vers le service compétent pour toute question engageant une responsabilité."*).

### Les problématiques du prompt système

- **Le prompt drift** : au fil du temps, les ajouts et modifications successifs rendent le prompt incohérent ou contradictoire. Il finit par ressembler à un document de spécifications mal maintenu. Il est important de le versionner et de le tester comme du code.
- **L'injection de prompt** (*prompt injection*) : un utilisateur malveillant ou un document piégé peut tenter de détourner le comportement de l'assistant en injectant des instructions dans sa question ou dans le contenu d'un document indexé (*indirect prompt injection*). Les parades incluent le sandboxing du contexte documentaire, la validation des entrées, et des instructions explicites dans le prompt système pour ignorer les instructions contenues dans les documents.
- **L'équilibre entre rigidité et flexibilité** : un prompt trop contraignant produit un assistant qui refuse de répondre à des questions légitimes. Un prompt trop lâche produit un assistant qui hallucine ou sort de son périmètre. Trouver le bon dosage demande des itérations avec des utilisateurs réels.
- **La cohérence multi-tours** : dans une conversation longue, le prompt système peut être "oublié" ou dilué par le contexte accumulé. Certaines architectures réinjectent périodiquement les instructions clés pour maintenir le comportement attendu.

Sur Raggae, chaque "projet" (c'est-à-dire chaque agent) dispose de son propre prompt système, configurable par le créateur.

## 2. Injection du contexte documentaire

Les chunks récupérés lors du retrieval sont injectés dans le prompt, numérotés et enrichis de métadonnées (source, date, auteur). C'est ce contexte qui permet au LLM de répondre de façon ancrée dans les données réelles, plutôt que de puiser dans ses connaissances génériques.

### Les choix de conception

- **Le format d'injection** : comment structurer les chunks dans le prompt ? On peut les injecter en texte brut, en Markdown, en XML, ou dans un format structuré avec des délimiteurs explicites (`[Source: document.pdf, page 12]`). Le format influence la capacité du LLM à citer ses sources correctement. En pratique, un balisage clair avec des identifiants numérotés (`[1]`, `[2]`, etc.) fonctionne bien pour permettre des citations traçables.
- **La position dans le prompt** : injecter le contexte avant la question de l'utilisateur ou après ? Avant la question (dans le system prompt ou en début de message) permet au LLM de "lire" les documents avant de découvrir la question. Après la question, le modèle sait ce qu'il cherche et peut être plus sélectif. Les deux approches ont leurs partisans ; en pratique, l'injecter dans le message utilisateur avec la question à la fin est le pattern le plus courant.
- **La séparation contexte/connaissances** : faut-il interdire au LLM d'utiliser ses connaissances pré-entraînées, ou l'autoriser à compléter quand le contexte est insuffisant ? Pour un assistant juridique ou RH, on veut un ancrage strict dans les documents. Pour un assistant technique plus généraliste, un peu de connaissance externe peut enrichir la réponse. C'est un curseur à régler selon le cas d'usage.

Dans les systèmes plus complexes, une étape de compression contextuelle permet de réduire la taille totale des chunks sans perdre l'information essentielle. Des techniques comme *LongLLMLingua* ou la compression extractive (on ne garde que les phrases les plus pertinentes de chaque chunk) permettent de diviser la consommation de tokens par 2 à 5 tout en conservant l'essentiel de l'information. C'est un levier d'optimisation important quand le corpus grandit.

## 3. Génération et garde-fous

Le LLM produit alors une synthèse probabiliste du contexte fourni. Les risques sont multiples et bien documentés.

### Les risques de la génération

- **L'hallucination factuelle** : le modèle invente une information absente du contexte. C'est le risque le plus connu. Exemple : l'assistant affirme que "le télétravail est limité à 2 jours par semaine" alors que le document dit "3 jours". Ça peut arriver même avec un bon contexte, parce que le modèle "lisse" ou "interprète" les informations.
- **La sur-interprétation** : le modèle déduit quelque chose qui n'est pas explicitement dit. "Le document mentionne un bonus de performance" → "Vous avez droit à un bonus de performance". La nuance entre information et conseil est cruciale, surtout dans des contextes juridiques ou RH.
- **La fabrication de sources** : le modèle cite un document qui n'existe pas, ou attribue une information au mauvais document. C'est particulièrement insidieux parce que la réponse a l'air sourcée et crédible.
- **L'incohérence entre réponses** : sur une même question posée deux fois, le modèle peut donner des réponses différentes (nature probabiliste). C'est déconcertant pour les utilisateurs et problématique pour la fiabilité perçue. Baisser la température aide, mais ne garantit pas la reproductibilité.
- **Le refus excessif** : à l'inverse, un prompt trop restrictif pousse le modèle à répondre "je ne trouve pas l'information dans les documents" alors que l'information est bien présente, juste formulée différemment.

### Les stratégies de mitigation

- **La citation obligatoire** : exiger dans le prompt que chaque affirmation soit accompagnée d'une référence au chunk source (`[1]`, `[2]`…). Cela force le modèle à ancrer sa réponse et facilite la vérification par l'utilisateur.
- **La vérification par un second modèle** (*LLM-as-judge*) : un second LLM (ou le même, dans un second appel) vérifie que chaque affirmation de la réponse est effectivement soutenue par le contexte fourni. Coûteux mais efficace sur les cas sensibles.
- **La validation déterministe** : une logique programmatique qui vérifie que les identifiants de source cités dans la réponse correspondent bien à des chunks réellement injectés, et que les citations textuelles sont fidèles aux passages originaux.
- **Le contrôle de température** : une température basse (0.0 à 0.3) réduit la créativité du modèle et donc le risque d'hallucination, au prix d'une moindre fluidité stylistique.
- **Le streaming avec feedback** : afficher les sources utilisées en parallèle de la réponse (comme le fait Perplexity) permet à l'utilisateur de vérifier en temps réel.
- **Les garde-fous de contenu** (*guardrails*) : des filtres en sortie qui détectent et bloquent les réponses potentiellement dangereuses (conseils médicaux, juridiques, financiers non qualifiés). Des outils comme NeMo Guardrails (NVIDIA) ou Guardrails AI permettent de définir ces règles de façon déclarative.

---

> **Article suivant** : [Considérations pour la production]({{< ref "/posts/concevoir-un-assistant-documentaire-rag-production" >}})
