import { useState, type ChangeEvent, type FormEvent } from "react"
import CategorieCard from "../components/CategorieCard"
import { useCategories } from "../hooks/useCategories"
import AppSidebar from "../components/AppSidebar"

function CategoriesPage() {
  const { categories, addCategorie, updateCategorie } = useCategories()
  const [nouveauNom, setNouveauNom] = useState('')

  const handleAddCategorie = async (e: FormEvent) => {
    e.preventDefault()
    if (!nouveauNom.trim()) return
    await addCategorie(nouveauNom.trim())
    setNouveauNom('')
  }

  return (
    <div className="min-h-screen bg-base">
      <AppSidebar />

      <main className="ml-60">
        <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Bloc titre */}
        <div className="mb-12">
          <div className="font-mono text-xs uppercase tracking-wider text-fg-3 mb-3">
            Organisation
          </div>
          <h1 className="font-display text-3xl font-semibold text-fg-1">
            Mes catégories
          </h1>
          <p className="font-body text-sm text-fg-2 mt-2">
            {categories.length} {categories.length > 1 ? 'catégories' : 'catégorie'} dans votre drive.
          </p>
        </div>

        {/* Formulaire d'ajout */}
        <form
          onSubmit={handleAddCategorie}
          className="flex gap-2 mb-8"
        >
          <input
            type="text"
            placeholder="Nouvelle catégorie..."
            value={nouveauNom}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNouveauNom(e.target.value)}
            autoComplete="off"
            className="flex-1 bg-surface-1 border border-border text-fg-1 px-3 py-2 text-sm font-body focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!nouveauNom.trim()}
            className="flex items-center gap-2 bg-primary text-fg-inverse font-body font-semibold px-4 py-2 text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Ajouter
          </button>
        </form>

        {/* Liste / Empty state */}
        {categories.length === 0 ? (
          <div className="bg-surface-1 border border-border p-12 text-center">
            <span className="material-symbols-outlined text-fg-3 text-5xl mb-3 block">
              label_off
            </span>
            <p className="font-body text-sm text-fg-2">
              Aucune catégorie pour l'instant.
            </p>
            <p className="font-mono text-xs uppercase tracking-wider text-fg-3 mt-1">
              Créez-en une via le champ ci-dessus.
            </p>
          </div>
        ) : (
          <ul className="bg-surface-1 border border-border divide-y divide-border">
            {categories.map(cat => (
              <CategorieCard
                key={cat.id}
                categorie={cat}
                onUpdate={updateCategorie}
              />
            ))}
          </ul>
        )}

        </div>
      </main>
    </div>
  )
}

export default CategoriesPage
