/**
 * db.js — capa de datos async
 * Usa Supabase si está configurado, cae a localStorage si no.
 * Todas las funciones son async para que useData.js sea uniforme.
 */
import { supabase } from './supabase'
import * as local   from './storage'

const sb = () => supabase  // shorthand

// ── Players ──────────────────────────────────────────────────

export async function getPlayers() {
  if (!sb()) return local.getPlayers()
  const { data, error } = await sb()
    .from('padel_players').select('*').order('name')
  if (error) { console.error('getPlayers', error); return local.getPlayers() }
  return data || []
}

export async function addPlayer(player) {
  if (!sb()) { local.addPlayer(player); return }
  const { error } = await sb()
    .from('padel_players').insert({ active: true, ...player })
  if (error) console.error('addPlayer', error)
}

export async function updatePlayer(id, patch) {
  if (!sb()) { local.updatePlayer(id, patch); return }
  const { error } = await sb()
    .from('padel_players').update(patch).eq('id', id)
  if (error) console.error('updatePlayer', error)
}

export async function deletePlayer(id) {
  if (!sb()) { local.deletePlayer(id); return }
  const { error } = await sb()
    .from('padel_players').delete().eq('id', id)
  if (error) console.error('deletePlayer', error)
}

// ── Seasons ───────────────────────────────────────────────────

export async function getAllSeasons() {
  if (!sb()) return local.getAllSeasons()
  const { data, error } = await sb()
    .from('padel_seasons').select('*').order('created_at')
  if (error) { console.error('getAllSeasons', error); return local.getAllSeasons() }
  return data || []
}

export async function updateSeason(id, patch) {
  if (!sb()) { local.updateSeason(id, patch); return }
  const { error } = await sb()
    .from('padel_seasons').update(patch).eq('id', id)
  if (error) console.error('updateSeason', error)
}

export async function createSeason(name, startDate) {
  if (!sb()) return local.createSeason(name, startDate)
  const { data, error } = await sb()
    .from('padel_seasons')
    .insert({
      name, started_at: startDate,
      total_dates: 12, ranking_mode: 'best_n',
      best_n: null, min_pj: 6, champion_id: null, active: true,
    })
    .select().single()
  if (error) { console.error('createSeason', error); return local.createSeason(name, startDate) }
  return data
}

// ── Matches ───────────────────────────────────────────────────

export async function getMatches(seasonId) {
  if (!sb()) return local.getMatches(seasonId)
  const { data, error } = await sb()
    .from('padel_matches').select('*')
    .eq('season_id', seasonId).order('date_number')
  if (error) { console.error('getMatches', error); return local.getMatches(seasonId) }
  return data || []
}

export async function upsertMatch(match) {
  if (!sb()) return local.upsertMatch(match)
  if (match.id) {
    const { created_at, ...patch } = match
    const { data, error } = await sb()
      .from('padel_matches').update(patch).eq('id', match.id).select().single()
    if (error) console.error('upsertMatch update', error)
    return data
  } else {
    const { data, error } = await sb()
      .from('padel_matches').insert(match).select().single()
    if (error) console.error('upsertMatch insert', error)
    return data
  }
}

// ── Match Players ─────────────────────────────────────────────

export async function getMatchPlayers(matchId) {
  if (!sb()) return local.getMatchPlayers(matchId)
  const { data, error } = await sb()
    .from('padel_match_players').select('*').eq('match_id', matchId)
  if (error) { console.error('getMatchPlayers', error); return local.getMatchPlayers(matchId) }
  return data || []
}

export async function saveMatchPlayers(matchId, players) {
  if (!sb()) { local.saveMatchPlayers(matchId, players); return }
  await sb().from('padel_match_players').delete().eq('match_id', matchId)
  if (players.length > 0) {
    const { error } = await sb()
      .from('padel_match_players')
      .insert(players.map(p => ({ match_id: matchId, ...p })))
    if (error) console.error('saveMatchPlayers', error)
  }
}

// ── Match Results ─────────────────────────────────────────────

export async function getMatchResult(matchId) {
  if (!sb()) return local.getMatchResult(matchId)
  const { data, error } = await sb()
    .from('padel_match_results').select('*')
    .eq('match_id', matchId).maybeSingle()
  if (error) { console.error('getMatchResult', error); return local.getMatchResult(matchId) }
  return data || null
}

export async function saveMatchResult(matchId, result) {
  if (!sb()) { local.saveMatchResult(matchId, result); return }
  const { error } = await sb()
    .from('padel_match_results')
    .upsert({ match_id: matchId, ...result }, { onConflict: 'match_id' })
  if (error) console.error('saveMatchResult', error)
}

// ── Re-export pure helper (sin DB) ────────────────────────────
export { calcSetsStats } from './storage'
