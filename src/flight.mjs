import { CatmullRomCurve3, MathUtils, Vector3 } from "./vendor/three.module.min.js";

const { lerp, smoothstep } = MathUtils;
const frames = [
  { p: 0,   position: [0, 63, 69],       aim: [0, 50, -14],    fov: 56, roll: .018 },
  { p: .12, position: [-.5, 56, 61],     aim: [0, 24, 0],      fov: 58, roll: -.038 },
  { p: .28, position: [-2.1, 40, 50],    aim: [.5, 10, -15],   fov: 64, roll: .077 },
  { p: .43, position: [1.55, 19, 39],    aim: [.3, 3.2, -4],   fov: 65, roll: -.066 },
  { p: .55, position: [.5, 7.5, 25],     aim: [0, 3.35, 0],    fov: 57, roll: .028 },
  { p: .66, position: [0, 3.85, 10.9],   aim: [0, 3.35, 0],    fov: 49, roll: 0 },
  { p: .77, position: [0, 3.56, 10.3],   aim: [0, 3.35, 0],    fov: 48, roll: 0 },
  { p: .82, position: [0, 3.35, 5.3],    aim: [0, 3.34, -8],   fov: 54, roll: 0 },
  { p: .87, position: [0, 3.35, -.6],    aim: [0, 3.35, -55],  fov: 64, roll: 0 },
  { p: .94, position: [0, 3.43, -11.8],  aim: [0, 3.5, -76],   fov: 53, roll: 0 },
  { p: 1,   position: [0, 3.45, -13],    aim: [0, 3.45, -86],  fov: 50, roll: 0 },
];
const path = new CatmullRomCurve3(frames.map(frame => new Vector3(...frame.position)));
const aimPath = new CatmullRomCurve3(frames.map(frame => new Vector3(...frame.aim)));
const aim = new Vector3();

export function placeCamera(camera, progress, pointer) {
  const last = frames.length - 1;
  const next = frames.findIndex(frame => frame.p > progress);
  const index = next > 0 ? next - 1 : last - 1;
  const from = frames[index];
  const to = frames[index + 1];
  const mix = (progress - from.p) / (to.p - from.p);
  const pathProgress = (index + mix) / last;
  path.getPoint(pathProgress, camera.position);
  aimPath.getPoint(pathProgress, aim);

  // Keep the whole sphere in view when the viewport is narrower than the lens.
  const nearOrb = smoothstep(progress, .53, .65) * (1 - smoothstep(progress, .77, .85));
  const portrait = Math.max(0, 1 - camera.aspect);
  camera.position.z += nearOrb * portrait * 11;
  const lookAround = 1 - smoothstep(progress, .52, .67);
  aim.x += pointer.x * 1.35 * lookAround;
  aim.y += pointer.y * .75 * lookAround;
  camera.fov = lerp(from.fov, to.fov, smoothstep(mix, 0, 1));
  camera.lookAt(aim);
  camera.rotateZ(lerp(from.roll, to.roll, smoothstep(mix, 0, 1)));
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}
