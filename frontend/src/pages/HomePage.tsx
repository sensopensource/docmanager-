import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import AppSidebar from "../components/AppSidebar"

function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-base">
      <AppSidebar />

      {/* Contenu principal — ml-60 pour decaler de la largeur de la sidebar */}
      <main className="ml-60">
        <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Bloc bienvenue */}
        <div className="mb-12">
          <div className="font-mono text-xs uppercase tracking-wider text-fg-3 mb-3">
            Tableau de bord
          </div>
          <h1 className="font-display text-3xl font-semibold text-fg-1">
            Bonjour{user ? `, ${user.nom}` : ''}
          </h1>
          {user && (
            <p className="font-body text-sm text-fg-2 mt-2">
              Connecté en tant que <span className="text-fg-1">{user.email}</span>
            </p>
          )}
        </div>

        {/* Grille de cartes navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Carte Documents */}
          <Link
            to="/documents"
            className="block bg-surface-1 border border-border p-6 hover:border-primary transition-colors group"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="material-symbols-outlined text-fg-1 text-2xl">folder</span>
              <span className="material-symbols-outlined text-fg-3 text-base group-hover:text-fg-1 transition-colors">
                arrow_forward
              </span>
            </div>
            <div className="font-display text-lg text-fg-1 mb-1">
              Mes documents
            </div>
            <p className="font-body text-sm text-fg-2">
              Consultez et gérez tous vos fichiers.
            </p>
          </Link>

          {/* Carte Catégories */}
          <Link
            to="/categories"
            className="block bg-surface-1 border border-border p-6 hover:border-primary transition-colors group"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="material-symbols-outlined text-fg-1 text-2xl">label</span>
              <span className="material-symbols-outlined text-fg-3 text-base group-hover:text-fg-1 transition-colors">
                arrow_forward
              </span>
            </div>
            <div className="font-display text-lg text-fg-1 mb-1">
              Mes catégories
            </div>
            <p className="font-body text-sm text-fg-2">
              Organisez vos documents par thématique.
            </p>
          </Link>

        </div>

        </div>
      </main>
    </div>
  )
}

export default HomePage
