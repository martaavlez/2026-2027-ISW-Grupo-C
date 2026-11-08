# Informe de Pruebas de Usabilidad (Sprint 1)

## 1. Perfil de los Participantes
Las pruebas se han realizado con 3 usuarios potenciales que representan distintos segmentos del público objetivo de la plataforma: dos perfiles jóvenes habituados al uso de redes sociales, y un perfil adulto muy aficionado a la música. Ninguno de los participantes tenía experiencia previa con el prototipo ni conocía el modelo de datos o las reglas de negocio.

## 2. Resultados de las Tareas
Se plantearon 5 tareas principales basadas en las Historias de Usuario clave. A continuación se resume el desempeño tras consolidar los resultados de los 3 participantes:

- **Registro y configuración:** Completada (100% de éxito). Tiempo medio: 1 minuto y 40 segundos. No surgieron dudas y el flujo fue percibido como muy rápido.
- **Búsqueda y reseña:** Completada (100% de éxito). Tiempo medio: 2 minutos y 20 segundos. Sin incidencias. La funcionalidad resulta intuitiva y directa.
- **Interacción en el feed:** Completada (100% de éxito). Tiempo medio: 2 minutos y 40 segundos. Surgieron dudas sobre el origen de las comunidades (si las crea el usuario o vienen por defecto con la aplicación). Además, a la hora de navegar por el prototipo, algunos enlaces resultaban poco claros y dirigían a pantallas inesperadas.
- **Curación de contenido (Tableros):** Completada mayoritariamente (2 usuarios sin ayuda, 1 con ayuda). Tiempo medio: 2 minutos y 35 segundos. Se detectó confusión conceptual inicial sobre qué es exactamente un "tablero" y para qué sirve.
- **Conexión social:** Completada (100% de éxito). Tiempo medio: 1 minuto y 28 segundos. Se detectaron errores de navegación en el prototipo: el perfil de una usuaria de los resultados de búsqueda redirigía al de otro usuario. Además, al pulsar "Seguir", la pantalla siguiente indicaba "Solicitud de amistad enviada", confundiendo dos acciones que según los requisitos son distintas.

## 3. Problemas Encontrados y Cambios a Aplicar en Figma
Los problemas detectados se han ordenado por gravedad para facilitar su corrección en el prototipo interactivo:

### Gravedad Alta (Errores funcionales y de navegación)

**Problema 1 (Flujo de Seguimiento vs. Amistad):** Al hacer clic en el botón "Seguir", el prototipo notifica que se ha enviado una solicitud de amistad. Esto incumple las reglas de negocio, ya que seguir y ser amigo son acciones separadas.

**Cambio a aplicar:** Modificar el flujo del botón "Seguir" en Figma para que únicamente cambie de estado (por ejemplo, a "Siguiendo"), eliminando la pantalla o mensaje de "Solicitud de amistad enviada".

**Problema 2 (Enlaces y áreas de clic erróneas):** El perfil de una usuaria de los resultados de búsqueda enlaza accidentalmente al de otro usuario, y hay enlaces en el feed de comunidades que resultan confusos.

**Cambio a aplicar:** Revisar la pestaña Prototype en Figma para redirigir el clic de esa usuaria a su perfil correcto y reajustar las áreas clicables del feed de comunidades para evitar saltos accidentales a otras pantallas.

### Gravedad Media (Comprensión y contexto)

**Problema 3 (Falta de contexto en Tableros):** El concepto de "tablero" no se entiende a priori y requiere asistencia.

**Cambio a aplicar:** Añadir un breve texto descriptivo en la pantalla principal de Tableros (especialmente cuando está vacía) explicando su uso. Por ejemplo: "Crea tableros personalizados para organizar y guardar tus canciones y álbumes favoritos".

**Problema 4 (Falta de contexto en Comunidades):** Los usuarios no tienen claro si las comunidades las crea la plataforma o ellos mismos.

**Cambio a aplicar:** Incluir un subtítulo o mensaje de ayuda en la sección de Comunidades que aclare su funcionamiento. Por ejemplo: "Únete a las comunidades existentes o crea la tuya propia para compartir música".

## 4. Conclusiones y Preguntas Finales
El prototipo es percibido como muy completo, rápido e intuitivo, destacando especialmente la facilidad para organizar la música (una vez entendido el concepto de tablero). Ningún usuario sintió la necesidad de reubicar botones o menús, lo que valida la arquitectura de la información actual. Las modificaciones a realizar en Figma se centrarán exclusivamente en corregir los dos errores de enlazado detectados y en añadir textos de apoyo para clarificar los conceptos de Tableros y Comunidades desde el primer momento.
