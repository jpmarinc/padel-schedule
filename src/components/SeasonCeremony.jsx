import { useState, useEffect } from 'react'

// Confetti CSS-only
function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => i)
  const colors = ['#00E676','#FFD600','#FF6D00','#2979FF','#FF1744','#00BCD4']
  return (
    <div className="confetti-wrapper" aria-hidden="true">
      {pieces.map(i => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            background: colors[i % colors.length],
            width: Math.random() > 0.5 ? '8px' : '12px',
            height: Math.random() > 0.5 ? '8px' : '4px',
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}

const PLACE_LABELS = ['4° Lugar', '3° Lugar', '2° Lugar', '🏆 CAMPEÓN']
const PLACE_SIZES  = ['ceremony-4th', 'ceremony-3rd', 'ceremony-2nd', 'ceremony-1st']

export default function SeasonCeremony({ season, ranking, onClose }) {
  const [step,        setStep]        = useState(-1)   // -1 = intro, 0-3 = posiciones
  const [showConfetti, setShowConfetti] = useState(false)

  // ranking viene ordenado 1°→Nº, tomamos top 4 y revertimos para revelar 4°→1°
  const ordered = [...ranking].slice(0, 4).reverse()  // 4°, 3°, 2°, 1°

  const isIntro    = step === -1
  const isDone     = step >= ordered.length - 1
  const isChampion = step === ordered.length - 1

  useEffect(() => {
    if (isChampion) {
      const t = setTimeout(() => setShowConfetti(true), 400)
      return () => clearTimeout(t)
    }
  }, [isChampion])

  const handleNext = () => {
    if (isDone) return
    setStep(s => s + 1)
  }

  const revealed = ordered.slice(0, step + 1)

  return (
    <div className="ceremony-overlay">
      {showConfetti && <Confetti />}

      <div className="ceremony-modal">
        {isIntro ? (
          <div className="ceremony-intro">
            <div className="ceremony-trophy">🏆</div>
            <h2 className="ceremony-season-name">{season.name}</h2>
            <p className="ceremony-subtitle">Resultados Finales</p>
            <p className="ceremony-played">
              {season.total_dates} fechas · Temporada cerrada
            </p>
            <button className="btn-primary ceremony-start-btn" onClick={handleNext}>
              Comenzar ceremonia →
            </button>
          </div>
        ) : (
          <div className="ceremony-stage">
            <h3 className="ceremony-title-small">{season.name}</h3>

            <div className="ceremony-podium">
              {revealed.map((r, i) => {
                const isFirst   = i === revealed.length - 1 && step === ordered.length - 1
                const placeIdx  = step - (revealed.length - 1 - i)

                return (
                  <div
                    key={r.player.id}
                    className={`ceremony-entry ${PLACE_SIZES[placeIdx] || ''} ${isFirst && i === revealed.length - 1 ? 'champion-entry' : ''}`}
                    style={{ animationDelay: `${i === revealed.length - 1 ? 0 : 0}ms` }}
                  >
                    <span className="ceremony-place-label">
                      {PLACE_LABELS[placeIdx] || `#${placeIdx + 1}`}
                    </span>
                    <span className="ceremony-player-name">{r.player.name}</span>
                    <div className="ceremony-stats">
                      <span>{r.pg}V · {r.pp}D</span>
                      <span>Sets {r.sets_favor}-{r.sets_contra}</span>
                      {isFirst && i === revealed.length - 1 && (
                        <span className="ceremony-exempt">🎉 Exento de cuota</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="ceremony-controls">
              {!isDone ? (
                <button className="btn-primary ceremony-next-btn" onClick={handleNext}>
                  {step === ordered.length - 2 ? '🏆 Revelar Campeón' : `Revelar ${PLACE_LABELS[step + 1] || ''}`}
                </button>
              ) : (
                <div className="ceremony-done">
                  <p className="ceremony-done-text">¡Felicitaciones {ordered[ordered.length - 1]?.player?.name}!</p>
                  <div className="ceremony-done-actions">
                    <button className="btn-secondary" onClick={() => { setStep(-1); setShowConfetti(false) }}>
                      ↺ Ver de nuevo
                    </button>
                    <button className="btn-ghost" onClick={onClose}>Cerrar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
