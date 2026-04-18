CREATE EXTENSION IF NOT EXISTS unaccent;
-- pour gerer les accents
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- pour gerer les fautres d'orthographes

CREATE TEXT SEARCH CONFIGURATION french_unaccent (COPY = french);
-- jai copie la config classque de french,pourchaque hword(mot compose),hword-part(partie de mot compose),mot classique japplique         
-- le traitement unaccent pour elenver les accents,ensuite stem pour tokeniser ou plutot garder le mot a sa racine
ALTER TEXT SEARCH CONFIGURATION french_unaccent
  ALTER MAPPING FOR hword,hword_part,word
  WITH unaccent, french_stem;

CREATE TABLE utilisateurs (
     
    id SERIAL PRIMARY KEY,
    role TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE ,
    mot_de_passe_hash TEXT NOT NULL,
    date_inscription TIMESTAMPTZ DEFAULT NOW(),
    nom TEXT NOT NULL,


);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    id_parent int REFERENCES categories(id)

);


CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    titre TEXT NOT NULL,
    auteur TEXT,
    date_creation TIMESTAMPTZ DEFAULT NOW(),
    id_utilisateur int REFERENCES utilisateurs(id),
    id_categorie int REFERENCES categories(id)
    
      );

CREATE TABLE versions(
    id SERIAL PRIMARY KEY,
    numero int NOT NULL,
    contenu TEXT NOT NULL,
    storage_fichier TEXT NOT NULL UNIQUE,
    type_fichier TEXT NOT NULL,
    search_vector tsvector,
    resume_LLM TEXT,
    date_upload TIMESTAMPTZ DEFAULT NOW(),
    id_document int REFERENCES documents(id)

);


CREATE TABLE anomalies(
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL,
    id_utilisateur int REFERENCES utilisateurs(id),
    adresse_ip TEXT NOT NULL,
    description TEXT NOT NULL,
    severite TEXT NOT NULL,
    date_detection TIMESTAMPTZ DEFAULT NOW()

);

CREATE TABLE logs(
    id SERIAL PRIMARY KEY,
    id_utilisateur int REFERENCES utilisateurs(id),
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    adresse_ip TEXT NOT NULL,
    date_action TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tags(
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE

);

CREATE TABLE documents_tags(
    id_document int REFERENCES documents(id),
    id_tag int REFERENCES tags(id),
    PRIMARY KEY (id_document,id_tag)
);


CREATE TABLE historiques_recherches(
    id SERIAL PRIMARY KEY,
    id_utilisateur int REFERENCES utilisateurs(id),
    requete TEXT NOT NULL,
    date_recherche TIMESTAMPTZ DEFAULT NOW(),
    nb_resultats int NOT NULL
);



INSERT INTO categories (nom)
VALUES ('Non categorise');




CREATE INDEX idx_documents_search_vector
    ON versions USING GIN(search_vector) ;

CREATE INDEX idx_documents_titre_trgm
    ON documents USING GIN(titre gin_trgm_ops);

CREATE INDEX idx_documents_auteur_trgm
    ON documents USING GIN(auteur gin_trgm_ops);


CREATE OR REPLACE FUNCTION versions_search_vector_update() RETURNS trigger AS $$
DECLARE
    doc_titre TEXT;
    doc_auteur TEXT;
    doc_id_categorie int;
    cat_nom TEXT;
BEGIN
    SELECT d.titre, d.auteur,d.id_categorie INTO doc_titre, doc_auteur,doc_id_categorie
    FROM documents d WHERE d.id = NEW.id_document;

    SELECT c.nom INTO cat_nom
    FROM categories c WHERE c.id = doc_id_categorie;

    NEW.search_vector :=
        setweight(to_tsvector('french_unaccent', COALESCE(doc_titre, '')), 'A') ||
        setweight(to_tsvector('french_unaccent', COALESCE(doc_auteur, '')), 'B') ||
        setweight(to_tsvector('french_unaccent', COALESCE(NEW.contenu, '')), 'C') || 
        setweight(to_tsvector('french_unaccent', COALESCE(cat_nom,'')),'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION documents_touch_versions() RETURNS trigger AS $$
BEGIN
    IF NEW.titre IS DISTINCT FROM OLD.titre
       OR NEW.auteur IS DISTINCT FROM OLD.auteur
       OR NEW.id_categorie IS DISTINCT FROM OLD.id_categorie THEN
        UPDATE versions SET id_document = id_document WHERE id_document = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;




CREATE TRIGGER versions_search_vector_trigger
BEFORE INSERT OR UPDATE ON versions
FOR EACH ROW EXECUTE FUNCTION versions_search_vector_update();


CREATE TRIGGER documents_touch_versions_trigger
AFTER UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION documents_touch_versions();



INSERT INTO utilisateurs (role, email, mot_de_passe_hash, nom)
VALUES ('admin', 'admin@test.com', 'temp_hash', 'Admin Test');

