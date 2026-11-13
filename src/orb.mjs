import * as THREE from './vendor/three.module.min.js';
import { Impact } from './impact.mjs';

const RADIUS = 2.25;
const clamp = (value) => THREE.MathUtils.clamp(value, 0, 1);
const smooth = THREE.MathUtils.smoothstep;

const viewVertex = `
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec3 vLocal;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vLocal = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const glassFragment = `
  uniform float uTime;
  uniform float uTheme;
  uniform float uNear;
  uniform float uHit;
  uniform float uAlpha;
  uniform vec2 uPointer;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec3 vLocal;

  float softBand(float value, float center, float width) {
    return 1.0 - smoothstep(0.0, width, abs(value - center));
  }

  float hash(vec3 point) {
    point = fract(point * 0.3183099 + vec3(0.11, 0.37, 0.72));
    point *= 17.0;
    return fract(point.x * point.y * point.z * (point.x + point.y + point.z));
  }

  float noise3(vec3 point) {
    vec3 cell = floor(point);
    vec3 sub = fract(point);
    vec3 t = sub * sub * (3.0 - 2.0 * sub);
    float a = mix(hash(cell), hash(cell + vec3(1,0,0)), t.x);
    float b = mix(hash(cell + vec3(0,1,0)), hash(cell + vec3(1,1,0)), t.x);
    float c = mix(hash(cell + vec3(0,0,1)), hash(cell + vec3(1,0,1)), t.x);
    float d = mix(hash(cell + vec3(0,1,1)), hash(cell + vec3(1,1,1)), t.x);
    return mix(mix(a, b, t.y), mix(c, d, t.y), t.z);
  }

  void main() {
    vec3 n = normalize(vNormal);
    vec3 view = normalize(cameraPosition - vWorld);
    vec3 p = normalize(vLocal);
    float facing = max(dot(n, view), 0.0);
    float grazing = 1.0 - facing;
    float fresnel = pow(grazing, 3.5);
    vec3 key = normalize(vec3(-0.56, 0.82, 0.42));
    float glint = pow(max(dot(reflect(-key, n), view), 0.0), 42.0);
    float underside = pow(max(dot(n, normalize(vec3(0.38, -0.85, 0.42))), 0.0), 8.0);
    float topRim = smoothstep(-0.35, 0.65, n.y) * pow(grazing, 2.2);

    float time = uTime * 0.24;
    float wisps = noise3(p * 3.9 + vec3(time, -time * 0.2, 0.0));
    float fine = noise3(p * 13.0 - vec3(0.0, time, time * 0.3));
    float curve = p.y * 1.23 + p.x * 0.45 + p.z * 0.23
                + sin(p.x * 4.7 + p.z * 2.5 + time) * 0.09 + wisps * 0.26;
    float vein = softBand(curve, -0.28, 0.075) * (0.2 + wisps);
    float edgeLine = softBand(curve + fine * 0.055, 0.47, 0.026);
    float caustic = softBand(curve, -0.47, 0.165) * (0.55 + wisps * 0.55);
    float nucleus = exp(-15.0 * dot(p.xy - vec2(0.18, -0.46), p.xy - vec2(0.18, -0.46))) * facing;
    float lowerLobe = max(0.0, 0.43 - p.y) * (0.52 + 0.48 * fine);

    vec2 cursor = uPointer * 0.68;
    vec3 touched = normalize(vec3(cursor, 0.82));
    float distanceToTouch = acos(clamp(dot(p, touched), -1.0, 1.0));
    float reflectedTouch = exp(-7.0 * distanceToTouch * distanceToTouch) * uNear;
    float response = uNear * softBand(distanceToTouch, 0.56 + 0.16 * sin(uTime * 2.1), 0.085) * 0.48;
    float clickWave = uHit * softBand(distanceToTouch, 0.15 + 2.9 * (1.0 - uHit), 0.16);
    float energy = response + clickWave * 1.9;

    vec3 night = vec3(0.007, 0.012, 0.042);
    night += vec3(0.025, 0.046, 0.17) * (wisps + lowerLobe * 0.5);
    night += vec3(0.11, 0.055, 0.31) * (fresnel * 0.9 + fine * lowerLobe * 0.18);
    night += vec3(0.1, 0.28, 0.88) * (vein * 0.43 + caustic * 0.28 + nucleus * 0.54);
    night += vec3(0.39, 0.53, 1.0) * (glint * 0.8 + topRim * 0.8 + underside * 0.38);
    night += vec3(0.31, 0.54, 1.0) * (energy + edgeLine * 0.23 + reflectedTouch * 0.53);

    vec3 day = mix(vec3(0.09, 0.29, 0.36), vec3(0.28, 0.57, 0.64), wisps);
    day += vec3(0.07, 0.25, 0.32) * lowerLobe;
    day += vec3(0.94, 0.47, 0.13) * (caustic * 0.46 + nucleus * 0.75 + vein * 0.2);
    day += vec3(0.92, 0.81, 0.52) * (glint + topRim * 0.53 + underside * 0.45 + edgeLine * 0.31);
    day += vec3(0.82, 0.47, 0.18) * (energy + reflectedTouch * 0.6);
    day *= 1.0 - 0.26 * fresnel * (1.0 - smoothstep(-0.65, 0.1, n.y));

    gl_FragColor = vec4(mix(night, day, uTheme), uAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const orbitVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const orbitFragment = `
  uniform float uTime;
  uniform float uTheme;
  uniform float uNear;
  uniform float uHit;
  uniform float uAlpha;
  uniform float uPhase;
  varying vec2 vUv;
  void main() {
    float trail = pow(0.5 + 0.5 * cos(6.28318 * vUv.x - uTime * 1.4 + uPhase), 18.0);
    float shimmer = pow(0.5 + 0.5 * cos(12.56637 * vUv.x + uTime * 0.7 - uPhase), 3.0);
    vec3 night = mix(vec3(0.29, 0.45, 1.0), vec3(0.90, 0.82, 1.0), trail);
    vec3 day = mix(vec3(0.21, 0.43, 0.47), vec3(1.0, 0.66, 0.27), trail);
    vec3 color = mix(night, day, uTheme) * (0.84 + uNear * 0.45 + uHit * 0.9);
    float alpha = uAlpha * (0.28 + 0.53 * trail + 0.17 * shimmer + 0.16 * uNear);
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const haloVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 center = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    gl_Position = projectionMatrix * (center + vec4(position.xy, -0.35, 0.0));
  }
`;

const haloFragment = `
  uniform float uTheme;
  uniform float uNear;
  uniform float uHit;
  uniform float uAlpha;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float corona = exp(-5.5 * r * r) * (1.0 - smoothstep(0.79, 1.0, r));
    vec3 color = mix(vec3(0.16, 0.19, 0.88), vec3(0.83, 0.58, 0.29), uTheme);
    float intensity = mix(0.45, 0.27, uTheme) + 0.26 * uNear + 0.42 * uHit;
    gl_FragColor = vec4(color, corona * intensity * uAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const shardVertex = `
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec3 vLocal;
  void main() {
    mat4 shard = modelMatrix * instanceMatrix;
    vec4 world = shard * vec4(position, 1.0);
    vNormal = normalize(mat3(shard) * normal);
    vWorld = world.xyz;
    vLocal = position;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const shardFragment = `
  uniform float uTheme;
  uniform float uAlpha;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec3 vLocal;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 view = normalize(cameraPosition - vWorld);
    float sheen = pow(1.0 - abs(dot(n, view)), 2.3);
    float light = 0.28 + max(0.0, dot(n, normalize(vec3(-0.6, 0.8, 0.4)))) * 0.74;
    float glare = pow(max(0.0, dot(reflect(-normalize(vec3(-0.6, 0.8, 0.4)), n), view)), 18.0);
    vec3 night = vec3(0.12, 0.21, 0.74) * light + vec3(0.39, 0.45, 1.0) * (sheen + glare);
    vec3 day = vec3(0.16, 0.52, 0.60) * light + vec3(1.0, 0.78, 0.43) * (sheen + glare);
    gl_FragColor = vec4(mix(night, day, uTheme), uAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function createOrb(scene, { lowPower = false } = {}) {
  const root = new THREE.Group();
  root.name = 'Esfera de cristal';
  root.position.set(0, 3.35, 0);
  const origin = root.position.clone();
  const impact = new Impact();
  const tilt = new THREE.Group();
  root.add(tilt);

  const theme = { value: 0 };
  const time = { value: 0 };
  const proximity = { value: 0 };
  const hit = { value: 0 };
  const alpha = { value: 1 };
  const pointer = { value: new THREE.Vector2() };
  const live = { uTheme: theme, uTime: time, uNear: proximity, uHit: hit, uAlpha: alpha };

  const glassGeometry = new THREE.SphereGeometry(RADIUS, lowPower ? 40 : 72, lowPower ? 28 : 48);
  const glassMaterial = new THREE.ShaderMaterial({
    uniforms: { ...live, uPointer: pointer },
    vertexShader: viewVertex,
    fragmentShader: glassFragment,
    transparent: true,
  });
  const glass = new THREE.Mesh(glassGeometry, glassMaterial);
  glass.renderOrder = 3;
  tilt.add(glass);

  const orbitLayout = [
    { radius: 3.63, thickness: 0.014, pitch: 1.28, roll: 0.42, yaw: -0.08 },
    { radius: 3.16, thickness: 0.020, pitch: 1.53, roll: -0.33, yaw: 0.18 },
    { radius: 2.76, thickness: 0.009, pitch: 1.10, roll: 0.14, yaw: -0.3 },
  ];
  const orbits = orbitLayout.map((layout, index) => {
    const geometry = new THREE.TorusGeometry(layout.radius, layout.thickness, 5, lowPower ? 84 : 144);
    const material = new THREE.ShaderMaterial({
      uniforms: { ...live, uPhase: { value: index * 2.1 } },
      vertexShader: orbitVertex,
      fragmentShader: orbitFragment,
      transparent: true,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 4 + index;
    tilt.add(mesh);
    return mesh;
  });

  const haloGeometry = new THREE.PlaneGeometry(14, 14);
  const haloMaterial = new THREE.ShaderMaterial({
    uniforms: live,
    vertexShader: haloVertex,
    fragmentShader: haloFragment,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const halo = new THREE.Mesh(haloGeometry, haloMaterial);
  halo.frustumCulled = false;
  halo.renderOrder = 2;
  root.add(halo);

  const random = seededRandom(22346);
  const shardCount = lowPower ? 42 : 68;
  const shards = Array.from({ length: shardCount }, (_, index) => {
    const y = 1 - 2 * (index + 0.5) / shardCount;
    const angle = index * 2.39996323;
    const rim = Math.sqrt(1 - y * y);
    return {
      normal: new THREE.Vector3(Math.cos(angle) * rim, y, Math.sin(angle) * rim),
      distance: 2.8 + random() * 7.8,
      size: 0.12 + random() ** 1.7 * 0.51,
      spin: (random() - 0.5) * 7.0,
      angle: random() * Math.PI,
    };
  });
  const shardGeometry = new THREE.TetrahedronGeometry(1, 0);
  const shardAlpha = { value: 0 };
  const shardMaterial = new THREE.ShaderMaterial({
    uniforms: { uTheme: theme, uAlpha: shardAlpha },
    vertexShader: shardVertex,
    fragmentShader: shardFragment,
    transparent: true,
    depthWrite: false,
  });
  const debris = new THREE.InstancedMesh(shardGeometry, shardMaterial, shardCount);
  debris.frustumCulled = false;
  debris.renderOrder = 8;
  debris.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  root.add(debris);
  const shape = new THREE.Object3D();
  scene.add(root);

  function update(frame) {
    const burst = clamp(frame.burst);
    root.visible = burst < 0.997;
    if (!root.visible) return;
    root.position.copy(origin).add(impact.advance(frame.time));

    theme.value = clamp(frame.theme);
    time.value = frame.time;
    proximity.value = clamp(frame.proximity);
    hit.value = clamp(frame.hit);
    pointer.value.set(frame.pointerX, frame.pointerY);
    alpha.value = 1 - smooth(burst, 0.02, 0.45);
    tilt.visible = alpha.value > 0.005;
    halo.visible = tilt.visible;
    tilt.rotation.x = -pointer.value.y * proximity.value * 0.24;
    tilt.rotation.y = frame.time * 0.13 + pointer.value.x * proximity.value * 0.36;
    tilt.rotation.z = pointer.value.x * proximity.value * 0.11;
    tilt.scale.setScalar(1 + 0.035 * proximity.value + 0.07 * hit.value - 0.13 * burst);
    glassMaterial.depthWrite = burst < 0.16;

    for (const [index, mesh] of orbits.entries()) {
      const layout = orbitLayout[index];
      const swing = Math.sin(frame.time * (0.29 + index * 0.12)) * 0.065;
      mesh.rotation.set(layout.pitch + swing, layout.yaw + 0.12 * pointer.value.x * proximity.value,
        layout.roll + swing * 0.7 + hit.value * 0.15);
      mesh.scale.setScalar(1 + 0.17 * hit.value + burst * (0.48 + index * 0.15));
    }

    shardAlpha.value = smooth(burst, 0.02, 0.16) * (1 - smooth(burst, 0.57, 0.997));
    debris.visible = shardAlpha.value > 0.005;
    if (!debris.visible) return;

    const expansion = burst ** 0.76;
    for (const [index, shard] of shards.entries()) {
      const spread = RADIUS + expansion * shard.distance;
      shape.position.copy(shard.normal).multiplyScalar(spread);
      shape.position.z -= expansion * expansion * 5.6;
      shape.position.y += 1.6 * expansion - 1.2 * expansion * expansion;
      shape.rotation.set(shard.angle + shard.spin * expansion, shard.angle * 0.6 + expansion * 2.1,
        shard.angle * 1.7 - shard.spin * expansion);
      shape.scale.set(shard.size * 0.72, shard.size * 1.75, shard.size * 0.42);
      shape.updateMatrix();
      debris.setMatrixAt(index, shape.matrix);
    }
    debris.instanceMatrix.needsUpdate = true;
  }

  function dispose() {
    scene.remove(root);
    root.traverse((object) => {
      object.geometry?.dispose();
      object.material?.dispose();
    });
    debris.dispose();
  }

  return {
    root, radius: RADIUS, update, dispose,
    push(direction, time) { impact.push(direction, 19, time); },
  };
}
