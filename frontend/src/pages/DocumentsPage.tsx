import { useState, useEffect, type ChangeEvent } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { useDocuments } from "../hooks/useDocuments"
import { useSearchDocuments } from "../hooks/useSearchDocuments"
import { useDebounce } from "../hooks/useDebounce"
import { useCategories } from "../hooks/useCategories"
import { useSearch } from "../contexts/SearchContext"
import { getAncestors, getDirectChildren } from "../lib/categoriesTree"
import DocumentsTable from "../components/DocumentsTable"
import AppShell from "../components/AppShell"
import UploadModal from "../components/UploadModal"
import DocumentInlinePanel from "../components/DocumentInlinePanel"

const SIZE = 20

function DocumentsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [searchParams, setSearchParams] = useSearchParams()

  // Filtre cat = lecture URL ?cat=<id> (source de verite unique)
  const filterCategorie = (() => {
    const v = searchParams.get('cat')
    return v ? Number(v) : null
  })()

  const { query: searchQuery } = useSearch()
  const debouncedQuery = useDebounce(searchQuery, 300)

  const { categories } = useCategories()
  const { documents, total, isLoading: isLoadingAll, error: errorAll } = useDocuments(page, SIZE, filterCategorie)
  const { results, isLoading: isLoadingSearch, error: errorSearch } = useSearchDocuments(debouncedQuery)

  const isSearchMode = debouncedQuery.length > 0
  const items = isSearchMode ? results : documents
  const isLoading = isSearchMode ? isLoadingSearch : isLoadingAll
  const error = isSearchMode ? errorSearch : errorAll
  const totalPages = Math.max(1, Math.ceil(total / SIZE))

  // Sous-dossiers du dossier courant (vide en mode recherche ou racine si filterCategorie=null)
  const subFolders = !isSearchMode ? getDirectChildren(categories, filterCategorie) : []

  // Breadcrumb : chaine d'ancetres du dossier courant
  const ancestors = filterCategorie != null ? getAncestors(categories, filterCategorie) : []

  useEffect(() => {
    if (searchParams.get('upload') === '1') {
      setIsUploadOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('upload')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Reset la pagination quand le filtre change
  useEffect(() => {
    setPage(1)
  }, [filterCategorie])

  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    const next = new URLSearchParams(searchParams)
    if (v) next.set('cat', v)
    else next.delete('cat')
    setSearchParams(next)
  }

  const handleOpenFolder = (id: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('cat', String(id))
    setSearchParams(next)
  }

  const goToRoot = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('cat')
    setSearchParams(next)
  }

  const currentFolderNom = ancestors.length > 0 ? ancestors[ancestors.length - 1].nom : null

  return (
    <AppShell>

      {/* Header / breadcrumb + tools */}
      <div className="px-6 pt-5 pb-4 hair-b flex items-end justify-between shrink-0 bg-ink/40">
        <div className="min-w-0 flex-1">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-mute mb-1.5 flex-wrap">
            <button onClick={goToRoot} className="hover:text-bright transition-colors">Senso</button>
            <span className="text-line2">/</span>
            {isSearchMode ? (
              <span className="text-soft truncate">Recherche : {debouncedQuery}</span>
            ) : ancestors.length === 0 ? (
              <span className="text-soft">Tous mes documents</span>
            ) : (
              ancestors.map((a, idx) => {
                const isLast = idx === ancestors.length - 1
                return (
                  <span key={a.id} className="flex items-center gap-2">
                    {isLast ? (
                      <span className="text-soft truncate">{a.nom}</span>
                    ) : (
                      <>
                        <Link to={`/documents?cat=${a.id}`} className="hover:text-bright transition-colors truncate">
                          {a.nom}
                        </Link>
                        <span className="text-line2">/</span>
                      </>
                    )}
                  </span>
                )
              })
            )}
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-bright truncate">
            {isSearchMode ? 'Résultats de recherche' : (currentFolderNom ?? 'Mes documents')}
          </h1>
          <p className="text-[12px] text-soft mt-1">
            {isSearchMode
              ? `${results.length} ${results.length > 1 ? 'résultats' : 'résultat'} pour « ${debouncedQuery} »`
              : (
                <>
                  {total} {total > 1 ? 'fichiers' : 'fichier'}
                  {subFolders.length > 0 && (
                    <>{' · '}{subFolders.length} {subFolders.length > 1 ? 'sous-dossiers' : 'sous-dossier'}</>
                  )}
                </>
              )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={filterCategorie ?? ''}
            onChange={handleFilterChange}
            disabled={isSearchMode}
            className="btn-ghost flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed bg-transparent"
          >
            <option value="">Toutes catégories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nom}</option>
            ))}
          </select>
          <div className="w-[0.5px] h-5 bg-line mx-1"></div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="btn-primary flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[15px]" style={{ color: '#0b0b0c' }}>upload</span>
            <span>Importer</span>
          </button>
        </div>
      </div>

      {/* Content area : list + inline detail panel */}
      <div className="flex-1 flex overflow-hidden">

        <div className="flex-1 overflow-hidden flex flex-col min-w-0">

          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <p className="section-label">Chargement...</p>
            </div>
          )}

          {error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-danger text-5xl">error_outline</span>
              <p className="font-body text-sm text-soft">
                {isSearchMode ? "Erreur lors de la recherche." : "Impossible de charger vos documents."}
              </p>
            </div>
          )}

          {!isLoading && !error && items.length === 0 && subFolders.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-mute text-5xl">
                {isSearchMode ? 'manage_search' : 'inventory_2'}
              </span>
              <p className="font-body text-sm text-soft">
                {isSearchMode
                  ? `Aucun résultat pour « ${debouncedQuery} ».`
                  : filterCategorie != null
                    ? 'Aucun document dans ce dossier.'
                    : 'Votre drive est vide.'}
              </p>
              {!isSearchMode && filterCategorie == null && (
                <p className="section-label">Cliquez sur "Importer" pour commencer.</p>
              )}
            </div>
          )}

          {!isLoading && !error && (items.length > 0 || subFolders.length > 0) && (
            <DocumentsTable
              items={items}
              selectedId={selectedId}
              onSelect={setSelectedId}
              categories={categories}
              isSearchMode={isSearchMode}
              subFolders={subFolders}
              onOpenFolder={handleOpenFolder}
            />
          )}

          {!isSearchMode && items.length > 0 && (
            <div className="h-10 shrink-0 hair-t px-6 flex items-center justify-between bg-ink/60">
              <span className="font-mono text-[10.5px] text-mute">
                {items.length} sur {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page <= 1}
                  className="w-7 h-7 flex items-center justify-center text-mute hover:text-bright hair disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Page précédente"
                >
                  <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                </button>
                <span className="font-mono text-[11px] text-soft px-2">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                  className="w-7 h-7 flex items-center justify-center text-bright hair disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Page suivante"
                >
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedId !== null && (
          <DocumentInlinePanel
            documentId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {isUploadOpen && <UploadModal onClose={() => setIsUploadOpen(false)} />}
    </AppShell>
  )
}

export default DocumentsPage
