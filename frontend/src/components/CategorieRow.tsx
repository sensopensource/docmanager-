import { useState } from "react"
import type { Categorie } from "../types"
import { setDndPayload, getDndPayload, isDndDragging } from "../lib/dnd"

const TYPE_DOTS = ["bg-type-pdf", "bg-type-docx", "bg-type-txt", "bg-type-md", "bg-type-ai"]

type Props = {
  categorie: Categorie
  index: number
  onClick: () => void
  onDrop?: (payload: { kind: 'doc' | 'folder'; id: number }, targetCategorieId: number) => void
}

function CategorieRow({ categorie, index, onClick, onDrop }: Props) {
  const baseRowClass = index % 2 === 0 ? "row" : "row-alt"
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDndDragging(e)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const payload = getDndPayload(e)
    if (!payload || !onDrop) return
    if (payload.kind === 'folder' && payload.id === categorie.id) return
    onDrop(payload, categorie.id)
  }

  return (
    <div
      onClick={onClick}
      draggable
      onDragStart={(e) => setDndPayload(e, { kind: 'folder', id: categorie.id })}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${baseRowClass} flex items-center px-6 h-[44px] hair-b cursor-pointer transition-colors ${
        isDragOver ? '!bg-elev outline outline-1 outline-bright -outline-offset-1' : ''
      }`}
    >
      <div className="w-6"></div>
      <div className="flex-1 min-w-0 flex items-center gap-2.5">
        <span className="material-symbols-outlined text-[18px] text-soft">folder</span>
        <span className="text-[13px] text-bright truncate">{categorie.nom}</span>
        <span className={`type-dot ${TYPE_DOTS[index % TYPE_DOTS.length]}`}></span>
      </div>
      <div className="w-[140px] hidden lg:flex items-center">
        <span className="text-[11.5px] text-mute italic">Dossier</span>
      </div>
      <div className="w-[130px] hidden md:block font-mono text-[11px] text-mute">—</div>
      <div className="w-[60px] flex justify-end">
        <span className="font-mono text-[10px] text-mute">{categorie.count}</span>
      </div>
    </div>
  )
}

export default CategorieRow
