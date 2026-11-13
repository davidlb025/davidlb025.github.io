import { createCircuitDemo } from "./circuit-demo.mjs";
import { createJourneyPrism } from "./journey-prism.mjs";

const clamp = value => Math.max(0, Math.min(1, value));
const topOf = element => element.getBoundingClientRect().top + window.scrollY;

export function createPortfolioContent(nav, reducedMotion) {
  const root = document.documentElement;
  const content = document.querySelector(".portfolio-content");
  const atmosphere = content.querySelector(".portfolio-atmosphere");
  const chapters = [...content.querySelectorAll(".chapter")];
  const links = [...nav.querySelectorAll("a")];
  const rail = content.querySelector(".project-rail");
  const viewer = rail.querySelector(".project-viewer");
  const projects = [...rail.querySelectorAll(".project-step")];
  const figures = projects.map(project => project.querySelector(".project-figure"));
  const circuitJump = rail.querySelector(".circuit-jump");
  const storyMap = chapters[0].querySelector(".story-map");
  const storyRoute = storyMap.querySelector(".map-route");
  const mapSignal = storyMap.querySelector(".map-signal");
  const toolsFigure = rail.querySelector(".project-figure--tools");
  const contactSignal = content.querySelector(".contact-signal");
  const sticky = matchMedia("(min-width: 900px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)");
  const usesViewer = () => sticky.matches && !root.hasAttribute("data-large-text");
  const ease = getComputedStyle(content).getPropertyValue("--ease-out").trim();
  const transitions = new Map();
  const reveals = new Set();
  const progress = new WeakMap();
  let geometry;
  let activeProject = -1;
  let activeChapter = -1;
  let frame = 0;
  let needsMeasure = true;
  let routeLength;
  let atmosphereProgress;
  let lastAtmosphereFrame = 0;

  rail.style.setProperty("--project-count", projects.length);

  function cancelTransitions() {
    for (const animation of transitions.values()) animation.cancel();
    transitions.clear();
  }

  function interruptedState(figure) {
    if (!transitions.has(figure)) return undefined;
    const style = getComputedStyle(figure);
    return { opacity: style.opacity, transform: style.transform };
  }

  function setProject(index, animate) {
    if (index === activeProject && (animate || !transitions.size)) return;
    const previous = activeProject;
    activeProject = index;
    const outgoing = figures[previous];
    const incoming = figures[index];
    const outgoingState = animate ? interruptedState(outgoing) : undefined;
    const incomingState = animate ? interruptedState(incoming) : undefined;
    cancelTransitions();

    figures.forEach((figure, position) => {
      figure.inert = position !== index;
      figure.hidden = position !== index && (!animate || position !== previous);
    });
    if (!animate || previous < 0) return;

    const direction = Math.sign(index - previous);
    const exit = outgoing.animate([
      outgoingState ?? { opacity: 1, transform: "none" },
      { opacity: 0, transform: `translate3d(${-16 * direction}px, -9px, 0) scale(.985)` },
    ], { duration: 380, easing: ease });
    const enter = incoming.animate([
      incomingState ?? { opacity: 0, transform: `translate3d(${24 * direction}px, 12px, 0) scale(.978)` },
      { opacity: 1, transform: "none" },
    ], { duration: 680, easing: ease });
    transitions.set(outgoing, exit);
    transitions.set(incoming, enter);
    exit.onfinish = () => {
      if (transitions.get(outgoing) !== exit) return;
      outgoing.hidden = true;
      transitions.delete(outgoing);
    };
    enter.onfinish = () => {
      if (transitions.get(incoming) === enter) transitions.delete(incoming);
    };
  }

  function syncViewer() {
    const enabled = usesViewer();
    if (enabled === rail.hasAttribute("data-viewer")) {
      invalidate();
      return;
    }
    const focus = document.activeElement;
    const focusedFigure = figures.findIndex(figure => figure.contains(focus));
    cancelTransitions();
    rail.toggleAttribute("data-viewer", enabled);
    viewer.hidden = !enabled;
    activeProject = -1;
    figures.forEach((figure, index) => {
      if (enabled) viewer.append(figure);
      else projects[index].append(figure);
      figure.hidden = false;
      figure.inert = false;
    });
    if (enabled) setProject(Math.max(0, focusedFigure), false);
    if (focusedFigure >= 0) focus.focus({ preventScroll: true });
    if (!enabled && focus === circuitJump) {
      figures[0].querySelector("button").focus({ preventScroll: true });
    }
    invalidate();
  }

  function setProgress(element, name, value) {
    const next = clamp(value).toFixed(3);
    if (progress.get(element) === next) return false;
    progress.set(element, next);
    element.style.setProperty(name, next);
    return true;
  }

  function updateSignals(y, h, now) {
    const atmosphereTarget = clamp((y + h * .65 - geometry.chapters[0]) / (geometry.end - geometry.chapters[0]));
    const elapsed = lastAtmosphereFrame ? Math.min(50, now - lastAtmosphereFrame) : 17;
    atmosphereProgress ??= atmosphereTarget;
    atmosphereProgress += (atmosphereTarget - atmosphereProgress) * (1 - Math.exp(-elapsed / 145));
    if (Math.abs(atmosphereTarget - atmosphereProgress) > .002) {
      lastAtmosphereFrame = now;
      schedule();
    } else {
      lastAtmosphereFrame = 0;
      atmosphereProgress = atmosphereTarget;
    }
    setProgress(atmosphere, "--atmosphere-progress", atmosphereProgress);
    const storyProgress = clamp((y + .79 * h - geometry.chapters[0]) / (.66 * h));
    if (setProgress(chapters[0], "--story-progress", storyProgress)) {
      routeLength ??= storyRoute.getTotalLength();
      const point = storyRoute.getPointAtLength(routeLength * storyProgress);
      mapSignal.setAttribute("transform", `translate(${point.x} ${point.y})`);
    }
  }

  function update(now) {
    frame = 0;
    if (needsMeasure) {
      needsMeasure = false;
      geometry = content.getClientRects().length ? {
        chapters: chapters.map(topOf),
        projects: usesViewer() ? projects.map(topOf) : [],
        end: content.getBoundingClientRect().bottom + scrollY,
      } : undefined;
    }
    if (!geometry) return;
    const y = window.scrollY;
    const h = window.innerHeight;
    const chapter = geometry.chapters.findLastIndex(top => top <= y + .35 * h);
    if (chapter !== activeChapter) {
      links[activeChapter]?.removeAttribute("aria-current");
      links[chapter]?.setAttribute("aria-current", "location");
      activeChapter = chapter;
    }
    if (!reducedMotion.matches) updateSignals(y, h, now);

    if (usesViewer()) {
      const project = Math.max(0, geometry.projects.findLastIndex(top => top < y + .57 * h));
      const isVisible = geometry.chapters[1] < y + h && geometry.chapters[2] > y;
      if (project !== activeProject && viewer.querySelector(":focus-visible")) {
        projects[project].querySelector("h3").focus({ preventScroll: true });
      }
      setProject(project, isVisible && !reducedMotion.matches);
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  function invalidate() {
    needsMeasure = true;
    schedule();
  }

  function syncMotion() {
    content.toggleAttribute("data-content-motion", !reducedMotion.matches);
    if (reducedMotion.matches) {
      if (activeProject >= 0) setProject(activeProject, false);
      atmosphereProgress = undefined;
      lastAtmosphereFrame = 0;
      for (const animation of reveals) animation.cancel();
      reveals.clear();
      for (const [element, name] of [
        [chapters[0], "--story-progress"], [atmosphere, "--atmosphere-progress"],
      ]) {
        element.style.removeProperty(name);
        progress.delete(element);
      }
    }
    invalidate();
  }

  const revealObserver = new IntersectionObserver(entries => {
    let stagger = 0;
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      revealObserver.unobserve(target);
      if (reducedMotion.matches || target.contains(document.activeElement)) continue;

      const isTitle = target.matches(".chapter-title, h3, .story-lead, .contact-lead");
      const keyframes = isTitle ? [
        { opacity: .24, transform: "translateY(.35em)", clipPath: "inset(-12% -4% 22% -4%)" },
        { opacity: 1, transform: "none", clipPath: "inset(-12% -4% -14% -4%)" },
      ] : [
        { opacity: 0, transform: "translateY(17px)" },
        { opacity: 1, transform: "none" },
      ];
      const animation = target.animate(keyframes, {
        delay: Math.min(stagger++ * 44, 176),
        duration: isTitle ? 660 : 500,
        easing: ease,
        fill: "backwards",
      });
      reveals.add(animation);
      animation.onfinish = animation.oncancel = () => reveals.delete(animation);
      target.addEventListener("focusin", () => animation.cancel(), { once: true });
    }
  }, { rootMargin: "0px 0px 48px", threshold: .01 });
  content.querySelectorAll("[data-reveal]").forEach(element => revealObserver.observe(element));

  const sceneObserver = new IntersectionObserver(entries => {
    for (const { target, intersectionRatio } of entries) target.toggleAttribute("data-in-view", intersectionRatio >= .01);
  }, { threshold: .01 });
  [storyMap, toolsFigure, contactSignal].forEach(element => sceneObserver.observe(element));

  function updateVisibility() {
    contactSignal.toggleAttribute("data-page-hidden", document.hidden);
  }
  document.addEventListener("visibilitychange", updateVisibility);
  updateVisibility();

  circuitJump.addEventListener("click", event => {
    if (activeProject !== 0) projects[0].scrollIntoView({ block: "start", behavior: "instant" });
    setProject(0, false);
    const input = figures[0].querySelector("button");
    input.focus({ preventScroll: true });
    const remaining = input.getBoundingClientRect().bottom - window.innerHeight + 20;
    if (remaining > 0) {
      window.scrollBy({ top: remaining, behavior: reducedMotion.matches || event.detail === 0 ? "instant" : "smooth" });
    }
  });
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", invalidate);
  sticky.addEventListener("change", syncViewer);
  root.addEventListener("portfolio-text-size", syncViewer);
  reducedMotion.addEventListener("change", syncMotion);
  new ResizeObserver(invalidate).observe(content);
  document.fonts.ready.then(invalidate);

  createCircuitDemo(reducedMotion);
  createJourneyPrism(content.querySelector(".journey-prism"));
  syncMotion();
  syncViewer();
}
