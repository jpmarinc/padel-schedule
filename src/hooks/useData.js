import { useState, useEffect, useCallback } from 'react'
import * as db from '../lib/db'
import { QUORUM_REQUIRED } from '../constants'

export function useData() {
  const [players,      setPlayers]      = useState([])
  const [allSeasons,   setAllSeasons]   = useState([])
  const [season,       setSeason]       = useState(null)
  const [viewSeasonId, setViewSeasonId] = useState(null)
  const [matches,      setMatches]      = useState([])
  const [matchPlayers, setMatchPlayers] = useState({})
  const [results,      setResults]      = useState({})
  const [tick,         setTick]         = useState(0)

  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    async function load() {
      const [p, all] = await Promise.all([db.getPlayers(), db.getAllSeasons()])
      const s = all.find(x => x.active) || null
      setPlayers(p)
      setAllSeasons(all)
      setSeason(s)

      const allMatches = (
        await Promise.all(all.map(season => db.getMatches(season.id)))
      ).flat()

      const mpMap = {}, resMap = {}
      await Promise.all(allMatches.map(async match => {
        mpMap[match.id] = await db.getMatchPlayers(match.id)
        const r = await db.getMatchResult(match.id)
        if (r) resMap[match.id] = r
      }))

      setMatches(allMatches)
      setMatchPlayers(mpMap)
      setResults(resMap)
    }
    load()
  }, [tick])

  const viewSeason = allSeasons.find(s => s.id === viewSeasonId) || season

  // ── Players ──────────────────────────────────────────────────
  const addGalleta = useCallback(async (name) => {
    await db.addPlayer({ name, is_galleta: true })
    refresh()
  }, [refresh])

  const updatePlayer = useCallback(async (id, patch) => {
    await db.updatePlayer(id, patch)
    refresh()
  }, [refresh])

  const deletePlayer = useCallback(async (id) => {
    await db.deletePlayer(id)
    refresh()
  }, [refresh])

  // ── Season ───────────────────────────────────────────────────
  const updateSeasonConfig = useCallback(async (patch) => {
    if (!season) return
    await db.updateSeason(season.id, patch)
    refresh()
  }, [season, refresh])

  const closeSeason = useCallback(async (championId) => {
    if (!season) return
    await db.updateSeason(season.id, {
      active: false,
      ended_at: new Date().toISOString().split('T')[0],
      champion_id: championId,
    })
    refresh()
  }, [season, refresh])

  const createSeason = useCallback(async (name, startDate) => {
    await db.createSeason(name, startDate)
    refresh()
  }, [refresh])

  // ── Sorteo ────────────────────────────────────────────────────
  const saveDraw = useCallback(async (matchDate, dateNumber, presentIds, drawResult) => {
    if (!season) return
    const titulares        = players.filter(p => !p.is_galleta && p.active)
    const presentTitulares = presentIds.filter(id => titulares.some(t => t.id === id))
    const countsForPoints  = presentTitulares.length >= QUORUM_REQUIRED

    const match = await db.upsertMatch({
      season_id: season.id,
      match_date: matchDate,
      date_number: dateNumber,
      counts_for_points: countsForPoints,
      status: 'drawn',
    })

    if (match) await db.saveMatchPlayers(match.id, drawResult)
    refresh()
    return match
  }, [season, players, refresh])

  // ── Resultados ────────────────────────────────────────────────
  const saveResult = useCallback(async (matchId, result) => {
    await db.saveMatchResult(matchId, result)
    // Marcar match como played
    const m = matches.find(x => x.id === matchId)
    if (m) await db.upsertMatch({ ...m, status: 'played' })
    refresh()
  }, [matches, refresh])

  // ── Ranking ────────────────────────────────────────────────────
  const ranking = useCallback((forSeasonId) => {
    const targetSeason = forSeasonId
      ? allSeasons.find(s => s.id === forSeasonId)
      : (viewSeason || season)
    if (!targetSeason) return []

    const titulares     = players.filter(p => !p.is_galleta)
    const seasonMatches = matches.filter(m => m.season_id === targetSeason.id)
    const playedMatches = seasonMatches.filter(m =>
      m.status === 'played' && m.counts_for_points
    )

    const stats = titulares.map(player => {
      const playerMatches = playedMatches.filter(m => {
        const mp = matchPlayers[m.id] || []
        return mp.some(p => p.player_id === player.id && !p.is_free)
      })

      let pg = 0, sets_favor = 0, sets_contra = 0, juegos_favor = 0, juegos_contra = 0
      const winResults = []

      playerMatches.forEach(m => {
        const mp     = matchPlayers[m.id] || []
        const pp     = mp.find(p => p.player_id === player.id)
        const result = results[m.id]
        if (!pp || !result) return

        const won = result.winner_team === pp.team
        if (won) pg++
        winResults.push(won ? 1 : 0)

        const { sets_t1, sets_t2, juegos_t1, juegos_t2 } = db.calcSetsStats(result)
        if (pp.team === 1) {
          sets_favor   += sets_t1;   sets_contra  += sets_t2
          juegos_favor += juegos_t1; juegos_contra += juegos_t2
        } else {
          sets_favor   += sets_t2;   sets_contra  += sets_t1
          juegos_favor += juegos_t2; juegos_contra += juegos_t1
        }
      })

      const pj         = playerMatches.length
      const pp_val     = pj - pg
      const sets_diff  = sets_favor - sets_contra
      const juegos_diff = juegos_favor - juegos_contra

      return {
        player, pj, pg, pp: pp_val,
        sets_favor, sets_contra, sets_diff,
        juegos_favor, juegos_contra, juegos_diff,
        ptsTotal: pg, winResults, playerMatches,
      }
    })

    const mode  = targetSeason.ranking_mode || 'best_n'
    const minPJ = targetSeason.min_pj || 6
    const minPJPlayed = Math.min(...stats.filter(s => s.pj > 0).map(s => s.pj), Infinity)
    const bestN = mode === 'best_n'
      ? (targetSeason.best_n || (isFinite(minPJPlayed) ? minPJPlayed : 0))
      : 0

    const ranked = stats.map(s => {
      let ptsContados = 0, eligible = true

      if (mode === 'absolute') {
        ptsContados = s.pg
      } else if (mode === 'winrate') {
        if (s.pj < minPJ) { eligible = false; ptsContados = 0 }
        else ptsContados = s.pj > 0 ? Math.round((s.pg / s.pj) * 100) : 0
      } else if (mode === 'best_n') {
        const sorted = [...s.winResults].sort((a, b) => b - a).slice(0, bestN)
        ptsContados  = sorted.reduce((acc, v) => acc + v, 0)
      }

      const winRate = s.pj > 0 ? Math.round((s.pg / s.pj) * 100) : 0
      return { ...s, ptsContados, eligible, winRate, bestN }
    })

    return ranked.sort((a, b) => {
      if (!a.eligible && b.eligible) return 1
      if (a.eligible && !b.eligible) return -1
      if (b.ptsContados !== a.ptsContados) return b.ptsContados - a.ptsContados
      if (b.sets_diff   !== a.sets_diff)   return b.sets_diff   - a.sets_diff
      return b.juegos_diff - a.juegos_diff
    })
  }, [players, matches, matchPlayers, results, allSeasons, viewSeason, season])

  return {
    players,
    season,
    allSeasons,
    viewSeason,
    viewSeasonId,
    setViewSeasonId,
    matches,
    matchPlayers,
    results,
    ranking,
    addGalleta,
    updatePlayer,
    deletePlayer,
    updateSeasonConfig,
    closeSeason,
    createSeason,
    saveDraw,
    saveResult,
    refresh,
  }
}
