# Arquitectura Hexagonal con Monolito Modular

## Estado

Aceptada

## Fecha

2026-08-20

## Contexto

El sistema de gestion de microcredito necesita mantener las reglas financieras y de cartera independientes de mecanismos externos como HTTP, bases de datos, interfaces de usuario o servicios de terceros. El alcance actual corresponde al nucleo del Proyecto 1 y debe favorecer calculos deterministas, pruebas aisladas y una evolucion gradual, sin introducir todavia la complejidad operacional de un sistema distribuido.

Las reglas de dominio -dinero, amortizacion, mora, pagos, estados y cartera- concentran el mayor riesgo del producto. Por ello, las dependencias tecnicas no deben condicionar su diseno ni su capacidad de verificacion.

## Decision

Se adopta una **Arquitectura Hexagonal organizada como Monolito Modular**.

- El dominio ocupa el centro y no depende de infraestructura, frameworks ni canales de entrada.
- Los casos de uso de aplicacion orquestan el flujo; las decisiones de negocio permanecen en el dominio.
- Los contratos requeridos por el nucleo se expresan como puertos y seran implementados por adaptadores externos.
- Los modulos mantienen limites explicitos, aunque se compilan y despliegan como una sola unidad.
- Los calculos financieros se modelan como operaciones puras con entradas explicitas.
- El tiempo y otras fuentes externas se acceden mediante abstracciones controlables cuando sean necesarias.

## Alternativas consideradas

### Arquitectura tradicional por capas

Ofrece una estructura conocida y sencilla al inicio, pero suele permitir que el dominio dependa de persistencia, frameworks o modelos de transporte. Se descarte porque eleva el riesgo de acoplar las reglas financieras a decisiones tecnicas.

### Microservicios

Permitirian despliegue y escalado independientes por capacidad. Se descartaron para el alcance actual debido al coste de operacion, observabilidad, comunicacion remota y consistencia distribuida, que no aporta un beneficio proporcional en esta etapa.

### Monolito modular sin puertos ni adaptadores

Conserva un despliegue simple y cierta separacion interna. Se descarte como decision principal porque los limites dependerian unicamente de convenciones y no protegerian suficientemente al nucleo frente a infraestructura y canales externos.

## Consecuencias

### Beneficios

- El dominio puede probarse sin servidor, base de datos ni servicios externos.
- Los adaptadores pueden sustituirse sin reescribir las reglas de negocio.
- Un solo despliegue simplifica la operacion y las transacciones del alcance actual.
- Los limites modulares facilitan ubicar responsabilidades y controlar dependencias.
- Las reglas financieras permanecen deterministas y auditables.

### Desventajas y trade-offs

- La separacion exige disciplina continua para impedir dependencias hacia afuera.
- Puertos, adaptadores y mapeos agregan estructura y codigo incluso en flujos sencillos.
- El sistema se despliega y escala como una unidad mientras conserve esta arquitectura.
- Una futura extraccion a microservicios sera posible, pero no automatica ni gratuita.
- Los limites modulares deben verificarse mediante revision y pruebas; el monolito por si solo no los garantiza.