import { useState } from 'react'
import Header          from './components/Header'
import DrawTab         from './components/DrawTab'
import RankingTab      from './components/RankingTab'
import HistoryTab      from './components/HistoryTab'
import AdminTab        from './components/AdminTab'
import SeasonCeremony  from './components/SeasonCeremony'
import { useData }     from './hooks/useData'
import './styles/global.css'

const TABS = [
  { id: 'ranking',  label: '🏆 Ranking'   },
  { id: 'draw',     label: '🎲 Sorteo'    },
  { id: 'history',  label: '📅 Historial' },
  { id: 'admin',    label: '⚙️ Admin'      },
]

function DrawIndicator() {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7,
      borderRadius: '50%', background: '#FFD600',
      marginLeft: 5, verticalAlign: 'middle',
    }} />
  )
}

export default function App() {
  const [activeTab,    setActiveTab]    = useState('ranking')
  const [pendingDraw,  setPendingDraw]  = useState(null)
  const [showCeremony, setShowCeremony] = useState(null)  // seasonId a mostrar

  const {
    players, season, allSeasons,
    viewSeason, viewSeasonId, setViewSeasonId,
    matches, matchPlayers, results,
    ranking, addGalleta, updatePlayer, deletePlayer,
    updateSeasonConfig, closeSeason, createSeason,
    saveDraw, saveResult,
  } = useData()

  const handleCloseSeason = (championId) => {
    closeSeason(championId)
    // Mostrar ceremonia automáticamente al cerrar
    setShowCeremony(season?.id)
    setActiveTab('ranking')
  }

  const ceremonySeasonData = showCeremony
    ? allSeasons.find(s => s.id === showCeremony)
    : null
  const ceremonyRanking = showCeremony ? ranking(showCeremony) : []

  return (
    <div className="app">
      <Header season={season} allSeasons={allSeasons} matches={matches} />

      <nav className="tab-nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            {t.id === 'draw' && pendingDraw && pendingDraw.step !== 'confirm' && <DrawIndicator />}
          </button>
        ))}
      </nav>

      <main className="tab-content">
        {activeTab === 'ranking' && (
          <RankingTab
            ranking={ranking}
            season={season}
            allSeasons={allSeasons}
            viewSeason={viewSeason}
            viewSeasonId={viewSeasonId}
            setViewSeasonId={setViewSeasonId}
            updateSeasonConfig={updateSeasonConfig}
            onShowCeremony={() => setShowCeremony(viewSeasonId || season?.id)}
          />
        )}
        {activeTab === 'draw' && (
          <DrawTab
            players={players}
            season={season}
            matches={matches}
            matchPlayers={matchPlayers}
            saveDraw={saveDraw}
            pendingDraw={pendingDraw}
            setPendingDraw={setPendingDraw}
          />
        )}
        {activeTab === 'history' && (
          <HistoryTab
            matches={matches}
            matchPlayers={matchPlayers}
            results={results}
            players={players}
            saveResult={saveResult}
            season={viewSeason || season}
          />
        )}
        {activeTab === 'admin' && (
          <AdminTab
            players={players}
            season={season}
            allSeasons={allSeasons}
            matches={matches}
            matchPlayers={matchPlayers}
            addGalleta={addGalleta}
            updatePlayer={updatePlayer}
            deletePlayer={deletePlayer}
            updateSeasonConfig={updateSeasonConfig}
            closeSeason={handleCloseSeason}
            createSeason={createSeason}
            ranking={ranking}
          />
        )}
      </main>

      {/* Ceremonia de cierre */}
      {showCeremony && ceremonySeasonData && (
        <SeasonCeremony
          season={ceremonySeasonData}
          ranking={ceremonyRanking}
          onClose={() => setShowCeremony(null)}
        />
      )}
    </div>
  )
}
