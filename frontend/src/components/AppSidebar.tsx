import { useState, useMemo, useRef, useEffect, type KeyboardEvent } from "react"
import { NavLink, useNavigate, useSearchParams } from "react-router-dom"
import { useCategories } from "../hooks/useCategories"
import { useDeleteCategorie } from "../hooks/useDeleteCategorie"
import { useDocuments } from "../hooks/useDocuments"
import { buildTree } from "../lib/categoriesTree"
import type { CategorieNode } from "../types"
import NewCategorieModal from "./NewCategorieModal"

const TYPE_DOTS = ["bg-type-pdf", "bg-type-docx", "bg-type-txt", "bg-type-md", "bg-type-ai"]

type NewCatTarget = { parentId: number | null; parentNom: string | null } | null

function CategorieTreeNode({
  node,
  selectedId,
  expanded,
  onToggle,
  onSelect,
  onAddChild,
  onRename,
  onDelete,
  colorIdx,
}: {
  node: CategorieNode
  selectedId: number | null
  expanded: Set<number>
  onToggle: (id: number) => void
  onSelect: (id: number) => void
  onAddChild: (parent: CategorieNode) => void
  onRename: (id: number, newNom: string) => void
  onDelete: (node: CategorieNode) => void
  colorIdx: number
}) {
  const isOpen = expanded.has(node.id)
  const isSelected = selectedId === node.id
  const hasChildren = node.children.length > 0

  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(node.nom)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    window.document.addEventListener('mousedown', handleClickOutside)
    return () => window.document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const startRename = () => {
    setEditValue(node.nom)
    setEditing(true)
    setMenuOpen(false)
  }

  const saveRename = () => {
    const value = editValue.trim()
    if (value && value !== node.nom) {
      onRename(node.id, value)
    }
    setEditing(false)
  }

  const cancelRename = () => {
    setEditValue(node.nom)
    setEditing(false)
  }

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveRename()
    if (e.key === 'Escape') cancelRename()
  }

  return (
    <div>
      <div
        onClick={() => !editing && onSelect(node.id)}
        className={`group flex items-center gap-1 px-2 py-1.5 text-[12.5px] transition-colors ${
          editing ? 'bg-elev' : ''
        } ${
          !editing && isSelected ? 'text-bright bg-elev cursor-pointer' :
          !editing ? 'text-soft hover:text-bright hover:bg-elev cursor-pointer' :
          'text-bright'
        }`}
        style={{ paddingLeft: `${8 + node.depth * 14}px` }}
      >
        {/* Chevron */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggle(node.id) }}
          className={`w-4 h-4 flex items-center justify-center shrink-0 transition-transform ${
            hasChildren ? 'text-mute hover:text-bright' : 'invisible'
          } ${isOpen ? 'rotate-90' : ''}`}
          aria-label={isOpen ? "Replier" : "Déplier"}
        >
          {hasChildren && <span className="material-symbols-outlined text-[14px]">chevron_right</span>}
        </button>

        <span className={`type-dot ${TYPE_DOTS[colorIdx % TYPE_DOTS.length]}`}></span>

        {editing ? (
          <input
            type="text"
            value={editValue}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={saveRename}
            className="flex-1 min-w-0 bg-ink hair text-bright text-[12.5px] px-1.5 py-0.5 focus:outline-none focus:border-bright"
          />
        ) : (
          <>
            <span className="flex-1 truncate">{node.nom}</span>
            <span className="font-mono text-[10px] text-mute">{node.count}</span>
          </>
        )}

        {/* Actions visibles au hover (cachees en mode edition) */}
        {!editing && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAddChild(node) }}
              className="opacity-0 group-hover:opacity-100 text-mute hover:text-bright transition-opacity shrink-0 ml-1"
              aria-label="Ajouter un sous-dossier"
              title="Ajouter un sous-dossier"
            >
              <span className="material-symbols-outlined text-[13px]">add</span>
            </button>

            {/* Menu kebab */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
                className={`text-mute hover:text-bright transition-opacity shrink-0 ${
                  menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                aria-label="Options"
              >
                <span className="material-symbols-outlined text-[15px]">more_vert</span>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 min-w-[140px] bg-elev hair z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={startRename}
                    className="w-full text-left px-3 py-1.5 text-[11.5px] text-soft hover:text-bright hover:bg-panel flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[13px]">edit</span>
                    Renommer
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onDelete(node) }}
                    className="w-full text-left px-3 py-1.5 text-[11.5px] text-soft hover:text-danger hover:bg-panel flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[13px]">delete</span>
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Enfants */}
      {isOpen && hasChildren && (
        <div>
          {node.children.map((child, idx) => (
            <CategorieTreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onRename={onRename}
              onDelete={onDelete}
              colorIdx={colorIdx + idx + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AppSidebar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { categories, updateCategorie } = useCategories()
  const { deleteCategorie, isPending: isDeleting } = useDeleteCategorie()
  const { total: totalDocs } = useDocuments(1, 1, null)
  const [newCatTarget, setNewCatTarget] = useState<NewCatTarget>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<CategorieNode | null>(null)

  const tree = useMemo(() => buildTree(categories), [categories])

  const selectedCatId = (() => {
    const v = searchParams.get('cat')
    return v ? Number(v) : null
  })()

  const handleImport = () => navigate('/documents?upload=1')

  const handleSelect = (id: number) => navigate(`/documents?cat=${id}`)

  const handleToggle = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleRename = (id: number, newNom: string) => {
    updateCategorie({ id, nom: newNom })
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    deleteCategorie(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
    })
  }

  return (
    <aside className="w-[280px] shrink-0 hair-r bg-panel flex flex-col">

      {/* Action block */}
      <div className="p-4 hair-b">
        <button
          onClick={handleImport}
          className="w-full flex items-center gap-2.5 px-4 h-11 bg-bright text-ink text-[13px] font-semibold hover:bg-white transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ color: '#0b0b0c' }}>upload</span>
          <span className="flex-1 text-left">Importer un document</span>
          <kbd className="on-light">⌘U</kbd>
        </button>
        <button
          onClick={() => setNewCatTarget({ parentId: null, parentNom: null })}
          className="w-full mt-2 flex items-center gap-2 px-3 h-9 hair text-[12px] text-soft hover:text-bright hover:bg-elev transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">add</span>
          <span className="flex-1 text-left">Nouveau dossier</span>
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-2">

        <div className="px-3 py-1.5">
          <div className="section-label px-2 mb-1">Espace</div>

          <NavLink
            to="/documents"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-2 py-1.5 text-[12.5px] transition-colors ${
                isActive && selectedCatId == null ? 'text-bright bg-elev' : 'text-soft hover:text-bright hover:bg-elev'
              }`
            }
          >
            <span className="material-symbols-outlined text-[15px] text-mute">folder_open</span>
            <span className="flex-1">Tous mes documents</span>
            <span className="font-mono text-[10px] text-mute">{totalDocs}</span>
          </NavLink>

          <NavLink
            to="/home"
            className={({ isActive }) =>
              `flex items-center gap-2 px-2 py-1.5 text-[12.5px] transition-colors ${
                isActive ? 'text-bright bg-elev' : 'text-soft hover:text-bright hover:bg-elev'
              }`
            }
          >
            <span className="material-symbols-outlined text-[15px] text-mute">space_dashboard</span>
            <span className="flex-1">Tableau de bord</span>
          </NavLink>
        </div>

        {/* Arbre des dossiers */}
        <div className="px-3 py-1.5 mt-2">
          <div className="section-label px-2 mb-1 flex items-center justify-between">
            <span>Dossiers</span>
            <button
              onClick={() => setNewCatTarget({ parentId: null, parentNom: null })}
              className="text-mute hover:text-bright"
              aria-label="Ajouter un dossier"
            >
              <span className="material-symbols-outlined text-[13px]">add</span>
            </button>
          </div>

          {tree.length === 0 && (
            <div className="px-2 py-1.5 text-[11px] text-mute italic">Aucun dossier</div>
          )}

          {tree.map((node, idx) => (
            <CategorieTreeNode
              key={node.id}
              node={node}
              selectedId={selectedCatId}
              expanded={expanded}
              onToggle={handleToggle}
              onSelect={handleSelect}
              onAddChild={(parent) => setNewCatTarget({ parentId: parent.id, parentNom: parent.nom })}
              onRename={handleRename}
              onDelete={(node) => setConfirmDelete(node)}
              colorIdx={idx}
            />
          ))}
        </div>
      </div>

      {/* Footer storage (placeholder) */}
      <div className="p-3 hair-t">
        <div className="flex items-center justify-between text-[10.5px] font-mono text-mute mb-1.5">
          <span>Stockage</span>
          <span>— / 10 GB</span>
        </div>
        <div className="h-[3px] bg-line w-full">
          <div className="h-full bg-soft" style={{ width: '0%' }}></div>
        </div>
      </div>

      {newCatTarget && (
        <NewCategorieModal
          parentId={newCatTarget.parentId}
          parentNom={newCatTarget.parentNom}
          onClose={() => setNewCatTarget(null)}
        />
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[420px] bg-panel hair flex flex-col"
          >
            <div className="px-5 py-3 hair-b">
              <div className="section-label">Supprimer le dossier</div>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-bright mb-2">
                Supprimer "<span className="font-semibold">{confirmDelete.nom}</span>" ?
              </p>
              {confirmDelete.children.length > 0 ? (
                <p className="text-[12px] text-danger">
                  Cette action supprimera aussi {confirmDelete.children.length}{' '}
                  {confirmDelete.children.length > 1 ? 'sous-dossiers' : 'sous-dossier'} et tous leurs documents.
                </p>
              ) : confirmDelete.count > 0 ? (
                <p className="text-[12px] text-soft">
                  {confirmDelete.count} document{confirmDelete.count > 1 ? 's' : ''} dans ce dossier {confirmDelete.count > 1 ? 'seront orphelins' : 'sera orphelin'}.
                </p>
              ) : (
                <p className="text-[12px] text-mute italic">Le dossier est vide.</p>
              )}
              <div className="flex items-center justify-end gap-2 mt-5">
                <button onClick={() => setConfirmDelete(null)} className="btn-ghost">
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="btn-primary !bg-danger !text-bright disabled:opacity-40"
                >
                  {isDeleting ? '...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

export default AppSidebar
