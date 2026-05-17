import anthropic
from sqlalchemy.orm import Session

from app.core.config import ANTHROPIC_API_KEY
from app.models.categories import Categorie
from app.services import categorie_service
from app.models.suggestions import Suggestion
from app.models.documents import Document
from app.models.tags import Tag
from app.services import document_service, tag_service
from datetime import datetime, timezone

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def collect_context(db: Session, id_utilisateur: int) -> list[dict]:
      documents = categorie_service.list_documents_visibles_pour_agent(db, id_utilisateur)

      categories = db.query(Categorie).filter(Categorie.id_utilisateur == id_utilisateur).all()

      cat_par_id = {}
      for c in categories:
        cat_par_id[c.id] = c.nom

      contexte = []
      for doc in documents:

          derniere_version = max(doc.versions, key=lambda v: v.numero)

          if derniere_version.resume_llm:
              contenu = f"Résumé : {derniere_version.resume_llm}"
          else:
              contenu = f"Extrait : {derniere_version.contenu[:500]}"

          contexte.append({
              "id": doc.id,
              "titre": doc.titre,
              "auteur": doc.auteur,
              "categorie_id": doc.id_categorie,
              "categorie": cat_par_id.get(doc.id_categorie),
              "tags": [t.name for t in doc.tags],
              "type_fichier": derniere_version.type_fichier,
              "date_creation": doc.date_creation.isoformat() if doc.date_creation else None,
              "date_dernier_upload": derniere_version.date_upload.isoformat() if derniere_version.date_upload else None,
              "contenu": contenu,
          })

      return contexte


def collect_categories(db: Session, id_utilisateur: int) -> list[dict]:
    categories = db.query(Categorie).filter(Categorie.id_utilisateur == id_utilisateur,
                                            Categorie.privee.is_(False)).all()
    categories_list = []
    for c in categories:
        categories_list.append({"id": c.id, "nom": c.nom,"parent_id": c.id_parent})
    return categories_list


SUGGESTIONS_TOOL = {"name": "submit_suggestions",
                    "description": "Soumet les suggestions d'organisation à l'utilisateur.",
                    "input_schema": {"type": "object",
                                     "properties": {"suggestions": {"type": "array",
                                                                    "maxItems": 5,
                                                                    "items": {"type": "object",
                                                                              "properties": {"type": {"type": "string",
                                                                                                      "enum": ["regroupement", "suppression", "tag"],},
                                                                                             "explication": {"type": "string",
                                                                                                             "description": "1-2 phrases expliquant pourquoi cette suggestion.",},
                                                                                             "document_ids": {"type": "array",
                                                                                                              "items": {"type": "integer"},},
                                                                                             "categorie_cible_id": {"type": ["integer", "null"],
                                                                                                                    "description": "Pour 'regroupement' : id d'une categorie existante, ou null pour en creer une nouvelle.",},
                                                                                             "categorie_cible_nom": {"type": ["string", "null"],
                                                                                                                    "description": "Pour 'regroupement' : nom de la categorie (existante ou a creer).",},
                                                                                             "tag_name": {"type": ["string", "null"],
                                                                                                          "description": "Pour 'tag' : nom du tag a ajouter.",},},
                                                                     "required": ["type", "explication", "document_ids"],},}},
                     "required": ["suggestions"],},}

PROMPT_SYSTEME = """

Tu es l'assistant d'organisation de Senso.Drive, un système de gestion
de documents personnels. Ton rôle est d'analyser la bibliothèque de
documents de l'utilisateur et de proposer des actions concrètes pour
mieux l'organiser.

Tu peux proposer 3 types de suggestions :

1. REGROUPEMENT : créer une nouvelle catégorie (ou utiliser une catégorie
   existante via son id) pour rassembler des documents DIFFÉRENTS qui
   parlent du même sujet et qui sont actuellement éparpillés.
   - Minimum 2 documents.
   - Les documents doivent être DISTINCTS dans leur contenu — c'est leur
     thématique commune qui justifie le regroupement, pas leur similarité
     textuelle.
   - Si les documents ont un contenu très proche (versions, brouillons,
     doublons), ce n'est PAS un regroupement, c'est une SUPPRESSION.

2. SUPPRESSION : identifier des documents en doublon ou quasi-doublon
   (≥ 90% similaires sur le contenu, ou versions oubliées du même
   fichier, ou brouillons d'un même document final). Les documents
   seront mis en corbeille (réversible), pas supprimés définitivement.
   - C'est l'action correcte dès que tu détectes de la redondance, même
     partielle, entre les documents concernés.

3. TAG : suggérer d'ajouter un tag commun à un groupe de documents
   qui partagent une caractéristique transversale (ex : "urgent",
   "2024", "client X").
   - Le tag traverse plusieurs catégories — il ne remplace PAS un
     regroupement par sujet.

Règle de discrimination entre les types (à appliquer dans l'ordre) :
- Si les documents se ressemblent fortement (mêmes titres, contenus
  redondants, versions multiples) → SUPPRESSION.
- Sinon, s'ils parlent du même sujet mais sont indépendants
  → REGROUPEMENT.
- Sinon, s'ils partagent juste un attribut transversal → TAG.
- Sinon → ne propose rien.

Règles strictes :
- Tu ne proposes que des suggestions à HAUTE confiance. Dans le doute,
  tu ne proposes rien (liste vide acceptée).
- Maximum 5 suggestions par analyse.
- Un même document ne doit apparaître que dans UNE seule suggestion par
  analyse (jamais à la fois dans un regroupement et une suppression, ni
  dans deux regroupements concurrents).
- Pour chaque suggestion, fournis une explication courte (1-2 phrases)
  qui sera montrée à l'utilisateur. L'explication doit être COHÉRENTE
  avec le type choisi : si tu écris "doublons" ou "quasi-doublons" dans
  l'explication, le type DOIT être "suppression".
- Ne propose JAMAIS un REGROUPEMENT si tous les documents concernés
  sont DÉJÀ dans la même catégorie (regarde le champ "categorie_id" de
  chaque document). Dans ce cas, il n'y a rien à regrouper.
- Ne propose JAMAIS un TAG si tous les documents partagent déjà un tag
  qui couvre l'attribut transversal en question.
- Ne propose JAMAIS de toucher aux documents que tu n'as pas reçus
  dans le contexte (ils peuvent être privés).

Tu reçois la liste des documents au format :
[
  { "id": 5, "titre": "...", "auteur": "...", "categorie": "...",
    "tags": [...], "date_creation": "...", "contenu": "Résumé : ..." },
  ...
]

Utilise l'outil submit_suggestions pour répondre.

                 """


def call_agent(documents: list[dict], categories: list[dict]) -> list[dict]:

    user_message = ( f"Voici la bibiliotheque de l'utilisateur:\n\n"
                     f"Documents : {documents}\n\n"
                     f"Catégories : {categories}\n\n"
                     f"Analyse cette bibliotheque et propose jusqu'a 5 suggestions via l'outil submit_suggestions "
                     f"pour aider l'utilisateur a mieux organiser sa bibliotheque. "
                     f"Si rien ne justifie une suggestion a haute confiance, renvoie une liste vide.")

    response = client.messages.create(model="claude-haiku-4-5-20251001",
                                      max_tokens=3333,
                                      system= PROMPT_SYSTEME,
                                      tools=[SUGGESTIONS_TOOL],
                                      tool_choice={"type":"tool","name":"submit_suggestions"},
                                      messages=[{"role": "user", "content": user_message}])

    for block in response.content:
        if block.type == "tool_use" and block.name == "submit_suggestions":
            return block.input["suggestions"]

    return []


def jaccard(set1: set, set2: set) -> float:
    intersection = set1 & set2
    union = set1 | set2
    if not union:
        return 0.0
    return len(intersection) / len(union)


def filtrer_suggestions_refusees(db: Session,id_utilisateur: int, nouvelles_suggestions: list[dict]) -> list[dict]:
    suggestions_refusees = ( db.query(Suggestion)
                               .filter(Suggestion.id_utilisateur == id_utilisateur,
                                       Suggestion.statut == "refusee")
                               .all() )
    suggestions_a_retenir = []
    for n_s in nouvelles_suggestions:
        a_rejeter = False
        for s_r in suggestions_refusees:
            if n_s["type"] != s_r.type:
                continue
            score = jaccard(set(n_s["document_ids"]), set(s_r.payload["document_ids"]))
            if score >= 0.7:
                a_rejeter = True
                break
        if not a_rejeter:
            suggestions_a_retenir.append(n_s)
    return suggestions_a_retenir


def _enrichir_payload(suggestion: Suggestion, db: Session) -> dict:
    doc_ids = suggestion.payload.get("document_ids", [])

    documents = ( db.query(Document)
                    .filter(Document.id.in_(doc_ids),
                            Document.id_utilisateur == suggestion.id_utilisateur)
                    .all() )

    cat_ids = { d.id_categorie for d in documents if d.id_categorie is not None }
    noms_categories = {}
    if cat_ids:
        rows = db.query(Categorie.id, Categorie.nom).filter(Categorie.id.in_(cat_ids)).all()
        noms_categories = { id_: nom for id_, nom in rows }

    docs_par_id = {}
    for doc in documents:
        derniere = document_service.get_latest_version(db, doc.id)
        type_fichier = derniere.type_fichier if derniere else None
        docs_par_id[doc.id] = { "id":            doc.id,
                                "titre":         doc.titre,
                                "type_fichier":  type_fichier,
                                "categorie_nom": noms_categories.get(doc.id_categorie) }

    documents_enrichis = [docs_par_id[id_] for id_ in doc_ids if id_ in docs_par_id]

    payload_enrichi = dict(suggestion.payload)
    payload_enrichi["documents"] = documents_enrichis

    return { "id":              suggestion.id,
             "id_utilisateur":  suggestion.id_utilisateur,
             "type":            suggestion.type,
             "payload":         payload_enrichi,
             "statut":          suggestion.statut,
             "raison_refus":    suggestion.raison_refus,
             "date_creation":   suggestion.date_creation,
             "date_traitement": suggestion.date_traitement }


def analyser_bibliotheque(db: Session, id_utilisateur: int) -> list[dict]:
    contexte = collect_context(db, id_utilisateur)
    categories = collect_categories(db, id_utilisateur)
    suggestions_brutes = call_agent(contexte, categories)
    suggestions_filtrees = filtrer_suggestions_refusees(db, id_utilisateur, suggestions_brutes)

    suggestions_a_enregistrer = []
    for s in suggestions_filtrees:
        payload = dict(s)
        del payload["type"]
        suggestion = Suggestion(id_utilisateur=id_utilisateur,
                                type=s["type"],
                                payload=payload)
        db.add(suggestion)
        suggestions_a_enregistrer.append(suggestion)
    db.commit()
    for suggestion in suggestions_a_enregistrer:
        db.refresh(suggestion)
    return [_enrichir_payload(s, db) for s in suggestions_a_enregistrer]


def appliquer_suggestion(db: Session, suggestion: Suggestion):
    type_suggestion = suggestion.type
    id_utilisateur = suggestion.id_utilisateur
    payload = suggestion.payload

    if type_suggestion == "regroupement":
        if payload["categorie_cible_id"] is None:
            categorie = categorie_service.create_categorie(db, nom=payload["categorie_cible_nom"], id_utilisateur=id_utilisateur)
            cat_id = categorie.id
        else:
            cat_id = payload["categorie_cible_id"]

        documents = db.query(Document).filter(Document.id.in_(payload["document_ids"]),
                                              Document.id_utilisateur == id_utilisateur).all()
        for doc in documents:
            doc.id_categorie = cat_id
        db.commit()
    elif type_suggestion == "suppression":
        for doc_id in payload["document_ids"]:
            document_service.mettre_corbeille(db, doc_id, id_utilisateur)
    elif type_suggestion == "tag":
        documents = db.query(Document).filter(Document.id.in_(payload["document_ids"]),
                                              Document.id_utilisateur == id_utilisateur).all()
        tag_read = tag_service.create_tag(db, payload["tag_name"], id_utilisateur)
        tag = db.query(Tag).filter(Tag.id == tag_read.id).first()
        for doc in documents:
            if tag not in doc.tags:
                doc.tags.append(tag)
        db.commit()


def valider_suggestion(db: Session, suggestion: Suggestion) -> dict:
    appliquer_suggestion(db, suggestion)
    suggestion.statut = "validee"
    suggestion.date_traitement = datetime.now(timezone.utc)

    db.commit()
    return _enrichir_payload(suggestion, db)


def refuser_suggestion(db: Session, suggestion: Suggestion,raison_refus: str | None) -> dict:
    suggestion.statut = "refusee"
    suggestion.raison_refus = raison_refus
    suggestion.date_traitement = datetime.now(timezone.utc)
    db.commit()
    return _enrichir_payload(suggestion, db)


def lister_suggestions_en_attente(db: Session, id_utilisateur: int) -> list[dict]:
    suggestions = ( db.query(Suggestion)
                      .filter(Suggestion.id_utilisateur == id_utilisateur,
                              Suggestion.statut == "en_attente")
                      .order_by(Suggestion.date_creation.desc())
                      .all() )
    return [_enrichir_payload(s, db) for s in suggestions]


def get_suggestion(db: Session, id_suggestion: int, id_utilisateur: int) -> Suggestion | None:
    suggestion = ( db.query(Suggestion)
                     .filter(Suggestion.id == id_suggestion,
                             Suggestion.id_utilisateur == id_utilisateur)
                     .first() )
    if not suggestion:
        return None
    return suggestion
