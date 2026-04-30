import { apiFetch } from "../api"
import type { DocumentListResponse } from "../types"
import { useQuery } from "@tanstack/react-query"

export function useDocuments(page: number = 1, size: number = 20, idCategorie: number | null = null) {
  const { data, isLoading, error } = useQuery<DocumentListResponse>({
    queryKey: ['documents', page, size, idCategorie],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: String(size) })
      if (idCategorie != null) params.append('id_categorie', String(idCategorie))

      const response = await apiFetch(`/documents/?${params}`)
      if (!response.ok) throw new Error("Erreur fetch documents")
      return response.json()
    }
  })

  return {
    documents: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
  }
}
