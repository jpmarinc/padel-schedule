# comentarios.md — padel-schedule

Feedback de Juan Pablo. Cada ítem se marca ✅ al completarse.
Agregar nuevos ítems al final con fecha y número correlativo.

---

## Sesión 2026-03-23

### [C-01] Resultados con lógica de tenis `✅`
Los partidos son al mejor de 3 sets con tie-break de 7 puntos (diferencia de 2).
- Poder ingresar resultado set a set (ej: 6-4 / 3-6 / 7-6)
- Tomar sets ganados - sets perdidos + diferencia de juegos (positiva o negativa)
- La lógica de desempate para el campeón debe ser:
  1. Diferencia de sets
  2. Diferencia de juegos (si hay empate en sets)
- El resultado actual (un solo número) no tiene lógica de tenis → reemplazar completamente

### [C-02] Botón Editar de resultados no funciona `✅`
En el tab Historial, el botón "Editar" de partidos ya jugados no abre el formulario de edición.
- Debe permitir editar ganador + resultado de sets
- El estado "played" debería volver a "editable" al hacer click en Editar

### [C-03] Popup de confirmación al cerrar temporada `✅`
Al cerrar el campeonato antes de completar las fechas programadas, mostrar un popup de advertencia:
- Informar cuántas fechas quedan sin jugar
- Pedir confirmación explícita antes de cerrar
- Ejemplo: "Quedan 6 fechas por jugar. ¿Estás seguro de cerrar la Temporada 1?"

### [C-04] Presentación de cierre de temporada `✅`
Al cerrar una temporada, generar una pantalla de presentación de resultados:
- Revelar desde el 4° lugar hasta el 1°, de a uno (estilo ceremonia)
- El ganador queda marcado con "Exento de cuota de celebración"
- La pantalla debe ser fotogeniable (fondo oscuro, letras grandes, confetti o animación)
- Debe quedar persistida y visible en alguna pestaña posterior al cierre

### [C-05] Ver resultados de temporadas cerradas `✅`
Después de cerrar una temporada, poder ver su ranking final desde alguna pestaña.
- Ideas: selector de temporada en tab Ranking, o pestaña "Temporadas" en el header
- Ver número de temporadas activas/cerradas en algún indicador superior

### [C-06] Framework de documentación replicado de mi-trading `✅`
Crear claude.md + comentarios.md + memoria.md + roadmap.md adaptados al proyecto.
- Framework de trabajo con reglas de sesión
- Feedback documentado en comentarios.md
- Historial de sesiones en memoria.md
- Roadmap con próximos pasos organizados

---

## Sesión 2026-03-23 (tarde)

### [C-07] Restricción de exactamente 4 jugadores en sorteo `✅`
En la selección de asistencia no podían ser más de 4 ni menos de 4 para sortear.
- Contador X/4 visible, checkboxes deshabilitados al llegar a 4

### [C-08] Validación de fecha duplicada en sorteo `✅`
No permitir dos sorteos para la misma fecha. Auto-sugerir próximo lunes.
- Warning naranja si la fecha ya tiene un sorteo guardado
- `suggestedDate()` calcula automáticamente el lunes siguiente al último partido

### [C-09] Bug en ceremonia — campeón incorrecto `✅`
La ceremonia mostraba a Mosso (2°) como campeón en vez de Awad (1°).
Causa: `.reverse().slice(0,4)` cortaba el 1° lugar. Fix: `.slice(0,4).reverse()`
También fix "Revelar undefined" al llegar al último paso.

### [C-10] Nombres de temporada duplicados `✅`
Al crear temporada nueva, el nombre se auto-genera como "Temporada X — 2026" (editable).

### [C-11] Delete jugador galleta `✅`
Botón 🗑 solo visible para galletas con 0 partidos jugados. Con confirmación.

### [C-12] Deploy a producción `✅`
App deployada en Netlify con Supabase como BD.
URL: https://padel-scheduler.netlify.app/

---

## Sesión 2026-06-15

### [C-13] App sin partidos — Supabase pausado `✅`
No aparecía ningún partido y parecía que el respaldo se había perdido.
Causa: proyecto Supabase free pausado por inactividad (DNS NXDOMAIN). Backups intactos en `origin/main` (hasta 2026-04-14). Juan Pablo reactivó el proyecto → datos recuperados sin restaurar.

### [C-14] Quórum debe exigir 4 titulares (no 3) `✅`
Una fecha solo cuenta para el ranking con los 4 jugadores titulares. `QUORUM_REQUIRED = 4`.

### [C-15] El ranking debe considerar la regla `✅`
El ranking contaba fechas viejas mal marcadas (3 titulares + galleta). Se centralizó en `matchCountsForPoints()` y se deriva en vivo → fechas 2 y 3 dejaron de sumar. Retroactivo.

### [C-16] Crear partido manual con equipo y lado específico `✅`
Toggle "✋ Armar manual" en tab Sorteo: asignar cada jugador a Pareja 1/2 y Drive/Revés. Galletas seleccionables (no suman). Crea la fecha lista para cargar resultado en Historial.

---

## Sesión 2026-08-24

### [C-17] Solo las fechas oficiales cuentan para la temporada `✅`
El contador X/12 y el bloqueo del Sorteo contaban TODOS los partidos (incluidos galletas). Ahora solo cuentan los **oficiales**: quórum de 4 titulares Y no amistoso. Nuevo helper `isOfficialMatch()` como fuente única (Header, ranking, Sorteo, Admin).

### [C-18] "Mejores N" no tomaba los mejores resultados de Mario `✅`
El N automático usaba `Math.min(...PJ de todos)` → tomaba el mínimo del grupo (6) y descartaba buenos resultados de quien jugó más. Ahora N lo **fija Admin**; si está en Auto, cuenta todos los oficiales jugados (nunca descarta).

### [C-19] Editar resultados ya jugados `✅`
Verificado: el botón "Editar" en Historial abre el formulario pre-cargado, guarda y persiste. Ya existía (C-02); confirmado end-to-end.

### [C-20] Seguir sorteando partidos que no cuentan `✅`
Se quitó el bloqueo del Sorteo al completar las fechas. Toggle "Amistoso — no cuenta para la temporada" siempre disponible; se fuerza automático si la temporada ya está completa o hay reservas. Nuevo flag `is_friendly` en `padel_matches` (requiere migración en Supabase).

---

## Cómo usar este archivo

- **Juan Pablo:** agrega feedback nuevo con fecha y número `[C-XX]`
- **Claude:** al iniciar sesión, leer este archivo y planificar qué ítems abordar
- **Al completar:** cambiar `[ ]` por `✅` y agregar nota breve de qué se hizo
