# ADR-0002. ALMACENAMIENTO DEL CATÁLOGO MUSICAL EN UNA BASE DE DATOS PROPIA

**Estado:** Aceptado  
**Fecha:** 06/11/2026  
**Requisitos relacionados:** RNF-05, RNF-06, RN-21 · HU-20

## 1. Contexto

La plataforma necesita disponer de un catálogo musical compuesto por artistas, álbumes y canciones, cuya información procede de una fuente musical externa.

Este contenido constituye la base de funcionalidades como la búsqueda, las valoraciones, las reseñas, los favoritos, los tableros y los rankings personales.

La consulta directa y constante a la fuente externa supondría depender de su disponibilidad, tiempos de respuesta y posibles limitaciones de acceso. Además, la plataforma necesita gestionar correcciones propias y evitar que los elementos eliminados por un administrador vuelvan a incorporarse automáticamente.

## 2. Alternativas consideradas

- **Opción A. Consulta directa a la fuente externa:** recuperar la información musical mediante peticiones a la API externa cada vez que sea necesaria.
- **Opción B. Base de datos propia:** importar periódicamente los datos musicales y almacenarlos en una base de datos gestionada por la plataforma.

## 3. Decisión

Se adopta la **opción B: importar y almacenar el catálogo musical en una base de datos propia**.

Se establecerá un proceso de importación periódica encargado de incorporar nuevos elementos y actualizar los existentes sin generar duplicados.

Los elementos conservarán su identificador externo para facilitar su actualización. Asimismo, se registrarán los elementos excluidos por decisión administrativa para impedir su futura reimportación.

Las aplicaciones web y móvil consultarán el catálogo almacenado mediante la API común definida en el ADR-0001.

## 4. Consecuencias

**Positivas:**

- Mayor independencia respecto a la disponibilidad de la fuente externa.
- Mejora de los tiempos de respuesta en las consultas.
- Mayor control sobre la información almacenada.
- Posibilidad de realizar correcciones y gestionar exclusiones administrativas.

**Negativas:**

- Mayor necesidad de almacenamiento y mantenimiento.
- Posibles diferencias temporales entre la fuente externa y los datos locales.
- Necesidad de implementar procesos de importación, actualización y control de duplicados.
- Mayor responsabilidad sobre la integridad y consistencia de la información.

**Medidas de mitigación:**

- Establecer importaciones periódicas con mecanismos de validación.
- Identificar los elementos mediante identificadores externos únicos.
- Registrar los errores y reintentar la importación cada hora cuando falle la fuente externa.
- Conservar el catálogo existente si una importación no puede completarse correctamente.

