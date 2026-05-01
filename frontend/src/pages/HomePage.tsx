import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import AppShell from "../components/AppShell"

function HomePage() {
  const { user } = useAuth()

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-16">

          <div className="mb-12">
            <div className="section-label mb-3">Tableau de bord</div>
            <h1 className="font-display text-3xl font-semibold text-bright">
              Bonjour{user ? `, ${user.nom}` : ''}
            </h1>
            {user && (
              <p className="font-body text-sm text-soft mt-2">
                Connecté en tant que <span className="text-bright">{user.email}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Link
              to="/documents"
              className="block bg-panel hair p-6 hover:border-soft transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="material-symbols-outlined text-bright text-2xl">folder</span>
                <span className="material-symbols-outlined text-mute text-base group-hover:text-bright transition-colors">
                  arrow_forward
                </span>
              </div>
              <div className="font-display text-lg text-bright mb-1">Mes documents</div>
              <p className="font-body text-sm text-soft">Consultez et gérez tous vos fichiers.</p>
            </Link>

            <Link
              to="/categories"
              className="block bg-panel hair p-6 hover:border-soft transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="material-symbols-outlined text-bright text-2xl">label</span>
                <span className="material-symbols-outlined text-mute text-base group-hover:text-bright transition-colors">
                  arrow_forward
                </span>
              </div>
              <div className="font-display text-lg text-bright mb-1">Mes catégories</div>
              <p className="font-body text-sm text-soft">Organisez vos documents par thématique.</p>
            </Link>

          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default HomePage
