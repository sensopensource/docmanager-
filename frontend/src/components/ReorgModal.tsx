import { useEffect, useRef, useState } from "react"
import { useAgent } from "../contexts/AgentContext"
import type { Suggestion } from "../hooks/useSuggestions"

const DUREE = 5

function buildDesc(s: Suggestion): string {
  const nb = s.payload.documents.length
  if (s.type === 'regroupement') {
    const nom = s.payload.categorie_cible_nom
    const nouvelle = s.payload.categorie_cible_id == null
    if (nouvelle && nom) {
      return `Création de la catégorie "${nom}" et déplacement de ${nb} document${nb > 1 ? 's' : ''}.`
    }
    if (nom) {
      return `Déplacement de ${nb} document${nb > 1 ? 's' : ''} vers "${nom}".`
    }
    return `Déplacement de ${nb} document${nb > 1 ? 's' : ''}.`
  }
  if (s.type === 'suppression') {
    return `Mise à la corbeille de ${nb} document${nb > 1 ? 's' : ''} (réversible).`
  }
  const tag = s.payload.tag_name ?? '—'
  return `Ajout du tag "${tag}" à ${nb} document${nb > 1 ? 's' : ''}.`
}

type InnerProps = {
  suggestion: Suggestion | null
  onConfirm: () => void
  onCancel: () => void
}

function ReorgModalInner({ suggestion, onConfirm, onCancel }: InnerProps) {
  const [countdown, setCountdown] = useState(DUREE)
  const declenche = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => c - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (countdown > 0) return
    if (declenche.current) return
    declenche.current = true
    onConfirm()
  }, [countdown, onConfirm])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const affiche = Math.max(0, countdown)
  const desc = suggestion ? buildDesc(suggestion) : ''

  return (
    <div className="backdrop">
      <div className="modal-reorg">
        <span className="label">Réorganisation en cours</span>

        <div className="reorg-counter">{affiche}</div>
        <div className="reorg-counter-unit">seconde{affiche > 1 ? 's' : ''} restante{affiche > 1 ? 's' : ''}</div>

        <h3>Application de la suggestion</h3>
        <p className="desc">{desc}</p>

        <div className="reorg-bar">
          <div className="reorg-bar-fill run"></div>
        </div>

        <button type="button" className="btn-cancel-reorg" onClick={onCancel}>
          <span className="material-symbols-outlined">undo</span>
          Annuler maintenant
          <span className="kbd-hint">Échap</span>
        </button>

        <div className="reorg-warn"><b>Action irréversible</b> · après le décompte</div>
      </div>
    </div>
  )
}

function ReorgModal() {
  const {
    reorgOpen,
    pendingValidationId,
    tourSuggestions,
    confirmReorg,
    cancelReorg,
  } = useAgent()

  if (!reorgOpen) return null

  const suggestion = tourSuggestions.find(s => s.id === pendingValidationId) ?? null

  return (
    <ReorgModalInner
      key={pendingValidationId ?? 'reorg'}
      suggestion={suggestion}
      onConfirm={confirmReorg}
      onCancel={cancelReorg}
    />
  )
}

export default ReorgModal
