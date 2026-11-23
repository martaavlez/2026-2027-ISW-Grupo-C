# Requisitos

Esta carpeta contiene el Product Backlog clasificado. Cada historia de usuario se clasifica según su funcionalidad principal, y todas son requisitos funcionales (RF). Los requisitos de información, las reglas de negocio y los requisitos no funcionales se describen aparte y se relacionan con las historias de las que salen en la matriz de trazabilidad.

| Tipo | Qué describe | Dónde está |
| --- | --- | --- |
| **RF** · Requisitos funcionales | Qué hace el sistema. Cada historia de usuario es un requisito funcional. | [fichas-hu.md](fichas-hu.md) |
| **RI** · Requisitos de información | Qué datos guarda el sistema | [requisitos-de-informacion.md](requisitos-de-informacion.md) |
| **RN** · Reglas de negocio | Bajo qué condiciones y límites funciona el sistema | [reglas-de-negocio.md](reglas-de-negocio.md) |
| **RNF** · Requisitos no funcionales | Calidad y restricciones técnicas medibles | [requisitos-no-funcionales.md](requisitos-no-funcionales.md) |
| Trazabilidad | Qué requisitos salen de cada historia, y al revés | [trazabilidad.md](trazabilidad.md) |

## Resumen del backlog

| Épica | Historias | Puntos |
| --- | --- | --- |
| 1 · Acceso y cuentas | HU-01, HU-02, HU-17, HU-18, HU-19, HU-37 | 25 |
| 2 · Catálogo y búsqueda | HU-03, HU-04, HU-59, HU-20, HU-21, HU-22, HU-40, HU-57 | 39 |
| 3 · Reseñas y valoraciones | HU-05, HU-23, HU-08, HU-47, HU-36, HU-13, HU-44 | 22 |
| 4 · Perfil y red social | HU-06, HU-45, HU-24, HU-43, HU-10, HU-48, HU-41, HU-58, HU-42, HU-35, HU-56 | 28 |
| 5 · Organización de la música | HU-07, HU-46, HU-09, HU-25, HU-49, HU-26, HU-50, HU-34, HU-27 | 18 |
| 6 · Descubrimiento | HU-11, HU-12, HU-15, HU-28 | 26 |
| 7 · Comunidades | HU-14, HU-29, HU-51, HU-30, HU-52, HU-53, HU-31, HU-54, HU-32, HU-55, HU-33, HU-38, HU-39 | 29 |
| **Total** | 58 historias dentro del alcance | 187 |

| Prioridad | Historias | Puntos |
| --- | --- | --- |
| Must | 14 | 50 |
| Should | 26 | 84 |
| Could | 18 | 53 |
| Won't | 1 (HU-16, funciones premium) | – |

En total hay 21 requisitos de información, 25 reglas de negocio, 11 requisitos no funcionales y 133 pruebas de aceptación.

Las pruebas de aceptación de cada historia, escritas en Gherkin y con la etiqueta de lo que verifica cada escenario, están en [fichas-hu.md](fichas-hu.md), donde cada ficha recoge su identificación, la historia, su clasificación y sus pruebas de aceptación.
