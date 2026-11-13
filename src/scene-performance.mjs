import { blockDuringPrerenderLoad, showPrerenderLoading } from "./prerender-loading.mjs";

const fallbackKey = "portfolio-dlb-prerender";

export function wantsLiveScene() {
  return new URLSearchParams(location.search).get("animacion") === "3d";
}

export function prefersPrerender() {
  try { return sessionStorage.getItem(fallbackKey) === "1"; } catch { return false; }
}

export function openPrerender({ progress = 0, phase = "" } = {}) {
  try { sessionStorage.setItem(fallbackKey, "1"); } catch { /* Optional persistence. */ }
  const url = new URL("./prerender.html", location.href);
  url.search = location.search;
  url.searchParams.delete("animacion");
  url.searchParams.set("carga", "1");
  if (progress > 0 && progress < 1) url.searchParams.set("progreso", progress.toFixed(3));
  if (phase) url.searchParams.set("fase", phase);
  url.hash = location.hash;
  showPrerenderLoading(0);
  blockDuringPrerenderLoad();
  showPrerenderLoading(25, 300);
  setTimeout(() => location.replace(url), 360);
}

export function createFrameMonitor() {
  const warmup = 450;
  const windowDuration = 900;
  const minimumFps = 27;
  let start;
  let windowStart;
  let frames;
  let slowWindows;

  function reset() {
    start = windowStart = undefined;
    frames = slowWindows = 0;
  }

  function isSlow(now) {
    start ??= now;
    if (now - start < warmup) return false;
    windowStart ??= now;
    const elapsed = now - windowStart;
    if (elapsed < windowDuration) {
      frames++;
      return false;
    }
    slowWindows = frames * 1000 / elapsed < minimumFps ? slowWindows + 1 : 0;
    windowStart = now;
    frames = 1;
    return slowWindows >= 2;
  }

  reset();
  return { reset, isSlow };
}
