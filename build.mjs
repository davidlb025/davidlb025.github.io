import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { localizeMarkup, translateOutput } from "./src/i18n.mjs";

const require = createRequire(import.meta.url);
const { build, transform } = require(process.env.PORTFOLIO_ESBUILD || "esbuild");
const load = (path, encoding) => readFile(new URL(path, import.meta.url), encoding);

const [template, stylesheet, portfolioStyles, accessibilityStyles, consoleMarkup, consoleStyles, displayFont, bodyFont, favicon, ...licenses] = await Promise.all([
  load("./src/page.html", "utf8"),
  load("./src/style.css", "utf8"),
  load("./src/portfolio.css", "utf8"),
  load("./src/accessibility.css", "utf8"),
  load("./src/console.html", "utf8"),
  load("./src/console.css", "utf8"),
  load("./src/assets/display.woff2"),
  load("./src/assets/body.woff2"),
  load("./src/assets/favicon.svg", "utf8"),
  load("./src/assets/spacegrotesk-OFL.txt", "utf8"),
  load("./src/assets/dmsans-OFL.txt", "utf8"),
  load("./src/vendor/THREE-LICENSE.txt", "utf8"),
]);

async function bundle(entry) {
  const { outputFiles } = await build({
    entryPoints: [fileURLToPath(new URL(entry, import.meta.url))],
    bundle: true,
    write: false,
    format: "iife",
    minify: true,
    legalComments: "inline",
    target: "es2022",
  });
  return outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
}

const [scene, prerender, contrast, consoleScript, { code: css }, { code: cliCSS }] = await Promise.all([
  bundle("./src/main.mjs"),
  bundle("./src/prerender.mjs"),
  bundle("./src/contrast.mjs"),
  bundle("./src/console-page.mjs"),
  transform([stylesheet, portfolioStyles, accessibilityStyles].join("\n"), { loader: "css", minify: true }),
  transform(consoleStyles, { loader: "css", minify: true }),
]);

const styles = css
  .replace("DISPLAY_FONT", "data:font/woff2;base64," + displayFont.toString("base64"))
  .replace("BODY_FONT", "data:font/woff2;base64," + bodyFont.toString("base64"));
const contrastBanner = '<header class="contrast-banner"><span>Alto contraste</span><a href="./index.html" data-keep-section>Volver a la versión estándar</a></header>';
const consoleNavigation = `
@media (prefers-reduced-motion: no-preference) and (forced-colors: none) {
  @view-transition { navigation: auto; }
}`;
const loadingOverlay = `<div class="prerender-loading" hidden>
    <div class="prerender-loading-ring" role="progressbar" aria-label="Cargando la versión prerenderizada" aria-valuemin="0" aria-valuemax="100" aria-valuenow="25">
      <svg viewBox="0 0 90 90" aria-hidden="true" focusable="false">
        <circle class="prerender-loading-track" cx="45" cy="45" r="43.5"/>
        <circle class="prerender-loading-arc" cx="45" cy="45" r="43.5" pathLength="100" transform="rotate(-90 45 45)"/>
      </svg>
      <span class="prerender-loading-value" aria-hidden="true">25%</span>
    </div>
  </div>`;
const loadingOnArrival = `<script>
if (new URLSearchParams(location.search).get("carga") === "1") {
  document.querySelector(".prerender-loading").hidden = false;
  document.documentElement.dataset.prerenderLoading = "";
}
</script>`;

function makeVisualPage({ highContrast = false, recorded = false } = {}) {
  let source = highContrast ? template
    .replace(' data-theme="noche"', ' data-high-contrast')
    .replace('content="#080e28"', 'content="#000000"')
    .replace("<title>David López Borrego</title>", "<title>David López Borrego · Alto contraste</title>")
    .replace(/<!-- console-launch:start -->[\s\S]*?<!-- console-launch:end -->/, "") : template;
  if (recorded) {
    source = source
      .replace(' data-theme="noche"', ' data-theme="noche" data-prerender')
      .replace("<title>David López Borrego</title>", "<title>David López Borrego · Versión prerenderizada</title>")
      .replace('aria-description="Reproduce automáticamente el recorrido restante"', 'aria-description="Reproduce el vuelo completo"')
      .replace(/\n\s*<button class="orb-target"[^>]*><\/button>/, "")
      .replace('<canvas class="world" aria-hidden="true"></canvas>', `<img class="prerender-still" data-media="./media/prerender/" alt="">
      <video class="prerender-background" muted playsinline loop preload="none" aria-hidden="true" disablepictureinpicture hidden></video>
      <video class="prerender-video" muted playsinline preload="auto" aria-hidden="true" disablepictureinpicture hidden></video>`);
  }
  if (!highContrast) source = source.replace("<body>", `<body>\n  ${loadingOverlay}${recorded ? loadingOnArrival : ""}`);
  const applicableLicenses = highContrast || recorded ? licenses.slice(0, 2) : licenses;
  return source
    .replace(/<!-- (?:visual-only:(?:start|end)|console-launch:(?:start|end)|TEXT-NAVIGATION|TEXT-AND) -->/g, "")
    .replace("<!-- CONTRAST-BANNER -->", highContrast ? contrastBanner : "")
    .replace("ACCESSIBILITY_VIEW_URL", highContrast ? "./index.html" : "./contraste.html")
    .replace("ACCESSIBILITY_VIEW_NAME", highContrast ? "Versión estándar" : "Versión de alto contraste")
    .replace("ACCESSIBILITY_VIEW_LABEL", highContrast ? "Estándar" : "Alto contraste")
    .replace("PRERENDER_VIEW_URL", recorded ? "./index.html?animacion=3d" : "./prerender.html")
    .replace("PRERENDER_VIEW_NAME", recorded ? "Versión 3D en tiempo real" : "Versión prerenderizada")
    .replace("PRERENDER_VIEW_LABEL", recorded ? "3D en tiempo real" : "Versión prerenderizada")
    .replace("/* STYLES */", () => highContrast ? styles : styles + consoleNavigation)
    .replace("/* SCENE */", () => highContrast ? contrast : recorded ? prerender : scene)
    .replace("</head>", () => "<!--\n" + applicableLicenses.map(license => license.trim()).join("\n\n") + "\n-->\n</head>");
}

const textNavigation = '<header><p><a href="./index.html">Abrir la versión animada</a> · <a href="./prerender.html">Versión prerenderizada</a> · <a href="./contraste.html">Versión de alto contraste</a></p></header>';
const textAnd = `<section aria-labelledby="text-and-title">
  <h4 id="text-and-title">Cómo funciona la puerta AND</h4>
  <p>La salida Y vale 1 cuando A y B valen 1. En los demás casos vale 0.</p>
  <table>
    <caption>Tabla de verdad de la puerta AND</caption>
    <thead>
      <tr><th scope="col">Entrada A</th><th scope="col">Entrada B</th><th scope="col">Salida Y</th></tr>
    </thead>
    <tbody>
      <tr><td>0</td><td>0</td><td>0</td></tr>
      <tr><td>0</td><td>1</td><td>0</td></tr>
      <tr><td>1</td><td>0</td><td>0</td></tr>
      <tr><td>1</td><td>1</td><td>1</td></tr>
    </tbody>
  </table>
</section>`;

function makeTextPage(source) {
  const text = source.replace(/(?:^[\t ]*)?<!-- visual-only:start -->[\s\S]*?<!-- visual-only:end -->(?:[\t ]*\r?\n)?/gm, "");
  if (text.includes("<!-- visual-only:") || !text.includes("<!-- TEXT-NAVIGATION -->") || !text.includes("<!-- TEXT-AND -->")) {
    throw new Error("Revisa los marcadores visual-only, TEXT-NAVIGATION y TEXT-AND en src/page.html.");
  }
  return text
    .replace(/<(style|script|svg|canvas)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(span|div)\b[^>]*\baria-hidden="true"[^>]*>[^<]*<\/\1>/gi, "")
    .replace(/^[\t ]*<meta name="theme-color"[^>]*>\r?\n/m, "")
    .replace(' data-theme="noche"', "")
    .replace(/<title>[^<]*<\/title>/, "<title>David López Borrego · Versión de solo texto</title>")
    .replace("<!-- TEXT-NAVIGATION -->", textNavigation)
    .replace(/^([\t ]*)<!-- TEXT-AND -->/m, (_, indent) => indent + textAnd.replaceAll("\n", "\n" + indent));
}

const textPage = makeTextPage(template);
const consoleSource = textPage.slice(textPage.indexOf("<main>"), textPage.lastIndexOf("</body>")).trim();
const consolePage = `<!doctype html>
<html lang="es" class="console-page">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <link rel="icon" type="image/svg+xml" href="./favicon.svg">
  <title>David López Borrego · Consola</title>
  <style>${cliCSS}${consoleNavigation}</style>
</head>
<body>
  <main class="console-surface console-standalone" aria-labelledby="console-title" hidden>
${consoleMarkup}
  </main>
  <noscript><p>Activa JavaScript para usar la consola. <a href="./texto.html">Abrir la versión de solo texto</a></p></noscript>
  <template id="console-source">${consoleSource}</template>
  <script>${consoleScript}</script>
</body>
</html>`;

const outputs = [
  ["index.html", makeVisualPage()],
  ["prerender.html", makeVisualPage({ recorded: true })],
  ["contraste.html", makeVisualPage({ highContrast: true })],
  ["texto.html", textPage],
  ["consola.html", consolePage],
];

function languageNav(locale, page) {
  const root = locale === "es" ? "./" : "../";
  const links = [
    ["es", "Español", root + page],
    ["ca", "Català", root + "ca/" + page],
    ["en", "English", root + "en/" + page],
  ];
  const label = { es: "Idioma", ca: "Idioma", en: "Language" }[locale];
  return `<nav class="language-switcher" aria-label="${label}">${links.map(([code, name, href]) =>
    `<a lang="${code}" hreflang="${code}" href="${href}"${code === locale ? ' aria-current="page"' : ""} data-keep-section>${name}</a>`).join("")}</nav>`;
}

const keepLanguageSection = `<script>
document.querySelectorAll('.language-switcher a').forEach(link => link.addEventListener('click', () => {
  const chapters = [...document.querySelectorAll('.chapter')];
  const linked = location.hash && document.getElementById(location.hash.slice(1))?.matches('.chapter') ? location.hash : '';
  const active = chapters.findLast(chapter => chapter.getBoundingClientRect().top <= innerHeight * .35);
  link.hash = (scrollY < 50 && linked) || (active ? '#' + active.id : linked);
}));
</script>`;

function makeLocalePage(locale, page, source) {
  let current = source.replace('<html lang="es"', `<html lang="${locale}"`)
    .replace(/<title>([^<]*)<\/title>/, (match, title) => `<title>${translateOutput(locale, title)}</title>`);
  if (locale !== "es") current = current.replaceAll('href="./favicon.svg"', 'href="../favicon.svg"')
    .replaceAll('data-media="./media/', 'data-media="../media/');
  const localized = localizeMarkup(current, locale);
  return page === "consola.html"
    ? localized.replace('<a class="console-exit-hint"', `${languageNav(locale, page)}\n    <a class="console-exit-hint"`)
    : localized.replace(/(<body[^>]*>)/, `$1\n  ${languageNav(locale, page)}${page === "texto.html" ? "" : keepLanguageSection}`);
}

for (const locale of ["es", "ca", "en"]) {
  if (locale !== "es") await mkdir(new URL(`./${locale}/`, import.meta.url), { recursive: true });
  for (const [name, source] of outputs) {
    const html = makeLocalePage(locale, name, source);
    const target = locale === "es" ? `./${name}` : `./${locale}/${name}`;
    await writeFile(new URL(target, import.meta.url), html, "utf8");
    console.log(target + " · " + Math.round(Buffer.byteLength(html) / 1024) + " KB");
  }
}
await writeFile(new URL("./favicon.svg", import.meta.url), favicon, "utf8");
