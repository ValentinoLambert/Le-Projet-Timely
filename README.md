# Timely - Gestionnaire de Temps et de Productivité

Timely est une application web moderne de suivi du temps et de gestion d'activités, conçue pour optimiser la productivité quotidienne. Elle permet aux utilisateurs de planifier leurs objectifs, de suivre le temps passé sur divers projets et d'analyser leurs performances via des rapports détaillés.



## Auteurs

* Andrieu Paul
* Valentino Lambert

## Fonctionnalités Principales

### Tableau de Bord et Suivi en Temps Réel
* Chronomètre dynamique permettant de suivre l'activité en cours.
* Synchronisation du timer entre le widget principal et le bandeau de navigation.
* Gestion des notes d'activité avec support du format Markdown pour une organisation structurée.
* Historique des activités de la journée avec affichage des durées.

### Gestion des Objectifs Journaliers
* Définition des priorités pour la journée en cours.
* Calcul automatique du taux de complétion des objectifs.
* Support complet du Markdown pour les descriptions détaillées des objectifs.
* Possibilité de masquer ou d'afficher les objectifs déjà terminés.

### Rapports et Statistiques
* Visualisation des données via des graphiques interactifs (Chart.js).
* Répartition du temps par projet et par type d'activité.
* Filtrage des données par période personnalisée et par projet.
* Liste exhaustive et paginée des entrées de temps pour une analyse précise.

### Administration et Paramètres
* Gestion complète des projets et des catégories d'activités (CRUD).
* Personnalisation des couleurs pour chaque type d'activité.
* Activation ou désactivation des projets/activités pour garder une liste propre.
* Gestion du profil utilisateur (nom et email).

## Architecture Technique

L'application repose sur un stack technologique moderne assurant performance et maintenabilité :
* Framework : Vue 3 (Composition API)
* Gestion d'état : Pinia (avec plugin de persistance pour l'authentification)
* Navigation : Vue Router
* Styles : CSS moderne avec variables et design responsive (Mode Sombre)
* API : Axios pour les communications avec le backend REST
* Graphiques : Chart.js / vue-chartjs
* Rendu Markdown : Marked.js
* Notifications : Vue3-Toastify

## Installation et Lancement

### Prérequis
* Node.js (version 16 ou supérieure)
* npm

### Installation des dépendances
```bash
npm install
```

### Lancement en mode développement
```bash
npm run dev
```

L'application sera accessible par défaut à l'adresse http://localhost:5173.

## Structure du Projet

* `src/stores` : Logique de gestion de l'état (Authentification, Projets, Activités, Objectifs, Entrées de temps).
* `src/views` : Pages principales de l'application (Dashboard, Stats, Paramètres, Auth).
* `src/components` : Composants réutilisables (Tracker, Liste d'objectifs).
* `src/plugins` : Configuration d'Axios et des dépendances tierces.
* `src/directives` : Directives Vue personnalisées (ex: formatage des dates).

## Documentation du Code

Le code source est intégralement documenté en français via JSDoc, expliquant chaque fonction, paramètre et logique métier complexe.
