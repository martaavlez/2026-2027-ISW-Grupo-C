# Requisitos de información (RI)

Los requisitos de información describen los datos que el sistema debe almacenar y gestionar a lo largo del tiempo: las entidades del dominio, sus atributos con su tipo y restricciones, y las relaciones entre ellas. Siguen el formato del Tema 3: descripción, atributos y relaciones. Además, para cada entidad se indica quién puede crearla, modificarla o eliminarla.

**Tipos de datos utilizados:** Identificador (único, generado por el sistema) · Texto (con longitud máxima) · Número entero · Número decimal · Fecha y hora · Sí/No · Enumerado (lista cerrada de valores) · Imagen (archivo o enlace) · Referencia (enlace a otra entidad).

> Las longitudes máximas y otros valores numéricos de las restricciones son propuestas del equipo y pueden ajustarse durante el desarrollo.

## Resumen de entidades y relaciones

| Entidad | Se relaciona con | Cardinalidad |
| --- | --- | --- |
| Usuario | Configuración de privacidad | 1 a 1 |
| Usuario | Reseña, Favorito, Tablero | 1 a muchos |
| Usuario | Usuario (seguimiento, amistad, bloqueo) | muchos a muchos |
| Usuario | Comunidad (como miembro o administrador) | muchos a muchos |
| Artista | Álbum | 1 a muchos |
| Álbum | Canción | 1 a muchos |
| Canción | Artista | muchos a muchos |
| Canción / Álbum | Reseña | 1 a muchos |
| Usuario | Ranking personal (de un álbum) | 1 a muchos |
| Tablero | Canción / Álbum | muchos a muchos |
| Comunidad | Publicación | 1 a muchos |
| Reseña / Publicación | Denuncia | 1 a muchos |

---

## RI-01 · Usuario

**Descripción:** persona registrada en la plataforma que puede interactuar con el contenido y con otros usuarios. Quien accede sin cuenta es un visitante, y el sistema no guarda información sobre él.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Identificador | Identificador | Único |
| Nombre | Texto (máx. 50) | Obligatorio |
| Nombre de usuario | Texto (3–30) | Obligatorio, único, solo letras, números, puntos y guiones bajos |
| Correo electrónico | Texto (máx. 100) | Obligatorio, único, formato de correo válido |
| Contraseña | Texto | Obligatoria, mínimo 8 caracteres con al menos una letra y un número; se guarda cifrada |
| Foto de perfil | Imagen | Opcional |
| Biografía | Texto (máx. 300) | Opcional |
| Rol de plataforma | Enumerado: usuario, administrador | Obligatorio; por defecto, usuario |
| Estado | Enumerado: activo, suspendido | Obligatorio; por defecto, activo |
| Motivo de suspensión | Texto (máx. 300) | Obligatorio si el estado es suspendido |
| Fecha de registro | Fecha y hora | Obligatoria, la asigna el sistema |

**Relaciones:**
- Tiene una configuración de privacidad (RI-02) · 1 a 1.
- Escribe reseñas (RI-10), marca favoritos (RI-11) y crea tableros (RI-12) · 1 a muchos.
- Sigue, es amigo de y bloquea a otros usuarios (RI-03, RI-04, RI-05) · muchos a muchos.
- Es miembro o administrador de comunidades (RI-13) · muchos a muchos.

**Gestión:** lo crea el propio usuario al registrarse. Puede modificar sus datos y eliminar su cuenta. El administrador de la plataforma puede suspenderlo.

**Observaciones:** el perfil se organiza en tres pestañas: Favoritos (dividida en canciones, álbumes y artistas), Reseñas y Tableros. El nombre, la foto y la biografía son siempre visibles; el contenido de cada pestaña se muestra según su nivel de privacidad.

---

## RI-02 · Configuración de privacidad

**Descripción:** preferencias con las que cada usuario decide quién puede ver su contenido. Se gestiona desde la configuración del perfil y se aplica en todo el sistema.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Usuario | Referencia a Usuario | Obligatoria, única (una configuración por usuario) |
| Nivel por defecto de reseñas y tableros | Enumerado: público, solo amigos, privado | Obligatorio; por defecto, público |
| Visibilidad de favoritos | Enumerado: público, solo amigos, privado | Obligatoria; por defecto, público |

**Relaciones:** pertenece a un usuario (RI-01) · 1 a 1.

**Gestión:** se crea automáticamente al registrarse. Solo el propio usuario puede modificarla.

**Observaciones:** los tres niveles de privacidad son comunes a reseñas, tableros y favoritos. **Público:** lo ve cualquier persona, incluidos visitantes y seguidores. **Solo amigos:** lo ven únicamente los usuarios con amistad aceptada. **Privado:** solo lo ve su propietario.

---

## RI-03 · Seguimiento

**Descripción:** relación por la que un usuario sigue a otro para estar al tanto de su actividad pública. No requiere aprobación y no es recíproca.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Seguidor | Referencia a Usuario | Obligatoria |
| Seguido | Referencia a Usuario | Obligatoria; distinto del seguidor |
| Fecha | Fecha y hora | Obligatoria, la asigna el sistema |

La pareja seguidor–seguido es única.

**Relaciones:** relaciona dos usuarios (RI-01) · muchos a muchos.

**Gestión:** la crea y la elimina el seguidor.

---

## RI-04 · Amistad

**Descripción:** relación recíproca entre dos usuarios que se establece cuando uno envía una solicitud de amistad y el otro la acepta. Es independiente del seguimiento.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Solicitante | Referencia a Usuario | Obligatoria |
| Destinatario | Referencia a Usuario | Obligatoria; distinto del solicitante |
| Estado | Enumerado: pendiente, aceptada, rechazada, cancelada | Obligatorio; por defecto, pendiente |
| Fecha de solicitud | Fecha y hora | Obligatoria, la asigna el sistema |
| Fecha de respuesta | Fecha y hora | Obligatoria si el estado es aceptada, rechazada o cancelada |

**Relaciones:** relaciona dos usuarios (RI-01) · muchos a muchos.

**Gestión:** la solicitud la crea cualquier usuario registrado, que puede cancelarla mientras esté pendiente; la acepta o la rechaza el destinatario. Cualquiera de los dos puede eliminar la amistad después.

---

## RI-05 · Bloqueo

**Descripción:** restricción que un usuario aplica a otro para que no pueda seguirle, enviarle solicitudes de amistad, ver su perfil ni interactuar con su contenido.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Usuario que bloquea | Referencia a Usuario | Obligatoria |
| Usuario bloqueado | Referencia a Usuario | Obligatoria; distinto del que bloquea |
| Fecha | Fecha y hora | Obligatoria, la asigna el sistema |

La pareja de usuarios es única.

**Relaciones:** relaciona dos usuarios (RI-01) · muchos a muchos.

**Gestión:** lo crea y lo elimina el usuario que bloquea.

---

## RI-06 · Artista

**Descripción:** músico o grupo musical autor de canciones y álbumes.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Identificador | Identificador | Único |
| Nombre | Texto (máx. 150) | Obligatorio |
| Imagen | Imagen | Opcional |
| Género musical | Texto (máx. 50) | Opcional |
| Descripción | Texto (máx. 1.000) | Opcional |
| Identificador externo | Texto | Obligatorio, único (identificador en la fuente externa) |
| Excluido de la importación | Sí/No | Obligatorio; por defecto, no |

**Relaciones:** tiene álbumes (RI-07) · 1 a muchos. Participa en canciones (RI-08) · muchos a muchos.

**Gestión:** se importa de la base de datos musical externa. El agente de IA lo revisa y el administrador de la plataforma puede corregirlo o eliminarlo. Los usuarios solo pueden consultarlo.

---

## RI-07 · Álbum

**Descripción:** conjunto de canciones publicadas juntas por un artista.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Identificador | Identificador | Único |
| Título | Texto (máx. 200) | Obligatorio |
| Artista | Referencia a Artista | Obligatoria |
| Portada | Imagen | Opcional |
| Género | Texto (máx. 50) | Opcional |
| Tipo | Enumerado: álbum, EP, single | Obligatorio |
| Año de publicación | Número entero | Opcional; no puede ser posterior al año actual |
| Valoración media | Número decimal (1,0–5,0) | Calculada por el sistema; vacía si no tiene valoraciones |
| Identificador externo | Texto | Obligatorio, único |
| Excluido de la importación | Sí/No | Obligatorio; por defecto, no |

**Relaciones:** pertenece a un artista (RI-06) · muchos a 1. Contiene canciones (RI-08) · 1 a muchos. Recibe reseñas (RI-10) · 1 a muchos.

**Gestión:** igual que el artista: se importa, lo revisa el agente de IA y el administrador puede corregirlo o eliminarlo.

---

## RI-08 · Canción

**Descripción:** pieza musical individual que pertenece a un álbum y a uno o varios artistas.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Identificador | Identificador | Único |
| Título | Texto (máx. 200) | Obligatorio |
| Álbum | Referencia a Álbum | Obligatoria |
| Duración | Número entero (segundos) | Obligatoria; mayor que 0 |
| Género | Texto (máx. 50) | Opcional |
| Valoración media | Número decimal (1,0–5,0) | Calculada por el sistema; vacía si no tiene valoraciones |
| Identificador externo | Texto | Obligatorio, único |
| Excluido de la importación | Sí/No | Obligatorio; por defecto, no |

**Relaciones:** pertenece a un álbum (RI-07) · muchos a 1. Tiene uno o varios artistas (RI-06) · muchos a muchos. Recibe reseñas (RI-10) · 1 a muchos.

**Gestión:** igual que el artista: se importa, la revisa el agente de IA y el administrador puede corregirla o eliminarla.

---

## RI-09 · Incidencia del catálogo

**Descripción:** aviso que genera el agente de IA cuando detecta un posible problema en el contenido importado.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Identificador | Identificador | Único |
| Elemento afectado | Referencia a Artista, Álbum o Canción | Obligatoria |
| Tipo de problema | Enumerado: duplicado, datos incompletos, datos incoherentes, contenido inapropiado | Obligatorio |
| Descripción | Texto (máx. 500) | Obligatoria |
| Estado | Enumerado: pendiente, resuelta, descartada | Obligatorio; por defecto, pendiente |
| Fecha de detección | Fecha y hora | Obligatoria, la asigna el sistema |
| Fecha de resolución | Fecha y hora | Obligatoria si el estado es resuelta o descartada |

**Relaciones:** se refiere a un elemento del catálogo (RI-06, RI-07 o RI-08) · muchos a 1.

**Gestión:** la crea automáticamente el agente de IA. La resuelve el administrador de la plataforma.

**Observaciones:** las correcciones automáticas del agente no generan incidencia, pero quedan registradas.

---

## RI-10 · Reseña

**Descripción:** opinión de un usuario sobre una canción o un álbum, formada por una valoración obligatoria y un texto opcional. Una reseña sin texto equivale a una valoración rápida.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Identificador | Identificador | Único |
| Autor | Referencia a Usuario | Obligatoria |
| Elemento reseñado | Referencia a Canción o Álbum | Obligatoria |
| Valoración | Número entero | Obligatoria; entre 1 y 5 |
| Texto | Texto (máx. 2.000) | Opcional |
| Nivel de privacidad | Enumerado: público, solo amigos, privado | Obligatorio; por defecto, el de la configuración del autor |
| Estado | Enumerado: visible, retirada | Obligatorio; por defecto, visible |
| Fecha de publicación | Fecha y hora | Obligatoria, la asigna el sistema |
| Fecha de última modificación | Fecha y hora | La actualiza el sistema |

La pareja autor–elemento reseñado es única.

**Relaciones:** la escribe un usuario (RI-01) · muchos a 1. Se refiere a una canción o un álbum (RI-07, RI-08) · muchos a 1. Puede recibir denuncias (RI-15) · 1 a muchos.

**Gestión:** la crea, modifica y elimina su autor. El administrador de la plataforma puede retirarla si incumple las normas.

---

## RI-11 · Favorito

**Descripción:** marca que un usuario asigna a una canción, un álbum o un artista para tenerlo a mano en su perfil. No es un tablero: no se puede nombrar ni organizar.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Usuario | Referencia a Usuario | Obligatoria |
| Elemento | Referencia a Canción, Álbum o Artista | Obligatoria |
| Tipo | Enumerado: canción, álbum, artista | Obligatorio |
| Fecha | Fecha y hora | Obligatoria, la asigna el sistema |

La pareja usuario–elemento es única.

**Relaciones:** pertenece a un usuario (RI-01) · muchos a 1. Se refiere a un elemento del catálogo (RI-06, RI-07 o RI-08) · muchos a 1.

**Gestión:** lo añade y lo quita el propio usuario. Su visibilidad la decide la configuración de privacidad (RI-02).

---

## RI-12 · Tablero

**Descripción:** colección de canciones y álbumes que un usuario crea y organiza según su propio criterio.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Identificador | Identificador | Único |
| Propietario | Referencia a Usuario | Obligatoria |
| Nombre | Texto (máx. 80) | Obligatorio |
| Descripción | Texto (máx. 500) | Opcional |
| Nivel de privacidad | Enumerado: público, solo amigos, privado | Obligatorio; por defecto, el de la configuración del propietario |
| Contenido | Lista de referencias a Canción o Álbum | Sin elementos repetidos |
| Seguidores | Lista de referencias a Usuario | Solo si el tablero es público |
| Fecha de creación | Fecha y hora | Obligatoria, la asigna el sistema |

**Relaciones:** pertenece a un usuario (RI-01) · muchos a 1. Contiene canciones y álbumes (RI-07, RI-08) · muchos a muchos. Lo siguen otros usuarios · muchos a muchos.

**Gestión:** lo crea cualquier usuario registrado, que es el único que puede modificarlo, cambiar su privacidad, añadir o quitar contenido y eliminarlo.

---

## RI-13 · Comunidad

**Descripción:** grupo de usuarios con intereses musicales comunes que comparten música y opiniones en un espacio propio.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Identificador | Identificador | Único |
| Nombre | Texto (máx. 80) | Obligatorio, único |
| Descripción | Texto (máx. 500) | Obligatoria |
| Imagen | Imagen | Opcional |
| Normas | Texto (máx. 2.000) | Opcional |
| Tipo de acceso | Enumerado: pública, privada | Obligatorio |
| Creador | Referencia a Usuario | Obligatoria |
| Miembros | Lista de referencias a Usuario, con rol (miembro, administrador o administrador principal) | Exactamente un administrador principal; al principio, el creador |
| Expulsiones | Lista de usuario, fecha, motivo y número de veces expulsado | El usuario con dos expulsiones no puede volver a solicitar el acceso |
| Fecha de creación | Fecha y hora | Obligatoria, la asigna el sistema |

**Relaciones:** tiene miembros y administradores (RI-01) · muchos a muchos. Contiene publicaciones (RI-14) · 1 a muchos.

**Gestión:** la crea cualquier usuario registrado, que pasa a ser su administrador principal. Los administradores de la comunidad pueden modificarla, eliminarla, gestionar sus miembros, nombrar a otros administradores y moderar sus publicaciones, pero no pueden expulsar al administrador principal ni quitarle el rol. Si el administrador principal se va, pasa a serlo el administrador más antiguo.

**Observaciones:** las invitaciones y solicitudes de acceso se registran con el usuario, el tipo (invitación o solicitud), el estado (pendiente, aceptada o rechazada) y la fecha.

---

## RI-14 · Publicación en comunidad

**Descripción:** contenido que un miembro comparte dentro de una comunidad.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Identificador | Identificador | Único |
| Autor | Referencia a Usuario | Obligatoria; debe ser miembro de la comunidad |
| Comunidad | Referencia a Comunidad | Obligatoria |
| Texto | Texto (máx. 1.000) | Obligatorio si no se comparte ninguna canción ni álbum |
| Elemento compartido | Referencia a Canción o Álbum | Opcional |
| Fecha | Fecha y hora | Obligatoria, la asigna el sistema |

**Relaciones:** pertenece a una comunidad (RI-13) · muchos a 1. La escribe un usuario (RI-01) · muchos a 1. Puede recibir denuncias (RI-15) · 1 a muchos.

**Gestión:** la crea cualquier miembro de la comunidad. La pueden eliminar su autor o un administrador de la comunidad.

---

## RI-15 · Denuncia

**Descripción:** aviso de un usuario sobre una reseña o una publicación de una comunidad que considera inapropiada.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Identificador | Identificador | Único |
| Denunciante | Referencia a Usuario | Obligatoria |
| Contenido denunciado | Referencia a Reseña o Publicación | Obligatoria |
| Motivo | Enumerado: ofensivo, spam, contenido inapropiado, otro | Obligatorio |
| Comentario | Texto (máx. 300) | Obligatorio si el motivo es "otro" |
| Estado | Enumerado: pendiente, aceptada, rechazada | Obligatorio; por defecto, pendiente |
| Fecha | Fecha y hora | Obligatoria, la asigna el sistema |

La pareja denunciante–contenido es única.

**Relaciones:** la presenta un usuario (RI-01) · muchos a 1. Se refiere a una reseña o una publicación (RI-10, RI-14) · muchos a 1.

**Gestión:** la crea cualquier usuario registrado. Las denuncias de reseñas las resuelve el administrador de la plataforma; las de publicaciones, los administradores de la comunidad correspondiente.

---

## RI-16 · Actividad

**Descripción:** registro de las acciones de un usuario que pueden interesar a otros.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Identificador | Identificador | Único |
| Usuario | Referencia a Usuario | Obligatoria |
| Tipo de acción | Enumerado: publicar reseña, crear tablero, añadir a tablero, marcar favorito, unirse a comunidad, publicar en comunidad | Obligatorio |
| Elemento relacionado | Referencia | Obligatoria |
| Nivel de privacidad | Enumerado: público, solo amigos, privado | Obligatorio; heredado del elemento relacionado |
| Fecha | Fecha y hora | Obligatoria, la asigna el sistema |

**Relaciones:** pertenece a un usuario (RI-01) · muchos a 1.

**Gestión:** la genera automáticamente el sistema. Nadie la crea ni la modifica manualmente.

**Observaciones:** se muestra en la página principal de quienes siguen al usuario o son sus amigos, filtrada según su nivel de privacidad.

---

## RI-17 · Notificación

**Descripción:** aviso que el sistema envía a un usuario cuando se produce algo que le afecta directamente.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Identificador | Identificador | Único |
| Destinatario | Referencia a Usuario | Obligatoria |
| Tipo | Enumerado: nuevo seguidor, solicitud de amistad, amistad aceptada, invitación a comunidad, solicitud de acceso, respuesta de acceso, comunidad eliminada, expulsión de comunidad, tablero actualizado, nueva denuncia en comunidad, denuncia resuelta | Obligatorio |
| Elemento relacionado | Referencia | Obligatoria |
| Estado | Enumerado: no leída, leída | Obligatorio; por defecto, no leída |
| Fecha | Fecha y hora | Obligatoria, la asigna el sistema |

**Relaciones:** pertenece a un usuario (RI-01) · muchos a 1.

**Gestión:** la genera automáticamente el sistema. El destinatario puede marcarla como leída.

---

## RI-18 · Recomendación

**Descripción:** sugerencia de canciones, álbumes y artistas que el sistema muestra a un usuario en su página principal para que descubra música nueva. No se almacena: se calcula cada vez a partir de los favoritos y las valoraciones del usuario.

**Datos que utiliza:**

| Dato | Origen |
| --- | --- |
| Favoritos del usuario | RI-11 |
| Valoraciones del usuario de 4 o más | RI-10 |
| Género y artista de cada elemento | RI-06, RI-07, RI-08 |

**Gestión:** la calcula el sistema automáticamente, según la regla RN-20.

---

## RI-19 · Ranking semanal

**Descripción:** lista de las diez canciones y los diez álbumes mejor valorados en los últimos siete días. Se muestra en la página principal y es visible para todos, incluidos los visitantes.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Fecha de cálculo | Fecha y hora | Obligatoria |
| Tipo | Enumerado: canciones, álbumes | Obligatorio |
| Posición | Número entero | Entre 1 y 10 |
| Elemento | Referencia a Canción o Álbum | Obligatoria |
| Valoración media del periodo | Número decimal (1,0–5,0) | Obligatoria |
| Número de valoraciones del periodo | Número entero | Mínimo 3 |

**Relaciones:** cada posición se refiere a una canción o un álbum (RI-07, RI-08) · muchos a 1.

**Gestión:** lo calcula el sistema automáticamente una vez al día, según la regla RN-19, y guarda el resultado del último cálculo.

---

## RI-20 · Ranking personal de un álbum

**Descripción:** top que un usuario hace con sus canciones favoritas de un álbum, ordenadas de la que más le gusta a la que menos. Es solo una opinión personal y no interviene en la valoración media ni en el ranking semanal.

**Atributos:**

| Atributo | Tipo | Restricciones |
| --- | --- | --- |
| Identificador | Identificador | Único |
| Autor | Referencia a Usuario | Obligatoria |
| Álbum | Referencia a Álbum | Obligatoria; un único ranking por usuario y álbum |
| Canciones ordenadas | Lista ordenada de referencias a Canción | Mínimo 3 canciones y máximo todas las del álbum; solo canciones de ese álbum y sin repetir |
| Nivel de privacidad | Enumerado: público, solo amigos, privado | Obligatorio; por defecto, el de la configuración del autor |
| Fecha de creación | Fecha y hora | Obligatoria, la asigna el sistema |
| Fecha de modificación | Fecha y hora | La asigna el sistema al editarlo |

**Relaciones:** pertenece a un usuario (RI-01) · muchos a 1. Se refiere a un álbum (RI-07) · muchos a 1. Contiene canciones de ese álbum (RI-08) · muchos a muchos.

**Gestión:** lo crea cualquier usuario registrado desde la ficha del álbum, y solo su autor puede modificarlo, cambiar su privacidad o eliminarlo. Se elimina automáticamente si se elimina la cuenta del autor o el álbum (RN-23).
