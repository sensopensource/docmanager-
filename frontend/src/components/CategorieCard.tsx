import { useState, type ChangeEvent } from "react"
import type { Categorie } from "../types"
import { useDeleteCategorie } from "../hooks/useDeleteCategorie"

type Props = {
  categorie: Categorie
  onUpdate: (updated: Categorie) => void
}

function CategorieCard({ categorie, onUpdate }: Props) {
  const [editMode, setEditMode] = useState(false)
  const [nomEdit, setNomEdit] = useState(categorie.nom ?? "")
  const { deleteCategorie, isPending } = useDeleteCategorie()
  const [deleteMode, setDeleteMode] = useState(false)

  const handleCancel = () => {
    setNomEdit(categorie.nom ?? "")
    setEditMode(false)
  }

  const handleValidate = () => {
    if (!nomEdit.trim()) return
    onUpdate({ ...categorie, nom: nomEdit.trim() })
    setEditMode(false)
  }

  const handleDelete = () => {
    if (!categorie.id) return
    deleteCategorie(categorie.id, {
      onSuccess: () => setDeleteMode(false),
    })
  }

  return (
    <li className="flex items-center justify-between px-4 py-3 hover:bg-elev transition-colors">
      {editMode ? (
        <>
          <input
            type="text"
            value={nomEdit}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNomEdit(e.target.value)}
            autoFocus
            className="flex-1 bg-ink hair text-bright px-2 py-1 text-sm focus:outline-none focus:border-bright mr-3"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleValidate}
              className="font-mono text-xs uppercase tracking-wider text-success hover:text-bright transition-colors"
            >
              Valider
            </button>
            <button
              onClick={handleCancel}
              className="font-mono text-xs uppercase tracking-wider text-mute hover:text-bright transition-colors"
            >
              Annuler
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-mute text-base">label</span>
            <span className="font-body text-sm text-bright">{categorie.nom}</span>
            <span className="font-mono text-[10px] text-mute">{categorie.count}</span>
          </div>
          <div className="flex items-center gap-2">
            {deleteMode ? (
              <>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="font-mono text-xs uppercase tracking-wider text-danger hover:text-bright transition-colors disabled:opacity-40"
                >
                  Confirmer
                </button>
                <button
                  onClick={() => setDeleteMode(false)}
                  className="font-mono text-xs uppercase tracking-wider text-mute hover:text-bright transition-colors"
                >
                  Annuler
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditMode(true)}
                  className="font-mono text-xs uppercase tracking-wider text-mute hover:text-bright transition-colors"
                >
                  Modifier
                </button>
                <button
                  onClick={() => setDeleteMode(true)}
                  className="font-mono text-xs uppercase tracking-wider text-mute hover:text-danger transition-colors"
                >
                  Supprimer
                </button>
              </>
            )}
          </div>
        </>
      )}
    </li>
  )
}

export default CategorieCard
