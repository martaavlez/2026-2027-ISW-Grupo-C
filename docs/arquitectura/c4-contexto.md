# Arquitectura · Diagrama C4 de contexto (nivel 1)

El diagrama de contexto muestra Repeat como una sola caja: quién lo usa y con qué sistemas externos se comunica. Repeat es una aplicación web adaptable, que se usa desde el navegador del ordenador o del móvil. Se comunica con MusicBrainz, de la que importa el catálogo cada día, y con un servicio de correo electrónico que envía la recuperación de contraseña y los avisos.

```mermaid
flowchart TB
  visitante["<b>Visitante</b><br/><i>[Persona]</i><br/>Busca música y consulta fichas,<br/>valoraciones y el ranking semanal"]
  usuario["<b>Usuario registrado</b><br/><i>[Persona]</i><br/>Valora, reseña, crea tableros y rankings,<br/>sigue a otros usuarios y participa<br/>en comunidades (y las administra)"]
  admin["<b>Administrador de la plataforma</b><br/><i>[Persona]</i><br/>Revisa incidencias del catálogo, modera<br/>denuncias y suspende usuarios"]

  repeat["<b>Repeat</b><br/><i>[Sistema de software]</i><br/>Plataforma social para valorar, reseñar,<br/>organizar y compartir música.<br/>Aplicación web adaptable"]

  musica["<b>MusicBrainz</b><br/><i>[Sistema externo]</i><br/>Base de datos musical pública:<br/>canciones, álbumes y artistas"]
  correo["<b>Servicio de correo electrónico</b><br/><i>[Sistema externo]</i><br/>Envía la recuperación de<br/>contraseña y los avisos"]

  visitante -- "Busca y consulta música<br/><i>[HTTPS]</i>" --> repeat
  usuario -- "Valora, reseña, organiza<br/>y participa en comunidades<br/><i>[HTTPS]</i>" --> repeat
  admin -- "Modera y gestiona el catálogo<br/><i>[HTTPS]</i>" --> repeat
  repeat -- "Importa el catálogo cada día<br/><i>[API pública · HTTPS/JSON]</i>" --> musica
  repeat -- "Pide el envío de correos<br/><i>[API/SMTP]</i>" --> correo
  correo -. "Entrega la recuperación y los avisos<br/><i>[correo electrónico]</i>" .-> usuario

  classDef person fill:#08427B,stroke:#073B6F,color:#fff
  classDef system fill:#1168BD,stroke:#0B4884,color:#fff
  classDef external fill:#8C8C8C,stroke:#6B6B6B,color:#fff
  class visitante,usuario,admin person
  class repeat system
  class musica,correo external
```

Leyenda (notación C4): azul oscuro, personas; azul, el sistema; gris, sistemas externos.
