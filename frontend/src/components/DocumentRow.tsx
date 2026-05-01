import type { Document } from "../types"
import { setDndPayload } from "../lib/dnd"

type Props = {
  document: Document
  index: number
  isSelected: boolean
  onClick: () => void
  categorieNom?: string | null
  extrait?: string | null
}

const TYPE_ICONS: Record<string, string> = {
  pdf:  "picture_as_pdf",
  docx: "description",
  txt:  "article",
  md:   "code_blocks",
}

const TYPE_CLASS: Record<string, string> = {
  pdf:  "type-pdf",
  docx: "type-docx",
  txt:  "type-txt",
  md:   "type-md",
}

function DocumentRow({ document, index, isSelected, onClick, categorieNom, extrait }: Props) {
  const icon = document.type_fichier ? TYPE_ICONS[document.type_fichier] ?? "insert_drive_file" : "insert_drive_file"
  const typeClass = document.type_fichier ? TYPE_CLASS[document.type_fichier] ?? "" : ""
  const baseRowClass = index % 2 === 0 ? "row" : "row-alt"
  const selectedClass = isSelected ? "row-selected" : ""

  const dateFormatted = new Date(document.date_creation)
    .toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  const timeFormatted = new Date(document.date_creation)
    .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  return (
    <div
      onClick={onClick}
      draggable
      onDragStart={(e) => setDndPayload(e, { kind: 'doc', id: document.id })}
      className={`${baseRowClass} ${typeClass} ${selectedClass} flex items-center px-6 h-[44px] hair-b cursor-pointer transition-colors`}
    >
      <div className="w-6"></div>
      <div className="flex-1 min-w-0 flex items-center gap-2.5">
        <span className="material-symbols-outlined text-[18px] text-soft">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-bright truncate">{document.titre}</div>
          {extrait && (
            <div
              className="text-[11px] text-mute truncate [&>b]:text-soft [&>b]:font-semibold"
              dangerouslySetInnerHTML={{ __html: extrait }}
            />
          )}
        </div>
      </div>
      <div className="w-[140px] hidden lg:flex items-center">
        <span className="text-[11.5px] text-soft truncate">{categorieNom ?? '—'}</span>
      </div>
      <div className="w-[130px] hidden md:block font-mono text-[11px] text-mute">
        {dateFormatted}, {timeFormatted}
      </div>
      <div className="w-[60px] flex justify-end">
        {document.type_fichier && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-mute">
            {document.type_fichier}
          </span>
        )}
      </div>
    </div>
  )
}

export default DocumentRow
