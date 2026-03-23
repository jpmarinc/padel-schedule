import { useState } from 'react'
import { POSITIONS } from '../constants'
import { calcSetsStats } from '../lib/storage'

// ── Tennis Score Input ────────────────────────────────────────
function TennisScoreInput({ matchId, existing, players, matchPlayers, onSave, onCancel }) {
  const mp    = matchPlayers[matchId] || []
  const team1 = mp.filter(p => p.team === 1 && !p.is_free)
  const team2 = mp.filter(p => p.team === 2 && !p.is_free)

  const initSets = existing?.sets?.length > 0
    ? existing.sets.map(s => ({ t1: String(s.t1 ?? ''), t2: String(s.t2 ?? '') }))
    : [{ t1: '', t2: '' }]

  const [sets,   setSets]   = useState(initSets)
  const [winner, setWinner] = useState(existing?.winner_team ?? null)

  const getPlayerName = (id) => players.find(p => p.id === id)?.name || id

  const updateSet = (i, field, val) => {
    const next = sets.map((s, idx) => idx === i ? { ...s, [field]: val } : s)
    setSets(next)
    // Auto-detectar ganador si hay suficientes sets
    autoDetectWinner(next)
  }

  const autoDetectWinner = (currentSets) => {
    let w1 = 0, w2 = 0
    currentSets.forEach(s => {
      const t1 = Number(s.t1), t2 = Number(s.t2)
      if (!isNaN(t1) && !isNaN(t2) && s.t1 !== '' && s.t2 !== '') {
        if (t1 > t2) w1++; else if (t2 > t1) w2++
      }
    })
    if (w1 >= 2) setWinner(1)
    else if (w2 >= 2) setWinner(2)
  }

  const addSet = () => {
    if (sets.length < 3) setSets([...sets, { t1: '', t2: '' }])
  }

  const removeSet = (i) => {
    if (sets.length <= 1) return
    const next = sets.filter((_, idx) => idx !== i)
    setSets(next)
    autoDetectWinner(next)
  }

  // Stats en tiempo real para mostrar mientras se ingresa
  const parsedSets = sets.map(s => ({
    t1: Number(s.t1) || 0,
    t2: Number(s.t2) || 0,
    valid: s.t1 !== '' && s.t2 !== '',
  }))
  const liveW1 = parsedSets.filter(s => s.valid && s.t1 > s.t2).length
  const liveW2 = parsedSets.filter(s => s.valid && s.t2 > s.t1).length

  const canSave = winner && sets.some(s => s.t1 !== '' && s.t2 !== '')

  const handleSave = () => {
    const cleanSets = sets
      .filter(s => s.t1 !== '' && s.t2 !== '')
      .map(s => ({ t1: Number(s.t1), t2: Number(s.t2) }))
    onSave(matchId, { winner_team: winner, sets: cleanSets })
  }

  return (
    <div className="tennis-input">
      <div className="tennis-header-row">
        <span className="tennis-team-col">
          {team1.map(p => getPlayerName(p.player_id)).join(' & ')}
        </span>
        <span className="tennis-mid-label">Sets</span>
        <span className="tennis-team-col right">
          {team2.map(p => getPlayerName(p.player_id)).join(' & ')}
        </span>
      </div>

      {sets.map((s, i) => (
        <div key={i} className="tennis-set-row">
          <input
            className="tennis-score-input"
            type="number" min="0" max="7"
            value={s.t1}
            onChange={e => updateSet(i, 't1', e.target.value)}
            placeholder="0"
          />
          <span className="tennis-set-label">Set {i + 1}</span>
          <input
            className="tennis-score-input"
            type="number" min="0" max="7"
            value={s.t2}
            onChange={e => updateSet(i, 't2', e.target.value)}
            placeholder="0"
          />
          {sets.length > 1 && (
            <button className="tennis-remove-btn" onClick={() => removeSet(i)} title="Quitar set">✕</button>
          )}
        </div>
      ))}

      {sets.length < 3 && (
        <button className="btn-ghost btn-sm" onClick={addSet}>+ Agregar set</button>
      )}

      {/* Marcador live */}
      <div className="tennis-live-score">
        <span className={liveW1 >= 2 ? 'winner-score' : ''}>{liveW1}</span>
        <span className="tennis-live-sep">sets —</span>
        <span className={liveW2 >= 2 ? 'winner-score' : ''}>{liveW2}</span>
        <span className="tennis-live-sep">sets</span>
      </div>

      {/* Seleccionar ganador */}
      <div className="winner-selector">
        <p className="winner-selector-label">Ganador del partido:</p>
        <div className="winner-btns">
          <button
            className={`winner-btn ${winner === 1 ? 'active' : ''}`}
            onClick={() => setWinner(1)}
          >
            {team1.map(p => getPlayerName(p.player_id)).join(' & ')}
            {winner === 1 && ' 👑'}
          </button>
          <button
            className={`winner-btn ${winner === 2 ? 'active' : ''}`}
            onClick={() => setWinner(2)}
          >
            {team2.map(p => getPlayerName(p.player_id)).join(' & ')}
            {winner === 2 && ' 👑'}
          </button>
        </div>
      </div>

      <div className="tennis-actions">
        {onCancel && (
          <button className="btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
        )}
        <button className="btn-primary btn-sm" disabled={!canSave} onClick={handleSave}>
          Guardar resultado
        </button>
      </div>
    </div>
  )
}

// ── Result Summary (ya guardado) ──────────────────────────────
function ResultSummary({ result, players, matchPlayers, matchId, onEdit }) {
  const mp    = matchPlayers[matchId] || []
  const team1 = mp.filter(p => p.team === 1 && !p.is_free)
  const team2 = mp.filter(p => p.team === 2 && !p.is_free)
  const getName = id => players.find(p => p.id === id)?.name || id

  const { sets_t1, sets_t2 } = calcSetsStats(result)
  const setsStr = result.sets?.map(s => `${s.t1}-${s.t2}`).join(' / ') || '—'

  return (
    <div className="result-confirmed">
      <div className="result-confirmed-detail">
        <span className="result-sets-str">{setsStr}</span>
        <span className="result-sets-summary">
          {result.winner_team === 1
            ? team1.map(p => getName(p.player_id)).join(' & ')
            : team2.map(p => getName(p.player_id)).join(' & ')}
          {' '}ganó {sets_t1 > sets_t2 ? sets_t1 : sets_t2} - {sets_t1 > sets_t2 ? sets_t2 : sets_t1}
        </span>
      </div>
      <button className="btn-ghost btn-sm" onClick={onEdit}>Editar</button>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function HistoryTab({ matches, matchPlayers, results, players, saveResult, season }) {
  const [expandedId, setExpandedId] = useState(null)
  const [editingId,  setEditingId]  = useState(null)   // C-02 fix

  const seasonMatches = matches
    .filter(m => m.season_id === season?.id)
    .sort((a, b) => a.date_number - b.date_number)

  const getPlayerName = (id) => players.find(p => p.id === id)?.name || id

  const statusLabel = (m) => {
    if (m.status === 'played') return { label: 'Jugado', cls: 'played' }
    if (m.status === 'drawn')  return { label: 'Sorteado', cls: 'drawn' }
    return { label: 'Pendiente', cls: 'pending' }
  }

  const handleSaveResult = (matchId, result) => {
    saveResult(matchId, result)
    setEditingId(null)
  }

  if (seasonMatches.length === 0) return (
    <div className="empty-state">
      <span className="empty-icon">📅</span>
      <p>No hay fechas registradas aún.</p>
      <p className="empty-sub">Usa el sorteo del lunes para comenzar.</p>
    </div>
  )

  return (
    <div className="history-tab">
      <h2 className="section-title">Historial de Fechas</h2>
      {season && !season.active && (
        <div className="season-closed-banner">Temporada cerrada · solo lectura</div>
      )}

      <div className="match-list">
        {seasonMatches.map(match => {
          const mp     = matchPlayers[match.id] || []
          const team1  = mp.filter(p => p.team === 1 && !p.is_free)
          const team2  = mp.filter(p => p.team === 2 && !p.is_free)
          const free   = mp.filter(p => p.is_free)
          const result = results[match.id]
          const { label, cls } = statusLabel(match)
          const isOpen    = expandedId === match.id
          const isEditing = editingId === match.id

          const { sets_t1, sets_t2 } = result ? calcSetsStats(result) : {}

          return (
            <div key={match.id} className={`match-card ${cls}`}>
              <div
                className="match-card-header"
                onClick={() => setExpandedId(isOpen ? null : match.id)}
              >
                <div className="match-meta">
                  <span className="match-num">Fecha #{match.date_number}</span>
                  <span className="match-date">{match.match_date}</span>
                  {!match.counts_for_points && (
                    <span className="no-points-badge small">Sin puntos</span>
                  )}
                </div>
                <div className="match-meta-right">
                  <span className={`status-badge ${cls}`}>{label}</span>
                  {result && (
                    <span className="result-score">
                      {result.sets?.map(s => `${s.t1}-${s.t2}`).join(' ')}
                    </span>
                  )}
                  <span className="expand-icon">{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {isOpen && (
                <div className="match-card-body">
                  {mp.length > 0 ? (
                    <>
                      <div className="match-teams-row">
                        <div className="match-team">
                          <p className="match-team-title">
                            Pareja 1
                            {result?.winner_team === 1 && <span className="winner-crown"> 👑</span>}
                          </p>
                          {team1.map(p => (
                            <div key={p.id} className="match-player-row">
                              <span>{getPlayerName(p.player_id)}</span>
                              <span className="pos-tag small" style={{
                                color: POSITIONS[p.position]?.color,
                                background: POSITIONS[p.position]?.bg,
                              }}>{POSITIONS[p.position]?.label}</span>
                            </div>
                          ))}
                        </div>
                        <div className="match-vs">VS</div>
                        <div className="match-team">
                          <p className="match-team-title">
                            Pareja 2
                            {result?.winner_team === 2 && <span className="winner-crown"> 👑</span>}
                          </p>
                          {team2.map(p => (
                            <div key={p.id} className="match-player-row">
                              <span>{getPlayerName(p.player_id)}</span>
                              <span className="pos-tag small" style={{
                                color: POSITIONS[p.position]?.color,
                                background: POSITIONS[p.position]?.bg,
                              }}>{POSITIONS[p.position]?.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {free.length > 0 && (
                        <p className="free-player-note">
                          Descansó: {free.map(p => getPlayerName(p.player_id)).join(', ')}
                        </p>
                      )}

                      {/* Registrar resultado o editar */}
                      {(!result || isEditing) ? (
                        <div className="result-section">
                          <p className="result-section-title">
                            {isEditing ? 'Editar resultado' : 'Registrar resultado'}
                          </p>
                          <TennisScoreInput
                            matchId={match.id}
                            existing={result}
                            players={players}
                            matchPlayers={matchPlayers}
                            onSave={handleSaveResult}
                            onCancel={isEditing ? () => setEditingId(null) : null}
                          />
                        </div>
                      ) : (
                        <div className="result-section">
                          <p className="result-section-title">Resultado</p>
                          <ResultSummary
                            result={result}
                            players={players}
                            matchPlayers={matchPlayers}
                            matchId={match.id}
                            onEdit={() => setEditingId(match.id)}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="empty-sub">Sin datos de sorteo para esta fecha.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
