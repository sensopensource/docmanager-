/**
 * Petites utilités pour partager le format du payload drag & drop entre
 * les composants source (DocumentRow, CategorieTreeNode) et cible (sidebar, table).
 *
 * On stocke un JSON dans dataTransfer plutot qu'un global, comme ca chaque
 * element source porte sa propre identite et le browser gere le cycle de vie.
 */

export type DndPayload =
  | { kind: 'doc'; id: number }
  | { kind: 'folder'; id: number }

const MIME = 'application/x-senso-dnd'

export function setDndPayload(e: React.DragEvent, payload: DndPayload) {
  e.dataTransfer.setData(MIME, JSON.stringify(payload))
  e.dataTransfer.effectAllowed = 'move'
}

export function getDndPayload(e: React.DragEvent): DndPayload | null {
  const raw = e.dataTransfer.getData(MIME)
  if (!raw) return null
  try {
    return JSON.parse(raw) as DndPayload
  } catch {
    return null
  }
}

/**
 * Lecture du type sans consommer le payload (dataTransfer.getData ne marche
 * que sur drop, pas sur dragOver, donc on regarde juste la presence du MIME).
 */
export function isDndDragging(e: React.DragEvent): boolean {
  return e.dataTransfer.types.includes(MIME)
}
