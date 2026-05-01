import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from "react"
import { useDocument } from "../hooks/useDocument"
import { useDeleteDocument } from "../hooks/useDeleteDocument"
import { useUpdateDocument } from "../hooks/useUpdateDocument"
import { useTags } from "../hooks/useTags"
import { useCreateTag } from "../hooks/useCreateTag"
import { useUpdateDocumentTags } from "../hooks/useUpdateDocumentTags"
import { useCategories } from "../hooks/useCategories"

type Props = {
  documentId: number
  onClose: () => void
}

const TYPE_ICONS: Record<string, string> = {
  pdf:  "picture_as_pdf",
  docx: "description",
  txt:  "article",
  md:   "code_blocks",
}

const TYPE_BARS: Record<string, string> = {
  pdf:  "bg-type-pdf",
  docx: "bg-type-docx",
  txt:  "bg-type-txt",
  md:   "bg-type-md",
}

const TYPE_DOTS = ["bg-type-pdf", "bg-type-docx", "bg-type-txt", "bg-type-md", "bg-type-ai"]

function DocumentInlinePanel({ documentId, onClose }: Props) {
  const { document, isLoading, error } = useDocument(documentId)
  const { deleteDocument, isPending: isDeleting } = useDeleteDocument()
  const { updateDocument } = useUpdateDocument()
  const { categories } = useCategories()
  const { data: allTags } = useTags()
  const { mutate: createTag, isPending: isCreatingTag } = useCreateTag()
  const { mutate: updateDocumentTags } = useUpdateDocumentTags(documentId)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editTitre, setEditTitre] = useState(false)
  const [titreValue, setTitreValue] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const tagPickerRef = useRef<HTMLDivElement>(null)
  const [showCategoriePicker, setShowCategoriePicker] = useState(false)
  const categoriePickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showTagSuggestions) return
    const handleClickOutside = (e: MouseEvent) => {
      if (tagPickerRef.current && !tagPickerRef.current.contains(e.target as Node)) {
        setShowTagSuggestions(false)
      }
    }
    window.document.addEventListener('mousedown', handleClickOutside)
    return () => window.document.removeEventListener('mousedown', handleClickOutside)
  }, [showTagSuggestions])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [tagInput])

  useEffect(() => {
    if (!showCategoriePicker) return
    const handleClickOutside = (e: MouseEvent) => {
      if (categoriePickerRef.current && !categoriePickerRef.current.contains(e.target as Node)) {
        setShowCategoriePicker(false)
      }
    }
    window.document.addEventListener('mousedown', handleClickOutside)
    return () => window.document.removeEventListener('mousedown', handleClickOutside)
  }, [showCategoriePicker])

  const handleChangeCategorie = (newCategorieId: number) => {
    if (!document) return
    setShowCategoriePicker(false)
    if (newCategorieId === document.id_categorie) return
    const newNom = categories.find(c => c.id === newCategorieId)?.nom ?? '?'
    updateDocument({
      id: documentId,
      id_categorie: newCategorieId,
      successMessage: `Document déplacé dans "${newNom}"`,
    })
  }

  const handleStartEdit = () => {
    if (!document) return
    setTitreValue(document.titre)
    setEditTitre(true)
  }

  const handleSaveTitre = () => {
    if (!titreValue.trim()) {
      setEditTitre(false)
      return
    }
    if (titreValue.trim() === document?.titre) {
      setEditTitre(false)
      return
    }
    updateDocument(
      { id: documentId, titre: titreValue.trim() },
      { onSuccess: () => setEditTitre(false) }
    )
  }

  const handleDelete = () => {
    deleteDocument(documentId, {
      onSuccess: () => {
        setConfirmDelete(false)
        onClose()
      },
    })
  }

  const handleDownload = async () => {
    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:8000/documents/${documentId}/download`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) return
    const disposition = response.headers.get('content-disposition') || ''
    const match = disposition.match(/filename="?([^";]+)"?/)
    const filename = match ? match[1] : `document-${documentId}`
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleAddTag = (tagId: number) => {
    if (!document) return
    const currentTagIds = document.tags.map(t => t.id)
    if (!currentTagIds.includes(tagId)) {
      updateDocumentTags([...currentTagIds, tagId])
    }
    setTagInput('')
    setShowTagSuggestions(false)
  }

  const handleRemoveTag = (tagId: number) => {
    if (!document) return
    const currentTagIds = document.tags.map(t => t.id).filter(id => id !== tagId)
    updateDocumentTags(currentTagIds)
  }

  const handleCreateAndAddTag = () => {
    const name = tagInput.trim()
    if (!name || isCreatingTag) return
    createTag(name, {
      onSuccess: (newTag) => {
        if (!document) return
        const currentTagIds = document.tags.map(t => t.id)
        if (!currentTagIds.includes(newTag.id)) {
          updateDocumentTags([...currentTagIds, newTag.id])
        }
        setTagInput('')
        setShowTagSuggestions(false)
      }
    })
  }

  const filteredSuggestions = (allTags || []).filter(
    tag => tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
           !document?.tags.some(t => t.id === tag.id)
  ).slice(0, 6)

  const exactMatch = filteredSuggestions.find(
    t => t.name.toLowerCase() === tagInput.trim().toLowerCase()
  )
  const canCreate = tagInput.trim().length > 0 && !exactMatch

  const handleTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') return setShowTagSuggestions(false)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const max = filteredSuggestions.length + (canCreate ? 1 : 0) - 1
      setHighlightedIndex(i => Math.min(i + 1, max))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(i => Math.max(i - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex < filteredSuggestions.length) {
        handleAddTag(filteredSuggestions[highlightedIndex].id)
      } else if (canCreate) {
        handleCreateAndAddTag()
      }
    }
  }

  const formatDateTime = (iso: string | null | undefined) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    })
  }

  const formatSize = (bytes: number | null | undefined) => {
    if (bytes == null) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const typeIcon = document?.type_fichier ? TYPE_ICONS[document.type_fichier] ?? "insert_drive_file" : "insert_drive_file"
  const typeBar = document?.type_fichier ? TYPE_BARS[document.type_fichier] ?? "bg-mute" : "bg-mute"
  const categorieNom = document?.id_categorie
    ? categories.find(c => c.id === document.id_categorie)?.nom ?? null
    : null
  const categorieIdx = categorieNom
    ? categories.findIndex(c => c.id === document?.id_categorie)
    : -1

  return (
    <aside className="w-[400px] shrink-0 hair-l bg-panel flex flex-col overflow-hidden">

      {/* Loading / error */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="section-label">Chargement…</p>
        </div>
      )}

      {error && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-danger text-5xl">error_outline</span>
          <p className="font-body text-sm text-soft">Impossible de charger ce document.</p>
        </div>
      )}

      {document && (
        <>
          {/* Panel header */}
          <div className="px-5 py-4 hair-b flex items-start justify-between shrink-0 gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 shrink-0 hair flex items-center justify-center relative">
                <span className="material-symbols-outlined text-[20px] text-soft">{typeIcon}</span>
                <span className={`absolute -bottom-[1px] left-0 right-0 h-[2px] ${typeBar}`}></span>
              </div>
              <div className="min-w-0 flex-1">
                {editTitre ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={titreValue}
                      autoFocus
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setTitreValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitre()
                        if (e.key === 'Escape') setEditTitre(false)
                      }}
                      className="flex-1 bg-ink hair text-bright text-[13px] px-2 py-1 focus:outline-none focus:border-bright"
                    />
                    <button onClick={handleSaveTitre} className="text-success hover:text-bright transition-colors px-1" aria-label="Valider">✓</button>
                    <button onClick={() => setEditTitre(false)} className="text-danger hover:text-bright transition-colors px-1" aria-label="Annuler">✕</button>
                  </div>
                ) : (
                  <h2 className="text-[13.5px] font-semibold text-bright truncate">{document.titre}</h2>
                )}
                <div className="flex items-center gap-2 mt-1 font-mono text-[10.5px] text-mute">
                  <span className="uppercase">{document.type_fichier ?? '—'}</span>
                  <span className="text-line2">·</span>
                  <span>v{document.numero_version ?? '?'}</span>
                  {document.auteur && (
                    <>
                      <span className="text-line2">·</span>
                      <span className="truncate">{document.auteur}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-mute hover:text-bright transition-colors shrink-0"
              aria-label="Fermer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          {/* Action bar */}
          <div className="px-5 py-3 hair-b flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="btn-primary flex items-center gap-1.5 flex-1 justify-center"
            >
              <span className="material-symbols-outlined text-[14px]" style={{ color: '#0b0b0c' }}>download</span>
              <span>Télécharger</span>
            </button>
            <button
              onClick={handleStartEdit}
              className="btn-ghost flex items-center justify-center w-9 h-[30px]"
              title="Renommer"
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="btn-ghost flex items-center justify-center w-9 h-[30px] hover:!text-danger"
              title="Supprimer"
            >
              <span className="material-symbols-outlined text-[15px]">delete</span>
            </button>
          </div>

          {/* Confirm delete bar */}
          {confirmDelete && (
            <div className="px-5 py-3 hair-b bg-elev flex items-center gap-2 shrink-0">
              <span className="text-[12px] text-soft flex-1">Supprimer ce document ?</span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="font-mono text-[10px] uppercase tracking-wider text-mute hover:text-bright transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-primary !bg-danger !text-bright disabled:opacity-40"
              >
                {isDeleting ? '...' : 'Confirmer'}
              </button>
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto detail-scroll">

            {/* AI summary */}
            <div className="px-5 py-4 hair-b">
              <div className="flex items-center justify-between mb-3">
                <div className="section-label flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[12px] text-type-ai">auto_awesome</span>
                  <span>Résumé IA</span>
                </div>
                <button className="font-mono text-[10px] text-mute hover:text-bright cursor-not-allowed opacity-60" disabled>
                  bientôt
                </button>
              </div>
              {document.resume_llm ? (
                <p className="text-[12.5px] text-soft leading-[1.65]">{document.resume_llm}</p>
              ) : (
                <p className="text-[12px] text-mute italic">Aucun résumé pour ce document.</p>
              )}
            </div>

            {/* Metadata */}
            <div className="px-5 py-4 hair-b">
              <div className="section-label mb-3">Informations</div>
              <dl className="space-y-2.5 text-[12px]">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-mute">Catégorie</dt>
                  <dd className="relative" ref={categoriePickerRef}>
                    <button
                      onClick={() => setShowCategoriePicker(v => !v)}
                      className="flex items-center gap-1.5 text-bright hover:text-bright px-1.5 py-0.5 hair border-transparent hover:border-line2 transition-colors"
                      title="Changer de catégorie"
                    >
                      {categorieIdx >= 0 && (
                        <span className={`type-dot ${TYPE_DOTS[categorieIdx % TYPE_DOTS.length]}`}></span>
                      )}
                      <span>{categorieNom ?? '—'}</span>
                      <span className="material-symbols-outlined text-[12px] text-mute">unfold_more</span>
                    </button>

                    {showCategoriePicker && (
                      <div className="absolute top-full right-0 mt-1 min-w-[180px] bg-elev hair z-50">
                        {categories.length === 0 && (
                          <div className="px-3 py-2 text-[11.5px] text-mute italic">Aucune catégorie</div>
                        )}
                        {categories.map((cat, idx) => {
                          const isCurrent = cat.id === document.id_categorie
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleChangeCategorie(cat.id)}
                              className={`w-full text-left px-3 py-1.5 text-[12px] flex items-center gap-2 transition-colors hover:bg-panel ${
                                isCurrent ? 'text-bright' : 'text-soft hover:text-bright'
                              }`}
                            >
                              <span className={`type-dot ${TYPE_DOTS[idx % TYPE_DOTS.length]}`}></span>
                              <span className="flex-1 truncate">{cat.nom}</span>
                              {isCurrent && (
                                <span className="material-symbols-outlined text-[14px] text-bright">check</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-mute">Créé</dt>
                  <dd className="text-bright font-mono text-[11px]">{formatDateTime(document.date_creation)}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-mute">Uploadé</dt>
                  <dd className="text-bright font-mono text-[11px]">{formatDateTime(document.date_upload)}</dd>
                </div>
                {document.auteur && (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-mute">Auteur</dt>
                    <dd className="text-bright">{document.auteur}</dd>
                  </div>
                )}
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-mute">Tags</dt>
                  <dd className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                    {document.tags.length === 0 && <span className="text-mute italic text-[11px]">aucun</span>}
                    {document.tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => handleRemoveTag(tag.id)}
                        className="hair px-1.5 py-0.5 font-mono text-[10px] text-soft hover:text-bright hover:border-soft transition-colors"
                        title="Retirer ce tag"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </dd>
                </div>
              </dl>

              {/* Tag picker */}
              <div className="mt-3 relative" ref={tagPickerRef}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onFocus={() => setShowTagSuggestions(true)}
                  onKeyDown={handleTagInputKeyDown}
                  disabled={isCreatingTag}
                  placeholder="Ajouter un tag…"
                  className="w-full bg-ink hair text-bright px-2 py-1.5 text-[11.5px] focus:outline-none focus:border-bright disabled:opacity-60"
                />

                {showTagSuggestions && (filteredSuggestions.length > 0 || canCreate) && (
                  <div className="absolute top-full left-0 right-0 bg-elev hair mt-1 z-50">
                    {filteredSuggestions.map((tag, idx) => (
                      <button
                        key={tag.id}
                        type="button"
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        onClick={() => handleAddTag(tag.id)}
                        className={`w-full text-left px-2 py-1.5 text-[11.5px] text-soft flex items-center gap-2 transition-colors ${
                          highlightedIndex === idx ? 'bg-panel text-bright' : ''
                        }`}
                      >
                        <span
                          className="w-1.5 h-1.5 inline-block"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </button>
                    ))}

                    {canCreate && (
                      <button
                        type="button"
                        onMouseEnter={() => setHighlightedIndex(filteredSuggestions.length)}
                        onClick={handleCreateAndAddTag}
                        disabled={isCreatingTag}
                        className={`w-full text-left px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-mute hair-t transition-colors ${
                          highlightedIndex === filteredSuggestions.length ? 'bg-panel text-bright' : ''
                        }`}
                      >
                        {isCreatingTag ? 'Création…' : `+ Créer "${tagInput.trim()}"`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Versions (placeholder — branchera quand back exposera l'historique) */}
            <div className="px-5 py-4 hair-b">
              <div className="flex items-center justify-between mb-3">
                <div className="section-label">Historique</div>
                <span className="font-mono text-[10px] text-mute">v{document.numero_version ?? '?'}</span>
              </div>
              <ol className="relative space-y-3">
                <li className="flex items-start gap-3">
                  <div className="shrink-0 w-6 flex flex-col items-center pt-1">
                    <span className="w-1.5 h-1.5 bg-bright"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-bright font-medium">v{document.numero_version ?? '?'}</span>
                      <span className="font-mono text-[10px] text-mute">— actuelle</span>
                    </div>
                    <span className="font-mono text-[10px] text-mute">{formatDateTime(document.date_upload)}</span>
                  </div>
                </li>
              </ol>
              <p className="text-[10.5px] text-mute italic mt-2">Multi-versions bientôt disponible.</p>
            </div>

            {/* Content preview */}
            {document.apercu_contenu && (
              <div className="px-5 py-4">
                <div className="section-label mb-3">Aperçu</div>
                <div className="hair p-3 bg-ink/40 font-mono text-[10.5px] text-soft leading-[1.7] whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                  {document.apercu_contenu}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  )
}

export default DocumentInlinePanel
