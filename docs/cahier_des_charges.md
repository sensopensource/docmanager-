# Cahier des charges — DocManager

## 1. Presentation du projet

### 1.1 Contexte
Projet de stage realise chez **Sup MTI** sur une duree de **8 semaines**. Le projet vise a concevoir et developper un systeme de gestion documentaire avec recherche intelligente, detection d'anomalies, et resume automatique par LLM.

### 1.2 Objectif general
Developper une application web permettant a des utilisateurs de stocker, organiser, rechercher et consulter des documents (PDF, DOCX), avec :
- Un espace personnel par utilisateur
- Une recherche full-text intelligente (accents, stemming, ranking)
- Un systeme de detection d'anomalies de securite
- Un resume automatique des documents via un LLM local

### 1.3 Parties prenantes
| Role | Description |
|------|-------------|
| Stagiaire | Ayoub SOUIDI — conception, developpement, tests |
| Encadrant | Sup MTI — suivi et validation |
| Utilisateurs finaux | Tout utilisateur souhaitant gerer ses documents en ligne |

---

## 2. Analyse du systeme

### 2.1 Les trois piliers

Le systeme repose sur trois composants interconnectes :

**Pilier 1 — Gestion documentaire**
Coeur de l'application. Upload, organisation (categories hierarchiques, tags), versioning, recherche full-text et consultation de documents. Chaque utilisateur dispose d'un espace isole.

**Pilier 2 — Logs et tracabilite**
Chaque action utilisateur est tracee : upload, telechargement, suppression, recherche, connexion, modification. Les logs servent a l'historique personnel et a la surveillance admin.

**Pilier 3 — Detection d'anomalies**
Les logs sont analyses pour detecter des patterns suspects (brute force, telechargement massif, acces non autorise). 10 regles de detection definies par seuil. Voir [anomalies.md](anomalies.md) pour le detail complet.

### 2.2 Pipeline de donnees

```
Upload fichier → Extraction texte → Stockage (filesystem + BDD)
                                          ↓
                                    Indexation full-text (tsvector)
                                          ↓
                                    Recherche (ts_rank, ts_headline)

Action utilisateur → Log → Analyse → Anomalie detectee → Alerte admin

Demande resume → Envoi texte au LLM local → Stockage du resume (cache)
```

---

## 3. Identification des utilisateurs

### 3.1 Roles

| Role | Description |
|------|-------------|
| **User** | Utilisateur standard avec un espace personnel |
| **Admin** | Superviseur avec acces global |

### 3.2 Permissions User

| Domaine | Actions autorisees |
|---------|-------------------|
| Compte | S'inscrire, se connecter, modifier son profil, changer son mot de passe |
| Documents | Upload, consulter, telecharger, modifier, supprimer **ses propres documents uniquement** |
| Categories | Creer, modifier, supprimer **ses propres categories** |
| Tags | Creer des tags, les attacher/detacher de ses documents |
| Versions | Uploader une nouvelle version d'un document existant |
| Recherche | Rechercher dans **ses propres documents** uniquement |
| Historique | Voir son propre historique d'actions |
| LLM | Demander un resume de **ses propres documents** |

### 3.3 Permissions Admin

| Domaine | Actions autorisees |
|---------|-------------------|
| Tout ce que User peut faire | Applique a **tous** les utilisateurs |
| Utilisateurs | Voir la liste, modifier les roles, desactiver un compte |
| Logs | Voir les logs de **tous** les utilisateurs |
| Anomalies | Dashboard d'anomalies, filtrer par severite/code/user, marquer comme traitee |
| Systeme | Stats globales (nb users, nb docs, espace disque) |

### 3.4 Decisions explicites (V1)
- Pas de partage de documents entre utilisateurs
- Pas de creation de compte par l'admin (inscription uniquement)
- Pas de suppression de compte par l'utilisateur
**Pour la v1** 
---

## 4. Specifications fonctionnelles

### 4.1 Gestion documentaire

| Ref | Fonctionnalite | Description | Priorite |
|-----|----------------|-------------|----------|
| F-DOC-01 | Upload | Upload de fichiers PDF et DOCX avec extraction automatique du texte | Haute |
| F-DOC-02 | Metadonnees | Titre, auteur, tags, categorie associes a chaque document | Haute |
| F-DOC-03 | Versioning | Chaque re-upload cree une nouvelle version, historique conserve | Haute |
| F-DOC-04 | Categories hierarchiques | Organisation en categories et sous-categories | Moyenne |
| F-DOC-05 | Tags | Systeme de tags normalises (table dediee, many-to-many) | Moyenne |
| F-DOC-06 | Telechargement | Recuperation du fichier original (binaire) | Haute |
| F-DOC-07 | Consultation | Vue detail avec metadonnees + apercu du contenu extrait | Haute |
| F-DOC-08 | Suppression | Suppression d'un document et de toutes ses versions | Moyenne |

### 4.2 Recherche

| Ref | Fonctionnalite | Description | Priorite |
|-----|----------------|-------------|----------|
| F-SRCH-01 | Full-text search | Recherche dans le contenu extrait avec support francais (accents, stemming) | Haute |
| F-SRCH-02 | Ranking BM25 | Classement des resultats par pertinence via ts_rank_cd | Haute |
| F-SRCH-03 | Extraits surlignés | Affichage des passages pertinents via ts_headline | Haute |
| F-SRCH-04 | Filtres | Filtrage par type, auteur, categorie, tags, date | Moyenne |
| F-SRCH-05 | Historique | Sauvegarde des recherches recentes de l'utilisateur | Basse |

### 4.3 Authentification et securite

| Ref | Fonctionnalite | Description | Priorite |
|-----|----------------|-------------|----------|
| F-AUTH-01 | Inscription | Creation de compte avec email + mot de passe | Haute |
| F-AUTH-02 | Connexion | Authentification par email/mot de passe, token JWT | Haute |
| F-AUTH-03 | Isolation | Chaque utilisateur ne voit que ses propres donnees | Haute |
| F-AUTH-04 | Roles | Distinction User/Admin avec permissions differenciees | Haute |
| F-AUTH-05 | Hachage | Mots de passe haches (bcrypt ou argon2) | Haute |

### 4.4 Detection d'anomalies

| Ref | Fonctionnalite | Description | Priorite |
|-----|----------------|-------------|----------|
| F-ANO-01 | Detection par seuil | 10 regles de detection definies (voir anomalies.md) | Moyenne |
| F-ANO-02 | Dashboard admin | Interface de visualisation des anomalies detectees | Moyenne |
| F-ANO-03 | Logging | Tracage de toutes les actions utilisateur | Haute |

### 4.5 LLM — Resume automatique

| Ref | Fonctionnalite | Description | Priorite |
|-----|----------------|-------------|----------|
| F-LLM-01 | Resume a la demande | L'utilisateur demande un resume, le LLM genere et le resultat est cache | Moyenne |
| F-LLM-02 | Stockage du resume | Le resume est stocke en BDD (colonne `resume` dans Version), regenere uniquement si demande | Basse |
| F-LLM-03 | LLM local | Modele local (Mistral 7B ou equivalent) sur VPS, pas d'API externe | Moyenne |

---

## 5. Specifications techniques

### 5.1 Stack technique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Backend | FastAPI (Python) | Async, validation automatique, OpenAPI integre |
| Base de donnees | PostgreSQL 16 | Full-text search natif (tsvector, ts_rank), extensions (unaccent, pg_trgm) |
| ORM | SQLAlchemy | Mapping objet-relationnel, migrations |
| Extraction texte | pypdf + python-docx | Extraction PDF et DOCX sans dependance lourde |
| Frontend | Streamlit | Prototypage rapide, adapte au stage |
| Infrastructure | Docker + docker-compose | Isolation des services, reproductibilite |
| LLM | Ollama + Mistral 7B (ou equivalent) | Inference locale, gratuit, respect de la confidentialite |
| Authentification | JWT (python-jose) + bcrypt | Standard, stateless |

### 5.2 Architecture applicative

```
app/
├── main.py              # Point d'entree FastAPI
├── database.py          # Connexion et session BDD
├── models/              # Modeles SQLAlchemy (tables)
├── schemas/             # Schemas Pydantic (contrats API)
├── routers/             # Endpoints HTTP (orchestration)
├── services/            # Logique metier
└── middleware/           # Auth, logging, rate limiting
```

### 5.3 Architecture infrastructure

```
docker-compose.yml
├── db          (postgres:16)      — port 5432
├── backend     (FastAPI/Uvicorn)  — port 8000
├── frontend    (Streamlit)        — port 8501
└── ollama      (LLM local)        — port 11434
```

Volumes Docker :
- `postgres_data` — persistance BDD
- `documents_data` — stockage fichiers uploades
- `ollama_data` — modeles LLM telecharges

---

## 6. Contraintes

| Contrainte | Detail |
|------------|--------|
| Duree | 8 semaines |
| Formats supportes | PDF, DOCX (extensible) |
| Taille max fichier | 50 Mo |
| Langue de recherche | Francais (config french_unaccent) |
| Hebergement cible | VPS Hostinger (RAM limitee, pas de GPU) |
| Confidentialite | LLM local, pas d'envoi de donnees a des API externes |

---

## 7. Planning previsionnel

| Semaine | Objectif | Livrables |
|---------|----------|-----------|
| S1 | Analyse et conception | Cahier des charges, UML/MCD, liste anomalies |
| S2 | Infrastructure + upload | Docker, BDD, endpoint upload avec extraction |
| S3 | Recherche full-text | Endpoint recherche avec BM25, ts_headline, filtres |
| S4 | Frontend Streamlit | Interface upload, liste, recherche, consultation |
| S5 | Auth + logs | JWT, roles, middleware logging |
| S6 | Anomalies + tests | Detection, dashboard admin, tests unitaires |
| S7 | LLM + extensions | Ollama, resume a la demande, cache |
| S8 | Finalisation | Benchmark, rapport de stage, soutenance |

---

## 8. Livrables finaux

- Code source complet sur GitHub
- Documentation technique (UML, MCD, API docs via Swagger)
- Cahier des charges (ce document)
- Rapport de stage
- Application deployee sur VPS

---

## 9. References
**Dispo dans le repo**
- [Diagrammes UML et MCD](uml.md)
- [Liste des anomalies](anomalies.md)
