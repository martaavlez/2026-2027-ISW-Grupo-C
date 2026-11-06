# ADR-0003. REVISIÓN DEL CATÁLOGO MUSICAL MEDIANTE UN AGENTE DE IA SUPERVISADO

**Estado:** Aceptado  
**Fecha:** 06/11/2026  
**Requisitos relacionados:** RN-22, RNF-07 · HU-21, HU-22

## 1. Contexto

El proceso de importación del catálogo musical puede incorporar registros duplicados, incompletos o con información inconsistente.

Una revisión exclusivamente manual supondría una carga de trabajo considerable para los administradores, especialmente a medida que aumente el volumen de canciones, álbumes y artistas.

Sin embargo, permitir que un agente de inteligencia artificial modifique el catálogo sin supervisión podría introducir errores o alterar información correcta.

Por ello, se necesita un mecanismo que combine la automatización de las revisiones con el control administrativo.

## 2. Alternativas consideradas

- **Opción A. Revisión manual:** los administradores comprueban y corrigen todos los posibles errores del catálogo.
- **Opción B. Agente de IA autónomo:** el agente identifica y corrige automáticamente los errores sin intervención administrativa.
- **Opción C. Agente de IA supervisado:** el agente analiza el catálogo, aplica únicamente correcciones consideradas seguras y remite los casos dudosos al administrador.

## 3. Decisión

Se adopta la **opción C: utilizar un agente de inteligencia artificial supervisado por el administrador**.

El agente participará en la revisión de los datos importados para detectar posibles duplicados, registros incompletos e inconsistencias.

Cuando una corrección cumpla las reglas de seguridad establecidas, podrá aplicarse automáticamente, dejando constancia del cambio realizado.

Si el problema no puede resolverse de forma segura, se generará una incidencia pendiente. El administrador revisará la incidencia y decidirá si corresponde corregir, eliminar o conservar el elemento.

De esta forma, la automatización agilizará el mantenimiento del catálogo sin sustituir la supervisión humana.

## 4. Consecuencias

**Positivas:**

- Reducción del esfuerzo de revisión manual.
- Detección más rápida de inconsistencias y posibles errores.
- Mejora de la calidad de los datos musicales.
- Mayor capacidad para revisar catálogos de gran volumen.
- Mantenimiento de la supervisión administrativa sobre los casos dudosos.

**Negativas:**

- Posibilidad de detecciones incorrectas o propuestas de corrección inadecuadas.
- Mayor complejidad de integración y mantenimiento.
- Necesidad de definir reglas claras por seguridad.

**Medidas de mitigación:**

- Limitar las correcciones automáticas a casos previamente definidos como seguros.
- Registrar los cambios realizados por el agente para facilitar su seguimiento.
- Remitir los casos ambiguos a una bandeja de incidencias para revisión humana.
- Mantener la capacidad del administrador para corregir, descartar o eliminar elementos.
