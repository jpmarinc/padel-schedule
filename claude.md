# CLAUDE.md — padel-schedule

Guía de referencia para Claude. Se lee al inicio de cada sesión.
Contexto rápido del proyecto, reglas de trabajo y patrones de error registrados.

---

## Reglas de sesión

1. **Al iniciar:** Leer este archivo + `comentarios.md` + última entrada de `memoria.md`. Identificar feedback pendiente antes de tocar código.
2. **Antes de cualquier cambio de código:** Si el cambio tiene más de 3 pasos, escribir el plan y validar con Juan Pablo antes de implementar.
3. **Al completar cada ítem de feedback:** Marcar ✅ en `comentarios.md` inmediatamente.
4. **Al finalizar sesión:** Agregar entrada en `memoria.md` con resumen de lo hecho, decisiones tomadas y pendientes. Actualizar `roadmap.md` si cambiaron prioridades.
5. **Ante cualquier bug nuevo:** Documentar causa raíz en "Patrones de error" de este archivo.
6. **NUNCA guardar credenciales** en ningún archivo del proyecto (Supabase keys, etc.).
7. **Sin fixes temporales ni lógica hardcodeada.** Cambios simples con impacto directo.

---

## Arquitectura del proyecto

**Proyecto:** Campeonato de pádel personal — sorteo semanal, ranking con 3 modos, historial de resultados por temporada.

**Stack:** React + Vite · localStorage (fallback) · Supabase JS (opcional) · Deploy Netlify

**Supabase:** mismo proyecto que mi-trading (`fwcjolnhghqqbclrbdrc`) — usar tablas con prefijo `padel_`

### Archivos principales

| Archivo | Rol |
|---|---|
| `src/App.jsx` | Orquestador slim — tabs + estado global `pendingDraw` |
| `src/hooks/useData.js` | Hook central — todos los datos, operaciones y lógica de ranking |
| `src/lib/storage.js` | Persistencia localStorage — seed de 5 jugadores, todas las operaciones CRUD |
| `src/lib/supabase.js` | Cliente Supabase opcional — si no está configurado, el app usa storage.js |
| `src/lib/drawUtils.js` | Algoritmo de sorteo inteligente — evita repetir parejas, rota posiciones |
| `src/components/DrawTab.jsx` | Sorteo del lunes — asistencia → animación → confirmar/descartar |
| `src/components/RankingTab.jsx` | Tabla de posiciones + selector de modo de ranking |
| `src/components/HistoryTab.jsx` | Historial de fechas + registro de resultados |
| `src/components/AdminTab.jsx` | Jugadores galleta, config temporada, cierre |
| `src/constants/index.js` | Posiciones (Drive/Revés), modos de ranking, constantes globales |
| `schema.sql` | DDL Supabase + seed de jugadores |

### Jugadores titulares (Temporada 1)

Mario San Martin · Juan Carlos Awad · Jose Luis Mosso · Nicolas Gonzalez · Juan Pablo Marin

### Flujo de una fecha

```
Lunes llega → Tab Sorteo
  → Marcar asistencia (titulares + galletas)
  → Validar quórum (≥3 titulares = cuenta para ranking)
  → Sortear: algoritmo elige la pareja menos repetida, rota posiciones
  → Confirmar sorteo → guardado en localStorage/Supabase
  → Post partido: Tab Historial → ingresar resultado → puntos calculados
  → Tab Ranking → standings actualizados
```

### Lógicas de ranking (configurables desde Admin)

| Modo | Lógica |
|---|---|
| `absolute` | Suma total de victorias |
| `winrate` | Victorias / PJ × 100 (requiere mínimo PJ para clasificar) |
| `best_n` | Top N resultados por jugador (N auto = mínimo PJ del grupo, o fijo) |

### Regla de quórum

Si < 3 titulares presentes → el partido se juega y sortea normalmente, pero la fecha **no suma puntos** al ranking. Badge naranja "Sin puntos" visible en historial y sorteo.

### Algoritmo de sorteo (drawUtils.js)

- Para 4 jugadores hay exactamente 3 combinaciones posibles de parejas
- El algoritmo evalúa las 3 y elige la de menor score (= parejas menos repetidas recientemente)
- Empate en score → aleatorio entre los empatados
- Posiciones: si una pareja se repite, rota Drive/Revés respecto al último partido juntos
- Garantía: siempre 1 Drive + 1 Revés por pareja (nunca 2 drives o 2 revés)

---

## Patrones de error registrados

### Bug posiciones duplicadas en sorteo (2026-03-23)
**Causa:** `shuffle(['drive','reves','drive','reves'])` podía producir `[drive, drive, reves, reves]`, asignando 2 drives a la misma pareja.
**Solución:** Asignar posiciones por pareja independientemente en `drawUtils.js` → `resolvePositions()` garantiza siempre 1 drive + 1 revés por par.

---

## Fuentes de verdad

| Qué | Dónde |
|---|---|
| Jugadores, partidos, resultados | localStorage / Supabase tablas `padel_*` |
| Schema BD | `schema.sql` |
| Feedback pendiente | `comentarios.md` |
| Historial de sesiones | `memoria.md` |
| Próximos pasos | `roadmap.md` |
| Documentación técnica | `DOCS.md` |
| Variables de entorno | `.env.local` (nunca commitear) |
