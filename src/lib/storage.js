// LocalStorage fallback cuando Supabase no está configurado
const KEY = 'padel_data'

const defaultData = () => ({
  players: [
    { id: 'p1', name: 'Mario San Martin',  is_galleta: false, active: true },
    { id: 'p2', name: 'Juan Carlos Awad',  is_galleta: false, active: true },
    { id: 'p3', name: 'Jose Luis Mosso',   is_galleta: false, active: true },
    { id: 'p4', name: 'Nicolas Gonzalez',  is_galleta: false, active: true },
    { id: 'p5', name: 'Juan Pablo Marin',  is_galleta: false, active: true },
  ],
  seasons: [
    {
      id: 's1',
      name: 'Temporada 1 — 2026',
      started_at: '2026-03-24',
      ended_at: null,
      total_dates: 12,
      ranking_mode: 'best_n',
      best_n: null,
      min_pj: 6,
      champion_id: null,
      active: true,
    }
  ],
  matches: [],
  match_players: [],
  match_results: [],  // { id, match_id, winner_team, sets:[{t1,t2}], notes, created_at }
})

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : defaultData()
  } catch {
    return defaultData()
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// ── Players ──────────────────────────────────────────────────
export function getPlayers() { return load().players }

export function addPlayer(player) {
  const data = load()
  data.players.push({ id: uuid(), active: true, ...player })
  save(data)
}

export function updatePlayer(id, patch) {
  const data = load()
  data.players = data.players.map(p => p.id === id ? { ...p, ...patch } : p)
  save(data)
}

export function deletePlayer(id) {
  const data = load()
  data.players = data.players.filter(p => p.id !== id)
  save(data)
}

// ── Seasons ───────────────────────────────────────────────────
export function getAllSeasons() { return load().seasons }

export function getActiveSeason() {
  return load().seasons.find(s => s.active) || null
}

export function updateSeason(id, patch) {
  const data = load()
  data.seasons = data.seasons.map(s => s.id === id ? { ...s, ...patch } : s)
  save(data)
}

export function createSeason(name, startDate) {
  const data = load()
  const newSeason = {
    id: uuid(),
    name,
    started_at: startDate,
    ended_at: null,
    total_dates: 12,
    ranking_mode: 'best_n',
    best_n: null,
    min_pj: 6,
    champion_id: null,
    active: true,
    created_at: new Date().toISOString(),
  }
  data.seasons.push(newSeason)
  save(data)
  return newSeason
}

// ── Matches ───────────────────────────────────────────────────
export function getMatches(seasonId) {
  return load().matches.filter(m => m.season_id === seasonId)
}

export function upsertMatch(match) {
  const data = load()
  const idx = data.matches.findIndex(m => m.id === match.id)
  if (idx >= 0) {
    data.matches[idx] = { ...data.matches[idx], ...match }
  } else {
    data.matches.push({ id: uuid(), created_at: new Date().toISOString(), ...match })
  }
  save(data)
  return data.matches.find(m =>
    m.season_id === match.season_id && m.date_number === match.date_number
  ) || data.matches.find(m => m.id === match.id)
}

// ── Match Players ─────────────────────────────────────────────
export function getMatchPlayers(matchId) {
  return load().match_players.filter(mp => mp.match_id === matchId)
}

export function saveMatchPlayers(matchId, players) {
  const data = load()
  data.match_players = data.match_players.filter(mp => mp.match_id !== matchId)
  players.forEach(p => data.match_players.push({ id: uuid(), match_id: matchId, ...p }))
  save(data)
}

// ── Match Results ─────────────────────────────────────────────
// Formato de sets: [{ t1: 6, t2: 4 }, { t1: 3, t2: 6 }, { t1: 7, t2: 6 }]
// winner_team se infiere de sets ganados pero también se puede forzar

export function getMatchResult(matchId) {
  return load().match_results.find(r => r.match_id === matchId) || null
}

export function getAllResults() { return load().match_results }

export function saveMatchResult(matchId, result) {
  const data = load()
  const idx = data.match_results.findIndex(r => r.match_id === matchId)
  const entry = {
    id: idx >= 0 ? data.match_results[idx].id : uuid(),
    match_id: matchId,
    created_at: new Date().toISOString(),
    ...result,
  }
  if (idx >= 0) data.match_results[idx] = entry
  else data.match_results.push(entry)
  save(data)
}

// ── Tennis helpers ────────────────────────────────────────────
// Calcula stats derivados de un resultado con sets
export function calcSetsStats(result) {
  if (!result || !result.sets || result.sets.length === 0) {
    return { sets_t1: 0, sets_t2: 0, juegos_t1: 0, juegos_t2: 0 }
  }
  let sets_t1 = 0, sets_t2 = 0, juegos_t1 = 0, juegos_t2 = 0
  for (const s of result.sets) {
    const t1 = Number(s.t1) || 0
    const t2 = Number(s.t2) || 0
    juegos_t1 += t1
    juegos_t2 += t2
    if (t1 > t2) sets_t1++
    else if (t2 > t1) sets_t2++
  }
  return { sets_t1, sets_t2, juegos_t1, juegos_t2 }
}
