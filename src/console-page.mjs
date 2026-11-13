import { createPortfolioConsole } from "./console-ui.mjs";

const surface = document.querySelector(".console-standalone");
const exitLink = surface.querySelector(".console-exit-hint");
const exit = () => location.assign(exitLink.href);
surface.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  exit();
});
surface.hidden = false;
createPortfolioConsole(surface, document.querySelector("#console-source").content, exit);
