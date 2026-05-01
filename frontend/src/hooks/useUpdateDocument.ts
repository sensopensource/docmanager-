import { apiFetch } from "../api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../contexts/ToastContext"
import type { Document } from "../types"

type UpdateParams = {
  id: number
  titre?: string
  auteur?: string
  id_categorie?: number
  // Message custom pour le toast au succès (sinon message générique)
  successMessage?: string
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const mutation = useMutation({
    mutationFn: async ({ id, titre, auteur, id_categorie }: UpdateParams) => {
      const body: Record<string, string | number> = {}
      if (titre !== undefined) body.titre = titre
      if (auteur !== undefined) body.auteur = auteur
      if (id_categorie !== undefined) body.id_categorie = id_categorie

      const response = await apiFetch(`/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || "Erreur modification")
      }

      return response.json() as Promise<Document>
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      const message = variables.successMessage ?? `Document mis à jour : "${data.titre}"`
      showToast(message, 'success')
    },
    onError: (error) => {
      showToast(error.message, 'error')
    },
  })

  return {
    updateDocument: mutation.mutate,
    isPending: mutation.isPending,
  }
}
