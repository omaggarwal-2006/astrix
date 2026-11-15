/**
 * LANDFALL - 3D holographic digital twin (src/ui/extras/twin-3d.js)
 *
 * An anatomical astronaut hologram standing in a glass bio-pod (design_mockups/02):
 *   - body built from lathe profiles (torso, tapered limbs, head), drawn with a holographic
 *     shader: fresnel rim, world-space mesh grid and a travelling scan band
 *   - a depth pre-pass so the hologram reads as one solid silhouette, with the skeleton and a
 *     beating heart (at today's resting HR) glowing through it
 *   - 11 clickable regions (same ids as twin-model.js), tinted by their integrity status
 *   - pulsing hotspot rings and HTML callouts with leader lines that follow the body
 *   - three render modes: HOLOGRAM, X-RAY (skeleton forward), BIO-SCAN (status heat map)
 *
 * Public API is unchanged: init3DTwin, focusOnRegion, resetCamera, rotateTwin180, cycleViewMode,
 * isWebGLAvailable, resize3DTwin, stop3DTwin, REGION_3D_TARGETS.
 * Three.js r128 (global window.THREE) + OrbitControls.
 */

import { AppState } from '../../app/state.js';
import { BODY_REGIONS, getRegionIntegrity } from './twin-model.js';
import { GameState, playSound } from './gamification.js';

let THREE = null;
let scene, camera, renderer, controls, clock;
let body = null;                 // THREE.Group holding the whole figure (sways and floats)
let skeleton = null;             // THREE.Group of bones (X-ray layer)
let heart = null;                // THREE.Group (pulses)
let podGroup = null;
let particles = null;
const regionMats = new Map();    // regionId -> ShaderMaterial (hologram skin)
const regionMeshes = new Map();  // regionId -> Group (kept for API compatibility)
const hotspots = new Map();      // regionId -> { mesh, anchor }
const sharedUniforms = { uTime: { value: 0 }, uScanY: { value: 0 } };
let currentMode = 'hologram';
let animFrameId = null;
let isAnimating = false;
let raycaster, mouse;
let hoveredRegionId = null;
let focusedRegionId = null;
let targetCamPos = null;
let targetLookAt = null;
let containerRef = null;
let calloutLayer = null;
let statusKey = '';
let userInteracting = false;
let lastInteraction = 0;

const CAM_FOV = 38;
const DEFAULT_LOOK = { x: 0, y: -0.5, z: 0 };
const POD_RADIUS = 8.6;
const POD_TOP = 19.5;
const POD_BOTTOM = -19.2;

const STATUS_HEX = { nominal: 0x46e3ff, caution: 0xffb84d, alarm: 0xff5b4f };
const MODE_LABEL = { hologram: 'HOLOGRAM', xray: 'X-RAY', bioscan: 'BIO-SCAN' };

/* ---------------------------------------------------------------------------
 * Skeleton of joint positions (front view; x lateral, y up, z forward).
 * Viewer's left is -x, matching the 2D blueprint (reg-left_* on the left).
 * ------------------------------------------------------------------------- */
const J = {
  head: [0, 14.55, 0.15],
  neckLo: [0, 11.6, -0.1], neckHi: [0, 13.0, 0.05],
  shoulderL: [-3.35, 10.55, -0.1], shoulderR: [3.35, 10.55, -0.1],
  elbowL: [-4.55, 5.75, -0.35], elbowR: [4.55, 5.75, -0.35],
  wristL: [-5.35, 1.55, 0.25], wristR: [5.35, 1.55, 0.25],
  hipL: [-1.5, 1.6, 0], hipR: [1.5, 1.6, 0],
  kneeL: [-1.72, -6.9, 0.25], kneeR: [1.72, -6.9, 0.25],
  ankleL: [-1.86, -15.55, -0.15], ankleR: [1.86, -15.55, -0.15],
};

/** Where each region's hotspot sits (body-local) and how close the camera goes. */
const ANCHORS = {
  head_neuro: { p: [0, 14.7, 1.2], dist: 13 },
  chest_cardio: { p: [0.75, 8.6, 1.9], dist: 17 },
  core_spine: { p: [0, 4.1, 1.7], dist: 17 },
  left_arm: { p: [-4.05, 7.6, 0.6], dist: 16 },
  right_arm: { p: [4.05, 7.6, 0.6], dist: 16 },
  left_hand: { p: [-5.65, 0.2, 0.6], dist: 11 },
  right_hand: { p: [5.65, 0.2, 0.6], dist: 11 },
  left_leg: { p: [-1.75, -6.9, 1.2], dist: 20 },
  right_leg: { p: [1.75, -6.9, 1.2], dist: 20 },
  left_foot: { p: [-1.9, -16.4, 1.4], dist: 11 },
  right_foot: { p: [1.9, -16.4, 1.4], dist: 11 },
};

/** Kept for compatibility with older callers; derived from ANCHORS. */
export const REGION_3D_TARGETS = Object.fromEntries(Object.entries(ANCHORS).map(([id, a]) => [id, {
  pos: { x: a.p[0], y: a.p[1], z: a.p[2] },
  cam: { x: a.p[0] * 0.6, y: a.p[1], z: a.p[2] + a.dist },
  fov: CAM_FOV,
}]));

/** Callouts drawn beside the pod (design_mockups/02). side: which column the label sits in. */
const CALLOUTS = [
  { id: 'head_neuro', side: 'right', title: 'NEURO-CRANIAL' },
  { id: 'chest_cardio', side: 'left', title: 'CARDIO-THORACIC' },
  { id: 'core_spine', side: 'right', title: 'CORE SPINE' },
  { id: 'left_hand', side: 'left', title: 'HANDS' },
  { id: 'left_leg', side: 'left', title: 'LIMBS' },
  { id: 'right_foot', side: 'right', title: 'CALCANEUS FEET' },
];

export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

/* =========================================================================
 * Shaders
 * ======================================================================= */

const HOLO_VERT = `
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vPosL;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    vPosL = position;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;

const HOLO_FRAG = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uHighlight;
  uniform float uGridDensity;
  uniform float uGridStrength;
  uniform float uFill;
  uniform float uTime;
  uniform float uScanY;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vPosL;

  float gridLine(vec3 p) {
    vec3 q = p * uGridDensity;
    vec3 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
    float l = min(min(g.x, g.y), g.z);
    return 1.0 - clamp(l, 0.0, 1.0);
  }

  void main() {
    vec3 V = normalize(cameraPosition - vPosW);
    vec3 N = normalize(vNormalW);
    float facing = abs(dot(N, V));
    float fres = pow(1.0 - facing, 2.2);
    float grid = gridLine(vPosW);
    // Travelling scan band, plus fine horizontal scanlines
    float band = smoothstep(1.6, 0.0, abs(vPosW.y - uScanY));
    float lines = 0.5 + 0.5 * sin(vPosW.y * 18.0 - uTime * 3.0);
    float shimmer = 0.9 + 0.1 * sin(uTime * 2.3 + vPosW.y * 0.7);

    float intensity = uFill * (0.16 + 0.06 * lines)
                    + fres * 1.05
                    + grid * uGridStrength * (0.35 + 0.65 * facing)
                    + band * 0.55
                    + uHighlight * (0.35 + fres * 0.6);
    vec3 col = uColor * intensity * shimmer + vec3(0.85, 0.97, 1.0) * fres * fres * 0.35;
    float a = clamp(intensity * uOpacity, 0.0, 1.0);
    gl_FragColor = vec4(col, a);
  }`;

const GLASS_FRAG = `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vPosL;
  void main() {
    vec3 V = normalize(cameraPosition - vPosW);
    float fres = pow(1.0 - abs(dot(normalize(vNormalW), V)), 3.0);
    float ang = atan(vPosL.z, vPosL.x);
    float streak = smoothstep(0.92, 1.0, sin(ang * 3.0 + 0.6)) * 0.35;
    float h = (vPosL.y + 19.0) / 38.0;
    float edgeGlow = smoothstep(0.08, 0.0, h) + smoothstep(0.92, 1.0, h);
    float sweep = smoothstep(0.03, 0.0, abs(fract(h - uTime * 0.06) - 0.5) - 0.47);
    float a = 0.035 + fres * 0.42 + streak * 0.25 + edgeGlow * 0.35 + sweep * 0.05;
    gl_FragColor = vec4(uColor * (0.6 + fres + edgeGlow), a);
  }`;

const DISC_FRAG = `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec3 vPosL;
  void main() {
    float r = length(vPosL.xy) / ${POD_RADIUS.toFixed(1)};
    float core = smoothstep(1.0, 0.0, r);
    float ring = smoothstep(0.05, 0.0, abs(r - 0.93)) + smoothstep(0.03, 0.0, abs(r - 0.62)) * 0.5;
    float ripple = 0.5 + 0.5 * sin(r * 26.0 - uTime * 2.4);
    float a = core * (0.32 + 0.12 * ripple) + ring * 0.8;
    gl_FragColor = vec4(uColor * (0.8 + core * 0.9), a);
  }`;

const BEAM_FRAG = `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec3 vPosL;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    float h = (vPosL.y + 19.0) / 38.0;            // 0 bottom .. 1 top
    float fade = smoothstep(0.0, 0.12, h) * smoothstep(1.0, 0.55, h) + smoothstep(0.85, 1.0, h) * 0.6;
    float ang = atan(vPosL.z, vPosL.x);
    float rays = 0.55 + 0.45 * sin(ang * 9.0 + uTime * 0.35) * sin(ang * 4.0 - uTime * 0.2);
    gl_FragColor = vec4(uColor, fade * rays * 0.07);
  }`;

function holoMaterial(hex, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(hex) },
      uOpacity: { value: opts.opacity ?? 0.95 },
      uHighlight: { value: 0 },
      uGridDensity: { value: opts.grid ?? 1.55 },
      uGridStrength: { value: opts.gridStrength ?? 0.55 },
      uFill: { value: opts.fill ?? 1.0 },
      uTime: sharedUniforms.uTime,
      uScanY: sharedUniforms.uScanY,
    },
    vertexShader: HOLO_VERT,
    fragmentShader: HOLO_FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: opts.depthTest ?? true,
    blending: THREE.AdditiveBlending,
    side: opts.side ?? THREE.FrontSide,
    extensions: { derivatives: true },
  });
}

function simpleShader(frag, hex, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(hex) }, uTime: sharedUniforms.uTime },
    vertexShader: HOLO_VERT,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: opts.side ?? THREE.DoubleSide,
  });
}

/* =========================================================================
 * Geometry helpers
 * ======================================================================= */

const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

/**
 * A tapered, rounded limb segment from a to b (a lathe around the bone axis).
 * r0/r1: radius at each end; bulge: extra radius in the belly; bulgeAt: 0..1 along the bone.
 */
function limbGeometry(a, b, r0, r1, bulge = 0, bulgeAt = 0.4, seg = 22) {
  const A = V3(a), B = V3(b);
  const len = A.distanceTo(B);
  const pts = [];
  const capSteps = 6;
  // lower cap (rounded)
  for (let i = 0; i <= capSteps; i++) {
    const t = i / capSteps;
    const ang = -Math.PI / 2 + t * Math.PI / 2;
    pts.push(new THREE.Vector2(Math.cos(ang) * r0 + 0.001, Math.sin(ang) * r0 * 0.7));
  }
  // body
  const steps = 16;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const base = r0 + (r1 - r0) * t;
    const b2 = bulge * Math.exp(-Math.pow((t - bulgeAt) / 0.28, 2));
    pts.push(new THREE.Vector2(base + b2, t * len));
  }
  // upper cap
  for (let i = 0; i <= capSteps; i++) {
    const t = i / capSteps;
    const ang = t * Math.PI / 2;
    pts.push(new THREE.Vector2(Math.cos(ang) * r1 + 0.001, len + Math.sin(ang) * r1 * 0.7));
  }
  const g = new THREE.LatheGeometry(pts, seg);
  const dir = B.clone().sub(A).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
  g.translate(A.x, A.y, A.z);
  return g;
}

function ellipsoid(center, rx, ry, rz, seg = 24) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75));
  g.scale(rx, ry, rz);
  g.translate(center[0], center[1], center[2]);
  return g;
}

/** Torso: a lathe with an anatomical width profile, flattened front-to-back. */
function torsoGeometry() {
  // [half-width, y]
  const prof = [
    [0.01, 0.55], [1.55, 0.7], [2.35, 1.25], [2.85, 2.1], [2.95, 3.0], [2.7, 4.2],
    [2.45, 5.2], [2.55, 6.2], [2.85, 7.3], [3.12, 8.5], [3.22, 9.5], [3.05, 10.4],
    [2.45, 11.05], [1.35, 11.5], [0.01, 11.7],
  ];
  const pts = prof.map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 40);
  // depth profile: deeper chest, flatter waist
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    let z = pos.getZ(i);
    const chest = Math.exp(-Math.pow((y - 8.6) / 1.9, 2));
    const glute = Math.exp(-Math.pow((y - 2.2) / 1.1, 2));
    let depth = 0.56 + 0.1 * chest + 0.06 * glute;
    z *= depth;
    if (z > 0) z *= 1 + 0.12 * chest;            // pectoral fullness
    if (z < 0) z *= 1 + 0.1 * glute;             // gluteal fullness
    pos.setZ(i, z);
  }
  g.computeVertexNormals();
  return g;
}

function handGeometry(wrist, side) {
  const s = side === 'L' ? -1 : 1;
  const palm = ellipsoid([wrist[0] + s * 0.2, wrist[1] - 1.05, wrist[2] + 0.1], 0.55, 1.0, 0.28, 18);
  const fingers = ellipsoid([wrist[0] + s * 0.3, wrist[1] - 2.15, wrist[2] + 0.12], 0.47, 0.75, 0.22, 16);
  const thumb = limbGeometry([wrist[0] - s * 0.15, wrist[1] - 0.55, wrist[2] + 0.35], [wrist[0] - s * 0.3, wrist[1] - 1.55, wrist[2] + 0.6], 0.2, 0.14, 0, 0.5, 10);
  return [palm, fingers, thumb];
}

function footGeometry(ankle, side) {
  const s = side === 'L' ? -1 : 1;
  const heel = ellipsoid([ankle[0], ankle[1] - 0.7, ankle[2] - 0.15], 0.55, 0.5, 0.65, 18);
  const foot = ellipsoid([ankle[0] + s * 0.12, ankle[1] - 0.95, ankle[2] + 1.05], 0.62, 0.36, 1.55, 20);
  return [heel, foot];
}

/* =========================================================================
 * Scene construction
 * ======================================================================= */

function buildBody() {
  body = new THREE.Group();
  body.name = 'astronaut-twin';
  scene.add(body);
  regionMats.clear();
  regionMeshes.clear();

  const occluderMat = new THREE.MeshBasicMaterial({ colorWrite: false });

  const addRegion = (id, geoms) => {
    const grp = new THREE.Group();
    grp.name = id;
    grp.userData = { regionId: id };
    const mat = holoMaterial(STATUS_HEX.nominal);
    regionMats.set(id, mat);
    geoms.forEach(g => {
      const occ = new THREE.Mesh(g, occluderMat);
      occ.renderOrder = 0;
      occ.userData = { regionId: id };
      grp.add(occ);
      const m = new THREE.Mesh(g, mat);
      m.renderOrder = 2;
      m.userData = { regionId: id };
      grp.add(m);
    });
    body.add(grp);
    regionMeshes.set(id, grp);
  };

  // Head & neck
  const cranium = ellipsoid(J.head, 1.5, 1.85, 1.68, 32);
  const jaw = ellipsoid([0, 13.55, 0.55], 1.12, 0.95, 1.05, 22);
  const nose = ellipsoid([0, 14.25, 1.62], 0.2, 0.36, 0.25, 10);
  const earL = ellipsoid([-1.48, 14.45, 0.05], 0.18, 0.42, 0.3, 10);
  const earR = ellipsoid([1.48, 14.45, 0.05], 0.18, 0.42, 0.3, 10);
  const neck = limbGeometry(J.neckLo, J.neckHi, 0.82, 0.72, 0, 0.5, 20);
  addRegion('head_neuro', [cranium, jaw, nose, earL, earR, neck]);

  // Torso split: chest (y > 6.4) and core (y <= 6.4), via two clipped copies
  const torso = torsoGeometry();
  const chestG = cropGeometry(torso, (y) => y >= 6.2);
  const coreG = cropGeometry(torso, (y) => y <= 6.6);
  const traps = limbGeometry([-2.4, 10.7, -0.35], [2.4, 10.7, -0.35], 0.75, 0.75, 0.25, 0.5, 18);
  const deltL = ellipsoid([-3.3, 10.35, -0.1], 1.05, 1.15, 1.0, 20);
  const deltR = ellipsoid([3.3, 10.35, -0.1], 1.05, 1.15, 1.0, 20);
  addRegion('chest_cardio', [chestG, traps, deltL, deltR]);
  addRegion('core_spine', [coreG]);

  // Arms (upper arm + forearm), hands
  ['L', 'R'].forEach(s => {
    const side = s === 'L' ? 'left' : 'right';
    const upper = limbGeometry(J['shoulder' + s], J['elbow' + s], 0.98, 0.7, 0.2, 0.45, 22);
    const fore = limbGeometry(J['elbow' + s], J['wrist' + s], 0.74, 0.46, 0.16, 0.25, 22);
    addRegion(`${side}_arm`, [upper, fore]);
    addRegion(`${side}_hand`, handGeometry(J['wrist' + s], s));
  });

  // Legs (thigh + calf), feet
  ['L', 'R'].forEach(s => {
    const side = s === 'L' ? 'left' : 'right';
    const thigh = limbGeometry(J['hip' + s], J['knee' + s], 1.72, 1.0, 0.28, 0.25, 26);
    const knee = ellipsoid([J['knee' + s][0], J['knee' + s][1], J['knee' + s][2] + 0.2], 0.95, 1.05, 0.95, 16);
    const calf = limbGeometry(J['knee' + s], J['ankle' + s], 0.98, 0.52, 0.32, 0.3, 24);
    addRegion(`${side}_leg`, [thigh, knee, calf]);
    addRegion(`${side}_foot`, footGeometry(J['ankle' + s], s));
  });

  buildSkeleton();
  buildHeart();
  buildHotspots();
}

/** Keep only the triangles whose three vertices pass the y test. */
function cropGeometry(src, keep) {
  const g = src.index ? src.toNonIndexed() : src.clone();
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const outP = [], outN = [];
  for (let i = 0; i < pos.count; i += 3) {
    if (keep(pos.getY(i)) && keep(pos.getY(i + 1)) && keep(pos.getY(i + 2))) {
      for (let k = 0; k < 3; k++) {
        outP.push(pos.getX(i + k), pos.getY(i + k), pos.getZ(i + k));
        outN.push(nor.getX(i + k), nor.getY(i + k), nor.getZ(i + k));
      }
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(outP, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(outN, 3));
  return out;
}

function buildSkeleton() {
  skeleton = new THREE.Group();
  skeleton.name = 'skeleton';
  const boneMat = holoMaterial(0xdff8ff, { opacity: 0.5, grid: 0, gridStrength: 0, fill: 1.6, depthTest: false });
  boneMat.uniforms.uGridDensity.value = 0.001;
  const add = (g) => { const m = new THREE.Mesh(g, boneMat); m.renderOrder = 3; skeleton.add(m); };

  // Skull
  add(ellipsoid([0, 14.75, 0.1], 1.25, 1.45, 1.4, 20));
  add(ellipsoid([0, 13.45, 0.6], 0.85, 0.55, 0.75, 14));
  // Spine: 22 vertebrae from pelvis to skull base
  for (let i = 0; i < 22; i++) {
    const t = i / 21;
    const y = 2.4 + t * 10.4;
    const z = -0.95 + 0.35 * Math.sin(t * Math.PI * 2.0) * 0.6;
    const r = 0.32 - t * 0.1;
    const v = new THREE.CylinderGeometry(r, r, 0.3, 10);
    v.translate(0, y, z);
    add(v);
  }
  // Ribcage: 9 rib pairs as partial tori
  for (let i = 0; i < 9; i++) {
    const y = 10.1 - i * 0.55;
    const w = 2.0 + Math.sin((i + 1) / 10 * Math.PI) * 0.75;
    const rib = new THREE.TorusGeometry(1, 0.075, 6, 36, Math.PI * 1.55);
    rib.rotateX(Math.PI / 2);
    rib.rotateY(Math.PI * 0.5 + Math.PI * 0.225);
    rib.scale(w, 1, w * 0.62);
    rib.translate(0, y, -0.35);
    add(rib);
  }
  // Sternum and clavicles
  add(limbGeometry([0, 7.0, 1.3], [0, 10.3, 1.15], 0.18, 0.22, 0, 0.5, 8));
  add(limbGeometry([-3.0, 10.6, 0.1], [-0.3, 10.65, 0.9], 0.12, 0.14, 0, 0.5, 8));
  add(limbGeometry([3.0, 10.6, 0.1], [0.3, 10.65, 0.9], 0.12, 0.14, 0, 0.5, 8));
  // Pelvis
  const pelvis = new THREE.TorusGeometry(1.9, 0.32, 8, 28);
  pelvis.rotateX(Math.PI / 2.4);
  pelvis.scale(1.05, 1, 0.75);
  pelvis.translate(0, 2.35, -0.1);
  add(pelvis);
  // Long bones
  ['L', 'R'].forEach(s => {
    add(limbGeometry(J['shoulder' + s], J['elbow' + s], 0.2, 0.17, 0, 0.5, 8));
    const e = J['elbow' + s], w = J['wrist' + s];
    add(limbGeometry([e[0] - 0.15, e[1], e[2]], [w[0] - 0.15, w[1], w[2]], 0.12, 0.11, 0, 0.5, 8));
    add(limbGeometry([e[0] + 0.15, e[1], e[2]], [w[0] + 0.15, w[1], w[2]], 0.12, 0.11, 0, 0.5, 8));
    add(limbGeometry(J['hip' + s], J['knee' + s], 0.3, 0.26, 0, 0.5, 10));
    add(ellipsoid([J['knee' + s][0], J['knee' + s][1], J['knee' + s][2] + 0.55], 0.35, 0.42, 0.2, 10));
    add(limbGeometry(J['knee' + s], J['ankle' + s], 0.22, 0.17, 0, 0.5, 8));
    add(ellipsoid([J['ankle' + s][0], J['ankle' + s][1] - 0.75, J['ankle' + s][2] - 0.2], 0.38, 0.32, 0.5, 10));   // calcaneus
  });
  body.add(skeleton);
}

function buildHeart() {
  heart = new THREE.Group();
  heart.name = 'heart';
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0xff6a3d) }, uTime: sharedUniforms.uTime, uOpacity: { value: 0.95 },
      uHighlight: { value: 0.4 }, uGridDensity: { value: 6.0 }, uGridStrength: { value: 0.4 }, uFill: { value: 2.4 }, uScanY: sharedUniforms.uScanY },
    vertexShader: HOLO_VERT, fragmentShader: HOLO_FRAG, transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending, extensions: { derivatives: true },
  });
  const parts = [
    ellipsoid([0.0, 0.15, 0], 0.62, 0.6, 0.55, 18),
    ellipsoid([0.42, 0.25, -0.05], 0.5, 0.52, 0.48, 16),
    ellipsoid([0.2, -0.45, 0.05], 0.48, 0.62, 0.45, 16),
    limbGeometry([0.05, 0.6, -0.1], [-0.15, 1.25, -0.25], 0.2, 0.16, 0, 0.5, 10),   // aorta
    limbGeometry([0.35, 0.65, -0.05], [0.65, 1.15, -0.2], 0.16, 0.13, 0, 0.5, 10),
  ];
  parts.forEach(g => { const m = new THREE.Mesh(g, mat); m.renderOrder = 4; heart.add(m); });
  heart.position.set(0.55, 8.35, 0.55);
  heart.rotation.z = -0.35;
  // Soft glow halo
  const halo = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), simpleShader(DISC_FRAG.replace(POD_RADIUS.toFixed(1), '1.6'), 0xff6a3d));
  halo.renderOrder = 4;
  halo.material.depthTest = false;
  halo.userData.billboard = true;
  heart.add(halo);
  body.add(heart);
}

function buildHotspots() {
  hotspots.clear();
  const ringGeo = new THREE.RingGeometry(0.62, 0.74, 40);
  const ringGeo2 = new THREE.RingGeometry(0.98, 1.04, 40, 1, 0, Math.PI * 1.4);
  const dotGeo = new THREE.CircleGeometry(0.26, 20);
  Object.entries(ANCHORS).forEach(([id, a]) => {
    const grp = new THREE.Group();
    grp.position.set(a.p[0], a.p[1], a.p[2]);
    const mk = (geo, op) => {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: STATUS_HEX.nominal, transparent: true, opacity: op, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      m.renderOrder = 5;
      m.userData = { regionId: id };
      grp.add(m);
      return m;
    };
    const ring = mk(ringGeo, 0.85);
    const arc = mk(ringGeo2, 0.55);
    const dot = mk(dotGeo, 0.95);
    grp.userData = { regionId: id, ring, arc, dot };
    body.add(grp);
    hotspots.set(id, { group: grp, anchor: new THREE.Vector3(...a.p) });
  });
}

function buildPod() {
  podGroup = new THREE.Group();
  podGroup.name = 'bio-pod';
  const H = POD_TOP - POD_BOTTOM;
  const midY = (POD_TOP + POD_BOTTOM) / 2;

  // Glass cylinder
  const glassGeo = new THREE.CylinderGeometry(POD_RADIUS, POD_RADIUS, H, 72, 1, true);
  glassGeo.translate(0, midY + 0.15, 0);
  const glass = new THREE.Mesh(glassGeo, simpleShader(GLASS_FRAG, 0x5fd8ff));
  glass.renderOrder = 6;
  podGroup.add(glass);

  // Light beam
  const beamGeo = new THREE.CylinderGeometry(POD_RADIUS * 0.92, POD_RADIUS * 0.92, H, 48, 1, true);
  beamGeo.translate(0, midY + 0.15, 0);
  const beam = new THREE.Mesh(beamGeo, simpleShader(BEAM_FRAG, 0x7fe6ff));
  beam.renderOrder = 1;
  podGroup.add(beam);

  // Emitter discs and rings, top and bottom
  [POD_BOTTOM, POD_TOP].forEach((y, i) => {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(POD_RADIUS, 64), simpleShader(DISC_FRAG, i ? 0x9eefff : 0x6fe3ff));
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = y;
    disc.renderOrder = 1;
    podGroup.add(disc);
    for (let k = 0; k < 3; k++) {
      const r = POD_RADIUS + 0.25 + k * 0.55;
      const torus = new THREE.Mesh(new THREE.TorusGeometry(r, k === 0 ? 0.16 : 0.06, 8, 96),
        new THREE.MeshBasicMaterial({ color: k === 0 ? 0x8ff0ff : 0x3aa9d6, transparent: true, opacity: k === 0 ? 0.95 : 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
      torus.rotation.x = Math.PI / 2;
      torus.position.y = y + (i ? 0.3 : -0.3) * k;
      torus.renderOrder = 7;
      podGroup.add(torus);
    }
  });

  // Rotating dashed floor rings below the pod
  const dashMat = (op) => new THREE.MeshBasicMaterial({ color: 0x46e3ff, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (let k = 0; k < 2; k++) {
    const g = new THREE.Group();
    const segs = k ? 36 : 18;
    for (let s = 0; s < segs; s++) {
      const a0 = (s / segs) * Math.PI * 2;
      const seg = new THREE.Mesh(new THREE.RingGeometry(POD_RADIUS + 2.2 + k * 1.6, POD_RADIUS + 2.55 + k * 1.6, 6, 1, a0, (Math.PI * 2 / segs) * 0.55), dashMat(k ? 0.28 : 0.5));
      seg.rotation.x = -Math.PI / 2;
      g.add(seg);
    }
    g.position.y = POD_BOTTOM - 0.4;
    g.userData.spin = k ? -0.05 : 0.09;
    podGroup.add(g);
  }

  // Floating particles inside the pod
  const N = 260;
  const pos = new Float32Array(N * 3);
  const speed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = Math.sqrt(Math.random()) * (POD_RADIUS - 0.6);
    const a = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = POD_BOTTOM + Math.random() * H;
    pos[i * 3 + 2] = Math.sin(a) * r;
    speed[i] = 0.4 + Math.random() * 1.4;
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pg.userData.speed = speed;
  particles = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x9bf0ff, size: 0.16, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
  particles.renderOrder = 8;
  podGroup.add(particles);

  scene.add(podGroup);

  // Distant star dust outside the pod
  const S = 500;
  const sp = new Float32Array(S * 3);
  for (let i = 0; i < S; i++) {
    sp[i * 3] = (Math.random() - 0.5) * 220;
    sp[i * 3 + 1] = (Math.random() - 0.5) * 140;
    sp[i * 3 + 2] = -40 - Math.random() * 120;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0x6fa8d6, size: 0.35, transparent: true, opacity: 0.55, depthWrite: false })));
}

/* =========================================================================
 * Callouts (HTML overlay with SVG leader lines)
 * ======================================================================= */

function buildCalloutLayer(containerEl) {
  const host = containerEl.parentElement || containerEl;
  host.querySelector('.twin-callouts')?.remove();
  calloutLayer = document.createElement('div');
  calloutLayer.className = 'twin-callouts';
  calloutLayer.setAttribute('aria-hidden', 'false');
  calloutLayer.innerHTML = `<svg class="twin-callout-lines" preserveAspectRatio="none"></svg>` +
    CALLOUTS.map(c => `
      <button type="button" class="twin-callout side-${c.side}" data-region="${c.id}" aria-label="Focus ${c.title.toLowerCase()}">
        <span class="tc-title">${c.title}</span>
        <span class="tc-value" data-val></span>
      </button>`).join('');
  host.appendChild(calloutLayer);
  calloutLayer.addEventListener('click', (e) => {
    const b = e.target.closest('.twin-callout');
    if (b) focusOnRegion(b.dataset.region);
  });
}

function calloutText(id) {
  const v = AppState.view;
  const vit = v?.reading?.vitals || {};
  const integ = getRegionIntegrity(id, AppState.currentDay, AppState.whatIf);
  switch (id) {
    case 'head_neuro': return `${integ.word} · SLEEP ${vit.sleep_h ?? '–'} h`;
    case 'chest_cardio': return `HR ${vit.hr_bpm ?? '–'} BPM · BP ${vit.bp_sys ?? '–'}/${vit.bp_dia ?? '–'}`;
    case 'core_spine': return `BONE DENSITY ${integ.currentPct.toFixed(1)}%`;
    case 'left_hand': return `GRIP ${integ.currentPct.toFixed(1)}%`;
    case 'left_leg': return `MUSCLE ${integ.currentPct.toFixed(1)}% · −${integ.lossPct.toFixed(1)}%`;
    case 'right_foot': return `CALCANEUS ${integ.currentPct.toFixed(1)}%`;
    default: return `${integ.currentPct.toFixed(1)}%`;
  }
}

const _v = () => new THREE.Vector3();
function updateCallouts() {
  if (!calloutLayer || !containerRef) return;
  const w = containerRef.clientWidth, h = containerRef.clientHeight;
  const compact = w < 520;
  calloutLayer.classList.toggle('compact', compact);
  const svg = calloutLayer.firstElementChild;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  let paths = '';
  const tmp = _v();
  const showAll = !focusedRegionId;
  calloutLayer.querySelectorAll('.twin-callout').forEach(el => {
    const id = el.dataset.region;
    const hs = hotspots.get(id);
    const visible = !compact && (showAll || id === focusedRegionId);
    el.classList.toggle('is-hidden', !visible);
    if (!hs || !visible) return;
    hs.group.getWorldPosition(tmp);
    tmp.project(camera);
    if (tmp.z > 1) { el.classList.add('is-hidden'); return; }
    const sx = (tmp.x * 0.5 + 0.5) * w;
    const sy = (-tmp.y * 0.5 + 0.5) * h;
    const side = el.classList.contains('side-left') ? 'left' : 'right';
    const lw = el.offsetWidth || 150;
    const pad = 14;
    const lx = side === 'left' ? pad : w - pad - lw;
    const ly = Math.max(56, Math.min(h - 70, sy - 18));
    el.style.transform = `translate(${lx}px, ${ly}px)`;
    const edgeX = side === 'left' ? lx + lw : lx;
    const midX = side === 'left' ? Math.min(sx - 24, edgeX + 40) : Math.max(sx + 24, edgeX - 40);
    const lineY = ly + 18;
    const status = el.dataset.status || 'nominal';
    paths += `<path class="tc-line st-${status}" d="M${edgeX},${lineY} L${midX},${lineY} L${sx},${sy}"/><circle class="tc-dot st-${status}" cx="${edgeX}" cy="${lineY}" r="2.6"/>`;
  });
  svg.innerHTML = paths;
}

/* =========================================================================
 * Init, events, render loop
 * ======================================================================= */

export function init3DTwin(containerEl) {
  if (!containerEl) return false;
  if (!window.THREE) {
    console.warn('Three.js not loaded. Falling back to 2D view.');
    return false;
  }
  THREE = window.THREE;
  stop3DTwin();
  containerEl.innerHTML = '';
  containerRef = containerEl;

  const width = containerEl.clientWidth || 560;
  const height = containerEl.clientHeight || 640;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03070d, 0.0045);

  camera = new THREE.PerspectiveCamera(CAM_FOV, width / height, 0.1, 400);
  const dc = defaultCamPos(width / height);
  camera.position.copy(dc);
  targetCamPos = dc.clone();
  targetLookAt = new THREE.Vector3(DEFAULT_LOOK.x, DEFAULT_LOOK.y, DEFAULT_LOOK.z);

  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    console.warn('WebGL renderer failed', err);
    return false;
  }
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.sortObjects = true;
  renderer.domElement.id = 'twin-3d-canvas';
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D astronaut digital twin. Drag to orbit, scroll to zoom, click a body region to inspect it.');
  renderer.domElement.setAttribute('role', 'img');
  
  // Context-loss resilience
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    console.warn('LANDFALL: WebGL context lost. Pausing 3D animation loop.');
    cancelAnimationFrame(animFrameId);
    isAnimating = false;
  }, false);

  renderer.domElement.addEventListener('webglcontextrestored', () => {
    console.log('LANDFALL: WebGL context restored. Rebuilding 3D digital twin.');
    init3DTwin(containerRef);
  }, false);

  containerEl.appendChild(renderer.domElement);

  if (THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.maxDistance = 110;
    controls.minDistance = 8;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.78;
    controls.target.copy(targetLookAt);
    controls.addEventListener('start', () => { userInteracting = true; });
    controls.addEventListener('end', () => {
      userInteracting = false;
      lastInteraction = performance.now();
      // keep the user's orbit: retarget to wherever they left the camera
      targetCamPos.copy(camera.position);
    });
  }

  buildPod();
  buildBody();
  applyMode();
  refreshStatuses(true);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  clock = new THREE.Clock();

  buildCalloutLayer(containerEl);
  setupEvents(containerEl);
  startRenderLoop();
  return true;
}

function defaultCamPos(aspect) {
  // Fit the pod (about 44 units tall, 20 wide plus callout room) in the viewport
  const vFov = (CAM_FOV * Math.PI) / 180;
  const needH = 47;
  const needW = 40;
  const dH = (needH / 2) / Math.tan(vFov / 2);
  const dW = (needW / 2) / (Math.tan(vFov / 2) * Math.max(aspect, 0.3));
  const d = Math.max(dH, dW);
  return new THREE.Vector3(0, 1.5, d);
}

function setupEvents(containerEl) {
  const canvas = renderer.domElement;
  let downAt = null;

  const pick = (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(body.children, true);
    for (const hit of hits) {
      const id = hit.object.userData && hit.object.userData.regionId;
      if (id) return id;
    }
    return null;
  };

  canvas.addEventListener('pointermove', (e) => {
    const found = pick(e);
    if (found !== hoveredRegionId) {
      hoveredRegionId = found;
      canvas.style.cursor = found ? 'pointer' : 'grab';
      canvas.title = found ? (BODY_REGIONS.find(r => r.id === found)?.name || '') : '';
    }
  });
  canvas.addEventListener('pointerleave', () => { hoveredRegionId = null; });
  canvas.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved > 5) return;          // a drag, not a click
    const id = pick(e);
    if (id) { playSound('click'); focusOnRegion(id); }
  });

  window.addEventListener('resize', () => resize3DTwin());
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => resize3DTwin());
    ro.observe(containerEl);
  }
}

export function focusOnRegion(regionId) {
  const hs = hotspots.get(regionId);
  const a = ANCHORS[regionId];
  if (!hs || !a || !camera) return;

  playSound('zoom');
  AppState.selectedRegion = regionId;
  GameState.recordRegionVisit(regionId);
  focusedRegionId = regionId;

  const wp = new THREE.Vector3();
  hs.group.getWorldPosition(wp);
  targetLookAt = wp.clone();
  const sideBias = Math.sign(a.p[0]) * Math.min(Math.abs(a.p[0]) * 0.6, 4);
  const behind = camera.position.z < 0 ? -1 : 1;
  targetCamPos = new THREE.Vector3(wp.x + sideBias, wp.y + 1.2, wp.z + a.dist * behind);

  updateFloatingVitalsCard(regionId);
  if (typeof AppState.refresh === 'function') AppState.refresh();
}

export function resetCamera() {
  if (!camera) return;
  playSound('zoom');
  focusedRegionId = null;
  targetCamPos = defaultCamPos(camera.aspect);
  targetLookAt = new THREE.Vector3(DEFAULT_LOOK.x, DEFAULT_LOOK.y, DEFAULT_LOOK.z);
  const card = document.getElementById('twin-3d-floating-card');
  if (card) card.classList.add('hidden');
}

export function rotateTwin180() {
  if (!camera || !targetLookAt) return;
  playSound('click');
  const rel = targetCamPos.clone().sub(targetLookAt);
  rel.x = -rel.x;
  rel.z = -rel.z;
  targetCamPos = targetLookAt.clone().add(rel);
}

export function cycleViewMode() {
  playSound('click');
  const modes = ['hologram', 'xray', 'bioscan'];
  currentMode = modes[(modes.indexOf(currentMode) + 1) % modes.length];
  applyMode();
  refreshStatuses(true);
}

export function setViewMode3D(mode) {
  if (!MODE_LABEL[mode]) return;
  currentMode = mode;
  applyMode();
  refreshStatuses(true);
}

export function getViewMode3D() { return currentMode; }

function applyMode() {
  const skinOpacity = { hologram: 0.95, xray: 0.32, bioscan: 0.9 }[currentMode];
  const grid = { hologram: 0.55, xray: 0.25, bioscan: 0.3 }[currentMode];
  const fill = { hologram: 1.0, xray: 0.5, bioscan: 2.2 }[currentMode];
  regionMats.forEach(m => {
    m.uniforms.uOpacity.value = skinOpacity;
    m.uniforms.uGridStrength.value = grid;
    m.uniforms.uFill.value = fill;
  });
  if (skeleton) {
    const boneOpacity = { hologram: 0.22, xray: 1.0, bioscan: 0.32 }[currentMode];
    skeleton.children.forEach(c => { c.material.uniforms.uOpacity.value = boneOpacity; });
  }
  const label = `Mode: ${MODE_LABEL[currentMode]}`;
  const btn = document.getElementById('btn-3d-mode');
  if (btn) btn.textContent = label;
  document.querySelectorAll('[data-twin-mode]').forEach(b => {
    b.classList.toggle('active', b.dataset.twinMode === currentMode);
    b.setAttribute('aria-pressed', b.dataset.twinMode === currentMode ? 'true' : 'false');
  });
  const vp = document.getElementById('twin-3d-viewport');
  if (vp) vp.dataset.mode = currentMode;
}

/** Re-tint regions, hotspots and callouts when the day or what-if inputs change. */
function refreshStatuses(force = false) {
  const key = `${AppState.currentDay}|${AppState.whatIf?.exerciseHours}|${currentMode}|${AppState.view?.reading?.vitals?.hr_bpm}`;
  if (!force && key === statusKey) return;
  statusKey = key;
  BODY_REGIONS.forEach(r => {
    const integ = getRegionIntegrity(r.id, AppState.currentDay, AppState.whatIf);
    const st = integ.status;
    const mat = regionMats.get(r.id);
    let hex = STATUS_HEX[st] ?? STATUS_HEX.nominal;
    if (currentMode === 'hologram' && st === 'nominal') hex = STATUS_HEX.nominal;
    if (currentMode === 'xray') hex = st === 'nominal' ? 0x7fd8ff : STATUS_HEX[st];
    if (currentMode === 'bioscan') {
      // Heat map: integrity 100% -> teal, 94% -> amber, < 90% -> coral
      const t = Math.max(0, Math.min(1, (100 - integ.currentPct) / 8));
      const c = new THREE.Color(0x2fe0b8).lerp(new THREE.Color(0xffb84d), Math.min(1, t * 1.6));
      if (t > 0.6) c.lerp(new THREE.Color(0xff4f4f), (t - 0.6) / 0.4);
      mat && mat.uniforms.uColor.value.copy(c);
    } else if (mat) {
      mat.uniforms.uColor.value.setHex(hex);
    }
    const hs = hotspots.get(r.id);
    if (hs) {
      const u = hs.group.userData;
      [u.ring, u.arc, u.dot].forEach(m => m.material.color.setHex(STATUS_HEX[st] ?? STATUS_HEX.nominal));
      u.status = st;
    }
  });
  if (calloutLayer) {
    calloutLayer.querySelectorAll('.twin-callout').forEach(el => {
      const id = el.dataset.region;
      const st = getRegionIntegrity(id, AppState.currentDay, AppState.whatIf).status;
      el.dataset.status = st;
      el.querySelector('[data-val]').textContent = calloutText(id);
    });
  }
}

function updateFloatingVitalsCard(regionId) {
  const card = document.getElementById('twin-3d-floating-card');
  if (!card) return;
  const regInfo = BODY_REGIONS.find(r => r.id === regionId) || BODY_REGIONS[0];
  const integ = getRegionIntegrity(regionId, AppState.currentDay, AppState.whatIf);
  const vitals = AppState.view?.reading?.vitals || { hr_bpm: 64, sleep_h: 7.2, bp_sys: 118, bp_dia: 76 };

  let metrics;
  if (regionId === 'head_neuro') {
    metrics = [['Sleep', `${vitals.sleep_h} h`], ['Circadian', `${integ.currentPct}%`]];
  } else if (regionId === 'chest_cardio') {
    metrics = [['Heart rate', `${vitals.hr_bpm} bpm`], ['Blood pressure', `${vitals.bp_sys}/${vitals.bp_dia}`]];
  } else {
    metrics = [['Integrity', `${integ.currentPct}%`], ['Drift', `−${integ.lossPct}%`]];
  }
  card.classList.remove('hidden');
  card.dataset.status = integ.status;
  card.innerHTML = `
    <div class="twin-floating-header">
      <h4 class="twin-floating-title"><span>${regInfo.name}</span></h4>
      <span class="pill ${integ.status === 'alarm' ? 'bad' : integ.status === 'caution' ? 'warn' : 'ok'}">
        <span class="${integ.status === 'alarm' ? 'shape-diamond' : integ.status === 'caution' ? 'shape-triangle' : 'shape-circle'}"></span>${integ.word}
      </span>
    </div>
    <div class="twin-floating-sys">${regInfo.systems}</div>
    <div class="twin-floating-vitals-grid">
      ${metrics.map(([k, v]) => `<div class="twin-vital-item"><span class="twin-vital-label">${k}</span><div class="twin-vital-val">${v}</div></div>`).join('')}
    </div>
    <div class="twin-floating-actions">
      <button class="chassis-btn primary" id="btn-3d-deep-scan">Deep scan →</button>
      <button class="chassis-btn" id="btn-3d-close-card">Dismiss</button>
    </div>`;
  document.getElementById('btn-3d-deep-scan')?.addEventListener('click', () => {
    AppState.twinLevel = 2;
    if (AppState.activeTab !== 'twin') window.location.hash = 'twin';
    if (typeof AppState.refresh === 'function') AppState.refresh();
  });
  document.getElementById('btn-3d-close-card')?.addEventListener('click', resetCamera);
}

function startRenderLoop() {
  if (isAnimating) return;
  isAnimating = true;
  const camQ = new THREE.Vector3();
  const animate = () => {
    animFrameId = requestAnimationFrame(animate);
    const canvas = renderer && renderer.domElement;
    // Skip work while the viewport is hidden (other tab, collapsed)
    if (!canvas || !canvas.isConnected || canvas.offsetParent === null) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    sharedUniforms.uTime.value = t;
    sharedUniforms.uScanY.value = POD_BOTTOM + ((t * 6.5) % (POD_TOP - POD_BOTTOM + 8));

    refreshStatuses();

    // Idle motion: float and slow sway, paused while focused or just after the user orbits
    const idle = !focusedRegionId && !userInteracting && performance.now() - lastInteraction > 2500;
    if (body) {
      body.position.y = Math.sin(t * 0.9) * 0.22;
      const targetRot = idle ? Math.sin(t * 0.22) * 0.38 : 0;
      body.rotation.y += (targetRot - body.rotation.y) * 0.04;
    }

    // Heart beats at today's resting heart rate (lub-dub)
    if (heart) {
      const bpm = AppState.view?.reading?.vitals?.hr_bpm || 64;
      const phase = (t * bpm / 60) % 1;
      const beat = Math.exp(-Math.pow((phase - 0.08) / 0.05, 2)) + 0.55 * Math.exp(-Math.pow((phase - 0.26) / 0.05, 2));
      const s = 1 + beat * 0.16;
      heart.scale.set(s, s, s);
    }

    // Hotspots: face the camera, pulse, highlight on hover/selection
    hotspots.forEach((hs, id) => {
      const g = hs.group;
      g.quaternion.copy(camera.quaternion);
      const u = g.userData;
      const sel = id === focusedRegionId || id === hoveredRegionId;
      const pulse = 1 + 0.18 * Math.sin(t * 3 + g.position.y);
      u.ring.scale.setScalar(sel ? 1.35 : pulse);
      u.arc.rotation.z = t * (u.status === 'nominal' ? 0.8 : 2.2);
      u.arc.scale.setScalar(sel ? 1.45 : 1.08);
      u.ring.material.opacity = sel ? 1 : 0.75;
    });

    // Region hover/selection glow
    regionMats.forEach((m, id) => {
      const target = id === focusedRegionId ? 0.9 : id === hoveredRegionId ? 0.55 : 0;
      m.uniforms.uHighlight.value += (target - m.uniforms.uHighlight.value) * 0.15;
    });
    // When focused, other regions fade back
    if (focusedRegionId) {
      regionMats.forEach((m, id) => {
        const base = currentMode === 'xray' ? 0.32 : 0.95;
        const goal = id === focusedRegionId ? base : base * 0.35;
        m.uniforms.uOpacity.value += (goal - m.uniforms.uOpacity.value) * 0.1;
      });
    } else {
      const base = currentMode === 'xray' ? 0.32 : currentMode === 'bioscan' ? 0.9 : 0.95;
      regionMats.forEach(m => { m.uniforms.uOpacity.value += (base - m.uniforms.uOpacity.value) * 0.1; });
    }

    // Billboards (heart halo)
    if (heart) heart.children.forEach(c => { if (c.userData.billboard) { c.quaternion.copy(camera.quaternion); } });

    // Pod animation
    if (podGroup) {
      podGroup.children.forEach(c => { if (c.userData.spin) c.rotation.y += c.userData.spin * dt * 6; });
    }
    if (particles) {
      const p = particles.geometry.attributes.position;
      const sp = particles.geometry.userData.speed;
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) + sp[i] * dt * 1.6;
        if (y > POD_TOP) y = POD_BOTTOM;
        p.setY(i, y);
      }
      p.needsUpdate = true;
    }

    // Camera easing toward target unless the user is dragging
    if (!userInteracting && targetCamPos && targetLookAt) {
      camera.position.lerp(targetCamPos, 0.07);
      if (controls) controls.target.lerp(targetLookAt, 0.07);
    }
    if (controls) controls.update(); else camera.lookAt(targetLookAt);
    camQ.copy(camera.position);

    renderer.render(scene, camera);
    updateCallouts();
  };
  animate();
}

export function resize3DTwin() {
  const containerEl = containerRef || document.getElementById('twin-3d-container');
  if (!renderer || !camera || !containerEl) return;
  const w = containerEl.clientWidth;
  const h = containerEl.clientHeight;
  if (w > 0 && h > 0) {
    const aspectChanged = Math.abs(camera.aspect - w / h) > 0.01;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (aspectChanged && !focusedRegionId && !userInteracting) {
      targetCamPos = defaultCamPos(camera.aspect);
      camera.position.copy(targetCamPos);
    }
  }
}

export function stop3DTwin() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  isAnimating = false;
  if (renderer) {
    try { renderer.dispose(); } catch { /* ignore */ }
    renderer = null;
  }
}
