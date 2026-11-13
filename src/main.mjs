import { MathUtils, Raycaster, Sphere, Vector2, Vector3 } from "./vendor/three.module.min.js";
import { makeWorld, prepareScene, updateScene } from "./scene.mjs";
import { createPresentation } from "./presentation.mjs";
import { arrivalOpacity, automaticFlightDuration, portalOpacity as flightFlash, sphereStop } from "./prerender-timeline.mjs";
import { openPrerender, createFrameMonitor, prefersPrerender, wantsLiveScene } from "./scene-performance.mjs";
import { translate } from "./i18n.mjs";

const { clamp, damp, smoothstep } = MathUtils;
const canvas = document.querySelector(".world");
const coarsePointer = matchMedia("(pointer: coarse)");
const compact = matchMedia("(max-width: 700px), (pointer: coarse)");
const forceLive = wantsLiveScene();
const frameMonitor = createFrameMonitor();

let targetTheme = 0;
let world;
let request = 0;
let previousTime = 0;
let entry;
let failed = false;
let stageVisible = true;
let descentLength = 1;
let scrollIndicator;
let arrivedState;
let portalOpacity;
let orbDiameter;
let orbTransform;

const scrollProgress = () => clamp(scrollY / descentLength, 0, 1);

const cursor = new Vector2();
const cameraPointer = new Vector2();
const orbPointer = new Vector2();
const mouse = { active: false, x: 0, y: 0 };
const orbCenter = new Vector3();
const orbEdge = new Vector3();
const cameraRight = new Vector3();
const clickRay = new Raycaster();
const clickPosition = new Vector2();
const hitSphere = new Sphere();
const hitPoint = new Vector3();
const pushDirection = new Vector3();
const projectedOrb = { x: 0, y: 0, radius: 0 };
let proximity = 0;

function setTheme(theme) {
  targetTheme = theme;
  if (world) {
    world.themeFrom = world.theme;
    world.themeChangedAt = performance.now();
  }
}

function resize() {
  if (!world || !root.hasAttribute("data-sequence")) return;
  if (!entry) descentLength = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const { clientWidth: width, clientHeight: height } = stage;
  if (width === world.width && height === world.height) return;
  world.width = width;
  world.height = height;
  world.camera.aspect = width / Math.max(1, height);
  const ratio = Math.min(world.pixelRatio, Math.sqrt(world.pixelBudget / Math.max(1, width * height)));
  world.renderer.setDrawingBufferSize(width, height, ratio);
}

function setArrival(arrived, opacity = 1) {
  const focusHeading = arrived && entry && !entry.arrived;
  if (focusHeading) entry.arrived = true;
  arrivedState = arrived;
  updateArrival(arrived, opacity, focusHeading);
}

function pauseFrames() {
  if (request) cancelAnimationFrame(request);
  request = 0;
  previousTime = 0;
  frameMonitor.reset();
}

function stopSequence() {
  const wasDescending = root.hasAttribute("data-descent");
  pauseFrames();
  root.removeAttribute("data-sequence");
  root.removeAttribute("data-descent");
  setArrival(true);
  if (document.activeElement === orbTarget) heading.focus({ preventScroll: true });
  orbTarget.hidden = true;
  setPortalOpacity(0);
  if (wasDescending) window.scrollTo({ top: 0, behavior: "instant" });
}

function startSequence() {
  if (failed || reducedMotion.matches || !stageVisible || document.hidden) return;
  if (!forceLive && prefersPrerender()) {
    fallBack();
    return;
  }
  try {
    world ??= makeWorld(canvas, targetTheme, { compact: compact.matches });
    if (!world) {
      fallBack();
      return;
    }
    world.theme = targetTheme;
    world.themeFrom = targetTheme;
    root.dataset.sequence = "";
    root.toggleAttribute("data-descent", !entry);
    setArrival(Boolean(entry), entry ? 1 : 0);
    resize();
    world.progress = entry ? 1 : scrollProgress() * sphereStop;
    scheduleFrame();
  } catch (error) {
    fallBack(error);
  }
}

function fallBack(error) {
  if (failed) return;
  failed = true;
  pauseFrames();
  openPrerender({
    progress: world?.progress,
    phase: arrivedState ? "llegada" : entry ? "vuelo" : "",
  });
  if (error) console.warn("La escena 3D pasó a la versión prerenderizada.", error);
}

function updateMotion() {
  if (reducedMotion.matches) stopSequence();
  else resumeFrames();
}

function resumeFrames() {
  if (!stageVisible || document.hidden) return;
  if (root.hasAttribute("data-sequence")) scheduleFrame();
  else startSequence();
}

function projectOrb() {
  const { orb, camera, width, height } = world;
  orb.root.getWorldPosition(orbCenter);
  cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
  orbEdge.copy(orbCenter).addScaledVector(cameraRight, orb.radius).project(camera);
  orbCenter.project(camera);
  projectedOrb.x = (orbCenter.x + 1) * width * .5;
  projectedOrb.y = (1 - orbCenter.y) * height * .5;
  projectedOrb.radius = Math.abs(orbEdge.x - orbCenter.x) * width * .5;
}

function updateOrbTarget(interactive) {
  if (!interactive) {
    if (orbTarget.hidden) return;
    if (!entry && document.activeElement === orbTarget) themeButton.focus({ preventScroll: true });
    orbTarget.hidden = true;
    return;
  }
  const { x, y, radius } = projectedOrb;
  const diameter = Math.max(44, radius * 2.04);
  const size = diameter.toFixed(1) + "px";
  const transform = "translate3d(" + (x - diameter / 2).toFixed(1) + "px," +
    (y - diameter / 2).toFixed(1) + "px,0)";
  if (size !== orbDiameter) {
    orbDiameter = size;
    orbTarget.style.inlineSize = size;
  }
  if (transform !== orbTransform) {
    orbTransform = transform;
    orbTarget.style.transform = transform;
  }
  if (orbTarget.hidden) orbTarget.hidden = false;
}

function setPortalOpacity(opacity) {
  if (opacity === portalOpacity) return;
  portalOpacity = opacity;
  portalLight.style.opacity = opacity;
}

function renderFrame(now) {
  request = 0;
  if (!world || !stageVisible || document.hidden || !root.hasAttribute("data-sequence")) return;
  if (!forceLive && frameMonitor.isSlow(now)) {
    fallBack();
    return;
  }
  try {
    render(now);
  } catch (error) {
    fallBack(error);
    return;
  }
  scheduleFrame();
}

function scheduleFrame() {
  if (!request && stageVisible && !document.hidden && root.hasAttribute("data-sequence")) {
    request = requestAnimationFrame(renderFrame);
  }
}

function render(now) {
  const dt = previousTime ? clamp((now - previousTime) / 1000, .001, .10) : 1 / 60;
  previousTime = now;

  if (entry) {
    if (entry.arrived) {
      world.progress = 1;
    } else {
      const travel = smoothstep(now - entry.startedAt, entry.delay, entry.delay + entry.duration);
      world.progress = MathUtils.lerp(entry.from, 1, travel);
    }
  } else {
    const scroll = scrollProgress();
    const goal = scroll * sphereStop;
    world.progress = damp(world.progress, goal, 16, dt);
    if (Math.abs(world.progress - goal) < .001) world.progress = goal;
    if (coarsePointer.matches) {
      const indicator = scroll.toFixed(3);
      if (indicator !== scrollIndicator) {
        scrollIndicator = indicator;
        stage.style.setProperty("--scroll-progress", indicator);
      }
    }
  }
  const progress = world.progress;
  world.theme = MathUtils.lerp(world.themeFrom, targetTheme, smoothstep(now - world.themeChangedAt, 0, 620));

  cameraPointer.lerp(cursor, 1 - Math.exp(-6 * dt));
  prepareScene(world, cameraPointer);
  const canInteract = !entry && progress >= .59;
  const radius = Math.max(1, projectedOrb.radius);
  const localX = canInteract && mouse.active ? (mouse.x - projectedOrb.x) / radius : 0;
  const localY = canInteract && mouse.active ? (projectedOrb.y - mouse.y) / radius : 0;
  const near = canInteract && mouse.active ? 1 - smoothstep(Math.hypot(localX, localY), .38, 1.55) : 0;
  proximity = damp(proximity, near, 9, dt);
  orbPointer.x = damp(orbPointer.x, clamp(localX, -1, 1) * near, 9, dt);
  orbPointer.y = damp(orbPointer.y, clamp(localY, -1, 1) * near, 9, dt);

  const hit = entry?.hitAt === undefined ? 0 : Math.exp(-Math.max(0, now - entry.hitAt) / 590);
  updateScene(world, { time: now * .001, pointerX: orbPointer.x, pointerY: orbPointer.y, proximity, hit });
  if (canInteract) projectOrb();
  updateOrbTarget(canInteract);

  setPortalOpacity(Math.round(flightFlash(progress, smoothstep) * 1000) / 1000);
  setArrival(progress >= 1, arrivalOpacity(progress, smoothstep));
  world.renderer.render(world.scene, world.camera);
}

function aimClick(event) {
  const bounds = stage.getBoundingClientRect();
  clickPosition.set(
    (event.clientX - bounds.left) / bounds.width * 2 - 1,
    1 - (event.clientY - bounds.top) / bounds.height * 2,
  );
  clickRay.setFromCamera(clickPosition, world.camera);
}

function enterPortfolio(from, startedAt, { automatic = false } = {}) {
  entry = {
    startedAt,
    from,
    delay: automatic ? 0 : 430,
    duration: automatic ? Math.max(460, (1 - from) * automaticFlightDuration) : 1700,
    hitAt: automatic ? entry?.hitAt : startedAt,
    automatic,
    arrived: false,
  };
  root.removeAttribute("data-descent");
  window.scrollTo({ top: 0, behavior: "instant" });
  resize();
  navigation.measure();
}

const {
  root, stage, themeButton, skipButton, orbTarget, portalLight, heading,
  reducedMotion, navigation, linkedChapter, setArrival: updateArrival,
} = createPresentation({
  onTheme: setTheme,
  onSkipContent() {
    entry = { arrived: true };
    stopSequence();
  },
  translate: text => translate(document.documentElement.lang, text),
});
if (linkedChapter) {
  entry = { arrived: true };
  stageVisible = false;
}
skipButton.addEventListener("click", () => {
  if (arrivedState || entry?.automatic || !world) return;
  enterPortfolio(world.progress, performance.now(), { automatic: true });
});
orbTarget.addEventListener("click", event => {
  if (entry || orbTarget.hidden) return;
  const now = performance.now();
  const { orb, camera } = world;
  orb.root.getWorldPosition(hitSphere.center);
  hitSphere.radius = orb.radius;
  camera.getWorldDirection(pushDirection);
  if (event.detail > 0 || event.pointerType) {
    aimClick(event);
    if (clickRay.ray.intersectSphere(hitSphere, hitPoint)) {
      pushDirection.subVectors(hitSphere.center, hitPoint).normalize();
    }
  }
  orb.push(pushDirection, now * .001);
  enterPortfolio(world.progress, now);
});

stage.addEventListener("click", event => {
  if (!world || !root.hasAttribute("data-sequence") || event.target.closest("a, button")) return;
  aimClick(event);
  world.landscape.pushCrystal(clickRay, performance.now() * .001);
});
stage.addEventListener("pointermove", event => {
  if (event.pointerType !== "mouse" || !world) return;
  mouse.active = true;
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  cursor.set(event.clientX / world.width * 2 - 1, 1 - event.clientY / world.height * 2);
}, { passive: true });
stage.addEventListener("pointerleave", () => {
  mouse.active = false;
  cursor.set(0, 0);
});
canvas.addEventListener("webglcontextlost", () => fallBack());
window.addEventListener("resize", resize);
new ResizeObserver(resize).observe(stage);
reducedMotion.addEventListener("change", updateMotion);
const stageObserver = new IntersectionObserver(([observation]) => {
  const visible = observation.isIntersecting && observation.intersectionRatio > 0;
  if (visible === stageVisible) return;
  stageVisible = visible;
  if (visible) resumeFrames();
  else pauseFrames();
}, { threshold: Number.EPSILON });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseFrames();
  else resumeFrames();
});

if (linkedChapter) setArrival(true);
else {
  updateMotion();
  stageObserver.observe(stage);
}
if (linkedChapter) requestAnimationFrame(() => stageObserver.observe(stage));
