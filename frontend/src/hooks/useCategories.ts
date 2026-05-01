import { apiFetch } from "../api"
import type { Categorie } from "../types"
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query"
import { useToast } from "../contexts/ToastContext"

type CreatePayload = { nom: string; id_parent?: number | null }
type PatchPayload = { id: number; nom?: string; id_parent?: number | null; updateParent?: boolean }

export function useCategories() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const { data, isLoading, error } = useQuery<Categorie[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiFetch("/categories")
      if (!response.ok) throw new Error("pas de categories")
      return response.json()
    },
  })

  const addMutation = useMutation({
    mutationFn: async ({ nom, id_parent }: CreatePayload) => {
      const body: Record<string, unknown> = { nom }
      if (id_parent !== undefined && id_parent !== null) body.id_parent = id_parent
      const response = await apiFetch("/categories", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail || "ajout impossible")
      }
      return response.json() as Promise<Categorie>
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      showToast(`Catégorie "${data.nom}" créée`, 'success')
    },
    onError: (e) => showToast(e.message, 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, nom, id_parent, updateParent }: PatchPayload) => {
      // Pour deplacer a la racine, on doit envoyer explicitement id_parent: null,
      // sinon le back ne touche pas au champ.
      const body: Record<string, unknown> = {}
      if (nom !== undefined) body.nom = nom
      if (updateParent) body.id_parent = id_parent ?? null

      const response = await apiFetch(`/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail || "modification impossible")
      }
      return response.json() as Promise<Categorie>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      showToast(`Catégorie modifiée`, 'success')
    },
    onError: (e) => showToast(e.message, 'error'),
  })

  return {
    categories: data ?? [],
    isLoading,
    error,
    addCategorie: (payload: string | CreatePayload) => {
      // Compat : ancien usage addCategorie("nom") + nouveau addCategorie({nom, id_parent})
      const args: CreatePayload = typeof payload === 'string' ? { nom: payload } : payload
      addMutation.mutate(args)
    },
    updateCategorie: (cat: Categorie | PatchPayload) => {
      // Compat : ancien usage updateCategorie(categorie) renomme juste
      if ('updateParent' in cat) {
        updateMutation.mutate(cat as PatchPayload)
      } else {
        updateMutation.mutate({ id: cat.id, nom: cat.nom })
      }
    },
  }
}
