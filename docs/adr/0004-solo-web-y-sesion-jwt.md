# ADR-0004. APLICACIÓN SOLO WEB CON SESIÓN MEDIANTE JWT

**Estado:** Aceptado
**Fecha:** 23/11/2026
**Sustituye a:** [ADR-0001](0001-estilo-arquitectonico.md)
**Requisitos relacionados:** RNF-01, RNF-02, RNF-11

## 1. Contexto

Durante el diseño se tuvieron en cuenta la aplicación móvil y la web, pero para la entrega final el equipo ha decidido ofrecer solo la web, que funciona en el ordenador y en el navegador del móvil con una sola dirección. Hay que decidir también cómo se mantiene la sesión del usuario entre peticiones.

## 2. Alternativas consideradas

- **Opción A. Sesiones guardadas en el servidor:** la API guarda el estado de cada sesión y la web envía una cookie con su identificador.
- **Opción B. Token JWT:** al iniciar sesión, la API entrega un token firmado con los datos necesarios y una caducidad; la API lo comprueba en cada petición sin guardar nada.

## 3. Decisión

Se adopta una **única aplicación web adaptable** que consume la API REST común, y la **opción B: sesión mediante token JWT** firmado con una caducidad de 24 horas. La API sigue comprobando en el servidor el rol y la privacidad de cada contenido (RNF-02).

## 4. Consecuencias

**Positivas:**

- Desaparece el contenedor de la aplicación móvil y se simplifican el desarrollo y las pruebas.
- Una sola dirección web para todos los dispositivos.
- La API no tiene que guardar el estado de las sesiones.

**Negativas:**

- Un token no se puede anular antes de que caduque.
- No hay aplicación instalable ni funciones propias del móvil.

**Medidas de mitigación:**

- Caducidad corta del token; al cerrar sesión, el token se elimina del navegador.
- Diseño adaptable probado en un móvil de 390 px de ancho (RNF-01).
