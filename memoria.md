# memoria.md — padel-schedule

---

## Sesión 002 — 2026-03-23 (continuación)

### Contexto de inicio
Continuación de la misma sesión. Framework de documentación creado. Backlog de 5 ítems pendientes.

### Decisiones tomadas
- **Formato de resultado:** `sets: [{t1, t2}]` en lugar de `score_team1/score_team2` — compatible con localStorage y futuro Supabase JSONB
- **Tiebreaker ranking:** 1° puntos contados, 2° diferencia de sets, 3° diferencia de juegos
- **Ceremonia:** activación automática al cerrar temporada + accesible desde tab Ranking para temporadas cerradas. Manual por pasos (click para avanzar) para que Juan Pablo controle el ritmo
- **Temporadas:** selector en RankingTab (no pestaña separada). Header muestra contador de temporadas anteriores
- **HistoryTab pasa `season` como prop** para saber qué fechas mostrar y si es solo lectura

### Lo construido en esta sesión
- **C-01 ✅ — Lógica de tenis:**
  - `storage.js`: nuevo formato `sets: [{t1, t2}]` + helper `calcSetsStats()` + `getAllSeasons()`
  - `useData.js`: stats completos por jugador (sets_favor, sets_contra, sets_diff, juegos_favor, juegos_contra, juegos_diff). Tiebreaker en ranking. Soporte `viewSeasonId` para ver cualquier temporada
  - `HistoryTab.jsx`: nuevo `TennisScoreInput` con hasta 3 sets, auto-detección de ganador, live score, validación
- **C-02 ✅ — Fix botón Editar:**
  - `HistoryTab.jsx`: estado `editingId` para mostrar/ocultar formulario de edición. Botón "Cancelar" al editar
- **C-03 ✅ — Popup cierre prematuro:**
  - `AdminTab.jsx`: compara fechas jugadas vs total. Si quedan fechas → popup naranja de advertencia antes de abrir el formulario de cierre
- **C-04 ✅ — Ceremonia de cierre:**
  - Nuevo `SeasonCeremony.jsx`: overlay full-screen, reveal 4°→1° por pasos, confetti CSS-only para el campeón, badge "Exento de cuota", botón "Ver de nuevo"
  - Se activa automáticamente al cerrar temporada desde Admin
- **C-05 ✅ — Vista temporadas cerradas:**
  - `RankingTab.jsx`: selector de temporada, modo read-only para temporadas cerradas, badge "Campeón"
  - `Header.jsx`: contador de temporadas anteriores
  - `App.jsx`: `viewSeasonId` + `allSeasons` + botón "Ver ceremonia" desde Ranking
- **Build:** 26 módulos, 0 errores

### Pendientes al cerrar
- R-06: Deploy a Netlify (ejecutar schema.sql + configurar env + build)
- R-07: Migrar datos localStorage → Supabase
- Probar flujo completo en local antes de deployar

---


Historial de sesiones de trabajo. Cada entrada documenta qué se hizo, decisiones tomadas y pendientes al cerrar.

---

## Sesión 001 — 2026-03-23

### Contexto de inicio
Primera sesión del proyecto. Partimos desde cero.

### Decisiones tomadas
- **Stack:** React + Vite (frontend) · localStorage como fallback · Supabase JS para persistencia (mismo proyecto que mi-trading, ID `fwcjolnhghqqbclrbdrc`) · Deploy en Netlify
- **Lógicas de ranking (3 opciones configurables):** Absolutos / Win Rate % / Mejores N partidos
- **Sorteo:** 100% aleatorio cada lunes (no basado en el schedule pre-generado del Excel)
- **Jugadores galleta:** suplentes/invitados que pueden jugar pero no suman al ranking
- **Quórum:** mínimo 3 titulares presentes para que la fecha cuente
- **Formato:** pádel se juega de a 4 (2 parejas), si hay 5+ jugadores uno descansa

### Lo construido en esta sesión
- Proyecto inicializado: `npm create vite@latest padel-schedule`
- `schema.sql` con tablas: `padel_players`, `padel_seasons`, `padel_matches`, `padel_match_players`, `padel_match_results` + seed de 5 jugadores
- `lib/storage.js` — localStorage completo con seed automático
- `lib/supabase.js` — cliente Supabase opcional (fallback a localStorage si no configurado)
- `lib/drawUtils.js` — algoritmo de sorteo inteligente:
  - Evalúa las 3 combinaciones posibles para 4 jugadores
  - Prefiere parejas menos repetidas recientemente
  - Rota posiciones (Drive/Revés) si una pareja se repite
  - Garantiza siempre 1 Drive + 1 Revés por pareja (fix de bug posiciones duplicadas)
- `hooks/useData.js` — hook central con toda la lógica: datos, sorteo, resultados, ranking
- `components/Header.jsx` — nombre de temporada + barra de progreso X/12
- `components/DrawTab.jsx` — asistencia → animación sorteo → confirmar/descartar. Estado persistente entre tabs (en App.jsx)
- `components/RankingTab.jsx` — tabla de posiciones + toggle de 3 modos + config N/minPJ
- `components/HistoryTab.jsx` — historial colapsable + registro de resultados inline
- `components/AdminTab.jsx` — jugadores galleta, config temporada, cierre con selector de campeón
- `App.jsx` — orquestador con `pendingDraw` en estado global para persistir sorteo entre tabs
- `styles/global.css` — tema deportivo dark green + amarillo + naranja Drive / azul Revés
- `DOCS.md` — documentación técnica del proyecto
- `.env.example` — variables de Supabase
- Build limpio: `vite build` 25 módulos, 0 errores

### Bugs encontrados y resueltos
- **Bug posiciones duplicadas:** `shuffle(['drive','reves','drive','reves'])` podía dar 2 drives en la misma pareja → resuelto en `drawUtils.js` con `resolvePositions()` por pareja

### Pendientes al cerrar
- C-01: Resultados con lógica de tenis (sets + diferencia)
- C-02: Botón Editar no funciona
- C-03: Popup confirmación al cerrar temporada prematuramente
- C-04: Presentación de cierre de temporada (estilo ceremonia)
- C-05: Vista de temporadas cerradas
- C-06: Framework documentación ✅ (esta sesión)

### Notas para la próxima sesión
- Empezar por C-01 (cambio más estructural — afecta schema, storage, HistoryTab y lógica de ranking)
- C-02 y C-03 son simples, se pueden hacer en el mismo bloque
- C-04 requiere diseño — validar enfoque visual antes de implementar
- Antes de deployar a Netlify: ejecutar schema.sql en Supabase + configurar .env.local
