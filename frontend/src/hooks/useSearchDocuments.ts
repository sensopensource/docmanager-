import { apiFetch } from "../api"
import { useQuery } from "@tanstack/react-query"
import type { DocumentSearchResult } from "../types"

export function useSearchDocuments(query: string) {
  const { data, isLoading, error } = useQuery<DocumentSearchResult[]>({
    queryKey: ['documents', 'search', query],
    queryFn: async () => {
      const response = await apiFetch(`/documents/search?query=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error("Erreur recherche")
      return response.json()
    },
    enabled: query.length > 0,
  })

  return {
    results: data ?? [],
    isLoading,
    error,
  }
}
