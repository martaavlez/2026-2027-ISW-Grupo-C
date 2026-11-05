# Arquitectura · Diagrama C4 de contexto (nivel 1)

El diagrama de contexto muestra **Repeat** como una sola caja: quién lo usa y con qué sistemas externos se comunica. No entra en cómo está construido por dentro; eso se ve en el [diagrama de contenedores](c4-contenedores.md).

```mermaid
flowchart TB
  visitante["<b>Visitante</b><br/><i>[Persona]</i><br/>Busca música y consulta fichas,<br/>valoraciones y el ranking semanal"]
  usuario["<b>Usuario registrado</b><br/><i>[Persona]</i><br/>Valora, reseña, crea tableros y rankings,<br/>sigue a otros usuarios y participa<br/>en comunidades (y las administra)"]
  admin["<b>Administrador de la plataforma</b><br/><i>[Persona]</i><br/>Revisa incidencias del catálogo, modera<br/>denuncias y suspende usuarios"]

  repeat["<b>Repeat</b><br/><i>[Sistema de software]</i><br/>Plataforma social para valorar, reseñar,<br/>organizar y compartir música.<br/>Aplicación móvil y web"]

  musica["<b>Base de datos musical externa</b><br/><i>[Sistema externo]</i><br/>Fuente pública del catálogo:<br/>canciones, álbumes y artistas"]
  correo["<b>Servicio de correo electrónico</b><br/><i>[Sistema externo]</i><br/>Envía el enlace de<br/>recuperación de contraseña"]

  visitante -- "Busca y consulta música<br/><i>[HTTPS]</i>" --> repeat
  usuario -- "Valora, reseña, organiza<br/>y participa en comunidades<br/><i>[HTTPS]</i>" --> repeat
  admin -- "Modera y gestiona el catálogo<br/><i>[HTTPS]</i>" --> repeat
  repeat -- "Importa el catálogo periódicamente<br/><i>[API pública · HTTPS/JSON]</i>" --> musica
  repeat -- "Pide el envío de correos<br/><i>[API/SMTP]</i>" --> correo
  correo -. "Entrega el enlace de recuperación<br/><i>[correo electrónico]</i>" .-> usuario

  classDef person fill:#08427B,stroke:#073B6F,color:#fff
  classDef system fill:#1168BD,stroke:#0B4884,color:#fff
  classDef external fill:#8C8C8C,stroke:#6B6B6B,color:#fff
  class visitante,usuario,admin person
  class repeat system
  class musica,correo external
```

Leyenda (notación C4): azul oscuro, personas; azul, nuestro sistema; gris, sistemas externos.

## Elementos

| Elemento | Tipo | Descripción | Historias relacionadas |
| --- | --- | --- | --- |
| **Visitante** | Persona | Usa la aplicación sin cuenta. Puede buscar y consultar fichas, valoraciones y el ranking semanal, pero no puede valorar, reseñar ni guardar nada. | HU-03, HU-04, HU-15, HU-01, HU-02 |
| **Usuario registrado** | Persona | Usuario con cuenta. Valora y reseña, marca favoritos, crea tableros y rankings personales, sigue a otros usuarios, envía solicitudes de amistad y participa en comunidades. Si crea una comunidad o le nombran administrador, la gestiona (miembros, accesos y moderación de publicaciones); es el mismo actor con un rol dentro de esa comunidad. | HU-05 a HU-12, HU-14, HU-17 a HU-19, HU-23 a HU-36, HU-38, HU-39, HU-41 a HU-44 |
| **Administrador de la plataforma** | Persona | Gestiona la plataforma desde la versión web: revisa las incidencias que detecta el agente de IA, corrige o elimina contenido del catálogo, resuelve las denuncias de reseñas y suspende usuarios. | HU-13, HU-21, HU-22, HU-37, HU-40 |
| **Repeat** | Sistema (el nuestro) | La plataforma completa: aplicación móvil, aplicación web y todo lo que hay detrás. | Todas |
| **Base de datos musical externa** | Sistema externo | Fuente pública de la que se importan canciones, álbumes y artistas. Repeat no la consulta en cada búsqueda: copia el catálogo a su propia base de datos (ver ADR-0002), de modo que la aplicación sigue funcionando aunque la fuente no responda (RNF-05). | HU-20, HU-21 |
| **Servicio de correo electrónico** | Sistema externo | Servicio que envía los correos de la plataforma. En este sprint se usa para el enlace de recuperación de contraseña. Los avisos dentro de la aplicación (seguidores, solicitudes, invitaciones) no usan el correo. | HU-18 (RNF-10) |

## Relaciones

| Origen → destino | Qué se intercambia |
| --- | --- |
| Visitante → Repeat | Búsquedas y consultas de fichas y del ranking semanal. |
| Usuario registrado → Repeat | Valoraciones, reseñas, favoritos, tableros, rankings, relaciones sociales y publicaciones en comunidades. |
| Administrador → Repeat | Decisiones de moderación y cambios en el catálogo. |
| Repeat → Base de datos musical externa | Importación periódica del catálogo a través de su API pública; si la fuente falla, se reintenta cada hora (RNF-05). |
| Repeat → Servicio de correo | Petición de envío del correo de recuperación de contraseña. |
| Servicio de correo → Usuario | Entrega del enlace de recuperación, válido 24 horas (RN-03). |
