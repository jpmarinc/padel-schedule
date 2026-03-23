# Padel Schedule — Documentación

> Campeonato de pádel personal. Sorteo semanal, ranking configurable, historial de partidos.
> Stack: React + Vite · Supabase JS (mismo proyecto mi-trading) · Deploy Netlify

---

## Cómo correr el proyecto

```bash
cd ~/Desktop/padel-schedule
cp .env.example .env.local   # pegar tu anon key de Supabase
npm run dev                   # http://localhost:5173
```

> Sin .env configurado, el app funciona con localStorage automáticamente.

---

## Estructura

```
padel-schedule/
├── src/
│   ├── App.jsx                    # Orquestador + tabs
│   ├── main.jsx                   # Entry point
│   ├── constants/index.js         # Posiciones, modos de ranking
│   ├── lib/
│   │   ├── supabase.js            # Cliente Supabase (opcional)
│   │   └── storage.js             # Fallback localStorage + seed
│   ├── hooks/
│   │   └── useData.js             # Hook central de datos + lógica de ranking
│   ├── components/
│   │   ├── Header.jsx             # Nombre + progreso de temporada
│   │   ├── DrawTab.jsx            # Sorteo del lunes (asistencia → sorteo → confirmar)
│   │   ├── RankingTab.jsx         # Tabla de posiciones con selector de modo
│   │   ├── HistoryTab.jsx         # Historial de fechas + registro de resultados
│   │   └── AdminTab.jsx           # Config, jugadores galleta, cierre de temporada
│   └── styles/global.css          # Tema deportivo dark green
├── schema.sql                     # DDL Supabase + seed de jugadores
└── .env.example                   # Variables de entorno
```

---

## Jugadores titulares

| Jugador | Tipo |
|---------|------|
| Mario San Martin  | Titular |
| Juan Carlos Awad  | Titular |
| Jose Luis Mosso   | Titular |
| Nicolas Gonzalez  | Titular |
| Juan Pablo Marin  | Titular |

Los **jugadores galleta** se agregan desde Admin → no suman al ranking del torneo.

---

## Lógicas de Ranking (configurables)

| Modo | Descripción | Config |
|------|-------------|--------|
| **Absolutos** | Suma total de victorias | ninguna |
| **Win Rate %** | Victorias / PJ × 100 | mínimo PJ para clasificar |
| **Mejores N** | Top N resultados de cada jugador | N fijo o automático (= mínimo PJ del grupo) |

Cambiar modo desde tab Ranking o Admin.

---

## Regla de Quórum

- Si **menos de 3 titulares** están presentes → la fecha se puede jugar pero **no suma puntos al ranking**
- Indicado visualmente con badge naranja "Sin puntos"

---

## Setup Supabase

1. Ir a: `https://supabase.com/dashboard/project/fwcjolnhghqqbclrbdrc/sql`
2. Copiar y ejecutar el contenido de `schema.sql`
3. En Settings → API: copiar `anon public key`
4. Crear `.env.local` con los valores del `.env.example`

---

## Deploy Netlify

```bash
npm run build   # genera dist/
# Subir dist/ a Netlify drag & drop, o conectar repo para CI/CD
# Variables de entorno: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
```
