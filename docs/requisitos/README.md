# Requisitos

Esta carpeta contiene el Product Backlog clasificado del Sprint 1. Cada historia de usuario se ha analizado para identificar qué tipos de requisito contiene, siguiendo la clasificación del Tema 3:

| Tipo | Qué describe | Dónde está | Qué alimenta |
| --- | --- | --- | --- |
| **RF** · Requisitos funcionales | Qué hace el sistema. Cada historia de usuario es un requisito funcional. | [fichas-hu.md](fichas-hu.md) | Flujos y prototipo en Figma |
| **RI** · Requisitos de información | Qué datos guarda el sistema: entidades, atributos, restricciones y relaciones | [requisitos-de-informacion.md](requisitos-de-informacion.md) | Modelo de datos |
| **RN** · Reglas de negocio | Bajo qué condiciones y límites funciona el sistema | [reglas-de-negocio.md](reglas-de-negocio.md) | Restricciones e invariantes del modelo de datos |
| **RNF** · Requisitos no funcionales | Cómo funciona el sistema: calidad y restricciones técnicas medibles | [requisitos-no-funcionales.md](requisitos-no-funcionales.md) | Contenedores C4 y ADR |

La relación entre historias, requisitos, pruebas de aceptación, pantallas y contenedores está en la [matriz de trazabilidad](trazabilidad.md).

## Cómo leer una ficha

Cada ficha incluye:

- **Identificador, título, estimación, prioridad MoSCoW y dependencias.** Las dependencias son las historias que deben estar terminadas antes.
- **La historia** en formato «Como… quiero… para…».
- **La clasificación:** qué requisitos de información usa, qué reglas de negocio debe cumplir y qué requisitos no funcionales le afectan.
- **Las pruebas de aceptación en Gherkin.** Cada escenario tiene un identificador (PA-número de historia-número de escenario) y una etiqueta que indica qué verifica: `@RF` para la funcionalidad, o `@RN-xx` / `@RNF-xx` para una regla de negocio o un requisito no funcional concreto. Cada historia cubre el flujo principal y los casos de error, y las reglas con valores numéricos se prueban justo en el límite.

## Resumen del backlog

| Épica | Historias | Puntos |
| --- | --- | --- |
| 1 · Acceso y cuentas | HU-01, HU-02, HU-17, HU-18, HU-19, HU-37 | 25 |
| 2 · Catálogo y búsqueda | HU-03, HU-04, HU-20, HU-21, HU-22, HU-40 | 39 |
| 3 · Reseñas y valoraciones | HU-05, HU-23, HU-08, HU-36, HU-13, HU-44 | 22 |
| 4 · Perfil y red social | HU-06, HU-24, HU-43, HU-10, HU-41, HU-42, HU-35 | 28 |
| 5 · Organización de la música | HU-07, HU-09, HU-25, HU-26, HU-34, HU-27 | 18 |
| 6 · Descubrimiento | HU-11, HU-12, HU-15, HU-28 | 26 |
| 7 · Comunidades | HU-14, HU-29, HU-30, HU-31, HU-32, HU-33, HU-38, HU-39 | 34 |
| **Total** | **43 historias dentro del alcance** | **192** |

| Prioridad | Historias | Puntos |
| --- | --- | --- |
| Must | 11 | 50 |
| Should | 19 | 84 |
| Could | 13 | 58 |
| Won't | 1 (HU-16, funciones premium) | – |

En total hay 20 requisitos de información, 25 reglas de negocio, 10 requisitos no funcionales y 131 pruebas de aceptación.

## Definición de Hecho

Una historia de usuario se considera terminada cuando:

- Todas sus pruebas de aceptación se cumplen.
- Sus pantallas están en el prototipo de Figma y se pueden recorrer.
- Está relacionada en la matriz de trazabilidad con su pantalla y su contenedor C4.
- Los cambios se han subido mediante un pull request revisado por otra integrante del equipo.
- La documentación de esta carpeta está actualizada.
