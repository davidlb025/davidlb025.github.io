const contentText = element => element?.textContent.replace(/\s+/g, " ").trim() ?? "";
const file = (...parts) => ({ type: "file", text: parts.filter(Boolean).join("\n\n") });
const directory = (entries, links = []) => ({ type: "dir", entries, links });
const readFields = (element, fields) => Array.from(element.querySelectorAll(fields), contentText);

const localizedNames = {
  historia: ["historia", "story"],
  "sobre-mi.txt": ["sobre-mi.txt", "about-me.txt"],
  proyectos: ["projectes", "projects"],
  "catalogo.txt": ["cataleg.txt", "catalogue.txt"],
  "tabla-and.txt": ["taula-and.txt", "and-table.txt"],
  "enlaces.txt": ["enllacos.txt", "links.txt"],
  herramientas: ["eines", "tools"],
  "caja-de-herramientas.txt": ["caixa-d-eines.txt", "toolbox.txt"],
  trayectoria: ["trajectoria", "journey"],
  estudios: ["estudis", "education"],
  "formacion.txt": ["formacio.txt", "education.txt"],
  trabajo: ["feina", "work"],
  "disponibilidad.txt": ["disponibilitat.txt", "availability.txt"],
  voluntariado: ["voluntariat", "volunteering"],
  certificados: ["certificats", "certificates"],
  contacto: ["contacte", "contact"],
  "datos-de-contacto.txt": ["dades-de-contacte.txt", "contact-details.txt"],
};

function localizeDirectory(node, locale) {
  if (node.type !== "dir" || locale === "es") return node;
  const index = locale === "ca" ? 0 : 1;
  node.entries = Object.fromEntries(Object.entries(node.entries).map(([name, child]) =>
    [localizedNames[name]?.[index] ?? name, localizeDirectory(child, locale)]));
  return node;
}

function filenameStem(title) {
  return title.normalize("NFD").replace(/\p{Mark}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function createConsoleData(source) {
  const links = Object.fromEntries([...source.querySelectorAll("[data-console-link]")].map(anchor => {
    const label = anchor.cloneNode(true);
    label.querySelectorAll("[aria-hidden]").forEach(element => element.remove());
    return [anchor.dataset.consoleLink, { label: contentText(label), url: anchor.getAttribute("href") }];
  }));
  const title = contentText(source.querySelector("#nombre"));

  function read(selector, fields = "h3, h4, p") {
    return [...source.querySelectorAll(selector)].flatMap(element => readFields(element, fields));
  }

  function entryFiles(selector, partsOf, titleOf = (_, parts) => parts.join(" ")) {
    const entries = Object.create(null);
    for (const [index, element] of source.querySelectorAll(selector).entries()) {
      const parts = partsOf(element);
      const stem = filenameStem(titleOf(element, parts)) || `entrada-${index + 1}`;
      let name = `${stem}.txt`;
      let suffix = 2;
      while (Object.hasOwn(entries, name)) name = `${stem}-${suffix++}.txt`;
      entries[name] = file(...parts);
    }
    return entries;
  }

  function linkLines(ids) {
    return ids.flatMap(id => links[id] ? [`${links[id].label} · ${links[id].url}`] : []).join("\n");
  }

  const dalogicLinks = ["dalogic", "repositorio"];
  const toolLinks = ["herramientas"];
  const volunteerLinks = ["escola", "troballes"];
  const contactLinks = ["correo", "telefono", "linkedin", "github"];
  const tree = directory({
    "portfolio.txt": file(title, "Entra en un apartado con cd. Escribe help para ver cómo listar las carpetas y leer los archivos con el perfil que elegiste."),
    historia: directory({
      "sobre-mi.txt": file("Mi historia", ...read(".story-head, .story-copy", "p")),
    }, ["linkedin"]),
    proyectos: directory({
      "catalogo.txt": file("Proyectos", ...read("#proyectos .section-heading", "p")),
      dalogic: directory({
        "dalogic.txt": file(...read('[aria-labelledby="dalogic-title"] .project-copy')),
        "tabla-and.txt": file("Puerta AND", "A  B  Y\n0  0  0\n0  1  0\n1  0  0\n1  1  1"),
        "enlaces.txt": file(linkLines(dalogicLinks)),
      }, dalogicLinks),
      herramientas: directory({
        "caja-de-herramientas.txt": file(...read('[aria-labelledby="toolbox-title"] .project-copy')),
        "enlaces.txt": file(linkLines(toolLinks)),
      }, toolLinks),
    }, [...dalogicLinks, ...toolLinks]),
    trayectoria: directory({
      estudios: directory({ "formacion.txt": file(...read("#prism-studies")) }),
      trabajo: directory({ "disponibilidad.txt": file(...read("#prism-work")) }),
      voluntariado: directory({
        ...entryFiles("#prism-volunteering .prism-entry", entry => readFields(entry, "h4, p"), entry => contentText(entry.querySelector("h4"))),
        "enlaces.txt": file(linkLines(volunteerLinks)),
      }, volunteerLinks),
    }, volunteerLinks),
    certificados: directory(entryFiles(".certificate-row", entry => readFields(entry, "h3, .certificate-level"))),
    contacto: directory({
      "datos-de-contacto.txt": file("Contacto", ...read(".contact-copy", "p"), linkLines(contactLinks)),
    }, contactLinks),
  }, contactLinks);

  return { title, tree: localizeDirectory(tree, document.documentElement.lang), links };
}
