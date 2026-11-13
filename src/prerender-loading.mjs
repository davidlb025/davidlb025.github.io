const root = document.documentElement;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let revealing = false;
let blocked = [];
let frame = 0;

export function blockDuringPrerenderLoad() {
  const overlay = document.querySelector(".prerender-loading");
  if (!overlay || blocked.length) return;
  blocked = [...document.body.children].filter(element => element !== overlay && !element.inert &&
    element.matches("header, main, nav, .accessibility, .skip-content"));
  for (const element of blocked) element.inert = true;
}

export function showPrerenderLoading(target, duration = 0, onComplete) {
  const overlay = document.querySelector(".prerender-loading");
  if (!overlay) return;
  const bar = overlay.querySelector("[role=progressbar]");
  const arc = overlay.querySelector(".prerender-loading-arc");
  const value = overlay.querySelector(".prerender-loading-value");
  let shown = Number(bar.getAttribute("aria-valuenow"));
  const start = overlay.hidden ? 0 : shown;
  overlay.hidden = false;
  root.dataset.prerenderLoading = "";
  cancelAnimationFrame(frame);

  function paint(percent) {
    arc.style.strokeDashoffset = 100 - percent;
    const rounded = Math.floor(percent);
    if (shown === rounded) return;
    shown = rounded;
    bar.setAttribute("aria-valuenow", rounded);
    value.textContent = rounded + "%";
  }

  if (!duration || reducedMotion.matches || start >= target) {
    paint(Math.max(start, target));
    onComplete?.();
    return;
  }
  let startedAt;
  function advance(now) {
    startedAt ??= now;
    const fraction = Math.min(1, (now - startedAt) / duration);
    paint(start + (target - start) * fraction);
    if (fraction < 1) frame = requestAnimationFrame(advance);
    else onComplete?.();
  }
  frame = requestAnimationFrame(advance);
}

export function revealPrerender() {
  if (revealing || !root.hasAttribute("data-prerender-loading")) return;
  revealing = true;
  showPrerenderLoading(100, 560, () => {
    setTimeout(() => {
      root.removeAttribute("data-prerender-loading");
      for (const element of blocked) element.inert = false;
      blocked = [];
      const url = new URL(location.href);
      url.searchParams.delete("carga");
      try { history.replaceState(history.state, "", url); } catch { /* Optional URL cleanup. */ }
    }, reducedMotion.matches ? 0 : 150);
  });
}
