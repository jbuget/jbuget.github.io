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

Travailler sur ces cas d'usage m'a appris (et continue de m'apprendre) énormément de choses, notamment : **un assistant documentaire n'est pas qu'un wrapper autour d'un LLM.** C'est un système d'information complet, avec ses propres contraintes d'architecture, d'ingestion, de recherche et de génération. C'est ce que je me propose de détailler dans cet article.

> Le code source du projet qui accompagne cet article est disponible sur GitHub : [jbuget/raggae](https://github.com/jbuget/raggae). RAGGAE est une plateforme open source pour créer des agents conversationnels RAG, de l'ingestion documentaire au chat contextuel multi-LLM.


## Ce qu'on construit réellement

Avant de plonger dans la technique, posons le cadre. Un assistant documentaire intelligent, c'est un système qui prend en entrée une question formulée en langage naturel par un utilisateur, va chercher les passages les plus pertinents dans un corpus de documents préalablement indexés, et génère une réponse synthétique en s'appuyant exclusivement (ou presque) sur ces passages.

Dit autrement, le LLM ne "sait" rien de votre corpus. Il ne fait que synthétiser ce qu'on lui donne à lire au moment de la requête. Toute la valeur du système réside dans la qualité de ce qu'on lui fournit comme contexte.

On peut découper l'architecture en trois grands blocs :

1. **Le pipeline d'ingestion et d'indexation** : comment préparer et stocker les documents.
2. **Le mécanisme de retrieval** : comment retrouver les bons passages lors d'une question.
3. **L'orchestration de génération** : comment assembler le tout pour produire une réponse fiable.

Chaque bloc a ses propres défis. Et les erreurs les plus coûteuses se font généralement dans le premier.

## 1. Pipeline d'ingestion : là où tout se joue

La première fois que j'ai monté un pipeline RAG, j'ai sous-estimé cette étape. Je me suis dit : "on prend les docs, on les découpe, on vectorise, et c'est parti." En pratique, c'est là que se concentre l'essentiel de la complexité, et surtout l'essentiel de l'impact sur la qualité finale des réponses.

### 1.1. Collecter et normaliser les sources

Un assistant documentaire agrège des formats hétérogènes : PDF, pages HTML, exports de wiki, fichier TXT ou Markdown versionné, comptes rendus de réunion, parfois même des transcriptions audio. La première question à se poser, c'est celle de la synchronisation. Pour un assistant de suivi de projet, les transcriptions de réunion arrivent au fil de l'eau : il faut une ingestion incrémentale, pas un batch nocturne. Pour un assistant RH, les documents évoluent peu et un rechargement périodique suffit. La plateforme doit supporter les deux modes.

#### Les problématiques de collecte

Les formats d'entrée posent chacun des difficultés spécifiques :

- **Les PDF** sont le cauchemar récurrent. Un PDF "texte" (généré depuis Word ou LaTeX) est relativement simple à parser. Un PDF "image" (scan d'un document papier) nécessite de l'OCR, avec toutes les erreurs que ça implique : caractères mal reconnus, tableaux déstructurés, colonnes mélangées. Les PDF à mise en page complexe — multi-colonnes, encadrés, notes de bas de page — posent aussi des problèmes de reconstruction de l'ordre de lecture.
- **Le HTML** demande un nettoyage agressif : menus de navigation, headers et footers répétitifs, publicités, scripts, barres latérales. Il faut extraire le contenu "utile" sans perdre la structure sémantique (titres, listes, tableaux).
- **Les documents Office** (Word, Excel, PowerPoint) requièrent des parseurs dédiés qui savent interpréter les styles, les tableaux imbriqués, les commentaires et les révisions.
- **Les transcriptions audio** (issues de Whisper, Azure Speech, etc.) arrivent souvent sans ponctuation fiable, avec des erreurs de reconnaissance sur les noms propres et les termes techniques, et sans structure de paragraphes.
- **Les exports de wiki ou de Confluence** mélangent Markdown, HTML et macros propriétaires qu'il faut nettoyer.

Côté outils, l'écosystème s'est enrichi ces derniers mois. On trouve des solutions comme **[Unstructured.io](https://github.com/Unstructured-IO/unstructured)** (open source, multi-format, bon sur les PDF complexes), **Docling** (IBM, spécialisé dans le parsing de documents académiques et techniques), **LlamaParse** (du même éditeur que LlamaIndex, en mode API), ou **Apache Tika** (le vétéran, robuste mais moins fin sur les structures). Le choix dépend du compromis entre précision d'extraction, formats supportés et contraintes de déploiement (certaines solutions sont cloud-only).

#### Normalisation et structure

Extraire du texte brut ne suffit pas. La structure logique d'un document — la hiérarchie des titres, les sections, les tableaux — porte une information sémantique essentielle. Si on la perd, le système de retrieval devient moins discriminant. Un bon pipeline de normalisation doit préserver les frontières sémantiques tout en éliminant le bruit (menus HTML, en-têtes répétitifs, artefacts d'OCR).

Plusieurs problématiques se posent à cette étape :

- **La détection de doublons** : un même document peut exister en plusieurs versions, dans plusieurs formats, à plusieurs emplacements. Sans déduplication, on pollue l'index et on risque de remonter des informations contradictoires (une version obsolète à côté de la version à jour).
- **La gestion des versions** : dans un contexte où les documents évoluent (accords d'entreprise révisés, procédures mises à jour), il faut décider si on conserve l'historique ou si on ne garde que la dernière version. Et si on conserve l'historique, comment le signaler au retrieval pour éviter de remonter une information périmée.
- **L'encodage et les caractères spéciaux** : ça peut paraître trivial, mais entre l'UTF-8, le Latin-1, les caractères accentués mal convertis et les caractères spéciaux issus de l'OCR, on passe facilement des heures de débogage.
- **Les images et schémas** : un diagramme dans un document PDF ou une capture d'écran dans un compte rendu ne sont pas indexables en l'état. On peut les ignorer, les décrire manuellement, ou utiliser un modèle multimodal pour en générer une description textuelle — chaque approche a son coût et ses limites.

#### Les outils de normalisation

L'écosystème des parseurs de documents s'est considérablement structuré. Voici les principales solutions, par catégorie.

**Solutions open source :**

- **[Docling](https://github.com/docling-project/docling)** (IBM, licence MIT) : c'est aujourd'hui l'un des meilleurs choix open source. Docling utilise des modèles d'IA spécialisés pour l'analyse de mise en page (DocLayNet) et la reconnaissance de structure de tableaux (TableFormer). Il supporte PDF, DOCX, PPTX, HTML, images et audio, inclut l'OCR pour les documents scannés, et produit des sorties structurées (Markdown, JSON). Il s'intègre nativement avec LangChain, LlamaIndex et Haystack. Les benchmarks lui donnent environ 94-98 % de précision sur l'extraction de tableaux complexes. Il tourne en local, sans dépendance cloud.
- **[Marker](https://github.com/VikParuchuri/marker)** : développé par Vik Paruchuri, Marker est spécialisé dans la conversion de PDF en Markdown structuré. Il combine PyMuPDF et Tesseract pour l'OCR, avec une accélération GPU optionnelle via Surya. C'est un outil léger et efficace, particulièrement adapté au traitement offline de gros volumes de PDF. Moins polyvalent que Docling sur les formats d'entrée, mais excellent sur son créneau.
- **[Unstructured.io](https://github.com/Unstructured-IO/unstructured)** (open source + offre cloud) : historiquement la référence dans l'écosystème RAG, Unstructured propose des parseurs pour une large gamme de formats (PDF, DOCX, HTML, emails, images…). La version open source reste fonctionnelle, mais la qualité d'extraction a été critiquée récemment sur certains benchmarks par rapport aux alternatives plus récentes. L'offre cloud (payante) ajoute des modèles plus performants et une API managée.
- **[Apache Tika](https://tika.apache.org/)** : le vétéran (projet Apache, écosystème Java). Tika détecte et extrait le contenu de plus de 1 000 types de fichiers. Robuste et éprouvé en entreprise, mais moins fin que les solutions récentes sur la préservation de la structure sémantique (hiérarchie de titres, structure de tableaux). Reste un excellent choix pour l'extraction de métadonnées et la détection de types MIME.

**Solutions cloud / payantes :**

- **[LlamaParse](https://docs.cloud.llamaindex.ai/llamaparse/getting_started)** (LlamaIndex) : un service cloud conçu spécifiquement pour produire des sorties "LLM-ready" à partir de documents complexes (tableaux, graphiques, diagrammes). La v2 propose plusieurs modes : un parsing sans IA (1 crédit/page), un mode économique (3 crédits/page) et un mode agentique avec des modèles avancés (jusqu'à 90 crédits/page). Excellente préservation structurelle et intégration native avec LlamaIndex. Un plan gratuit avec des crédits offerts permet de tester. Idéal si on utilise déjà l'écosystème LlamaIndex.
- **[Reducto](https://reducto.ai/)** : un service d'ingestion documentaire qui utilise un pipeline hybride (vision par ordinateur + OCR + VLM + correction agentique) pour préserver finement la structure des documents. Particulièrement performant sur les documents d'entreprise complexes (rapports financiers, contrats, formulaires). 15 000 crédits gratuits pour démarrer, puis facturation à l'usage. Reconnu pour la qualité de ses sorties structurées et son système de correction automatique des erreurs d'extraction.

#### Enrichissement en métadonnées

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

### 1.2. Découper en chunks

Un LLM a une fenêtre de contexte limitée. On ne peut pas lui envoyer 500 pages d'un coup. Il faut donc découper le corpus en unités cohérentes — des *chunks*. C'est une décision structurante qui impacte toute la chaîne en aval.

Un chunk trop court et on perd le contexte. Un chunk trop long et on dilue l'information pertinente dans du bruit, tout en consommant inutilement des tokens.

#### Les stratégies de découpage

Il existe toute une typologie de stratégies, par ordre croissant de sophistication :

- **Découpage à taille fixe** (*fixed-size chunking*) : on coupe tous les N caractères ou N tokens, avec éventuellement un chevauchement (*overlap*) entre chunks adjacents. C'est le plus simple à implémenter, mais le plus brutal : il coupe aveuglément au milieu des phrases, des paragraphes, voire des tableaux. Adapté pour un prototype ou un corpus très homogène.
- **Découpage par séparateurs** (*recursive character splitting*) : on tente de couper d'abord sur les doubles sauts de ligne, puis les simples sauts de ligne, puis les phrases, puis les mots. C'est l'approche par défaut dans LangChain. Elle offre un bon compromis entre simplicité et respect de la structure textuelle.
- **Découpage structurel** (*document-structure-aware*) : on s'appuie sur la structure logique du document — titres, sous-titres, sections, paragraphes — pour créer des chunks qui respectent les frontières sémantiques naturelles. Très efficace sur des documents bien structurés (accords d'entreprise, documentation technique), beaucoup moins sur des transcriptions orales.
- **Découpage sémantique** (*semantic chunking*) : on utilise les embeddings pour détecter les ruptures de sens entre phrases ou paragraphes consécutifs, et on coupe là où la similarité sémantique chute. Plus coûteux à calculer, mais pertinent quand la structure du document est faible ou absente.
- **Découpage parent-enfant** (*parent-child chunking*) : on crée deux niveaux de chunks. Les chunks "enfants" (petits, précis) servent au retrieval. Quand un chunk enfant est sélectionné, on injecte le chunk "parent" (plus large, avec le contexte autour) dans le prompt du LLM. Cela permet d'avoir la précision du petit chunk pour la recherche et la richesse contextuelle du grand chunk pour la génération.
- **Découpage agentique** (*agentic chunking*) : un LLM est utilisé pour décider où couper, en analysant le contenu. C'est la méthode la plus précise mais aussi la plus coûteuse et la plus lente — réservée aux corpus à haute valeur ajoutée.

#### Les problèmes récurrents

Quelle que soit la stratégie, certains problèmes reviennent systématiquement :

- **Les tableaux** : un tableau coupé en plein milieu perd tout son sens. Il faut soit le traiter comme un chunk atomique (au risque de dépasser la taille cible), soit le convertir en texte linéaire (au risque de perdre la structure tabulaire), soit le résumer.
- **Les listes et énumérations** : une liste de 30 items découpée en trois chunks donne trois fragments incompréhensibles si le contexte introductif n'est pas répliqué.
- **Le code source** : dans un corpus technique, des blocs de code apparaissent fréquemment. Les couper est catastrophique ; les ignorer fait perdre de l'information.
- **Les références croisées** : un document qui dit "voir section 3.2 ci-dessus" perd tout son sens si la section 3.2 est dans un autre chunk. On peut tenter de résoudre ces références à la normalisation, mais c'est rarement parfait.
- **Le dimensionnement** : il n'existe pas de taille universelle. On constate empiriquement que des chunks de 256 à 1024 tokens fonctionnent bien dans la majorité des cas, mais le bon paramétrage dépend du corpus, du modèle d'embedding et du cas d'usage. Le seul moyen fiable, c'est d'itérer et de mesurer.

Pour un assistant RH, par exemple, le découpage structurel par paragraphe fonctionne bien sur des accords d'entreprise ou des règlements intérieurs. Pour un assistant de suivi de projet alimenté par des transcriptions de réunion, c'est plus compliqué : les échanges oraux n'ont pas toujours de structure claire, et il faut souvent itérer vers un découpage sémantique, voire un post-traitement manuel sur les passages critiques.

#### Les outils de chunking

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

### 1.3. Générer les embeddings et indexer

Chaque chunk est transformé en vecteur via un modèle d'embedding. Ce vecteur capture la "signification" sémantique du texte, ce qui permet ensuite de comparer des questions et des passages par similarité.

#### Le choix du modèle d'embedding

Le choix du modèle d'embedding impacte directement la qualité de la recherche sémantique, la gestion du multilingue et les coûts. Plusieurs familles coexistent :

- **Les modèles propriétaires via API** : OpenAI (`text-embedding-3-small`, `text-embedding-3-large`), Cohere (`embed-v4`), Voyage AI (`voyage-3-large`), Google (`text-embedding-005`). Ils offrent d'excellentes performances out-of-the-box, une bonne couverture multilingue, et une intégration simple. Le prix à payer : la dépendance à un service cloud, la latence réseau, et un coût par token qui s'accumule sur de gros corpus.
- **Les modèles open-weight** : la famille Sentence Transformers avec des modèles comme `nomic-embed-text-v2-moe`, `bge-m3` (BAAI), `e5-mistral-7b-instruct`, `multilingual-e5-large`. Ils tournent en local (via Ollama, vLLM, TEI…), sans coût marginal par requête, et permettent un contrôle total sur les données. La contrepartie : il faut gérer l'infrastructure, et les performances peuvent être inférieures sur certains cas d'usage spécifiques.

Les critères de choix sont nombreux :
- **La dimensionnalité** : un vecteur de 256 dimensions prend moins de place et se compare plus vite qu'un vecteur de 3072 dimensions, mais capture moins de nuances. OpenAI propose la troncature de dimensions (*Matryoshka embeddings*) pour ajuster ce compromis.
- **La couverture linguistique** : sur un corpus en français, un modèle entraîné principalement sur de l'anglais donnera des résultats médiocres, surtout sur du vocabulaire spécialisé.
- **La taille de la fenêtre d'entrée** : certains modèles acceptent 512 tokens, d'autres 8192. Ça contraint directement la taille maximale des chunks.
- **La performance sur le domaine** : les benchmarks génériques (MTEB) sont utiles mais insuffisants. Un modèle excellent sur des tâches académiques peut échouer sur du jargon métier.

Sur un précédent projet (un chatbot sur l'inclusion socio-professionnelle, full open-weight avec Ollama), j'avais galéré avec les embeddings : certains acronymes métier comme "PMSMP" ou "IAE" ne remontaient aucun résultat pertinent. J'avais fini par utiliser `nomic-embed-text-v2-moe` pour obtenir des résultats satisfaisants. Sur Raggae, j'utilise l'API OpenAI avec `text-embedding-3-large`, ce qui simplifie les choses en échange d'une dépendance cloud.

#### Le choix du stockage vectoriel

Côté stockage, le marché s'est considérablement étoffé. On peut distinguer plusieurs catégories :

- **Les bases vectorielles spécialisées** : Pinecone (managed, performant, cher), Qdrant (open source, Rust, très rapide), Weaviate (open source, orienté GraphQL, supporte le filtrage hybride nativement), Milvus (open source, conçu pour le passage à l'échelle), ChromaDB (léger, idéal pour du prototypage).
- **Les extensions de bases existantes** : **[pgvector](https://github.com/pgvector/pgvector)** pour PostgreSQL, les vector indexes de Redis, les capacités vectorielles d'Elasticsearch/OpenSearch. L'avantage : on capitalise sur une infrastructure déjà en place.
- **Les librairies in-process** : FAISS (Meta, référence en matière de performance brute), Annoy (Spotify), HNSWlib. Elles tournent dans le même processus que l'application, sans serveur séparé. Parfait pour de petits corpus ou des environnements embarqués.

Le type d'index vectoriel compte aussi. Les deux principales familles sont **[HNSW](https://en.wikipedia.org/wiki/Hierarchical_navigable_small_world)** (*Hierarchical Navigable Small World* — rapide en lecture, gourmand en mémoire) et **[IVF](https://medium.com/@Jawabreh0/inverted-file-indexing-ivf-in-faiss-a-comprehensive-guide-c183fe979d20)** (*Inverted File Index* — plus compact, mais nécessite un entraînement préalable). Pour la majorité des cas d'usage, HNSW est le défaut recommandé.

Pour Raggae, j'ai opté pour **PostgreSQL + pgvector** : ça couvre les besoins de recherche vectorielle tout en gardant la possibilité de faire du filtrage SQL classique sur les métadonnées. Un seul SGBD, moins de complexité opérationnelle. C'est un choix pragmatique qui convient très bien jusqu'à quelques millions de vecteurs.

#### La gestion de la réindexation

Un point souvent négligé : que se passe-t-il quand on change de modèle d'embedding ou quand on modifie la stratégie de chunking ? Il faut réindexer l'intégralité du corpus. Sur un petit corpus, c'est anodin. Sur un corpus de dizaines de milliers de documents, ça représente des heures de calcul et un coût non négligeable. Avoir une stratégie de réindexation incrémentale, avec un suivi de version des embeddings, est un investissement qui paie à moyen terme.

## 2. Retrieval : trouver les bons passages

Le retrieval est le cœur du système. C'est ici que se joue la pertinence des réponses. Un retrieval médiocre, et le LLM le plus puissant du monde ne pourra pas produire une bonne réponse — parce qu'il n'aura pas les bons éléments sous les yeux.

### 2.1. Reformuler la requête

La question d'un utilisateur est rarement optimale pour la recherche. Elle peut être ambiguë, incomplète ou contextuellement implicite. Prenez un collaborateur qui demanderait à un assistant RH : *"J'ai droit à combien ?"* — sans préciser s'il parle de congés, de RTT ou de tickets restaurant.

#### Les problèmes typiques

- **L'ambiguïté** : un même mot peut désigner des concepts différents selon le contexte métier ("plan" dans un contexte RH vs. projet vs. architecture).
- **L'implicite conversationnel** : dans un échange multi-tours, l'utilisateur dit "et pour les cadres ?" en s'attendant à ce que le système comprenne qu'il poursuit la question précédente sur les congés.
- **Les fautes de frappe et approximations** : "combient de jour de télétrvail" doit quand même fonctionner.
- **Les requêtes multi-intentions** : "Quels sont les jours de congé et comment poser un arrêt maladie ?" — deux questions en une, qui nécessitent potentiellement des chunks différents.

#### Les techniques de reformulation

Plusieurs approches existent, souvent combinées :

- **L'expansion de requête** (*query expansion*) : un LLM reformule la question de l'utilisateur en une version plus explicite et plus riche en termes de recherche, en ajoutant des synonymes ou des termes liés.
- **HyDE** (*Hypothetical Document Embedding*) : au lieu de chercher directement avec la question, on demande au LLM de générer une réponse hypothétique, puis on utilise l'embedding de cette réponse comme requête de recherche. L'intuition : un passage de réponse ressemble davantage aux chunks du corpus qu'une question.
- **La multi-requête** (*multi-query*) : on génère plusieurs reformulations de la même question et on lance les recherches en parallèle, puis on fusionne les résultats. Cela élargit le rappel en couvrant plusieurs angles sémantiques.
- **La décomposition** (*query decomposition*) : pour les questions complexes ou multi-intentions, on découpe la requête en sous-questions indépendantes, chacune traitée séparément.
- **Le step-back prompting** : on reformule la question en une version plus abstraite ou plus générale, pour capter des passages qui traitent du sujet de façon englobante.
- **La reformulation contextuelle** (*conversation-aware*) : dans un échange multi-tours, on injecte l'historique de la conversation pour résoudre les pronoms et les références implicites ("et pour les cadres ?" → "Quels sont les jours de congé pour les cadres ?").

En pratique, l'expansion de requête simple via un LLM rapide (type Haiku ou GPT-4o-mini) offre le meilleur rapport coût/bénéfice. HyDE est puissant mais double le coût et la latence. La multi-requête est utile sur des corpus très hétérogènes.

### 2.2. Combiner recherche vectorielle et lexicale

La recherche vectorielle capture la proximité sémantique : elle comprend que "congé parental" et "absence pour naissance" sont liés, même si les mots sont différents. Mais elle peut rater des correspondances exactes, notamment pour des termes techniques, des identifiants ou des acronymes.

C'est pourquoi un bon système combine recherche vectorielle (par embedding, cosine similarity) et recherche lexicale (type BM25, correspondance exacte de termes). Sur des corpus techniques — code, normes, procédures, comptes rendus avec des noms propres — la recherche full-text reste indispensable.

#### Les modes de recherche

- **Recherche vectorielle pure** (*dense retrieval*) : on compare l'embedding de la requête avec les embeddings des chunks via une mesure de similarité (cosine, dot product, distance euclidienne). Forces : compréhension sémantique, tolérance aux reformulations. Faiblesses : mauvaise gestion des termes rares, acronymes, identifiants, noms propres.
- **Recherche lexicale pure** (*sparse retrieval*) : algorithmes comme BM25, TF-IDF, ou full-text search natif (PostgreSQL `tsvector/tsquery`, Elasticsearch). Forces : correspondance exacte, rapidité, explicabilité. Faiblesses : aucune compréhension sémantique — "voiture" et "automobile" sont deux termes différents.
- **Recherche hybride** : on exécute les deux recherches en parallèle et on fusionne les résultats. C'est l'approche qui donne les meilleurs résultats dans la majorité des cas.

#### La fusion des résultats

La fusion des résultats de recherche hétérogènes est un problème en soi. Les scores de similarité vectorielle et les scores BM25 ne sont pas sur la même échelle — on ne peut pas simplement les additionner. Plusieurs stratégies existent :

- **RRF** (*Reciprocal Rank Fusion*) : on fusionne les résultats en se basant sur leur rang dans chaque liste, pas sur leur score brut. C'est simple, robuste, et ne nécessite aucun calibrage. C'est la méthode la plus utilisée en pratique.
- **Fusion pondérée normalisée** : on normalise les scores de chaque source (min-max ou z-score), puis on calcule une moyenne pondérée. Plus flexible que RRF, mais nécessite de calibrer les poids — ce qui revient à un hyperparamètre supplémentaire à tuner.
- **Fusion apprise** (*learned fusion*) : un modèle entraîné apprend à combiner les signaux. Plus performant en théorie, mais nécessite des données d'évaluation annotées.

Certaines bases vectorielles supportent nativement la recherche hybride (Weaviate, Qdrant, Elasticsearch). Avec pgvector, il faut combiner la recherche vectorielle et le full-text PostgreSQL soi-même, mais la flexibilité SQL compense largement.

### 2.3. Reranking

La pratique industrielle consiste à fusionner les résultats des deux types de recherche, puis à appliquer un reranking via un modèle dédié, plus coûteux mais beaucoup plus précis. Contrairement aux bi-encoders utilisés pour les embeddings (qui encodent requête et passage séparément), un reranker évalue chaque paire (requête, passage) conjointement et produit un score de pertinence plus fin.

#### Les approches de reranking

- **Les cross-encoders** : modèles comme `ms-marco-MiniLM` ou `bge-reranker-v2-m3`. Ils prennent en entrée la concaténation de la requête et du passage et produisent un score de pertinence. Très précis, mais lents (on ne peut pas pré-calculer les représentations — chaque paire doit être évaluée au moment de la requête).
- **Les rerankers via API** : Cohere Rerank, Jina Reranker, Voyage Rerank. Faciles à intégrer, performants, mais avec une dépendance cloud et un coût par requête.
- **ColBERT** (*Contextualized Late Interaction over BERT*) : un compromis entre bi-encoders et cross-encoders. Il pré-calcule des représentations par token (pas par passage entier), ce qui permet un reranking rapide tout en capturant les interactions fines entre requête et passage.
- **Le reranking par LLM** : on demande directement à un LLM de classer les passages par pertinence. Surprenamment efficace, mais coûteux et lent. Utile comme solution de dernier recours ou pour des benchmarks.

#### L'architecture en cascade

En pratique, on adopte souvent une architecture en cascade (*pipeline*) : une première étape rapide et peu coûteuse (recherche vectorielle + BM25) ramène un large ensemble de candidats (50-100 passages), puis le reranker affine le classement sur ce sous-ensemble réduit. Cela permet de bénéficier de la précision du cross-encoder sans payer le coût de l'appliquer à l'ensemble du corpus.

C'est souvent ici que se joue la différence entre un prototype convaincant en démo et un système robuste en production. Sur un corpus de comptes rendus de réunion, par exemple, le reranking est déterminant : sans lui, les résultats de recherche remontent régulièrement des passages thématiquement proches mais factuellement hors sujet (une réunion sur la "reprise des données" vs. une réunion sur la "reprise d'activité").

### 2.4. Sélection du contexte

Les chunks sélectionnés doivent tenir dans la fenêtre de contexte du LLM. Le dimensionnement du top-K est un arbitrage constant entre coût, latence et risque d'hallucination : trop peu de contexte pousse le modèle à inventer ; trop de contexte dilue l'information pertinente.

#### Les problématiques de sélection

- **Le phénomène "Lost in the Middle"** : des travaux de recherche ont montré que les LLM ont tendance à sous-exploiter les informations situées au milieu d'un long contexte, privilégiant le début et la fin. L'ordre dans lequel on injecte les chunks a donc une importance. Placer les passages les plus pertinents en premier et en dernier peut améliorer la qualité des réponses.
- **La redondance** : si plusieurs chunks disent la même chose (ce qui arrive fréquemment avec l'overlap ou quand le même sujet est abordé dans plusieurs documents), on gaspille des tokens sans apporter d'information supplémentaire.
- **Les contradictions** : pire que la redondance, deux chunks peuvent se contredire (un document obsolète et sa version mise à jour, deux sources avec des chiffres différents). Le LLM doit pouvoir résoudre ou signaler cette ambiguïté — encore faut-il que le prompt l'y encourage.

#### Les stratégies d'optimisation

- **Le fenêtrage contextuel** (*contextual window expansion*) : quand un chunk est sélectionné, on inclut ses chunks adjacents (le passage avant et après dans le document d'origine) pour améliorer la cohérence locale. C'est une variante simplifiée de l'approche parent-enfant.
- **MMR** (*Maximum Marginal Relevance*) : au lieu de sélectionner les K passages les plus similaires à la requête, on diversifie : chaque nouveau passage sélectionné doit être pertinent par rapport à la requête mais aussi différent des passages déjà sélectionnés. Cela réduit la redondance et couvre plus de facettes de la question.
- **La compression contextuelle** (*contextual compression*) : un modèle intermédiaire résume ou extrait les passages clés de chaque chunk avant injection, réduisant la consommation de tokens tout en conservant l'information essentielle. LangChain propose un `ContextualCompressionRetriever` qui implémente cette approche.
- **Le map-reduce** : pour les questions qui nécessitent de synthétiser de nombreux passages (ex : "Résumez toutes les décisions prises lors des réunions de janvier"), on peut d'abord traiter chaque chunk individuellement (map), puis synthétiser les résultats partiels (reduce). C'est plus coûteux en appels LLM mais permet de traiter des corpus qui dépassent largement la fenêtre de contexte.

## 3. Orchestration de génération : assembler le puzzle

La génération, ce n'est pas un simple `chatCompletion()`. C'est une orchestration précise du contexte, des instructions et des contraintes.

### 3.1. Le prompt système

L'assistant fonctionne sur la base d'un prompt système (aussi appelé *system prompt*) qui définit son comportement, sa personnalité et ses garde-fous. C'est la "colonne vertébrale" de l'agent. Ce prompt vient s'ajouter au prompt administrateur de la plateforme sur laquelle tourne le LLM (OpenAI, Anthropic, etc.) et n'est pas visible par l'utilisateur final.

Typiquement, on y définit :
- Le rôle et le périmètre de l'assistant (*"Vous êtes un assistant expert en droit du travail, spécialisé dans la convention collective Syntec"*).
- L'obligation de s'appuyer uniquement sur les documents fournis en contexte.
- L'interdiction d'inventer des informations (hallucination).
- Le format attendu des réponses (structuré, avec citation des sources).
- La conduite à tenir en cas d'information manquante (*"Si la réponse n'est pas dans les documents, dites-le clairement"*).
- Les limites du rôle (*"Vous n'êtes pas un conseiller juridique. Orientez l'utilisateur vers le service compétent pour toute question engageant une responsabilité."*).

#### Les problématiques du prompt système

- **Le prompt drift** : au fil du temps, les ajouts et modifications successifs rendent le prompt incohérent ou contradictoire. Il finit par ressembler à un document de spécifications mal maintenu. Il est important de le versionner et de le tester comme du code.
- **L'injection de prompt** (*prompt injection*) : un utilisateur malveillant ou un document piégé peut tenter de détourner le comportement de l'assistant en injectant des instructions dans sa question ou dans le contenu d'un document indexé (*indirect prompt injection*). Les parades incluent le sandboxing du contexte documentaire, la validation des entrées, et des instructions explicites dans le prompt système pour ignorer les instructions contenues dans les documents.
- **L'équilibre entre rigidité et flexibilité** : un prompt trop contraignant produit un assistant qui refuse de répondre à des questions légitimes. Un prompt trop lâche produit un assistant qui hallucine ou sort de son périmètre. Trouver le bon dosage demande des itérations avec des utilisateurs réels.
- **La cohérence multi-tours** : dans une conversation longue, le prompt système peut être "oublié" ou dilué par le contexte accumulé. Certaines architectures réinjectent périodiquement les instructions clés pour maintenir le comportement attendu.

Sur Raggae, chaque "projet" (c'est-à-dire chaque agent) dispose de son propre prompt système, configurable par le créateur.

### 3.2. Injection du contexte documentaire

Les chunks récupérés lors du retrieval sont injectés dans le prompt, numérotés et enrichis de métadonnées (source, date, auteur). C'est ce contexte qui permet au LLM de répondre de façon ancrée dans les données réelles, plutôt que de puiser dans ses connaissances génériques.

#### Les choix de conception

- **Le format d'injection** : comment structurer les chunks dans le prompt ? On peut les injecter en texte brut, en Markdown, en XML, ou dans un format structuré avec des délimiteurs explicites (`[Source: document.pdf, page 12]`). Le format influence la capacité du LLM à citer ses sources correctement. En pratique, un balisage clair avec des identifiants numérotés (`[1]`, `[2]`, etc.) fonctionne bien pour permettre des citations traçables.
- **La position dans le prompt** : injecter le contexte avant la question de l'utilisateur ou après ? Avant la question (dans le system prompt ou en début de message) permet au LLM de "lire" les documents avant de découvrir la question. Après la question, le modèle sait ce qu'il cherche et peut être plus sélectif. Les deux approches ont leurs partisans ; en pratique, l'injecter dans le message utilisateur avec la question à la fin est le pattern le plus courant.
- **La séparation contexte/connaissances** : faut-il interdire au LLM d'utiliser ses connaissances pré-entraînées, ou l'autoriser à compléter quand le contexte est insuffisant ? Pour un assistant juridique ou RH, on veut un ancrage strict dans les documents. Pour un assistant technique plus généraliste, un peu de connaissance externe peut enrichir la réponse. C'est un curseur à régler selon le cas d'usage.

Dans les systèmes plus complexes, une étape de compression contextuelle permet de réduire la taille totale des chunks sans perdre l'information essentielle. Des techniques comme *LongLLMLingua* ou la compression extractive (on ne garde que les phrases les plus pertinentes de chaque chunk) permettent de diviser la consommation de tokens par 2 à 5 tout en conservant l'essentiel de l'information. C'est un levier d'optimisation important quand le corpus grandit.

### 3.3. Génération et garde-fous

Le LLM produit alors une synthèse probabiliste du contexte fourni. Les risques sont multiples et bien documentés.

#### Les risques de la génération

- **L'hallucination factuelle** : le modèle invente une information absente du contexte. C'est le risque le plus connu. Exemple : l'assistant affirme que "le télétravail est limité à 2 jours par semaine" alors que le document dit "3 jours". Ça peut arriver même avec un bon contexte, parce que le modèle "lisse" ou "interprète" les informations.
- **La sur-interprétation** : le modèle déduit quelque chose qui n'est pas explicitement dit. "Le document mentionne un bonus de performance" → "Vous avez droit à un bonus de performance". La nuance entre information et conseil est cruciale, surtout dans des contextes juridiques ou RH.
- **La fabrication de sources** : le modèle cite un document qui n'existe pas, ou attribue une information au mauvais document. C'est particulièrement insidieux parce que la réponse a l'air sourcée et crédible.
- **L'incohérence entre réponses** : sur une même question posée deux fois, le modèle peut donner des réponses différentes (nature probabiliste). C'est déconcertant pour les utilisateurs et problématique pour la fiabilité perçue. Baisser la température aide, mais ne garantit pas la reproductibilité.
- **Le refus excessif** : à l'inverse, un prompt trop restrictif pousse le modèle à répondre "je ne trouve pas l'information dans les documents" alors que l'information est bien présente, juste formulée différemment.

#### Les stratégies de mitigation

- **La citation obligatoire** : exiger dans le prompt que chaque affirmation soit accompagnée d'une référence au chunk source (`[1]`, `[2]`…). Cela force le modèle à ancrer sa réponse et facilite la vérification par l'utilisateur.
- **La vérification par un second modèle** (*LLM-as-judge*) : un second LLM (ou le même, dans un second appel) vérifie que chaque affirmation de la réponse est effectivement soutenue par le contexte fourni. Coûteux mais efficace sur les cas sensibles.
- **La validation déterministe** : une logique programmatique qui vérifie que les identifiants de source cités dans la réponse correspondent bien à des chunks réellement injectés, et que les citations textuelles sont fidèles aux passages originaux.
- **Le contrôle de température** : une température basse (0.0 à 0.3) réduit la créativité du modèle et donc le risque d'hallucination, au prix d'une moindre fluidité stylistique.
- **Le streaming avec feedback** : afficher les sources utilisées en parallèle de la réponse (comme le fait Perplexity) permet à l'utilisateur de vérifier en temps réel.
- **Les garde-fous de contenu** (*guardrails*) : des filtres en sortie qui détectent et bloquent les réponses potentiellement dangereuses (conseils médicaux, juridiques, financiers non qualifiés). Des outils comme NeMo Guardrails (NVIDIA) ou Guardrails AI permettent de définir ces règles de façon déclarative.


## 4. Les sujets qu'on sous-estime toujours

### 4.1. Permissions et confidentialité

Dans un assistant RH, certains documents sont réservés aux managers (grilles salariales, plans de restructuration, dossiers disciplinaires). On ne peut pas se contenter de filtrer après la génération : le filtrage doit intervenir **avant** le retrieval, sinon le LLM a accès à des informations qu'il ne devrait pas voir et peut les laisser fuiter dans sa réponse, même indirectement. C'est un sujet d'architecture, pas de prompt engineering.

#### Les niveaux de contrôle d'accès

- **Le filtrage au niveau du corpus** (*tenant isolation*) : chaque organisation ou équipe dispose de son propre espace documentaire, totalement isolé. C'est le plus simple à implémenter et le plus sûr. C'est l'approche retenue dans Raggae (chaque "projet" a son propre corpus).
- **Le filtrage au niveau du document** : chaque document porte des métadonnées d'accès (rôle requis, groupe, département). Lors du retrieval, on ajoute un filtre SQL ou un filtre de métadonnées pour ne remonter que les documents auxquels l'utilisateur a accès. Ça nécessite une gestion propre des ACL et une synchronisation avec le système d'identité de l'organisation.
- **Le filtrage au niveau du chunk** : plus granulaire mais plus complexe. Un même document peut contenir des sections à des niveaux de confidentialité différents (un rapport annuel avec une section "résultats financiers" réservée au comité de direction). Ça demande un enrichissement fin des métadonnées au moment du chunking.

#### Les risques spécifiques

- **La fuite indirecte** (*information leakage*) : même sans citer explicitement un document confidentiel, le LLM peut laisser transpirer des informations dans sa réponse si elles étaient présentes dans le contexte. Par exemple, "les conditions de rémunération des cadres dirigeants" pourraient influencer une réponse sur les grilles salariales, même si l'utilisateur n'a pas accès au document source.
- **L'inférence par recoupement** : un utilisateur astucieux peut poser des questions orientées pour reconstituer des informations auxquelles il n'a pas accès ("Est-ce que le budget de la direction commerciale dépasse X ?" → réponse oui/non qui fuit de l'information).
- **La conformité réglementaire** : RGPD, données de santé, secret professionnel — selon le domaine, les exigences de confidentialité peuvent imposer des contraintes techniques fortes (chiffrement des embeddings, hébergement souverain, droit à l'oubli avec suppression des vecteurs associés).

### 4.2. Coûts

Génération d'embeddings, requêtes vectorielles, reranking, appels LLM — tout a un coût marginal. Sur un assistant avec 50 utilisateurs quotidiens et un corpus de 2 000 documents, ça reste très raisonnable. Mais ça peut vite chiffrer si on ne fait pas attention.

#### Décomposition des coûts

- **Ingestion** : le coût initial de génération des embeddings est ponctuel mais non négligeable sur un gros corpus. Avec `text-embedding-3-large` d'OpenAI, compter environ 0,13 $ pour 1 million de tokens. Un corpus de 10 000 pages (~5 millions de tokens) coûte donc moins d'un dollar à indexer. Le coût explose si on réindexe fréquemment ou si on utilise un modèle d'embedding plus coûteux.
- **Retrieval** : la recherche vectorielle elle-même est peu coûteuse (requête sur index en mémoire). Le reranking via API ajoute un coût par requête (quelques centimes chez Cohere pour un lot de 100 passages).
- **Génération** : c'est le poste le plus lourd. Un appel à GPT-4o avec 4 000 tokens de contexte et 500 tokens de réponse coûte environ 0,02-0,03 $. Avec 50 utilisateurs faisant chacun 10 requêtes par jour, on arrive à ~15-30 $/jour. Passer à un modèle plus petit (GPT-4o-mini, Claude Haiku) divise la facture par 10-20 avec une qualité souvent suffisante.
- **Infrastructure** : hébergement de la base vectorielle, du backend, du frontend. Avec PostgreSQL + pgvector sur un serveur modeste, les coûts d'infrastructure restent faibles. Une base vectorielle managée (Pinecone) coûte davantage.

#### Leviers d'optimisation

La mise en cache des réponses (pour les questions fréquentes), la limitation du top-K, le choix d'un modèle de génération adapté (pas besoin d'un GPT-4o pour une FAQ simple), la compression contextuelle et la mutualisation des requêtes d'embedding (batching) deviennent rapidement des leviers essentiels. Sur certains projets, un cache sémantique (qui détecte que deux questions formulées différemment sont en fait identiques) peut réduire les coûts de 30 à 50 %.

### 4.3. Amélioration continue

Un système RAG n'est jamais "terminé". Les premières semaines après la mise en production sont les plus instructives : on découvre les questions sans réponse, les chunks mal découpés, les prompts trop lâches.

#### L'observabilité

L'observabilité est indispensable pour piloter l'amélioration continue. Les métriques clés à suivre :

- **Le taux de "je ne sais pas"** : si l'assistant refuse de répondre à plus de 20-30 % des questions, c'est que le corpus est lacunaire ou que le retrieval ne fonctionne pas bien.
- **La latence** : temps de réponse total (retrieval + génération). Au-delà de 5-10 secondes, l'expérience utilisateur se dégrade significativement.
- **Le feedback utilisateur** : pouces en l'air/en bas, commentaires libres. C'est la métrique la plus directe mais la plus difficile à obtenir en volume suffisant.
- **Les requêtes sans résultat de retrieval** : des questions pour lesquelles aucun chunk pertinent n'est remonté — signal fort d'un trou dans le corpus.
- **Les logs de requêtes et de contexte** : permettent de rejouer des cas problématiques et d'itérer sur le chunking, le retrieval ou le prompt.

Des outils comme **LangSmith** (LangChain), **Langfuse** (open source), **Arize Phoenix** ou **Traceloop OpenLLMetry** permettent de tracer l'ensemble du pipeline (requête → reformulation → retrieval → chunks sélectionnés → prompt assemblé → réponse) et de diagnostiquer les points de défaillance.

#### L'évaluation automatisée

Pour aller au-delà du feedback manuel, on peut mettre en place une évaluation automatisée avec des frameworks comme **RAGAS** (qui mesure la fidélité, la pertinence du contexte, la pertinence de la réponse) ou des jeux de tests question/réponse annotés manuellement. Ces benchmarks permettent de mesurer objectivement l'impact d'un changement (nouveau modèle d'embedding, modification du chunking, ajustement du prompt) avant de le déployer en production.

Sur un corpus de transcriptions de réunion, on peut s'attendre à itérer plusieurs fois sur le chunking avant de trouver le bon compromis. Sur un assistant RH, c'est le prompt système qui nécessite le plus d'ajustements, surtout pour gérer les cas limites (*"Est-ce que j'ai le droit de…"* → l'assistant ne doit pas donner de conseil juridique). La plateforme doit faciliter ces itérations en rendant chaque composant — chunking, retrieval, prompt — facilement ajustable et mesurable.


## Ce que j'en retiens

Concevoir un assistant documentaire, c'est un problème d'architecture logicielle à part entière. Le LLM n'est qu'une brique parmi d'autres — et probablement pas celle qui demande le plus de travail.

La qualité perçue par l'utilisateur final est l'émergence de décisions prises bien en amont : comment on découpe les documents, comment on indexe, comment on cherche, comment on assemble le contexte. C'est ce qui distingue une démo impressionnante lors d'un comité de direction d'un outil réellement utilisé au quotidien par des équipes.

Si le sujet vous intéresse et que vous voulez explorer le code, le projet [Raggae](https://github.com/jbuget/raggae) est open source. C'est une plateforme conçue pour créer, gérer et publier des agents conversationnels RAG, de l'ingestion documentaire au chat contextuel. Elle est construite en Python (FastAPI) + PostgreSQL/pgvector côté back, Next.js côté front, en Clean Architecture avec du TDD strict.

Et si vous avez des questions ou des retours d'expérience à partager, n'hésitez pas — c'est un sujet sur lequel on apprend beaucoup en confrontant les approches.
