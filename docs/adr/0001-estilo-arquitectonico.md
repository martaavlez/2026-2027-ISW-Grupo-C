# ADR-0001. ARQUITECTURA CON API COMÚN PARA WEB Y MÓVIL

**Estado:** Aceptado  
**Fecha:** 06/11/2026  
**Requisitos relacionados:** RNF-01, RNF-02

## 1. Contexto

La plataforma social musical dispondrá de una aplicación móvil y una versión web. Es necesario garantizar que las dos aplicaciones compartan los mismos datos, reglas de negocio y mecanismos de autenticación y autorización.

## 2. Alternativas consideradas

- **Opción A. Backends independientes:** desarrollar un servidor diferente para cada aplicación, con su propia lógica de negocio y acceso a datos.
- **Opción B. API común:** utilizar un único backend que proporcione los servicios necesarios a las aplicaciones web y móvil mediante una API REST.

## 3. Decisión

Se adopta la **opción B: arquitectura cliente-servidor con una API REST común** para ambas aplicaciones.

La API centralizará la lógica de negocio, la autenticación, la gestión de permisos y el acceso a la base de datos. Las aplicaciones web y móvil actuarán como clientes independientes que consumirán los mismos servicios.

Esta solución permite mantener un comportamiento uniforme y evitar la duplicación de lógica entre plataformas.

## 4. Consecuencias

**Positivas:**

- Reutilización de la lógica de negocio entre web y móvil.
- Mayor consistencia de los datos y las reglas de funcionamiento.
- Reducción del esfuerzo de desarrollo y mantenimiento.

**Negativas:**

- Dependencia de ambas aplicaciones respecto a la disponibilidad de la API.
- Posibilidad de que un problema en el backend afecte simultáneamente a los dos clientes.

**Medidas de mitigación:**

- Establecer mecanismos de seguridad, monitorización y control de errores.
- Mantener API estables y gestionar su evolución mediante versionado cuando sea necesario.
