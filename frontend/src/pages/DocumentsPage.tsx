import { useState, type ChangeEvent } from "react"
import { useDocuments } from "../hooks/useDocuments"
import { useSearchDocuments } from "../hooks/useSearchDocuments"
import { useDebounce } from "../hooks/useDebounce"
import DocumentRow from "../components/DocumentRow"
import AppHeader from "../components/AppHeader"
import UploadModal from "../components/UploadModal"
import DocumentDetailPanel from "../components/DocumentDetailPanel"

function DocumentsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Debounce la query — on attend 300ms d'inactivite avant de fetch
  const debouncedQuery = useDebounce(searchQuery, 300)

  // 2 sources de donnees : tout, ou les resultats de recherche
  const { documents, isLoading: isLoadingAll, error: errorAll } = useDocuments()
  const { results, isLoading: isLoadingSearch, error: errorSearch } = useSearchDocuments(debouncedQuery)

  // Mode actuel : recherche ou liste complete
  const isSearchMode = debouncedQuery.length > 0

  // Source unifiee
  const items = isSearchMode ? results : documents
  const isLoading = isSearchMode ? isLoadingSearch : isLoadingAll
  const error = isSearchMode ? errorSearch : errorAll

  return (
    <div className="min-h-screen bg-base">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-6 py-16">

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
                <>{documents.length} {documents.length > 1 ? 'documents' : 'document'} dans votre drive.</>
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

        {/* Search bar */}
        <div className="relative mb-8">
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
              {isSearchMode ? `Aucun résultat pour « ${debouncedQuery} ».` : 'Votre drive est vide.'}
            </p>
            {!isSearchMode && (
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
