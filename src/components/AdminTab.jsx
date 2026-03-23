import { useState } from 'react'

function buildSeasonName(allSeasons) {
  const year = new Date().getFullYear()
  const num  = allSeasons.length + 1
  return `Temporada ${num} — ${year}`
}

export default function AdminTab({
  players, season, allSeasons, matches, matchPlayers,
  addGalleta, updatePlayer, deletePlayer, updateSeasonConfig, closeSeason, createSeason, ranking,
}) {
  const [newGalleta,    setNewGalleta]    = useState('')
  const [showClose,     setShowClose]     = useState(false)
  const [showEarlyWarn, setShowEarlyWarn] = useState(false)
  const [champId,       setChampId]       = useState('')
  const [showNewSeason, setShowNewSeason] = useState(false)
  const [newSeasonName, setNewSeasonName] = useState('')
  const [newSeasonDate, setNewSeasonDate] = useState(new Date().toISOString().split('T')[0])

  const playedCount = (matches || []).filter(m => m.status === 'played' && m.season_id === season?.id).length
  const remaining   = (season?.total_dates || 12) - playedCount

  const titulares = players.filter(p => !p.is_galleta)
  const galletas  = players.filter(p => p.is_galleta)

  // Contar partidos jugados por jugador (para bloquear borrado si tiene historial)
  const playerPJ = (playerId) =>
    Object.values(matchPlayers || {}).flat()
      .filter(mp => mp.player_id === playerId && !mp.is_free).length

  const handleAddGalleta = () => {
    const name = newGalleta.trim()
    if (!name) return
    addGalleta(name)
    setNewGalleta('')
  }

  const handleCloseClick = () => {
    if (remaining > 0) setShowEarlyWarn(true)
    else setShowClose(true)
  }

  const handleCloseSeason = () => {
    if (!champId) return
    closeSeason(champId)
    setShowClose(false)
  }

  const handleCreateSeason = () => {
    const name = newSeasonName.trim()
    if (!name) return
    createSeason(name, newSeasonDate)
    setShowNewSeason(false)
    setNewSeasonName('')
  }

  const ranked = ranking()
  const leader = ranked[0]

  return (
    <div className="admin-tab">
      <h2 className="section-title">Configuración</h2>

      {/* Sin temporada activa → invitar a crear */}
      {!season && (
        <div className="admin-section">
          <div className="no-season-banner">
            <p>No hay temporada activa.</p>
            <button className="btn-primary" onClick={() => { setNewSeasonName(buildSeasonName(allSeasons || [])); setShowNewSeason(true) }}>
              + Nueva temporada
            </button>
          </div>
        </div>
      )}

      {/* Formulario nueva temporada */}
      {showNewSeason && (
        <div className="new-season-form">
          <p className="close-season-title">Nueva temporada</p>
          <div className="admin-field">
            <label>Nombre</label>
            <input
              type="text"
              className="input-full"
              placeholder="Ej: Temporada 2 — 2026"
              value={newSeasonName}
              onChange={e => setNewSeasonName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateSeason()}
              autoFocus
            />
          </div>
          <div className="admin-field">
            <label>Fecha de inicio</label>
            <input type="date" className="date-input" value={newSeasonDate} onChange={e => setNewSeasonDate(e.target.value)} />
          </div>
          <div className="close-season-actions">
            <button className="btn-ghost" onClick={() => setShowNewSeason(false)}>Cancelar</button>
            <button className="btn-primary" disabled={!newSeasonName.trim()} onClick={handleCreateSeason}>
              Crear temporada
            </button>
          </div>
        </div>
      )}

      {/* Temporada activa */}
      {season && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h3 className="admin-section-title">Temporada Activa</h3>
            <button className="btn-ghost btn-sm" onClick={() => { setNewSeasonName(buildSeasonName(allSeasons || [])); setShowNewSeason(!showNewSeason) }}>
              + Nueva
            </button>
          </div>

          <div className="admin-card">
            <div className="admin-field">
              <label>Nombre</label>
              <span className="admin-value">{season.name}</span>
            </div>
            <div className="admin-field">
              <label>Inicio</label>
              <span className="admin-value">{season.started_at}</span>
            </div>
            <div className="admin-field">
              <label>Total fechas</label>
              <input
                type="number" min="1" max="30"
                value={season.total_dates}
                onChange={e => updateSeasonConfig({ total_dates: Number(e.target.value) })}
                className="input-inline"
              />
            </div>
          </div>

          {showEarlyWarn && (
            <div className="early-warn-modal">
              <p className="early-warn-title">⚠️ Faltan fechas por jugar</p>
              <p className="early-warn-body">
                Quedan <strong>{remaining}</strong> de {season.total_dates} fechas sin jugarse.
                ¿Estás seguro de que querés cerrar la temporada ahora?
              </p>
              <div className="close-season-actions">
                <button className="btn-ghost" onClick={() => setShowEarlyWarn(false)}>Cancelar</button>
                <button className="btn-danger" onClick={() => { setShowEarlyWarn(false); setShowClose(true) }}>
                  Sí, cerrar igual
                </button>
              </div>
            </div>
          )}

          {!showClose && !showEarlyWarn && (
            <button className="btn-danger" onClick={handleCloseClick}>
              🏆 Cerrar temporada y declarar campeón
            </button>
          )}

          {showClose && (
            <div className="close-season-form">
              <p className="close-season-title">¿Quién es el campeón?</p>
              {leader && leader.pj > 0 && (
                <p className="close-season-hint">
                  Líder actual: <strong>{leader.player.name}</strong> ({leader.ptsContados} pts)
                </p>
              )}
              <select value={champId} onChange={e => setChampId(e.target.value)} className="select-full">
                <option value="">Seleccionar campeón...</option>
                {titulares.filter(p => p.active).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="close-season-actions">
                <button className="btn-ghost" onClick={() => setShowClose(false)}>Cancelar</button>
                <button className="btn-danger" disabled={!champId} onClick={handleCloseSeason}>
                  Confirmar cierre
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Jugadores titulares */}
      <div className="admin-section">
        <h3 className="admin-section-title">Jugadores Titulares</h3>
        <p className="admin-section-desc">
          <strong>Activo:</strong> participa en sorteos. <strong>Inactivo:</strong> no aparece en sorteos pero conserva su historial y posición en el ranking.
        </p>
        <div className="admin-card">
          {titulares.map(p => (
            <div key={p.id} className="admin-player-row">
              <span className={`player-name-admin ${!p.active ? 'inactive' : ''}`}>
                {p.name}
                {!p.active && <span className="inactive-badge">Inactivo</span>}
              </span>
              <div className="admin-player-actions">
                <label className="toggle-label" title="Activo = aparece en sorteos">
                  <input
                    type="checkbox"
                    checked={!!p.active}
                    onChange={e => updatePlayer(p.id, { active: e.target.checked })}
                  />
                  {p.active ? 'Activo' : 'Inactivo'}
                </label>
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => updatePlayer(p.id, { is_galleta: true, active: true })}
                  title="Mover a lista de galletas"
                >
                  ↓ Galleta
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Jugadores galleta */}
      <div className="admin-section">
        <h3 className="admin-section-title">Jugadores Galleta</h3>
        <p className="admin-section-desc">
          Suplentes e invitados. Pueden sortear y jugar, pero no suman al ranking del torneo.
        </p>

        {galletas.length > 0 && (
          <div className="admin-card">
            {galletas.map(p => {
              const pj = playerPJ(p.id)
              return (
                <div key={p.id} className="admin-player-row">
                  <span className="player-name-admin">
                    {p.name} <span className="galleta-tag">Galleta</span>
                  </span>
                  <div className="admin-player-actions">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={!!p.active}
                        onChange={e => updatePlayer(p.id, { active: e.target.checked })}
                      />
                      Activo
                    </label>
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => updatePlayer(p.id, { is_galleta: false })}
                      title="Promover a titular del torneo"
                    >
                      ↑ Titular
                    </button>
                    {pj === 0 && (
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => {
                          if (window.confirm(`¿Borrar a ${p.name}? Esta acción no se puede deshacer.`))
                            deletePlayer(p.id)
                        }}
                        title="Borrar jugador"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="add-galleta-form">
          <input
            type="text"
            placeholder="Nombre del jugador galleta"
            value={newGalleta}
            onChange={e => setNewGalleta(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddGalleta()}
            className="input-full"
          />
          <button className="btn-secondary" onClick={handleAddGalleta} disabled={!newGalleta.trim()}>
            + Agregar
          </button>
        </div>
      </div>

      {/* Lógica de ranking */}
      {season && (
        <div className="admin-section">
          <h3 className="admin-section-title">Lógica de Ranking</h3>
          <div className="admin-card">
            <div className="admin-field">
              <label>Modo activo</label>
              <select
                value={season.ranking_mode || 'best_n'}
                onChange={e => updateSeasonConfig({ ranking_mode: e.target.value })}
                className="select-full"
              >
                <option value="absolute">Puntos Absolutos</option>
                <option value="winrate">Win Rate %</option>
                <option value="best_n">Mejores N partidos</option>
              </select>
            </div>
            {season.ranking_mode === 'best_n' && (
              <div className="admin-field">
                <label>N fijo (vacío = automático)</label>
                <input
                  type="number" min="1" max="12"
                  value={season.best_n || ''}
                  onChange={e => updateSeasonConfig({ best_n: e.target.value ? Number(e.target.value) : null })}
                  className="input-inline"
                  placeholder="Auto"
                />
              </div>
            )}
            {season.ranking_mode === 'winrate' && (
              <div className="admin-field">
                <label>Mínimo PJ para clasificar</label>
                <input
                  type="number" min="1" max="12"
                  value={season.min_pj || 6}
                  onChange={e => updateSeasonConfig({ min_pj: Number(e.target.value) })}
                  className="input-inline"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
