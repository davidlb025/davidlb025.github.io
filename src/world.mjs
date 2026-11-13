import * as THREE from "./vendor/three.module.min.js";
import { Impact } from "./impact.mjs";

const atmosphere = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.13, 0.37, 0.51));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3(vec3 p) {
    vec3 cell = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(cell), hash(cell + vec3(1,0,0)), f.x),
          mix(hash(cell + vec3(0,1,0)), hash(cell + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(cell + vec3(0,0,1)), hash(cell + vec3(1,0,1)), f.x),
          mix(hash(cell + vec3(0,1,1)), hash(cell + vec3(1,1,1)), f.x), f.y), f.z);
  }

  vec3 sunDirection(float day) {
    return normalize(vec3(mix(0.065, -0.17, day), mix(0.018, 0.095, day), -1.0));
  }

  vec3 skyColor(vec3 ray, float day, float stars) {
    float above = max(ray.y, 0.0);
    vec3 sun = sunDirection(day);
    float alignment = max(dot(ray, sun), 0.0);
    float lift = exp(-above * 11.0);
    vec3 zenith = mix(vec3(0.002, 0.004, 0.025), vec3(0.095, 0.33, 0.51), day);
    vec3 horizon = mix(vec3(0.031, 0.044, 0.16), vec3(0.49, 0.72, 0.77), day);
    vec3 color = mix(zenith, horizon, lift);
    vec3 halo = mix(vec3(0.22, 0.17, 0.84), vec3(0.95, 0.58, 0.27), day);
    color += halo * (pow(alignment, 25.0) * 0.28 + pow(alignment, 135.0) * 0.58);
    color += mix(vec3(0.36, 0.57, 1.0), vec3(1.0, 0.85, 0.60), day)
      * (pow(alignment, 6400.0) * 2.4 + pow(alignment, 310.0) * 0.33);
    float shaft = exp(-abs(ray.x - sun.x) * 165.0) * exp(-abs(ray.y - sun.y) * 6.0);
    color += (halo + vec3(0.06, 0.11, 0.22)) * shaft * (0.24 + 0.05 * day) * max(-ray.z, 0.0);
    if (stars > 0.0) {
      float arc = ray.y - (0.20 + 0.12 * sin(ray.x * 3.3 + 1.0));
      float veil = exp(-abs(arc) * 24.0) * smoothstep(0.28, 0.80, noise3(ray * vec3(9.0, 8.0, 5.0) + 7.0));
      color += vec3(0.048, 0.022, 0.17) * veil * (1.0 - day);
      vec2 field = vec2(atan(ray.z, ray.x), asin(clamp(ray.y, -1.0, 1.0))) * 107.0;
      vec2 cell = floor(field);
      vec2 offset = vec2(hash(vec3(cell, 1.0)), hash(vec3(cell, 2.0))) * 0.5 + 0.25;
      float spark = 1.0 - smoothstep(0.019, 0.11, length(fract(field) - offset));
      float amount = smoothstep(0.936, 1.0, hash(vec3(cell, 3.0)));
      color += vec3(0.29, 0.40, 0.84) * amount * spark * smoothstep(-0.04, 0.20, ray.y) * (1.0 - day) * stars;
    }
    return color;
  }
`;

const worldVertex = /* glsl */ `
  varying vec3 worldPoint;
  void main() {
    worldPoint = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(worldPoint, 1.0);
  }
`;

const skyFragment = /* glsl */ `
  varying vec3 worldPoint;
  uniform float day;
  ${atmosphere}
  void main() {
    vec3 ray = normalize(worldPoint - cameraPosition);
    vec3 color = skyColor(ray, day, 1.0);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const waterFragment = /* glsl */ `
  varying vec3 worldPoint;
  uniform float day;
  uniform float time;
  ${atmosphere}
  void main() {
    vec3 ray = normalize(worldPoint - cameraPosition);
    float distanceToEye = length(worldPoint - cameraPosition);
    vec2 p = worldPoint.xz;
    float w1 = sin(p.y * 2.3 + sin(p.x * 0.31) * 1.6 + time * 0.67);
    float w2 = sin(p.y * 3.9 - sin(p.x * 0.57) * 2.5 - time * 0.48);
    float ripple = w1 * 0.64 + w2 * 0.36;
    vec3 surfaceNormal = normalize(vec3(w2 * 0.012, 1.0, ripple * 0.023));
    vec3 reflected = reflect(ray, surfaceNormal);
    float fresnel = pow(1.0 - max(0.0, -ray.y), 3.6);
    vec3 sky = skyColor(reflected, day, 0.0);
    vec3 water = mix(vec3(0.004, 0.009, 0.042), vec3(0.09, 0.34, 0.43), day);
    vec3 color = mix(water, sky * mix(0.57, 0.77, day), fresnel * 0.85);
    float trail = exp(-abs(reflected.x - sunDirection(day).x) * (12.0 + abs(ripple) * 13.0));
    trail *= pow(max(0.0, -reflected.z), 10.0);
    trail *= exp(-abs(reflected.y - 0.10) * 5.0);
    vec3 reflection = mix(vec3(0.13, 0.18, 0.86), vec3(1.0, 0.69, 0.38), day);
    float rippleLine = pow(0.5 + ripple * 0.5, 5.0);
    float waveFade = 1.0 - smoothstep(22.0, 76.0, distanceToEye);
    color += reflection * trail * (0.12 + 0.34 * rippleLine);
    color += sky * rippleLine * waveFade * 0.12;
    vec3 nearMist = mix(vec3(0.051, 0.078, 0.27), vec3(0.50, 0.73, 0.78), day);
    color = mix(color, nearMist, smoothstep(150.0, 360.0, distanceToEye) * 0.46);
    float transparency = mix(0.51, 0.90, 1.0 - fresnel);
    transparency *= 1.0 - smoothstep(160.0, 560.0, distanceToEye);
    gl_FragColor = vec4(color, transparency);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const cloudFragment = /* glsl */ `
  varying vec3 worldPoint;
  uniform float day;
  uniform float time;
  uniform float cloudAmount;
  ${atmosphere}

  float density(vec3 point) {
    float altitude = point.y;
    float envelope = smoothstep(13.0, 25.0, altitude) * (1.0 - smoothstep(48.0, 60.0, altitude));
    vec3 p = (point + vec3(time * 0.25, 0.0, 0.0)) * vec3(0.036, 0.069, 0.034);
    float shape = noise3(p) * 0.53;
    shape += noise3(p * 2.23 + 12.0) * 0.25;
    shape += noise3(p * 4.37 - 8.0) * 0.15;
    shape += noise3(p * 8.51 + 5.0) * 0.07;
    float corridor = 1.0 - exp(-abs(point.x) * 0.096);
    float front = noise3(p * 0.43 + vec3(0.0, 6.0, 2.0));
    float threshold = mix(0.52, 0.43, corridor) + (0.48 - front) * 0.24;
    return max(0.0, shape - threshold) * 0.69 * envelope;
  }

  void main() {
    vec3 ray = normalize(worldPoint - cameraPosition);
    float overhead = smoothstep(0.13, 0.45, ray.y);
    float visibility = cloudAmount * mix(overhead, 1.0, smoothstep(0.10, 0.72, cloudAmount));
    if (visibility < 0.006) discard;
    float dy = abs(ray.y) < 0.0001 ? 0.0001 : ray.y;
    vec2 heights = (vec2(13.0, 60.0) - cameraPosition.y) / dy;
    float start = max(0.2, min(heights.x, heights.y));
    float end = min(330.0, max(heights.x, heights.y));
    if (start >= end) discard;

    vec3 lightRay = sunDirection(day);
    float facing = pow(max(dot(ray, lightRay), 0.0), 10.0);
    vec3 dim = mix(vec3(0.003, 0.005, 0.030), vec3(0.08, 0.24, 0.36), day);
    vec3 bright = mix(vec3(0.16, 0.19, 0.60), vec3(1.0, 0.96, 0.87), day);
    vec3 backLight = mix(vec3(0.095, 0.080, 0.43), vec3(0.49, 0.26, 0.10), day);
    float jitter = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    float stride = (end - start) / float(CLOUD_STEPS);
    float opacity = 0.0;
    vec3 color = vec3(0.0);
    for (int i = 0; i < CLOUD_STEPS; i++) {
      float travel = start + (float(i) + 0.46 + jitter * 0.08) * stride;
      vec3 point = cameraPosition + ray * travel;
      float fog = density(point) * smoothstep(0.35, 4.0, travel);
      if (fog > 0.002) {
        float shadow = density(point + vec3(lightRay.x, 0.65, lightRay.z) * 11.0);
        float scattering = clamp(0.19 + (fog - shadow) * 13.0 + 0.22 * facing, 0.05, 1.0);
        vec3 lit = mix(dim, bright, scattering) + backLight * facing * scattering;
        float amount = (1.0 - exp(-fog * stride * 0.73)) * (1.0 - opacity);
        color += lit * amount;
        opacity += amount;
      }
      if (opacity > 0.98) break;
    }
    if (opacity < 0.007) discard;
    gl_FragColor = vec4(color / max(0.001, opacity), opacity * visibility);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const crystalVertex = /* glsl */ `
  attribute vec3 barycentric;
  attribute float facet;
  uniform float time;
  varying vec3 worldPoint;
  varying vec3 worldNormal;
  varying vec3 edgeCoordinates;
  varying float facetTone;
  varying float mirrored;
  void main() {
    mat4 transform = modelMatrix * instanceMatrix;
    vec4 point = transform * vec4(position, 1.0);
    mat3 basis = mat3(transform);
    vec3 adjustedNormal = normal / vec3(dot(basis[0], basis[0]), dot(basis[1], basis[1]), dot(basis[2], basis[2]));
    worldNormal = normalize(basis * adjustedNormal);
    mirrored = modelMatrix[1][1] < 0.0 ? 1.0 : 0.0;
    if (mirrored > 0.5) {
      float depth = max(0.0, -point.y);
      point.x += sin(point.z * 1.4 + depth * 1.2 + time * 0.7) * min(depth * 0.045, 0.32);
    }
    worldPoint = point.xyz;
    edgeCoordinates = barycentric;
    facetTone = facet;
    gl_Position = projectionMatrix * viewMatrix * point;
  }
`;

const crystalFragment = /* glsl */ `
  uniform float day;
  varying vec3 worldPoint;
  varying vec3 worldNormal;
  varying vec3 edgeCoordinates;
  varying float facetTone;
  varying float mirrored;
  void main() {
    if ((mirrored > 0.5 && worldPoint.y > 0.0) || (mirrored < 0.5 && worldPoint.y < 0.0)) discard;
    vec3 n = normalize(worldNormal) * (gl_FrontFacing ? 1.0 : -1.0);
    vec3 toEye = normalize(cameraPosition - worldPoint);
    float fresnel = pow(1.0 - abs(dot(n, toEye)), 3.0);
    vec3 key = normalize(mix(vec3(0.19, 0.55, -0.81), vec3(-0.45, 0.58, -0.70), day));
    float faceLight = 0.30 + max(dot(n, key), 0.0) * 0.70;
    float bounce = max(dot(n, normalize(vec3(-0.63, 0.37, 0.38))), 0.0) * 0.30;
    vec3 mineral = mix(vec3(0.008, 0.006, 0.082), vec3(0.065, 0.26, 0.34), day);
    vec3 ice = mix(vec3(0.17, 0.32, 1.0), vec3(0.50, 0.89, 0.94), day);
    vec3 warm = mix(vec3(0.31, 0.095, 0.81), vec3(0.97, 0.71, 0.44), day);
    vec3 reflected = reflect(-toEye, n);
    float beam = pow(max(dot(key, reflected), 0.0), 19.0);
    float glint = pow(max(dot(normalize(vec3(-0.46, 0.16, 0.87)), reflected), 0.0), 37.0);
    vec3 lineWidth = max(fwidth(edgeCoordinates), vec3(0.0004));
    vec3 borders = smoothstep(lineWidth * 0.35, lineWidth * 1.30, edgeCoordinates);
    float edge = 1.0 - min(min(borders.x, borders.y), borders.z);
    float seam = sin(dot(worldPoint, vec3(0.26, 2.7, -0.42)) + facetTone * 4.0);
    float inclusion = pow(max(0.0, seam), 14.0) * smoothstep(0.42, 0.95, facetTone);
    float lightFacet = smoothstep(0.67, 0.95, facetTone) * smoothstep(-0.25, 0.95, reflected.y);
    vec3 color = mineral * (faceLight + bounce + facetTone * 0.38);
    color += ice * (fresnel * 0.57 + beam * 1.14 + edge * lightFacet * 0.67 + lightFacet * 0.21);
    color += warm * (lightFacet * 0.23 + inclusion * 0.17);
    color += mix(vec3(0.42, 0.52, 1.0), vec3(1.0, 0.84, 0.63), day) * glint * 0.68;
    float mist = 1.0 - exp(-distance(cameraPosition, worldPoint) * 0.009);
    vec3 fog = mix(vec3(0.044, 0.048, 0.19), vec3(0.43, 0.65, 0.75), day);
    color = mix(color, fog, mist * 0.55);
    if (worldPoint.y < 0.0) color *= mix(vec3(0.45, 0.56, 0.79), vec3(0.68, 0.87, 0.94), day);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createCrystalGeometry(sides, random) {
  const vertices = [];
  const barycentrics = [];
  const shades = [];
  const base = [];
  const waist = [];
  const shoulder = [];
  const tip = [(random() - 0.5) * 0.54, 1.0, (random() - 0.5) * 0.42];
  for (let i = 0; i < sides; i++) {
    const angle = i / sides * Math.PI * 2;
    const radius = 0.70 + random() * 0.27;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    base.push([x * 0.64, -0.94 + random() * 0.12, z * 0.64]);
    waist.push([x, -0.54 + random() * 0.29, z]);
    shoulder.push([x * 0.76 + tip[0] * 0.32, 0.21 + random() * 0.24, z * 0.76 + tip[2] * 0.32]);
  }

  function face(a, b, c, shade) {
    vertices.push(...a, ...b, ...c);
    barycentrics.push(1, 0, 0, 0, 1, 0, 0, 0, 1);
    shades.push(shade, shade, shade);
  }

  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    const shade = random();
    face(base[i], waist[i], waist[j], shade);
    face(base[i], waist[j], base[j], shade * 0.91);
    face(waist[i], shoulder[i], shoulder[j], shade * 0.8 + 0.1);
    face(waist[i], shoulder[j], waist[j], shade * 0.92);
    face(shoulder[i], tip, shoulder[j], random());
    face(base[i], base[j], [0, -0.99, 0], shade);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("barycentric", new THREE.Float32BufferAttribute(barycentrics, 3));
  geometry.setAttribute("facet", new THREE.Float32BufferAttribute(shades, 1));
  geometry.computeVertexNormals();
  return geometry;
}

function makeSkyShell(geometry, fragmentShader, uniforms, renderOrder, transparent, defines = {}) {
  const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
    defines,
    fragmentShader,
    uniforms,
    vertexShader: worldVertex,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    transparent,
  }));
  mesh.renderOrder = renderOrder;
  mesh.frustumCulled = false;
  return mesh;
}

function makeTerrainInstances(geometry, material, random, lowPower) {
  const crystals = [];
  const count = lowPower ? 47 : 67;
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = -20 - random() * 163;
    const opening = Math.max(6.0, 7.5 + (-z - 38.0) * 0.095);
    const x = side * (opening + random() * (5.0 + -z * 0.17));
    const height = 1.1 + Math.pow(random(), 1.6) * (4.2 + -z * 0.073);
    const width = height * (0.40 + random() * 0.44);
    crystals.push({ x, z, height, width, side, tilt: 0.13 + random() * 0.31 });
  }
  crystals.push(
    { x: -10.7, z: -29.5, height: 4.65, width: 3.3, side: -1, tilt: 0.38 },
    { x: 12.0, z: -34.0, height: 5.9, width: 4.1, side: 1, tilt: 0.31 },
    { x: -17.0, z: -41.0, height: 7.1, width: 5.8, side: -1, tilt: 0.41 },
    { x: 20.2, z: -48.0, height: 7.0, width: 4.7, side: 1, tilt: 0.48 },
    { x: -5.3, z: -30.0, height: 1.4, width: 1.3, side: -1, tilt: 0.33 },
    { x: 6.4, z: -37.0, height: 1.8, width: 1.5, side: 1, tilt: 0.27 },
  );

  const mountain = new THREE.InstancedMesh(geometry, material, crystals.length);
  const reflectedMountain = new THREE.InstancedMesh(geometry, material, crystals.length);
  reflectedMountain.scale.y = -1;
  const transform = new THREE.Object3D();
  const originalMatrices = [];
  crystals.forEach(({ x, z, height, width, side, tilt }, i) => {
    transform.position.set(x, height * 0.78, z);
    transform.rotation.set((random() - 0.5) * 0.45, random() * Math.PI * 2, side * tilt);
    transform.scale.set(width, height, width * (0.66 + random() * 0.51));
    transform.updateMatrix();
    originalMatrices.push(transform.matrix.clone());
    mountain.setMatrixAt(i, transform.matrix);
    reflectedMountain.setMatrixAt(i, transform.matrix);
  });
  return { mountain, reflectedMountain, originalMatrices };
}

function makeFlyingInstances(geometry, material, random, lowPower, impacts) {
  const crystalCount = lowPower ? 31 : 51;
  const crystals = [];
  for (let i = 0; i < crystalCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = 61.0 - random() * 119.0;
    const flightZone = Math.max(0, z / 65);
    const x = side * (5.2 + random() * (6.0 + flightZone * 26.0));
    const y = 4.2 + flightZone * 47.0 + (random() - 0.27) * (10.0 + flightZone * 19.0);
    const size = 0.37 + Math.pow(random(), 2.4) * (2.35 + flightZone * 2.0);
    crystals.push({ x, y, z, size, phase: random() * Math.PI * 2, roll: (random() - 0.5) * 2.0 });
  }
  crystals.push(
    { x: -14.6, y: 65.3, z: 42.0, size: 4.7, phase: 2.1, roll: 0.83 },
    { x: -10.5, y: 55.4, z: 49.0, size: 1.1, phase: 3.2, roll: 0.52 },
    { x: 15.4, y: 65.7, z: 42.0, size: 3.95, phase: 3.6, roll: -0.85 },
    { x: 20.5, y: 41.5, z: 31.5, size: 4.35, phase: 3.2, roll: -0.62 },
    { x: -8.0, y: 24.6, z: 29.0, size: 2.60, phase: 0.6, roll: -0.57 },
    { x: 9.5, y: 16.7, z: 18.0, size: 2.05, phase: 4.6, roll: 0.47 },
    { x: -7.2, y: 7.3, z: -25.0, size: 1.05, phase: 2.5, roll: -0.74 },
    { x: 11.0, y: 9.2, z: -34.5, size: 1.24, phase: 2.5, roll: 0.72 },
  );
  const mesh = new THREE.InstancedMesh(geometry, material, crystals.length);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const transform = new THREE.Object3D();
  return {
    mesh,
    move(time) {
      crystals.forEach(({ x, y, z, size, phase, roll }, i) => {
        transform.position.set(x + 0.30 * Math.cos(time * 0.19 + phase),
          y + 0.38 * Math.sin(time * 0.37 + phase), z);
        const impact = impacts.get(i);
        if (impact) {
          transform.position.add(impact.advance(time));
          if (impact.settled) impacts.delete(i);
        }
        transform.rotation.set(0.26 * Math.sin(phase), phase + time * 0.09, roll + time * 0.055);
        transform.scale.set(size * 0.57, size, size * 0.43);
        transform.updateMatrix();
        mesh.setMatrixAt(i, transform.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

export function createLandscape(scene, { lowPower = false } = {}) {
  const group = new THREE.Group();
  group.name = "Lago de cristal";
  scene.add(group);

  const random = seededRandom(4026);
  const uniforms = {
    day: { value: 0 },
    time: { value: 0 },
    cloudAmount: { value: 1 },
  };
  const shell = new THREE.SphereGeometry(180, 24, 16);
  const sky = makeSkyShell(shell, skyFragment, uniforms, -100, false);
  const clouds = makeSkyShell(shell, cloudFragment, uniforms, 10, true, { CLOUD_STEPS: lowPower ? 16 : 24 });

  const waterGeometry = new THREE.PlaneGeometry(1300, 1300);
  waterGeometry.rotateX(-Math.PI * 0.5);
  const lake = new THREE.Mesh(waterGeometry, new THREE.ShaderMaterial({
    uniforms,
    vertexShader: worldVertex,
    fragmentShader: waterFragment,
    depthWrite: false,
    transparent: true,
  }));
  lake.renderOrder = 2;

  const crystalGeometry = createCrystalGeometry(6, random);
  const shardGeometry = createCrystalGeometry(5, random);
  const crystalMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: crystalVertex,
    fragmentShader: crystalFragment,
    side: THREE.DoubleSide,
  });
  const terrainImpacts = new Map();
  const flyingImpacts = new Map();
  const { mountain, reflectedMountain, originalMatrices } = makeTerrainInstances(crystalGeometry, crystalMaterial, random, lowPower);
  const flying = makeFlyingInstances(shardGeometry, crystalMaterial, random, lowPower, flyingImpacts);
  const matrix = new THREE.Matrix4();
  const center = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const size = new THREE.Vector3();
  flying.move(0);
  group.add(sky, mountain, reflectedMountain, flying.mesh, lake, clouds);

  return {
    update({ time, progress, theme, camera }) {
      uniforms.day.value = theme;
      uniforms.time.value = time;
      uniforms.cloudAmount.value = 0.10 + 0.90 * (1.0 - THREE.MathUtils.smoothstep(progress, 0.50, 0.63));
      sky.position.copy(camera.position);
      clouds.position.copy(camera.position);
      flying.move(time);
      if (terrainImpacts.size) {
        for (const [index, impact] of terrainImpacts) {
          const offset = impact.advance(time);
          matrix.copy(originalMatrices[index]);
          if (impact.settled) terrainImpacts.delete(index);
          else matrix.setPosition(center.setFromMatrixPosition(matrix).add(offset));
          mountain.setMatrixAt(index, matrix);
          reflectedMountain.setMatrixAt(index, matrix);
        }
        mountain.instanceMatrix.needsUpdate = true;
        reflectedMountain.instanceMatrix.needsUpdate = true;
      }
    },
    pushCrystal(raycaster, time) {
      // Instanced meshes cache their bounds, but the crystals move between clicks.
      mountain.computeBoundingSphere();
      flying.mesh.computeBoundingSphere();
      const [hit] = raycaster.intersectObjects([mountain, flying.mesh]);
      if (!hit) return;
      const { object, instanceId } = hit;
      const impacts = object === mountain ? terrainImpacts : flyingImpacts;
      object.getMatrixAt(instanceId, matrix);
      center.setFromMatrixPosition(matrix).applyMatrix4(object.matrixWorld);
      direction.subVectors(center, hit.point).normalize();
      size.setFromMatrixScale(matrix);
      const impact = impacts.get(instanceId) ?? new Impact();
      impact.push(direction, THREE.MathUtils.clamp(5 + size.y * 3, 6, 24), time);
      impacts.set(instanceId, impact);
    },
    dispose() {
      group.removeFromParent();
      mountain.dispose();
      reflectedMountain.dispose();
      flying.mesh.dispose();
      shell.dispose();
      waterGeometry.dispose();
      crystalGeometry.dispose();
      shardGeometry.dispose();
      sky.material.dispose();
      clouds.material.dispose();
      lake.material.dispose();
      crystalMaterial.dispose();
    },
  };
}
