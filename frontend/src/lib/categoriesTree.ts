import type { Categorie, CategorieNode } from "../types"

/**
 * Construit l'arbre de catégories à partir de la liste plate du back.
 * - Une catégorie sans id_parent (null) est une racine.
 * - Les enfants sont triés par nom.
 * - Chaque nœud a une profondeur (0 pour les racines).
 */
export function buildTree(flat: Categorie[]): CategorieNode[] {
  const byId = new Map<number, CategorieNode>()
  for (const cat of flat) {
    byId.set(cat.id, { ...cat, children: [], depth: 0 })
  }

  const roots: CategorieNode[] = []
  for (const node of byId.values()) {
    if (node.id_parent != null && byId.has(node.id_parent)) {
      byId.get(node.id_parent)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Tri + propagation de la profondeur
  const sortRecursive = (nodes: CategorieNode[], depth: number) => {
    nodes.sort((a, b) => a.nom.localeCompare(b.nom))
    for (const n of nodes) {
      n.depth = depth
      sortRecursive(n.children, depth + 1)
    }
  }
  sortRecursive(roots, 0)
  return roots
}

/**
 * Trouve tous les ancêtres d'une catégorie (du parent direct à la racine).
 * Utile pour le breadcrumb.
 */
export function getAncestors(flat: Categorie[], id: number): Categorie[] {
  const byId = new Map(flat.map(c => [c.id, c]))
  const chain: Categorie[] = []
  let current = byId.get(id)
  while (current) {
    chain.unshift(current)
    current = current.id_parent != null ? byId.get(current.id_parent) : undefined
  }
  return chain
}

/**
 * Renvoie les enfants directs d'une catégorie (ou les racines si null).
 */
export function getDirectChildren(flat: Categorie[], parentId: number | null): Categorie[] {
  return flat
    .filter(c => c.id_parent === parentId)
    .sort((a, b) => a.nom.localeCompare(b.nom))
}
