export default function Header({ season, allSeasons, matches }) {
  const played   = matches.filter(m => m.status === 'played' && m.season_id === season?.id).length
  const total    = season?.total_dates || 12
  const progress = total > 0 ? Math.round((played / total) * 100) : 0
  const closedCount = (allSeasons || []).filter(s => !s.active).length

  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="header-icon">🎾</span>
        <div>
          <h1 className="header-title">Campeonato Pádel</h1>
          <div className="header-meta-row">
            <p className="header-season">{season?.name || 'Sin temporada activa'}</p>
            {closedCount > 0 && (
              <span className="header-seasons-badge">{closedCount} temporada{closedCount > 1 ? 's' : ''} anterior{closedCount > 1 ? 'es' : ''}</span>
            )}
          </div>
        </div>
      </div>

      {season?.active && (
        <div className="header-progress">
          <div className="progress-label">
            <span>Fechas jugadas</span>
            <strong>{played} / {total}</strong>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </header>
  )
}
