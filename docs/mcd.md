## Diagramme entite-relation (MCD)

w```mermaid
erDiagram
    UTILISATEUR {
        int id PK
        string email UK
        string nom
        string mot_de_passe_hash
        datetime date_inscription
    }

    CATEGORIE {
        int id PK
        string nom
        int parent_id FK "nullable, self-ref"
    }

    DOCUMENT {
        int id PK
        string titre
        string auteur
        datetime date_creation
        int utilisateur_id FK
        int categorie_id FK
    }

    VERSION {
        int id PK
        int document_id FK
        int numero
        string contenu
        string resume "nullable, genere par LLM"
        string storage_fichier UK
        string type_fichier
        tsvector search_vector
        datetime date_upload
    }

    ANOMALIE {
        int id PK
        string code
        int utilisateur_id FK
        string ip_address
        string description
        string severite
        datetime date_detection
    }

    LOG {
        int id PK
        int utilisateur_id FK
        string action
        string details
        string ip_address
        datetime date_action
    }

    TAG {
        int id PK
        string nom UK
    }

    DOCUMENT_TAG {
        int document_id FK
        int tag_id FK
    }

    HISTORIQUE_RECHERCHE {
        int id PK
        int utilisateur_id FK
        string requete
        int nb_resultats
        datetime date_recherche
    }

    UTILISATEUR ||--o{ DOCUMENT : "possede"
    UTILISATEUR ||--o{ HISTORIQUE_RECHERCHE : "effectue"
    UTILISATEUR ||--o{ ANOMALIE : "declenche"
    UTILISATEUR ||--o{ LOG : "genere"
    CATEGORIE ||--o{ DOCUMENT : "contient"
    CATEGORIE |o--o{ CATEGORIE : "sous-categorie de"
    DOCUMENT ||--|{ VERSION : "a"
    DOCUMENT ||--o{ DOCUMENT_TAG : ""
    TAG ||--o{ DOCUMENT_TAG : ""
```
