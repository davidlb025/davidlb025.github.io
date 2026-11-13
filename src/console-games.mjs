import { createDoom } from "./console-doom.mjs";
import { createSnake } from "./console-snake.mjs";
import { createTetris } from "./console-tetris.mjs";
import { translateOutput } from "./i18n.mjs";

const t = value => translateOutput(document.documentElement.lang, value);

const games = { doom: createDoom, snake: createSnake, tetris: createTetris };

export function createConsoleGames(surface, session, onReturn) {
  const screen = surface.querySelector(".console-game");
  const terminal = screen.querySelector(".console-game-terminal");
  const title = screen.querySelector(".console-game-title");
  const status = screen.querySelector(".console-game-status");
  const board = screen.querySelector(".console-game-board");
  const keys = screen.querySelector("[data-game-keys]");
  const announcement = screen.querySelector("[data-game-announcement]");
  const exitHint = surface.querySelector(".console-exit-hint");
  const content = screen.parentElement;
  let name;
  let game;
  let timer;
  let paused = false;
  let done = false;
  let idle = false;
  let transcriptScroll = 0;

  function render() {
    const frame = game.frame();
    if (board.textContent !== frame.board) board.textContent = frame.board;
    const label = paused ? `${frame.status} · En pausa` : frame.status;
    if (status.textContent !== t(label)) status.textContent = t(label);
    const spoken = paused ? "En pausa. Pulsa P para continuar." : frame.announcement || "";
    if (announcement.textContent !== t(spoken)) announcement.textContent = t(spoken);
    done = Boolean(frame.done);
    idle = Boolean(frame.idle);
  }

  function schedule() {
    clearTimeout(timer);
    if (!game || paused || done || idle || document.hidden) return;
    timer = setTimeout(() => {
      game.tick();
      render();
      schedule();
    }, game.interval);
  }

  function restart() {
    game = games[name]();
    paused = false;
    title.textContent = game.title;
    keys.textContent = t(game.controls);
    render();
    schedule();
  }

  function stop() {
    if (!game) return;
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", schedule);
    game = undefined;
    screen.hidden = true;
    exitHint.hidden = false;
    session.hidden = false;
    content.scrollTop = transcriptScroll;
  }

  terminal.addEventListener("keydown", event => {
    if (!game || event.isComposing || event.altKey || event.metaKey || event.ctrlKey) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === "Escape" || key === "q") {
      event.preventDefault();
      event.stopPropagation();
      stop();
      onReturn();
      return;
    }
    if (key === "p" || key === "r") {
      event.preventDefault();
      if (event.repeat) return;
      if (key === "r") restart();
      else if (!done) {
        paused = !paused;
        render();
        schedule();
      }
      return;
    }
    if (paused || done) {
      if (key.startsWith("Arrow") || key === " ") event.preventDefault();
      return;
    }
    if (!game.key(key, event.repeat)) return;
    event.preventDefault();
    const wasIdle = idle;
    render();
    if (done || wasIdle !== idle) schedule();
  });

  terminal.addEventListener("blur", () => {
    if (!game || paused || done || idle) return;
    paused = true;
    render();
    schedule();
  });

  return function startGame(id) {
    transcriptScroll = content.scrollTop;
    name = id;
    session.hidden = true;
    screen.hidden = false;
    exitHint.hidden = true;
    restart();
    document.addEventListener("visibilitychange", schedule);
    content.scrollTop = 0;
    terminal.focus({ preventScroll: true });
  };
}
