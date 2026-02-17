---
title: "Architecture RAG (1/4) — Pipeline d'ingestion : là où tout se joue"
categories: ["intelligence artificielle"]
keywords:
- RAG
- ingestion
- chunking
- embeddings
- pgvector
- normalisation
- parsing
- métadonnées
- Docling
- LlamaIndex
date: 2026-02-16T08:00:00+01:00
draft: true
toc: true
slug: concevoir-un-assistant-documentaire-rag-ingestion
summary: "Le pipeline d'ingestion est l'étape la plus sous-estimée d'un système RAG — et pourtant la plus déterminante. Collecte, normalisation, chunking, embeddings : tout se joue ici."
description: "Collecte et normalisation des sources, stratégies de chunking, modèles d'embedding, stockage vectoriel : guide complet du pipeline d'ingestion pour un assistant documentaire RAG."
---

> Cet article fait partie de la série **[Concevoir un assistant documentaire : retour d'expérience sur l'architecture RAG]({{< ref "/posts/concevoir-un-assistant-documentaire-rag" >}})**. Il en constitue la première partie.

La première fois que j'ai monté un pipeline RAG, j'ai sous-estimé cette étape. Je me suis dit : "on prend les docs, on les découpe, on vectorise, et c'est parti." En pratique, c'est là que se concentre l'essentiel de la complexité, et surtout l'essentiel de l'impact sur la qualité finale des réponses.

## 1. Collecter et normaliser les sources

Un assistant documentaire agrège des formats hétérogènes : PDF, pages HTML, exports de wiki, fichier TXT ou Markdown versionné, comptes rendus de réunion, parfois même des transcriptions audio. La première question à se poser, c'est celle de la synchronisation. Pour un assistant de suivi de projet, les transcriptions de réunion arrivent au fil de l'eau : il faut une ingestion incrémentale, pas un batch nocturne. Pour un assistant RH, les documents évoluent peu et un rechargement périodique suffit. La plateforme doit supporter les deux modes.

### Les problématiques de collecte

Les formats d'entrée posent chacun des difficultés spécifiques :

- **Les PDF** sont le cauchemar récurrent. Un PDF "texte" (généré depuis Word ou LaTeX) est relativement simple à parser. Un PDF "image" (scan d'un document papier) nécessite de l'OCR, avec toutes les erreurs que ça implique : caractères mal reconnus, tableaux déstructurés, colonnes mélangées. Les PDF à mise en page complexe — multi-colonnes, encadrés, notes de bas de page — posent aussi des problèmes de reconstruction de l'ordre de lecture.
- **Le HTML** demande un nettoyage agressif : menus de navigation, headers et footers répétitifs, publicités, scripts, barres latérales. Il faut extraire le contenu "utile" sans perdre la structure sémantique (titres, listes, tableaux).
- **Les documents Office** (Word, Excel, PowerPoint) requièrent des parseurs dédiés qui savent interpréter les styles, les tableaux imbriqués, les commentaires et les révisions.
- **Les transcriptions audio** (issues de Whisper, Azure Speech, etc.) arrivent souvent sans ponctuation fiable, avec des erreurs de reconnaissance sur les noms propres et les termes techniques, et sans structure de paragraphes.
- **Les exports de wiki ou de Confluence** mélangent Markdown, HTML et macros propriétaires qu'il faut nettoyer.

Côté outils, l'écosystème s'est enrichi ces derniers mois. On trouve des solutions comme **[Unstructured.io](https://github.com/Unstructured-IO/unstructured)** (open source, multi-format, bon sur les PDF complexes), **Docling** (IBM, spécialisé dans le parsing de documents académiques et techniques), **LlamaParse** (du même éditeur que LlamaIndex, en mode API), ou **Apache Tika** (le vétéran, robuste mais moins fin sur les structures). Le choix dépend du compromis entre précision d'extraction, formats supportés et contraintes de déploiement (certaines solutions sont cloud-only).

### Normalisation et structure

Extraire du texte brut ne suffit pas. La structure logique d'un document — la hiérarchie des titres, les sections, les tableaux — porte une information sémantique essentielle. Si on la perd, le système de retrieval devient moins discriminant. Un bon pipeline de normalisation doit préserver les frontières sémantiques tout en éliminant le bruit (menus HTML, en-têtes répétitifs, artefacts d'OCR).

Plusieurs problématiques se posent à cette étape :

- **La détection de doublons** : un même document peut exister en plusieurs versions, dans plusieurs formats, à plusieurs emplacements. Sans déduplication, on pollue l'index et on risque de remonter des informations contradictoires (une version obsolète à côté de la version à jour).
- **La gestion des versions** : dans un contexte où les documents évoluent (accords d'entreprise révisés, procédures mises à jour), il faut décider si on conserve l'historique ou si on ne garde que la dernière version. Et si on conserve l'historique, comment le signaler au retrieval pour éviter de remonter une information périmée.
- **L'encodage et les caractères spéciaux** : ça peut paraître trivial, mais entre l'UTF-8, le Latin-1, les caractères accentués mal convertis et les caractères spéciaux issus de l'OCR, on passe facilement des heures de débogage.
- **Les images et schémas** : un diagramme dans un document PDF ou une capture d'écran dans un compte rendu ne sont pas indexables en l'état. On peut les ignorer, les décrire manuellement, ou utiliser un modèle multimodal pour en générer une description textuelle — chaque approche a son coût et ses limites.

### Les outils de normalisation

L'écosystème des parseurs de documents s'est considérablement structuré. Voici les principales solutions, par catégorie.

**Solutions open source :**

- **[Docling](https://github.com/docling-project/docling)** (IBM, licence MIT) : c'est aujourd'hui l'un des meilleurs choix open source. Docling utilise des modèles d'IA spécialisés pour l'analyse de mise en page (DocLayNet) et la reconnaissance de structure de tableaux (TableFormer). Il supporte PDF, DOCX, PPTX, HTML, images et audio, inclut l'OCR pour les documents scannés, et produit des sorties structurées (Markdown, JSON). Il s'intègre nativement avec LangChain, LlamaIndex et Haystack. Les benchmarks lui donnent environ 94-98 % de précision sur l'extraction de tableaux complexes. Il tourne en local, sans dépendance cloud.
- **[Marker](https://github.com/VikParuchuri/marker)** : développé par Vik Paruchuri, Marker est spécialisé dans la conversion de PDF en Markdown structuré. Il combine PyMuPDF et Tesseract pour l'OCR, avec une accélération GPU optionnelle via Surya. C'est un outil léger et efficace, particulièrement adapté au traitement offline de gros volumes de PDF. Moins polyvalent que Docling sur les formats d'entrée, mais excellent sur son créneau.
- **[Unstructured.io](https://github.com/Unstructured-IO/unstructured)** (open source + offre cloud) : historiquement la référence dans l'écosystème RAG, Unstructured propose des parseurs pour une large gamme de formats (PDF, DOCX, HTML, emails, images…). La version open source reste fonctionnelle, mais la qualité d'extraction a été critiquée récemment sur certains benchmarks par rapport aux alternatives plus récentes. L'offre cloud (payante) ajoute des modèles plus performants et une API managée.
- **[Apache Tika](https://tika.apache.org/)** : le vétéran (projet Apache, écosystème Java). Tika détecte et extrait le contenu de plus de 1 000 types de fichiers. Robuste et éprouvé en entreprise, mais moins fin que les solutions récentes sur la préservation de la structure sémantique (hiérarchie de titres, structure de tableaux). Reste un excellent choix pour l'extraction de métadonnées et la détection de types MIME.

**Solutions cloud / payantes :**

- **[LlamaParse](https://docs.cloud.llamaindex.ai/llamaparse/getting_started)** (LlamaIndex) : un service cloud conçu spécifiquement pour produire des sorties "LLM-ready" à partir de documents complexes (tableaux, graphiques, diagrammes). La v2 propose plusieurs modes : un parsing sans IA (1 crédit/page), un mode économique (3 crédits/page) et un mode agentique avec des modèles avancés (jusqu'à 90 crédits/page). Excellente préservation structurelle et intégration native avec LlamaIndex. Un plan gratuit avec des crédits offerts permet de tester. Idéal si on utilise déjà l'écosystème LlamaIndex.
- **[Reducto](https://reducto.ai/)** : un service d'ingestion documentaire qui utilise un pipeline hybride (vision par ordinateur + OCR + VLM + correction agentique) pour préserver finement la structure des documents. Particulièrement performant sur les documents d'entreprise complexes (rapports financiers, contrats, formulaires). 15 000 crédits gratuits pour démarrer, puis facturation à l'usage. Reconnu pour la qualité de ses sorties structurées et son système de correction automatique des erreurs d'extraction.

### Enrichissement en métadonnées

L'enrichissement en métadonnées est stratégique dès cette étape. Ces métadonnées serviront plus tard au filtrage, au scoring et au contrôle d'accès lors du retrieval. Sans elles, on se retrouve avec un index "plat" où tous les chunks se valent — impossible de filtrer par date, par source, par périmètre métier ou par niveau de confidentialité.

On distingue trois catégories de métadonnées, par ordre croissant de complexité d'extraction.

**Les métadonnées techniques** sont les plus simples à obtenir : nom de fichier, chemin, taille, date de création et de modification, type MIME, encodage. Elles viennent du système de fichiers ou du serveur qui héberge les documents. [Apache Tika](https://tika.apache.org/) excelle dans ce domaine : il extrait automatiquement les métadonnées embarquées de plus d'un millier de formats (auteur d'un PDF, champs `<meta>` d'une page HTML, propriétés d'un fichier DOCX, données EXIF d'une image). En Python, la librairie [python-magic](https://github.com/ahupp/python-magic) (basée sur libmagic) permet une détection fiable du type MIME, et le module standard `os.stat` donne les dates système.

**Les métadonnées linguistiques et structurelles** demandent un traitement NLP. On y trouve :

- **La détection de langue** : indispensable sur un corpus multilingue pour aiguiller vers le bon modèle d'embedding ou le bon analyseur full-text. Des librairies comme [langdetect](https://github.com/Mimino666/langdetect) (port Python de la librairie de Google), [langid](https://github.com/saffsd/langid.py) ou [FastText](https://fasttext.cc/docs/en/language-identification.html) (Meta) offrent une détection fiable dès quelques phrases. Pour des cas plus exigeants (textes courts, code-switching), [LangExtract](https://github.com/AurelienMusic/langextract) (Google, basé sur Gemini) pousse la détection plus loin.
- **L'extraction d'entités nommées** (*NER*) : personnes, organisations, lieux, dates, montants, identifiants. C'est essentiel pour enrichir les chunks avec des informations factuelles structurées. [spaCy](https://spacy.io/) est la référence open source en NLP industriel : ses modèles pré-entraînés couvrent le français (`fr_core_news_lg`), et le package [spacy-llm](https://github.com/explosion/spacy-llm) permet de combiner NER classique et extraction par LLM sans données d'entraînement. Pour des besoins plus simples, [NLTK](https://www.nltk.org/) ou les pipelines NER de [Hugging Face Transformers](https://huggingface.co/docs/transformers/task_summary#named-entity-recognition) font le travail.
- **L'extraction de mots-clés et de thématiques** : des algorithmes comme TF-IDF, RAKE ou [KeyBERT](https://github.com/MaartenGr/KeyBERT) (basé sur des embeddings BERT) permettent d'extraire automatiquement les termes clés d'un chunk. Pour la classification thématique, un LLM rapide (GPT-4o-mini, Claude Haiku) avec un prompt de catégorisation fonctionne très bien.

**Les métadonnées sémantiques enrichies par LLM** constituent la couche la plus sophistiquée. L'idée : utiliser un LLM pour générer des métadonnées de haut niveau que ni l'extraction technique ni le NLP classique ne peuvent produire.

- **Le résumé automatique** : chaque document (ou chaque chunk) se voit attribuer un résumé de quelques phrases. Ce résumé peut servir de signal supplémentaire lors du retrieval, ou être présenté à l'utilisateur dans les résultats.
- **Les questions potentielles** : on demande au LLM *"Quelles questions un utilisateur pourrait-il poser auxquelles ce passage répond ?"*. Ces questions synthétiques sont indexées aux côtés du chunk et améliorent le rappel en créant des "ponts" entre la formulation de l'utilisateur et le contenu du document.
- **Le contextual retrieval** : technique [proposée par Anthropic](https://www.anthropic.com/news/contextual-retrieval), elle consiste à générer pour chaque chunk un court paragraphe de contexte qui le situe dans le document global (*"Ce passage fait partie de la section 'Congés payés' de l'accord d'entreprise 2024. Il traite des cas particuliers pour les cadres."*). Ce contexte est préfixé au chunk avant l'embedding. Selon les benchmarks d'Anthropic, cette technique réduit les erreurs de retrieval de 49 à 67 %. C'est l'un des meilleurs rapports effort/impact que j'ai observés.

**Côté frameworks**, les trois grands de l'écosystème RAG proposent chacun des mécanismes d'enrichissement de métadonnées par LLM, avec des philosophies différentes :

- **[LlamaIndex](https://docs.llamaindex.ai/en/stable/module_guides/indexing/metadata_extraction/)** offre l'approche la plus intégrée et la plus simple à mettre en place. Son module `Metadata Extraction` fournit des extracteurs prêts à l'emploi qu'on assemble dans un pipeline d'ingestion : `TitleExtractor` (infère le titre du document), `SummaryExtractor` (génère un résumé par chunk, avec possibilité d'inclure le résumé du chunk précédent pour la continuité), `QuestionsAnsweredExtractor` (génère les questions auxquelles le chunk peut répondre — très utile pour améliorer le rappel), `KeywordExtractor` (extrait les mots-clés) et `EntityExtractor` (extraction d'entités nommées). Tous ces extracteurs s'enchaînent via l'`IngestionPipeline` et injectent automatiquement les métadonnées dans chaque nœud avant l'indexation. C'est la solution la plus "batteries included".
- **[LangChain](https://python.langchain.com/docs/integrations/document_transformers/openai_metadata_tagger/)** propose le `create_metadata_tagger`, un document transformer qui utilise les *function calls* d'OpenAI pour extraire des métadonnées structurées selon un schéma JSON ou Pydantic défini par le développeur. L'approche est plus flexible (on définit exactement les champs qu'on veut extraire) mais plus manuelle : il faut construire son schéma, et le transformer fonctionne mieux sur des documents complets (avant le chunking). Côté JavaScript/TypeScript, l'équivalent `createMetadataTaggerFromZod` utilise des schémas Zod.
- **[Haystack](https://haystack.deepset.ai/cookbook/metadata_enrichment)** (deepset) propose un pattern d'enrichissement via un composant `MetadataEnricher` couplé aux sorties structurées d'un LLM (schéma Pydantic). L'approche est modulaire et s'intègre dans le système de pipelines Haystack. Elle est particulièrement adaptée aux pipelines de production où chaque étape (fetch, parse, enrich, split, embed) est un composant indépendant et testable.

Un point important : chaque couche d'enrichissement a un coût (en temps de calcul, en appels API, en risque d'erreur). Sur un corpus de quelques centaines de documents, on peut se permettre un enrichissement riche par LLM. Sur un corpus de dizaines de milliers de documents, il faut être sélectif et réserver les enrichissements coûteux aux métadonnées qui ont un impact mesuré sur la qualité du retrieval.

## 2. Découper en chunks

Un LLM a une fenêtre de contexte limitée. On ne peut pas lui envoyer 500 pages d'un coup. Il faut donc découper le corpus en unités cohérentes — des *chunks*. C'est une décision structurante qui impacte toute la chaîne en aval.

Un chunk trop court et on perd le contexte. Un chunk trop long et on dilue l'information pertinente dans du bruit, tout en consommant inutilement des tokens.

### Les stratégies de découpage

Il existe toute une typologie de stratégies, par ordre croissant de sophistication :

- **Découpage à taille fixe** (*fixed-size chunking*) : on coupe tous les N caractères ou N tokens, avec éventuellement un chevauchement (*overlap*) entre chunks adjacents. C'est le plus simple à implémenter, mais le plus brutal : il coupe aveuglément au milieu des phrases, des paragraphes, voire des tableaux. Adapté pour un prototype ou un corpus très homogène.
- **Découpage par séparateurs** (*recursive character splitting*) : on tente de couper d'abord sur les doubles sauts de ligne, puis les simples sauts de ligne, puis les phrases, puis les mots. C'est l'approche par défaut dans LangChain. Elle offre un bon compromis entre simplicité et respect de la structure textuelle.
- **Découpage structurel** (*document-structure-aware*) : on s'appuie sur la structure logique du document — titres, sous-titres, sections, paragraphes — pour créer des chunks qui respectent les frontières sémantiques naturelles. Très efficace sur des documents bien structurés (accords d'entreprise, documentation technique), beaucoup moins sur des transcriptions orales.
- **Découpage sémantique** (*semantic chunking*) : on utilise les embeddings pour détecter les ruptures de sens entre phrases ou paragraphes consécutifs, et on coupe là où la similarité sémantique chute. Plus coûteux à calculer, mais pertinent quand la structure du document est faible ou absente.
- **Découpage parent-enfant** (*parent-child chunking*) : on crée deux niveaux de chunks. Les chunks "enfants" (petits, précis) servent au retrieval. Quand un chunk enfant est sélectionné, on injecte le chunk "parent" (plus large, avec le contexte autour) dans le prompt du LLM. Cela permet d'avoir la précision du petit chunk pour la recherche et la richesse contextuelle du grand chunk pour la génération.
- **Découpage agentique** (*agentic chunking*) : un LLM est utilisé pour décider où couper, en analysant le contenu. C'est la méthode la plus précise mais aussi la plus coûteuse et la plus lente — réservée aux corpus à haute valeur ajoutée.

### Les problèmes récurrents

Quelle que soit la stratégie, certains problèmes reviennent systématiquement :

- **Les tableaux** : un tableau coupé en plein milieu perd tout son sens. Il faut soit le traiter comme un chunk atomique (au risque de dépasser la taille cible), soit le convertir en texte linéaire (au risque de perdre la structure tabulaire), soit le résumer.
- **Les listes et énumérations** : une liste de 30 items découpée en trois chunks donne trois fragments incompréhensibles si le contexte introductif n'est pas répliqué.
- **Le code source** : dans un corpus technique, des blocs de code apparaissent fréquemment. Les couper est catastrophique ; les ignorer fait perdre de l'information.
- **Les références croisées** : un document qui dit "voir section 3.2 ci-dessus" perd tout son sens si la section 3.2 est dans un autre chunk. On peut tenter de résoudre ces références à la normalisation, mais c'est rarement parfait.
- **Le dimensionnement** : il n'existe pas de taille universelle. On constate empiriquement que des chunks de 256 à 1024 tokens fonctionnent bien dans la majorité des cas, mais le bon paramétrage dépend du corpus, du modèle d'embedding et du cas d'usage. Le seul moyen fiable, c'est d'itérer et de mesurer.

Pour un assistant RH, par exemple, le découpage structurel par paragraphe fonctionne bien sur des accords d'entreprise ou des règlements intérieurs. Pour un assistant de suivi de projet alimenté par des transcriptions de réunion, c'est plus compliqué : les échanges oraux n'ont pas toujours de structure claire, et il faut souvent itérer vers un découpage sémantique, voire un post-traitement manuel sur les passages critiques.

### Les outils de chunking

Comme pour le parsing, l'écosystème propose des solutions à différents niveaux d'abstraction.

**Les librairies dédiées au chunking :**

- **[Chonkie](https://github.com/chonkie-inc/chonkie)** (YC X25) : c'est la librairie spécialisée la plus aboutie aujourd'hui. Légère (~15 Mo d'installation contre 80-170 Mo pour les alternatives), rapide (jusqu'à 33x plus rapide que LangChain sur le chunking par tokens), et sans dépendance externe pour les fonctionnalités de base. Elle supporte le chunking par tokens, par phrases, récursif, sémantique, et même un mode "semantic double pass" qui regroupe les chunks sémantiquement proches après un premier découpage. Elle gère 56 langues, s'intègre avec plus de 30 outils (tokenizers, modèles d'embedding, bases vectorielles), et propose des *Refineries* pour post-traiter les chunks (enrichissement, nettoyage). C'est un excellent choix si on veut un outil spécialisé et performant, découplé du reste de la stack.
- **[semchunk](https://github.com/isaacus-dev/semchunk)** : une librairie Python minimaliste pour le chunking sémantique. Moins riche que Chonkie, mais très simple à intégrer si on a besoin uniquement de découper du texte en unités de sens cohérentes sans embarquer un framework complet.

**Les splitters intégrés aux frameworks RAG :**

- **[LangChain Text Splitters](https://python.langchain.com/docs/concepts/text_splitters/)** : la collection la plus connue. Le `RecursiveCharacterTextSplitter` est le point de départ recommandé pour la majorité des cas — il tente de couper sur les séparateurs les plus "larges" (doubles sauts de ligne, puis simples, puis phrases, puis mots) tout en respectant une taille maximale. LangChain propose aussi des splitters spécialisés par format : `MarkdownHeaderTextSplitter` (qui découpe en respectant la hiérarchie des titres Markdown), `HTMLSectionSplitter`, `PythonCodeTextSplitter`, `LatexTextSplitter`, etc. Le `SemanticChunker` (expérimental) utilise les embeddings pour détecter les ruptures de sens. L'écosystème est vaste mais peut être lourd à embarquer si on n'utilise que le chunking.
- **[LlamaIndex Node Parsers](https://docs.llamaindex.ai/en/stable/module_guides/loading/node_parsers/)** : l'équivalent côté LlamaIndex. Le `SentenceSplitter` est le défaut, le `SemanticSplitterNodeParser` implémente le chunking sémantique par analyse de similarité entre phrases consécutives, et le `HierarchicalNodeParser` crée automatiquement une structure parent-enfant sur plusieurs niveaux de granularité (document → section → paragraphe). Ce dernier est particulièrement utile pour implémenter le pattern parent-child chunking décrit plus haut.

**Les outils de parsing qui intègrent le chunking :**

Les parseurs de documents mentionnés dans la section précédente proposent souvent leur propre stratégie de découpage, avec l'avantage de s'appuyer sur la structure sémantique extraite lors du parsing :

- **[Unstructured.io](https://docs.unstructured.io/open-source/core-functionality/chunking)** : le chunking s'appuie sur les éléments identifiés lors du partitionnement (titres, paragraphes, tableaux, listes). La stratégie `by_title` utilise les titres détectés comme frontières de chunks, garantissant qu'un chunk ne mélange pas deux sections différentes. Leur offre cloud ajoute un *contextual chunking* inspiré de la technique d'Anthropic : un LLM génère un préfixe de contexte pour chaque chunk avant l'embedding.
- **[Docling](https://docling-project.github.io/docling/)** (IBM) : propose un `HybridChunker` et un `HierarchicalChunker` qui exploitent le `DoclingDocument` riche produit lors du parsing — blocs de texte, tableaux, figures, listes sont traités comme des unités atomiques que le chunker respecte. C'est l'approche la plus "context-aware" parmi les parseurs open source : le chunking hérite directement de la compréhension structurelle du document.

**En résumé**, le choix dépend de la stack déjà en place. Si on utilise LangChain ou LlamaIndex, leurs splitters intégrés sont un point de départ naturel. Si on veut découpler le chunking du reste ou optimiser les performances, Chonkie est le meilleur choix spécialisé. Et si on utilise déjà Docling ou Unstructured pour le parsing, autant exploiter leur chunking natif qui bénéficie de la compréhension structurelle du document.

## 3. Générer les embeddings et indexer

Chaque chunk est transformé en vecteur via un modèle d'embedding. Ce vecteur capture la "signification" sémantique du texte, ce qui permet ensuite de comparer des questions et des passages par similarité.

### Le choix du modèle d'embedding

Le choix du modèle d'embedding impacte directement la qualité de la recherche sémantique, la gestion du multilingue et les coûts. Plusieurs familles coexistent :

- **Les modèles propriétaires via API** : OpenAI (`text-embedding-3-small`, `text-embedding-3-large`), Cohere (`embed-v4`), Voyage AI (`voyage-3-large`), Google (`text-embedding-005`). Ils offrent d'excellentes performances out-of-the-box, une bonne couverture multilingue, et une intégration simple. Le prix à payer : la dépendance à un service cloud, la latence réseau, et un coût par token qui s'accumule sur de gros corpus.
- **Les modèles open-weight** : la famille Sentence Transformers avec des modèles comme `nomic-embed-text-v2-moe`, `bge-m3` (BAAI), `e5-mistral-7b-instruct`, `multilingual-e5-large`. Ils tournent en local (via Ollama, vLLM, TEI…), sans coût marginal par requête, et permettent un contrôle total sur les données. La contrepartie : il faut gérer l'infrastructure, et les performances peuvent être inférieures sur certains cas d'usage spécifiques.

Les critères de choix sont nombreux :
- **La dimensionnalité** : un vecteur de 256 dimensions prend moins de place et se compare plus vite qu'un vecteur de 3072 dimensions, mais capture moins de nuances. OpenAI propose la troncature de dimensions (*Matryoshka embeddings*) pour ajuster ce compromis.
- **La couverture linguistique** : sur un corpus en français, un modèle entraîné principalement sur de l'anglais donnera des résultats médiocres, surtout sur du vocabulaire spécialisé.
- **La taille de la fenêtre d'entrée** : certains modèles acceptent 512 tokens, d'autres 8192. Ça contraint directement la taille maximale des chunks.
- **La performance sur le domaine** : les benchmarks génériques (MTEB) sont utiles mais insuffisants. Un modèle excellent sur des tâches académiques peut échouer sur du jargon métier.

Sur un précédent projet (un chatbot sur l'inclusion socio-professionnelle, full open-weight avec Ollama), j'avais galéré avec les embeddings : certains acronymes métier comme "PMSMP" ou "IAE" ne remontaient aucun résultat pertinent. J'avais fini par utiliser `nomic-embed-text-v2-moe` pour obtenir des résultats satisfaisants. Sur Raggae, j'utilise l'API OpenAI avec `text-embedding-3-large`, ce qui simplifie les choses en échange d'une dépendance cloud.

### Le choix du stockage vectoriel

Côté stockage, le marché s'est considérablement étoffé. On peut distinguer plusieurs catégories :

- **Les bases vectorielles spécialisées** : Pinecone (managed, performant, cher), Qdrant (open source, Rust, très rapide), Weaviate (open source, orienté GraphQL, supporte le filtrage hybride nativement), Milvus (open source, conçu pour le passage à l'échelle), ChromaDB (léger, idéal pour du prototypage).
- **Les extensions de bases existantes** : **[pgvector](https://github.com/pgvector/pgvector)** pour PostgreSQL, les vector indexes de Redis, les capacités vectorielles d'Elasticsearch/OpenSearch. L'avantage : on capitalise sur une infrastructure déjà en place.
- **Les librairies in-process** : FAISS (Meta, référence en matière de performance brute), Annoy (Spotify), HNSWlib. Elles tournent dans le même processus que l'application, sans serveur séparé. Parfait pour de petits corpus ou des environnements embarqués.

Le type d'index vectoriel compte aussi. Les deux principales familles sont **[HNSW](https://en.wikipedia.org/wiki/Hierarchical_navigable_small_world)** (*Hierarchical Navigable Small World* — rapide en lecture, gourmand en mémoire) et **[IVF](https://medium.com/@Jawabreh0/inverted-file-indexing-ivf-in-faiss-a-comprehensive-guide-c183fe979d20)** (*Inverted File Index* — plus compact, mais nécessite un entraînement préalable). Pour la majorité des cas d'usage, HNSW est le défaut recommandé.

Pour Raggae, j'ai opté pour **PostgreSQL + pgvector** : ça couvre les besoins de recherche vectorielle tout en gardant la possibilité de faire du filtrage SQL classique sur les métadonnées. Un seul SGBD, moins de complexité opérationnelle. C'est un choix pragmatique qui convient très bien jusqu'à quelques millions de vecteurs.

### La gestion de la réindexation

Un point souvent négligé : que se passe-t-il quand on change de modèle d'embedding ou quand on modifie la stratégie de chunking ? Il faut réindexer l'intégralité du corpus. Sur un petit corpus, c'est anodin. Sur un corpus de dizaines de milliers de documents, ça représente des heures de calcul et un coût non négligeable. Avoir une stratégie de réindexation incrémentale, avec un suivi de version des embeddings, est un investissement qui paie à moyen terme.

---

> **Article suivant** : [Retrieval : trouver les bons passages]({{< ref "/posts/concevoir-un-assistant-documentaire-rag-retrieval" >}})
