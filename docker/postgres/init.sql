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

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    titre TEXT NOT NULL,
    auteur TEXT,
    date_upload TIMESTAMPTZ DEFAULT NOW(),
    type_fichier TEXT NOT NULL,
    tags TEXT[],
    contenu TEXT NOT NULL,
    search_vector TSVECTOR   );

CREATE INDEX idx_documents_search_vector
    ON documents USING GIN(search_vector) ;
