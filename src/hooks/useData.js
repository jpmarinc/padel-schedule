import { useState, useEffect, useCallback } from 'react'
import * as db from '../lib/db'
import { matchCountsForPoints, isOfficialMatch } from '../lib/drawUtils'

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
  const saveDraw = useCallback(async (matchDate, dateNumber, presentIds, drawResult, isFriendly = false) => {
    if (!season) return
    const match = await db.upsertMatch({
      season_id: season.id,
      match_date: matchDate,
      date_number: dateNumber,
      is_friendly: !!isFriendly,
      counts_for_points: !isFriendly && matchCountsForPoints(drawResult, players),
      status: 'drawn',
    })

    if (match) await db.saveMatchPlayers(match.id, drawResult)
    refresh()
    return match
  }, [season, players, refresh])

  // Crear un partido manualmente, asignando equipo y lado a cada jugador.
  // assignments: [{ player_id, team, position, is_free }] — 4 filas no-libres.
  const createManualMatch = useCallback(async (matchDate, dateNumber, assignments, isFriendly = false) => {
    if (!season) return
    const match = await db.upsertMatch({
      season_id: season.id,
      match_date: matchDate,
      date_number: dateNumber,
      is_friendly: !!isFriendly,
      counts_for_points: !isFriendly && matchCountsForPoints(assignments, players),
      status: 'drawn',
    })

    if (match) await db.saveMatchPlayers(match.id, assignments)
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
    // Solo cuentan las fechas OFICIALES: quórum de 4 titulares y no amistoso.
    const playedMatches = seasonMatches.filter(m =>
      m.status === 'played' && isOfficialMatch(m, matchPlayers[m.id] || [], players)
    )

    // Detalle por partido de cada jugador (favor/contra de sets y juegos).
    const stats = titulares.map(player => {
      const playerMatches = playedMatches.filter(m => {
        const mp = matchPlayers[m.id] || []
        return mp.some(p => p.player_id === player.id && !p.is_free)
      })

      const details = []  // { won, sf, sc, jf, jc } por partido
      playerMatches.forEach(m => {
        const mp     = matchPlayers[m.id] || []
        const pp     = mp.find(p => p.player_id === player.id)
        const result = results[m.id]
        if (!pp || !result) return

        const won = result.winner_team === pp.team
        const { sets_t1, sets_t2, juegos_t1, juegos_t2 } = db.calcSetsStats(result)
        const [sf, sc, jf, jc] = pp.team === 1
          ? [sets_t1, sets_t2, juegos_t1, juegos_t2]
          : [sets_t2, sets_t1, juegos_t2, juegos_t1]
        details.push({ won, sf, sc, jf, jc })
      })

      const pj = playerMatches.length
      const pg = details.filter(d => d.won).length
      return { player, pj, pg, pp: pj - pg, details }
    })

    const mode  = targetSeason.ranking_mode || 'best_n'
    const minPJ = targetSeason.min_pj || 6
    // N para "Mejores N": lo fija Admin (targetSeason.best_n). Si no está fijado,
    // el fallback cuenta TODOS los oficiales jugados (nunca descarta resultados).
    const officialPlayed = playedMatches.length
    const bestN = mode === 'best_n'
      ? (targetSeason.best_n || officialPlayed)
      : 0

    const ranked = stats.map(s => {
      let ptsContados = 0, eligible = true

      // En modo "Mejores N", los puntos Y los desempates (sets/juegos) se calculan
      // sobre el mismo subconjunto: los N mejores partidos del jugador, rankeados
      // por victoria → diferencia de sets → diferencia de juegos.
      const tbDetails = mode === 'best_n'
        ? [...s.details].sort((a, b) =>
            (b.won - a.won) ||
            ((b.sf - b.sc) - (a.sf - a.sc)) ||
            ((b.jf - b.jc) - (a.jf - a.jc))
          ).slice(0, bestN)
        : s.details

      const agg = tbDetails.reduce((acc, d) => ({
        sf: acc.sf + d.sf, sc: acc.sc + d.sc,
        jf: acc.jf + d.jf, jc: acc.jc + d.jc,
      }), { sf: 0, sc: 0, jf: 0, jc: 0 })

      const sets_favor = agg.sf, sets_contra = agg.sc
      const juegos_favor = agg.jf, juegos_contra = agg.jc
      const sets_diff = sets_favor - sets_contra
      const juegos_diff = juegos_favor - juegos_contra

      if (mode === 'absolute') {
        ptsContados = s.pg
      } else if (mode === 'winrate') {
        if (s.pj < minPJ) { eligible = false; ptsContados = 0 }
        else ptsContados = s.pj > 0 ? Math.round((s.pg / s.pj) * 100) : 0
      } else if (mode === 'best_n') {
        ptsContados = tbDetails.filter(d => d.won).length
      }

      const winRate = s.pj > 0 ? Math.round((s.pg / s.pj) * 100) : 0
      return {
        player: s.player, pj: s.pj, pg: s.pg, pp: s.pp,
        sets_favor, sets_contra, sets_diff,
        juegos_favor, juegos_contra, juegos_diff,
        ptsTotal: s.pg, ptsContados, eligible, winRate, bestN, officialPlayed,
      }
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
    createManualMatch,
    saveResult,
    refresh,
  }
}
