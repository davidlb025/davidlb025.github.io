---
name: "Umbral — David López Borrego"
description: "Un portafolio cinematográfico continuo, entre paisaje monumental y archivo personal."
colors:
  bg: "#10110f"
  fg: "#f1eee7"
  muted: "#b4b1a8"
  dim: "#96958a"
  accent: "#e5b77d"
  line: "rgba(235,224,201,.18)"
typography:
  display:
    fontFamily: "Space,sans-serif"
    fontSize: "clamp(64px,6.5vw,96px)"
    fontWeight: 500
    lineHeight: 1.01
    letterSpacing: "-.04em"
  headline:
    fontFamily: "Space,sans-serif"
    fontSize: "clamp(42px,4.7vw,68px)"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-.04em"
  title:
    fontFamily: "Space,sans-serif"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1.06
    letterSpacing: "-.02em"
  body:
    fontFamily: "DM,sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  story:
    fontFamily: "DM,sans-serif"
    fontSize: "14px"
    lineHeight: 1.95
  label:
    fontFamily: "DM,sans-serif"
    fontSize: "8px"
    letterSpacing: ".16em"
rounded:
  circle: "50%"
spacing:
  icon-gap: "8px"
  small-gap: "10px"
  detail-gap: "20px"
  grid-gap: "30px"
  section-inline: "10.4%"
  section-block: "110px"
  mobile-inline: "8%"
  mobile-block: "75px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#171a14"
    padding: "17px 23px"
  text-link:
    textColor: "{colors.fg}"
    padding: "8px 0"
  project-filter:
    textColor: "{colors.muted}"
    padding: "14px 0"
  project-filter-active:
    textColor: "{colors.accent}"
    padding: "14px 0"
  project-card:
    padding: "0"
  dialog-tag:
    textColor: "{colors.muted}"
    padding: "4px 10px"
  dialog-close:
    backgroundColor: "#0e130cbb"
    textColor: "{colors.fg}"
    rounded: "{rounded.circle}"
    height: "44px"
    width: "44px"
---

# Design System: Umbral — David López Borrego

## Overview

**Creative North Star: "El umbral de una historia"**

Un paisaje fotorealista de escala monumental abre un portafolio personal con atmósfera de película y videojuego. La luz cálida del portal, el carbón verdoso y el texto marfil forman una experiencia sobria y exploratoria. El paisaje de apertura es el ancla visual; los contenidos se leen como capítulos de una misma historia. La imagen actual, `assets/umbral-world-v2.webp`, presenta una abertura completamente circular.

El modo es **Experience**, en web y en español. La interfaz combina titulares amplios con anotaciones pequeñas, líneas finas y amplios espacios. La profundidad nace del paisaje, las veladuras y las escenas Canvas y el recorrido fotográfico de recuerdos. El movimiento acompaña la exploración, con sonido voluntario y controles para detener la atmósfera.

Esta documentación se ha extraído de `dist/index.html`, `dist/style.css`, `dist/app.js`, `dist/memory-entry.css`, `dist/recuerdos.html`, `dist/recuerdos.css` y `dist/recuerdos.js`, con `PRODUCT.md` como contexto. La implementación es la autoridad visual: no existe una composición aprobada independiente. La extracción es de código; no se ha realizado muestreo de estilos computados con el motor de diseño.

**Key Characteristics:**
- Paisaje monumental compartido y recorrido continuo por capítulos.
- Carbón verdoso, marfil y ámbar cálido.
- Titulares geométricos y detalles editoriales pequeños.
- Superficies rectas, filetes finos y círculos reservados a controles y geometría.
- Escenas interactivas, sonido voluntario y movimiento controlable.

## Colors

La paleta enlaza la oscuridad del paisaje con señales cálidas y texto de alto protagonismo. Los seis colores del frontmatter corresponden a las variables de `:root`; no hay una escala tonal de producción.

### Primary
- **Ámbar del portal — accent:** énfasis en titulares, botón principal, monograma, nodos, iconos, selección, indicadores activos y foco. El título del prólogo conserva su énfasis en marfil; los demás titulares usan ámbar en sus fragmentos destacados.

### Neutral
- **Carbón del mundo — bg:** fondo general, marcos y contraste oscuro sobre acciones cálidas.
- **Marfil del relato — fg:** títulos, identidad y acciones legibles.
- **Piedra clara — muted:** párrafos y estados secundarios.
- **Piedra tenue — dim:** metadatos, contadores y notas auxiliares.
- **Filete de archivo — line:** divisores y contornos discretos con transparencia sobre las superficies.

Las secciones usan fondos locales verdosos oscuros y degradados observados en el CSS, sin convertir cada veladura en un nuevo token global. Los ejemplos de proyecto Órbita y Nexo incorporan sus propios fondos y geometría dentro de esta familia cálida.

**The Portal Light Rule.** El ámbar señala acciones, énfasis y estado; el paisaje y los fondos oscuros conservan la mayor parte de la superficie.

## Typography

**Display Font:** Space Grotesk, autohospedada como `Space` en `assets/display.woff2`, con fallback sans-serif. El archivo declara pesos (300–700).

**Body Font:** DM Sans, autohospedada como `DM` en `assets/body.woff2`, con fallback sans-serif. El archivo declara pesos (100–900). No hay una familia monoespaciada independiente.

La tipografía de titulares es geométrica, compacta y de peso medio. DM Sans mantiene la lectura de biografía y descripciones, mientras los rótulos en mayúsculas aportan tono de archivo y navegación.

### Hierarchy
- **Display:** título del prólogo; valores normativos en `typography.display`. Los cortes de línea forman parte de su composición actual.
- **Headline:** titulares de sección; valores normativos en `typography.headline`. Contacto amplía la escala a `clamp(44px,5.5vw,80px)` y las credenciales usan (44px).
- **Title:** nombres de proyecto; valores normativos en `typography.title`. El hito académico tiene una variante mayor (38px, interlineado 1.12).
- **Body:** base del documento; muchos párrafos editoriales reducen el tamaño. La biografía usa `typography.story` y un máximo (56ch); las descripciones del diálogo llegan a (65ch).
- **Label:** marcadores de sección; valores normativos en `typography.label`. Los demás rótulos varían entre (6px–12px) según el componente y el ancho de pantalla. No trasladar el tamaño de las anotaciones a los párrafos.

## Layout

Una página de desplazamiento continuo une prólogo, biografía, proyectos, entrada a Recuerdos, trayectoria, credenciales y contacto. No usa scroll snapping ni transiciones obligatorias entre pantallas. El encabezado permanece fijo, el rail de seis capítulos ocupa el borde derecho y un contador vertical acompaña el borde izquierdo. Las credenciales pertenecen al recorrido, pero no tienen un punto propio en el rail.

El contenedor de sección utiliza los espacios laterales y verticales del frontmatter. La biografía reparte dos columnas (1.1fr / 1fr, separación 12%); la trayectoria usa dos columnas iguales con separación (14%). El archivo de proyectos es una cuadrícula de dos columnas y separación `grid-gap`: el primer proyecto ocupa todo el ancho. Sus imágenes miden (390px) en el destacado y (310px) en los secundarios en el estilo base.

El prólogo mide (100svh), con mínimo (760px), y deja espacio explícito al encabezado y a los controles inferiores. El encabezado base mide (110px) y se contrae a (80px) tras (60px) de scroll. Los detalles de navegación siguen la posición de lectura; el indicador superior representa el progreso real de la página.

Cambios observados, de mayor a menor ancho:
- Desde (1700px), los márgenes principales usan `max(10.4%,calc((100vw - 1380px)/2))`.
- Hasta (1150px), se reducen espacios de navegación, tamaños de imágenes y separaciones de columnas; el margen principal pasa a (10%).
- Hasta (900px), el menú de escritorio se sustituye por el desplegable móvil; se mantiene la estructura de dos columnas. Desaparece la anotación del paisaje.
- Hasta (640px), biografía, trayectoria y proyectos pasan a una columna; se aplican `mobile-inline` y `mobile-block`. El rail conserva solo marcas, el contador izquierdo desaparece y el prólogo alinea su contenido hacia abajo. La imagen cambia a un encuadre (60% center). El diálogo pasa a (94vw) y máximo (92svh).
- Hasta (360px), se ajustan identidad, títulos y correo, y se oculta el texto del control de movimiento.

## Elevation & Depth

La profundidad es principalmente pictórica: paisaje fijo, sombreado por degradados, partículas cálidas y secciones oscuras superpuestas. Las tarjetas no usan sombras de caja; sus imágenes responden con brillo. El encabezado contraído y el fondo del diálogo usan desenfoque (12px). En el portafolio, las sombras están reservadas al progreso, el aviso temporal, la esfera decorativa de Órbita y el diálogo. Recuerdos añade sombras locales al artefacto lógico y a los créditos.

### Shadow Vocabulary
- **Progreso:** `0 2px 8px #0005`, bajo el indicador superior.
- **Aviso temporal:** `0 10px 30px #0006`, separa la confirmación del contenido.
- **Diálogo:** `0 30px 90px #0008`, sitúa el proyecto sobre el paisaje oscurecido.
- **Esfera de Órbita:** `10px 15px 25px #090e09aa`, volumen de la ilustración específica del proyecto.

## Shapes

Los botones rectangulares, las imágenes de proyecto, las etiquetas y el diálogo conservan esquinas rectas. El círculo se reserva para abrir/cerrar proyectos, puntos de estado, geometrías de Órbita y el portal. La trayectoria utiliza rombos creados mediante cuadrados girados (45deg). Los bordes estructurales son filetes (1px); los estados activos pueden usar líneas (2px). Los iconos son SVG lineales, con extremos y uniones redondeados.

## Components

### Buttons

La acción principal es cálida y compacta, con flecha lineal y esquinas rectas. Usa `button-primary`, peso (600), tamaño (12px), mínimo (58px) y separación interna (40px). Al pasar el cursor aclara a `#f4cf9d`, sube (3px) y desplaza su flecha (4px). En móvil usa (14px 19px), mínimo (52px), tamaño (11px) y separación (35px).

Las acciones de texto usan `text-link`: texto marfil, flecha ámbar y desplazamiento de flecha (5px) al hover. El enlace de contacto del encabezado añade una línea inferior ámbar. Los controles deshabilitados reducen opacidad a (.5) y muestran cursor de espera.

Todos los enlaces, botones y elementos con tabindex reciben foco visible mediante contorno ámbar (2px) separado (6px). Conservarlo también en variantes añadidas.

### Navigation

El encabezado combina monograma lineal, nombre y subtítulo pequeño. Su navegación de escritorio usa (12px) y subrayado ámbar que se extiende al hover. El menú móvil expone su estado con `aria-expanded`, permite cerrar con Escape y utiliza enlaces amplios (28px).

El rail conserva seis índices (00–05), marcas cortas y nombres revelados por hover o foco. La marca activa crece (8px a 22px) y pasa a ámbar; en móvil cambia de (4px a 12px). `aria-current="location"` sigue el capítulo activo. Los capítulos mantienen enlaces de ancla reales.

### Filters and Tabs

Los filtros de proyecto son acciones de texto con `aria-pressed`, línea activa ámbar (2px) y mínimo táctil (44px). Actualizan el contador y ocultan tarjetas sin alterar el orden original. Las pestañas de trayectoria usan `aria-selected`, línea inferior ámbar y mínimo (46px); flechas, Inicio y Fin cambian pestaña y foco. No presentan el mismo patrón ARIA porque cumplen funciones distintas.

### Cards / Containers

Cada tarjeta de proyecto es un botón completo sin relleno de caja. Una imagen o composición geométrica ocupa la parte superior; nombre, descripción y metadatos quedan debajo. Su apertura circular gira (45deg) y recibe fondo ámbar al hover; la imagen aumenta su brillo a (1.12). DaLogic es el proyecto real destacado, con cubierta SVG de circuito AND, rótulo «PROYECTO PERSONAL · CLAVER» y metadatos Python / 2.º de Bachillerato. Órbita y Nexo conservan su identificación explícita de ejemplos.

Las fichas de datos usan divisores horizontales; las credenciales contienen toda su información dentro de un marco rectangular de un píxel. El registro actual muestra el certificado B2 de inglés confirmado por el usuario; no incorpora emisor, fecha ni documento, que no se han facilitado.

### Tags

Las etiquetas del diálogo usan `dialog-tag`, borde `line`, tamaño (8px) y ajuste de línea mediante flex-wrap. Las etiquetas superpuestas a proyectos y el estado de credenciales tienen variantes propias más pequeñas y con borde cálido. No son filtros interactivos.

### Interactive Project Dialog

Un diálogo nativo presenta Canvas, título, descripción y etiquetas. Mide `min(960px,92vw)`, con máximo (90svh); su contenido puede desplazarse y el fondo queda bloqueado. La escena mide (330px) de alto, reducida a (260px) en móvil. El cierre circular usa `dialog-close`, cambia a ámbar al hover y conserva el foco global. Escape, botón de cierre, acción de regreso y pulsación fuera del cuadro cierran el proyecto; al cerrar, el foco vuelve a la tarjeta.

DaLogic presenta el proyecto personal de circuitos lógicos en Python/PySide6 y enlaza a `https://github.com/davidlb025/DaLogic`. Órbita y Nexo conservan escenas Canvas de ejemplo que responden al cursor o al toque. El diálogo distingue el proyecto real de los ejemplos.

### Atmosphere Controls

El sonido comienza apagado; WebAudio se crea tras una pulsación explícita. El control comunica encendido/apagado con texto y `aria-pressed`, anima sus barras al estar activo y suspende el audio cuando el documento se oculta.

La entrada del prólogo dura (1.6s), las revelaciones de titulares (1s) y la entrada del diálogo (.6s), con `cubic-bezier(.16,1,.3,1)`. La escena responde suavemente al puntero y al scroll; el bucle limita el dibujo a intervalos de al menos (32ms). El sistema respeta `prefers-reduced-motion` desde el inicio y sus cambios: elimina transiciones y animaciones CSS, desactiva smooth scroll y oculta partículas. La pausa manual detiene animaciones CSS, partículas y avance temporal de Canvas, y fija la transformación del paisaje. Esta pausa manual no elimina las transiciones de hover ni cambia el smooth scroll; no afirmar que equivale al modo reducido del sistema.

### Memories Entrance and Independent Journey

El capítulo «Los recuerdos» (`#experimental`) ofrece una imagen del campus y un enlace completo a `recuerdos.html`. La entrada mide al menos (450px), con texto sobre una veladura oscura; hasta (900px), el encabezado se apila. El destino es un recorrido autónomo, sin navegación compartida. Una salida discreta y persistente permite regresar a la entrada del portafolio cuando el visitante lo decide.

La fotografía institucional `assets/claver-campus.webp` permanece de fondo durante una única etapa: Colegio Claver, Lleida, desde la infancia hasta el actual 2.º de Bachillerato. Los seis momentos —umbral, infancia, crecer aquí, Bachillerato, DaLogic y presente— pertenecen a esa etapa aún abierta. El scroll nativo, el toque y el teclado conducen el relato; una línea fija inferior actualiza el progreso ARIA, el momento y seis rombos visitados. No representan seis etapas.

`recuerdos.css` conserva Space y DM con variantes locales `--ink: #f4f0e6`, `--muted: #c3c1b4`, `--amber: #e5b77d` y `--night: #11140f`; no sustituyen los tokens del portafolio. Los titulares usan peso (400): h1 `clamp(54px,6vw,88px)` y h2 `clamp(46px,5vw,74px)`. Los paneles miden hasta (580px), con cuerpo (15px) y máximo (49ch); las secciones base ocupan al menos (125svh), y el proyecto usa dos columnas que se apilan hasta (800px). En móvil, los márgenes pasan a (8%) y el cuerpo a (13px).

El encabezado propio ofrece sonido voluntario, pausa y créditos; los controles móviles miden al menos (44px). La pausa fija el encuadre y detiene partículas y animaciones; el modo reducido también elimina transiciones y scroll suave. Al ocultar la pestaña se suspenden partículas y audio. «Volver al comienzo» devuelve el foco al título. Los créditos usan diálogo nativo y devuelven el foco al botón al cerrar; identifican la imagen como institucional, sin atribuirle recuerdos personales ni inventar fechas o anécdotas.

### DaLogic and AND Demonstration

DaLogic aparece durante 2.º de Bachillerato con su repositorio real, descripción de editor/simulador de circuitos, tablas de verdad e integrados reutilizables. Una pieza local `#111a13ed`, relleno (32px 30px) y sombra `0 20px 60px #09120b66` contiene una demostración AND explícitamente diferenciada del programa completo. Las entradas A/B tienen mínimo (44px), `aria-pressed`, valor 0/1 y nombre accesible actualizado; la salida anuncia su estado mediante `role="status"` y solo se enciende si ambas entradas están activas. Los cables y la salida toman ámbar al activarse. La demostración sigue operativa con la atmósfera pausada.

### English B2 Credential

El certificado se presenta dentro de un marco rectangular completo de un píxel, superficie `#1d2018` y relleno (34px 36px). «B2» usa ámbar (72px, Space, peso 400), junto al título «Inglés» (28px) y su descripción (13px). La clasificación se alinea a la derecha. Hasta (640px), el relleno pasa a (27px 23px), el nivel a (60px), el título a (25px) y la clasificación se sitúa debajo. No incluye descarga ni documento no aportado.

### Volunteer Timeline and Memories Exit

La pestaña «Voluntariado» mantiene la línea vertical fina y los nodos en rombo. Dos entradas sitúan el papel de ayudante en Moda re- / Troballes en 2025–2026 y profesor de repaso de primaria en Escola Ciutat Jardí en 2026–2027. Las entidades enlazan a sus fuentes oficiales. Los títulos usan (30px), reducidos a (28px) en móvil.

«Salir de los recuerdos» es un enlace persistente con flecha SVG y altura mínima (44px), en el encabezado propio del recorrido. Regresa a `index.html#experimental`. En móvil se oculta la firma para conservar espacio y acceso directo a salida, sonido, pausa y créditos.

## Do's and Don'ts

### Do:
- **Do** mantener el paisaje de apertura como ancla del mundo y el desplazamiento continuo como recorrido.
- **Do** conservar la relación carbón, marfil y ámbar, usando los tokens extraídos.
- **Do** mantener foco visible, enlaces reales, navegación por teclado, sonido voluntario y controles de movimiento.
- **Do** identificar los proyectos de ejemplo y describir los archivos vacíos con honestidad.
- **Do** comprobar las composiciones de una columna y los cambios del rail en los anchos móviles establecidos.

### Don't:
- **Don't** inventar formación, empleos, certificados, habilidades o repositorios de David.
- **Don't** reemplazar las superficies rectas por un sistema general de tarjetas redondeadas.
- **Don't** activar audio automáticamente ni hacer del movimiento un requisito para leer o contactar.
- **Don't** presentar los tonos sintetizados de la vista del panel como tokens de producción.
- **Don't** confundir la pausa manual de atmósfera con la eliminación de todas las transiciones.
