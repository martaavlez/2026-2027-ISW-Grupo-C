# Reglas de negocio (RN)

Las reglas de negocio son las políticas del dominio que el sistema debe respetar siempre, independientemente de la pantalla, de la plataforma o de cómo se implemente. Siguen el formato del Tema 3: «Si [condición], entonces [consecuencia]» o «Un [entidad] no puede [acción] más de [límite]».

Alimentan el modelo de datos (restricciones e invariantes) y se verifican con escenarios Gherkin específicos en las fichas de las historias de usuario. Las reglas con un valor numérico se prueban justo en el límite, por debajo y por encima de él.

| ID | Tipo | Regla | RI | Historias que la verifican |
| --- | --- | --- | --- | --- |
| RN-01 | Unicidad | Un nombre de usuario o un correo electrónico no puede estar registrado más de una vez. | RI-01 | HU-01 |
| RN-02 | Condición de acceso | Si un usuario está suspendido, entonces no puede iniciar sesión y su contenido deja de ser visible mientras dure la suspensión. | RI-01 | HU-02, HU-37 |
| RN-03 | Restricción temporal | Si el enlace de recuperación de contraseña tiene más de 24 horas o ya se ha usado, entonces no permite cambiar la contraseña. | RI-01 | HU-18 |
| RN-04 | Límite mínimo | Una comunidad no puede quedarse sin administrador. Si un usuario es su único administrador, entonces no puede abandonarla ni eliminar su cuenta sin nombrar antes a otro administrador o eliminar la comunidad. | RI-01, RI-13 | HU-14, HU-19, HU-32 |
| RN-05 | Límite | Un usuario no puede tener más de una reseña por canción o álbum. Si vuelve a valorar el mismo elemento, entonces se sustituye su valoración anterior. | RI-10 | HU-05 |
| RN-06 | Rango | Una reseña no puede guardarse sin valoración, y la valoración debe ser un número entero entre 1 y 5. El texto es opcional. | RI-10 | HU-05, HU-23 |
| RN-07 | Cálculo | Si se publica, modifica, elimina o retira una reseña, entonces se recalcula la valoración media del elemento. La media cuenta todas las valoraciones de forma anónima, sea cual sea su nivel de privacidad. | RI-07, RI-08, RI-10 | HU-04, HU-05, HU-08, HU-13, HU-23 |
| RN-08 | Visibilidad | Si un contenido es público, entonces lo ve cualquier persona; si es solo para amigos, entonces solo lo ven su propietario y sus amigos; si es privado, entonces solo lo ve su propietario. La actividad hereda el nivel del elemento al que se refiere. | RI-02, RI-10, RI-11, RI-12, RI-16 | HU-04, HU-23, HU-24, HU-28, HU-34, HU-43 |
| RN-09 | Valor por defecto | Si un usuario crea una reseña o un tablero sin elegir un nivel de privacidad, entonces se aplica su nivel por defecto. Cambiar el nivel por defecto no modifica el contenido ya existente. | RI-02 | HU-05, HU-09, HU-23, HU-43 |
| RN-10 | Condición de acceso | Si un usuario sigue a otro, entonces el seguimiento se crea sin aprobación y solo da acceso al contenido público del seguido. | RI-03 | HU-10 |
| RN-11 | Límite | Un usuario no puede tener más de una solicitud de amistad pendiente con el mismo usuario. Si el destinatario la acepta, entonces se crea la amistad; si después se elimina la amistad, entonces se mantiene el seguimiento que existiera. | RI-04 | HU-41, HU-42 |
| RN-12 | Consecuencia | Si un usuario bloquea a otro, entonces se eliminan el seguimiento y la amistad entre ambos, y el bloqueado no puede seguirle, enviarle solicitudes de amistad, ver su perfil ni encontrarlo en la búsqueda. | RI-05 | HU-03, HU-24, HU-35 |
| RN-13 | Autorización | Un usuario no puede modificar ni eliminar las reseñas ni los tableros de otro usuario, ni una comunidad de la que no es administrador. | RI-10, RI-12, RI-13 | HU-08, HU-26, HU-29 |
| RN-14 | Obligatoriedad y unicidad | Un tablero no puede guardarse sin nombre ni contener dos veces el mismo elemento. | RI-12 | HU-09, HU-25 |
| RN-15 | Condición de elegibilidad | Un usuario no puede seguir un tablero que no sea público. Si un tablero deja de ser público, entonces deja de mostrarse a quienes ya no tienen permiso para verlo. | RI-12 | HU-27, HU-34 |
| RN-16 | Unicidad | Una comunidad no puede tener el mismo nombre que otra existente. | RI-13 | HU-14 |
| RN-17 | Condición de elegibilidad | Si una comunidad es pública, entonces cualquier usuario registrado puede unirse; si es privada, entonces solo se entra por invitación o mediante solicitud aprobada, y sus publicaciones solo las ven sus miembros. Un usuario expulsado no puede volver a solicitar el acceso. | RI-13, RI-14 | HU-30, HU-31, HU-32, HU-33 |
| RN-18 | Límite y autorización | Un usuario no puede denunciar más de una vez el mismo contenido. Si la denuncia es sobre una reseña, entonces la resuelve el administrador de la plataforma; si es sobre una publicación, entonces la resuelven los administradores de la comunidad. | RI-15 | HU-13, HU-36, HU-38, HU-39 |
| RN-19 | Límite y cálculo | Una canción o un álbum no puede aparecer en el ranking semanal si tiene menos de 3 valoraciones en los últimos 7 días. El ranking muestra las 10 canciones y los 10 álbumes con mejor media en ese periodo; si hay empate, entonces va primero el que tiene más valoraciones. Se recalcula una vez al día. | RI-19 | HU-15 |
| RN-20 | Cálculo | Si el usuario tiene favoritos o valoraciones de 4 o más, entonces se le recomiendan elementos del mismo género o artista que no haya valorado ni marcado como favoritos. Si no tiene ninguno, entonces se le muestra el ranking semanal. | RI-18 | HU-12 |
| RN-21 | Unicidad | Si un elemento importado ya existe en el catálogo, entonces se actualizan sus datos en lugar de crear otro. Si el administrador lo eliminó, entonces no se vuelve a importar. | RI-06, RI-07, RI-08 | HU-20, HU-40 |
| RN-22 | Autorización | Si el agente de IA detecta un problema que puede corregir con seguridad, entonces lo corrige y deja constancia; en cualquier otro caso, entonces crea una incidencia que debe resolver el administrador de la plataforma. | RI-09 | HU-21, HU-22 |
| RN-23 | Consecuencia | Si se elimina una cuenta, entonces se borran sus reseñas, tableros, favoritos y relaciones. Si se elimina un elemento del catálogo, entonces se borran sus reseñas y su presencia en favoritos y tableros. Si se elimina una comunidad, entonces se borran sus publicaciones. | RI-01, RI-06, RI-07, RI-08, RI-13 | HU-19, HU-29, HU-40 |

> **Valores propuestos por el equipo:** las 24 horas de RN-03 y el mínimo de 3 valoraciones de RN-19 pueden ajustarse si el cliente lo pide.
