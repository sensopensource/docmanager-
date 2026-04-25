# Design & PRDs — DocManager

Ce dossier regroupe tout le travail de conception UI/UX du projet : spécifications d'écrans (PRDs), mockups HTML, et composants transverses.

## Structure

```
design/
├── README.md              ← ce fichier (index)
├── ecrans.md              ← liste des écrans MVP + ordre de priorité
├── prds/                  ← un PRD par écran
│   ├── 01-mes-documents.md
│   ├── 02-recherche.md
│   ├── 03-dashboard.md
│   └── 04-auth.md
├── components/            ← PRDs des composants transverses
│   ├── modal-upload.md
│   └── panel-detail.md
└── mockups/               ← maquettes HTML statiques (variations de design)
    └── slitch-v1.html     ← premier essai (style brutaliste terminal)
```

## Ordre de travail

1. Valider la liste d'écrans (`ecrans.md`)
2. Écrire les PRDs un par un dans `prds/`
3. Générer 2-3 variations de mockups dans `mockups/` une fois les PRDs prêts
4. Choisir la direction de design puis implémenter côté frontend

## État actuel

- [x] Liste des écrans définie
- [ ] PRD Mes Documents (en cours)
- [ ] PRD Recherche
- [ ] PRD Dashboard
- [ ] PRD Auth
- [ ] PRD composants (modal upload, panel détail)
- [ ] Mockups variations
