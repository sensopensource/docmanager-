import { useState, type ChangeEvent, type FormEvent } from "react"
import CategorieCard from "../components/CategorieCard"
import { useCategories } from "../hooks/useCategories"

function CategoriesPage() {
  const { categories, addCategorie, updateCategorie } = useCategories()
  const [nouveauNom, setNouveauNom] = useState('')

  const handleAddCategorie = async (e: FormEvent) => {
    e.preventDefault()
    await addCategorie(nouveauNom)
    setNouveauNom('')
  }

  return (
    <div>
      <h1>Categories</h1>
      {categories.length === 0 ? (
        <p>aucune categorie pr l'instant</p>
      ) : (
        <ul>
          {categories.map(cat => (
            <CategorieCard
              key={cat.id}
              categorie={cat}
              onUpdate={updateCategorie}
            />
          ))}
        </ul>
      )}
      <form onSubmit={handleAddCategorie}>
        <input
          type="text"
          placeholder="nouvelle categorie ?"
          value={nouveauNom}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNouveauNom(e.target.value)}
        />
        <button type="submit">Ajouter</button>
      </form>
    </div>
  )
}

export default CategoriesPage
