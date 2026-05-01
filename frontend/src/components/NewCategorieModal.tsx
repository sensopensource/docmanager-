import { useState, useEffect, type FormEvent } from "react"
import { useCategories } from "../hooks/useCategories"

type Props = {
  onClose: () => void
  parentId?: number | null
  parentNom?: string | null
}

function NewCategorieModal({ onClose, parentId = null, parentNom = null }: Props) {
  const { addCategorie } = useCategories()
  const [nom, setNom] = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const value = nom.trim()
    if (!value) return
    addCategorie({ nom: value, id_parent: parentId })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[420px] bg-panel hair flex flex-col"
      >
        <div className="px-5 py-3 hair-b flex items-center justify-between">
          <div className="section-label">
            {parentNom ? `Sous-dossier de "${parentNom}"` : 'Nouveau dossier'}
          </div>
          <button
            onClick={onClose}
            className="text-mute hover:text-bright transition-colors"
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3">
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Nom du dossier..."
            autoFocus
            className="bg-ink hair text-bright text-[13px] px-3 py-2 focus:outline-none focus:border-bright"
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
            <button
              type="submit"
              disabled={!nom.trim()}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewCategorieModal
