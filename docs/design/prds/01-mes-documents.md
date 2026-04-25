# PRD — Écran "Mes Documents"

> Écran principal de l'application : liste des documents de l'utilisateur, point d'entrée pour upload, consultation détail (slide-in), et actions IA.

---

## 1. Objectif

Offrir à l'utilisateur un point d'accès centralisé à l'ensemble de ses documents, lui permettant à la fois de les consulter (visualiser, rechercher, télécharger) et de les gérer (uploader, modifier, supprimer, analyser via l'IA). Cet écran constitue le cœur fonctionnel de l'application : sans lui, l'utilisateur n'a aucun moyen de visualiser ou d'agir sur ses fichiers stockés.

---

## 2. Utilisateur cible & contexte d'usage

**Utilisateur cible** : utilisateur unique (propriétaire du compte), non-expert en informatique, qui attend que l'application soit intuitive et fluide sans nécessiter de prise en main particulière.

**Contexte d'usage** :
- **Fréquence** : plusieurs fois par jour → l'écran doit être rapide à charger, les actions fréquentes (recherche, ouverture d'un doc) accessibles en 1-2 clics.
- **Device** : principalement laptop 13-15 pouces → design pensé desktop, responsive basique pour le MVP (mobile non prioritaire).
- **Volume** : plusieurs centaines de documents → pagination obligatoire, filtres et recherche indispensables.

**Implications de design** :
- Pas de jargon technique visible (éviter "index", "query", "parse"...) → textes en français simple.
- Vibe visuelle : "Archive.Sys / terminal hacker" (hairlines, monospace sur labels, palette sombre, accents colorés par type de fichier).
- Actions critiques (suppression) → confirmation obligatoire.
- Barre de recherche visible en permanence (jamais cachée dans un menu).
- Les 20-30 documents les plus récents doivent être visibles sans scroll excessif.

---

## 3. User stories

### Consultation
1. En tant qu'utilisateur, je veux voir la liste de tous mes documents, pour avoir une vue d'ensemble de ce que j'ai stocké.
2. En tant qu'utilisateur, je veux rechercher un document par son nom, pour retrouver rapidement un document précis afin de le consulter, télécharger, modifier ou supprimer.
3. En tant qu'utilisateur, je veux ouvrir le détail d'un document dans un panel latéral, pour consulter son contenu, ses métadonnées et l'historique de ses versions sans quitter la liste.

### Gestion
4. En tant qu'utilisateur, je veux uploader un nouveau document via un modal, pour l'ajouter à mon espace de stockage.
5. En tant qu'utilisateur, je veux télécharger la dernière version d'un document, pour y accéder depuis n'importe quel poste ou le partager hors de l'application.
6. En tant qu'utilisateur, je veux supprimer un document, pour libérer de l'espace ou mieux organiser mon drive.
7. En tant qu'utilisateur, je veux modifier les métadonnées d'un document (titre, tags, catégorie), pour mieux le référencer ou corriger une faute de frappe.

### Intelligence (IA)
8. En tant qu'utilisateur, je veux demander à l'IA de générer un résumé d'un document, pour comprendre rapidement de quoi il traite sans avoir à le lire en entier.

---

## 4. Contenu & données affichées

### A. Pour chaque document dans la liste

| Champ | Détail / règle d'affichage |
|-------|----------------------------|
| **Icône fichier** | Material Symbol selon extension, avec accent couleur subtil : rouge sombre pour PDF, bleu pour DOCX, vert pour TXT, or pour MD |
| **Titre du document** | Nom principal affiché (ex: `Q3_Report.pdf`) |
| **Type / extension** | `.pdf`, `.docx`, `.txt`, `.md`... |
| **Catégorie** | Nom du dossier parent (ex: "Projets / Q3_Deliverables") |
| **Tags** | Liste des tags associés (sous forme de chips/badges) |
| **Version actuelle** | `v3`, `v1`... numéro de la dernière version |
| **Date de dernière modif** | Date d'upload de la dernière version (format `YYYY-MM-DD HH:MM`) |
| **Aperçu résumé IA** | 1-2 lignes du résumé LLM si disponible (tronqué avec "...") |
| **Badge "AI ✓"** | Indicateur visuel si le document a déjà été analysé par l'IA |

### B. Toolbar / header de page

- **Titre de la page** : "Mes Documents" (avec sous-titre "Archive.Sys" pour la vibe)
- **Barre de recherche** : recherche par nom de document (placeholder type "QUERY INDEX...")
- **Bouton "Upload"** : ouvre le modal d'upload (bien visible, en haut à droite)
- **Filtres** : par catégorie, par tag, par date
- **Compteur** : "243 documents · 1.2 GB"
- **Tri** : par date (défaut), par nom, par taille

### C. Pagination (bas de page)

- **Numéros de page** : 1, 2, 3... avec flèches précédent / suivant
- **Sélecteur "résultats par page"** : 10 / 25 / 50 (défaut : 25)

---

## 5. Actions possibles

| # | Action | Déclencheur UI | Résultat |
|---|--------|----------------|----------|
| 1 | **Voir la liste** | Arrivée sur la page | Affichage paginé des documents de l'utilisateur, triés par date de modif desc par défaut |
| 2 | **Rechercher un document** | Saisie dans la barre de recherche (top) | Filtrage en live (debounce 300ms) sur le titre ; compteur mis à jour ; pagination réinitialisée à la page 1 |
| 3 | **Filtrer** | Clic sur un filtre (catégorie / tag / date) | Liste filtrée, badge de filtre actif visible, possibilité de cumuler plusieurs filtres ; bouton "Effacer les filtres" apparaît |
| 4 | **Trier** | Clic sur en-tête de colonne ou sélecteur de tri | Ré-ordonnancement de la liste ; indicateur visuel (flèche) sur la colonne active |
| 5 | **Ouvrir le détail** | Clic sur une ligne (ou bouton "Détails") | Panel slide-in apparaît depuis la droite, la liste reste visible à gauche (voir [panel-detail.md](../components/panel-detail.md)) |
| 6 | **Uploader un document** | Clic sur bouton "Upload" (top-right) | Modal d'upload s'ouvre (voir [modal-upload.md](../components/modal-upload.md)). Après succès : document ajouté en tête de liste, toast de confirmation |
| 7 | **Télécharger** | Clic sur icône download dans la ligne ou dans le panel détail | Déclenchement du téléchargement de la dernière version du fichier |
| 8 | **Supprimer** | Clic sur icône poubelle → modal de confirmation | Confirmation obligatoire ("Êtes-vous sûr ?"). Après validation : document retiré de la liste, toast "Document supprimé" avec option "Annuler" pendant 5s |
| 9 | **Modifier métadonnées** | Clic sur icône crayon ou depuis le panel détail | Ouverture d'un mode édition inline (ou dans le panel) : titre, tags, catégorie modifiables ; validation par touche Entrée ou bouton "Enregistrer" |
| 10 | **Analyser par l'IA** | Clic sur icône ✨ (auto_awesome) dans la ligne ou panel détail | Lancement analyse IA ; spinner pendant le traitement ; à la fin : résumé affiché dans la ligne + badge "AI ✓" ajouté |
| 11 | **Naviguer pagination** | Clic sur numéro de page / flèches | Chargement de la page correspondante, scroll top automatique |

---

## 6. États de l'écran

### État Vide (aucun document)
- Icône centrale grande (ex: `inventory_2` vide)
- Message : "Votre archive est vide."
- Sous-message : "Uploadez votre premier document pour commencer."
- Bouton CTA principal : "Uploader un document" (ouvre le modal)

### État Chargement
- Skeleton rows (lignes grisées animées) à la place de la liste pendant le fetch initial
- Pas de bloquant écran : la toolbar reste interactive (recherche, upload)

### État Erreur (échec chargement)
- Bannière rouge discrète en haut de la zone liste
- Message : "Impossible de charger vos documents."
- Bouton "Réessayer" qui relance le fetch

### État Résultat vide (après recherche/filtre)
- Message : "Aucun document ne correspond à votre recherche."
- Sous-message : "Essayez d'autres mots-clés ou effacez les filtres."
- Bouton "Effacer les filtres"

### État Nominal (documents présents)
- Liste paginée complète avec tous les éléments décrits en section 4
- Interactions fluides, pas de latence perçue > 200ms

---

## 7. Critères d'acceptation

- [ ] L'utilisateur voit la liste de ses documents dès l'arrivée sur la page (ou un état vide si aucun doc).
- [ ] La barre de recherche filtre la liste en temps réel (debounce 300ms).
- [ ] Les 4 types de fichiers (PDF, DOCX, TXT, MD) sont distinguables visuellement par leur icône et leur accent couleur.
- [ ] Le clic sur une ligne ouvre le panel détail slide-in sans perdre le contexte (la liste reste visible à gauche).
- [ ] Le bouton "Upload" est visible en permanence et ouvre le modal d'upload.
- [ ] La pagination fonctionne : navigation entre pages, changement du nombre de résultats par page.
- [ ] Les filtres (catégorie, tag, date) sont combinables et un bouton "Effacer" les réinitialise.
- [ ] La suppression d'un document demande confirmation, et propose une annulation (undo 5s).
- [ ] Les 4 états (vide, chargement, erreur, résultat vide) sont tous designés et fonctionnels.
- [ ] L'écran reste fluide avec plusieurs centaines de documents (pas de freeze, pagination obligatoire).
- [ ] L'identité visuelle "Archive.Sys" est respectée (hairlines, monospace labels, accents colorés).

---

## 8. Questions ouvertes / décisions à prendre

- **Vue liste vs vue grille** : pour le MVP, on part sur une **vue liste (table)** uniquement, dans l'esprit Slitch. Vue grille éventuelle en V2.
- **Sélection multiple** : pour le MVP, actions unitaires uniquement (pas de "supprimer 10 docs d'un coup"). Multi-sélection en V2.
- **Partage entre utilisateurs** : hors scope MVP (utilisateur unique).
- **Aperçu du document** : le contenu du fichier (preview PDF/DOCX dans le panel détail) → à préciser dans le PRD du composant Panel Détail. Pour le MVP, probablement un simple affichage du résumé IA + métadonnées, sans viewer PDF intégré.
- **Historique des versions** : affichage dans le panel détail uniquement (liste chronologique, clic = download de cette version). Restauration / rollback = V2.
- **Position du bouton Upload** : top-right de la toolbar (convention SaaS) OU bouton flottant en bas à droite (FAB) ? → à tester dans les mockups.

---

## 9. Liens

- Composants utilisés :
  - [Modal Upload](../components/modal-upload.md) (PRD à écrire)
  - [Panel Détail Document](../components/panel-detail.md) (PRD à écrire)
- Mockup de référence (vibe) : [mockups/slitch-v1.html](../mockups/slitch-v1.html)
- Liste globale des écrans : [ecrans.md](../ecrans.md)
- Endpoints API : à documenter une fois le backend finalisé (hors scope de ce PRD)
