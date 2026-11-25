# Hertz · Guía de diseño

> Resume todo lo decidido sobre el diseño de **Hertz**, la app del Grupo C (Ingeniería del Software, Universidad Loyola). El documento oficial del proyecto, «Repeat · Sprint 0 y Sprint 1», sigue siendo la fuente de los requisitos. Hertz es el nombre oficial nuevo de la app.

- **Lienzo con todas las pantallas:** https://claude.ai/artifact/8KyDxjUL9BAULczuR1yDMf (página «Hertz»: arriba el modo claro y debajo el modo oscuro). La página «Tema retro» del lienzo está **descartada por ahora**: no hay que usarla.
- **Qué es:** red social para reseñar, valorar, organizar y compartir música. Web adaptable (ordenador y móvil), **sin reproducción de música**.

---

## 1. Dirección visual

- **Minimalista, editorial y con objetos musicales.** Fondo papel, tinta casi negra, bordes finos y sombras desplazadas sólidas, tipografía enorme y condensada.
- **Referencias:** la web de Tame Impala (vinilo cortado y título gigante), la app de audiolibros de bordes negros, «The color archive» (carpetas con pestañas), la biblioteca de CD de Spotify y los dibujos de gusanos a línea.
- **Lo que evitamos:** layouts genéricos de app (menú lateral de iconos y rejillas de tarjetas idénticas), varios colores compitiendo y degradados.
- **Dos modos: claro y oscuro.** Mismo diseño, con papel y tinta intercambiados. El tema retro pixel art queda descartado por ahora.

## 2. Tokens

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| Fondo | `#F4EFE6` | `#141210` | Fondo general |
| Superficie | `#FBF8F2` | `#1E1B18` | Campos, tarjetas internas, cuerpo del gusanillo |
| Tinta | `#161412` | `#F2ECE1` | Texto y bordes |
| Sombra desplazada | `#161412` | `#56504A` | Sombras sólidas de botones, tarjetas, carpetas y cajas |
| Acento | `#FF2E97` | `#FF5CAB` | Botón principal, sección activa, punto de pestaña. **Un solo acento.** En oscuro es un poco más claro y menos saturado para que no vibre sobre el negro. El texto del botón rosa es siempre oscuro (`#161412` en claro, `#141210` en oscuro). |
| Acento en texto | `#C2186F` | `#FF8CC4` | Etiquetas pequeñas en rosa, con contraste suficiente en cada modo |
| Carpeta kraft | `#E4DCCD` | `#2B2722` | Carpetas no seleccionadas |
| Carpeta abierta | `#F9D7E6` | `#3B2231` | La carpeta seleccionada (solo esa lleva color) |
| Estrella sin marcar | `#C9C2B4` | `#4A443C` | Valoración |
| Tonos de portada de ejemplo | `#CFC4F0` `#F2E3A8` `#C9D8BE` `#EDBFAE` | iguales | Solo para portadas provisionales |

**Cómo se cambia de modo:** todavía no hay pantalla de Ajustes. Lo natural es ponerlo allí («Apariencia: claro / oscuro / según el sistema») y empezar según la preferencia del sistema (`prefers-color-scheme`).

- **Bordes:** 2 px de tinta. En listas, una línea de 1 px entre filas, sin cajas.
- **Sombra:** desplazada y sólida, `3px 3px 0` en botones, `4–6px` en tarjetas y carpetas, siempre en tinta.
- **Radios:** 0 en botones y tarjetas. 10 px solo en las pestañas de carpeta. Los avatares son círculos.

## 3. Tipografía (Google Fonts)

- **Títulos:** Archivo, peso 900, ancho 62 % (condensada), interlineado 0,8–0,9 y MAYÚSCULAS para los títulos grandes. Tamaños de referencia: 250 px (HERTZ en la entrada), 150 px (título de álbum), 112 px (perfil y tablero), 52 px (títulos de ventana).
- **Texto:** Archivo normal, 14–17 px.
- **Etiquetas, fechas, datos y navegación:** DM Mono, 11–13 px, en MAYÚSCULAS.
- Enlace: `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=DM+Mono:wght@400;500&display=swap`

## 4. Componentes

**Barra superior (igual en todas las pantallas con sesión)**
- Altura de 64 px, con borde inferior de 2 px.
- **HERTZ** a la izquierda. A la derecha, los enlaces INICIO · DESCUBRIR · COMUNIDAD en DM Mono, la lupa y el avatar redondo.
- La sección activa va subrayada en rosa. **No hay enlace a «Tableros»**: se llega desde el perfil. En tu perfil, en tus tableros o al elegir compañero, se marca el avatar con un aro rosa (`box-shadow: 0 0 0 3px papel, 0 0 0 5px acento`).

**Botones**
- **Principal:** fondo rosa, texto en tinta, borde de 2 px y sombra de 3 px. Al pulsarlo se desplaza 3 px y pierde la sombra.
- **Secundario:** borde de 2 px, sin fondo.
- **Oscuro:** fondo de tinta y texto papel, para «+ Nuevo tablero» y «Guardar».

**Selectores segmentados**
- Una fila de opciones con borde. La activa va con fondo de tinta y texto papel.
- Se usan para la privacidad (PÚBLICO · SOLO AMIGOS · PRIVADO), Álbumes/Canciones y Canciones/Álbumes/Artistas.

**Carpetas con pestañas** (perfil y entrada)
- Carpetas apiladas: cada una baja 12 px respecto a la de detrás, y su pestaña está desplazada en horizontal.
- **Todas en kraft menos la abierta**, que va en `#F9D7E6`, delante, con un punto rosa en la pestaña y sombra de 6 px. La pestaña activa se funde con su carpeta: su borde inferior es del color de la carpeta.

**Caja de CD** (cada tablero es un CD)
- Se monta con tres capas cuadradas del mismo tamaño:
  1. `cd_disco_capa_superior.png` es el borde del disco, el anillo transparente central, el agujero y el brillo.
  2. Por debajo de esa capa va un **círculo con la portada**: `left:11%; top:8%; width:84%; height:84%; border-radius:50%`. El centro se recorta con `radial-gradient(circle closest-side, transparent 0 28%, COLOR 28%)` o con `mask-image` si es una imagen real.
  3. Encima de todo va `cd_caja_transparente.png`, la caja de plástico con bisagra y centro dentado. Es semitransparente y deja ver el disco. Lleva `filter: drop-shadow(4px 4px 0 #161412)`.
- **En oscuro** se usan `cd/oscuro/cd_caja_transparente_oscuro.png` y `cd/oscuro/cd_disco_capa_superior_oscuro.png` (contorno claro, plástico ahumado), con la sombra en `#56504A`.
- **Disco saliendo de la caja** (inicio y tablero abierto): el círculo y la capa del disco se desplazan unos 45 % del ancho hacia la derecha y la caja se queda en su sitio.
- **Tablero sin contenido:** solo la caja, sin disco.

**Gusanillo compañero** (SVG en `hertz/gusanillos/`; en oscuro, `hertz/gusanillos/oscuro/`, con línea clara y cuerpo oscuro)
- Hay cinco poses: hola, con cascos, de fiesta, patinando y en la disco.
- Está dibujado como un tubo blanco con contorno negro, rayitas perpendiculares en el cuerpo, ojos de punto o cerrados y accesorios a línea.
- **Es decoración.** Cada usuario elige el suyo, o ninguno, desde su perfil. Aparece pequeño junto al nombre (unos 130 px) y también en la entrada y como ilustración en el inicio.
- No está en el documento de requisitos. Si se construye, hace falta una historia Could y un campo «compañero» en RI-01.

## 5. Pantallas (lienzo, página «Hertz»)

Cada pantalla existe en claro (`pantallas/claro/Hertz*.dc.html`) y en oscuro (`pantallas/oscuro/Oscuro*.dc.html`), salvo la de Marca, que solo está en claro.

| Pantalla | Archivo | Qué contiene | Historias de usuario |
|---|---|---|---|
| Entrada · Iniciar sesión | `HertzAcceso` | HERTZ gigante con el gusanillo. Carpeta rosa con correo o usuario, contraseña, «¿Has olvidado tu contraseña?» y Entrar. Pestaña kraft «Crear cuenta». «Seguir como visitante →» con una explicación. | HU-02, HU-18, visitante |
| Entrada · Crear cuenta | `HertzRegistro` | Nombre, nombre de usuario, correo, contraseña con requisitos (los requisitos son un **ejemplo**: definir los reales), casilla de términos y privacidad (RGPD) y aviso de que todo es público por defecto. | HU-01, RI-02 |
| Marca | `HertzMarca` | Logotipo, gusanillos, paleta, tipografía y botones. | — |
| Inicio | `HertzInicio` | Disco de la semana saliendo de su caja, título enorme, Escribir reseña y Añadir a un tablero. **Ranking semanal** con selector Álbumes/Canciones, nota y número de valoraciones, y «Ver el top 10». **Para ti**: recomendaciones de álbum, canción y artista. Cinta inferior «Siguiendo y amigos» con la actividad. | HU-15, HU-12, HU-28 |
| Perfil propio · Tableros | `HertzPerfil` | Nombre gigante con el compañero y el botón de lápiz, bio y estadísticas (reseñas, seguidores, siguiendo, amigos). Carpetas **Favoritos · Reseñas · Tableros**. Texto de ayuda de la prueba de usabilidad. Cajas de CD con el número de elementos y la privacidad. «+ Nuevo tablero». | HU-06, HU-09, RI-01, RI-12 |
| Perfil · elegir compañero | `HertzCompanero` | Ventana con las cinco poses y «Sin compañero», más Cancelar y Guardar. | (extra) |
| Perfil de otra persona · Favoritos | `HertzOtroPerfil` | Su compañero. **Seguir** y **Enviar solicitud de amistad** como botones separados, y Bloquear en «•••». Carpeta Favoritos abierta con Canciones/Álbumes/Artistas y su visibilidad. | HU-24, HU-10, HU-41, HU-35, RI-11 |
| Tablero abierto | `HertzTablero` | Caja con el disco saliendo, nombre gigante, dueño, número de elementos y **seguidores**. Opciones dentro del tablero: + Añadir canción o álbum, Editar, privacidad en tres opciones, y eliminar en «•••». Lista numerada con tipo (álbum o canción), tu nota y la fecha. | HU-25, HU-26, HU-34, HU-49, HU-50 |
| Ficha de álbum | `HertzFicha` | Disco en su caja, ♡ Favorito y + A un tablero. Nota media con su distribución y datos. Título enorme y artista. **Tu valoración** de 1 a 5, que se guarda al pulsar; reseña opcional con privacidad y Publicar. Canciones con su nota media. **Tu ranking personal**: arrastrar para ordenar, mínimo 3, quitar con ×, añadir y privacidad, con el aviso de que no cuenta para la media. Reseñas visibles, con «Valoración rápida, sin texto» cuando no hay texto y denunciar en «•••». | HU-04, HU-05, HU-23, HU-44, HU-36, HU-07 |

## 6. Decisiones alineadas con el documento

- Pestañas del perfil: solo **Favoritos** (canciones, álbumes y artistas), **Reseñas** y **Tableros**. Las comunidades no son una pestaña del perfil.
- Privacidad en tres niveles en reseñas, tableros, rankings personales y favoritos: **público, solo amigos y privado**. El valor por defecto es público.
- **Seguir ≠ amistad**: dos botones distintos. Al pulsar «Seguir» solo cambia a «Siguiendo» (fue el fallo grave de la prueba de usabilidad).
- **Sin reproducción**: no hay botones de escuchar ni de muestra.
- Los tableros contienen **canciones y álbumes**. Solo los públicos se pueden seguir.
- Una reseña por elemento: nota obligatoria de 1 a 5 y texto opcional.
- El ranking personal, por álbum, tiene un mínimo de 3 canciones y no afecta a la media ni al ranking semanal.
- Las notificaciones son **por correo**, así que no hay campana en la barra.
- Textos de ayuda de la prueba: en Tableros, «Crea tableros personalizados para organizar y guardar tus canciones y álbumes favoritos.»; en Comunidades, «Únete a las comunidades existentes o crea la tuya propia para compartir música.»

## 7. Pantallas que faltan

1. Inicio en modo visitante: sin «Para ti» ni actividad, con una invitación a registrarse.
2. Ficha de canción, como la de álbum pero sin ranking personal.
3. Ficha de artista, con su información y sus álbumes.
4. Buscador y resultados de canciones, álbumes, artistas y usuarios.
5. Ranking semanal completo: top 10 de canciones y top 10 de álbumes.
6. Comunidades: la lista con su subtítulo de ayuda, la comunidad con su feed y publicaciones, crear y editar, unirse o solicitar acceso, y miembros y moderación.
7. Perfil: carpeta de Reseñas abierta (reseñas y rankings personales) y edición del perfil.
8. Ajustes: privacidad por defecto, visibilidad de favoritos, bloqueados, apariencia (claro u oscuro) y eliminar la cuenta.
9. Administración: incidencias del catálogo del agente de IA, denuncias, suspender usuarios y corregir o eliminar contenido.
10. Versión móvil de todas las pantallas (columna única; la barra superior pasa a una barra de pestañas abajo).

## 8. Archivos de esta carpeta

- `hertz/pantallas/claro/*.dc.html` y `hertz/pantallas/oscuro/*.dc.html`: el código de cada pantalla del lienzo, en formato de componente del lienzo de diseño. Sirven de referencia exacta de medidas, colores y textos. Las rutas `/_blob/...` son las imágenes de `hertz/cd/`:
  - `…b53d8ee0…` → `cd_caja_transparente.png`
  - `…340024a0…` → `cd_disco_capa_superior.png`
  - `…d654b5b7…` → `oscuro/cd_caja_transparente_oscuro.png`
  - `…31431d88…` → `oscuro/cd_disco_capa_superior_oscuro.png`
- `hertz/gusanillos/*.svg` y `gusanillos/oscuro/*.svg`: los cinco gusanillos en cada modo.
- `hertz/cd/` y `cd/oscuro/`: las capas del CD (600×600, transparentes) en cada modo.

Los nombres de álbumes, artistas, usuarios y reseñas de las pantallas son **de ejemplo**.

## 9. En el código

- Colores y fuentes: `app/src/theme.ts` (`lightColors`, `darkColors`, `fonts`). El modo se elige con la preferencia del sistema.
- Componentes: `Button` (principal, secundario y oscuro), `TextField`, `Checkbox`, `Folder` (carpetas con pestañas), `Logo`, `Worm` (gusanillos), `TopBar` y `EntryLayout` (pantallas de entrada).
- Archivo condensada (ancho 62 %, peso 900) se genera desde la fuente variable de Google y está en `app/assets/fonts/` con su licencia OFL.
- Requisitos de la contraseña: los reales son los de RNF-03 (mínimo 8 caracteres, una letra y un número; máximo 72), no el ejemplo de la pantalla.
