const textSizes = [90, 100, 115, 130, 150, 175, 200];
const preferenceKey = "portfolio-dlb-accesibilidad";

export function createAccessibility(root) {
  const widget = document.querySelector(".accessibility");
  const toggle = widget.querySelector(".accessibility-toggle");
  const panel = widget.querySelector(".accessibility-panel");
  const close = widget.querySelector(".accessibility-close");
  const smaller = widget.querySelector(".accessibility-smaller");
  const larger = widget.querySelector(".accessibility-larger");
  const reset = widget.querySelector(".accessibility-reset");
  const value = widget.querySelector(".accessibility-value");
  const chapters = [...document.querySelectorAll(".chapter")];
  const viewLinks = [...document.querySelectorAll("[data-keep-section]")];
  let size = 100;

  try {
    const saved = JSON.parse(localStorage.getItem(preferenceKey));
    if (textSizes.includes(saved?.size)) size = saved.size;
  } catch { /* The settings work even when storage is unavailable. */ }

  function save() {
    try { localStorage.setItem(preferenceKey, JSON.stringify({ size })); } catch { /* Optional persistence. */ }
  }

  function applySize() {
    root.style.setProperty("--text-scale", size / 100);
    root.toggleAttribute("data-large-text", size >= 130);
    value.textContent = `${size} %`;
    smaller.setAttribute("aria-disabled", String(size === textSizes[0]));
    larger.setAttribute("aria-disabled", String(size === textSizes.at(-1)));
    reset.setAttribute("aria-disabled", String(size === 100));
    root.dispatchEvent(new Event("portfolio-text-size"));
  }

  function currentChapter() {
    const readingLine = innerHeight * .35;
    return chapters.findLast(chapter => chapter.getClientRects().length && chapter.getBoundingClientRect().top <= readingLine);
  }

  function sectionToKeep() {
    const linked = location.hash && document.getElementById(location.hash.slice(1))?.matches(".chapter")
      ? location.hash.slice(1) : "";
    return (scrollY < 50 && linked) || currentChapter()?.id || linked;
  }

  function changeSize(next) {
    if (!next || next === size) return;
    const chapter = currentChapter();
    const top = chapter?.getBoundingClientRect().top;
    size = next;
    applySize();
    if (chapter) {
      const offset = chapter.getBoundingClientRect().top - top;
      if (offset) window.scrollBy({ top: offset, behavior: "instant" });
    }
    save();
  }

  function setOpen(open, restoreFocus = false) {
    if (open) {
      const section = sectionToKeep();
      for (const link of viewLinks) link.hash = section;
    }
    toggle.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
    if (restoreFocus) toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => setOpen(false, true));
  widget.addEventListener("keydown", event => {
    if (event.key !== "Escape" || panel.hidden) return;
    event.preventDefault();
    setOpen(false, true);
  });
  widget.addEventListener("focusout", event => {
    if (!panel.hidden && event.relatedTarget && !widget.contains(event.relatedTarget)) setOpen(false);
  });
  document.addEventListener("pointerdown", event => {
    if (!panel.hidden && !widget.contains(event.target)) setOpen(false);
  }, { passive: true });
  smaller.addEventListener("click", () => changeSize(textSizes[textSizes.indexOf(size) - 1]));
  larger.addEventListener("click", () => changeSize(textSizes[textSizes.indexOf(size) + 1]));
  reset.addEventListener("click", () => changeSize(100));
  for (const link of viewLinks) {
    link.addEventListener("click", () => { link.hash = sectionToKeep(); });
  }

  applySize();
  toggle.hidden = false;
}
