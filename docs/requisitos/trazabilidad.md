# Matriz de trazabilidad

La matriz relaciona cada historia de usuario con los requisitos de información, las reglas de negocio y los requisitos no funcionales que salen de ella, sus pruebas de aceptación, la pantalla o flujo de Figma que la cubre y el contenedor C4 responsable. Las tres últimas tablas muestran la misma relación desde cada requisito, de modo que todo requisito sale de al menos una historia. Permite seguir un requisito hacia delante (historia → requisito → diseño → prueba) y hacia atrás (si falla una prueba, saber qué requisito incumple y qué historia está afectada).

Las pruebas de aceptación (PA) son las de cada ficha de [fichas-hu.md](fichas-hu.md). Por ejemplo, PA-18-03 es la tercera prueba de la historia HU-18.

## Historias de usuario

| HU | Historia | Prioridad | RI | RN | RNF | Pruebas de aceptación | Pantalla / flujo en Figma | Contenedor C4 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HU-01 | Registrarse | Must | RI-01, RI-02 | RN-01 | RNF-03, RNF-04, RNF-08 | PA-01-01 a 03 | A01, A02, A03 · Flujo 1 | Aplicación web, API, Base de datos |
| HU-02 | Iniciar sesión | Must | RI-01 | RN-02 | RNF-03, RNF-11 | PA-02-01 a 04 | A04, A05, A06 · Flujo 1 | Aplicación web, API, Base de datos |
| HU-17 | Cerrar sesión | Must | RI-01 | – | RNF-11 | PA-17-01 | A10 · Flujo 1 | Aplicación web, API, Base de datos |
| HU-18 | Recuperar la contraseña | Should | RI-01 | RN-03 | RNF-03, RNF-10 | PA-18-01 a 05 | A07, A08, A09, A13 · Flujo 1 | Aplicación web, API, Base de datos · servicio de correo (externo) |
| HU-19 | Eliminar mi cuenta | Should | RI-01, RI-21 | RN-04, RN-23 | RNF-04 | PA-19-01 a 02 | A11, A12 · Flujo 2 | Aplicación web, API, Base de datos |
| HU-37 | Suspender a un usuario | Should | RI-01 | RN-02 | RNF-02 | PA-37-01 a 02 | A06, W06, W11 · Flujo 3 | Aplicación web, API, Base de datos |
| HU-03 | Buscar contenido | Must | RI-01, RI-06, RI-07, RI-08, RI-13 | RN-12 | RNF-05, RNF-09, RNF-08 | PA-03-01 a 03 | M04, M05, M25, M26, M27, M28, M29 · Flujo 4 | Aplicación web, API, Base de datos |
| HU-04 | Consultar una canción o un álbum | Must | RI-07, RI-08, RI-10 | RN-07, RN-08 | RNF-02, RNF-05, RNF-09 | PA-04-01 | M06, M07, M08, W02 · Flujo 4 | Aplicación web, API, Base de datos |
| HU-59 | Consultar un artista | Must | RI-06 | – | RNF-05, RNF-09 | PA-59-01 | M06, M07, M08, W02 · Flujo 4 | Aplicación web, API, Base de datos |
| HU-20 | Importar el catálogo | Must | RI-06, RI-07, RI-08 | RN-21 | RNF-05, RNF-10 | PA-20-01 a 04 | — (sin interfaz; resultados en W03) · Flujo 5 | API (importación diaria), Base de datos · MusicBrainz (externo) |
| HU-21 | Revisar automáticamente el contenido importado | Should | RI-06, RI-07, RI-08, RI-09 | RN-22 | RNF-07 | PA-21-01 a 03 | W03 · Flujo 5 | API, Agente de IA, Base de datos |
| HU-22 | Resolver las incidencias del catálogo | Should | RI-01, RI-09 | RN-22 | RNF-02, RNF-07 | PA-22-01 a 03 | W03 · Flujo 5 | Aplicación web, API, Base de datos |
| HU-40 | Corregir contenido del catálogo | Should | RI-06, RI-07, RI-08 | – | RNF-02 | PA-40-01 | W03, W09, W10 · Flujo 5 | Aplicación web, API, Base de datos |
| HU-57 | Eliminar contenido del catálogo | Should | RI-06, RI-07, RI-08 | RN-21, RN-23 | RNF-02 | PA-57-01 a 02 | W03, W09, W10 · Flujo 5 | Aplicación web, API, Base de datos |
| HU-05 | Valorar una canción o un álbum | Must | RI-02, RI-10 | RN-05, RN-06, RN-07, RN-09 | RNF-08 | PA-05-01 a 04 | M07, M09, M10, W02 · Flujo 6 | Aplicación web, API, Base de datos |
| HU-23 | Escribir una reseña | Must | RI-02, RI-10 | RN-06, RN-07, RN-08, RN-09 | – | PA-23-01 a 04 | M11, M12, W02 · Flujo 6 | Aplicación web, API, Base de datos |
| HU-08 | Editar una reseña | Should | RI-10 | RN-07, RN-13 | – | PA-08-01 a 02 | P12, M13 · Flujo 6 | Aplicación web, API, Base de datos |
| HU-47 | Eliminar una reseña | Should | RI-10 | RN-07, RN-13 | – | PA-47-01 | P12, M13 · Flujo 6 | Aplicación web, API, Base de datos |
| HU-36 | Denunciar una reseña | Should | RI-15 | RN-18 | – | PA-36-01 a 02 | M14, M15 · Flujo 7 | Aplicación web, API, Base de datos |
| HU-13 | Revisar denuncias de reseñas | Should | RI-01, RI-10, RI-15, RI-17 | RN-07, RN-18 | RNF-02 | PA-13-01 a 03 | W04 · Flujo 7 | Aplicación web, API, Base de datos |
| HU-44 | Crear mi ranking personal de un álbum | Could | RI-02, RI-20 | RN-08, RN-09, RN-25 | – | PA-44-01 a 07 | P15, M17, M18, M19, M21 · Flujo 17 | Aplicación web, API, Base de datos |
| HU-06 | Consultar mi perfil | Must | RI-01, RI-10, RI-11, RI-12 | – | – | PA-06-01 | P01, P02, P10, P11, P12, P15, W05 · Flujo 8 | Aplicación web, API, Base de datos |
| HU-45 | Editar mi perfil | Must | RI-01 | – | – | PA-45-01 | P01, P02, P10, P11, P12, P15, W05 · Flujo 8 | Aplicación web, API, Base de datos |
| HU-24 | Consultar el perfil de otro usuario | Must | RI-01, RI-02, RI-04, RI-05 | RN-08, RN-12 | RNF-02 | PA-24-01 a 03 | P04, P06, P09, P14 · Flujo 8, Flujo 9 | Aplicación web, API, Base de datos |
| HU-43 | Configurar la privacidad de mi cuenta | Should | RI-02 | RN-08, RN-09 | RNF-02 | PA-43-01 a 03 | P03, P14, W05 · Flujo 8 | Aplicación web, API, Base de datos |
| HU-10 | Seguir a un usuario | Should | RI-03 | RN-10 | – | PA-10-01 a 02 | P04, P05, P06, P16 · Flujo 9 | Aplicación web, API, Base de datos |
| HU-48 | Dejar de seguir a un usuario | Should | RI-03 | – | – | PA-48-01 | P04, P05, P06, P16 · Flujo 9 | Aplicación web, API, Base de datos |
| HU-41 | Enviar una solicitud de amistad | Should | RI-04, RI-17 | RN-11 | – | PA-41-01 a 02 | P04, P05, P13, P17, M16 · Flujo 9, Flujo 13 | Aplicación web, API, Base de datos |
| HU-58 | Responder una solicitud de amistad | Should | RI-04, RI-17 | RN-11 | – | PA-58-01 a 02 | P04, P05, P13, P17, M16 · Flujo 9, Flujo 13 | Aplicación web, API, Base de datos |
| HU-42 | Eliminar una amistad | Should | RI-03, RI-04 | RN-11 | – | PA-42-01 a 02 | P06 · Flujo 9 | Aplicación web, API, Base de datos |
| HU-35 | Bloquear a un usuario | Should | RI-03, RI-04, RI-05 | RN-12 | – | PA-35-01 a 02 | P07, P08, P09 · Flujo 9 | Aplicación web, API, Base de datos |
| HU-56 | Desbloquear a un usuario | Should | RI-05 | – | – | PA-56-01 | P07, P08, P09 · Flujo 9 | Aplicación web, API, Base de datos |
| HU-07 | Marcar un favorito | Must | RI-11 | – | – | PA-07-01 | P10, P11, T01 · Flujo 10 | Aplicación web, API, Base de datos |
| HU-46 | Quitar un favorito | Must | RI-11 | – | – | PA-46-01 | P10, P11, T01 · Flujo 10 | Aplicación web, API, Base de datos |
| HU-09 | Crear un tablero | Should | RI-02, RI-12 | RN-09, RN-14 | – | PA-09-01 a 03 | T02, T03, T04 · Flujo 11 | Aplicación web, API, Base de datos |
| HU-25 | Añadir contenido a un tablero | Should | RI-12 | RN-14 | RNF-08 | PA-25-01 a 02 | T05, T06, T09, W08 · Flujo 11 | Aplicación web, API, Base de datos |
| HU-49 | Quitar contenido de un tablero | Should | RI-12 | – | – | PA-49-01 | T05, T06, T09, W08 · Flujo 11 | Aplicación web, API, Base de datos |
| HU-26 | Editar un tablero | Should | RI-12 | RN-13 | – | PA-26-01 a 02 | T05, T07, T08, T10, T11, W08 · Flujo 11 | Aplicación web, API, Base de datos |
| HU-50 | Eliminar un tablero | Should | RI-12 | RN-13 | – | PA-50-01 | T05, T07, T08, T10, T11, W08 · Flujo 11 | Aplicación web, API, Base de datos |
| HU-34 | Cambiar la privacidad de un tablero | Should | RI-02, RI-12 | RN-08, RN-15 | RNF-02 | PA-34-01 a 03 | T07, W08 · Flujo 11 | Aplicación web, API, Base de datos |
| HU-27 | Seguir un tablero público | Could | RI-12, RI-17 | RN-15 | – | PA-27-01 a 02 | T02, T08, C14 · Flujo 11 | Aplicación web, API, Base de datos |
| HU-11 | Recibir notificaciones por correo | Should | RI-17 | – | RNF-10 | PA-11-01 a 02 | M16, C14 · Flujo 13 | API, Base de datos · servicio de correo (externo) |
| HU-12 | Ver recomendaciones personalizadas | Could | RI-10, RI-11, RI-18 | RN-20 | – | PA-12-01 a 03 | M01, M02, M22, M23, W01 · Flujo 12 | Aplicación web, API, Base de datos |
| HU-15 | Consultar el ranking semanal | Could | RI-10, RI-19 | RN-19 | – | PA-15-01 a 05 | M01, M02, M03, M22, M23, M24, W01 · Flujo 12 | Aplicación web, API, Base de datos |
| HU-28 | Consultar la actividad de mis seguidos y amigos | Could | RI-03, RI-04, RI-16 | RN-08 | – | PA-28-01 a 03 | M01, M20, M22, M23, W01 · Flujo 12 | Aplicación web, API, Base de datos |
| HU-14 | Crear una comunidad | Could | RI-13, RI-21 | RN-04, RN-16 | – | PA-14-01 a 02 | C01, C02, C03 · Flujo 14 | Aplicación web, API, Base de datos |
| HU-29 | Editar una comunidad | Could | RI-13 | RN-13, RN-16 | RNF-02 | PA-29-01 a 02 | C12, C15, W07 · Flujo 14 | Aplicación web, API, Base de datos |
| HU-51 | Eliminar una comunidad | Could | RI-13, RI-14, RI-17 | RN-13, RN-23 | RNF-02 | PA-51-01 | C12, C15, W07 · Flujo 14 | Aplicación web, API, Base de datos |
| HU-30 | Unirse a una comunidad pública | Could | RI-13, RI-21 | RN-17 | – | PA-30-01 | C01, C04, C05, C16, C19, C20 · Flujo 15 | Aplicación web, API, Base de datos |
| HU-52 | Solicitar acceso a una comunidad privada | Could | RI-13, RI-21 | RN-17 | – | PA-52-01 | C01, C04, C05, C16, C19, C20 · Flujo 15 | Aplicación web, API, Base de datos |
| HU-53 | Abandonar una comunidad | Could | RI-21 | RN-04, RN-24 | – | PA-53-01 a 03 | C01, C04, C05, C16, C19, C20 · Flujo 15 | Aplicación web, API, Base de datos |
| HU-31 | Invitar a una comunidad | Could | RI-13, RI-17 | RN-17 | – | PA-31-01 | M16, C10, C17 · Flujo 13, Flujo 15 | Aplicación web, API, Base de datos |
| HU-54 | Responder solicitudes de acceso | Could | RI-13, RI-17, RI-21 | RN-17 | – | PA-54-01 a 02 | M16, C10, C17 · Flujo 13, Flujo 15 | Aplicación web, API, Base de datos |
| HU-32 | Expulsar a un miembro | Could | RI-13, RI-17, RI-21 | RN-17, RN-24 | RNF-02 | PA-32-01 a 04 | C09, C10, C13, C14, W07 · Flujo 14, Flujo 15 | Aplicación web, API, Base de datos |
| HU-55 | Nombrar administrador de una comunidad | Could | RI-21 | RN-24 | RNF-02 | PA-55-01 | C09, C10, C13, C14, W07 · Flujo 14, Flujo 15 | Aplicación web, API, Base de datos |
| HU-33 | Publicar en una comunidad | Could | RI-14 | RN-17 | – | PA-33-01 a 03 | C05, C06, C07, C18, C21, W07 · Flujo 16 | Aplicación web, API, Base de datos |
| HU-38 | Denunciar una publicación | Could | RI-15, RI-17 | RN-18 | – | PA-38-01 a 02 | C08 · Flujo 16 | Aplicación web, API, Base de datos |
| HU-39 | Moderar las publicaciones de una comunidad | Could | RI-14, RI-15, RI-17 | RN-18 | RNF-02 | PA-39-01 a 03 | C11, C12, C14 · Flujo 16 | Aplicación web, API, Base de datos |

## Requisitos de información

| RI | Historias de las que sale |
| --- | --- |
| RI-01 · Usuario | HU-01, HU-02, HU-03, HU-06, HU-13, HU-17, HU-18, HU-19, HU-22, HU-24, HU-37, HU-45 |
| RI-02 · Configuración de privacidad | HU-01, HU-05, HU-09, HU-23, HU-24, HU-34, HU-43, HU-44 |
| RI-03 · Seguimiento | HU-10, HU-28, HU-35, HU-42, HU-48 |
| RI-04 · Amistad | HU-24, HU-28, HU-35, HU-41, HU-42, HU-58 |
| RI-05 · Bloqueo | HU-24, HU-35, HU-56 |
| RI-06 · Artista | HU-03, HU-20, HU-21, HU-40, HU-57, HU-59 |
| RI-07 · Álbum | HU-03, HU-04, HU-20, HU-21, HU-40, HU-57 |
| RI-08 · Canción | HU-03, HU-04, HU-20, HU-21, HU-40, HU-57 |
| RI-09 · Incidencia del catálogo | HU-21, HU-22 |
| RI-10 · Reseña | HU-04, HU-05, HU-06, HU-08, HU-12, HU-13, HU-15, HU-23, HU-47 |
| RI-11 · Favorito | HU-06, HU-07, HU-12, HU-46 |
| RI-12 · Tablero | HU-06, HU-09, HU-25, HU-26, HU-27, HU-34, HU-49, HU-50 |
| RI-13 · Comunidad | HU-03, HU-14, HU-29, HU-30, HU-31, HU-32, HU-51, HU-52, HU-54 |
| RI-14 · Publicación en comunidad | HU-33, HU-39, HU-51 |
| RI-15 · Denuncia | HU-13, HU-36, HU-38, HU-39 |
| RI-16 · Actividad | HU-28 |
| RI-17 · Notificación | HU-11, HU-13, HU-27, HU-31, HU-32, HU-38, HU-39, HU-41, HU-51, HU-54, HU-58 |
| RI-18 · Recomendación | HU-12 |
| RI-19 · Ranking semanal | HU-15 |
| RI-20 · Ranking personal de un álbum | HU-44 |
| RI-21 · Membresía en una comunidad | HU-14, HU-19, HU-30, HU-32, HU-52, HU-53, HU-54, HU-55 |

## Reglas de negocio

| RN | Tipo | Historias de las que sale |
| --- | --- | --- |
| RN-01 | Unicidad | HU-01 |
| RN-02 | Condición de acceso | HU-02, HU-37 |
| RN-03 | Restricción temporal | HU-18 |
| RN-04 | Límite mínimo | HU-14, HU-19, HU-53 |
| RN-05 | Límite | HU-05 |
| RN-06 | Rango | HU-05, HU-23 |
| RN-07 | Cálculo | HU-04, HU-05, HU-08, HU-13, HU-23, HU-47 |
| RN-08 | Visibilidad | HU-04, HU-23, HU-24, HU-28, HU-34, HU-43, HU-44 |
| RN-09 | Valor por defecto | HU-05, HU-09, HU-23, HU-43, HU-44 |
| RN-10 | Condición de acceso | HU-10 |
| RN-11 | Límite | HU-41, HU-42, HU-58 |
| RN-12 | Consecuencia | HU-03, HU-24, HU-35 |
| RN-13 | Autorización | HU-08, HU-26, HU-29, HU-47, HU-50, HU-51 |
| RN-14 | Obligatoriedad y unicidad | HU-09, HU-25 |
| RN-15 | Condición de elegibilidad | HU-27, HU-34 |
| RN-16 | Unicidad | HU-14, HU-29 |
| RN-17 | Condición de elegibilidad | HU-30, HU-31, HU-32, HU-33, HU-52, HU-54 |
| RN-18 | Límite y autorización | HU-13, HU-36, HU-38, HU-39 |
| RN-19 | Límite y cálculo | HU-15 |
| RN-20 | Cálculo | HU-12 |
| RN-21 | Unicidad | HU-20, HU-57 |
| RN-22 | Autorización | HU-21, HU-22 |
| RN-23 | Consecuencia | HU-19, HU-51, HU-57 |
| RN-24 | Autorización | HU-32, HU-53, HU-55 |
| RN-25 | Límite y unicidad | HU-44 |

## Requisitos no funcionales

| RNF | Historias relacionadas | Contenedor C4 | ADR |
| --- | --- | --- | --- |
| RNF-01 · Portabilidad | Todas | Aplicación web | ADR-0004 |
| RNF-02 · Seguridad · control de acceso | HU-04, HU-13, HU-22, HU-24, HU-29, HU-32, HU-34, HU-37, HU-39, HU-40, HU-43, HU-51, HU-55, HU-57 | API | ADR-0001, ADR-0004 |
| RNF-03 · Seguridad · credenciales | HU-01, HU-02, HU-18 | API, Base de datos | – |
| RNF-04 · Seguridad · protección de datos | HU-01, HU-19 | API, Base de datos | – |
| RNF-05 · Fiabilidad · disponibilidad | HU-03, HU-04, HU-20, HU-59 | API, Base de datos | ADR-0002 |
| RNF-06 · Fiabilidad · persistencia | Todas | Base de datos | ADR-0002 |
| RNF-07 · Fiabilidad · supervisión de la IA | HU-21, HU-22 | Agente de IA, Base de datos | ADR-0003 |
| RNF-08 · Usabilidad | HU-01, HU-03, HU-05, HU-25 | Aplicación web | – |
| RNF-09 · Rendimiento | HU-03, HU-04, HU-59 | API, Base de datos | – |
| RNF-10 · Compatibilidad | HU-11, HU-18, HU-20 | API | ADR-0002 |
| RNF-11 · Seguridad · sesión | HU-02, HU-17 | Aplicación web, API | ADR-0004 |

Los códigos de pantalla corresponden al prototipo de Figma, descrito en `docs/diseno/figma.md`; los flujos son los 17 flujos de usuario del tablero de FigJam del equipo.
