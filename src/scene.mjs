import {
  ACESFilmicToneMapping, Color, DirectionalLight, HemisphereLight, MathUtils,
  PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer,
} from "./vendor/three.module.min.js";
import { placeCamera } from "./flight.mjs";
import { createLandscape } from "./world.mjs";
import { createOrb } from "./orb.mjs";

const lightColors = {
  skyNight: new Color("#b8cbff"),
  skyDay: new Color("#e9f8ff"),
  groundNight: new Color("#221943"),
  groundDay: new Color("#76aabb"),
  sunNight: new Color("#a8bfff"),
  sunDay: new Color("#ffe5b5"),
};

export function makeWorld(canvas, targetTheme, { compact = false, capture = false } = {}) {
  const context = canvas.getContext("webgl2", {
    alpha: false,
    antialias: devicePixelRatio < 1.5,
    preserveDrawingBuffer: capture,
    powerPreference: "high-performance",
  });
  if (!context) return;

  const debug = capture ? null : context.getExtension("WEBGL_debug_renderer_info");
  const device = debug ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL) : "";
  const software = /swiftshader|llvmpipe|software rasterizer/i.test(device);
  const lowPower = compact || software;
  const pixelBudget = software ? 540_000 : lowPower ? 1_150_000 : 2_700_000;
  const pixelRatio = Math.min(devicePixelRatio || 1, lowPower ? 1.25 : 1.45);
  const renderer = new WebGLRenderer({ canvas, context, alpha: false });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;

  const scene = new Scene();
  const camera = new PerspectiveCamera(56, 1, .08, 900);
  const ambient = new HemisphereLight(0xffffff, 0x11172f, 1.25);
  const sun = new DirectionalLight(0xffffff, 2);
  sun.position.set(-17, 24, -27);
  scene.add(ambient, sun);
  const landscape = createLandscape(scene, { lowPower });
  const orb = createOrb(scene, { lowPower });
  return {
    renderer, scene, camera, ambient, sun, landscape, orb, pixelBudget, pixelRatio,
    width: 0, height: 0, progress: 0,
    theme: targetTheme, themeFrom: targetTheme, themeChangedAt: -Infinity, paintedTheme: undefined,
  };
}

function paintLights(world) {
  const { ambient, sun, theme } = world;
  if (theme === world.paintedTheme) return;
  world.paintedTheme = theme;
  ambient.color.copy(lightColors.skyNight).lerp(lightColors.skyDay, theme);
  ambient.groundColor.copy(lightColors.groundNight).lerp(lightColors.groundDay, theme);
  ambient.intensity = 1.04 + theme * .48;
  sun.color.copy(lightColors.sunNight).lerp(lightColors.sunDay, theme);
  sun.intensity = 1.82 + theme * .78;
}

export function prepareScene(world, cameraPointer) {
  placeCamera(world.camera, world.progress, cameraPointer);
  paintLights(world);
}

export function updateScene(world, { time, pointerX = 0, pointerY = 0, proximity = 0, hit = 0 }) {
  const { camera, progress, theme, orb, landscape } = world;
  const burst = MathUtils.smoothstep(progress, .768, .925);
  landscape.update({ time, progress, theme, camera });
  orb.update({ time, progress, theme, pointerX, pointerY, proximity, hit, burst });
}
