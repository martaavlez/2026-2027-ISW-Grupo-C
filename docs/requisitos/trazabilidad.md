# Matriz de trazabilidad

La matriz relaciona cada historia de usuario con los requisitos que contiene, sus pruebas de aceptación, la pantalla o flujo de Figma que la cubre y el contenedor C4 responsable. Permite seguir un requisito hacia delante (historia → requisito → diseño → prueba) y hacia atrás (si falla una prueba, saber qué requisito incumple y qué historia está afectada).

Las pruebas de aceptación (PA) son los escenarios Gherkin de cada ficha. Por ejemplo, PA-18-03 es el tercer escenario de la historia HU-18.

> **Estado:** la matriz está completa. Los códigos de pantalla y los flujos remiten al prototipo de Figma ([figma.md](../diseno/figma.md)) y los contenedores, al [diagrama de contenedores](../arquitectura/c4-contenedores.md).

| HU | Historia | Prioridad | RI | RN | RNF | Pruebas de aceptación | Pantalla / flujo en Figma | Contenedor C4 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [HU-01](fichas-hu.md#hu-01--registrarse) | Registrarse | Must | RI-01, RI-02 | RN-01 | RNF-03, RNF-04 | PA-01-01 a 03 | A01, A02, A03 · Flujo 1 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-02](fichas-hu.md#hu-02--iniciar-sesión) | Iniciar sesión | Must | RI-01 | RN-02 | RNF-03 | PA-02-01 a 03 | A04, A05, A06 · Flujo 1 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-17](fichas-hu.md#hu-17--cerrar-sesión) | Cerrar sesión | Must | RI-01 | – | – | PA-17-01 | A10 · Flujo 1 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-18](fichas-hu.md#hu-18--recuperar-la-contraseña) | Recuperar la contraseña | Should | RI-01 | RN-03 | RNF-03, RNF-10 | PA-18-01 a 05 | A07, A08, A09, A13 · Flujo 1 | Aplicación móvil, Aplicación web, API, Base de datos · servicio de correo (externo) |
| [HU-19](fichas-hu.md#hu-19--eliminar-mi-cuenta) | Eliminar mi cuenta | Should | RI-01, RI-13 | RN-04, RN-23 | RNF-04 | PA-19-01 a 02 | A11, A12 · Flujo 2 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-37](fichas-hu.md#hu-37--suspender-a-un-usuario) | Suspender a un usuario | Should | RI-01 | RN-02 | RNF-02 | PA-37-01 a 02 | A06, W06, W11 · Flujo 3 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-03](fichas-hu.md#hu-03--buscar-contenido) | Buscar contenido | Must | RI-01, RI-06, RI-07, RI-08, RI-13 | RN-12 | RNF-05, RNF-09 | PA-03-01 a 03 | M04, M05, M25, M26, M27, M28, M29 · Flujo 4 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-04](fichas-hu.md#hu-04--consultar-una-canción-álbum-o-artista) | Consultar una canción, álbum o artista | Must | RI-06, RI-07, RI-08, RI-10 | RN-07, RN-08 | RNF-02, RNF-05 | PA-04-01 a 02 | M06, M07, M08, W02 · Flujo 4 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-20](fichas-hu.md#hu-20--importar-el-catálogo) | Importar el catálogo | Must | RI-06, RI-07, RI-08 | RN-21 | RNF-05, RNF-06, RNF-10 | PA-20-01 a 03 | — (sin interfaz; resultados en W03) · Flujo 5 | API (tarea programada de importación), Base de datos · base de datos musical externa |
| [HU-21](fichas-hu.md#hu-21--revisar-automáticamente-el-contenido-importado) | Revisar automáticamente el contenido importado | Should | RI-06, RI-07, RI-08, RI-09 | RN-22 | RNF-07 | PA-21-01 a 02 | W03 · Flujo 5 | API, Agente de IA, Base de datos |
| [HU-22](fichas-hu.md#hu-22--resolver-las-incidencias-del-catálogo) | Resolver las incidencias del catálogo | Should | RI-09 | RN-22 | RNF-02, RNF-07 | PA-22-01 a 03 | W03 · Flujo 5 | Aplicación web, API, Base de datos |
| [HU-40](fichas-hu.md#hu-40--corregir-o-eliminar-contenido-del-catálogo) | Corregir o eliminar contenido del catálogo | Should | RI-06, RI-07, RI-08 | RN-21, RN-23 | RNF-02 | PA-40-01 a 03 | W03, W09, W10 · Flujo 5 | Aplicación web, API, Base de datos |
| [HU-05](fichas-hu.md#hu-05--valorar-una-canción-o-un-álbum) | Valorar una canción o un álbum | Must | RI-02, RI-10 | RN-05, RN-06, RN-07, RN-09 | – | PA-05-01 a 04 | M07, M09, M10, W02 · Flujo 6 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-23](fichas-hu.md#hu-23--escribir-una-reseña) | Escribir una reseña | Must | RI-02, RI-10 | RN-06, RN-07, RN-08, RN-09 | – | PA-23-01 a 04 | M11, M12, W02 · Flujo 6 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-08](fichas-hu.md#hu-08--editar-y-eliminar-mis-reseñas) | Editar y eliminar mis reseñas | Should | RI-10 | RN-07, RN-13 | – | PA-08-01 a 03 | P12, M13 · Flujo 6 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-36](fichas-hu.md#hu-36--denunciar-una-reseña) | Denunciar una reseña | Should | RI-15 | RN-18 | – | PA-36-01 a 02 | M14, M15 · Flujo 7 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-13](fichas-hu.md#hu-13--revisar-denuncias-de-reseñas) | Revisar denuncias de reseñas | Should | RI-10, RI-15, RI-17 | RN-07, RN-18 | RNF-02 | PA-13-01 a 03 | W04 · Flujo 7 | Aplicación web, API, Base de datos |
| [HU-44](fichas-hu.md#hu-44--crear-mi-ranking-personal-de-un-álbum) | Crear mi ranking personal de un álbum | Could | RI-02, RI-20 | RN-08, RN-09, RN-25 | – | PA-44-01 a 07 | P15, M17, M18, M19, M21 · Flujo 17 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-06](fichas-hu.md#hu-06--gestionar-mi-perfil) | Gestionar mi perfil | Must | RI-01, RI-10, RI-11, RI-12 | – | – | PA-06-01 a 02 | P01, P02, P10, P11, P12, P15, W05 · Flujo 8 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-24](fichas-hu.md#hu-24--consultar-el-perfil-de-otro-usuario) | Consultar el perfil de otro usuario | Must | RI-01, RI-02, RI-04, RI-05 | RN-08, RN-12 | RNF-02 | PA-24-01 a 03 | P04, P06, P09, P14 · Flujo 8, Flujo 9 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-43](fichas-hu.md#hu-43--configurar-la-privacidad-de-mi-cuenta) | Configurar la privacidad de mi cuenta | Should | RI-02 | RN-08, RN-09 | RNF-02 | PA-43-01 a 03 | P03, P14, W05 · Flujo 8 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-10](fichas-hu.md#hu-10--seguir-y-dejar-de-seguir-a-otros-usuarios) | Seguir y dejar de seguir a otros usuarios | Should | RI-03 | RN-10 | – | PA-10-01 a 03 | P04, P05, P06, P16 · Flujo 9 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-41](fichas-hu.md#hu-41--enviar-y-responder-solicitudes-de-amistad) | Enviar y responder solicitudes de amistad | Should | RI-04, RI-17 | RN-11 | – | PA-41-01 a 04 | P04, P05, P13, P17, M16 · Flujo 9, Flujo 13 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-42](fichas-hu.md#hu-42--eliminar-una-amistad) | Eliminar una amistad | Should | RI-03, RI-04 | RN-11 | – | PA-42-01 a 02 | P06 · Flujo 9 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-35](fichas-hu.md#hu-35--bloquear-y-desbloquear-usuarios) | Bloquear y desbloquear usuarios | Should | RI-03, RI-04, RI-05 | RN-12 | – | PA-35-01 a 03 | P07, P08, P09 · Flujo 9 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-07](fichas-hu.md#hu-07--marcar-y-desmarcar-favoritos) | Marcar y desmarcar favoritos | Must | RI-11 | – | – | PA-07-01 a 02 | P10, P11, T01 · Flujo 10 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-09](fichas-hu.md#hu-09--crear-un-tablero) | Crear un tablero | Should | RI-02, RI-12 | RN-09, RN-14 | – | PA-09-01 a 03 | T02, T03, T04 · Flujo 11 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-25](fichas-hu.md#hu-25--añadir-y-quitar-contenido-de-un-tablero) | Añadir y quitar contenido de un tablero | Should | RI-12 | RN-14 | – | PA-25-01 a 03 | T05, T06, T09, W08 · Flujo 11 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-26](fichas-hu.md#hu-26--editar-y-eliminar-un-tablero) | Editar y eliminar un tablero | Should | RI-12 | RN-13 | – | PA-26-01 a 03 | T05, T07, T08, T10, T11, W08 · Flujo 11 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-34](fichas-hu.md#hu-34--cambiar-la-privacidad-de-un-tablero) | Cambiar la privacidad de un tablero | Should | RI-02, RI-12 | RN-08, RN-15 | RNF-02 | PA-34-01 a 03 | T07, W08 · Flujo 11 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-27](fichas-hu.md#hu-27--seguir-un-tablero-público) | Seguir un tablero público | Could | RI-12, RI-17 | RN-15 | – | PA-27-01 a 02 | T02, T08, C14 · Flujo 11 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-11](fichas-hu.md#hu-11--recibir-notificaciones) | Recibir notificaciones | Should | RI-17 | – | – | PA-11-01 a 03 | M16, C14 · Flujo 13 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-12](fichas-hu.md#hu-12--ver-recomendaciones-personalizadas) | Ver recomendaciones personalizadas | Could | RI-10, RI-11, RI-18 | RN-20 | – | PA-12-01 a 03 | M01, M02, M22, M23, W01 · Flujo 12 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-15](fichas-hu.md#hu-15--consultar-el-ranking-semanal) | Consultar el ranking semanal | Could | RI-10, RI-19 | RN-19 | – | PA-15-01 a 05 | M01, M02, M03, M22, M23, M24, W01 · Flujo 12 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-28](fichas-hu.md#hu-28--consultar-la-actividad-de-mis-seguidos-y-amigos) | Consultar la actividad de mis seguidos y amigos | Could | RI-03, RI-04, RI-16 | RN-08 | – | PA-28-01 a 03 | M01, M20, M22, M23, W01 · Flujo 12 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-14](fichas-hu.md#hu-14--crear-una-comunidad) | Crear una comunidad | Could | RI-13 | RN-04, RN-16 | – | PA-14-01 a 02 | C01, C02, C03 · Flujo 14 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-29](fichas-hu.md#hu-29--editar-y-eliminar-una-comunidad) | Editar y eliminar una comunidad | Could | RI-13, RI-14, RI-17 | RN-13, RN-23 | RNF-02 | PA-29-01 a 03 | C12, C15, W07 · Flujo 14 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-30](fichas-hu.md#hu-30--unirse-y-abandonar-una-comunidad) | Unirse y abandonar una comunidad | Could | RI-13 | RN-17 | – | PA-30-01 a 03 | C01, C04, C05, C16, C19, C20 · Flujo 15 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-31](fichas-hu.md#hu-31--gestionar-invitaciones-y-solicitudes) | Gestionar invitaciones y solicitudes | Could | RI-13, RI-17 | RN-17 | – | PA-31-01 a 03 | M16, C10, C17 · Flujo 13, Flujo 15 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-32](fichas-hu.md#hu-32--gestionar-miembros-y-administradores) | Gestionar miembros y administradores | Could | RI-13, RI-17 | RN-04, RN-17, RN-24 | RNF-02 | PA-32-01 a 07 | C09, C10, C13, C14, W07 · Flujo 14, Flujo 15 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-33](fichas-hu.md#hu-33--publicar-en-una-comunidad) | Publicar en una comunidad | Could | RI-14 | RN-17 | – | PA-33-01 a 03 | C05, C06, C07, C18, C21, W07 · Flujo 16 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-38](fichas-hu.md#hu-38--denunciar-una-publicación) | Denunciar una publicación | Could | RI-15, RI-17 | RN-18 | – | PA-38-01 a 02 | C08 · Flujo 16 | Aplicación móvil, Aplicación web, API, Base de datos |
| [HU-39](fichas-hu.md#hu-39--moderar-las-publicaciones-de-una-comunidad) | Moderar las publicaciones de una comunidad | Could | RI-14, RI-15, RI-17 | RN-18 | RNF-02 | PA-39-01 a 03 | C11, C12, C14 · Flujo 16 | Aplicación móvil, Aplicación web, API, Base de datos |

## Requisitos no funcionales

| RNF | Historias relacionadas | Contenedor C4 | ADR |
| --- | --- | --- | --- |
| RNF-01 · Portabilidad | Todas | Aplicación móvil, Aplicación web | ADR-0001 |
| RNF-02 · Seguridad · control de acceso | HU-04, HU-13, HU-22, HU-24, HU-29, HU-34, HU-37, HU-39, HU-40, HU-43 | API | ADR-0001 |
| RNF-03 · Seguridad · credenciales | HU-01, HU-02, HU-18 | API, Base de datos | – |
| RNF-04 · Seguridad · protección de datos | HU-01, HU-19 | API, Base de datos | – |
| RNF-05 · Fiabilidad · disponibilidad | HU-03, HU-04, HU-20 | API, Base de datos | ADR-0002 |
| RNF-06 · Fiabilidad · persistencia | Todas | Base de datos | ADR-0002 |
| RNF-07 · Fiabilidad · supervisión de la IA | HU-21, HU-22 | Agente de IA, Base de datos | ADR-0003 |
| RNF-08 · Usabilidad | HU-01, HU-03, HU-05, HU-25 | Aplicación móvil, Aplicación web | – |
| RNF-09 · Rendimiento | HU-03, HU-04 | API, Base de datos | – |
| RNF-10 · Compatibilidad | HU-18, HU-20 | API | ADR-0002 |
