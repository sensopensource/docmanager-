import { useState, type ChangeEvent } from "react"
import { useDocuments } from "../hooks/useDocuments"
import { useSearchDocuments } from "../hooks/useSearchDocuments"
import { useDebounce } from "../hooks/useDebounce"
import { useCategories } from "../hooks/useCategories"
import DocumentRow from "../components/DocumentRow"
import AppSidebar from "../components/AppSidebar"
import UploadModal from "../components/UploadModal"
import DocumentDetailPanel from "../components/DocumentDetailPanel"

const SIZE = 20

function DocumentsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategorie, setFilterCategorie] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  // Debounce la query — on attend 300ms d'inactivite avant de fetch
  const debouncedQuery = useDebounce(searchQuery, 300)

  // Sources de donnees
  const { categories } = useCategories()
  const { documents, total, isLoading: isLoadingAll, error: errorAll } = useDocuments(page, SIZE, filterCategorie)
  const { results, isLoading: isLoadingSearch, error: errorSearch } = useSearchDocuments(debouncedQuery)

  // Mode actuel
  const isSearchMode = debouncedQuery.length > 0

  // Source unifiee
  const items = isSearchMode ? results : documents
  const isLoading = isSearchMode ? isLoadingSearch : isLoadingAll
  const error = isSearchMode ? errorSearch : errorAll

  // Pagination
  const totalPages = Math.max(1, Math.ceil(total / SIZE))

  // Handler pour le filtre categorie : reset la page a 1
  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilterCategorie(e.target.value ? Number(e.target.value) : null)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-base">
      <AppSidebar />

      <main className="ml-60">
        <div className="max-w-4xl mx-auto px-6 py-16">

          {/* Bloc titre + bouton upload */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-fg-3 mb-3">
                Archive
              </div>
              <h1 className="font-display text-3xl font-semibold text-fg-1">
                Mes documents
              </h1>
              <p className="font-body text-sm text-fg-2 mt-2">
                {!isSearchMode && (
                  <>{total} {total > 1 ? 'documents' : 'document'} dans votre drive.</>
                )}
                {isSearchMode && (
                  <>{results.length} {results.length > 1 ? 'résultats' : 'résultat'} pour « {debouncedQuery} »</>
                )}
              </p>
            </div>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 bg-primary text-fg-inverse font-body font-semibold px-4 py-2 text-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">upload</span>
              Uploader
            </button>
          </div>

          {/* Search bar + filtre categorie */}
          <div className="flex gap-2 mb-8">

            {/* Search bar */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-fg-3 text-base pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                placeholder="QUERY INDEX..."
                autoComplete="off"
                className="w-full bg-surface-1 border border-border text-fg-1 pl-10 pr-3 py-2 text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-primary placeholder:text-fg-3"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg-1 transition-colors"
                  aria-label="Effacer"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>

            {/* Filtre categorie — desactive en mode recherche (pas pertinent) */}
            <select
              value={filterCategorie ?? ''}
              onChange={handleFilterChange}
              disabled={isSearchMode}
              className="bg-surface-1 border border-border text-fg-1 px-3 py-2 text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">Toutes catégories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nom}</option>
              ))}
            </select>
          </div>

          {/* États possibles */}
          {isLoading && (
            <div className="bg-surface-1 border border-border p-12 text-center">
              <p className="font-mono text-xs uppercase tracking-wider text-fg-3">
                Chargement...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-surface-1 border border-border p-12 text-center">
              <span className="material-symbols-outlined text-danger text-5xl mb-3 block">
                error_outline
              </span>
              <p className="font-body text-sm text-fg-2">
                {isSearchMode ? "Erreur lors de la recherche." : "Impossible de charger vos documents."}
              </p>
            </div>
          )}

          {!isLoading && !error && items.length === 0 && (
            <div className="bg-surface-1 border border-border p-12 text-center">
              <span className="material-symbols-outlined text-fg-3 text-5xl mb-3 block">
                {isSearchMode ? 'manage_search' : 'inventory_2'}
              </span>
              <p className="font-body text-sm text-fg-2">
                {isSearchMode
                  ? `Aucun résultat pour « ${debouncedQuery} ».`
                  : filterCategorie != null
                    ? 'Aucun document dans cette catégorie.'
                    : 'Votre drive est vide.'}
              </p>
              {!isSearchMode && filterCategorie == null && (
                <p className="font-mono text-xs uppercase tracking-wider text-fg-3 mt-1">
                  Uploadez votre premier document pour commencer.
                </p>
              )}
            </div>
          )}

          {!isLoading && !error && items.length > 0 && (
            <ul className="bg-surface-1 border border-border divide-y divide-border">
              {items.map(doc => (
                <DocumentRow
                  key={doc.id}
                  document={doc}
                  onClick={() => setSelectedId(doc.id)}
                  extrait={isSearchMode ? (doc as { extrait?: string | null }).extrait : null}
                />
              ))}
            </ul>
          )}

          {/* Pagination — masquee en mode recherche (pas de count) */}
          {!isSearchMode && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="font-mono text-xs text-fg-3">
                Page {page} / {totalPages} · {total} {total > 1 ? 'documents' : 'document'}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page <= 1}
                  className="flex items-center justify-center w-8 h-8 bg-surface-2 border border-border text-fg-2 hover:text-fg-1 hover:border-fg-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Page précédente"
                >
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center justify-center w-8 h-8 bg-surface-2 border border-border text-fg-2 hover:text-fg-1 hover:border-fg-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Page suivante"
                >
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Modal d'upload */}
      {isUploadOpen && <UploadModal onClose={() => setIsUploadOpen(false)} />}

      {/* Panel détail */}
      {selectedId !== null && (
        <DocumentDetailPanel
          documentId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}

    </div>
  )
}

export default DocumentsPage
