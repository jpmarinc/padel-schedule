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

## Cómo usar este archivo

- **Juan Pablo:** agrega feedback nuevo con fecha y número `[C-XX]`
- **Claude:** al iniciar sesión, leer este archivo y planificar qué ítems abordar
- **Al completar:** cambiar `[ ]` por `✅` y agregar nota breve de qué se hizo
