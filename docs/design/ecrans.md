# Écrans MVP — DocManager

## Liste validée

| # | Écran | Type | Priorité PRD |
|---|-------|------|--------------|
| 1 | Mes Documents | Page | 🎯 1er (cœur de l'app) |
| 2 | Recherche Intelligente | Page | 🔍 2e (feature différenciante) |
| 3 | Dashboard / Home | Page | 📊 3e |
| 4 | Login / Register | Page | 🔐 4e |

## Composants transverses

| Composant | Déclenché depuis | PRD |
|-----------|------------------|-----|
| Modal Upload | Bouton dans "Mes Documents" (et Dashboard) | [components/modal-upload.md](components/modal-upload.md) |
| Panel Détail Document (slide-in) | Clic sur un document dans liste / résultats recherche | [components/panel-detail.md](components/panel-detail.md) |

## Décisions de design

- **Upload** : pas d'écran dédié, juste un bouton bien placé qui ouvre un **modal**
- **Détail document** : **panel slide-in depuis la droite**, pas une page full
- **5 écrans principaux → réduits à 4** (upload fusionné dans modal)

## Hors MVP (plus tard)

- Profil utilisateur / Settings
- Admin / multi-users
- Partage / permissions entre utilisateurs
