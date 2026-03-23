import { RANKING_MODES } from '../constants'

function getMedal(pos) {
  if (pos === 0) return '🥇'
  if (pos === 1) return '🥈'
  if (pos === 2) return '🥉'
  return `${pos + 1}`
}

export default function RankingTab({
  ranking, season, allSeasons,
  viewSeason, viewSeasonId, setViewSeasonId,
  updateSeasonConfig, onShowCeremony,
}) {
  const displaySeason = viewSeason || season
  const mode   = displaySeason?.ranking_mode || 'best_n'
  const bestN  = displaySeason?.best_n
  const minPJ  = displaySeason?.min_pj || 6
  const isActive = displaySeason?.active !== false

  const ranked = ranking(displaySeason?.id)

  const autoN = Math.min(...ranked.filter(r => r.pj > 0).map(r => r.pj), Infinity)
  const effectiveN = mode === 'best_n' ? (bestN || (isFinite(autoN) ? autoN : '?')) : null

  const closedSeasons = allSeasons.filter(s => !s.active)

  return (
    <div className="ranking-tab">

      {/* Selector de temporada */}
      {allSeasons.length > 1 && (
        <div className="season-selector-row">
          <label className="season-selector-label">Temporada:</label>
          <select
            className="select-inline"
            value={viewSeasonId || (season?.id || '')}
            onChange={e => setViewSeasonId(e.target.value === (season?.id || '') ? null : e.target.value)}
          >
            {season && <option value={season.id}>{season.name} (activa)</option>}
            {closedSeasons.map(s => (
              <option key={s.id} value={s.id}>{s.name} ✓</option>
            ))}
          </select>
          {!isActive && onShowCeremony && (
            <button className="btn-ghost btn-sm" onClick={onShowCeremony}>
              🏆 Ver ceremonia
            </button>
          )}
        </div>
      )}

      <h2 className="section-title">
        Tabla de Posiciones
        {!isActive && <span className="season-closed-badge">Cerrada</span>}
      </h2>

      {/* Modo de ranking — solo editable en temporada activa */}
      {isActive && (
        <>
          <div className="mode-selector">
            {Object.values(RANKING_MODES).map(m => (
              <button
                key={m.id}
                className={`mode-btn ${mode === m.id ? 'active' : ''}`}
                onClick={() => updateSeasonConfig({ ranking_mode: m.id })}
              >
                <span className="mode-icon">{m.icon}</span>
                <span className="mode-label">{m.label}</span>
              </button>
            ))}
          </div>

          <p className="mode-description">{RANKING_MODES[mode]?.description}</p>

          {mode === 'best_n' && (
            <div className="config-row">
              <label>
                N (mejores partidos):
                <select
                  value={bestN || ''}
                  onChange={e => updateSeasonConfig({ best_n: e.target.value ? Number(e.target.value) : null })}
                  className="select-inline"
                >
                  <option value="">Auto ({isFinite(autoN) ? autoN : '?'})</option>
                  {[3,4,5,6,7,8,9,10,11,12].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              {effectiveN !== '?' && (
                <span className="config-hint">Contando los mejores {effectiveN} de cada jugador</span>
              )}
            </div>
          )}

          {mode === 'winrate' && (
            <div className="config-row">
              <label>
                Mínimo PJ para clasificar:
                <select
                  value={minPJ}
                  onChange={e => updateSeasonConfig({ min_pj: Number(e.target.value) })}
                  className="select-inline"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </>
      )}

      {/* Tabla */}
      {ranked.length === 0 || ranked.every(r => r.pj === 0) ? (
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p>Aún no hay partidos jugados.</p>
          <p className="empty-sub">Haz el sorteo del lunes y registra el resultado.</p>
        </div>
      ) : (
        <div className="ranking-table-wrapper">
          <table className="ranking-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Jugador</th>
                <th>PJ</th>
                <th>PG</th>
                <th>PP</th>
                <th>{mode === 'winrate' ? 'Win%' : mode === 'best_n' ? `Pts(N=${effectiveN})` : 'Pts'}</th>
                <th title="Sets favor/contra">Sets</th>
                <th title="Diferencia de juegos">ΔJuegos</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => (
                <tr
                  key={r.player.id}
                  className={`ranking-row
                    ${i === 0 && r.pj > 0 ? 'leader' : ''}
                    ${!r.eligible ? 'ineligible' : ''}
                  `}
                >
                  <td className="rank-pos">
                    <span className="medal">{getMedal(i)}</span>
                  </td>
                  <td className="rank-name">
                    {r.player.name}
                    {i === 0 && r.pj > 0 && isActive && (
                      <span className="leader-badge">Líder</span>
                    )}
                    {!r.eligible && <span className="ineligible-badge">Sin clasificar</span>}
                    {!r.player.active && <span className="inactive-badge">Inactivo</span>}
                    {displaySeason?.champion_id === r.player.id && (
                      <span className="champion-badge">🏆 Campeón</span>
                    )}
                  </td>
                  <td>{r.pj}</td>
                  <td className="pts-won">{r.pg}</td>
                  <td className="pts-lost">{r.pp}</td>
                  <td className="pts-count">
                    {r.eligible
                      ? (mode === 'winrate' ? `${r.ptsContados}%` : r.ptsContados)
                      : '—'}
                  </td>
                  <td className="sets-col">
                    {r.pj > 0 ? (
                      <span>
                        <span className="sets-favor">{r.sets_favor}</span>
                        <span className="sets-sep">-</span>
                        <span className="sets-contra">{r.sets_contra}</span>
                      </span>
                    ) : '—'}
                  </td>
                  <td className={`juegos-diff ${r.juegos_diff > 0 ? 'positive' : r.juegos_diff < 0 ? 'negative' : ''}`}>
                    {r.pj > 0 ? (r.juegos_diff > 0 ? `+${r.juegos_diff}` : r.juegos_diff) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="ranking-legend">
        <span><strong>PJ</strong> Partidos jugados</span>
        <span><strong>PG/PP</strong> Ganados/Perdidos</span>
        <span><strong>Sets</strong> Sets F-C</span>
        <span><strong>ΔJuegos</strong> Desempate</span>
      </div>
    </div>
  )
}
