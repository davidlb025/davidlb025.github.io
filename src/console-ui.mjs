import { createConsoleData } from "./console-data.mjs";
import { createConsoleGames } from "./console-games.mjs";
import { createConsoleShell } from "./console-shell.mjs";
import { translateOutput } from "./i18n.mjs";

const locale = document.documentElement.lang;
const t = value => translateOutput(locale, value);

function editLine(editor, submit) {
  editor.addEventListener("keydown", event => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    submit();
  });
  editor.addEventListener("beforeinput", event => {
    if (event.isComposing || !["insertParagraph", "insertLineBreak"].includes(event.inputType)) return;
    event.preventDefault();
    submit();
  });
  editor.addEventListener("input", event => {
    if (!event.isComposing && !editor.textContent && editor.hasChildNodes()) replaceLine(editor, "");
  });
  editor.addEventListener("paste", event => {
    event.preventDefault();
    const clipboard = event.clipboardData?.getData("text/plain").replace(/[\r\n]+/g, " ");
    const selection = window.getSelection();
    if (!clipboard || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    const fragment = document.createTextNode(clipboard);
    range.deleteContents();
    range.insertNode(fragment);
    selection.collapse(fragment, fragment.length);
  });
}

function replaceLine(editor, text) {
  editor.textContent = text;
  if (document.activeElement === editor) window.getSelection().collapse(editor, editor.childNodes.length);
}

function promptSpan(className, text) {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

function promptParts(profile, text) {
  const [user, path] = profile === "linux" ? /^([^:]+:)(.*)\$$/.exec(text)?.slice(1) ?? [] : [];
  if (!user) return [text];
  return [promptSpan("console-prompt-user", user), promptSpan("console-prompt-path", path), "$ "];
}

export function createPortfolioConsole(surface, source, onExit) {
  const content = surface.querySelector(".console-content");
  const header = surface.querySelector(".console-header-label");
  const headerTitle = header.textContent;
  const boot = surface.querySelector(".console-boot");
  const selection = boot.querySelector(".console-input");
  const options = [...boot.querySelectorAll("[data-console-option]")];
  const status = boot.querySelector("[data-console-selection]");
  const error = boot.querySelector("[data-console-error]");
  const session = surface.querySelector(".console-shell");
  const command = session.querySelector(".console-input");
  const prompt = session.querySelector(".console-prompt");
  const log = session.querySelector(".console-log");
  const startGame = createConsoleGames(surface, session, () => command.focus({ preventScroll: true }));
  const viewport = window.visualViewport;
  let selected = 0;
  let data;
  let shell;
  let originalColors;
  let history = [];
  let historyIndex = 0;
  let draft = "";

  function fitViewport() {
    if (!viewport) return;
    surface.style.setProperty("--console-viewport-height", `${viewport.height}px`);
    if (document.activeElement === command) scrollToPrompt();
  }

  function select(index) {
    selected = (index + options.length) % options.length;
    options.forEach((option, i) => {
      option.toggleAttribute("data-selected", i === selected);
      if (i === selected) option.setAttribute("aria-current", "true");
      else option.removeAttribute("aria-current");
    });
    status.textContent = t(selected ? "Linux seleccionado" : "Windows seleccionado");
    error.hidden = true;
  }

  function showPicker() {
    delete surface.dataset.consoleProfile;
    delete surface.dataset.consoleCustomColors;
    surface.style.removeProperty("--console-foreground");
    surface.style.removeProperty("--console-background");
    header.textContent = headerTitle;
    session.hidden = true;
    boot.hidden = false;
    replaceLine(selection, "");
    select(0);
    content.scrollTop = 0;
    selection.focus({ preventScroll: true });
  }

  function write(text) {
    if (!text) return;
    const row = document.createElement("div");
    row.className = "console-output";
    row.textContent = t(text);
    log.append(row);
  }

  function echo(input) {
    const row = document.createElement("div");
    row.className = "console-line console-echo";
    const submittedPrompt = prompt.cloneNode(true);
    submittedPrompt.removeAttribute("id");
    const submittedCommand = document.createElement("span");
    submittedCommand.textContent = input;
    row.append(submittedPrompt, submittedCommand);
    log.append(row);
  }

  function applyColors() {
    const { foreground, background } = shell.colors;
    if (surface.style.getPropertyValue("--console-foreground") !== foreground) {
      surface.style.setProperty("--console-foreground", foreground);
    }
    if (surface.style.getPropertyValue("--console-background") !== background) {
      surface.style.setProperty("--console-background", background);
    }
    surface.toggleAttribute("data-console-custom-colors", foreground !== originalColors.foreground || background !== originalColors.background);
  }

  function showPrompt() {
    prompt.replaceChildren(...promptParts(surface.dataset.consoleProfile, shell.prompt()));
  }

  function scrollToPrompt() {
    content.scrollTop = content.scrollHeight;
  }

  function startSession() {
    const profile = options[selected].dataset.consoleOption;
    data ??= createConsoleData(source);
    shell = createConsoleShell(profile, data.tree, data.links);
    originalColors = shell.colors;
    surface.dataset.consoleProfile = profile;
    header.textContent = profile === "windows" ? t("Símbolo del sistema") : "david@portfolio";
    applyColors();
    history = [];
    historyIndex = 0;
    draft = "";
    boot.hidden = true;
    session.hidden = false;
    log.replaceChildren();
    replaceLine(command, "");
    showPrompt();
    const list = profile === "windows" ? "dir" : "ls";
    write(`${data.title}\nEscribe ${list} para ver los apartados o help para consultar los comandos.\n\n`);
    command.focus({ preventScroll: true });
    scrollToPrompt();
  }

  function validLink(link) {
    if (!link?.url) return false;
    try {
      return ["https:", "http:", "mailto:", "tel:"].includes(new URL(link.url).protocol);
    } catch {
      return false;
    }
  }

  function writeLinks(links) {
    if (!links?.length) return;
    const list = document.createElement("ul");
    list.className = "console-output-links";
    for (const link of links) {
      if (!validLink(link)) continue;
      const item = document.createElement("li");
      const anchor = document.createElement("a");
      anchor.href = link.url;
      anchor.textContent = link.label;
      if (/^https?:/i.test(link.url)) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }
      item.append(anchor);
      list.append(item);
    }
    if (list.children.length) log.append(list);
  }

  editLine(selection, () => {
    const value = selection.textContent.trim().toLowerCase();
    if (value === "exit") return onExit();
    if (value) {
      const index = options.findIndex((option, i) => option.dataset.consoleOption === value || String(i + 1) === value);
      if (index < 0) {
        error.textContent = t("Escribe 1 para Windows o 2 para Linux.");
        error.hidden = false;
        return;
      }
      select(index);
    }
    startSession();
  });
  selection.addEventListener("keydown", event => {
    if (event.isComposing || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    replaceLine(selection, "");
    select(selected + (event.key === "ArrowLeft" ? -1 : 1));
  });

  editLine(command, () => {
    const typed = command.textContent;
    const input = typed.trim();
    echo(typed);
    replaceLine(command, "");
    if (!input) return scrollToPrompt();
    const result = shell.execute(input, history);
    history.push(input);
    historyIndex = history.length;
    draft = "";
    if (result.exit) return onExit();
    if (result.select) return showPicker();
    if (result.game) {
      scrollToPrompt();
      return startGame(result.game);
    }
    if (result.clear) log.replaceChildren();
    write(result.text);
    writeLinks(result.links);
    if (validLink(result.open)) {
      if (/^https?:/i.test(result.open.url)) window.open(result.open.url, "_blank", "noopener,noreferrer");
      else location.assign(result.open.url);
    }
    applyColors();
    showPrompt();
    scrollToPrompt();
  });

  command.addEventListener("keydown", event => {
    if (event.isComposing) return;
    if (event.ctrlKey && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "c" && window.getSelection().isCollapsed) {
      event.preventDefault();
      echo(command.textContent + "^C");
      replaceLine(command, "");
      historyIndex = history.length;
      draft = "";
      scrollToPrompt();
      return;
    }
    if (event.key === "Tab" && !event.shiftKey) {
      const typed = command.textContent;
      const completed = shell.complete(typed);
      if (completed && completed !== typed) {
        event.preventDefault();
        replaceLine(command, completed);
      }
      return;
    }
    if (!history.length || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    event.preventDefault();
    if (historyIndex === history.length) draft = command.textContent;
    historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === "ArrowUp" ? -1 : 1)));
    replaceLine(command, history[historyIndex] ?? draft);
  });

  fitViewport();
  viewport?.addEventListener("resize", fitViewport);
  showPicker();
}
