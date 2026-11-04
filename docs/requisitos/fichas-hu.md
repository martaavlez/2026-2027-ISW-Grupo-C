# Fichas de historias de usuario clasificadas

Cada ficha incluye el identificador, el título, la estimación, la prioridad MoSCoW, las dependencias, la historia, su clasificación (RI, RN y RNF) y las pruebas de aceptación en Gherkin. Cada escenario tiene un identificador (PA-número de historia-número de escenario) y una etiqueta que indica qué verifica: `@RF` para la funcionalidad, o `@RN-xx` / `@RNF-xx` para una regla de negocio o un requisito no funcional concreto.

## Índice

- [Épica 1 · Acceso y cuentas](#épica-1--acceso-y-cuentas)
- [Épica 2 · Catálogo y búsqueda](#épica-2--catálogo-y-búsqueda)
- [Épica 3 · Reseñas y valoraciones](#épica-3--reseñas-y-valoraciones)
- [Épica 4 · Perfil y red social](#épica-4--perfil-y-red-social)
- [Épica 5 · Organización de la música](#épica-5--organización-de-la-música)
- [Épica 6 · Descubrimiento](#épica-6--descubrimiento)
- [Épica 7 · Comunidades](#épica-7--comunidades)

---

## Épica 1 · Acceso y cuentas

Entrada al sistema y gestión de las cuentas de usuario.

---

### HU-01 · Registrarse

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-01 | 5 puntos | Must | – |

> **Como** visitante  
> **quiero** registrarme en la aplicación  
> **para** poder reseñar, guardar y compartir música.

**Clasificación:** RF · RI-01, RI-02 · RN-01 · RNF-03, RNF-04

**Reglas de negocio asociadas**
- RN-01 · El nombre de usuario y el correo electrónico son únicos.

```gherkin
@RF
Escenario: PA-01-01 · Registro correcto
  Dado que soy visitante y relleno el formulario con datos válidos
  Cuando confirmo el registro
  Entonces se crea mi cuenta con la configuración de privacidad por defecto
  Y accedo con la sesión iniciada

@RN-01
Escenario: PA-01-02 · Usuario o correo ya registrados
  Dado que el nombre de usuario o el correo que introduzco ya existen
  Cuando intento registrarme
  Entonces el sistema me avisa
  Y no crea la cuenta

@RNF-03
Escenario: PA-01-03 · Contraseña insegura
  Dado que la contraseña no cumple los requisitos mínimos de seguridad
  Cuando intento registrarme
  Entonces el sistema me indica qué requisitos debe cumplir
```

---

### HU-02 · Iniciar sesión

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-02 | 3 puntos | Must | HU-01 |

> **Como** usuario registrado  
> **quiero** iniciar sesión  
> **para** acceder a mi cuenta y a mi contenido.

**Clasificación:** RF · RI-01 · RN-02 · RNF-03

**Reglas de negocio asociadas**
- RN-02 · Un usuario suspendido no puede iniciar sesión.

```gherkin
@RF
Escenario: PA-02-01 · Inicio de sesión correcto
  Dado que introduzco credenciales correctas
  Cuando inicio sesión
  Entonces accedo a mi cuenta

@RF
Escenario: PA-02-02 · Credenciales incorrectas
  Dado que introduzco credenciales incorrectas
  Cuando inicio sesión
  Entonces el sistema muestra un mensaje de error

@RN-02
Escenario: PA-02-03 · Cuenta suspendida
  Dado que mi cuenta está suspendida
  Cuando intento iniciar sesión
  Entonces el sistema me informa de la suspensión
  Y no me permite acceder
```

---

### HU-17 · Cerrar sesión

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-17 | 2 puntos | Must | HU-02 |

> **Como** usuario registrado  
> **quiero** cerrar sesión  
> **para** que nadie pueda usar mi cuenta desde el mismo dispositivo.

**Clasificación:** RF · RI-01

```gherkin
@RF
Escenario: PA-17-01 · Cierre de sesión
  Dado que he iniciado sesión
  Cuando cierro sesión
  Entonces vuelvo a acceder como visitante
```

---

### HU-18 · Recuperar la contraseña

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-18 | 5 puntos | Should | HU-01 |

> **Como** usuario registrado  
> **quiero** recuperar mi contraseña  
> **para** poder acceder a mi cuenta si la olvido.

**Clasificación:** RF · RI-01 · RN-03 · RNF-03, RNF-10

**Reglas de negocio asociadas**
- RN-03 · El enlace de recuperación caduca a las 24 horas y solo puede usarse una vez.

```gherkin
@RF
Escenario: PA-18-01 · Solicitud de recuperación
  Dado que he olvidado mi contraseña
  Cuando introduzco el correo de mi cuenta
  Entonces recibo un enlace temporal para establecer una nueva contraseña

@RN-03
Escenario: PA-18-02 · Enlace usado justo antes del límite
  Dado que recibí el enlace de recuperación hace 23 horas y 59 minutos y no lo he usado
  Cuando lo abro
  Entonces puedo establecer una nueva contraseña

@RN-03
Escenario: PA-18-03 · Enlace caducado
  Dado que recibí el enlace de recuperación hace más de 24 horas
  Cuando intento usarlo
  Entonces el sistema me pide solicitar uno nuevo

@RN-03
Escenario: PA-18-04 · Enlace ya utilizado
  Dado que ya he cambiado mi contraseña con un enlace
  Cuando intento usar ese mismo enlace otra vez
  Entonces el sistema me pide solicitar uno nuevo

@RNF-03
Escenario: PA-18-05 · Correo no registrado
  Dado que introduzco un correo que no está registrado
  Cuando solicito la recuperación
  Entonces el sistema muestra el mismo mensaje de confirmación sin revelar si el correo existe
```

---

### HU-19 · Eliminar mi cuenta

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-19 | 5 puntos | Should | HU-02 |

> **Como** usuario registrado  
> **quiero** eliminar mi cuenta  
> **para** dejar de usar la plataforma y que se borren mis datos.

**Clasificación:** RF · RI-01, RI-13 · RN-04, RN-23 · RNF-04

**Reglas de negocio asociadas**
- RN-04 · Una comunidad siempre tiene al menos un administrador.
- RN-23 · Al eliminar una cuenta se borran sus reseñas, tableros, favoritos y relaciones.

```gherkin
@RF @RN-23
Escenario: PA-19-01 · Eliminación de la cuenta
  Dado que he iniciado sesión
  Cuando elimino mi cuenta y confirmo la acción
  Entonces se borran mi perfil, mis reseñas, mis tableros, mis favoritos y mis relaciones con otros usuarios
  Y se cierra mi sesión

@RN-04
Escenario: PA-19-02 · Único administrador de una comunidad
  Dado que soy el único administrador de una comunidad
  Cuando intento eliminar mi cuenta
  Entonces el sistema me pide nombrar antes a otro administrador o eliminar la comunidad
```

---

### HU-37 · Suspender a un usuario

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-37 | 5 puntos | Should | HU-02 |

> **Como** administrador de la plataforma  
> **quiero** suspender a los usuarios que incumplen las normas de forma reiterada  
> **para** proteger al resto de usuarios.

**Clasificación:** RF · RI-01 · RN-02 · RNF-02

**Reglas de negocio asociadas**
- RN-02 · Un usuario suspendido no puede iniciar sesión y su contenido deja de ser visible.

```gherkin
@RF @RN-02
Escenario: PA-37-01 · Suspensión de un usuario
  Dado que un usuario acumula contenido retirado
  Cuando lo suspendo indicando el motivo
  Entonces no puede iniciar sesión
  Y su contenido deja de ser visible

@RF
Escenario: PA-37-02 · Fin de la suspensión
  Dado que un usuario está suspendido
  Cuando levanto la suspensión
  Entonces puede volver a acceder
  Y su contenido vuelve a ser visible
```

---

## Épica 2 · Catálogo y búsqueda

Importación, revisión, búsqueda y consulta del contenido musical.

---

### HU-03 · Buscar contenido

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-03 | 8 puntos | Must | HU-20 |

> **Como** usuario  
> **quiero** buscar canciones, álbumes, artistas, usuarios y comunidades  
> **para** encontrar el contenido que me interesa.

**Clasificación:** RF · RI-01, RI-06, RI-07, RI-08, RI-13 · RN-12 · RNF-05, RNF-09

**Reglas de negocio asociadas**
- RN-12 · Un usuario bloqueado no puede encontrar en la búsqueda a quien le ha bloqueado.

```gherkin
@RF
Escenario: PA-03-01 · Búsqueda con resultados
  Dado que escribo un término en el buscador
  Cuando lanzo la búsqueda
  Entonces veo los resultados separados por categorías

@RF
Escenario: PA-03-02 · Búsqueda sin resultados
  Dado que no existen coincidencias con el término
  Cuando lanzo la búsqueda
  Entonces el sistema indica que no hay resultados

@RN-12
Escenario: PA-03-03 · Usuario que me ha bloqueado
  Dado que un usuario me ha bloqueado
  Cuando lo busco
  Entonces no aparece en los resultados
```

---

### HU-04 · Consultar una canción, álbum o artista

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-04 | 5 puntos | Must | HU-03 |

> **Como** usuario  
> **quiero** consultar la información de una canción, álbum o artista  
> **para** conocerlo y ver las opiniones de otros usuarios.

**Clasificación:** RF · RI-06, RI-07, RI-08, RI-10 · RN-07, RN-08 · RNF-02, RNF-05

**Reglas de negocio asociadas**
- RN-07 · La valoración media incluye todas las valoraciones de forma anónima.
- RN-08 · Solo se muestran las reseñas que el usuario tiene permiso para ver.

```gherkin
@RF @RN-07 @RN-08
Escenario: PA-04-01 · Ficha de una canción o un álbum
  Dado que selecciono una canción o un álbum
  Cuando accedo a su ficha
  Entonces veo su información y su valoración media
  Y veo las reseñas que tengo permiso para ver

@RF
Escenario: PA-04-02 · Ficha de un artista
  Dado que selecciono un artista
  Cuando accedo a su ficha
  Entonces veo su información y sus álbumes
```

---

### HU-20 · Importar el catálogo

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-20 | 8 puntos | Must | – |

> **Como** administrador de la plataforma  
> **quiero** que el catálogo se importe automáticamente desde una base de datos musical externa  
> **para** que los usuarios dispongan de un catálogo amplio sin tener que darlo de alta a mano.

**Clasificación:** RF · RI-06, RI-07, RI-08 · RN-21 · RNF-05, RNF-06, RNF-10

**Reglas de negocio asociadas**
- RN-21 · La importación no crea duplicados.

```gherkin
@RF
Escenario: PA-20-01 · Importación de contenido nuevo
  Dado que la fuente externa contiene canciones, álbumes o artistas nuevos
  Cuando se ejecuta la importación periódica
  Entonces se añaden al catálogo

@RN-21
Escenario: PA-20-02 · Elemento ya importado
  Dado que un elemento ya fue importado
  Cuando se vuelve a importar
  Entonces se actualizan sus datos sin crear un duplicado

@RNF-05
Escenario: PA-20-03 · Fuente externa no disponible
  Dado que la fuente externa no responde
  Cuando se intenta la importación
  Entonces la aplicación sigue funcionando con el contenido existente
  Y la importación se reintenta más tarde
```

---

### HU-21 · Revisar automáticamente el contenido importado

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-21 | 8 puntos | Should | HU-20 |

> **Como** administrador de la plataforma  
> **quiero** que un agente de IA revise el contenido importado  
> **para** detectar errores sin tener que revisarlo todo manualmente.

**Clasificación:** RF · RI-06, RI-07, RI-08, RI-09 · RN-22 · RNF-07

**Reglas de negocio asociadas**
- RN-22 · El agente solo corrige automáticamente los problemas seguros; el resto genera una incidencia.

```gherkin
@RF @RN-22
Escenario: PA-21-01 · Detección de un posible problema
  Dado que se ha importado contenido nuevo
  Cuando el agente detecta un posible duplicado o datos incompletos
  Entonces crea una incidencia pendiente de revisión

@RN-22 @RNF-07
Escenario: PA-21-02 · Corrección automática segura
  Dado que el agente detecta un problema que puede corregir con seguridad
  Cuando lo corrige
  Entonces deja constancia del cambio realizado
```

---

### HU-22 · Resolver las incidencias del catálogo

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-22 | 5 puntos | Should | HU-21 |

> **Como** administrador de la plataforma  
> **quiero** revisar las incidencias detectadas por el agente de IA  
> **para** decidir qué hacer con el contenido dudoso.

**Clasificación:** RF · RI-09 · RN-22 · RNF-02, RNF-07

**Reglas de negocio asociadas**
- RN-22 · Las incidencias que el agente no puede resolver las resuelve el administrador.

```gherkin
@RF
Escenario: PA-22-01 · Consulta de incidencias pendientes
  Dado que hay incidencias pendientes
  Cuando accedo a la bandeja de incidencias
  Entonces las veo con el elemento afectado y el problema detectado

@RF @RN-22
Escenario: PA-22-02 · Incidencia correcta
  Dado que una incidencia señala un problema real
  Cuando corrijo o elimino el elemento afectado
  Entonces la incidencia se marca como resuelta

@RF
Escenario: PA-22-03 · Incidencia descartada
  Dado que una incidencia no es un problema real
  Cuando la descarto
  Entonces el elemento se mantiene sin cambios
```

---

### HU-40 · Corregir o eliminar contenido del catálogo

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-40 | 5 puntos | Should | HU-20 |

> **Como** administrador de la plataforma  
> **quiero** modificar o eliminar cualquier canción, álbum o artista  
> **para** corregir errores que el agente de IA no haya detectado.

**Clasificación:** RF · RI-06, RI-07, RI-08 · RN-21, RN-23 · RNF-02

**Reglas de negocio asociadas**
- RN-21 · Un elemento eliminado por el administrador no se vuelve a importar.
- RN-23 · Al eliminar un elemento se borran sus reseñas y su presencia en favoritos y tableros.

```gherkin
@RF
Escenario: PA-40-01 · Corrección de datos
  Dado que estoy en la ficha de una canción
  Cuando modifico sus datos y guardo los cambios
  Entonces la ficha muestra la información actualizada

@RF @RN-23
Escenario: PA-40-02 · Eliminación de un elemento
  Dado que estoy en la ficha de un álbum
  Cuando lo elimino y confirmo la acción
  Entonces desaparece del catálogo junto con sus reseñas
  Y desaparece de los favoritos y tableros que lo contenían

@RN-21
Escenario: PA-40-03 · Elemento eliminado en una nueva importación
  Dado que he eliminado un elemento del catálogo
  Cuando se ejecuta la siguiente importación
  Entonces el elemento no se vuelve a añadir
```

---

## Épica 3 · Reseñas y valoraciones

Expresión y moderación de opiniones sobre la música.

---

### HU-05 · Valorar una canción o un álbum

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-05 | 3 puntos | Must | HU-02, HU-04 |

> **Como** usuario registrado  
> **quiero** puntuar una canción o un álbum de 1 a 5 sin necesidad de escribir texto  
> **para** dar mi opinión de forma rápida.

**Clasificación:** RF · RI-02, RI-10 · RN-05, RN-06, RN-07, RN-09

**Reglas de negocio asociadas**
- RN-05 · Una sola reseña por usuario y elemento.
- RN-06 · La valoración es obligatoria y va de 1 a 5.
- RN-07 · La media se recalcula al valorar.
- RN-09 · Se aplica el nivel de privacidad por defecto.

```gherkin
@RF @RN-06 @RN-07 @RN-09
Escenario: PA-05-01 · Valoración rápida
  Dado que estoy en la ficha de una canción
  Cuando selecciono una puntuación
  Entonces se guarda mi valoración con mi nivel de privacidad por defecto
  Y se recalcula la valoración media

@RN-05
Escenario: PA-05-02 · Cambio de valoración
  Dado que ya he valorado esa canción
  Cuando selecciono otra puntuación
  Entonces se sustituye mi valoración anterior

@RN-06
Escenario: PA-05-03 · Valoración fuera de rango
  Dado que intento guardar una valoración de 0 o de 6
  Cuando la envío
  Entonces el sistema la rechaza
  Y me indica que la valoración debe ser un número entero del 1 al 5

@RF
Escenario: PA-05-04 · Visitante intenta valorar
  Dado que soy visitante
  Cuando intento valorar una canción
  Entonces el sistema me pide registrarme o iniciar sesión
```

---

### HU-23 · Escribir una reseña

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-23 | 5 puntos | Must | HU-02, HU-04 |

> **Como** usuario registrado  
> **quiero** escribir una reseña con texto sobre una canción o un álbum y elegir quién puede verla  
> **para** explicar mi opinión a quien yo decida.

**Clasificación:** RF · RI-02, RI-10 · RN-06, RN-07, RN-08, RN-09

**Reglas de negocio asociadas**
- RN-06 · La valoración es obligatoria y el texto opcional.
- RN-07 · La media se recalcula al publicar la reseña.
- RN-08 · La reseña solo la ve quien tiene permiso según su nivel de privacidad.
- RN-09 · Si no se elige nivel, se aplica el nivel por defecto.

```gherkin
@RF @RN-07
Escenario: PA-23-01 · Publicación de una reseña
  Dado que estoy en la ficha de un álbum
  Cuando escribo una reseña con su valoración y la publico
  Entonces aparece en la ficha del álbum y en la pestaña Reseñas de mi perfil
  Y se aplica el nivel de privacidad seleccionado
  Y se recalcula la valoración media

@RN-09
Escenario: PA-23-02 · Nivel de privacidad por defecto
  Dado que no cambio el nivel de privacidad
  Cuando publico la reseña
  Entonces se aplica el nivel por defecto de mi configuración

@RN-08
Escenario: PA-23-03 · Reseña solo para amigos vista por un seguidor
  Dado que mi reseña es solo para amigos
  Cuando la consulta un usuario que me sigue pero no es mi amigo
  Entonces no puede verla

@RN-06
Escenario: PA-23-04 · Reseña sin valoración
  Dado que intento publicar una reseña sin valoración
  Cuando la envío
  Entonces el sistema me pide seleccionar una puntuación
```

---

### HU-08 · Editar y eliminar mis reseñas

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-08 | 3 puntos | Should | HU-23 |

> **Como** usuario registrado  
> **quiero** editar y eliminar mis reseñas  
> **para** corregir o retirar mis opiniones.

**Clasificación:** RF · RI-10 · RN-07, RN-13

**Reglas de negocio asociadas**
- RN-07 · La media se recalcula al modificar o eliminar una reseña.
- RN-13 · Solo el autor puede modificar o eliminar su reseña.

```gherkin
@RF @RN-07
Escenario: PA-08-01 · Edición de una reseña
  Dado que tengo una reseña publicada
  Cuando modifico su texto, su valoración o su nivel de privacidad y guardo los cambios
  Entonces se muestra la versión actualizada
  Y se recalcula la valoración media

@RF @RN-07
Escenario: PA-08-02 · Eliminación de una reseña
  Dado que tengo una reseña publicada
  Cuando la elimino
  Entonces deja de aparecer en la ficha y en mi perfil
  Y se recalcula la valoración media

@RN-13
Escenario: PA-08-03 · Reseña de otro usuario
  Dado que una reseña es de otro usuario
  Cuando la consulto
  Entonces no tengo la opción de editarla ni eliminarla
```

---

### HU-36 · Denunciar una reseña

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-36 | 3 puntos | Should | HU-23 |

> **Como** usuario registrado  
> **quiero** denunciar una reseña inapropiada  
> **para** que el administrador de la plataforma la revise.

**Clasificación:** RF · RI-15 · RN-18

**Reglas de negocio asociadas**
- RN-18 · No se puede denunciar dos veces el mismo contenido.

```gherkin
@RF
Escenario: PA-36-01 · Denuncia de una reseña
  Dado que veo una reseña ofensiva
  Cuando la denuncio indicando un motivo
  Entonces la denuncia queda pendiente de revisión

@RN-18
Escenario: PA-36-02 · Denuncia repetida
  Dado que ya he denunciado esa reseña
  Cuando intento denunciarla de nuevo
  Entonces el sistema me indica que ya está en revisión
```

---

### HU-13 · Revisar denuncias de reseñas

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-13 | 5 puntos | Should | HU-36 |

> **Como** administrador de la plataforma  
> **quiero** revisar las denuncias de reseñas y retirar las inapropiadas  
> **para** mantener un ambiente respetuoso.

**Clasificación:** RF · RI-10, RI-15, RI-17 · RN-07, RN-18 · RNF-02

**Reglas de negocio asociadas**
- RN-07 · La media se recalcula al retirar una reseña.
- RN-18 · Las denuncias de reseñas las resuelve el administrador de la plataforma.

```gherkin
@RF @RN-18
Escenario: PA-13-01 · Consulta de denuncias pendientes
  Dado que hay denuncias pendientes
  Cuando accedo a la bandeja de denuncias
  Entonces las veo ordenadas por fecha con su motivo

@RF @RN-07
Escenario: PA-13-02 · Denuncia válida
  Dado que una denuncia es válida
  Cuando retiro la reseña
  Entonces deja de ser visible
  Y se recalcula la valoración media
  Y el usuario que denunció recibe una notificación

@RF
Escenario: PA-13-03 · Denuncia no válida
  Dado que una denuncia no es válida
  Cuando la rechazo
  Entonces la reseña se mantiene
  Y la denuncia se marca como resuelta
```

---

## Épica 4 · Perfil y red social

Perfil, privacidad general y relaciones entre usuarios.

---

### HU-06 · Gestionar mi perfil

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-06 | 5 puntos | Must | HU-02 |

> **Como** usuario registrado  
> **quiero** consultar y editar mi perfil  
> **para** mostrar a otros usuarios mis gustos musicales.

**Clasificación:** RF · RI-01, RI-10, RI-11, RI-12

```gherkin
@RF
Escenario: PA-06-01 · Consulta de mi perfil
  Dado que he iniciado sesión
  Cuando accedo a mi perfil
  Entonces veo mi información
  Y veo las pestañas Favoritos (con canciones, álbumes y artistas), Reseñas y Tableros con todo mi contenido

@RF
Escenario: PA-06-02 · Edición del perfil
  Dado que edito mi foto o mi biografía
  Cuando guardo los cambios
  Entonces el perfil se actualiza
```

---

### HU-24 · Consultar el perfil de otro usuario

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-24 | 3 puntos | Must | HU-06 |

> **Como** usuario  
> **quiero** consultar el perfil de otro usuario  
> **para** conocer sus gustos musicales.

**Clasificación:** RF · RI-01, RI-02, RI-04, RI-05 · RN-08, RN-12 · RNF-02

**Reglas de negocio asociadas**
- RN-08 · Cada usuario solo ve el contenido que su relación le permite.
- RN-12 · Un usuario bloqueado no puede ver el perfil de quien le bloqueó.

```gherkin
@RF @RN-08
Escenario: PA-24-01 · Perfil de un usuario que no es mi amigo
  Dado que accedo al perfil de un usuario que no es mi amigo
  Cuando lo consulto
  Entonces veo su información
  Y solo veo sus reseñas, tableros y favoritos públicos

@RN-08
Escenario: PA-24-02 · Perfil de un amigo
  Dado que accedo al perfil de un amigo
  Cuando lo consulto
  Entonces veo también su contenido marcado como solo amigos

@RN-12
Escenario: PA-24-03 · Usuario que me ha bloqueado
  Dado que ese usuario me ha bloqueado
  Cuando intento acceder a su perfil
  Entonces el sistema no me lo muestra
```

---

### HU-43 · Configurar la privacidad de mi cuenta

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-43 | 5 puntos | Should | HU-06 |

> **Como** usuario registrado  
> **quiero** configurar desde mi perfil la privacidad general de mi cuenta  
> **para** controlar en un solo lugar quién ve mi contenido.

**Clasificación:** RF · RI-02 · RN-08, RN-09 · RNF-02

**Reglas de negocio asociadas**
- RN-08 · Visibilidad según el nivel de privacidad.
- RN-09 · El nivel por defecto se aplica al contenido nuevo y no modifica el existente.

```gherkin
@RF @RN-09
Escenario: PA-43-01 · Cambio del nivel por defecto
  Dado que estoy en la configuración de privacidad
  Cuando cambio el nivel por defecto a solo amigos
  Entonces las reseñas y tableros que cree a partir de ese momento tendrán ese nivel

@RF @RN-08
Escenario: PA-43-02 · Favoritos privados
  Dado que configuro la pestaña de favoritos como privada
  Cuando otro usuario visita mi perfil
  Entonces no ve mis favoritos

@RN-09
Escenario: PA-43-03 · Contenido existente
  Dado que cambio el nivel por defecto
  Cuando consulto mis reseñas y tableros anteriores
  Entonces mantienen el nivel que tenían
```

---

### HU-10 · Seguir y dejar de seguir a otros usuarios

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-10 | 3 puntos | Should | HU-24 |

> **Como** usuario registrado  
> **quiero** seguir a otros usuarios  
> **para** estar al tanto de su actividad pública.

**Clasificación:** RF · RI-03 · RN-10

**Reglas de negocio asociadas**
- RN-10 · Seguir no requiere aprobación y solo da acceso al contenido público.

```gherkin
@RF @RN-10
Escenario: PA-10-01 · Seguir a un usuario
  Dado que estoy en el perfil de otro usuario
  Cuando pulso Seguir
  Entonces pasa a mi lista de seguidos sin necesidad de aprobación
  Y aumenta su número de seguidores

@RN-10
Escenario: PA-10-02 · Contenido visible para un seguidor
  Dado que sigo a un usuario que no es mi amigo
  Cuando consulto su contenido
  Entonces solo veo el contenido público

@RF
Escenario: PA-10-03 · Dejar de seguir
  Dado que ya sigo a un usuario
  Cuando dejo de seguirlo
  Entonces desaparece de mi lista de seguidos
```

---

### HU-41 · Enviar y responder solicitudes de amistad

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-41 | 5 puntos | Should | HU-24 |

> **Como** usuario registrado  
> **quiero** enviar solicitudes de amistad y responder a las que recibo  
> **para** compartir con mis amigos el contenido que no es público.

**Clasificación:** RF · RI-04, RI-17 · RN-11

**Reglas de negocio asociadas**
- RN-11 · La amistad requiere una solicitud aceptada y no puede haber dos solicitudes pendientes entre los mismos usuarios.

```gherkin
@RF
Escenario: PA-41-01 · Envío de una solicitud
  Dado que estoy en el perfil de otro usuario
  Cuando le envío una solicitud de amistad
  Entonces recibe una notificación
  Y la solicitud queda pendiente

@RF @RN-11
Escenario: PA-41-02 · Solicitud aceptada
  Dado que he recibido una solicitud de amistad
  Cuando la acepto
  Entonces ambos pasamos a ser amigos
  Y podemos ver el contenido solo amigos del otro

@RF
Escenario: PA-41-03 · Solicitud rechazada
  Dado que he recibido una solicitud de amistad
  Cuando la rechazo
  Entonces no se crea la amistad

@RN-11
Escenario: PA-41-04 · Solicitud duplicada
  Dado que ya tengo una solicitud pendiente con ese usuario
  Cuando intento enviar otra
  Entonces el sistema no me lo permite
```

---

### HU-42 · Eliminar una amistad

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-42 | 2 puntos | Should | HU-41 |

> **Como** usuario registrado  
> **quiero** eliminar a un usuario de mis amigos  
> **para** que deje de ver mi contenido solo amigos.

**Clasificación:** RF · RI-03, RI-04 · RN-11

**Reglas de negocio asociadas**
- RN-11 · La amistad es independiente del seguimiento.

```gherkin
@RF
Escenario: PA-42-01 · Eliminación de una amistad
  Dado que soy amigo de otro usuario
  Cuando elimino la amistad
  Entonces ninguno de los dos puede ver ya el contenido solo amigos del otro

@RN-11
Escenario: PA-42-02 · Se mantiene el seguimiento
  Dado que sigo a un amigo
  Cuando elimino la amistad
  Entonces sigo siguiéndole
```

---

### HU-35 · Bloquear y desbloquear usuarios

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-35 | 5 puntos | Should | HU-24 |

> **Como** usuario registrado  
> **quiero** bloquear a otro usuario  
> **para** que no pueda seguirme, enviarme solicitudes ni ver mi contenido.

**Clasificación:** RF · RI-03, RI-04, RI-05 · RN-12

**Reglas de negocio asociadas**
- RN-12 · Bloquear elimina el seguimiento y la amistad, e impide seguir, solicitar amistad y ver el perfil.

```gherkin
@RF @RN-12
Escenario: PA-35-01 · Bloqueo de un usuario
  Dado que estoy en el perfil de otro usuario
  Cuando lo bloqueo
  Entonces se eliminan el seguimiento y la amistad entre ambos
  Y deja de ver mi perfil

@RN-12
Escenario: PA-35-02 · Usuario bloqueado intenta interactuar
  Dado que he bloqueado a un usuario
  Cuando intenta seguirme o enviarme una solicitud de amistad
  Entonces el sistema no se lo permite

@RF
Escenario: PA-35-03 · Desbloqueo
  Dado que tengo un usuario bloqueado
  Cuando lo desbloqueo desde mi lista de bloqueados
  Entonces puede volver a ver mi contenido público
```

---

## Épica 5 · Organización de la música

Favoritos y tableros.

---

### HU-07 · Marcar y desmarcar favoritos

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-07 | 3 puntos | Must | HU-02, HU-04 |

> **Como** usuario registrado  
> **quiero** marcar canciones, álbumes y artistas como favoritos  
> **para** tener a mano la música que más me gusta.

**Clasificación:** RF · RI-11

```gherkin
@RF
Escenario: PA-07-01 · Marcar un favorito
  Dado que estoy en la ficha de una canción
  Cuando la marco como favorita
  Entonces aparece en la subcategoría Canciones de mi pestaña Favoritos

@RF
Escenario: PA-07-02 · Desmarcar un favorito
  Dado que un álbum ya es favorito
  Cuando lo desmarco
  Entonces desaparece de mis favoritos
```

---

### HU-09 · Crear un tablero

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-09 | 3 puntos | Should | HU-02 |

> **Como** usuario registrado  
> **quiero** crear tableros  
> **para** organizar mi música a mi manera.

**Clasificación:** RF · RI-02, RI-12 · RN-09, RN-14

**Reglas de negocio asociadas**
- RN-09 · Si no se elige nivel, se aplica el nivel de privacidad por defecto.
- RN-14 · Un tablero debe tener nombre.

```gherkin
@RF
Escenario: PA-09-01 · Creación de un tablero
  Dado que he iniciado sesión
  Cuando creo un tablero con un nombre, una descripción y un nivel de privacidad
  Entonces aparece en la pestaña Tableros de mi perfil

@RN-09
Escenario: PA-09-02 · Nivel de privacidad por defecto
  Dado que no elijo un nivel de privacidad
  Cuando creo el tablero
  Entonces se aplica el nivel por defecto de mi configuración

@RN-14
Escenario: PA-09-03 · Tablero sin nombre
  Dado que intento crear un tablero sin nombre
  Cuando lo guardo
  Entonces el sistema me pide indicar un nombre
```

---

### HU-25 · Añadir y quitar contenido de un tablero

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-25 | 3 puntos | Should | HU-04, HU-09 |

> **Como** propietario de un tablero  
> **quiero** añadir y quitar canciones y álbumes  
> **para** mantenerlo actualizado.

**Clasificación:** RF · RI-12 · RN-14

**Reglas de negocio asociadas**
- RN-14 · Un tablero no puede contener dos veces el mismo elemento.

```gherkin
@RF
Escenario: PA-25-01 · Añadir una canción
  Dado que estoy en la ficha de una canción
  Cuando la añado a uno de mis tableros
  Entonces aparece en el contenido de ese tablero

@RN-14
Escenario: PA-25-02 · Canción repetida
  Dado que una canción ya está en el tablero
  Cuando intento añadirla de nuevo
  Entonces el sistema me avisa
  Y no la duplica

@RF
Escenario: PA-25-03 · Quitar una canción
  Dado que una canción está en mi tablero
  Cuando la quito
  Entonces deja de aparecer en él
```

---

### HU-26 · Editar y eliminar un tablero

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-26 | 3 puntos | Should | HU-09 |

> **Como** propietario de un tablero  
> **quiero** modificar su nombre y su descripción, o eliminarlo  
> **para** mantener organizada mi música.

**Clasificación:** RF · RI-12 · RN-13

**Reglas de negocio asociadas**
- RN-13 · Solo el propietario puede modificar o eliminar su tablero.

```gherkin
@RF
Escenario: PA-26-01 · Edición de un tablero
  Dado que soy el propietario de un tablero
  Cuando modifico su nombre o su descripción y guardo los cambios
  Entonces el tablero se muestra actualizado

@RF
Escenario: PA-26-02 · Eliminación de un tablero
  Dado que soy el propietario de un tablero
  Cuando lo elimino y confirmo la acción
  Entonces desaparece de mi perfil
  Y desaparece de la lista de tableros seguidos de otros usuarios

@RN-13
Escenario: PA-26-03 · Tablero de otro usuario
  Dado que el tablero es de otro usuario
  Cuando lo consulto
  Entonces no tengo la opción de editarlo ni eliminarlo
```

---

### HU-34 · Cambiar la privacidad de un tablero

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-34 | 3 puntos | Should | HU-09 |

> **Como** propietario de un tablero  
> **quiero** cambiar su nivel de privacidad  
> **para** decidir con quién comparto esa colección.

**Clasificación:** RF · RI-02, RI-12 · RN-08, RN-15 · RNF-02

**Reglas de negocio asociadas**
- RN-08 · Visibilidad según el nivel de privacidad.
- RN-15 · Si un tablero deja de ser público, deja de mostrarse a quienes ya no tienen permiso.

```gherkin
@RF
Escenario: PA-34-01 · Cambio de nivel
  Dado que soy el propietario de un tablero
  Cuando cambio su nivel a público, solo amigos o privado
  Entonces el cambio se aplica de inmediato

@RN-08
Escenario: PA-34-02 · Tablero solo para amigos visto por un seguidor
  Dado que un tablero es solo para amigos
  Cuando un seguidor que no es mi amigo intenta verlo
  Entonces el sistema no se lo muestra

@RN-15
Escenario: PA-34-03 · Tablero público con seguidores que cambia de nivel
  Dado que un tablero público tiene seguidores
  Cuando lo cambio a otro nivel
  Entonces deja de mostrarse a quienes ya no tienen permiso
```

---

### HU-27 · Seguir un tablero público

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-27 | 3 puntos | Could | HU-09 |

> **Como** usuario registrado  
> **quiero** seguir los tableros públicos de otros usuarios  
> **para** enterarme cuando añaden música nueva.

**Clasificación:** RF · RI-12, RI-17 · RN-15

**Reglas de negocio asociadas**
- RN-15 · Solo se pueden seguir los tableros públicos.

```gherkin
@RF @RN-15
Escenario: PA-27-01 · Seguir un tablero público
  Dado que estoy en un tablero público de otro usuario
  Cuando pulso Seguir
  Entonces el tablero aparece en mi lista de tableros seguidos

@RF
Escenario: PA-27-02 · Aviso de contenido nuevo
  Dado que sigo un tablero
  Cuando su propietario añade contenido
  Entonces recibo una notificación
```

---

## Épica 6 · Descubrimiento

Actividad, notificaciones, recomendaciones y ranking.

---

### HU-11 · Recibir notificaciones

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-11 | 8 puntos | Should | HU-02 |

> **Como** usuario registrado  
> **quiero** recibir notificaciones de lo que me afecta  
> **para** no perderme nada relevante.

**Clasificación:** RF · RI-17

```gherkin
@RF
Escenario: PA-11-01 · Nuevo seguidor o solicitud de amistad
  Dado que otro usuario empieza a seguirme o me envía una solicitud de amistad
  Cuando abro mis notificaciones
  Entonces veo el aviso correspondiente

@RF
Escenario: PA-11-02 · Invitación a una comunidad
  Dado que recibo una invitación a una comunidad
  Cuando abro mis notificaciones
  Entonces puedo aceptarla o rechazarla desde ahí

@RF
Escenario: PA-11-03 · Notificaciones leídas
  Dado que tengo notificaciones sin leer
  Cuando las abro
  Entonces pasan a estado leído
```

---

### HU-12 · Ver recomendaciones personalizadas

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-12 | 8 puntos | Could | HU-05, HU-07 |

> **Como** usuario registrado  
> **quiero** recibir recomendaciones de canciones, álbumes y artistas en la página principal  
> **para** descubrir música nueva según mis gustos.

**Clasificación:** RF · RI-10, RI-11, RI-18 · RN-20

**Reglas de negocio asociadas**
- RN-20 · Regla de cálculo de las recomendaciones.

```gherkin
@RF @RN-20
Escenario: PA-12-01 · Recomendaciones según mis gustos
  Dado que tengo favoritos o valoraciones de 4 o más
  Cuando accedo a la página principal
  Entonces veo recomendaciones del mismo género o artista
  Y no aparecen elementos que ya he valorado o marcado como favoritos

@RN-20
Escenario: PA-12-02 · Valoración por debajo de 4
  Dado que no tengo favoritos y mi única valoración es un 3
  Cuando accedo a la página principal
  Entonces veo el ranking semanal en lugar de recomendaciones

@RN-20
Escenario: PA-12-03 · Usuario sin datos
  Dado que no tengo favoritos ni valoraciones
  Cuando accedo a la página principal
  Entonces veo el ranking semanal en lugar de recomendaciones
```

---

### HU-15 · Consultar el ranking semanal

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-15 | 5 puntos | Could | HU-05 |

> **Como** usuario  
> **quiero** consultar en la página principal el ranking semanal de canciones y álbumes  
> **para** conocer lo más valorado del momento.

**Clasificación:** RF · RI-10, RI-19 · RN-19

**Reglas de negocio asociadas**
- RN-19 · Regla de cálculo del ranking.

```gherkin
@RF @RN-19
Escenario: PA-15-01 · Consulta del ranking
  Dado que accedo a la página principal
  Cuando consulto el ranking
  Entonces veo las diez canciones y los diez álbumes con mejor valoración media en los últimos siete días

@RN-19
Escenario: PA-15-02 · Por debajo del mínimo de valoraciones
  Dado que una canción tiene exactamente 2 valoraciones en los últimos 7 días
  Cuando se calcula el ranking
  Entonces no aparece en él

@RN-19
Escenario: PA-15-03 · Justo en el mínimo de valoraciones
  Dado que una canción tiene exactamente 3 valoraciones en los últimos 7 días y su media está entre las diez mejores
  Cuando se calcula el ranking
  Entonces aparece en él

@RN-19
Escenario: PA-15-04 · Valoraciones fuera del periodo
  Dado que una canción recibió valoraciones hace 8 días
  Cuando se calcula el ranking
  Entonces esas valoraciones no cuentan para el ranking de la semana

@RN-19
Escenario: PA-15-05 · Empate
  Dado que dos elementos tienen la misma valoración media
  Cuando se calcula el ranking
  Entonces aparece primero el que tiene más valoraciones
```

---

### HU-28 · Consultar la actividad de mis seguidos y amigos

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-28 | 5 puntos | Could | HU-10, HU-41 |

> **Como** usuario registrado  
> **quiero** ver en la página principal la actividad reciente de los usuarios que sigo y de mis amigos  
> **para** descubrir música a través de ellos.

**Clasificación:** RF · RI-03, RI-04, RI-16 · RN-08

**Reglas de negocio asociadas**
- RN-08 · La actividad hereda el nivel de privacidad del elemento al que se refiere.

```gherkin
@RF @RN-08
Escenario: PA-28-01 · Actividad de los usuarios que sigo
  Dado que sigo a otros usuarios
  Cuando accedo a la página principal
  Entonces veo su actividad pública más reciente ordenada por fecha

@RN-08
Escenario: PA-28-02 · Actividad de mis amigos
  Dado que tengo amigos
  Cuando consulto la actividad
  Entonces veo también su actividad sobre contenido solo amigos

@RN-08
Escenario: PA-28-03 · Actividad sobre contenido privado
  Dado que un usuario al que sigo añade contenido a un tablero privado
  Cuando consulto la actividad
  Entonces esa acción no aparece
```

---

## Épica 7 · Comunidades

Ciclo de vida, acceso, miembros, publicaciones y moderación de las comunidades.

---

### HU-14 · Crear una comunidad

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-14 | 5 puntos | Could | HU-02 |

> **Como** usuario registrado  
> **quiero** crear una comunidad  
> **para** reunir a personas con mis mismos gustos musicales.

**Clasificación:** RF · RI-13 · RN-04, RN-16

**Reglas de negocio asociadas**
- RN-04 · Quien crea la comunidad pasa a ser su administrador.
- RN-16 · El nombre de una comunidad es único.

```gherkin
@RF @RN-04
Escenario: PA-14-01 · Creación de una comunidad
  Dado que he iniciado sesión
  Cuando creo una comunidad con nombre, descripción, imagen, normas y tipo de acceso
  Entonces la comunidad se crea
  Y yo paso a ser su administrador

@RN-16
Escenario: PA-14-02 · Nombre repetido
  Dado que ya existe una comunidad con ese nombre
  Cuando intento crearla
  Entonces el sistema me pide elegir otro nombre
```

---

### HU-29 · Editar y eliminar una comunidad

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-29 | 3 puntos | Could | HU-14 |

> **Como** administrador de una comunidad  
> **quiero** modificar su información o eliminarla  
> **para** mantenerla actualizada o cerrarla.

**Clasificación:** RF · RI-13, RI-14, RI-17 · RN-13, RN-23 · RNF-02

**Reglas de negocio asociadas**
- RN-13 · Solo los administradores de la comunidad pueden modificarla o eliminarla.
- RN-23 · Al eliminar una comunidad se borran sus publicaciones.

```gherkin
@RF
Escenario: PA-29-01 · Edición de una comunidad
  Dado que administro una comunidad
  Cuando modifico su descripción, sus normas o su tipo de acceso y guardo los cambios
  Entonces la comunidad se muestra actualizada

@RF @RN-23
Escenario: PA-29-02 · Eliminación de una comunidad
  Dado que administro una comunidad
  Cuando la elimino y confirmo la acción
  Entonces desaparece junto con sus publicaciones
  Y sus miembros reciben una notificación

@RN-13
Escenario: PA-29-03 · Miembro sin rol de administrador
  Dado que soy un miembro sin rol de administrador
  Cuando consulto la comunidad
  Entonces no tengo la opción de editarla ni eliminarla
```

---

### HU-30 · Unirse y abandonar una comunidad

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-30 | 3 puntos | Could | HU-14 |

> **Como** usuario registrado  
> **quiero** unirme a una comunidad o abandonarla  
> **para** participar solo en las que me interesan.

**Clasificación:** RF · RI-13 · RN-17

**Reglas de negocio asociadas**
- RN-17 · Acceso libre a las comunidades públicas y con aprobación a las privadas.

```gherkin
@RF @RN-17
Escenario: PA-30-01 · Unirse a una comunidad pública
  Dado que una comunidad es pública
  Cuando pulso Unirme
  Entonces paso a ser miembro

@RN-17
Escenario: PA-30-02 · Solicitar acceso a una comunidad privada
  Dado que una comunidad es privada
  Cuando pulso Solicitar acceso
  Entonces se envía una solicitud a sus administradores

@RF
Escenario: PA-30-03 · Abandonar una comunidad
  Dado que soy miembro de una comunidad
  Cuando la abandono
  Entonces dejo de ser miembro
```

---

### HU-31 · Gestionar invitaciones y solicitudes

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-31 | 8 puntos | Could | HU-11, HU-30 |

> **Como** administrador de una comunidad  
> **quiero** invitar a usuarios y responder a las solicitudes de acceso  
> **para** controlar quién entra en ella.

**Clasificación:** RF · RI-13, RI-17 · RN-17

**Reglas de negocio asociadas**
- RN-17 · En una comunidad privada se entra por invitación o mediante solicitud aprobada.

```gherkin
@RF @RN-17
Escenario: PA-31-01 · Invitación a un usuario
  Dado que administro una comunidad
  Cuando invito a un usuario
  Entonces recibe una invitación que puede aceptar o rechazar

@RF
Escenario: PA-31-02 · Solicitud aceptada
  Dado que hay una solicitud de acceso pendiente
  Cuando la acepto
  Entonces el usuario pasa a ser miembro
  Y recibe una notificación

@RF
Escenario: PA-31-03 · Solicitud rechazada
  Dado que hay una solicitud de acceso pendiente
  Cuando la rechazo
  Entonces el usuario no se añade
  Y recibe una notificación
```

---

### HU-32 · Gestionar miembros y administradores

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-32 | 5 puntos | Could | HU-30 |

> **Como** administrador de una comunidad  
> **quiero** expulsar a miembros y nombrar a otros administradores  
> **para** mantener el buen funcionamiento de la comunidad.

**Clasificación:** RF · RI-13 · RN-04, RN-17 · RNF-02

**Reglas de negocio asociadas**
- RN-04 · Una comunidad siempre tiene al menos un administrador.
- RN-17 · Un usuario expulsado no puede volver a solicitar el acceso.

```gherkin
@RF @RN-17
Escenario: PA-32-01 · Expulsión de un miembro
  Dado que un miembro incumple las normas
  Cuando lo expulso
  Entonces deja de ser miembro
  Y no puede volver a solicitar el acceso

@RF
Escenario: PA-32-02 · Nombrar a otro administrador
  Dado que quiero compartir la gestión de la comunidad
  Cuando nombro administrador a un miembro
  Entonces obtiene los mismos permisos de administración que yo

@RN-04
Escenario: PA-32-03 · Último administrador intenta abandonar
  Dado que soy el único administrador
  Cuando intento abandonar la comunidad
  Entonces el sistema me pide nombrar antes a otro administrador
```

---

### HU-33 · Publicar en una comunidad

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-33 | 5 puntos | Could | HU-30 |

> **Como** miembro de una comunidad  
> **quiero** publicar mensajes y compartir canciones y álbumes  
> **para** conversar sobre música con el resto de miembros.

**Clasificación:** RF · RI-14 · RN-17

**Reglas de negocio asociadas**
- RN-17 · Las publicaciones de una comunidad privada solo las ven sus miembros.

```gherkin
@RF
Escenario: PA-33-01 · Publicación con una canción
  Dado que pertenezco a una comunidad
  Cuando publico un mensaje con una canción
  Entonces lo ven todos sus miembros

@RF
Escenario: PA-33-02 · Eliminación de mi publicación
  Dado que he publicado un mensaje
  Cuando lo elimino
  Entonces deja de verse en la comunidad

@RN-17
Escenario: PA-33-03 · No miembro de una comunidad privada
  Dado que no soy miembro de una comunidad privada
  Cuando intento ver sus publicaciones
  Entonces el sistema no me las muestra
```

---

### HU-38 · Denunciar una publicación

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-38 | 2 puntos | Could | HU-33 |

> **Como** miembro de una comunidad  
> **quiero** denunciar una publicación que incumple sus normas  
> **para** que los administradores de la comunidad la revisen.

**Clasificación:** RF · RI-15, RI-17 · RN-18

**Reglas de negocio asociadas**
- RN-18 · No se puede denunciar dos veces el mismo contenido; las denuncias de publicaciones las resuelven los administradores de la comunidad.

```gherkin
@RF @RN-18
Escenario: PA-38-01 · Denuncia de una publicación
  Dado que veo una publicación ofensiva en una comunidad
  Cuando la denuncio indicando un motivo
  Entonces los administradores de la comunidad reciben una notificación con la denuncia

@RN-18
Escenario: PA-38-02 · Denuncia repetida
  Dado que ya he denunciado esa publicación
  Cuando intento denunciarla de nuevo
  Entonces el sistema me indica que ya está en revisión
```

---

### HU-39 · Moderar las publicaciones de una comunidad

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-39 | 3 puntos | Could | HU-38 |

> **Como** administrador de una comunidad  
> **quiero** revisar las denuncias y eliminar las publicaciones que incumplen las normas  
> **para** mantener un ambiente respetuoso en la comunidad.

**Clasificación:** RF · RI-14, RI-15, RI-17 · RN-18 · RNF-02

**Reglas de negocio asociadas**
- RN-18 · Las denuncias de publicaciones las resuelven los administradores de la comunidad.

```gherkin
@RF
Escenario: PA-39-01 · Consulta de denuncias de la comunidad
  Dado que hay denuncias pendientes en mi comunidad
  Cuando accedo a ellas
  Entonces las veo con la publicación denunciada y su motivo

@RF @RN-18
Escenario: PA-39-02 · Eliminación de una publicación
  Dado que una publicación incumple las normas
  Cuando la elimino
  Entonces deja de verse en la comunidad
  Y su autor recibe una notificación

@RF
Escenario: PA-39-03 · Denuncia no válida
  Dado que una denuncia no es válida
  Cuando la rechazo
  Entonces la publicación se mantiene
  Y la denuncia se marca como resuelta
```

---

### HU-16 · Acceder a funciones premium · fuera del alcance

| Identificador | Estimación | Prioridad MoSCoW | Dependencias |
| --- | --- | --- | --- |
| HU-16 | – | Won't | – |

> **Como** usuario premium  
> **quiero** consultar estadísticas personalizadas de mi actividad  
> **para** conocer mejor mis hábitos musicales.

Esta historia queda fuera del alcance de la versión actual, por lo que no se definen sus criterios de aceptación ni se clasifica.
