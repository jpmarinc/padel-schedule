export const POSITIONS = {
  drive: { label: 'Drive', color: '#FF6D00', bg: 'rgba(255,109,0,0.15)' },
  reves: { label: 'Revés', color: '#2979FF', bg: 'rgba(41,121,255,0.15)' },
}

export const RANKING_MODES = {
  absolute: {
    id: 'absolute',
    label: 'Puntos Absolutos',
    description: 'Suma total de victorias sin ajuste',
    icon: '∑',
  },
  winrate: {
    id: 'winrate',
    label: 'Win Rate %',
    description: 'Victorias / Partidos jugados × 100',
    icon: '%',
  },
  best_n: {
    id: 'best_n',
    label: 'Mejores N',
    description: 'Se cuentan solo los mejores N resultados',
    icon: 'N',
  },
}

export const MIN_TITULARES_FOR_POINTS = 3  // mínimo para que la fecha sume puntos

export const QUORUM_REQUIRED = 3  // si hay menos titulares presentes, no suma

export const POSITIONS_LIST = ['drive', 'reves']
