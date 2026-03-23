// ============================================================
// drawUtils.js — Algoritmo de sorteo inteligente
// Reglas:
//   1. Cada pareja siempre tiene 1 Drive + 1 Revés (sin excepción)
//   2. Se prefieren parejas que no hayan jugado juntas recientemente
//   3. Si una pareja se repite, se rotan sus posiciones respecto al último partido juntos
// ============================================================

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Retorna el índice (orden cronológico) del último partido donde
 * p1 y p2 estuvieron en la MISMA pareja. -1 si nunca jugaron juntos.
 */
function lastMatchIndexTogether(p1id, p2id, matchHistory) {
  for (let i = matchHistory.length - 1; i >= 0; i--) {
    const mps = matchHistory[i].players || []
    const team1ids = mps.filter(p => p.team === 1 && !p.is_free).map(p => p.player_id)
    const team2ids = mps.filter(p => p.team === 2 && !p.is_free).map(p => p.player_id)
    const together =
      (team1ids.includes(p1id) && team1ids.includes(p2id)) ||
      (team2ids.includes(p1id) && team2ids.includes(p2id))
    if (together) return i
  }
  return -1
}

/**
 * Para un par (p1, p2), calcula la posición que cada uno debería jugar
 * en función de su último partido juntos (rotar respecto al anterior).
 * Si nunca jugaron juntos, asigna aleatoriamente.
 */
function resolvePositions(p1, p2, matchHistory) {
  const lastIdx = lastMatchIndexTogether(p1.id, p2.id, matchHistory)

  if (lastIdx === -1) {
    // Nunca jugaron juntos → aleatorio, pero garantizando 1 drive + 1 revés
    const flip = Math.random() < 0.5
    return {
      [p1.id]: flip ? 'drive' : 'reves',
      [p2.id]: flip ? 'reves' : 'drive',
    }
  }

  // Jugaron juntos → buscar sus posiciones en ese partido y rotar
  const mps = matchHistory[lastIdx].players || []
  const mp1 = mps.find(p => p.player_id === p1.id)
  const mp2 = mps.find(p => p.player_id === p2.id)

  const pos1 = mp1?.position || 'drive'
  const pos2 = mp2?.position || 'reves'

  return {
    [p1.id]: pos1 === 'drive' ? 'reves' : 'drive',
    [p2.id]: pos2 === 'drive' ? 'reves' : 'drive',
  }
}

/**
 * Para 4 jugadores existen exactamente 3 posibles emparejamientos.
 * Retorna los 3 con su score de "frescura" (menor = más fresco = preferido).
 *
 * Score = suma de (matchHistory.length - lastMatchIdx) por pareja.
 * Si nunca jugaron juntos → contribuye 0.
 */
function scorePairings(playing, matchHistory) {
  const [a, b, c, d] = playing

  const options = [
    { p1: [a, b], p2: [c, d] },
    { p1: [a, c], p2: [b, d] },
    { p1: [a, d], p2: [b, c] },
  ]

  return options.map(opt => {
    const score1 = (() => {
      const idx = lastMatchIndexTogether(opt.p1[0].id, opt.p1[1].id, matchHistory)
      return idx === -1 ? 0 : (matchHistory.length - idx)
    })()
    const score2 = (() => {
      const idx = lastMatchIndexTogether(opt.p2[0].id, opt.p2[1].id, matchHistory)
      return idx === -1 ? 0 : (matchHistory.length - idx)
    })()
    return { ...opt, score: score1 + score2 }
  })
}

/**
 * Genera el sorteo completo.
 * @param {Array} presentPlayers - jugadores presentes (objetos con id, name, is_galleta)
 * @param {Array} matchHistory   - array de { players: [{player_id, team, position, is_free}] }
 * @returns {{ team1, team2, free }}
 */
export function generateDraw(presentPlayers, matchHistory = []) {
  const shuffled = shuffle(presentPlayers)
  const playing  = shuffled.slice(0, 4)
  const free     = shuffled.slice(4)

  // Obtener los 3 emparejamientos posibles y sus scores
  const scored = scorePairings(playing, matchHistory)
  scored.sort((a, b) => a.score - b.score)

  // Entre los empatados en score mínimo, elegir aleatoriamente
  const bestScore = scored[0].score
  const tied      = scored.filter(s => s.score === bestScore)
  const chosen    = tied[Math.floor(Math.random() * tied.length)]

  // Asignar posiciones garantizando 1 drive + 1 revés por pareja
  const pos1 = resolvePositions(chosen.p1[0], chosen.p1[1], matchHistory)
  const pos2 = resolvePositions(chosen.p2[0], chosen.p2[1], matchHistory)

  const team1 = chosen.p1.map(p => ({ player: p, team: 1, position: pos1[p.id] }))
  const team2 = chosen.p2.map(p => ({ player: p, team: 2, position: pos2[p.id] }))

  return { team1, team2, free }
}
