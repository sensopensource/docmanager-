
import { apiFetch } from "../api"
import type { Categorie } from "../types"
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query"

export function useCategories() {

  const queryClient = useQueryClient()


  const {data,isLoading,error} = useQuery<Categorie[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiFetch("/categories")
      if(!response.ok) throw new Error("pas de categories")
      const data = await response.json()
      return data
    }
  })

   const addMutation = useMutation({
    mutationFn: async (nom: string) => {
      const response = await apiFetch(`/categories?nom=${encodeURIComponent(nom)}`,{'method':'POST',})
      if (!response.ok) throw new Error("ajout impossible")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['categories']})
    }
   })

   const updateMutation = useMutation({
    mutationFn: async (categorie: Categorie) => {
      const response = await apiFetch(`/categories?id_categorie=${categorie.id}&nom=${encodeURIComponent(categorie.nom)}`,
      { method: "PATCH" })
      if (!response) throw new Error("modification impossible")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['categories']})
    }
   })
  return {
    categories: data ?? [],
    isLoading,
    error,
    addCategorie: (nom: string) => {addMutation.mutate(nom)},
    updateCategorie: (categorie: Categorie) => {updateMutation.mutate(categorie)}
    }
} 
