/**
 * LANDFALL v3.0 - 3D Interactive Anatomical Digital Twin (src/ui/extras/twin-3d.js)
 * Full WebGL 3D astronaut model with segmented regions, click-to-zoom camera physics,
 * real-time cardiac pulse animation, and holographic vitals overlays.
 */

import { AppState } from '../../app/state.js';
import { BODY_REGIONS, getRegionIntegrity } from './twin-model.js';
import { GameState, playSound } from './gamification.js';

let scene, camera, renderer, controls;
let regionMeshes = new Map();
let heartMesh = null;
let currentMode = 'hologram'; // 'hologram' | 'xray' | 'bioscan'
let isAnimating = false;
let animFrameId = null;
let targetCamPos = null;
let targetLookAt = null;
let camLerpSpeed = 0.08;
let raycaster, mouse;
let hoveredRegionId = null;

// Anatomical coordinates and zoom targets for the 11 regions
export const REGION_3D_TARGETS = {
  head_neuro: { pos: { x: 0, y: 12.2, z: 0 }, cam: { x: 0, y: 12.5, z: 12 }, fov: 32 },
  chest_cardio: { pos: { x: 0, y: 6.8, z: 0 }, cam: { x: 0, y: 7.0, z: 16 }, fov: 35 },
  core_spine: { pos: { x: 0, y: 1.2, z: 0 }, cam: { x: 0, y: 1.2, z: 16 }, fov: 35 },
  left_arm: { pos: { x: -5.6, y: 4.8, z: 0 }, cam: { x: -5.2, y: 4.8, z: 14 }, fov: 34 },
  right_arm: { pos: { x: 5.6, y: 4.8, z: 0 }, cam: { x: 5.2, y: 4.8, z: 14 }, fov: 34 },
  left_hand: { pos: { x: -8.2, y: -0.5, z: 0 }, cam: { x: -7.8, y: -0.5, z: 10 }, fov: 30 },
  right_hand: { pos: { x: 8.2, y: -0.5, z: 0 }, cam: { x: 7.8, y: -0.5, z: 10 }, fov: 30 },
  left_leg: { pos: { x: -2.3, y: -7.5, z: 0 }, cam: { x: -2.3, y: -7.5, z: 18 }, fov: 36 },
  right_leg: { pos: { x: 2.3, y: -7.5, z: 0 }, cam: { x: 2.3, y: -7.5, z: 18 }, fov: 36 },
  left_foot: { pos: { x: -2.6, y: -16.0, z: 0.8 }, cam: { x: -2.6, y: -15.5, z: 10 }, fov: 30 },
  right_foot: { pos: { x: 2.6, y: -16.0, z: 0.8 }, cam: { x: 2.6, y: -15.5, z: 10 }, fov: 30 },
};

const DEFAULT_CAM = { x: 0, y: 0, z: 38 };
const DEFAULT_LOOK = { x: 0, y: -1, z: 0 };

export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

export function init3DTwin(containerEl) {
  if (!containerEl) return false;
  if (!window.THREE) {
    console.warn('Three.js not loaded. Falling back to 2D view.');
    return false;
  }

  // Clear previous canvas if any
  containerEl.innerHTML = '';

  const width = containerEl.clientWidth || 440;
  const height = containerEl.clientHeight || 540;

  const THREE = window.THREE;

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060911, 0.012);

  // Camera
  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 200);
  camera.position.set(DEFAULT_CAM.x, DEFAULT_CAM.y, DEFAULT_CAM.z);

  // Target vectors for smooth interpolation
  targetCamPos = camera.position.clone();
  targetLookAt = new THREE.Vector3(DEFAULT_LOOK.x, DEFAULT_LOOK.y, DEFAULT_LOOK.z);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = false;
  renderer.domElement.id = 'twin-3d-canvas';
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D Astronaut Digital Twin');
  containerEl.appendChild(renderer.domElement);

  // Orbit Controls
  if (THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 60;
    controls.minDistance = 6;
    controls.target.copy(targetLookAt);
    controls.maxPolarAngle = Math.PI / 1.8;
  }

  // Lighting
  const ambLight = new THREE.AmbientLight(0x223652, 1.2);
  scene.add(ambLight);

  const dirLight1 = new THREE.DirectionalLight(0x6cb4e4, 1.4);
  dirLight1.position.set(15, 25, 20);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xd0703f, 0.7);
  dirLight2.position.set(-15, -15, -10);
  scene.add(dirLight2);

  // Build the 11-region anatomical human figure
  buildHumanModel(THREE);

  // Raycasting for interaction
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  setupEvents(containerEl);
  startRenderLoop();

  return true;
}

function buildHumanModel(THREE) {
  regionMeshes.clear();

  // Helper to create region groups
  function createRegion(id, geometries, mainMaterial) {
    const group = new THREE.Group();
    group.name = id;
    group.userData = { regionId: id };

    geometries.forEach(geom => {
      const mesh = new THREE.Mesh(geom, mainMaterial.clone());
      mesh.userData = { regionId: id };
      group.add(mesh);

      // Add delicate wireframe accent
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x6cb4e4,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      });
      const wireMesh = new THREE.Mesh(geom, wireMat);
      group.add(wireMesh);
    });

    scene.add(group);
    regionMeshes.set(id, group);
    return group;
  }

  // Base materials
  const matBioNominal = new THREE.MeshStandardMaterial({
    color: 0x3fb59a,
    emissive: 0x1a4a3e,
    roughness: 0.35,
    metalness: 0.2,
    transparent: true,
    opacity: 0.88,
  });

  // 1. Head & Neuro-Ocular
  const headGeom = new THREE.SphereGeometry(2.3, 24, 20);
  headGeom.scale(1.0, 1.22, 1.05);
  const neckGeom = new THREE.CylinderGeometry(1.1, 1.3, 1.6, 16);
  neckGeom.translate(0, -2.2, 0);

  const headGroup = createRegion('head_neuro', [headGeom, neckGeom], matBioNominal);
  headGroup.position.set(0, 12.2, 0);

  // Internal glowing neural cluster
  const brainGeom = new THREE.IcosahedronGeometry(1.2, 2);
  const brainMat = new THREE.MeshBasicMaterial({
    color: 0x6cb4e4,
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  });
  const brain = new THREE.Mesh(brainGeom, brainMat);
  brain.position.set(0, 0.4, 0);
  headGroup.add(brain);

  // 2. Chest & Cardio-Immune
  const chestGeom = new THREE.CylinderGeometry(3.6, 3.2, 5.8, 20);
  chestGeom.scale(1.15, 1.0, 0.72);
  const chestGroup = createRegion('chest_cardio', [chestGeom], matBioNominal);
  chestGroup.position.set(0, 6.8, 0);

  // X-Ray Pulsing Heart inside chest
  const heartGeom = new THREE.SphereGeometry(0.85, 16, 14);
  heartGeom.scale(1.0, 1.3, 0.9);
  const heartMat = new THREE.MeshStandardMaterial({
    color: 0xe5594f,
    emissive: 0x99241e,
    roughness: 0.2,
    metalness: 0.1,
  });
  heartMesh = new THREE.Mesh(heartGeom, heartMat);
  heartMesh.position.set(0.6, 0.4, 0.8);
  chestGroup.add(heartMesh);

  // 3. Core & Lumbar Spine
  const coreGeom = new THREE.CylinderGeometry(3.1, 3.4, 4.6, 20);
  coreGeom.scale(1.1, 1.0, 0.75);
  const coreGroup = createRegion('core_spine', [coreGeom], matBioNominal);
  coreGroup.position.set(0, 1.8, 0);

  // Spinal column discs inside core
  for (let i = -1.8; i <= 1.8; i += 0.6) {
    const discGeom = new THREE.CylinderGeometry(0.45, 0.45, 0.22, 12);
    const discMat = new THREE.MeshBasicMaterial({ color: 0x6cb4e4, wireframe: true });
    const disc = new THREE.Mesh(discGeom, discMat);
    disc.position.set(0, i, -0.6);
    coreGroup.add(disc);
  }

  // 4 & 5. Left & Right Upper Arms
  const armGeom = new THREE.CylinderGeometry(1.05, 0.85, 5.6, 16);
  armGeom.translate(0, -2.2, 0);

  const leftArmGroup = createRegion('left_arm', [armGeom], matBioNominal);
  leftArmGroup.position.set(-4.8, 8.2, 0);
  leftArmGroup.rotation.z = -0.16;

  const rightArmGroup = createRegion('right_arm', [armGeom.clone()], matBioNominal);
  rightArmGroup.position.set(4.8, 8.2, 0);
  rightArmGroup.rotation.z = 0.16;

  // 6 & 7. Left & Right Hands & Forearms
  const forearmGeom = new THREE.CylinderGeometry(0.82, 0.65, 4.8, 14);
  forearmGeom.translate(0, -2.0, 0);
  const handGeom = new THREE.BoxGeometry(0.9, 1.6, 0.5);
  handGeom.translate(0, -4.8, 0);

  const leftHandGroup = createRegion('left_hand', [forearmGeom, handGeom], matBioNominal);
  leftHandGroup.position.set(-6.2, 3.6, 0);
  leftHandGroup.rotation.z = -0.08;

  const rightHandGroup = createRegion('right_hand', [forearmGeom.clone(), handGeom.clone()], matBioNominal);
  rightHandGroup.position.set(6.2, 3.6, 0);
  rightHandGroup.rotation.z = 0.08;

  // 8 & 9. Left & Right Legs (Femur & Tibia)
  const thighGeom = new THREE.CylinderGeometry(1.65, 1.25, 7.2, 16);
  thighGeom.translate(0, -3.2, 0);
  const calfGeom = new THREE.CylinderGeometry(1.2, 0.9, 6.8, 16);
  calfGeom.translate(0, -9.8, 0);

  const leftLegGroup = createRegion('left_leg', [thighGeom, calfGeom], matBioNominal);
  leftLegGroup.position.set(-2.2, -0.4, 0);

  const rightLegGroup = createRegion('right_leg', [thighGeom.clone(), calfGeom.clone()], matBioNominal);
  rightLegGroup.position.set(2.2, -0.4, 0);

  // 10 & 11. Left & Right Feet & Calcaneus
  const footGeom = new THREE.BoxGeometry(1.4, 1.0, 3.2);
  footGeom.translate(0, 0, 0.8);

  const leftFootGroup = createRegion('left_foot', [footGeom], matBioNominal);
  leftFootGroup.position.set(-2.2, -16.4, 0);

  const rightFootGroup = createRegion('right_foot', [footGeom.clone()], matBioNominal);
  rightFootGroup.position.set(2.2, -16.4, 0);

  // Decorative coordinate grid base
  const gridHelper = new THREE.GridHelper(30, 20, 0x223652, 0x0c1524);
  gridHelper.position.y = -17.2;
  scene.add(gridHelper);
}

function setupEvents(containerEl) {
  const canvas = renderer.domElement;

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    let found = null;
    for (const hit of intersects) {
      if (hit.object.userData && hit.object.userData.regionId) {
        found = hit.object.userData.regionId;
        break;
      }
    }

    if (found !== hoveredRegionId) {
      hoveredRegionId = found;
      canvas.style.cursor = found ? 'pointer' : 'grab';
      updateRegionGlows();
    }
  }

  function onPointerClick(e) {
    if (!hoveredRegionId) return;
    playSound('click');
    focusOnRegion(hoveredRegionId);
  }

  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('click', onPointerClick);

  window.addEventListener('resize', () => {
    if (!renderer || !containerEl) return;
    const w = containerEl.clientWidth;
    const h = containerEl.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

export function focusOnRegion(regionId) {
  const target = REGION_3D_TARGETS[regionId];
  if (!target) return;

  playSound('zoom');
  AppState.selectedRegion = regionId;
  GameState.recordRegionVisit(regionId);

  targetCamPos = new THREE.Vector3(target.cam.x, target.cam.y, target.cam.z);
  targetLookAt = new THREE.Vector3(target.pos.x, target.pos.y, target.pos.z);

  // Dim other regions for focus
  regionMeshes.forEach((group, id) => {
    const isSelected = id === regionId;
    group.traverse(child => {
      if (child.isMesh && child.material) {
        child.material.opacity = isSelected ? 1.0 : 0.22;
      }
    });
  });

  updateFloatingVitalsCard(regionId);

  // Trigger app state sync
  if (typeof AppState.refresh === 'function') {
    AppState.refresh();
  }
}

export function resetCamera() {
  playSound('zoom');
  targetCamPos = new THREE.Vector3(DEFAULT_CAM.x, DEFAULT_CAM.y, DEFAULT_CAM.z);
  targetLookAt = new THREE.Vector3(DEFAULT_LOOK.x, DEFAULT_LOOK.y, DEFAULT_LOOK.z);

  // Restore opacities
  regionMeshes.forEach(group => {
    group.traverse(child => {
      if (child.isMesh && child.material) {
        child.material.opacity = 0.88;
      }
    });
  });

  const card = document.getElementById('twin-3d-floating-card');
  if (card) card.classList.add('hidden');
}

export function rotateTwin180() {
  if (!camera) return;
  playSound('click');
  targetCamPos.z = -targetCamPos.z;
}

export function cycleViewMode() {
  playSound('click');
  const modes = ['hologram', 'xray', 'bioscan'];
  const nextIdx = (modes.indexOf(currentMode) + 1) % modes.length;
  currentMode = modes[nextIdx];

  regionMeshes.forEach(group => {
    group.traverse(child => {
      if (child.isMesh && child.material) {
        if (currentMode === 'xray') {
          child.material.wireframe = true;
          child.material.opacity = 0.45;
        } else if (currentMode === 'bioscan') {
          child.material.wireframe = false;
          child.material.roughness = 0.1;
          child.material.metalness = 0.8;
          child.material.opacity = 0.95;
        } else {
          // Hologram
          child.material.wireframe = false;
          child.material.roughness = 0.35;
          child.material.metalness = 0.2;
          child.material.opacity = 0.88;
        }
      }
    });
  });

  const btn = document.getElementById('btn-3d-mode');
  if (btn) btn.textContent = `Mode: ${currentMode.toUpperCase()}`;
}

function updateRegionGlows() {
  regionMeshes.forEach((group, id) => {
    const isHovered = id === hoveredRegionId;
    const isSelected = id === AppState.selectedRegion;
    const integ = getRegionIntegrity(id, AppState.currentDay, AppState.whatIf);

    const baseColor =
      integ.status === 'alarm' ? 0xe5594f : integ.status === 'caution' ? 0xe8a93a : 0x3fb59a;

    group.traverse(child => {
      if (child.isMesh && child.material && !child.material.wireframe) {
        if (isHovered || isSelected) {
          child.material.emissive.setHex(0x6cb4e4);
          child.material.color.setHex(baseColor);
        } else {
          child.material.emissive.setHex(integ.status === 'alarm' ? 0x661814 : 0x143228);
          child.material.color.setHex(baseColor);
        }
      }
    });
  });
}

function updateFloatingVitalsCard(regionId) {
  const card = document.getElementById('twin-3d-floating-card');
  if (!card) return;

  const regInfo = BODY_REGIONS.find(r => r.id === regionId) || BODY_REGIONS[0];
  const integ = getRegionIntegrity(regionId, AppState.currentDay, AppState.whatIf);
  const view = AppState.view;
  const vitals = view ? view.reading.vitals : { hr_bpm: 64, spo2_pct: 98, core_temp_c: 37.0, sleep_h: 7.2 };

  card.classList.remove('hidden');

  let metricsHTML = '';
  if (regionId === 'head_neuro') {
    metricsHTML = `
      <div class="twin-vital-item"><span class="twin-vital-label">Sleep</span><div class="twin-vital-val">${vitals.sleep_h} h</div></div>
      <div class="twin-vital-item"><span class="twin-vital-label">Circadian</span><div class="twin-vital-val">${integ.currentPct}%</div></div>
    `;
  } else if (regionId === 'chest_cardio') {
    metricsHTML = `
      <div class="twin-vital-item"><span class="twin-vital-label">Heart Rate</span><div class="twin-vital-val">${vitals.hr_bpm} bpm</div></div>
      <div class="twin-vital-item"><span class="twin-vital-label">SpO2</span><div class="twin-vital-val">${vitals.spo2_pct}%</div></div>
    `;
  } else {
    metricsHTML = `
      <div class="twin-vital-item"><span class="twin-vital-label">Integrity</span><div class="twin-vital-val">${integ.currentPct}%</div></div>
      <div class="twin-vital-item"><span class="twin-vital-label">Drift</span><div class="twin-vital-val">-${integ.lossPct}%</div></div>
    `;
  }

  card.innerHTML = `
    <div class="twin-floating-header">
      <h4 class="twin-floating-title">
        <span>${regInfo.name}</span>
      </h4>
      <span class="pill ${integ.status === 'alarm' ? 'bad' : integ.status === 'caution' ? 'warn' : 'ok'}">
        ${integ.word}
      </span>
    </div>
    <div style="font-size: 11.5px; color: var(--text-3); margin-bottom: 6px;">
      ${regInfo.systems}
    </div>
    <div class="twin-floating-vitals-grid">
      ${metricsHTML}
    </div>
    <div style="display: flex; gap: 6px; margin-top: 10px;">
      <button class="chassis-btn primary" id="btn-3d-deep-scan" style="flex: 1; font-size: 12px; padding: 4px 8px;">
        Deep Scan &rarr;
      </button>
      <button class="chassis-btn" id="btn-3d-close-card" style="font-size: 12px; padding: 4px 8px;">
        Dismiss
      </button>
    </div>
  `;

  const btnDeep = document.getElementById('btn-3d-deep-scan');
  if (btnDeep) {
    btnDeep.addEventListener('click', () => {
      AppState.twinLevel = 2;
      if (typeof AppState.refresh === 'function') AppState.refresh();
    });
  }

  const btnClose = document.getElementById('btn-3d-close-card');
  if (btnClose) {
    btnClose.addEventListener('click', resetCamera);
  }
}

function startRenderLoop() {
  if (isAnimating) return;
  isAnimating = true;

  const clock = new THREE.Clock();

  function animate() {
    animFrameId = requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();

    // Smooth camera tweening towards target position & target lookAt
    if (camera && targetCamPos && targetLookAt) {
      camera.position.lerp(targetCamPos, camLerpSpeed);
      if (controls) {
        controls.target.lerp(targetLookAt, camLerpSpeed);
        controls.update();
      } else {
        camera.lookAt(targetLookAt);
      }
    }

    // Dynamic cardiac pulse animation on heart mesh
    if (heartMesh) {
      const v = AppState.view;
      const bpm = (v && v.reading && v.reading.vitals.hr_bpm) || 64;
      const freq = (bpm / 60) * Math.PI * 2;
      const pulse = 1.0 + Math.sin(elapsed * freq) * 0.12;
      heartMesh.scale.set(pulse, pulse * 1.15, pulse);
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  animate();
}

export function stop3DTwin() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  isAnimating = false;
}
