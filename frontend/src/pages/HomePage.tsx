import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useAgent } from "../contexts/AgentContext"
import AppShell from "../components/AppShell"

function HomePageInner() {
  const { user } = useAuth()
  const { startAnalysis, analysisRunning, openSuggestions, pendingCount } = useAgent()

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[960px] mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <div className="text-[10.5px] font-mono text-mute uppercase tracking-wider mb-2">
            Tableau de bord
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-bright">
            Bonjour{user ? `, ${user.nom}` : ''}
          </h1>
          {user && (
            <p className="text-[12.5px] text-soft mt-1.5 font-mono">
              {user.email}
            </p>
          )}
        </div>

        {/* Agent IA */}
        <div className="mb-10">
          <div className="section-label mb-3">Agent IA</div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={startAnalysis}
              disabled={analysisRunning}
              className="btn-ai inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">auto_fix</span>
              {analysisRunning ? 'Analyse en cours…' : 'Analyser ma bibliothèque'}
            </button>
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={openSuggestions}
                className="btn-ghost"
              >
                Voir les suggestions ({pendingCount})
              </button>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          <Link
            to="/documents"
            className="block hair bg-panel p-5 hover:bg-elev transition-colors group"
          >
            <div className="flex items-start justify-between mb-6">
              <span className="material-symbols-outlined text-[20px] text-bright">folder</span>
              <span className="text-[11px] font-mono text-mute group-hover:text-bright transition-colors">→</span>
            </div>
            <div className="text-[14px] text-bright mb-1">Mes documents</div>
            <p className="text-[12px] text-soft">Consultez et gérez tous vos fichiers.</p>
          </Link>

          <Link
            to="/categories"
            className="block hair bg-panel p-5 hover:bg-elev transition-colors group"
          >
            <div className="flex items-start justify-between mb-6">
              <span className="material-symbols-outlined text-[20px] text-bright">label</span>
              <span className="text-[11px] font-mono text-mute group-hover:text-bright transition-colors">→</span>
            </div>
            <div className="text-[14px] text-bright mb-1">Mes catégories</div>
            <p className="text-[12px] text-soft">Organisez vos documents par thématique.</p>
          </Link>

        </div>
      </div>
    </div>
  )
}

function HomePage() {
  return (
    <AppShell>
      <HomePageInner />
    </AppShell>
  )
}

export default HomePage
