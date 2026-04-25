import type React from "react"

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