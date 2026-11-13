const palettes = {
  windows: { foreground: "#c0c0c0", background: "#000000" },
  linux: { foreground: "#eeeeec", background: "#300a24" },
  oscuro: { foreground: "#f4f7fd", background: "#171e2b" },
  claro: { foreground: "#172035", background: "#f2f5fb" },
  "alto-contraste": { foreground: "#ffffff", background: "#000000" },
  ambar: { foreground: "#ffd97a", background: "#1d1403" },
  verde: { foreground: "#8ff4ac", background: "#091c12" },
};

const windowsColors = [
  "#000000", "#000080", "#008000", "#008080", "#800000", "#800080", "#808000", "#c0c0c0",
  "#808080", "#0000ff", "#00ff00", "#00ffff", "#ff0000", "#ff00ff", "#ffff00", "#ffffff",
];

const namedColors = {
  black: "#000000", negro: "#000000", white: "#ffffff", blanco: "#ffffff",
  red: "#ff0000", rojo: "#ff0000", green: "#008000", verde: "#008000",
  blue: "#0000ff", azul: "#0000ff", yellow: "#ffff00", amarillo: "#ffff00",
  cyan: "#00ffff", cian: "#00ffff", aqua: "#00ffff", celeste: "#87ceeb",
  magenta: "#ff00ff", fuchsia: "#ff00ff", fucsia: "#ff00ff",
  purple: "#800080", morado: "#800080", purpura: "#800080",
  violet: "#ee82ee", violeta: "#ee82ee", pink: "#ffc0cb", rosa: "#ffc0cb",
  orange: "#ffa500", naranja: "#ffa500", ambar: "#ffbf00",
  gray: "#808080", grey: "#808080", gris: "#808080", silver: "#c0c0c0", plata: "#c0c0c0",
  lime: "#00ff00", lima: "#00ff00", navy: "#000080", marino: "#000080",
  teal: "#008080", olive: "#808000", maroon: "#800000", rebeccapurple: "#663399",
};

const themeAliases = {
  dark: "oscuro", light: "claro", contrast: "alto-contraste", amber: "ambar", green: "verde",
  fosc: "oscuro", clar: "claro", predeterminat: "predeterminado",
};
const aliases = { type: "cat", ayuda: "help", cls: "clear" };
const sharedCommands = [
  "cd", "help", "ayuda", "tree", "history", "whoami", "links", "open",
  "exit", "os", "color", "bg", "theme", "echo",
];
const platformCommands = {
  windows: ["dir", "type", "cls", "ver"],
  linux: ["ls", "cat", "clear", "pwd", "uname"],
};
const games = new Set(["tetris", "doom", "snake"]);
const windowsHelp = `dir [/b] [ruta]         Lista carpetas y archivos. /b muestra solo los nombres.
cd [ruta]               Cambia de carpeta. Sin ruta, muestra la carpeta actual.
type <archivo>          Lee un archivo de texto.
cls                     Limpia la pantalla.
ver                     Identifica el perfil simulado.
color [valor]           Acepta un nombre, #hex o un atributo como 0A para fondo y texto.
                        Sin valor, restablece los colores.
Usa .. para subir y C:\\Portfolio para volver a la raíz.`;
const linuxHelp = `ls [-1F] [ruta]         Lista carpetas y archivos. -1 usa una línea por nombre y -F marca las carpetas con /.
cd [ruta]               Cambia de carpeta. Sin ruta, vuelve a ~.
pwd                     Muestra la ruta actual.
cat <archivo>           Lee un archivo de texto.
clear                   Limpia la pantalla.
uname [-s|-n]           Muestra el sistema simulado o su nombre de equipo.
color [nombre|#hex]     Consulta o cambia el color del texto.
Usa .. para subir y ~ o / para volver a la raíz.`;
const sharedHelp = `tree [ruta]             Muestra la estructura de carpetas y archivos.
echo [texto]            Imprime texto.
links                   Lista enlaces y sus identificadores.
open <identificador>    Abre un enlace del portfolio.
bg <nombre|#hex>        Cambia el color del fondo.
theme [nombre]          Lista o aplica temas.
history                 Muestra los comandos de esta sesión.
whoami                  Muestra el nombre de usuario.
os                      Cambia de perfil entre Windows y Linux.
exit                    Cierra la consola.
help o ayuda            Muestra esta ayuda.

Juegos
tetris                  Encaja piezas y completa líneas.
doom                    Encuentra la salida del laberinto en primera persona.
snake                   Come y crece esquivando las paredes y tu propia cola.
Pulsa Q o Esc para volver a la consola desde un juego.

Usa comillas si una ruta contiene espacios. Pulsa Tab para completar un nombre.`;

const separatorPattern = /[\\/]+/;
const collator = new Intl.Collator(document.documentElement.lang, { numeric: true, sensitivity: "base" });
const encoder = new TextEncoder();
const message = text => ({ text });
const normalized = value => value.toLowerCase().normalize("NFD").replace(/\p{Mark}/gu, "");

function tokenize(line) {
  const tokens = [];
  let word = "";
  let quote = "";
  let started = false;
  for (const character of line) {
    if (quote) {
      if (character === quote) quote = "";
      else word += character;
    } else if (character === '"' || character === "'") {
      quote = character;
      started = true;
    } else if (/\s/u.test(character)) {
      if (started) tokens.push(word);
      word = "";
      started = false;
    } else {
      word += character;
      started = true;
    }
  }
  if (quote) return;
  if (started) tokens.push(word);
  return tokens;
}

function parseColor(value) {
  const name = normalized(value);
  if (/^#[0-9a-f]{6}$/.test(name)) return name;
  if (/^#[0-9a-f]{3}$/.test(name)) return "#" + [...name.slice(1)].map(digit => digit.repeat(2)).join("");
  return Object.hasOwn(namedColors, name) ? namedColors[name] : undefined;
}

function luminance(color) {
  const weights = [.2126, .7152, .0722];
  return weights.reduce((sum, weight, index) => {
    const channel = Number.parseInt(color.slice(1 + index * 2, 3 + index * 2), 16) / 255;
    const linear = channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    return sum + weight * linear;
  }, 0);
}

function contrast(first, second) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

function resolveKey(object, name, ignoreCase) {
  if (Object.hasOwn(object, name)) return name;
  if (!ignoreCase) return;
  const target = name.toLowerCase();
  return Object.keys(object).find(key => key.toLowerCase() === target);
}

function sortedEntries(directory) {
  return Object.entries(directory.entries).sort(([a, aNode], [b, bNode]) => {
    if (aNode.type !== bNode.type) return aNode.type === "dir" ? -1 : 1;
    return collator.compare(a, b);
  });
}

export function createConsoleShell(profile, tree, links) {
  const windows = profile === "windows";
  const system = windows ? "windows" : "linux";
  const systemLabel = windows ? "Windows" : "Linux";
  const commands = new Set([...sharedCommands, ...platformCommands[system]]);
  const commandKey = name => windows ? name.toLowerCase() : name;
  const separator = windows ? "\\" : "/";
  const systemCommand = windows ? "ver" : "uname";
  const root = { name: "", node: tree };
  let directory = [root];
  let colors = { ...palettes[system] };

  function formatPath(stack) {
    const path = stack.slice(1).map(part => part.name).join(separator);
    return windows ? "C:\\Portfolio" + (path ? "\\" + path : "") : "/" + path;
  }

  function resolve(path) {
    const drive = /^([a-z]):(?:[\\/]+|$)/i.exec(path);
    const absolute = drive || /^~(?:[\\/]+|$)|^[\\/]+/.exec(path);
    const names = (absolute ? path.slice(absolute[0].length) : path).split(separatorPattern);
    if (drive) {
      if (drive[1].toLowerCase() !== "c" || (names[0] && names[0].toLowerCase() !== "portfolio")) {
        return { error: "La ruta está fuera del portfolio: " + path };
      }
      names.shift();
    }
    const stack = absolute ? [root] : directory.slice();
    for (const name of names) {
      if (!name) continue;
      const { node } = stack.at(-1);
      if (node.type !== "dir") return { error: "No es una carpeta: " + stack.at(-1).name };
      if (name === ".") continue;
      if (name === "..") {
        if (stack.length > 1) stack.pop();
        continue;
      }
      const entry = resolveKey(node.entries, name, windows);
      if (entry === undefined) return { error: "No se encuentra la ruta: " + path };
      stack.push({ name: entry, node: node.entries[entry] });
    }
    const { node, name } = stack.at(-1);
    if (node.type !== "dir" && /[\\/]$/.test(path)) return { error: "No es una carpeta: " + name };
    return { stack, node, name };
  }

  function showTree(location) {
    const rows = [formatPath(location.stack)];
    function addBranches(node, indent) {
      if (node.type !== "dir") return;
      const entries = sortedEntries(node);
      entries.forEach(([name, child], index) => {
        const last = index === entries.length - 1;
        rows.push(indent + (last ? "└── " : "├── ") + name + (child.type === "dir" ? separator : ""));
        addBranches(child, indent + (last ? "    " : "│   "));
      });
    }
    addBranches(location.node, "");
    return rows.join("\n");
  }

  function listDirectory(command, args) {
    const paths = [];
    let bare = false;
    let classify = false;
    let options = true;
    for (const arg of args) {
      if (options && command === "dir" && arg.toLowerCase() === "/b") {
        bare = true;
      } else if (options && command === "ls" && arg === "--") {
        options = false;
      } else if (options && command === "ls" && /^-.+/s.test(arg)) {
        if (!/^-[1F]+$/.test(arg)) return message("ls: opción no disponible: " + arg + ". Usa -1 o -F.");
        bare ||= arg.includes("1");
        classify ||= arg.includes("F");
      } else {
        paths.push(arg);
      }
    }
    if (paths.length > 1) return message("Indica una sola ruta. Usa comillas si contiene espacios.");
    const location = resolve(paths[0] ?? ".");
    if (location.error) return message(location.error);

    const isDirectory = location.node.type === "dir";
    const entries = isDirectory ? sortedEntries(location.node) : [[location.name, location.node]];
    if (command === "ls") {
      const ordered = entries.sort(([first], [second]) => collator.compare(first, second));
      const names = ordered.map(([name, node]) => {
        const label = isDirectory ? name : paths[0];
        const quoted = /\s/u.test(label) ? (label.includes("'") ? `"${label}"` : `'${label}'`) : label;
        return quoted + (classify && node.type === "dir" ? "/" : "");
      });
      return message(names.join(bare ? "\n" : "  "));
    }
    if (bare) return message(entries.map(([name]) => name).join("\n"));

    const stack = isDirectory ? location.stack : location.stack.slice(0, -1);
    let folders = 0;
    let bytes = 0;
    const rows = entries.map(([name, node]) => {
      if (node.type === "dir") {
        folders++;
        return "  <DIR>        " + name;
      }
      const size = encoder.encode(node.text).length;
      bytes += size;
      return String(size).padStart(13) + "  " + name;
    });
    return message([
      " Directorio de " + formatPath(stack), "", ...rows, "",
      `               ${entries.length - folders} archivo(s)    ${bytes} bytes`,
      `               ${folders} directorio(s)`,
    ].join("\n"));
  }

  function showLinks() {
    const current = (directory.at(-1).node.links ?? []).filter(id => Object.hasOwn(links, id));
    const ids = current.length ? current : Object.keys(links);
    if (!ids.length) return message("No hay enlaces disponibles.");
    return {
      text: ids.map(id => id + " · " + links[id].label).join("\n"),
      links: ids.map(id => ({ label: links[id].label, url: links[id].url })),
    };
  }

  function changeColor(key, value) {
    const isText = key === "foreground";
    const label = isText ? "Color del texto" : "Color de fondo";
    if (value === undefined) return message(label + ": " + colors[key]);
    const color = parseColor(value);
    if (!color) return message("Color no reconocido. Usa un nombre como azul o un hexadecimal como #87ceeb.");
    return applyColor(key, color);
  }

  function applyColor(key, color) {
    const isText = key === "foreground";
    const label = isText ? "Color del texto" : "Color de fondo";
    const other = isText ? "background" : "foreground";
    colors[key] = color;
    if (contrast(color, colors[other]) >= 4.5) return message(label + ": " + color);
    colors[other] = contrast(color, "#ffffff") > contrast(color, "#000000") ? "#ffffff" : "#000000";
    const adjusted = isText ? "fondo" : "texto";
    return message(`${label}: ${color}. Se ha ajustado el ${adjusted} a ${colors[other]} para mantener la legibilidad.`);
  }

  function changeForeground(value) {
    if (!windows) return changeColor("foreground", value);
    if (value === undefined) {
      colors = { ...palettes.windows };
      return {};
    }
    if (!/^[0-9a-f]{1,2}$/i.test(value)) return changeColor("foreground", value);
    const [backgroundDigit, foregroundDigit] = value.toLowerCase().padStart(2, "0");
    if (backgroundDigit === foregroundDigit) return message("El fondo y el texto deben tener colores distintos.");
    const foreground = windowsColors[Number.parseInt(foregroundDigit, 16)];
    const background = windowsColors[Number.parseInt(backgroundDigit, 16)];
    colors = { foreground, background };
    return contrast(foreground, background) >= 4.5 ? {} : applyColor("foreground", foreground);
  }

  function changeTheme(value) {
    if (value === undefined) return message("Temas disponibles: " + Object.keys(palettes).join(", ") + ", predeterminado.");
    const name = normalized(value);
    const theme = ["predeterminado", "default", "reset"].includes(name) ? system :
      Object.hasOwn(themeAliases, name) ? themeAliases[name] : name;
    if (!Object.hasOwn(palettes, theme)) return message("Tema no reconocido. Escribe «theme» para ver los disponibles.");
    colors = { ...palettes[theme] };
    return message("Tema aplicado: " + theme + ".");
  }

  function execute(commandLine, history = []) {
    if (windows) {
      const echo = /^\s*echo(?:[\t ](.*)|$)/i.exec(commandLine);
      if (echo) return message(echo[1] || "ECHO está activado.");
    }
    const tokens = tokenize(commandLine);
    if (!tokens) return message("Falta cerrar una comilla.");
    if (!tokens.length) return {};
    const [name, ...args] = tokens;
    const key = commandKey(name);
    if (games.has(key)) return args.length ? message("Uso: " + key) : { game: key };
    if (!commands.has(key)) return message("Comando no reconocido en " + systemLabel + ": " + name + ". Escribe «help» o «ayuda».");
    const command = Object.hasOwn(aliases, key) ? aliases[key] : key;
    const [value] = args;
    if (command === "ls" || command === "dir") return listDirectory(command, args);
    if (["cd", "cat", "tree"].includes(command)) {
      if (args.length > 1) return message("Indica una sola ruta. Usa comillas si contiene espacios.");
      if (command === "cat" && !value) return message("Uso: " + key + " <archivo>");
      if (windows && command === "cd" && value === undefined) return message(formatPath(directory));
      const location = resolve(value ?? (command === "cd" ? "~" : "."));
      if (location.error) return message(location.error);
      if (command === "cd") {
        if (location.node.type !== "dir") return message("No es una carpeta: " + location.name);
        directory = location.stack;
        return {};
      }
      if (command === "cat") {
        if (location.node.type !== "file") return message("Es una carpeta: " + formatPath(location.stack));
        return message(location.node.text);
      }
      return message(showTree(location));
    }
    if (["open", "color", "bg", "theme"].includes(command) && args.length > 1) {
      return message("Usa un solo valor para «" + command + "».");
    }
    if (command === systemCommand) {
      if (windows) return args.length ? message("Uso: ver") : message("Windows (simulado)");
      if (args.length === 0 || (args.length === 1 && value === "-s")) return message("Linux");
      if (args.length === 1 && value === "-n") return message("portfolio");
      return message("Uso: uname [-s|-n]");
    }
    switch (command) {
      case "pwd": return message(formatPath(directory));
      case "help": return message("Comandos del portfolio · " + systemLabel + "\n\n" + (windows ? windowsHelp : linuxHelp) + "\n\n" + sharedHelp);
      case "clear": return { clear: true };
      case "history": return message(history.map((entry, index) => `${index + 1}  ${entry}`).join("\n") || "El historial está vacío.");
      case "whoami": return message("david");
      case "echo": return message(args.join(" "));
      case "links": return showLinks();
      case "open": {
        if (!value) return message("Uso: open <identificador>. Escribe «links» para ver los enlaces.");
        const id = resolveKey(links, value, true);
        if (id === undefined) return message("Enlace desconocido: " + value + ". Escribe «links» para ver los identificadores.");
        return { open: { label: links[id].label, url: links[id].url } };
      }
      case "exit": return { exit: true };
      case "os": return { text: systemLabel + " (simulado)", select: true };
      case "color": return changeForeground(value);
      case "bg": return changeColor("background", value);
      case "theme": return changeTheme(value);
    }
  }

  function complete(input) {
    const match = /^(\s*)(\S+)(?:([\t ]+)(.*))?$/u.exec(input);
    if (!match) return;
    const [, leading, key, gap, argument] = match;
    const command = commandKey(key);
    if (gap === undefined) {
      const candidates = [...commands].filter(name => name.startsWith(command));
      const completed = commands.has(command) ? command : candidates.length === 1 ? candidates[0] : undefined;
      return completed && leading + completed + " ";
    }
    if (!commands.has(command)) return;
    let prefix = leading + key + gap;
    if (command === "open" || command === "theme") {
      const options = command === "open" ? Object.keys(links) : [...Object.keys(palettes), "predeterminado"];
      const matches = options.filter(option => option.toLowerCase().startsWith(argument.toLowerCase()));
      if (matches.length === 1) return prefix + matches[0];
      return;
    }
    if (!["cd", "ls", "dir", "cat", "type", "tree"].includes(command)) return;
    const optionPattern = command === "ls" ? /^(?:(?:-[1F]+|--)[\t ]+)+/ : command === "dir" ? /^(?:\/b[\t ]+)+/i : undefined;
    const options = optionPattern?.exec(argument)?.[0] ?? "";
    prefix += options;
    let path = argument.slice(options.length);
    const quote = path[0] === '"' || path[0] === "'" ? path[0] : "";
    if (quote) path = path.slice(1);
    if (quote && path.endsWith(quote)) path = path.slice(0, -1);
    if (!quote && /\s/u.test(path)) return;
    const split = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1;
    const folder = path.slice(0, split);
    const partial = path.slice(split);
    const location = resolve(folder || ".");
    if (location.node?.type !== "dir") return;
    const matches = sortedEntries(location.node).filter(([name, node]) => {
      const starts = windows ? name.toLowerCase().startsWith(partial.toLowerCase()) : name.startsWith(partial);
      return starts && (command !== "cd" || node.type === "dir");
    });
    if (matches.length !== 1) return;
    const [[name, node]] = matches;
    const completed = folder + name + (node.type === "dir" ? folder.at(-1) || separator : "");
    const wrapping = quote || (/\s/u.test(completed) ? '"' : "");
    return prefix + wrapping + completed + wrapping;
  }

  return {
    prompt: () => windows ? formatPath(directory) + ">" : "david@portfolio:~" + (directory.length > 1 ? formatPath(directory) : "") + "$",
    get colors() { return { ...colors }; },
    execute,
    complete,
  };
}
