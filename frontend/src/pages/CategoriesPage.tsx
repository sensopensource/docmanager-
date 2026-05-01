import { useState, type ChangeEvent, type FormEvent } from "react"
import CategorieCard from "../components/CategorieCard"
import { useCategories } from "../hooks/useCategories"
import AppShell from "../components/AppShell"

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
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-16">

          <div className="mb-12">
            <div className="section-label mb-3">Organisation</div>
            <h1 className="font-display text-3xl font-semibold text-bright">Mes catégories</h1>
            <p className="font-body text-sm text-soft mt-2">
              {categories.length} {categories.length > 1 ? 'catégories' : 'catégorie'} dans votre drive.
            </p>
          </div>

          <form onSubmit={handleAddCategorie} className="flex gap-2 mb-8">
            <input
              type="text"
              placeholder="Nouvelle catégorie..."
              value={nouveauNom}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNouveauNom(e.target.value)}
              autoComplete="off"
              className="flex-1 bg-panel hair text-bright px-3 py-2 text-sm font-body focus:outline-none focus:border-bright"
            />
            <button
              type="submit"
              disabled={!nouveauNom.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base" style={{ color: '#0b0b0c' }}>add</span>
              Ajouter
            </button>
          </form>

          {categories.length === 0 ? (
            <div className="bg-panel hair p-12 text-center">
              <span className="material-symbols-outlined text-mute text-5xl mb-3 block">label_off</span>
              <p className="font-body text-sm text-soft">Aucune catégorie pour l'instant.</p>
              <p className="section-label mt-1">Créez-en une via le champ ci-dessus.</p>
            </div>
          ) : (
            <ul className="bg-panel hair divide-y divide-[var(--line)]">
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
      </div>
    </AppShell>
  )
}

export default CategoriesPage
