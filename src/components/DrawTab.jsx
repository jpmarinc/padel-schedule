import { useState, useCallback } from 'react'
import { POSITIONS, QUORUM_REQUIRED } from '../constants'
import { generateDraw } from '../lib/drawUtils'

function PlayerBadge({ player, position }) {
  const pos = POSITIONS[position]
  return (
    <div className="player-badge" style={{ '--pos-color': pos?.color, '--pos-bg': pos?.bg }}>
      <span className="player-name">{player.name}</span>
      <span className="pos-tag" style={{ color: pos?.color, background: pos?.bg }}>{pos?.label}</span>
      {player.is_galleta && <span className="galleta-tag">Galleta</span>}
    </div>
  )
}

function getNextMonday(fromDateStr) {
  const d = new Date(fromDateStr + 'T12:00:00')
  const day = d.getDay()
  // If fromDate is already a Monday, jump to the NEXT Monday (+7)
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7
  d.setDate(d.getDate() + daysUntilMonday)
  return d.toISOString().split('T')[0]
}

function suggestedDate(seasonMatches) {
  const played = seasonMatches.filter(m => m.match_date)
  if (played.length === 0) {
    // No matches yet — suggest this coming Monday (or today if Monday)
    const today = new Date()
    const day   = today.getDay()
    const diff  = day === 1 ? 0 : (8 - day) % 7
    today.setDate(today.getDate() + diff)
    return today.toISOString().split('T')[0]
  }
  const lastDate = [...played].sort((a, b) => a.match_date > b.match_date ? -1 : 1)[0].match_date
  return getNextMonday(lastDate)
}

// Construye el historial de partidos en el formato que espera drawUtils
function buildMatchHistory(matches, matchPlayers) {
  return matches
    .filter(m => m.status !== 'pending')
    .sort((a, b) => a.date_number - b.date_number)
    .map(m => ({ id: m.id, players: matchPlayers[m.id] || [] }))
}

export default function DrawTab({
  players, season, matches, matchPlayers,
  saveDraw, pendingDraw, setPendingDraw,
}) {
  const titulares = players.filter(p => !p.is_galleta && p.active)
  const galletas  = players.filter(p => p.is_galleta && p.active)

  const seasonMatches  = matches.filter(m => m.season_id === season?.id)
  const nextDateNumber = seasonMatches.length > 0
    ? Math.max(...seasonMatches.map(m => m.date_number)) + 1
    : 1

  // Estado local solo para la animación de spinning
  const [spinning, setSpinning] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)

  // Inicializar estado si no hay pendingDraw
  const state = pendingDraw || {
    step: 'attendance',
    matchDate: suggestedDate(seasonMatches),
    present: {},
    draw: null,
  }

  // Validar si ya existe un partido guardado para la fecha seleccionada
  const dateAlreadyUsed = seasonMatches.some(
    m => m.match_date === state.matchDate && m.status !== 'pending'
  )

  const setState = useCallback((patch) => {
    setPendingDraw(prev => ({ ...(prev || state), ...patch }))
  }, [setPendingDraw, state])

  const togglePresent = (id) =>
    setState({ present: { ...state.present, [id]: !state.present[id] } })

  const MAX_PLAYERS    = 4
  const presentIds     = Object.entries(state.present).filter(([,v]) => v).map(([k]) => k)
  const presentPlayers = players.filter(p => presentIds.includes(p.id))
  const presentTits    = presentPlayers.filter(p => !p.is_galleta)
  const quorumOk       = presentTits.length >= QUORUM_REQUIRED
  const canDraw        = presentPlayers.length === MAX_PLAYERS
  const atMax          = presentPlayers.length >= MAX_PLAYERS

  const handleSortear = useCallback(() => {
    setSpinning(true)
    const history = buildMatchHistory(seasonMatches, matchPlayers)
    setTimeout(() => {
      const draw = generateDraw(presentPlayers, history)
      setState({ draw, step: 'draw' })
      setSpinning(false)
    }, 1200)
  }, [presentPlayers, matches, matchPlayers, setState])

  const handleResortear = useCallback(() => {
    setSpinning(true)
    const history = buildMatchHistory(seasonMatches, matchPlayers)
    setTimeout(() => {
      const draw = generateDraw(presentPlayers, history)
      setState({ draw })
      setSpinning(false)
    }, 800)
  }, [presentPlayers, matches, matchPlayers, setState])

  const handleConfirm = useCallback(() => {
    const { draw, matchDate } = state
    if (!draw) return
    const drawResult = [
      ...draw.team1.map(d => ({ player_id: d.player.id, team: d.team, position: d.position, is_free: false })),
      ...draw.team2.map(d => ({ player_id: d.player.id, team: d.team, position: d.position, is_free: false })),
      ...draw.free.map(p  => ({ player_id: p.id, team: 0, position: 'drive', is_free: true })),
    ]
    saveDraw(matchDate, nextDateNumber, presentIds, drawResult)
    setState({ step: 'confirm' })
  }, [state, nextDateNumber, presentIds, saveDraw, setState])

  const handleDiscard = () => {
    setPendingDraw(null)
    setShowDiscard(false)
  }

  const handleReset = () => setPendingDraw(null)

  // Guards
  if (!season) return (
    <div className="empty-state">
      <p>No hay temporada activa. Configura una desde Admin.</p>
    </div>
  )
  if (nextDateNumber > (season.total_dates || 12)) return (
    <div className="empty-state">
      <span className="empty-icon">🏆</span>
      <p>¡Las {season.total_dates} fechas de la temporada ya fueron jugadas!</p>
      <p className="empty-sub">Puedes cerrar la temporada desde Admin.</p>
    </div>
  )

  return (
    <div className="draw-tab">
      <div className="draw-header">
        <h2 className="section-title">Sorteo del Lunes</h2>
        <span className="date-badge">Fecha #{nextDateNumber}</span>
      </div>

      {/* ── Step 1: Asistencia ── */}
      {state.step === 'attendance' && (
        <div className="attendance-section">
          <div className="date-picker-row">
            <label>Fecha del partido</label>
            <input
              type="date"
              value={state.matchDate}
              onChange={e => setState({ matchDate: e.target.value })}
              className={`date-input ${dateAlreadyUsed ? 'date-input-warn' : ''}`}
            />
            {dateAlreadyUsed && (
              <span className="date-warn-badge">⚠ Ya hay un sorteo para esta fecha</span>
            )}
          </div>

          <div className="attendance-header">
            <p className="section-subtitle">¿Quiénes vienen hoy?</p>
            <span className={`attendance-counter ${atMax ? 'at-max' : ''}`}>
              {presentPlayers.length}/{MAX_PLAYERS}
            </span>
          </div>

          <div className="players-group">
            <p className="group-label">Titulares</p>
            {titulares.map(p => {
              const checked   = !!state.present[p.id]
              const disabled  = !checked && atMax
              return (
                <label key={p.id} className={`player-check ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}>
                  <input type="checkbox" checked={checked} disabled={disabled} onChange={() => togglePresent(p.id)} />
                  <span className="player-check-name">{p.name}</span>
                  {checked && <span className="check-icon">✓</span>}
                </label>
              )
            })}
          </div>

          {galletas.length > 0 && (
            <div className="players-group">
              <p className="group-label">Galletas</p>
              {galletas.map(p => {
                const checked  = !!state.present[p.id]
                const disabled = !checked && atMax
                return (
                  <label key={p.id} className={`player-check galleta ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}>
                    <input type="checkbox" checked={checked} disabled={disabled} onChange={() => togglePresent(p.id)} />
                    <span className="player-check-name">{p.name}</span>
                    <span className="galleta-tag">Galleta</span>
                    {checked && <span className="check-icon">✓</span>}
                  </label>
                )
              })}
            </div>
          )}

          <div className="quorum-info">
            <div className={`quorum-badge ${quorumOk ? 'ok' : 'warn'}`}>
              {quorumOk
                ? `✓ Quórum OK — ${presentTits.length} titulares`
                : `⚠ Solo ${presentTits.length} titulares — la fecha NO sumará puntos`}
            </div>
            {!atMax && (
              <div className="quorum-badge warn">
                {presentPlayers.length === 0
                  ? `Seleccioná exactamente ${MAX_PLAYERS} jugadores`
                  : `Seleccioná ${MAX_PLAYERS - presentPlayers.length} jugador${MAX_PLAYERS - presentPlayers.length > 1 ? 'es' : ''} más`}
              </div>
            )}
          </div>

          <button className="btn-primary btn-large" disabled={!canDraw || dateAlreadyUsed} onClick={handleSortear}>
            {dateAlreadyUsed
              ? '⚠ Cambiá la fecha para sortear'
              : canDraw
                ? '🎲 Sortear Parejas'
                : `Seleccioná exactamente 4 jugadores (${presentPlayers.length}/4)`}
          </button>
        </div>
      )}

      {/* ── Step 2: Resultado del sorteo ── */}
      {state.step === 'draw' && (
        <div className="draw-result-section">
          {!quorumOk && (
            <div className="quorum-badge warn mb-16">
              ⚠ Esta fecha NO sumará puntos (quórum insuficiente)
            </div>
          )}

          {spinning ? (
            <div className="spinning-container">
              <div className="spinning-ball">🎾</div>
              <p className="spinning-text">Sorteando...</p>
            </div>
          ) : state.draw && (
            <>
              <div className="teams-container">
                <div className="team-card team-1">
                  <div className="team-header"><span className="team-label">Pareja 1</span></div>
                  {state.draw.team1.map((d, i) => (
                    <PlayerBadge key={i} player={d.player} position={d.position} />
                  ))}
                </div>
                <div className="vs-divider">VS</div>
                <div className="team-card team-2">
                  <div className="team-header"><span className="team-label">Pareja 2</span></div>
                  {state.draw.team2.map((d, i) => (
                    <PlayerBadge key={i} player={d.player} position={d.position} />
                  ))}
                </div>
              </div>

              {state.draw.free.length > 0 && (
                <div className="free-player">
                  <span className="free-label">Descansa:</span>
                  {state.draw.free.map((p, i) => (
                    <span key={i} className="free-name">{p.name}</span>
                  ))}
                </div>
              )}

              <div className="draw-actions">
                <button className="btn-ghost" onClick={() => setShowDiscard(true)}>
                  🗑 Descartar partido
                </button>
                <button className="btn-secondary" onClick={handleResortear}>↺ Re-sortear</button>
                <button className="btn-primary" onClick={handleConfirm}>✓ Confirmar</button>
              </div>

              {showDiscard && (
                <div className="discard-confirm">
                  <p>¿Seguro que querés descartar este sorteo? No se guardará nada.</p>
                  <div className="discard-actions">
                    <button className="btn-ghost btn-sm" onClick={() => setShowDiscard(false)}>Cancelar</button>
                    <button className="btn-danger btn-sm" onClick={handleDiscard}>Sí, descartar</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Step 3: Confirmado ── */}
      {state.step === 'confirm' && (
        <div className="confirmed-section">
          <div className="confirmed-icon">🎾</div>
          <h3 className="confirmed-title">¡Sorteo guardado!</h3>
          <p className="confirmed-sub">
            Fecha #{nextDateNumber - 1} · {state.matchDate}
            {!quorumOk && <span className="no-points-badge"> · Sin puntos</span>}
          </p>
          {state.draw && (
            <div className="teams-container small">
              <div className="team-card team-1">
                <p className="team-label">Pareja 1</p>
                {state.draw.team1.map((d, i) => <PlayerBadge key={i} player={d.player} position={d.position} />)}
              </div>
              <div className="vs-divider">VS</div>
              <div className="team-card team-2">
                <p className="team-label">Pareja 2</p>
                {state.draw.team2.map((d, i) => <PlayerBadge key={i} player={d.player} position={d.position} />)}
              </div>
            </div>
          )}
          <button className="btn-secondary mt-16" onClick={handleReset}>+ Nuevo sorteo</button>
        </div>
      )}
    </div>
  )
}
