import { createPresentation } from "./presentation.mjs";
import { arrivalOpacity, flightEnd, flightTime, framesPerSecond } from "./prerender-timeline.mjs";
import { blockDuringPrerenderLoad, revealPrerender, showPrerenderLoading } from "./prerender-loading.mjs";
import { translate } from "./i18n.mjs";

const clamp = value => Math.min(1, Math.max(0, value));
function smoothstep(value, start, end) {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

const portrait = matchMedia("(orientation: portrait)");
const video = document.querySelector(".prerender-video");
const background = document.querySelector(".prerender-background");
const still = document.querySelector(".prerender-still");
const sequence = document.querySelector(".sequence");
const params = new URLSearchParams(location.search);
const resumeProgress = clamp(Number(params.get("progreso")) || 0);
let theme = "noche";
let media = "";
let finished = false;
let stageVisible = false;
let timeout;
let scrollFrame = 0;
let playing = false;
let playbackTime = 0;
let playAttempt = 0;

const { root, stage, reducedMotion, linkedChapter, skipButton, setArrival } = createPresentation({
  onTheme(day) {
    theme = day ? "dia" : "noche";
    if (media) loadMedia();
  },
  onSkipContent: () => finish(),
  translate: text => translate(document.documentElement.lang, text),
});

function watchLoading() {
  clearTimeout(timeout);
  if (!document.hidden) timeout = setTimeout(finish, 6500);
}

function finish() {
  if (finished) return;
  finished = true;
  playAttempt++;
  clearTimeout(timeout);
  cancelAnimationFrame(scrollFrame);
  root.removeAttribute("data-descent");
  root.removeAttribute("data-sequence");
  window.scrollTo({ top: 0, behavior: "instant" });
  setArrival(true, 1, document.activeElement === skipButton);
  video.hidden = true;
  video.pause();
  video.removeAttribute("src");
  video.removeAttribute("poster");
  video.load();
  syncBackground();
  revealPrerender();
}

function syncBackground() {
  if (!finished || !stageVisible || document.hidden || reducedMotion.matches) {
    background.pause();
    if (reducedMotion.matches) background.hidden = true;
    return;
  }
  const source = media + ".llegada.mp4";
  if (background.getAttribute("src") !== source) {
    background.hidden = true;
    background.src = source;
  }
  background.play().catch(() => { /* The image stays behind the title. */ });
}

function loadMedia() {
  const next = still.dataset.media + (portrait.matches ? "vertical" : "horizontal") + "-" + theme;
  if (next === media) return;
  media = next;
  still.src = media + ".llegada.webp";
  background.hidden = true;
  if (finished) {
    syncBackground();
    return;
  }
  if (playing && !video.paused && video.readyState >= HTMLMediaElement.HAVE_METADATA) playbackTime = video.currentTime;
  playAttempt++;
  video.poster = media + ".webp";
  video.src = media + ".mp4";
  watchLoading();
}

function travelDistance() {
  return Math.max(1, sequence.offsetHeight - stage.offsetHeight);
}

function updateScroll() {
  scrollFrame = 0;
  if (finished || document.hidden) return;
  if (playing) {
    if (!video.seeking && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setArrival(false, arrivalOpacity(smoothstep(video.currentTime, 0, flightEnd), smoothstep));
      revealPrerender();
    }
    if (!video.paused) scheduleScroll();
    return;
  }
  const distance = travelDistance();
  const atEnd = scrollY >= distance - 1;
  const progress = atEnd ? 1 : clamp(scrollY / distance);
  stage.style.setProperty("--scroll-progress", progress.toFixed(3));
  if (video.readyState < HTMLMediaElement.HAVE_METADATA || video.seeking) return;

  const frameReady = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
  if (frameReady) {
    setArrival(false, arrivalOpacity(smoothstep(video.currentTime, 0, flightEnd), smoothstep));
  }
  // Keep the seek inside the last frame and coalesce scroll input while decoding.
  const lastFrame = Math.max(0, video.duration - .5 / framesPerSecond);
  const target = Math.min(progress * video.duration, lastFrame);
  if (Math.abs(target - video.currentTime) >= .5 / framesPerSecond) {
    video.currentTime = target;
    watchLoading();
    return;
  }
  if (!frameReady) return;
  clearTimeout(timeout);
  revealPrerender();
  if (atEnd) finish();
}

function scheduleScroll() {
  if (!finished && !scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
}

function playFlight() {
  if (finished || !playing || document.hidden || video.seeking) return;
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA &&
      Math.abs(video.currentTime - playbackTime) >= .5 / framesPerSecond) {
    video.currentTime = Math.min(playbackTime, video.duration);
    watchLoading();
    return;
  }
  const attempt = ++playAttempt;
  watchLoading();
  video.play().catch(() => {
    if (attempt === playAttempt) finish();
  });
}

function startFlight(time) {
  if (finished || playing) return;
  playing = true;
  playbackTime = time;
  root.removeAttribute("data-descent");
  window.scrollTo({ top: 0, behavior: "instant" });
  setArrival(false, 0);
  playFlight();
}

video.addEventListener("loadedmetadata", () => {
  if (playing && video.paused) playFlight();
});
video.addEventListener("loadeddata", scheduleScroll);
video.addEventListener("seeked", () => {
  if (playing && video.paused) playFlight();
  scheduleScroll();
});
video.addEventListener("playing", () => {
  clearTimeout(timeout);
  scheduleScroll();
});
video.addEventListener("waiting", watchLoading);
video.addEventListener("ended", finish);
video.addEventListener("error", finish);
still.addEventListener("load", () => { if (finished) revealPrerender(); });
still.addEventListener("error", () => { if (finished) revealPrerender(); });
background.addEventListener("playing", () => {
  if (!reducedMotion.matches) background.hidden = false;
});
background.addEventListener("error", () => { background.hidden = true; });
skipButton.addEventListener("click", () => startFlight(0));
portrait.addEventListener("change", loadMedia);
window.addEventListener("scroll", scheduleScroll, { passive: true });
window.addEventListener("resize", scheduleScroll, { passive: true });
new IntersectionObserver(([entry]) => {
  stageVisible = entry.isIntersecting && entry.intersectionRatio > 0;
  syncBackground();
}, { threshold: Number.EPSILON }).observe(stage);
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) finish();
  syncBackground();
});
document.addEventListener("visibilitychange", () => {
  if (!finished) {
    if (document.hidden && playing) {
      playbackTime = video.currentTime;
      playAttempt++;
      video.pause();
    }
    watchLoading();
    if (!document.hidden) {
      if (playing) playFlight();
      else scheduleScroll();
    }
  }
  syncBackground();
});

if (reducedMotion.matches || linkedChapter || params.get("fase") === "llegada") {
  finished = true;
  setArrival(true);
  if (root.hasAttribute("data-prerender-loading")) setTimeout(revealPrerender, 1800);
} else {
  root.dataset.sequence = "";
  root.dataset.descent = "";
  setArrival(false, 0);
  video.hidden = false;
  if (resumeProgress && params.get("fase") !== "vuelo") window.scrollTo({
    top: travelDistance() * flightTime(resumeProgress) / flightEnd,
    behavior: "instant",
  });
}
loadMedia();
if (params.get("fase") === "vuelo") startFlight(flightTime(resumeProgress));
if (root.hasAttribute("data-prerender-loading")) {
  blockDuringPrerenderLoad();
  showPrerenderLoading(88, 2200);
}
scheduleScroll();
