# Diseño de interfaz · Figma

Prototipo navegable de alta fidelidad del Sprint 1 (tareas 4, 5, 6 y 7): **102 pantallas** (91 de móvil y 11 de web) que cubren las 7 épicas, enlazadas entre sí y organizadas según los **17 flujos** del diagrama de flujos del equipo ([Sprint1-Flujos](https://www.figma.com/board/Zh8AiOEErog5zY3qfiWGdg/Sprint1-Flujos)).

- **Archivo de Figma:** [https://www.figma.com/design/mr9G2Ya7jlbMevLRHoR4aL](https://www.figma.com/design/mr9G2Ya7jlbMevLRHoR4aL) (equipo «2026-2027 ISW»)
- **Nombre de la app:** «Repeat» es provisional.

## Cómo usar el prototipo

1. Abre la página **Prototipo** y pulsa ▶ **Present** (arriba a la derecha).
2. En el panel izquierdo elige uno de los 17 flujos para empezar en su pantalla inicial.
3. Funciona como la app: la barra inferior (Inicio · Buscar · Comunidades · Avisos · Perfil), las pestañas (Favoritos/Reseñas/Tableros, Canciones/Álbumes/Artistas, Canciones/Álbumes del ranking, filtros de búsqueda, Publicaciones/Miembros…), los botones, las filas de las listas y la flecha ← para volver. En las pantallas web funciona el menú lateral.
4. Si no sabes dónde pulsar, haz clic en una zona vacía y Figma resalta en azul todo lo que tiene enlace.

**Zonas de demostración.** Para enseñar los casos de error sin salir del flujo, algunos campos llevan a su pantalla de error:

| Pantalla | Qué pulsar | Lleva a |
|---|---|---|
| A04 | pulsar el campo de correo | A05 · credenciales incorrectas |
| A04 | pulsar el campo de contraseña | A06 · cuenta suspendida |
| A08 | pulsar el aviso «Enlace válido…» | A09 · enlace caducado o usado |
| M11 | pulsar «Valoración *obligatoria» | M12 · reseña sin valoración |
| T03 | pulsar «Nombre del tablero» | T04 · tablero sin nombre |
| C02 | pulsar el campo «Indie en español» | C03 · nombre repetido |
| M17 | pulsar «5 de 11 · mínimo 3» | M18 · ranking con menos de 3 canciones |
| M04 | pulsar el texto buscado «mar» | M05 · sin resultados |

## Organización del archivo

- **Prototipo:** todas las pantallas en una sola página, porque Figma solo enlaza pantallas de la misma página. Está dividida en tres secciones, una por tarea:
  - **Tarea 4 · épicas 1 y 4** · 33 pantallas
  - **Tarea 5 · épicas 2, 3 y 6** · 35 pantallas
  - **Tarea 6 · épicas 5 y 7** · 34 pantallas
- **Componentes:** biblioteca de iconos (`icon/000`–`icon/144`) que usan todas las pantallas.

## Convenciones

- **Códigos:** `A` acceso y cuentas, `P` perfil y red social, `M` catálogo, reseñas, descubrimiento y ranking personal, `T` favoritos y tableros, `C` comunidades, `W` web (1440 × 900). Móvil: 390 × 844 (Inicio y ficha de álbum, 390 × 1180 con scroll).
- **Etiqueta:** encima de cada pantalla aparece su código y nombre y, en la línea siguiente, las HU, PA, RN y el flujo que cubre. Ejemplo: `HU-23 (PA-23-04) · RN-06`.
- **Estados:** los errores y casos alternativos tienen su propia pantalla para poder comprobar cada PA negativo.
- **Estilo:** tema claro y minimalista: fondo blanco, tarjetas `#F5F5F8`, texto `#1F2937`, acento rosa empolvado `#DB2777` sobre fondos `#FCE7F3`, estrellas en ámbar; tipografía Inter. Las portadas son colores pastel lisos con una nota musical.

## Flujos del prototipo

Siguen la numeración y el contenido del diagrama de flujos del equipo.

| Flujo | Nombre | Empieza en | Recorrido en el prototipo | HU |
|---|---|---|---|---|
| Flujo 1 | Registro, inicio de sesión, recuperar contraseña y cerrar sesión | A01 | A01 → A02 → A03 (usuario repetido / contraseña insegura) → M01 · A01 → A04 → M01 · A04 → A05 (credenciales incorrectas) / A06 (cuenta suspendida) · A04 → A07 → A08 → A13 → M01 · A09 (enlace caducado o usado) · M01 → Perfil → ⚙ A10 → M22 (visitante) | HU-01, HU-02, HU-17, HU-18 |
| Flujo 2 | Eliminar mi cuenta | A10 | A10 → A11 → A12 (único administrador) → C09 (nombrar otro administrador) o M22 (eliminar comunidad y cuenta) | HU-19 |
| Flujo 3 | Suspender y readmitir usuarios (admin, web) | W06 | W06 → W11 (suspendidos) → «Levantar suspensión» → W06 | HU-37 |
| Flujo 4 | Buscar y consultar fichas | M04 | M04 → filtros M25–M29 (canciones, álbumes, artistas, usuarios, comunidades) → M06 / M07 / M08 / P04 / C04 · M05 (sin resultados) | HU-03, HU-04 |
| Flujo 5 | Importación y gestión del catálogo (admin, web) | W03 | W03 (incidencias de la importación) → W09 (corregir datos) → W10 (eliminar elemento) · la importación (HU-20) no tiene pantalla | HU-20, HU-21, HU-22, HU-40 |
| Flujo 6 | Valorar y reseñar | M06 | M06 → M09 → M07 · M06 → M11 → M06 · M12 (sin puntuación) · M06 → M13 → M11 (editar) / M06 (eliminar) · visitante: M22 → M10 | HU-05, HU-23, HU-08 |
| Flujo 7 | Denunciar una reseña | M07 | M07 ⚑ → M14 → M15 (enviada / ya denunciada) · revisión del administrador en W04 | HU-36, HU-13 |
| Flujo 8 | Mi perfil y privacidad | P01 | P01 ↔ P10 ↔ P11 (favoritos: canciones, álbumes, artistas) · P12 ↔ P15 (reseñas y rankings) · T02 (tableros) · P02 (editar) · P03 (privacidad) · perfil ajeno P04 ↔ P14 | HU-06, HU-43, HU-24 |
| Flujo 9 | Seguir, amistad y bloqueo | P04 | P04 → P16 (Seguir: siguiendo) → P05 (además, solicitud enviada) · P04 → P17 (solo solicitud enviada) · P06 (eliminar amistad) · P04 ⋯ → P07 → P08 (desbloquear) · P13 (solicitudes recibidas) · P09 (perfil no disponible) | HU-10, HU-41, HU-42, HU-35, HU-24 |
| Flujo 10 | Marcar y desmarcar favoritos | T01 | M07 ⋯ → T01 (marcada) → P01 (aparece en Favoritos) · «Deshacer» → M07 (desmarcada) | HU-07 |
| Flujo 11 | Tableros | T02 | T02 → T03 (T04 sin nombre) → T05 → T09 (añadir música) / T07 (privacidad) / T10 (editar) → T11 (eliminar) · T06 (elemento repetido) · T08 (seguir tablero ajeno) | HU-09, HU-25, HU-26, HU-27, HU-34 |
| Flujo 12 | Página principal: recomendaciones, ranking y actividad | M01 | M01 ↔ M23 (ranking de canciones / álbumes) → M03 ↔ M24 · M01 → M20 (actividad) · M02 (sin datos) · M22 (visitante) | HU-12, HU-15, HU-28 |
| Flujo 13 | Notificaciones | M16 | M16 → P13 (solicitud de amistad) · P04 (nuevo seguidor) · C04 / C06 (invitación a comunidad) · M15 · C14 | HU-11, HU-41, HU-31 |
| Flujo 14 | Crear y administrar comunidades | C01 | C01 → C02 (C03 nombre repetido) → C06 → ⚙ C12 → C13 (único administrador) / C15 (eliminar) · C06 → C09 (miembros, expulsar) → C14 · C09 → C10 / C17 | HU-14, HU-29, HU-32 |
| Flujo 15 | Unirse, abandonar y gestionar accesos | C04 | C04 → C20 (unirse) · C01 → C19 (comunidad de la que soy miembro) → ⋯ C16 (abandonar) · C05 (comunidad privada, solicitar acceso) · C10 (aceptar o rechazar solicitudes) · C17 (invitar) · M16 (responder invitación) | HU-30, HU-31, HU-32 |
| Flujo 16 | Publicar, denunciar y moderar en comunidades | C06 | C06 → C07 → C21 (publicación publicada) → ⋯ C18 (eliminar mi publicación) · C06 ⋯ → C08 (denunciar) → C06 · ⚙ C12 → «Denuncias pendientes» → C11 (moderación de los administradores) → C14 (aviso al autor) | HU-33, HU-38, HU-39 |
| Flujo 17 | Ranking personal de un álbum | M19 | M06 → M19 → M17 (M18 menos de 3 canciones) → M19 · M19 → M21 (eliminar) · P15 (mis rankings en el perfil) | HU-44 |

## Trazabilidad HU → pantallas

| HU | Título | Épica | Pantallas |
|---|---|---|---|
| HU-01 | Registrarse | 1 | A01, A02, A03 |
| HU-02 | Iniciar sesión | 1 | A04, A05, A06 |
| HU-03 | Buscar contenido | 2 | M04, M05, M25, M26, M27, M28, M29 |
| HU-04 | Consultar una canción, álbum o artista | 2 | M06, M07, M08, W02 |
| HU-05 | Valorar una canción o un álbum | 3 | M07, M09, M10, W02 |
| HU-06 | Gestionar mi perfil | 4 | P01, P02, P10, P11, P12, P15, W05 |
| HU-07 | Marcar y desmarcar favoritos | 5 | P10, P11, T01 |
| HU-08 | Editar y eliminar mis reseñas | 3 | P12, M13 |
| HU-09 | Crear un tablero | 5 | T02, T03, T04 |
| HU-10 | Seguir y dejar de seguir a otros usuarios | 4 | P04, P05, P06, P16 |
| HU-11 | Recibir notificaciones | 6 | M16, C14 |
| HU-12 | Ver recomendaciones personalizadas | 6 | M01, M02, M22, M23, W01 |
| HU-13 | Revisar denuncias de reseñas | 3 | W04 |
| HU-14 | Crear una comunidad | 7 | C01, C02, C03 |
| HU-15 | Consultar el ranking semanal | 6 | M01, M02, M03, M22, M23, M24, W01 |
| HU-16 | Acceder a funciones premium · fuera del alcance | 7 | — (fuera del alcance) |
| HU-17 | Cerrar sesión | 1 | A10 |
| HU-18 | Recuperar la contraseña | 1 | A07, A08, A09, A13 |
| HU-19 | Eliminar mi cuenta | 1 | A11, A12 |
| HU-20 | Importar el catálogo | 2 | — (proceso automático sin interfaz; sus resultados se ven en W03) |
| HU-21 | Revisar automáticamente el contenido importado | 2 | W03 |
| HU-22 | Resolver las incidencias del catálogo | 2 | W03 |
| HU-23 | Escribir una reseña | 3 | M11, M12, W02 |
| HU-24 | Consultar el perfil de otro usuario | 4 | P04, P06, P09, P14 |
| HU-25 | Añadir y quitar contenido de un tablero | 5 | T05, T06, T09, W08 |
| HU-26 | Editar y eliminar un tablero | 5 | T05, T07, T08, T10, T11, W08 |
| HU-27 | Seguir un tablero público | 5 | T02, T08, C14 |
| HU-28 | Consultar la actividad de mis seguidos y amigos | 6 | M01, M20, M22, M23, W01 |
| HU-29 | Editar y eliminar una comunidad | 7 | C12, C15, W07 |
| HU-30 | Unirse y abandonar una comunidad | 7 | C01, C04, C05, C16, C19, C20 |
| HU-31 | Gestionar invitaciones y solicitudes | 7 | M16, C10, C17 |
| HU-32 | Gestionar miembros y administradores | 7 | C09, C10, C13, C14, W07 |
| HU-33 | Publicar en una comunidad | 7 | C05, C06, C07, C18, C21, W07 |
| HU-34 | Cambiar la privacidad de un tablero | 5 | T07, W08 |
| HU-35 | Bloquear y desbloquear usuarios | 4 | P07, P08, P09 |
| HU-36 | Denunciar una reseña | 3 | M14, M15 |
| HU-37 | Suspender a un usuario | 1 | A06, W06, W11 |
| HU-38 | Denunciar una publicación | 7 | C08 |
| HU-39 | Moderar las publicaciones de una comunidad | 7 | C11, C14 |
| HU-40 | Corregir o eliminar contenido del catálogo | 2 | W03, W09, W10 |
| HU-41 | Enviar y responder solicitudes de amistad | 4 | P04, P05, P13, P17, M16 |
| HU-42 | Eliminar una amistad | 4 | P06 |
| HU-43 | Configurar la privacidad de mi cuenta | 4 | P03, P14, W05 |
| HU-44 | Crear mi ranking personal de un álbum | 3 | P15, M17, M18, M19, M21 |

## Lista de pantallas

| Código | Pantalla | Cubre | Sección |
|---|---|---|---|
| A01 | Bienvenida · visitante | HU-01 · Flujo 1 | Tarea 4 · épicas 1 y 4 |
| A02 | Registro | HU-01 (PA-01-01) | Tarea 4 · épicas 1 y 4 |
| A03 | Registro · usuario repetido y contraseña insegura | HU-01 (PA-01-02, PA-01-03) · RN-01 · RNF-03 | Tarea 4 · épicas 1 y 4 |
| A04 | Iniciar sesión | HU-02 (PA-02-01) · Flujo 1 | Tarea 4 · épicas 1 y 4 |
| A05 | Iniciar sesión · credenciales incorrectas | HU-02 (PA-02-02) | Tarea 4 · épicas 1 y 4 |
| A06 | Iniciar sesión · cuenta suspendida | HU-02 (PA-02-03) · HU-37 · RN-02 | Tarea 4 · épicas 1 y 4 |
| A07 | Recuperar contraseña · solicitar enlace | HU-18 (PA-18-01, PA-18-05) · Flujo 1 | Tarea 4 · épicas 1 y 4 |
| A08 | Recuperar contraseña · crear nueva | HU-18 (PA-18-02) · RN-03 | Tarea 4 · épicas 1 y 4 |
| A09 | Recuperar contraseña · enlace caducado o usado | HU-18 (PA-18-03, PA-18-04) · RN-03 | Tarea 4 · épicas 1 y 4 |
| A10 | Ajustes · cerrar sesión | HU-17 (PA-17-01) · Flujo 1 | Tarea 4 · épicas 1 y 4 |
| A11 | Eliminar mi cuenta | HU-19 (PA-19-01) · RN-23 · Flujo 2 | Tarea 4 · épicas 1 y 4 |
| A12 | Eliminar cuenta · único administrador de una comunidad | HU-19 (PA-19-02) · RN-04 | Tarea 4 · épicas 1 y 4 |
| A13 | Iniciar sesión · contraseña actualizada | HU-18 (PA-18-02) · Flujo 1 | Tarea 4 · épicas 1 y 4 |
| P01 | Mi perfil | HU-06 (PA-06-01) · Flujo 8 | Tarea 4 · épicas 1 y 4 |
| P02 | Editar perfil | HU-06 (PA-06-02) | Tarea 4 · épicas 1 y 4 |
| P03 | Configuración de privacidad | HU-43 (PA-43-01 a 03) · RN-08 · RN-09 | Tarea 4 · épicas 1 y 4 |
| P04 | Perfil de otro usuario · sin relación | HU-24 (PA-24-01) · HU-10 · HU-41 · Flujo 9 | Tarea 4 · épicas 1 y 4 |
| P05 | Perfil de otro usuario · siguiendo y solicitud pendiente | HU-10 (PA-10-01) · HU-41 (PA-41-01, PA-41-04) · RN-11 | Tarea 4 · épicas 1 y 4 |
| P06 | Perfil de un amigo · eliminar amistad | HU-24 (PA-24-02) · HU-42 (PA-42-01, PA-42-02) · HU-10 (PA-10-03) | Tarea 4 · épicas 1 y 4 |
| P07 | Bloquear a un usuario | HU-35 (PA-35-01) · RN-12 · Flujo 9 | Tarea 4 · épicas 1 y 4 |
| P08 | Usuarios bloqueados · desbloquear | HU-35 (PA-35-03) | Tarea 4 · épicas 1 y 4 |
| P09 | Perfil no disponible (usuario que me ha bloqueado) | HU-24 (PA-24-03) · HU-35 (PA-35-02) · RN-12 | Tarea 4 · épicas 1 y 4 |
| P10 | Mi perfil · favoritos · álbumes | HU-06 (PA-06-01) · HU-07 · Flujos 8 y 10 | Tarea 4 · épicas 1 y 4 |
| P11 | Mi perfil · favoritos · artistas | HU-06 (PA-06-01) · HU-07 · Flujos 8 y 10 | Tarea 4 · épicas 1 y 4 |
| P12 | Mi perfil · reseñas | HU-06 (PA-06-01) · HU-08 · Flujos 6 y 8 | Tarea 4 · épicas 1 y 4 |
| P13 | Solicitudes de amistad recibidas | HU-41 (PA-41-02, PA-41-03) · Flujos 9 y 13 | Tarea 4 · épicas 1 y 4 |
| P14 | Perfil de otro usuario · favoritos | HU-24 (PA-24-01) · HU-43 · Flujo 8 | Tarea 4 · épicas 1 y 4 |
| P15 | Mi perfil · mis rankings de álbumes | HU-44 (PA-44-06) · HU-06 · Flujos 8 y 17 | Tarea 4 · épicas 1 y 4 |
| P16 | Perfil de otro usuario · siguiendo | HU-10 (PA-10-01) · Flujo 9 | Tarea 4 · épicas 1 y 4 |
| P17 | Perfil de otro usuario · solicitud pendiente | HU-41 (PA-41-01) · Flujo 9 | Tarea 4 · épicas 1 y 4 |
| M01 | Inicio | HU-12 · HU-15 · HU-28 | Tarea 5 · épicas 2, 3 y 6 |
| M02 | Inicio · usuario sin datos | HU-12 (PA-12-03) · HU-15 | Tarea 5 · épicas 2, 3 y 6 |
| M03 | Ranking semanal | HU-15 | Tarea 5 · épicas 2, 3 y 6 |
| M04 | Buscar · resultados por categoría | HU-03 (PA-03-01, PA-03-03) · Flujo 4 | Tarea 5 · épicas 2, 3 y 6 |
| M05 | Buscar · sin resultados | HU-03 (PA-03-02) | Tarea 5 · épicas 2, 3 y 6 |
| M06 | Ficha de álbum | HU-04 (PA-04-01) · Flujos 4, 6 y 17 | Tarea 5 · épicas 2, 3 y 6 |
| M07 | Ficha de canción · con mi valoración | HU-04 · HU-05 (PA-05-02) | Tarea 5 · épicas 2, 3 y 6 |
| M08 | Ficha de artista | HU-04 (PA-04-02) | Tarea 5 · épicas 2, 3 y 6 |
| M09 | Valorar con estrellas (valoración rápida) | HU-05 (PA-05-01) | Tarea 5 · épicas 2, 3 y 6 |
| M10 | Visitante intenta valorar | HU-05 (PA-05-04) | Tarea 5 · épicas 2, 3 y 6 |
| M11 | Escribir reseña eligiendo privacidad | HU-23 (PA-23-01, PA-23-02) | Tarea 5 · épicas 2, 3 y 6 |
| M12 | Error · reseña sin valoración | HU-23 (PA-23-04) · RN-06 | Tarea 5 · épicas 2, 3 y 6 |
| M13 | Editar / eliminar mi reseña | HU-08 (PA-08-01, PA-08-02) | Tarea 5 · épicas 2, 3 y 6 |
| M14 | Denunciar reseña | HU-36 (PA-36-01) | Tarea 5 · épicas 2, 3 y 6 |
| M15 | Denuncia enviada / denuncia repetida | HU-36 (PA-36-01, PA-36-02) · RN-18 | Tarea 5 · épicas 2, 3 y 6 |
| M16 | Bandeja de notificaciones | HU-11 (PA-11-01, PA-11-02, PA-11-03) | Tarea 5 · épicas 2, 3 y 6 |
| M17 | Crear / ordenar mi ranking de un álbum | HU-44 (PA-44-01, PA-44-04, PA-44-07) | Tarea 5 · épicas 2, 3 y 6 |
| M18 | Error · ranking con menos de 3 canciones | HU-44 (PA-44-03) · RN-25 | Tarea 5 · épicas 2, 3 y 6 |
| M19 | Ficha de álbum · pestaña Rankings | HU-44 (PA-44-01, PA-44-06) | Tarea 5 · épicas 2, 3 y 6 |
| M20 | Actividad de seguidos y amigos | HU-28 (PA-28-01 a 03) · Flujo 12 | Tarea 5 · épicas 2, 3 y 6 |
| M21 | Eliminar mi ranking · confirmación | HU-44 (PA-44-07) · Flujo 17 | Tarea 5 · épicas 2, 3 y 6 |
| M22 | Inicio · visitante | HU-12 · HU-15 · HU-28 · Flujos 1 y 12 | Tarea 5 · épicas 2, 3 y 6 |
| M23 | Inicio · ranking de álbumes | HU-15 (PA-15-01) · HU-12 · HU-28 · Flujo 12 | Tarea 5 · épicas 2, 3 y 6 |
| M24 | Ranking semanal · álbumes | HU-15 (PA-15-01, PA-15-05) · Flujo 12 | Tarea 5 · épicas 2, 3 y 6 |
| M25 | Buscar · filtro Canciones | HU-03 (PA-03-01) · Flujo 4 | Tarea 5 · épicas 2, 3 y 6 |
| M26 | Buscar · filtro Álbumes | HU-03 (PA-03-01) · Flujo 4 | Tarea 5 · épicas 2, 3 y 6 |
| M27 | Buscar · filtro Artistas | HU-03 (PA-03-01) · Flujo 4 | Tarea 5 · épicas 2, 3 y 6 |
| M28 | Buscar · filtro Usuarios | HU-03 (PA-03-01, PA-03-03) · Flujo 4 | Tarea 5 · épicas 2, 3 y 6 |
| M29 | Buscar · filtro Comunidades | HU-03 (PA-03-01) · Flujo 4 | Tarea 5 · épicas 2, 3 y 6 |
| T01 | Marcar como favorito | HU-07 (PA-07-01, PA-07-02) · Flujo 10 | Tarea 6 · épicas 5 y 7 |
| T02 | Mi perfil · pestaña Tableros | HU-09 (PA-09-01) · HU-27 (PA-27-01) · Flujo 11 | Tarea 6 · épicas 5 y 7 |
| T03 | Crear un tablero | HU-09 (PA-09-01, PA-09-02) · RN-09 | Tarea 6 · épicas 5 y 7 |
| T04 | Error · tablero sin nombre | HU-09 (PA-09-03) · RN-14 | Tarea 6 · épicas 5 y 7 |
| T05 | Mi tablero · contenido | HU-25 (PA-25-03) · HU-26 · Flujo 11 | Tarea 6 · épicas 5 y 7 |
| T06 | Añadir a un tablero · elemento repetido | HU-25 (PA-25-01, PA-25-02) · RN-14 | Tarea 6 · épicas 5 y 7 |
| T07 | Cambiar privacidad · eliminar tablero | HU-34 (PA-34-01, PA-34-03) · HU-26 (PA-26-02) · RN-15 | Tarea 6 · épicas 5 y 7 |
| T08 | Tablero público de otro usuario · seguir | HU-27 (PA-27-01, PA-27-02) · HU-26 (PA-26-03) · RN-15 | Tarea 6 · épicas 5 y 7 |
| T09 | Añadir música desde el tablero | HU-25 (PA-25-01, PA-25-02) · Flujo 11 | Tarea 6 · épicas 5 y 7 |
| T10 | Editar tablero | HU-26 (PA-26-01) · Flujo 11 | Tarea 6 · épicas 5 y 7 |
| T11 | Eliminar tablero · confirmación | HU-26 (PA-26-02) · Flujo 11 | Tarea 6 · épicas 5 y 7 |
| C01 | Comunidades · explorar | HU-30 · HU-14 · Flujo 14 | Tarea 6 · épicas 5 y 7 |
| C02 | Crear comunidad | HU-14 (PA-14-01) · RN-04 | Tarea 6 · épicas 5 y 7 |
| C03 | Error · nombre de comunidad repetido | HU-14 (PA-14-02) · RN-16 | Tarea 6 · épicas 5 y 7 |
| C04 | Comunidad pública · no miembro | HU-30 (PA-30-01) · Flujos 15 y 16 | Tarea 6 · épicas 5 y 7 |
| C05 | Comunidad privada · solicitar acceso | HU-30 (PA-30-02) · HU-33 (PA-33-03) · RN-17 | Tarea 6 · épicas 5 y 7 |
| C06 | Comunidad · publicaciones (miembro) | HU-33 (PA-33-01) · Flujos 15 y 16 | Tarea 6 · épicas 5 y 7 |
| C07 | Publicar en una comunidad | HU-33 (PA-33-01) | Tarea 6 · épicas 5 y 7 |
| C08 | Denunciar una publicación | HU-38 (PA-38-01, PA-38-02) · RN-18 | Tarea 6 · épicas 5 y 7 |
| C09 | Gestionar miembros · expulsar con motivo | HU-32 (PA-32-01, PA-32-04, PA-32-05) · RN-17 · RN-24 | Tarea 6 · épicas 5 y 7 |
| C10 | Solicitudes de acceso e invitaciones | HU-31 (PA-31-01 a 03) · HU-32 (PA-32-02, PA-32-03) · RN-17 | Tarea 6 · épicas 5 y 7 |
| C11 | Moderar denuncias de la comunidad | HU-39 (PA-39-01 a 03) · RN-18 | Tarea 6 · épicas 5 y 7 |
| C12 | Ajustes de la comunidad (administrador) | HU-29 (PA-29-01, PA-29-02) · RN-13 · RN-23 | Tarea 6 · épicas 5 y 7 |
| C13 | Abandonar · único administrador | HU-32 (PA-32-06, PA-32-07) · RN-04 · RN-24 | Tarea 6 · épicas 5 y 7 |
| C14 | Avisos · expulsión, publicación eliminada y tablero seguido | HU-32 (PA-32-01) · HU-39 (PA-39-02) · HU-27 (PA-27-02) | Tarea 6 · épicas 5 y 7 |
| C15 | Eliminar comunidad · confirmación | HU-29 (PA-29-02) · Flujo 14 | Tarea 6 · épicas 5 y 7 |
| C16 | Abandonar una comunidad (miembro) | HU-30 (PA-30-03) · Flujo 15 | Tarea 6 · épicas 5 y 7 |
| C17 | Invitar a un usuario · invitaciones enviadas | HU-31 (PA-31-01) · Flujo 15 | Tarea 6 · épicas 5 y 7 |
| C18 | Eliminar mi publicación | HU-33 (PA-33-02) · Flujo 16 | Tarea 6 · épicas 5 y 7 |
| C19 | Comunidad · Vinilos y directos (miembro) | HU-30 · Flujo 15 | Tarea 6 · épicas 5 y 7 |
| C20 | Comunidad pública · recién unido | HU-30 (PA-30-01) · Flujo 15 | Tarea 6 · épicas 5 y 7 |
| C21 | Comunidad · mi publicación publicada | HU-33 (PA-33-01) · Flujo 16 | Tarea 6 · épicas 5 y 7 |
| W01 | Inicio (web) | HU-12 · HU-15 · HU-28 | Tarea 5 · épicas 2, 3 y 6 |
| W02 | Ficha de álbum (web) | HU-04 · HU-05 · HU-23 | Tarea 5 · épicas 2, 3 y 6 |
| W03 | Admin · incidencias del catálogo | HU-21 · HU-22 · HU-40 | Tarea 5 · épicas 2, 3 y 6 |
| W04 | Admin · denuncias de reseñas | HU-13 (PA-13-01 a 03) | Tarea 5 · épicas 2, 3 y 6 |
| W05 | Mi perfil (web) | HU-06 · HU-43 | Tarea 4 · épicas 1 y 4 |
| W06 | Admin · suspender usuario | HU-37 (PA-37-01, PA-37-02) · RN-02 | Tarea 4 · épicas 1 y 4 |
| W07 | Comunidad (web) | HU-33 · HU-29 · HU-32 | Tarea 6 · épicas 5 y 7 |
| W08 | Tablero (web) | HU-25 · HU-26 · HU-34 | Tarea 6 · épicas 5 y 7 |
| W09 | Admin · catálogo · editar elemento | HU-40 (PA-40-01) · Flujo 5 | Tarea 5 · épicas 2, 3 y 6 |
| W10 | Admin · eliminar elemento del catálogo | HU-40 (PA-40-02, PA-40-03) · Flujo 5 | Tarea 5 · épicas 2, 3 y 6 |
| W11 | Admin · levantar suspensión | HU-37 (PA-37-02) · Flujo 3 | Tarea 4 · épicas 1 y 4 |

## Cambios tras la prueba de usabilidad

Después de la prueba de usabilidad ([usabilidad.md](usabilidad.md)) se aplicaron estos cambios en el prototipo:

| Problema | Cambio aplicado | Pantallas |
|---|---|---|
| 1 · «Seguir» llevaba a una pantalla con la solicitud de amistad enviada | Seguir y enviar una solicitud de amistad son ahora acciones separadas: «Seguir» solo cambia el botón a «Siguiendo», y «Enviar solicitud» solo marca la solicitud como enviada. Si se hacen las dos, se llega a P05. | P04, P05, P06, P14, P16 (nueva), P17 (nueva) |
| 2 · Enlaces a perfiles y del feed de comunidades que llevaban a pantallas inesperadas | Cada usuario enlaza a su propio perfil (el resultado de búsqueda que abría otro perfil es ahora el mismo usuario). En comunidades, «Unirme» abre la comunidad a la que te unes, «Vinilos y directos» abre su comunidad y no el aviso de abandonar, «Publicar» muestra tu publicación en el feed y enviar una denuncia vuelve al feed; la moderación se abre desde Ajustes → «Denuncias pendientes». | M04, M16, M28, C01, C04, C07, C08, C12, C16, C18, C19 (nueva), C20 (nueva), C21 (nueva) |
| 3 · No se entendía qué es un tablero | Texto de ayuda bajo las pestañas: «Crea tableros personalizados para organizar y guardar tus canciones y álbumes favoritos». | T02 |
| 4 · No quedaba claro quién crea las comunidades | Subtítulo en Comunidades: «Únete a las comunidades existentes o crea la tuya propia para compartir música». | C01 |

Además, todos los usuarios del prototipo tienen nombres ficticios: no aparece el nombre de ninguna integrante del equipo.

## Limitaciones conocidas

- Las pantallas web (W01–W11) muestran la adaptación a escritorio; tienen el menú lateral y los enlaces principales, pero los flujos completos se recorren en móvil.
- Los artistas, álbumes y canciones son reales e internacionales (Adele, Arctic Monkeys, Maroon 5, Bruno Mars, Billie Eilish, Taylor Swift, Dua Lipa, The Weeknd…) para dar realismo; los usuarios, comunidades, reseñas y cifras son inventados.
- Las portadas son marcadores de color con una nota musical: no se usan las portadas reales porque tienen derechos de autor.
- Las acciones que solo cambian un estado en la misma pantalla (por ejemplo «Aceptar» una solicitud o «Desbloquear») no tienen pantalla propia: se explican con el aviso que aparece en la pantalla siguiente.
