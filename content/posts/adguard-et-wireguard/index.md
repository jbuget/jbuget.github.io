---
title: "Pour surfer heureux, surfez caché"
date: "2026-01-12T14:00:00+01:00"
draft: true
categories: ["Infrastructure", "Privacy", "DevOps"]
keywords: ["Wireguard", "Adguard", "DNS", "VPN", "Privacy", "Homelab", "Hetzner", "Traefik"]
summary: "Comment j'ai construit mon infrastructure personnelle de privacy basée sur Wireguard et Adguard, hébergée sur un VPS Hetzner en Finlande."
description: "Retour d'expérience sur la mise en place d'une infra privacy complète : VPS Hetzner, Docker, Traefik, Adguard (DNS resolver), Wireguard (VPN) et bonnes pratiques anti-tracking."
---

> 🔒 **Avertissement** : Cet article documente ma démarche personnelle pour améliorer ma privacy en ligne. Je ne suis pas expert en sécurité réseau, et cette infra est adaptée à mes besoins. À adapter selon votre contexte.

## Le constat : naviguer en toute privacy, c'est devenu compliqué

Depuis quelques années, naviguer sur Internet ressemble à un parcours du combattant pour qui veut préserver sa privacy. Les trackers sont omniprésents, les régie publicitaires suivent vos moindres clics, et les données personnelles deviennent la nouvelle monnaie.

LinkedIn aspire vos données professionnelles, Google vous suit de site en site, YouTube connaît vos passions les plus secrètes, et Facebook... mieux vaut ne pas en parler.

Face à ce constat, j'ai décidé de me reprendre en main et de mettre en place une infrastructure personnelle qui me permet de naviguer de manière plus confidentielle. Pas par paranoïa, mais par principe : mes données m'appartiennent.

## L'idée : un homelab dans le cloud

Plutôt que d'avoir une infra classique chez moi (avec tous les problèmes de bande passante et de stabilité), j'ai choisi de louer un VPS. Mes critères étaient simples :

- **Un pays européen** : je voulais rester en Europe pour des raisons légales et de latence
- **Hors de France** : par curiosité et pour une diversification
- **Chez un leader européen** : confiance et réputation
- **Pas cher** : il n'y a pas besoin de beaucoup de ressources pour cette infra
- **Sérieux** : pas de petits hébergeurs farfelus

**Hetzner** en Finlande a coché toutes les cases. L'offre VPS Cloud est excellente pour le rapport qualité/prix.

## L'infrastructure : Docker, Compose et Traefik

Une fois le VPS en main, j'ai choisi une stack simple et éprouvée :

- **Docker & Docker Compose** : pour orchestrer les services
- **Traefik** : comme reverse proxy et load balancer
- **Let's Encrypt** : pour les certificats SSL/TLS automatiques
- **Adguard** : comme DNS resolver anti-tracker et anti-malware
- **Wireguard** : comme VPN pour chiffrer mon trafic et masquer mon IP réelle

L'idée était de tout faire passer derrière Traefik, avec des certificats HTTPS gérés automatiquement. Sauf Wireguard, qui a besoin de son propre port UDP et ne peut pas passer par un reverse proxy HTTP(S).

## Étape 1 : Adguard comme DNS resolver

Adguard est merveilleux. C'est un bloqueur de publicités et de trackers au niveau du DNS. Chaque demande DNS est filtrée avant même que votre navigateur ne contacte le serveur.

Au lieu de faire transiter vos requêtes DNS par Cloudflare ou Google (qui vous tracent), vous pouvez utiliser votre propre résolveur.

**Mes tentatives avec Unbound** : J'ai voulu remplacer Cloudflare par Unbound, un résolveur DNS récursif et confidentiel, mais j'ai buté sur plusieurs complications. Finalement, Adguard + Cloudflare m'a semblé être un bon compromise pour cette phase. Peut-être une prochaine étape ?

## Étape 2 : Wireguard, le VPN simple et moderne

Wireguard est un protocole VPN minimaliste, moderne, performant. Contrairement à OpenVPN, c'est du vent frais dans le monde des VPN.

La configuration est simple... en théorie. En pratique, j'ai perdu énormément de temps sur un détail bête.

### Le piège : les ports sur Hetzner

Une fois que j'ai activé le **firewall** de Hetzner (ce qui était une bonne idée pour la sécurité), j'ai complètement oublié d'ouvrir les ports nécessaires. Résultat : Wireguard répondait localement, mais aucun client externe ne pouvait se connecter.

**Morale de l'histoire** : Hetzner a deux niveaux de firewall :
1. Le firewall de la machine elle-même (iptables/ufw)
2. Le firewall au niveau du compte Hetzner (dans la console)

Ne pas oublier d'ouvrir les ports dans **les deux endroits** ! (UDP 51820 dans mon cas)

## Étape 3 : Brancher Wireguard sur Adguard

Une fois Wireguard opérationnel, j'ai configuré les clients pour utiliser Adguard comme DNS résolveur. Cela signifie :

1. Votre trafic est chiffré via Wireguard jusqu'au VPS
2. Une fois sur le VPS, Adguard filtre les demandes DNS
3. Les publicités, trackers et malwares sont bloqués avant même d'être chargés

C'est puissant. Et simple.

## Depuis plusieurs semaines : privacy en action

Depuis le **5 janvier 2026**, je navigue principalement derrière cette infra sur mon ordinateur et mon téléphone. L'expérience est transparente — vous ne voyez rien différent, mais vos données sont mieux protégées.

## Le détour par Tor : pas pour moi

Pendant mes recherches, j'ai aussi testé **Tor** et le navigateur Tor. C'est l'ultra privacy : trois relais, chiffrement en trois couches, véritable anonymat.

Mais voilà : la latence était trop gênante (500ms+), et le réseau Tor standardise intentionnellement la résolution des sites pour des raisons d'anonymat, ce qui peut causer des soucis. Tor c'est excellent pour les journalistes et activistes sous régimes autoritaires, mais pour du surf quotidien ? Ça en fait trop.

Wireguard + Adguard me suffit.

## Les options anti-tracking : Firefox et les services

En parallèle, j'ai durcis les paramètres de **Firefox** :

- `privacy.trackingprotection.enabled` : true
- Refuser les cookies tiers
- Désactiver les données de telemetry

Et dans les services que j'utilise :

- **Google** & **Gmail** : désactiver la personnalisation, les annonces ciblées
- **YouTube** : ne pas autoriser l'historique personnalisé
- **LinkedIn** : LinkedIn est un aspirateur à données — tous les paramètres de privacy activés
- **GitHub**, **Twitter** : même approche

Ce n'est pas parfait, mais ça réduit considérablement la surface d'attaque.

## Ce que j'ai appris

1. **La privacy, c'est un effort** : ce n'est pas un interrupteur on/off, c'est une série de petites décisions
2. **L'infrastructure personnelle, c'est puissant** : contrôler son DNS, son VPN, c'est fondamental
3. **Les détails tuent** : les ports Hetzner, les configurations réseau — une ligne oubliée et rien ne marche
4. **Les outils modernes existent** : Wireguard est un vrai plaisir à utiliser comparé à OpenVPN
5. **Tor c'est pas pour tout** : excellent pour l'anonymat maximal, mais overkill pour du surf classique

## Prochaines étapes

- Remplacer Cloudflare par Unbound pour un résolveur vraiment indépendant
- Explorer les options de stockage chiffré (Nextcloud, Synology)
- Peaufiner les listes de blocs Adguard
- Tester Mullvad comme alternative à Wireguard

---

**Avez-vous une infra privacy personnelle ? Des conseils pour améliorer la mienne ? N'hésitez pas à me contacter !**
