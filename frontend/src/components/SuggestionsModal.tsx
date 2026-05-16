import { useState } from "react"
import { useAgent } from "../contexts/AgentContext"
import type { Suggestion, SuggestionType } from "../hooks/useSuggestions"

const TYPE_LABEL: Record<SuggestionType, string> = {
  regroupement: "Regroupement",
  suppression:  "Suppression",
  tag:          "Tag",
}

function buildTitle(s: Suggestion): string {
  const nb = s.payload.documents.length
  if (s.type === 'regroupement') {
    const nom = s.payload.categorie_cible_nom
    if (nom) return `Regrouper ${nb} document${nb > 1 ? 's' : ''} dans "${nom}"`
    return `Regrouper ${nb} document${nb > 1 ? 's' : ''}`
  }
  if (s.type === 'suppression') {
    return `Mettre ${nb} document${nb > 1 ? 's' : ''} à la corbeille`
  }
  const tag = s.payload.tag_name ?? '—'
  return `Ajouter le tag "${tag}" à ${nb} document${nb > 1 ? 's' : ''}`
}

function SuggestionsModal() {
  const {
    suggestionsModalOpen,
    closeSuggestions,
    tourSuggestions,
    cardStates,
    currentIdx,
    currentSuggestion,
    validateCurrent,
    refuseCurrent,
    laterCurrent,
  } = useAgent()

  const [refusing, setRefusing] = useState(false)
  const [raison, setRaison] = useState('')
  const [confirming, setConfirming] = useState(false)

  if (!suggestionsModalOpen) return null

  const remaining = cardStates.filter(s => s === 'pending').length
  const allDone = tourSuggestions.length > 0 && remaining === 0

  const handleStartRefuse = () => {
    setRefusing(true)
    setRaison('')
  }

  const handleCancelRefuse = () => {
    setRefusing(false)
    setRaison('')
  }

  const handleConfirmRefuse = async () => {
    if (confirming) return
    setConfirming(true)
    try {
      const value = raison.trim()
      await refuseCurrent(value || null)
      setRefusing(false)
      setRaison('')
    } finally {
      setConfirming(false)
    }
  }

  const dotClassFor = (i: number): string => {
    const etat = cardStates[i]
    if (etat === 'done' || etat === 'refused') return 'done'
    if (etat === 'skipped') return 'skip'
    if (i === currentIdx) return 'current'
    return ''
  }

  return (
    <div className="backdrop">
      <div className="modal-sugg">

        <div className="head">
          <span className="section-label">Suggestions de l'agent</span>
          <span className="counter">
            {tourSuggestions.length > 0 ? `${currentIdx + 1} / ${tourSuggestions.length}` : '—'}
          </span>
          <button
            type="button"
            onClick={closeSuggestions}
            className="close"
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="progress-dots">
          {tourSuggestions.map((_, i) => (
            <div key={i} className={`dot ${dotClassFor(i)}`}></div>
          ))}
        </div>

        {allDone ? (
          <div className="body">
            <div className="end-card">
              <span className="material-symbols-outlined end-icon">task_alt</span>
              <h2>Toutes les suggestions ont été traitées</h2>
              <p>Tu peux relancer une analyse quand tu veux depuis la sidebar.</p>
              <button type="button" onClick={closeSuggestions} className="btn-primary">
                Fermer
              </button>
            </div>
          </div>
        ) : !currentSuggestion ? (
          <div className="body">
            <div className="end-card">
              <p>Aucune suggestion à afficher.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="body">
              <span className="type-badge">
                <span className="material-symbols-outlined text-[11px]">auto_awesome</span>
                {TYPE_LABEL[currentSuggestion.type]}
              </span>
              <h2>{buildTitle(currentSuggestion)}</h2>
              <p className="why">{currentSuggestion.payload.explication}</p>

              <div className="section-label docs-label">
                Documents concernés ({currentSuggestion.payload.documents.length})
              </div>
              <div className="docs-list">
                {currentSuggestion.payload.documents.map((doc) => {
                  const couleur = doc.type_fichier
                    ? `var(--type-${doc.type_fichier})`
                    : 'var(--mute)'
                  return (
                    <div key={doc.id} className="doc-row">
                      <span className="type-dot" style={{ background: couleur }}></span>
                      <span className="title">{doc.titre}</span>
                      {doc.categorie_nom && (
                        <span className="cat">{doc.categorie_nom}</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {refusing && (
                <div className="refuse-form">
                  <div className="refuse-label">Pourquoi refuser ?</div>
                  <h3>Aide l'agent à mieux comprendre</h3>
                  <p className="refuse-intro">
                    Ton retour reste optionnel. S'il est rempli, il sera utilisé plus tard pour affiner les prochaines suggestions.
                  </p>
                  <textarea
                    value={raison}
                    onChange={(e) => setRaison(e.target.value)}
                    placeholder="Ex : ces documents ne sont pas liés à la fiscalité, ils concernent ma vie personnelle…"
                  />
                  <div className="refuse-hint">Skippé si vide</div>
                  <div className="refuse-actions">
                    <button
                      type="button"
                      onClick={handleCancelRefuse}
                      className="btn-refuse-back"
                    >
                      <span className="material-symbols-outlined">arrow_back</span>
                      Retour
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRefuse}
                      disabled={confirming}
                      className="btn-refuse-confirm"
                    >
                      <span className="material-symbols-outlined">close</span>
                      Confirmer le refus
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!refusing && (
              <>
                <div className="later-row">
                  <button type="button" onClick={laterCurrent} className="btn-later">
                    Décider plus tard
                  </button>
                </div>
                <div className="foot">
                  <button type="button" onClick={handleStartRefuse} className="btn-refuse">
                    <span className="material-symbols-outlined">close</span>
                    Refuser
                  </button>
                  <button type="button" onClick={validateCurrent} className="btn-validate">
                    <span className="material-symbols-outlined">check</span>
                    Valider
                  </button>
                </div>
              </>
            )}
          </>
        )}

      </div>
    </div>
  )
}

export default SuggestionsModal
