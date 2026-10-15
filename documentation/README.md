# David López Borrego — Portafolio cinematográfico

Web estática en español, sin instalación ni compilación. En el proyecto completo, la carpeta `dist` contiene la web y todos sus recursos. El ZIP descargable pone `index.html`, `style.css`, `app.js` y `assets` directamente en su raíz, y esta documentación en `documentation`.

Para una vista previa local, abre una terminal en la carpeta que contiene `index.html`, ejecuta `python -m http.server 8000` y visita `http://localhost:8000`. También puedes alojar esa carpeta en cualquier servicio de alojamiento estático.

## Contenido

- Escenario de ciencia ficción original con un portal circular completo, navegación por capítulos y atmósfera animada.
- Biografía y 2.º de Bachillerato en el Colegio Claver de Lleida.
- DaLogic como proyecto personal real de2.º de Bachillerato, con acceso a su repositorio; Órbita y Nexo permanecen como experimentos de ejemplo.
- Pestañas de estudios y trabajo y certificado B2 de inglés. Entidad emisora, fecha y diploma no facilitados; no se han inventado.
- «Un portal a los recuerdos» abre recuerdos.html: una experiencia independiente por una sola etapa en el Colegio Claver de Lleida, desde la infancia hasta2.º de Bachillerato. El camino avanza con el desplazamiento, los gestos y el teclado. DaLogic aparece en el momento del curso en que David lo sitúa.
- El recuerdo del proyecto incorpora una pequeña demostración AND. Está identificada como demostración del principio lógico y enlaza al programa completo en GitHub.
- Email y teléfono reales, con enlaces directos y botón de copiar email.
- Sonido ambiental original opcional, control de movimiento y compatibilidad con movimiento reducido.
- Diseño adaptable, controles de teclado y diálogos con gestión del foco.

## Cambiar proyectos y certificados

En `dist/index.html`, las tarjetas de `.project-grid` distinguen DaLogic del material de ejemplo. En `dist/app.js`, el objeto `projects` contiene la descripción, las etiquetas y el estado real/ejemplo del proyecto. El diálogo de DaLogic incorpora el enlace verificado al repositorio.

En `dist/recuerdos.html`, las secciones internas son momentos de UNA etapa en el Claver, no centros o etapas adicionales. La infancia y los años de colegio no incluyen fechas ni anécdotas inventadas. El momento actual continúa abierto en2.º de Bachillerato. Se pueden incorporar recuerdos y otros proyectos cuando David los facilite, manteniendo su contexto cronológico.

La sección `#certificados` incorpora el certificado B2 de inglés confirmado por David. No se han inventado entidad emisora, fecha ni experiencia laboral. El documento del certificado puede añadirse cuando esté disponible.

## Archivos

- `dist/index.html`: contenido y estructura.
- `dist/style.css`: diseño, comportamiento adaptable y movimiento.
- `dist/app.js`: navegación, filtros, diálogos, audio y escenas Canvas.
- `dist/recuerdos.html`, `recuerdos.css`, `recuerdos.js`: recorrido cinematográfico independiente, cronología, fotografía del campus, atmósfera, progreso y demostración lógica.
- `dist/memory-entry.css`: entrada al recorrido desde el portafolio y portada de DaLogic.
- `dist/assets/`: tipografías alojadas localmente, favicon y paisaje optimizado.
- `umbral-world-original.png`: original de la imagen generada.
- `umbral-world-v2-original.png`: imagen revisada con abertura circular completa, usada como `dist/assets/umbral-world-v2.webp`.
- `image-prompt.txt`: prompt exacto y procedencia del paisaje.
- `memory-sources.json`: procedencia de la fotografía institucional del Claver y fuentes verificadas de DaLogic.
- `PRODUCT.md`, `DESIGN.md` y `.impeccable/design.json`: contexto del producto y sistema visual.

## Privacidad y datos

La web no incorpora analítica, formularios de envío ni almacenamiento de visitas. Los enlaces de contacto abren las aplicaciones del visitante. El sonido se inicia únicamente al pulsar el control correspondiente.

Las fuentes Space Grotesk y DM Sans proceden de Google Fonts y se distribuyen bajo SIL Open Font License. Sus licencias se incluyen en `dist/assets/licenses/`.

El recorrido de recuerdos tiene su propio documento y no carga la navegación, scripts ni sonido del portafolio. El enlace persistente «Salir de los recuerdos» devuelve a la entrada del portafolio. La narración se recorre con scroll nativo; sus botones se reservan al sonido, pausa, fuentes, principio y demostración. El fondo mantiene una misma fotografía real del campus, con encuadre ligado al avance. El movimiento reducido y la pausa detienen cámara y atmósfera. El audio requiere activación y se suspende al ocultar la pestaña. Los créditos identifican la fotografía institucional de Jesuïtes Lleida; no se presenta como foto personal de la infancia de David. La etapa no se marca como finalizada.

## Validación

Comprobado en Chrome: filtros, apertura/cierre de proyectos y devolución del foco, pestañas con teclado, sonido, pausa del movimiento, menú móvil y preferencias de movimiento reducido. Sin desbordamientos horizontales a 320, 390, 768, 1440 y 1920 píxeles. Sin errores de JavaScript ni recursos HTTP ausentes durante esas pruebas.


Voluntariados facilitados por David: curso2025–2026, ayudante en Moda re- / Troballes (Lleida Anselm Clavé); curso2026–2027, profesor de repaso en primaria en Escola Ciutat Jardí de Lleida. Nombres verificados en las webs oficiales y enlazados en la trayectoria. El B2 conserva toda su información dentro de un marco rectangular completo.

Trayectoria: tres pestañas independientes, Estudios, Trabajo y Voluntariado. Trabajo queda pendiente de información laboral; los dos voluntariados se mantienen en su pestaña propia.
