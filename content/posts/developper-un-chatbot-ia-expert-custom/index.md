---
date: 2025-10-05T09:02:00+02:00
draft: true
params:
  author: Jérémy Buget
title: Développer un agent IA custom
---

## Table des matières

- [Introduction](#introduction)
- [TL;DR](#tldr)
- [Objectifs](#objectifs)
- [Cas d'usage](#cas-dusage)
- [Conditions opérationnelles et matérielles](#conditions-opérationnelles-et-matérielles)
- [Collecte de données](#collecte-de-données)
- [Indexation vectorielle](#indexation-vectorielle)
  - [1. Choix du système de gestion de base de données (SGBD)](#1-choix-du-système-de-gestion-de-base-de-données-sgbd)
  - [2. Création de la base + table](#2-création-de-la-base--table)
  - [3. Insertion des documents](#3-insertion-des-documents)
    - [3.a) Ollama + `nomic-embed-text:v1.5` = failure ❌](#3a-ollama--nomic-embed-textv15--failure-)
    - [3.b) Sentence Transformer + `nomic-ai/nomic-embed-text-v2-moe` = success ✅](#3b-sentence-transformer--nomic-ainomic-embed-text-v2-moe--success-)
- [Prompting et génération de réponse](#prompting-et-génération-de-réponse)
- [IHM](#ihm)
- [Conclusion](#conclusion)

## Introduction

Comme tout le monde, j'ai intégré et continue d'incorporer de plus en plus de pratiques, raisonnements et outils IA dans mon quotidien, pro ou perso : **agents conversationnels** (ChatGPT, Gemini) pour comprendre des choses et générer / améliorer du contenu ; **compagnons techniques** (Codex, Claude Code, Zed) pour m'aider à produire et gérer du code ; **algorithmes et modèles** (LLM, OCR, STT/TTS) pour réaliser des tâches relativement compliquées ou rébarbatives comme extraire, modifier ou transformer des informations sous toutes les formes.

Savoir utiliser cette technologie et ce qu'elle implique me paraît désormais une compétence professionnelle essentielle, quel que soit le métier en question, relatif à l'informatique ou non. En tant que développeur, j'ai cherché à aller un cran plus loin et exploré comment concevoir et produire un outil exploitant l'IA *dans* et *pour* un domaine fonctionnel particulier.

C'est ainsi que j'ai réalisé un petit chatbot capable d'interroger un corpus prédéfini de documents spécifiques pour élaborer des réponses sourcées, dans la limite du champs défini.

## TL;DR

- J'ai développé un chatbot IA spécialisé dans le domaine de l'inclusion socio-professionnelle
- Cet agent se base sur un corpus de documents issus du site [La communauté de l'inclusion](https://communaute.inclusion.gouv.fr/)
- J'ai démarré un serveur Ollama avec le modèle open-weight de OpenAI : `gpt-oss:20b`
- J'ai codé **un script de crawling** (en Node.js, avec Cheerio.js) pour récupérer des fiches d'information
- J'ai installé **une base de données PostgreSQL** et activé l'extension **pgvector**
- J'ai déclaré une base avec une table disposant d'une colonne de type `embedding VECTOR(768)`
- J'ai vectorisé ces fiches grâce à la lib python **Sentence Transformers** (768 dimensions) et au modèle `nomic-ai/nomic-embed-text-v2-moe`
- J'ai indexé les embeddings obtenus dans la base PG
- J'ai développé **une API (Python/FastAPI)** pour mobiliser les différentes briques IA (query + RAG) sollicitées
- Lorsqu'un utilisateur interroge le chatbot, son prompt est à son tour vectorisé pour effectuer une recherche par comparaison de vecteurs. On obtient ainsi un ensemble de "documents sources" correspondants (avec un pourcentage de pertinence)
- Je passe alors ces documents comme éléments exclusifs de "contexte" dans l'instruction que soumets au **LLM responsable de la génération de la réponse** (en interrogeant `/api/chat` de l'API exposée par Ollama)
- Je passe aussi au LLM les autres (précédents) messages de la conversation en cours
- J'ai développé **une webapp chatbot-like** toute simple pour poser des questions et afficher les réponses
- Le code source est disponible sur GitHub : [jbuget/ia-custom-chatbot](https://github.com/jbuget/ia-custom-chatbot)

![Capture d'écran du chatbot (question + réponse)](chatbot_inclusion_pmsmp-definition.png)


## Objectifs

Mon objectif, à travers ce POC (proof of concept), était de **comprendre comment exploiter l'IA d'un point de vue véritablement métier, plus seulement comme outil de production ou aide à la création**. Je souhaitais aussi découvrir les solutions envisageables, évaluer leur potentiel et me confronter à leurs limites / contraintes.

Concrètement, je voulais concevoir une API / webapp capable de d'interagir (écouter et répondre) en langage naturel, avec des utilisateurs spécifiques d'un domaine, pour répondre le plus précisément à des questions métier, en s'appuyant et en citant des sources que j'aurais au préalable collectées et indexées.

## Cas d'usage

J'ai pas mal cherché sur quel champs fonctionnel baser le projet.

Ayant beaucoup œuvré dans le service public ces dernières années, j'ai d'abord creusé du côté de [data.gouv.fr](https://data.gouv.fr). S'il y a énormément de données rendues accessibles par les administrations, les collectivités et leurs partenaires, la plupart des datasets sont des données fortement structurées, en colonnes. Pour mon cas d'usage, je souhaitais de la données moins structurées, à base de contenu et textes riches.

Je me suis tourné vers les sites et plateformes de datasets, comme [Kaggle](https://www.kaggle.com/datasets). Mais là encore, c'était beaucoup de données structurées, de qualité à géométrie vraiment variable.

Je pense qu'on retrouve ce type de données précieuses en entreprise, et qu'il faut pouvoir les intégrer et en tenir compte lors de requêtes utilisateurs, mais dans le cadre de mon projet d'IA, je voulais vraiment mettre l'accent sur l'exploitation de documents bruts.

Finalement, j'ai eu l'idée de m'appuyer sur les fiches d'information publiées sur le site de [La communauté de l'inclusion](https://communaute.inclusion.gouv.fr), pour **proposer un agent conversationnel expert dans le domaine de l'insertion socio-professionnelle**.

J'ai cherché à obtenir un chatbot capable de répondre à des questions sur l'IAE, les PMSMP et d'aider les professionnels de l'inclusion dans leur accompagnement de demandeurs d'emploi.

![La communauté de l'inclusion](communaute_inclusion.png)


## Conditions opérationnelles et matérielles

J'ai conçu, développé et exécuté le programme exclusivement en local sur ma machine.

> 💻 Il s'agit d'un Macbook Pro M2 Max, 64Go RAM, 12 cœurs, sans carte graphique / GPU.

Je me suis fixé comme contrainte de n'utiliser **que des modèles open-weight et des logiciels / briques open-source**.

J'ai ainsi utilisé [Ollama](https://ollama.com/) comme serveur de modèles IA ouverts (thinking, embedding, vision, etc.).


## Collecte de données

La communauté de l'inclusion est une plateforme communautaire en ligne d'espaces de discussion sur des sujets relatifs à l'insertion socio-professionelle. On y trouve des "forums" et des "topics". On y trouve surtout des "fiches pratiques" officielles, éditées et maintenues par la Plateforme de l'inclusion (PDI), de très grande qualité (fond, forme, fraîcheur).

Le point de départ de mon projet IA a donc consisté à récupérer ces fameuses fiches d'information. Malheureusement, la PDI ne diffuse pas ces informations en open content sur data.gouv.fr.

Je n'ai pas eu d'autre choix que de développer un petit programme (en Node.js / TypeScript) pour crawler/scrapper les données directement depuis le site web. Les sources sont disponibles sur GitHub : [jbuget/crawler](https://github.com/jbuget/meilisearch-crawler/blob/main/src/crawler.ts).

Je me suis contenté de récupérer les fiches pratiques, pas les questions / réponses, car beaucoup de questions ne sont pas réellement pertinentes ou directement corrélées au domaine, contiennent des données personnelles, ne sont pas répondues ou sont des redites ou pointeurs vers les fiches pratiques.

C'est ainsi que j'ai obtenu un fichier JSON avec les URLs des fiches pratiques et le contenu textuel (HTML → texte) des pages (merci Cheerio.js). Soit un corpus, en français, de près d'un millier de documents.

```JSON
// data/topics.json

[
  {
    "id": "12513c26d6e647fc537447aad16bd9337988933bd44f0517cd3c0767b3f9bde0",
    "url": "https://communaute.inclusion.gouv.fr/forum/fiche-pratique-cellule-alerte-inclusion-163/",
    "title": "Fiche pratique Cellule-alerte-inclusion",
    "subtitle": "Vous êtes intervenant social ou bénévole et vous estimez qu’une personne que vous suivez devrait bénéficier du dispositif de plafonnement des frais bancaires ou de l’offre spécifique clientèle fragile ? Vous accompagnez une personne dépourvue de compte bancaire ? Vous pouvez saisir la cellule alerte inclusion.",
    "content": "- lien vers la page de présentation sur banque-france.fr\n\n- lien vers le flyer de présentation"
  },
  {
    "id": "aa946e302c55270dffd388b3f289a443727651ad69df3c47d9adc3bcbddd9f09",
    "url": "https://communaute.inclusion.gouv.fr/forum/m%C3%A9mo-de-vie-prot%C3%A9ger-vos-documents-et-vos-t%C3%A9moignages-162/",
    "title": "Mémo de vie - Protéger vos documents et vos témoignages",
    "subtitle": "La plateforme Mémo de Vie est destinée à toute personne victime de violences sans distinction de genre, ni de sexe et en questionnement sur des violences subis.",
    "content": "lien vers memo-de-vie.org"
  },
  {
    "id": "e7ff95de2617b05b7e1ed0fbe059d5436029e8c4a964b782e5a8ef2e5deb6939",
    "url": "https://communaute.inclusion.gouv.fr/forum/outils-de-pr%C3%A9vention-prostitution-jeunes-161/",
    "title": "Outils de Prévention Prostitution Jeunes",
    "subtitle": "Conçu par l’Amicale du Nid. Ses objectifs : sensibiliser les jeunes à la question de la prostitution, prévenir les risques prostitutionnels, informer sur les droits et le fait qu’un accompagnement est possible pour sortir de la prostitution.",
    "content": "lien vers la médiathèque jenesuispasavendre.org"
  },
  ...
]
```


## Indexation vectorielle

Une fois la collecte des données réalisées, il a fallu les déverser de façon appropriée "quelque part" (spoiler alert : dans une base de données).

### 1. Choix du système de gestion de base de données (SGBD)

Ces derniers temps, j'ai beaucoup joué avec **Typesense** ou **Meilisearch**. Ces deux solutions sont des moteurs de recherche (textuelle) intégrant de la recherche vectorielle pour des usages IA. Il existe des bases de données spécialisées dans la recherche vectorielle comme **ChromaDB** (open-source, self-hostable ou SaaS), **Pinecone** (SaaS), **Qdrant** (open-source, self-hostable ou SaaS), **Weaviate** (open-source, self-hostable ou SaaS) ou **Milvus** (open-source, self-hostable ou SaaS).

Dans la mesure où j'ai relativement peu de documents et que mon serveur (c-à-d ma machine) ne dispose pas de capacités GPU, j'ai préféré opter pour la solution **PostgreSQL + extension `pgvector`**, a priori adaptée pour des volumes et besoins de taille moyenne.

### 2. Création de la base + table

À l'initialisation de la base (script init.sql), j'ai commencé par activer l'extension pgvector.

Puis, j'ai créé la table "topics" avec une colonne "embedding".
Dans la mesure où j'exécute le système sur mon poste, j'ai opté pour une configuration moyenne à 768 dimensions.
Il semble pertinent de cibler 1536 dimensions pour du requêtage plus fin.

> ⚠️ Il faut bien faire attention à retenir ce dimensionnement (768) lors du requêtage de données côté back-end.

Enfin, j'ai déclaré un index `idx_topics_embedding` pour optimiser les requêtes.

```sql
-- data/init.sql

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE topics (
    id bigserial PRIMARY KEY,  
    embedding VECTOR(768), 
    title TEXT,
    subtitle TEXT,
    content TEXT,
    url TEXT UNIQUE
);

CREATE INDEX idx_topics_embedding ON topics USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
```

### 3. Indexation des documents

L'indexation d'un document dans la base de données se passe comme suit :

* on exécute un calcul de *vectorisation* (via un LLM) du contenu textuel du document
* on insère dans la table topics une nouvelle entrée avec les champs structurés `url`, `title`, `subtitle` ainsi que le champs vectorisé `embedding` 
* le requêtage de documents se fait alors en comparant le vecteur du prompt (obtenu via le même modèle, à la volée) et les différents vecteurs stockés en base

C'est ici que j'ai rencontré des soucis de pertinence des résultats et qu'il m'a fallu considérer deux approches / types de modèles de vectorisation.


#### 3.1) Vectorisation des topics

Dans un premier temps, j'ai fait appel à l'API de Ollama [`/api/embeddings`](https://docs.ollama.com/api#generate-embedding). – dont le modèle sous-jacent par défaut est [`nomic-embed-text:v1.5`](https://ollama.com/library/) – pour obtenir des vecteurs (a.k.a. "embeddings") de chaque document (rappel : des *topics*). Ça a semblé fonctionné techniquement, mais à l'usage (requêtage), je trouvais les résultats insatisfaisants. 

Certaines questions invoquaient les bons documents, mais beaucoup d'autres, notamment celles tournant autour d'acronymes ("PMSMP", "IAE", "CIP"), ne remontaient aucun documents correspondants. Les réponses formulées par la partie RAG (cf. ci-dessous) n'étaient donc pas très pertinentes ni exploitables pour de vrais utilisateurs. "Shit in, shit out".

J'ai tenté avec plusieurs dimensionnements (1536) et modèles d'embedding proposés par Ollama (comme `mxbai-embed-large` (mars 2024)), mais aucun ne me donnait satisfaction. J'ai alors décidé de générer moi-même les vecteurs de chaque topic.

> 💡 En rédigeant cet article, je découvre que Ollama propose maintenant un modèle d'embedding plus puissant (et un peu plus lourd) : [bge-m3](https://ollama.com/library/bge-m3). Peut-être aurait-il fait l'affaire.

Pour cela, j'ai utilisé la bibliothèque Sentence Transformers (a.k.a. [SBERT](https://www.sbert.net/)), avec l'évolution du modèle standard de Ollama : [`nomic-embed-text-v2-moe`](todo), lequel implémente le concept de [Mixtures of Experts](https://huggingface.co/blog/moe).

```python
# data/load_topics_with_embeddings.py

model = SentenceTransformer(
            model_name="nomic-ai/nomic-embed-text-v2-moe",
            device="cpu",
            trust_remote_code="true",
        )

text = [
    part.strip()
    for part in (
        topic.get("title", ""),
        topic.get("subtitle", ""),
        topic.get("content", ""),
    )
    if isinstance(part, str) and part.strip()
]

vector = model.encode(
            text,
            convert_to_numpy=True,
            normalize_embeddings=False,
            show_progress_bar=False,
        ).tolist()

# ...

return [float(value) for value in vector]
```

> 💡 Lors du tout premier appel à Sentence Transformers, celui-ci doit télécharger le modèle indiqué dans le client, ce qui peut prendre quelques minutes.

C'est ainsi que pour chaque topic, j'ai obtenu un vecteur propre calculé depuis les propriétés concaténées `title` + `subtitle` et `content` :

```python
# Input
title : "Fiche pratique Cellule-alerte-inclusion"
subtitle : "Vous êtes intervenant social ou bénévole et vous estimez qu’une personne que vous suivez devrait bénéficier...""
content : "- lien vers la page de présentation sur banque-france.fr\n\n- lien vers le flyer de présentation..."

# Output
embedding : [-0.0030780921,-0.03730278,0.0012224227,0.001161514,-0.008647267,0.0004938656,-0.036171958,0.02440677,... (x760)]
```

#### 3.2) Insertion des documents en base

Une fois les vecteurs calculés, il ne restait plus qu'à enregistrer les données en base, avec un simple `INSERT INTO ... VALUES` :

```python
# data/load_topics_with_embeddings.py

def reset_and_insert_topics(
    conn: psycopg.Connection, payload: list[tuple[object, object, object, object, object]]
) -> int:
    with conn.cursor() as cur:
        cur.execute("TRUNCATE TABLE topics RESTART IDENTITY CASCADE")
        if payload:
            cur.executemany(
                """
                INSERT INTO topics (title, subtitle, content, url, embedding)
                VALUES (%s, %s, %s, %s, %s)
                """,
                payload,
            )

    return len(payload)
```

Nous obtenons alors ce type d'objets en base : 

```shell
chatbot=> select id, url, title, embedding from topics where url='https://communaute.inclusion.gouv.fr/forum/fiche-pratique-cellule-alerte-inclusion-163/';

-[ RECORD 1 ]-
id          | 47
url         | https://communaute.inclusion.gouv.fr/forum/fiche-pratique-cellule-alerte-inclusion-163/
title       | Fiche pratique Cellule-alerte-inclusion
subtitle    | Vous êtes intervenant social ou bénévole et vous estimez qu’une personne que vous suivez devrait bénéficier...
embedding   | [-0.0030780921,-0.03730278,0.0012224227,0.001161514,-0.008647267,0.0004938656,-0.036171958,0.02440677,... (x760)]
```

À ce stade, tout était prêt pour enfin passer aux choses sérieuses : développer une API exploitant la recherche vectorielle et formulant une réponse RAG sur la base et limitée aux documents résultants.

## Prompting et génération de réponse

## IHM

## Conclusion

