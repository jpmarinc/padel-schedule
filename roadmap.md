# roadmap.md — padel-schedule

Próximos pasos organizados por prioridad. Actualizar al inicio/fin de cada sesión.
Para feedback puntual sobre bugs o mejoras, usar `comentarios.md`.

---

## En progreso / Siguiente sesión

### [R-07] Migrar datos localStorage → Supabase `Media`
Si se jugaron partidos antes del deploy, los datos están solo en el navegador local.
Opciones: exportar JSON desde DevTools → importar via SQL Editor, o función de migración en el app.

### [R-08] Estadísticas por jugador `Baja`
Con quién ha jugado más, posición frecuente (Drive/Revés), racha actual.

---

## Backlog

### [R-01] Resultados con lógica de tenis `Alta`
Reemplazar el input de score simple por ingreso set a set.
- Formato: hasta 3 sets, cada set con score (ej: 6-4 / 3-6 / 7-6)
- Tie-break: 7 puntos con diferencia mínima de 2
- Métricas a calcular y guardar por jugador:
  - Sets ganados / Sets perdidos
  - Diferencia de juegos (suma de juegos ganados - juegos perdidos en todos los sets)
- Criterio de desempate en ranking: 1° diferencia de sets, 2° diferencia de juegos
- Afecta: `schema.sql`, `storage.js`, `HistoryTab.jsx`, `useData.js` (lógica de ranking)

### [R-02] Arreglar botón Editar en Historial `Alta`
El botón no abre el formulario de edición en partidos ya jugados.
- Debe volver el match a estado editable y mostrar el formulario de sets
- Afecta: `HistoryTab.jsx`

### [R-03] Popup confirmación al cerrar temporada prematuramente `Media`
Si quedan fechas sin jugar al cerrar → advertencia con cantidad de fechas restantes.
- Afecta: `AdminTab.jsx`

### [R-04] Presentación de cierre de temporada `Media`
Pantalla de ceremonia de resultados al cerrar:
- Revelar posiciones de atrás hacia adelante (4° → 1°)
- Animación / confetti para el campeón
- Pantalla fotogeniable (fondo oscuro, tipografía grande)
- Persistida y accesible post-cierre
- Afecta: nuevo componente `SeasonCeremony.jsx` + `App.jsx`

### [R-05] Vista de temporadas cerradas `Media`
- Selector de temporada en tab Ranking o nueva pestaña "Temporadas"
- Ver ranking final de cada temporada cerrada
- Indicador de número de temporadas en el header
- Afecta: `Header.jsx`, `RankingTab.jsx` o nuevo tab

---

## Backlog

### [R-08] Estadísticas por jugador `Baja`
En tab Ranking o nuevo tab: con quién ha jugado más, posición más frecuente (Drive/Revés), racha de victorias/derrotas.

### [R-09] Notificación por WhatsApp/Telegram del sorteo `Muy baja`
Enviar el resultado del sorteo al grupo por mensaje automatizado.

### [R-10] Múltiples partidos por lunes `Muy baja`
Si en algún lunes se juegan 2 partidos (ej: todos presentes + tiempo extra), soporte para múltiples matches por fecha.

---

## Completado

| ID | Descripción | Sesión |
|----|-------------|--------|
| — | Setup inicial del proyecto | 001 |
| — | Algoritmo inteligente de sorteo | 001 |
| — | 3 modos de ranking configurables | 001 |
| — | Estado del sorteo persistente entre tabs | 001 |
| — | Fix bug posiciones duplicadas | 001 |
| — | Framework de documentación | 001 |
| R-01..R-05 | Tenis, editar, popup cierre, ceremonia, temporadas cerradas | 002 |
| R-06 | Deploy Netlify + Supabase | 003 |
| C-07..C-12 | Bugs ceremonia, 4 jugadores, fecha duplicada, delete galleta | 003 |

---

## Decisiones de diseño pendientes

- **R-04 Ceremonia:** ¿animación automática por pasos o manual (click para avanzar)? Sugerencia: manual para que Juan Pablo controle el ritmo al mostrarla al grupo.
- **R-05 Temporadas:** ¿selector dentro del tab Ranking o pestaña separada? Sugerencia: selector dentro de Ranking para no agregar un tab más.
