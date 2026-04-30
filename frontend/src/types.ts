
export type User = {
    id: number
    email: string
    nom: string
    role:  string
}

export type Token = {
    access_token: string
    token_type: string
}

export type LoginResponse = {
    access_token: string
    token_type: string
}

export type Categorie = {
    id: number
    nom: string
}

export type Document = {
    id: number
    titre: string
    auteur: string | null
    date_creation: string  // ISO string venant du back
    type_fichier: string | null  // "pdf" | "docx" | "txt" | "md" | null
}

// Pour GET /documents/{id} — inclut les champs supplementaires du detail
export type DocumentDetail = Document & {
    date_upload: string | null
    apercu_contenu: string | null
    resume_llm: string | null
    numero_version: number | null
}

// Pour GET /documents/search — Document + un extrait avec mot surligne en <b>
export type DocumentSearchResult = Document & {
    extrait: string | null
}

// Pour GET /documents/ — items + total pour la pagination
export type DocumentListResponse = {
    items: Document[]
    total: number
    page: number
    size: number
}