import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { store } from './core/store.js';
import {
  reportItemIssue,
  claimRestockTask,
  completeRestockPurchase,
  paySplit,
  pokeMember,
  completeChore,
  createSpatialTask,
  claimSpatialTask,
  completeSpatialTask,
  createAdHocExpense,
  createRuleProposal,
  approveRule,
  commentRule,
  resetDemo,
} from './core/actions.js';

const COLORS = {
  platform: 0x20242b,
  wall: 0xe8e3db,
  wallEdge: 0xcac2b8,
  bedroomA: 0x7d8caf,
  bedroomB: 0x93849b,
  bedroomC: 0x7e9b89,
  living: 0x8b9ab7,
  kitchen: 0x8ba08c,
  bath: 0x94b1b7,
  balcony: 0xb59775,
  wood: 0x805b45,
  woodLight: 0xb58d6d,
  white: 0xefefec,
  metal: 0x8f99a5,
  ink: 0x2b3037,
  sofa: 0x7182b2,
  pink: 0xd9868c,
  teal: 0x5f9fa1,
  plant: 0x557d5d,
  accent: 0xf0836e,
  warn: 0xe6b259,
  ok: 0x75b68e,
};

const ROOMS = [
  { id: 'bedroom-a', name: '卧室 A', owner: 'You', type: 'private', x: -4.25, z: -3.15, w: 3.05, d: 2.8, color: COLORS.bedroomA, description: '你的私人卧室。公共任务不会侵入私人空间。' },
  { id: 'bedroom-b', name: '卧室 B', owner: '小王', type: 'private', x: -1.05, z: -3.15, w: 3.05, d: 2.8, color: COLORS.bedroomB, description: '小王的私人卧室。公共空间之外保持克制的信息暴露。' },
  { id: 'bedroom-c', name: '卧室 C', owner: '小李', type: 'private', x: 2.15, z: -3.15, w: 3.05, d: 2.8, color: COLORS.bedroomC, description: '小李的私人卧室。公共空间之外保持克制的信息暴露。' },
  { id: 'bath', name: '共用卫生间', type: 'shared', x: 4.75, z: -2.85, w: 2.0, d: 3.4, color: COLORS.bath, description: '卫生纸等公共用品从真实位置上报，而不是由系统假装知道库存。' },
  { id: 'living', name: '客厅 / 餐厅', type: 'shared', x: -1.2, z: 0.85, w: 6.55, d: 4.45, color: COLORS.living, description: '共同生活的两个中心都在这里：白板负责共识，账本负责钱。' },
  { id: 'kitchen', name: '厨房', type: 'shared', x: 3.75, z: 0.35, w: 2.95, d: 2.85, color: COLORS.kitchen, description: '周期清洁按排班自动生成，不需要系统猜厨房到底脏不脏。' },
  { id: 'balcony', name: '阳台 / 洗衣区', type: 'shared', x: 3.75, z: 3.25, w: 2.95, d: 2.45, color: COLORS.balcony, description: '洗衣机、洗衣液和晾晒区集中在这里。' },
];

const MARKER_POSITIONS = {
  paper: new THREE.Vector3(5.12, 1.82, -3.08),
  clean: new THREE.Vector3(3.04, 1.63, 1.18),
  ledger: new THREE.Vector3(-0.15, 1.45, 1.2),
  whiteboard: new THREE.Vector3(0.55, 2.2, -0.98),
};

const sceneRoot = document.getElementById('scene');
const floorplanEl = document.getElementById('floorplan');
const roomKickerEl = document.getElementById('roomKicker');
const roomTitleEl = document.getElementById('roomTitle');
const roomDescriptionEl = document.getElementById('roomDescription');
const objectPanel = document.getElementById('objectPanel');
const objectKicker = document.getElementById('objectKicker');
const objectTitle = document.getElementById('objectTitle');
const objectBody = document.getElementById('objectBody');
const objectMeta = document.getElementById('objectMeta');
const objectActions = document.getElementById('objectActions');
const todoList = document.getElementById('todoList');
const waitingList = document.getElementById('waitingList');
const todoCount = document.getElementById('todoCount');
const ledgerBadge = document.getElementById('ledgerBadge');
const boardBadge = document.getElementById('boardBadge');
const openExpenses = document.getElementById('openExpenses');
const settledExpenses = document.getElementById('settledExpenses');
const ruleBoard = document.getElementById('ruleBoard');
const timelineList = document.getElementById('timelineList');
const addTypePicker = document.getElementById('addTypePicker');
const addForm = document.getElementById('addForm');
const addFormKicker = document.getElementById('addFormKicker');
const addFormTitle = document.getElementById('addFormTitle');
const spatialFields = document.getElementById('spatialFields');
const expenseFields = document.getElementById('expenseFields');
const ruleFields = document.getElementById('ruleFields');
const onboarding = document.getElementById('onboarding');
const pokeOverlay = document.getElementById('pokeOverlay');
const pokeKicker = document.getElementById('pokeKicker');
const pokeTitle = document.getElementById('pokeTitle');
const pokeMessage = document.getElementById('pokeMessage');
const appShell = document.getElementById('appShell');
const confetti = document.getElementById('confetti');
const tooltip = document.getElementById('tooltip');
const toast = document.getElementById('toast');
let addMode = null;
let guideMarkerKey = null;
let pendingPoke = null;
let incomingPokeShown = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111419);
scene.fog = new THREE.Fog(0x111419, 18, 31);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sceneRoot.appendChild(renderer.domElement);

const frustum = 7.9;
const camera = new THREE.OrthographicCamera(-frustum, frustum, frustum, -frustum, 0.1, 80);
camera.position.set(11.4, 10.6, 13.3);
camera.zoom = 1.06;
camera.updateProjectionMatrix();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.enablePan = true;
controls.panSpeed = 0.85;
controls.screenSpacePanning = true;
controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
controls.target.set(0, 0.65, 0.2);
controls.minZoom = 0.82;
controls.maxZoom = 2.35;
controls.minPolarAngle = 0.68;
controls.maxPolarAngle = 1.05;
controls.minAzimuthAngle = 0.28;
controls.maxAzimuthAngle = 1.26;
controls.update();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const interactiveMeshes = [];
const roomFloors = new Map();
const markerSprites = new Map();
let kitchenMess = null;
let hoveredObject = null;
let selectedRoomId = null;
let pointerStart = null;
let cameraTween = null;
let activePanel = null;
let activePanelAnchor = null;
let latestDemoExpenseId = null;

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.78,
    metalness: options.metalness ?? 0.02,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
  });
}

function roundedBox(w, h, d, color, x = 0, y = 0, z = 0, radius = 0.07) {
  const geometry = new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 5, h / 5, d / 5));
  const mesh = new THREE.Mesh(geometry, mat(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(rt, rb, h, color, segments = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), mat(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function sphere(radius, color, scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 14), mat(color));
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function registerInteractive(root, data) {
  root.userData.interaction = data;
  root.userData.baseScale = root.scale.clone();
  root.traverse((child) => {
    if (!child.isMesh && !child.isSprite) return;
    child.userData.interaction = data;
    child.userData.interactionRoot = root;
    if (!interactiveMeshes.includes(child)) interactiveMeshes.push(child);
  });
}

function interactionFrom(object) {
  return object?.userData?.interaction || object?.userData?.interactionRoot?.userData?.interaction || null;
}

function rootFrom(object) {
  return object?.userData?.interactionRoot || object;
}

function createTextSprite(text, background = '#e6b259', fontSize = 92) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);
  ctx.beginPath();
  ctx.arc(128, 128, 72, 0, Math.PI * 2);
  ctx.fillStyle = background;
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(255,255,255,.92)';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `900 ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 134);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.setScalar(0.66);
  sprite.renderOrder = 50;
  return sprite;
}

function updateSpriteVisual(sprite, text, background) {
  const replacement = createTextSprite(text, background, text === '+' ? 82 : 100);
  const previous = sprite.material.map;
  sprite.material.map = replacement.material.map;
  sprite.material.needsUpdate = true;
  previous?.dispose();
  replacement.material.dispose();
}

function ensureMarker(key, position, { text, background, interaction }) {
  let marker = markerSprites.get(key);
  if (!marker) {
    marker = createTextSprite(text, background, text === '+' ? 82 : 100);
    marker.position.copy(position);
    marker.userData.baseY = position.y;
    scene.add(marker);
    markerSprites.set(key, marker);
    registerInteractive(marker, interaction);
  } else {
    marker.position.copy(position);
    marker.userData.baseY = position.y;
    marker.userData.interaction = interaction;
    marker.userData.interactionRoot = marker;
    updateSpriteVisual(marker, text, background);
  }
  marker.visible = true;
  marker.userData.interaction = interaction;
  return marker;
}

function hideMarker(key) {
  const marker = markerSprites.get(key);
  if (marker) marker.visible = false;
}

function createFloor(room) {
  const group = new THREE.Group();
  const floor = roundedBox(room.w, 0.16, room.d, room.color, 0, 0.08, 0, 0.07);
  floor.material.roughness = 0.9;
  group.add(floor);
  group.position.set(room.x, 0, room.z);
  scene.add(group);
  roomFloors.set(room.id, floor);
  registerInteractive(floor, { kind: 'room', id: room.id, label: room.name });
}

function wall(x, z, w, h, d, color = COLORS.wall) {
  const body = roundedBox(w, h, d, color, x, h / 2 + 0.15, z, 0.035);
  const cap = roundedBox(w + (w > d ? 0 : 0.04), 0.07, d + (d > w ? 0 : 0.04), 0xf4f0e9, x, h + 0.18, z, 0.018);
  scene.add(body, cap);
}

function lowWall(x, z, w, d) {
  wall(x, z, w, 0.76, d, 0xc9c1b6);
}

function createPlant(scale = 1) {
  const group = new THREE.Group();
  const pot = cylinder(0.24 * scale, 0.2 * scale, 0.38 * scale, 0xa06e55, 9);
  pot.position.y = 0.19 * scale;
  group.add(pot);
  for (let i = 0; i < 7; i += 1) {
    const leaf = sphere(0.17 * scale, i % 2 ? 0x557d5d : 0x688b69, [0.45, 1.45, 0.4]);
    leaf.position.set(Math.sin(i * 1.55) * 0.16 * scale, (0.55 + (i % 3) * 0.16) * scale, Math.cos(i * 1.55) * 0.16 * scale);
    leaf.rotation.z = (i - 3) * 0.18;
    group.add(leaf);
  }
  return group;
}

function createBed(x, z, blanketColor) {
  const group = new THREE.Group();
  group.add(roundedBox(1.45, 0.3, 1.9, COLORS.wood, 0, 0.22, 0, 0.08));
  group.add(roundedBox(1.34, 0.24, 1.74, blanketColor, 0, 0.47, 0.04, 0.11));
  group.add(roundedBox(1.16, 0.16, 0.48, COLORS.white, 0, 0.68, -0.58, 0.08));
  group.position.set(x, 0, z);
  scene.add(group);
}

function buildBedrooms() {
  createBed(-4.3, -3.12, 0x8f9dbe);
  createBed(-1.08, -3.12, 0xa492aa);
  createBed(2.12, -3.12, 0x8da694);
  const a = createPlant(0.7); a.position.set(-5.05, 0, -2.25); scene.add(a);
  const b = createPlant(0.7); b.position.set(-1.85, 0, -2.25); scene.add(b);
  const c = createPlant(0.7); c.position.set(1.35, 0, -2.25); scene.add(c);
}

function buildLivingDining() {
  scene.add(roundedBox(3.2, 0.035, 2.25, 0xc6b79f, -2.15, 0.19, 1.15, 0.12));

  const sofa = new THREE.Group();
  sofa.add(roundedBox(2.65, 0.56, 0.88, COLORS.sofa, 0, 0.48, 0, 0.16));
  sofa.add(roundedBox(2.65, 0.7, 0.23, 0x6676a4, 0, 0.86, -0.33, 0.1));
  sofa.add(roundedBox(0.22, 0.56, 0.88, 0x6676a4, -1.32, 0.5, 0, 0.08));
  sofa.add(roundedBox(0.22, 0.56, 0.88, 0x6676a4, 1.32, 0.5, 0, 0.08));
  sofa.position.set(-2.95, 0, 1.55);
  scene.add(sofa);

  const coffee = new THREE.Group();
  coffee.add(roundedBox(1.45, 0.16, 0.85, COLORS.woodLight, 0, 0.6, 0, 0.06));
  [-0.56, 0.56].forEach((dx) => [-0.28, 0.28].forEach((dz) => coffee.add(roundedBox(0.08, 0.54, 0.08, COLORS.wood, dx, 0.3, dz, 0.018))));
  coffee.position.set(-1.65, 0, 1.05);
  scene.add(coffee);

  const dining = new THREE.Group();
  dining.add(roundedBox(1.55, 0.14, 1.05, COLORS.woodLight, 0, 0.76, 0, 0.06));
  [-0.58, 0.58].forEach((dx) => [-0.35, 0.35].forEach((dz) => dining.add(roundedBox(0.08, 0.7, 0.08, COLORS.wood, dx, 0.4, dz, 0.018))));
  dining.position.set(0.55, 0, 1.15);
  scene.add(dining);

  const ledger = new THREE.Group();
  const cover = roundedBox(0.86, 0.08, 0.62, 0x6e513f, 0, 0, 0, 0.04);
  const pages = roundedBox(0.78, 0.045, 0.56, 0xe9dfca, 0.01, 0.065, 0, 0.025);
  const band = roundedBox(0.07, 0.035, 0.58, 0xb79064, -0.18, 0.102, 0, 0.012);
  ledger.add(cover, pages, band);
  ledger.position.set(-0.1, 0.88, 1.22);
  ledger.rotation.y = -0.2;
  scene.add(ledger);
  registerInteractive(ledger, { kind: 'ledger', id: 'ledger', label: '共同账本 · 房租 / 水电 / AA' });

  const board = new THREE.Group();
  board.add(roundedBox(1.6, 1.05, 0.08, 0xe7e8df, 0, 0, 0, 0.04));
  board.add(roundedBox(1.72, 0.07, 0.13, COLORS.wood, 0, -0.58, 0, 0.02));
  [-0.45, 0, 0.45].forEach((x, i) => board.add(roundedBox(0.28, 0.22, 0.02, [0xe9cf6f, 0xa9c79e, 0xaec5d8][i], x, 0.12 - i * .08, 0.06, 0.015)));
  board.position.set(0.55, 1.45, -1.02);
  scene.add(board);
  registerInteractive(board, { kind: 'whiteboard', id: 'whiteboard', label: '共同白板 · 规则 / 讨论' });

  const plant = createPlant(0.92); plant.position.set(-4.0, 0, 3.0); scene.add(plant);
}

function buildKitchen() {
  const counter = new THREE.Group();
  counter.add(roundedBox(2.05, 0.84, 0.66, 0xb8baae, 0, 0.48, 0, 0.07));
  counter.add(roundedBox(2.15, 0.11, 0.72, 0x4b5358, 0, 0.94, 0, 0.035));
  counter.position.set(3.75, 0, -0.42);
  scene.add(counter);

  const fridge = roundedBox(0.86, 1.72, 0.8, 0xd8dde0, 4.65, 0.91, 0.86, 0.1);
  scene.add(fridge);

  const broom = new THREE.Group();
  const handle = cylinder(0.035, 0.035, 1.52, 0xa87950, 10); handle.rotation.z = -0.18; handle.position.y = 0.8; broom.add(handle);
  const brush = roundedBox(0.52, 0.14, 0.2, 0xc89a5e, -0.14, 0.1, 0, 0.035); brush.rotation.z = -0.18; broom.add(brush);
  broom.position.set(3.45, 0.09, 0.72);
  broom.rotation.y = -0.42;
  scene.add(broom);
  registerInteractive(broom, { kind: 'task', id: 'clean-kitchen-0913', label: '厨房值日 · 今晚 22:00' });

  kitchenMess = new THREE.Group();
  for (let i = 0; i < 4; i += 1) {
    const scrap = roundedBox(0.14, 0.07, 0.12, i % 2 ? 0xd5c9b5 : 0xc3baa9, 0, 0.06, 0, 0.025);
    scrap.position.set(2.7 + i * 0.23, 0.13, 0.65 + (i % 2) * .2);
    scrap.rotation.y = i * .6;
    kitchenMess.add(scrap);
  }
  scene.add(kitchenMess);
}

function buildBathroom() {
  const toilet = new THREE.Group();
  const base = cylinder(0.3, 0.25, 0.45, COLORS.white, 22); base.scale.z = 1.15; toilet.add(base);
  toilet.add(roundedBox(0.6, 0.62, 0.28, COLORS.white, 0, 0.58, -0.32, 0.09));
  toilet.position.set(4.65, 0.23, -2.3);
  scene.add(toilet);

  const sink = new THREE.Group();
  sink.add(cylinder(0.3, 0.25, 0.14, COLORS.white, 22));
  sink.add(cylinder(0.08, 0.08, 0.65, COLORS.white, 18));
  sink.position.set(4.0, 0.55, -3.55);
  scene.add(sink);

  const paper = new THREE.Group();
  const roll = cylinder(0.18, 0.18, 0.26, 0xf4f2ec, 22); roll.rotation.z = Math.PI / 2; paper.add(roll);
  const core = cylinder(0.055, 0.055, 0.29, 0xb68b66, 16); core.rotation.z = Math.PI / 2; paper.add(core);
  paper.position.set(5.14, 1.03, -3.08);
  scene.add(paper);
  registerInteractive(paper, { kind: 'item', id: 'toilet-paper', label: '卫生纸 · 点击上报状态' });
}

function buildBalcony() {
  const washer = roundedBox(0.98, 1.16, 0.9, 0xdce1e5, 4.15, 0.62, 3.45, 0.1);
  scene.add(washer);
  const bottle = roundedBox(0.3, 0.56, 0.24, COLORS.teal, 3.2, 0.42, 3.6, 0.08);
  scene.add(bottle);
  const plant = createPlant(0.92); plant.position.set(4.9, 0, 4.05); scene.add(plant);
}

function buildWalls() {
  wall(-5.85, -0.2, 0.17, 2.45, 8.8);
  wall(-0.45, -4.58, 10.95, 2.45, 0.17);
  lowWall(5.78, -0.15, 0.15, 8.9);
  lowWall(0.2, 4.52, 10.95, 0.15);
  lowWall(-2.65, -3.15, 0.12, 2.8);
  lowWall(0.55, -3.15, 0.12, 2.8);
  lowWall(3.7, -3.15, 0.12, 2.8);
  lowWall(-1.05, -1.72, 9.35, 0.12);
  lowWall(2.32, 0.6, 0.12, 4.7);
  lowWall(4.72, -1.2, 2.1, 0.12);
  lowWall(3.75, 1.78, 2.95, 0.12);
}

function buildLights() {
  scene.add(new THREE.HemisphereLight(0xd7e3ef, 0x3c3130, 2.2));
  const key = new THREE.DirectionalLight(0xffe2b8, 4.2);
  key.position.set(-7, 12, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -12;
  key.shadow.camera.right = 12;
  key.shadow.camera.top = 12;
  key.shadow.camera.bottom = -12;
  scene.add(key);
  const cool = new THREE.DirectionalLight(0xa9c7ff, 1.15);
  cool.position.set(10, 7, -8);
  scene.add(cool);
  const warm = new THREE.PointLight(0xffca86, 2.4, 5.6, 2);
  warm.position.set(-1.3, 3.2, 1.2);
  scene.add(warm);
}

function buildApartment() {
  scene.add(roundedBox(12.1, 0.3, 9.4, COLORS.platform, 0, -0.2, 0, 0.18));
  const grid = new THREE.GridHelper(28, 28, 0x2b333d, 0x191e24);
  grid.position.y = -0.37;
  grid.material.transparent = true;
  grid.material.opacity = 0.28;
  scene.add(grid);
  ROOMS.forEach(createFloor);
  buildWalls();
  buildBedrooms();
  buildLivingDining();
  buildKitchen();
  buildBathroom();
  buildBalcony();
  buildLights();
}

const HOME_CAMERA = {
  target: new THREE.Vector3(0, 0.65, 0.15),
  position: new THREE.Vector3(11.4, 10.6, 13.3),
  zoom: 1.06,
};

function ease(t) {
  return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function roomCamera(room) {
  const maxDimension = Math.max(room.w, room.d);
  return {
    target: new THREE.Vector3(room.x, 0.65, room.z),
    position: new THREE.Vector3(room.x + 7.8, 7.8, room.z + 9.0),
    zoom: room.type === 'private' ? 1.72 : maxDimension > 5 ? 1.38 : 1.65,
  };
}

function tweenCamera(targetConfig, duration = 720) {
  cameraTween = {
    start: performance.now(), duration,
    fromPosition: camera.position.clone(),
    fromTarget: controls.target.clone(),
    fromZoom: camera.zoom,
    toPosition: targetConfig.position.clone(),
    toTarget: targetConfig.target.clone(),
    toZoom: targetConfig.zoom,
  };
}

function setRoomHighlight(roomId) {
  roomFloors.forEach((floor, id) => {
    const selected = id === roomId;
    floor.material.emissive = new THREE.Color(selected ? 0x26303d : 0x000000);
    floor.material.emissiveIntensity = selected ? 0.36 : 0;
  });
  document.querySelectorAll('[data-room-target]').forEach((node) => node.classList.toggle('is-active', node.dataset.roomTarget === roomId));
}

function focusRoom(roomId) {
  const room = ROOMS.find((entry) => entry.id === roomId);
  if (!room) return;
  selectedRoomId = roomId;
  setRoomHighlight(roomId);
  tweenCamera(roomCamera(room));
  roomKickerEl.textContent = room.type === 'private' ? 'PRIVATE ROOM' : 'SHARED SPACE';
  roomTitleEl.textContent = room.name;
  roomDescriptionEl.textContent = room.description;
}

function focusHome() {
  selectedRoomId = null;
  setRoomHighlight(null);
  tweenCamera(HOME_CAMERA);
  roomKickerEl.textContent = 'WELCOME HOME';
  roomTitleEl.textContent = '看看今天家里有什么需要处理。';
  roomDescriptionEl.textContent = '左键拖动画布，右键旋转视角，滚轮缩放；物件旁的 + 用来上报新事情，! 表示这里已经有事情在等人处理。';
}

function closeObjectPanel() {
  objectPanel.classList.remove('is-open', 'is-contextual');
  activePanel = null;
  activePanelAnchor = null;
}

function positionContextPanel() {
  if (!activePanelAnchor || !objectPanel.classList.contains('is-contextual')) return;
  const projected = activePanelAnchor.clone().project(camera);
  const px = (projected.x * 0.5 + 0.5) * window.innerWidth;
  const py = (-projected.y * 0.5 + 0.5) * window.innerHeight;
  const width = objectPanel.offsetWidth || 320;
  const height = objectPanel.offsetHeight || 260;
  const preferLeft = px > window.innerWidth * 0.67;
  const left = preferLeft ? px - width - 26 : px + 26;
  objectPanel.style.left = `${Math.max(18, Math.min(window.innerWidth - width - 18, left))}px`;
  objectPanel.style.top = `${Math.max(88, Math.min(window.innerHeight - height - 18, py - height * 0.42))}px`;
}

function openPanel({ kicker, title, body, meta = '', actions = '', anchor = null }) {
  objectKicker.textContent = kicker;
  objectTitle.textContent = title;
  objectBody.textContent = body;
  objectMeta.innerHTML = meta;
  objectActions.innerHTML = actions;
  activePanelAnchor = anchor ? anchor.clone() : null;
  objectPanel.classList.toggle('is-contextual', Boolean(anchor));
  if (!anchor) {
    objectPanel.style.left = '';
    objectPanel.style.top = '';
  }
  objectPanel.classList.add('is-open');
  requestAnimationFrame(positionContextPanel);
}

function openRoomInfo(roomId) {
  const room = ROOMS.find((entry) => entry.id === roomId);
  if (!room) return;
  focusRoom(roomId);
  openPanel({
    kicker: room.type === 'private' ? `${room.owner} · PRIVATE ROOM` : 'SHARED SPACE',
    title: room.name,
    body: room.description,
    meta: `<div class="meta-row"><span>属性</span><strong>${room.type === 'private' ? '私人空间' : '公共空间'}</strong></div>`,
  });
}

function openItem(itemId) {
  if (itemId === 'toilet-paper') guideMarkerKey = null;
  const state = store.getState();
  const item = state.items.find((entry) => entry.id === itemId);
  if (!item) return;
  if (item.status === 'reported') {
    const task = state.tasks.find((entry) => entry.sourceItemId === itemId && entry.status !== 'resolved');
    if (task) return openTask(task.id);
  }
  focusRoom(item.roomId);
  activePanel = { kind: 'item', id: itemId };
  openPanel({
    kicker: '卫生间 · 公共用品',
    title: item.name,
    body: 'Roomie 不会猜库存。发现变化的人可以从这里把真实情况告诉这个家。',
    meta: '<div class="meta-row"><span>当前记录</span><strong>状态正常</strong></div>',
    actions: `
      <div class="choice-grid">
        <button class="choice-button" data-panel-action="report-low" type="button"><strong>快用完了</strong><span>先提醒大家，需要有人去补货</span></button>
        <button class="choice-button" data-panel-action="report-empty" type="button"><strong>已经没了</strong><span>直接创建一个待认领补货任务</span></button>
      </div>
      <button class="secondary-button" data-panel-action="already-bought" type="button">我刚买了新的</button>`,
    anchor: MARKER_POSITIONS.paper,
  });
}

function getTask(taskId) {
  return store.getState().tasks.find((task) => task.id === taskId);
}

function openTask(taskId) {
  const state = store.getState();
  const task = state.tasks.find((entry) => entry.id === taskId);
  if (!task) return;
  if (task.sourceItemId === 'toilet-paper') guideMarkerKey = null;
  focusRoom(task.roomId);
  activePanel = { kind: 'task', id: taskId };

  if (task.type === 'restock') {
    const item = state.items.find((entry) => entry.id === task.sourceItemId);
    const assignee = state.members.find((member) => member.id === task.assigneeId);
    const isMine = task.assigneeId === state.currentUserId;
    let actions = '';
    if (task.status === 'unclaimed') {
      actions = '<button class="primary-button" data-panel-action="claim-restock" type="button">我来买</button>';
    } else if (task.status === 'claimed' && isMine) {
      actions = `
        <div class="amount-field"><span>¥</span><input id="purchaseAmount" type="number" min="0" step="0.1" value="29.9" aria-label="购买金额" /></div>
        <button class="primary-button" data-panel-action="complete-purchase" type="button">已买到 · 自动生成 AA</button>`;
    }
    openPanel({
      kicker: '卫生间 · 补货任务',
      title: item?.reportedState === 'empty' ? `${item.name}已经没有了` : `${item?.name ?? '公共用品'}快用完了`,
      body: task.status === 'unclaimed' ? '还没有经办人。认领后，你就直接进入“正在购买”的状态，不再多一步“开始购买”。' : `${assignee?.name ?? '室友'}已经认领，买到后填入实际金额即可。`,
      meta: `<div class="meta-row"><span>状态</span><strong>${task.status === 'unclaimed' ? '待认领' : '处理中'}</strong></div><div class="meta-row"><span>经办人</span><strong>${assignee?.name ?? '还没有'}</strong></div>`,
      actions,
      anchor: MARKER_POSITIONS.paper,
    });
    return;
  }

  if (task.type === 'cleaning') {
    const assignee = state.members.find((member) => member.id === task.assigneeId);
    openPanel({
      kicker: '厨房 · 周期任务',
      title: '今晚厨房值日',
      body: '这不是 Roomie 猜厨房脏了，而是排班周期到了。完成后环境会恢复干净。',
      meta: `<div class="meta-row"><span>负责人</span><strong>${assignee?.name ?? '未指定'}</strong></div><div class="meta-row"><span>截止</span><strong>${task.dueLabel}</strong></div>`,
      actions: task.status === 'pending' ? '<button class="primary-button" data-panel-action="complete-clean" type="button">标记已完成</button>' : '',
      anchor: MARKER_POSITIONS.clean,
    });
    return;
  }

  const room = ROOMS.find((entry) => entry.id === task.roomId);
  const assignee = state.members.find((member) => member.id === task.assigneeId);
  const isMine = task.assigneeId === state.currentUserId;
  const actions = task.status === 'unclaimed'
    ? '<button class="primary-button" data-panel-action="claim-spatial" type="button">我来处理</button>'
    : isMine && task.status === 'claimed'
      ? '<button class="primary-button" data-panel-action="complete-spatial" type="button">标记已完成</button>'
      : '';
  openPanel({
    kicker: `${room?.name ?? '公共空间'} · 空间事项`,
    title: task.title,
    body: task.status === 'unclaimed' ? '这件事已经被放进这个家，正在等一位室友认领。' : `${assignee?.name ?? '室友'}正在处理这件事。`,
    meta: `<div class="meta-row"><span>状态</span><strong>${task.status === 'unclaimed' ? '待认领' : '处理中'}</strong></div><div class="meta-row"><span>经办人</span><strong>${assignee?.name ?? '还没有'}</strong></div>`,
    actions,
  });
}

function memberName(memberId) {
  if (memberId === 'system') return 'Roomie';
  return store.getState().members.find((member) => member.id === memberId)?.name ?? memberId;
}

function formatMoney(value) {
  return `¥${Number(value).toFixed(Number(value) % 1 ? 2 : 0)}`;
}

function renderSidebar(state) {
  const current = state.currentUserId;
  const todo = [];
  const waiting = [];

  state.tasks.forEach((task) => {
    if (['resolved', 'completed'].includes(task.status)) return;
    if (task.assigneeId === current) {
      todo.push({ kind: 'task', id: task.id, glyph: task.type === 'cleaning' ? 'C' : (task.icon || '!'), title: task.title, meta: task.dueLabel || '处理中' });
    } else if (!task.assigneeId && task.status === 'unclaimed') {
      todo.push({ kind: 'task', id: task.id, glyph: task.icon || '+', title: task.title, meta: '待认领 · 任何室友都可以处理' });
    } else if (task.assigneeId) {
      waiting.push({ kind: 'task', id: task.id, glyph: '·', title: task.title, meta: `${memberName(task.assigneeId)}处理中` });
    }
  });

  state.expenses.forEach((expense) => {
    if (expense.status === 'settled') return;
    const mySplit = expense.splits.find((split) => split.memberId === current);
    if (mySplit?.status === 'unpaid' && mySplit.amount > 0) {
      todo.push({
        kind: 'ledger',
        id: expense.id,
        glyph: '¥',
        title: expense.title,
        meta: `${memberName(expense.payerId)}已垫付 · 我待支付 ${formatMoney(mySplit.amount)}`,
        money: true,
      });
      return;
    }

    if (expense.payerId === current) {
      const receivables = expense.splits.filter((split) => split.memberId !== current && split.status === 'unpaid' && split.amount > 0);
      if (receivables.length) {
        const total = receivables.reduce((sum, split) => sum + split.amount, 0);
        waiting.push({
          kind: 'ledger',
          id: expense.id,
          glyph: '¥',
          title: expense.title,
          meta: `待收款 · ${receivables.length} 人 · ${formatMoney(total)}`,
          money: true,
        });
      }
    }
  });

  state.rules.filter((rule) => rule.status === 'discussion' && !rule.approvals.includes(current)).forEach((rule) => {
    todo.push({ kind: 'whiteboard', id: rule.id, glyph: 'R', title: '新规则待确认', meta: rule.title, rule: true });
  });

  todoCount.textContent = String(todo.length);
  todoList.innerHTML = todo.length ? todo.map((item) => actionCard(item)).join('') : '<div class="empty-state">今天暂时没有必须由你处理的事情。</div>';
  waitingList.innerHTML = waiting.length ? waiting.slice(0, 5).map((item) => actionCard(item)).join('') : '<div class="empty-state">暂时没有等待其他室友的事项。</div>';
}

function actionCard(item) {
  const cls = item.money ? ' money' : item.rule ? ' rule' : '';
  return `<button class="action-card" data-sidebar-kind="${item.kind}" data-sidebar-id="${item.id}" type="button"><span class="action-top"><i class="action-glyph${cls}">${item.glyph}</i><span><strong>${item.title}</strong><small>${item.meta}</small></span></span></button>`;
}

function renderLedger(state) {
  const open = state.expenses.filter((expense) => expense.status !== 'settled');
  const settled = state.expenses.filter((expense) => expense.status === 'settled');
  ledgerBadge.textContent = String(open.length);
  openExpenses.innerHTML = open.length ? open.map(expenseCard).join('') : '<div class="empty-state">现在没有待结算账目。</div>';
  settledExpenses.innerHTML = settled.length ? settled.map(expenseCard).join('') : '<div class="empty-state">还没有新的结清记录。</div>';
}

function expenseCard(expense) {
  const paid = expense.splits.filter((split) => split.status === 'paid').length;
  const payer = memberName(expense.payerId);
  return `
    <article class="expense-card${expense.id === latestDemoExpenseId ? ' is-new' : ''}" data-expense-card="${expense.id}">
      <div class="expense-head"><strong>${expense.title}</strong><b>${formatMoney(expense.amount)}</b></div>
      <div class="expense-meta">${expense.type === 'recurring' ? '周期账单' : '临时公共支出'} · ${payer} 垫付 · ${paid}/${expense.splits.length} 已完成</div>
      <div class="split-list">
        ${expense.splits.map((split) => {
          const isPayer = split.memberId === expense.payerId;
          const label = isPayer
            ? `已垫付 ${formatMoney(expense.amount)}`
            : split.status === 'paid'
              ? '✓ 已支付'
              : `${formatMoney(split.amount)} 待支付`;
          const cls = split.status === 'paid' ? 'paid' : 'unpaid';
          const currentUserId = store.getState().currentUserId;
          const canPaySelf = split.memberId === currentUserId && split.status === 'unpaid' && split.amount > 0;
          const canPoke = expense.payerId === currentUserId && split.memberId !== currentUserId && split.status === 'unpaid' && split.amount > 0;
          const action = canPaySelf
            ? `<button data-pay-self="${expense.id}" type="button">我已完成</button>`
            : canPoke
              ? `<button data-poke-outgoing="${split.memberId}" data-expense-id="${expense.id}" type="button">戳一戳</button>`
              : '';
          return `<div class="split-row"><span>${memberName(split.memberId)}${isPayer ? ' · 垫付人' : ''}</span><span class="${cls}">${label}</span>${action}</div>`;
        }).join('')}
      </div>
    </article>`;
}

function renderRules(state) {
  const pending = state.rules.filter((rule) => rule.status === 'discussion' && !(rule.comments?.length));
  const discussion = state.rules.filter((rule) => rule.status === 'discussion' && rule.comments?.length);
  const active = state.rules.filter((rule) => rule.status === 'active');
  boardBadge.textContent = String(pending.length + discussion.length);
  ruleBoard.innerHTML = `
    <section class="rule-column"><h3>待确认</h3>${pending.map((rule) => sticky(rule, 'yellow')).join('') || '<p class="empty-state">没有新的待确认提案</p>'}</section>
    <section class="rule-column"><h3>讨论中</h3>${discussion.map((rule) => sticky(rule, 'blue')).join('') || '<p class="empty-state">没有进行中的讨论</p>'}</section>
    <section class="rule-column"><h3>已生效</h3>${active.map((rule) => sticky(rule, 'green')).join('') || '<p class="empty-state">还没有正式规则</p>'}</section>`;
}

function sticky(rule, tone) {
  const comments = rule.comments?.length ? rule.comments.map((comment) => `<span class="rule-comment">${memberName(comment.memberId)}：${comment.text}</span>`).join('') : '<span class="rule-comment muted">还没有留言</span>';
  const cls = tone === 'green' ? ' green' : tone === 'blue' ? ' blue' : '';
  const currentApproved = rule.approvals.includes(store.getState().currentUserId);
  const actions = rule.status === 'active' ? '' : `
    <div class="rule-actions">
      <button data-rule-approve="${rule.id}" type="button" ${currentApproved ? 'disabled' : ''}>${currentApproved ? '✓ 已同意' : '同意'}</button>
      <div class="rule-comment-box"><input data-rule-comment-input="${rule.id}" placeholder="继续讨论…" /><button data-rule-comment="${rule.id}" type="button">留言</button></div>
    </div>`;
  return `<article class="sticky-note${cls}"><strong>${rule.title}</strong><div class="rule-comments">${comments}</div><div class="rule-progress"><span>${rule.approvals.length}/3 已同意</span><span>${rule.status === 'active' ? '已生效' : '可继续讨论'}</span></div>${actions}</article>`;
}

function renderTimeline(state) {
  timelineList.innerHTML = state.history.map((event) => `
    <div class="timeline-event"><time>${new Date(event.at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time><strong>${event.text}</strong></div>
  `).join('');
}

function renderFloorplan(state) {
  const minX = -5.78; const maxX = 5.78; const minZ = -4.55; const maxZ = 4.5;
  const rangeX = maxX - minX; const rangeZ = maxZ - minZ;
  floorplanEl.innerHTML = '';
  ROOMS.forEach((room) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'map-room';
    button.dataset.roomTarget = room.id;
    button.style.left = `${((room.x - room.w / 2 - minX) / rangeX) * 100}%`;
    button.style.top = `${((room.z - room.d / 2 - minZ) / rangeZ) * 100}%`;
    button.style.width = `${(room.w / rangeX) * 100}%`;
    button.style.height = `${(room.d / rangeZ) * 100}%`;
    button.style.background = `#${room.color.toString(16).padStart(6, '0')}`;

    const roomHasTask = state.tasks.some((task) => task.roomId === room.id && !['resolved', 'completed'].includes(task.status));
    const roomHasReportedItem = state.items.some((item) => item.roomId === room.id && item.status === 'reported');
    const sharedAlert = room.id === 'living' && (state.expenses.some((expense) => expense.status !== 'settled') || state.rules.some((rule) => rule.status === 'discussion'));
    const badge = roomHasTask || roomHasReportedItem || sharedAlert ? '<i>!</i>' : room.type === 'shared' ? '<i class="ok">✓</i>' : '';
    button.innerHTML = `<span>${room.name}</span>${badge}`;
    floorplanEl.appendChild(button);
  });
}

function renderSceneState(state) {
  const paper = state.items.find((item) => item.id === 'toilet-paper');
  const restock = state.tasks.find((task) => task.sourceItemId === 'toilet-paper' && task.status !== 'resolved');
  if (paper?.status === 'reported' && restock) {
    ensureMarker('paper', MARKER_POSITIONS.paper, { text: '!', background: '#e6b259', interaction: { kind: 'task', id: restock.id, label: `${restock.title} · 点击处理` } });
  } else {
    ensureMarker('paper', MARKER_POSITIONS.paper, { text: '+', background: '#6d99a1', interaction: { kind: 'item', id: 'toilet-paper', label: '卫生纸 · 上报新情况' } });
  }

  const clean = state.tasks.find((task) => task.id === 'clean-kitchen-0913');
  if (clean && clean.status === 'pending') ensureMarker('clean', MARKER_POSITIONS.clean, { text: '!', background: '#e6b259', interaction: { kind: 'task', id: clean.id, label: '厨房值日 · 待完成' } }); else hideMarker('clean');
  if (kitchenMess) kitchenMess.visible = clean?.status !== 'completed';

  const openExpenseCount = state.expenses.filter((expense) => expense.status !== 'settled').length;
  if (openExpenseCount) ensureMarker('ledger', MARKER_POSITIONS.ledger, { text: '!', background: '#f0836e', interaction: { kind: 'ledger', id: 'ledger', label: `共同账本 · ${openExpenseCount} 笔待结算` } }); else hideMarker('ledger');

  const openRuleCount = state.rules.filter((rule) => rule.status === 'discussion').length;
  if (openRuleCount) ensureMarker('whiteboard', MARKER_POSITIONS.whiteboard, { text: '!', background: '#8ca2c7', interaction: { kind: 'whiteboard', id: 'whiteboard', label: `共同白板 · ${openRuleCount} 条讨论中` } }); else hideMarker('whiteboard');

  const activeCustomKeys = new Set();
  state.tasks
    .filter((task) => task.source === 'human' && task.type !== 'restock' && !['resolved', 'completed'].includes(task.status))
    .forEach((task, index) => {
      const room = ROOMS.find((entry) => entry.id === task.roomId);
      if (!room) return;
      const key = `custom-${task.id}`;
      activeCustomKeys.add(key);
      const xOffset = ((index % 3) - 1) * 0.34;
      ensureMarker(key, new THREE.Vector3(room.x + xOffset, 1.72, room.z), {
        text: task.status === 'unclaimed' ? '!' : (task.icon || '•'),
        background: task.status === 'unclaimed' ? '#e6b259' : '#6d99a1',
        interaction: { kind: 'task', id: task.id, label: `${task.title} · ${task.status === 'unclaimed' ? '待认领' : '处理中'}` },
      });
    });
  markerSprites.forEach((marker, key) => {
    if (key.startsWith('custom-') && !activeCustomKeys.has(key)) marker.visible = false;
  });
}

function renderAll(state = store.getState()) {
  renderSidebar(state);
  renderLedger(state);
  renderRules(state);
  renderTimeline(state);
  renderFloorplan(state);
  renderSceneState(state);
}

function showOverlay(id) {
  document.getElementById(`${id}Overlay`)?.classList.add('is-open');
}

function hideOverlay(id) {
  document.getElementById(`${id}Overlay`)?.classList.remove('is-open');
}

function openLedger() {
  guideMarkerKey = null;
  document.getElementById('ledgerHudBtn')?.classList.remove('is-attention');
  focusRoom('living');
  closeObjectPanel();
  showOverlay('ledger');
  maybeShowIncomingPoke();
}

function openWhiteboard() {
  focusRoom('living');
  closeObjectPanel();
  showOverlay('whiteboard');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1900);
}

function fireConfetti() {
  confetti.innerHTML = '';
  const colors = ['#ef816e', '#e7b65b', '#78b98f', '#8ca2c7', '#eee3cb'];
  for (let i = 0; i < 46; i += 1) {
    const piece = document.createElement('i');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--drift', `${(Math.random() - .5) * 180}px`);
    piece.style.animationDelay = `${Math.random() * .35}s`;
    confetti.appendChild(piece);
  }
  setTimeout(() => { confetti.innerHTML = ''; }, 2600);
}

function maybeShowIncomingPoke() {
  if (incomingPokeShown) return;
  const state = store.getState();
  const current = state.currentUserId;
  const expense = state.expenses.find((entry) => {
    if (entry.status === 'settled' || entry.payerId === current) return false;
    const split = entry.splits.find((candidate) => candidate.memberId === current);
    return split?.status === 'unpaid' && split.amount > 0;
  });
  if (!expense) return;

  incomingPokeShown = true;
  setTimeout(() => {
    if (!document.getElementById('ledgerOverlay')?.classList.contains('is-open')) {
      incomingPokeShown = false;
      return;
    }
    const latestExpense = store.getState().expenses.find((entry) => entry.id === expense.id);
    const split = latestExpense?.splits.find((entry) => entry.memberId === current);
    if (!latestExpense || split?.status !== 'unpaid') {
      incomingPokeShown = false;
      return;
    }
    pokeMember(latestExpense.id, current, latestExpense.payerId);
    pendingPoke = { expenseId: latestExpense.id, memberId: current };
    pokeKicker.textContent = 'DEMO · 收到室友提醒';
    pokeTitle.textContent = `${memberName(latestExpense.payerId)}戳了戳你`;
    pokeMessage.textContent = `${latestExpense.title}还有 ${formatMoney(split?.amount ?? 0)} 待支付`;
    pokeOverlay.classList.remove('is-active');
    appShell.classList.remove('is-poked');
    void pokeOverlay.offsetWidth;
    pokeOverlay.classList.add('is-active');
    appShell.classList.add('is-poked');
    setTimeout(() => appShell.classList.remove('is-poked'), 900);
  }, 700);
}

function completePokedAction() {
  if (!pendingPoke) return;
  const { expenseId, memberId } = pendingPoke;
  const settled = paySplit(expenseId, memberId);
  pendingPoke = null;
  pokeOverlay.classList.remove('is-active');
  if (settled) {
    fireConfetti();
    showToast('AA 已全部结清');
  } else {
    showToast(`${memberName(memberId)}已完成付款`);
  }
}

function resetAddComposer() {
  addMode = null;
  addTypePicker.hidden = false;
  addForm.hidden = true;
  spatialFields.hidden = false;
  expenseFields.hidden = true;
  ruleFields.hidden = true;
  addForm.reset();
}

const ADD_EXAMPLES = {
  spatial: {
    itemLabel: '洗手液',
    issue: '快用完了',
    category: 'supply',
    roomId: 'bath',
    assigneeId: '',
  },
  expense: {
    title: '周末外卖',
    amount: 96,
  },
  rule: {
    title: '周日晚一起确认下周公共区域值日',
  },
};

function setAddMode(mode) {
  addMode = mode;
  addTypePicker.hidden = true;
  addForm.hidden = false;
  spatialFields.hidden = mode !== 'spatial';
  expenseFields.hidden = mode !== 'expense';
  ruleFields.hidden = mode !== 'rule';
  if (mode === 'spatial') {
    addFormKicker.textContent = '空间事项';
    addFormTitle.textContent = '把一件事放回它发生的位置';
    const sample = ADD_EXAMPLES.spatial;
    document.getElementById('spatialItemName').value = sample.itemLabel;
    document.getElementById('spatialTitle').value = sample.issue;
    document.getElementById('spatialCategory').value = sample.category;
    document.getElementById('spatialRoom').value = sample.roomId;
    document.getElementById('spatialAssignee').value = sample.assigneeId;
  } else if (mode === 'expense') {
    addFormKicker.textContent = '公共支出';
    addFormTitle.textContent = '新增一笔共同账目';
    const sample = ADD_EXAMPLES.expense;
    document.getElementById('expenseTitleInput').value = sample.title;
    document.getElementById('expenseAmountInput').value = String(sample.amount);
  } else {
    addFormKicker.textContent = '共同提案';
    addFormTitle.textContent = '把一个想法放到白板上';
    document.getElementById('ruleTitleInput').value = ADD_EXAMPLES.rule.title;
  }
}

function openAddForMode(mode, sourceOverlay = null) {
  if (sourceOverlay) hideOverlay(sourceOverlay);
  resetAddComposer();
  showOverlay('add');
  setAddMode(mode);
}

function submitAddComposer() {
  if (addMode === 'spatial') {
    const sample = ADD_EXAMPLES.spatial;
    const itemLabel = document.getElementById('spatialItemName').value.trim() || sample.itemLabel;
    const issue = document.getElementById('spatialTitle').value.trim() || sample.issue;
    const category = document.getElementById('spatialCategory').value || sample.category;
    const roomId = document.getElementById('spatialRoom').value || sample.roomId;
    const assigneeId = document.getElementById('spatialAssignee').value || sample.assigneeId || null;
    const icons = { supply: '▣', cleaning: '⌁', maintenance: '⚙', other: '•' };
    const title = `${itemLabel} · ${issue}`;
    const id = createSpatialTask({ title, roomId, assigneeId, category, itemLabel, icon: icons[category] || '•' });
    hideOverlay('add');
    resetAddComposer();
    focusRoom(roomId);
    showToast('已放进这个空间，3D 中出现了新的提醒');
    setTimeout(() => openTask(id), 420);
    return;
  }
  if (addMode === 'expense') {
    const sample = ADD_EXAMPLES.expense;
    const title = document.getElementById('expenseTitleInput').value.trim() || sample.title;
    const rawAmount = Number(document.getElementById('expenseAmountInput').value);
    const amount = rawAmount > 0 ? rawAmount : sample.amount;
    createAdHocExpense({ title, amount });
    hideOverlay('add');
    resetAddComposer();
    openLedger();
    showToast('已加入共同账本，并生成三人 AA');
    return;
  }
  if (addMode === 'rule') {
    const title = document.getElementById('ruleTitleInput').value.trim() || ADD_EXAMPLES.rule.title;
    createRuleProposal(title);
    hideOverlay('add');
    resetAddComposer();
    openWhiteboard();
    showToast('提案已经贴到白板上');
  }
}

function handlePanelAction(action) {
  if (!activePanel) return;
  if (activePanel.kind === 'item') {
    if (action === 'report-low' || action === 'report-empty') {
      reportItemIssue(activePanel.id, action === 'report-empty' ? 'empty' : 'low');
      closeObjectPanel();
      guideMarkerKey = 'paper';
      showToast('上报完成。现在点卫生纸旁的 !，看看谁来处理');
      return;
    }
    if (action === 'already-bought') {
      reportItemIssue(activePanel.id, 'low');
      const task = store.getState().tasks.find((entry) => entry.sourceItemId === activePanel.id && entry.status !== 'resolved');
      if (task) {
        claimRestockTask(task.id);
        openTask(task.id);
      }
      return;
    }
  }

  if (activePanel.kind === 'task') {
    const task = getTask(activePanel.id);
    if (!task) return;
    if (action === 'claim-restock') {
      claimRestockTask(task.id);
      showToast('你成为了这次补货的经办人');
      openTask(task.id);
      return;
    }
    if (action === 'complete-purchase') {
      const amount = Number(document.getElementById('purchaseAmount')?.value || 29.9);
      latestDemoExpenseId = completeRestockPurchase(task.id, amount);
      renderAll();
      closeObjectPanel();
      focusRoom('living');
      guideMarkerKey = 'ledger';
      document.getElementById('ledgerHudBtn')?.classList.add('is-attention');
      showToast('已补货并自动生成 AA。去点客厅账本的 !');
      setTimeout(() => {
        if (!latestDemoExpenseId) return;
        paySplit(latestDemoExpenseId, 'xiaowang');
        showToast('Demo：小王已经完成这一笔付款');
      }, 1100);
      return;
    }
    if (action === 'complete-clean') {
      completeChore(task.id);
      closeObjectPanel();
      fireConfetti();
      showToast('厨房值日完成，纸团消失了');
      return;
    }
    if (action === 'claim-spatial') {
      claimSpatialTask(task.id);
      showToast('你已经认领这件事');
      openTask(task.id);
      return;
    }
    if (action === 'complete-spatial') {
      completeSpatialTask(task.id);
      closeObjectPanel();
      showToast('已完成，空间提醒消失了');
    }
  }
}

function handleInteraction(interaction) {
  if (!interaction) return;
  if (interaction.kind === 'room') openRoomInfo(interaction.id);
  if (interaction.kind === 'item') openItem(interaction.id);
  if (interaction.kind === 'task') openTask(interaction.id);
  if (interaction.kind === 'ledger') openLedger();
  if (interaction.kind === 'whiteboard') openWhiteboard();
}

function updatePointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

renderer.domElement.addEventListener('pointermove', (event) => {
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(interactiveMeshes, false).find((result) => result.object.visible && interactionFrom(result.object));
  if (!hit) {
    if (hoveredObject?.userData?.baseScale) hoveredObject.scale.copy(hoveredObject.userData.baseScale);
    hoveredObject = null;
    tooltip.classList.remove('show');
    renderer.domElement.style.cursor = 'grab';
    return;
  }
  const interaction = interactionFrom(hit.object);
  const root = rootFrom(hit.object);
  if (hoveredObject !== root) {
    if (hoveredObject?.userData?.baseScale) hoveredObject.scale.copy(hoveredObject.userData.baseScale);
    hoveredObject = root;
    if (root?.userData?.baseScale && !root.isSprite) {
      const base = root.userData.baseScale;
      root.scale.set(base.x * 1.025, base.y * 1.025, base.z * 1.025);
    }
  }
  tooltip.textContent = interaction.label;
  tooltip.style.left = `${event.clientX + 12}px`;
  tooltip.style.top = `${event.clientY + 12}px`;
  tooltip.classList.add('show');
  renderer.domElement.style.cursor = 'pointer';
});

renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerStart = { x: event.clientX, y: event.clientY };
  if (!hoveredObject) renderer.domElement.style.cursor = 'grabbing';
});

renderer.domElement.addEventListener('pointerup', (event) => {
  renderer.domElement.style.cursor = hoveredObject ? 'pointer' : 'grab';
  if (!pointerStart) return;
  const moved = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
  pointerStart = null;
  if (moved > 6) return;
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(interactiveMeshes, false).find((result) => result.object.visible && interactionFrom(result.object));
  if (hit) handleInteraction(interactionFrom(hit.object));
});

renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
controls.addEventListener('start', () => { cameraTween = null; });

document.addEventListener('click', (event) => {
  const roomButton = event.target.closest('[data-room-target]');
  if (roomButton) focusRoom(roomButton.dataset.roomTarget);

  const panelAction = event.target.closest('[data-panel-action]');
  if (panelAction) handlePanelAction(panelAction.dataset.panelAction);

  const close = event.target.closest('[data-close-overlay]');
  if (close) hideOverlay(close.dataset.closeOverlay);

  const paySelfButton = event.target.closest('[data-pay-self]');
  if (paySelfButton) {
    const settled = paySplit(paySelfButton.dataset.paySelf, store.getState().currentUserId);
    if (settled) {
      fireConfetti();
      showToast('AA 已全部结清');
    } else {
      showToast('已记录你的付款');
    }
  }

  const outgoingPokeButton = event.target.closest('[data-poke-outgoing]');
  if (outgoingPokeButton) {
    const memberId = outgoingPokeButton.dataset.pokeOutgoing;
    const expenseId = outgoingPokeButton.dataset.expenseId;
    pokeMember(expenseId, memberId);
    showToast(`已戳一戳${memberName(memberId)}`);
  }

  const approveButton = event.target.closest('[data-rule-approve]');
  if (approveButton && !approveButton.disabled) {
    const activated = approveRule(approveButton.dataset.ruleApprove);
    if (activated) {
      fireConfetti();
      showToast('全员确认，这条规则正式生效');
    } else {
      showToast('已记录你的同意');
    }
  }

  const commentButton = event.target.closest('[data-rule-comment]');
  if (commentButton) {
    const input = document.querySelector(`[data-rule-comment-input="${commentButton.dataset.ruleComment}"]`);
    const text = input?.value.trim();
    if (text) {
      commentRule(commentButton.dataset.ruleComment, text);
      showToast('留言已经贴到白板上');
    }
  }

  const sidebar = event.target.closest('[data-sidebar-kind]');
  if (sidebar) {
    if (sidebar.dataset.sidebarKind === 'task') openTask(sidebar.dataset.sidebarId);
    if (sidebar.dataset.sidebarKind === 'ledger') openLedger();
    if (sidebar.dataset.sidebarKind === 'whiteboard') openWhiteboard();
  }
});

document.getElementById('closeObjectPanel').addEventListener('click', closeObjectPanel);
document.getElementById('mapHomeBtn').addEventListener('click', focusHome);
document.getElementById('ledgerHudBtn').addEventListener('click', openLedger);
document.getElementById('whiteboardHudBtn').addEventListener('click', openWhiteboard);
document.getElementById('ledgerLocalAddBtn').addEventListener('click', () => openAddForMode('expense', 'ledger'));
document.getElementById('boardLocalAddBtn').addEventListener('click', () => openAddForMode('rule', 'whiteboard'));
document.getElementById('globalAddBtn').addEventListener('click', () => { resetAddComposer(); showOverlay('add'); });
document.getElementById('historyHudBtn').addEventListener('click', () => showOverlay('timeline'));
document.getElementById('timelineBtn').addEventListener('click', () => showOverlay('timeline'));
document.getElementById('ledgerHistoryBtn').addEventListener('click', () => { hideOverlay('ledger'); showOverlay('timeline'); });
document.getElementById('collapseSidebarBtn').addEventListener('click', (event) => {
  const sidebar = document.getElementById('myRoomie');
  const collapsed = sidebar.classList.toggle('is-collapsed');
  event.currentTarget.textContent = collapsed ? '›' : '‹';
  event.currentTarget.setAttribute('aria-label', collapsed ? '展开侧边栏' : '收起侧边栏');
});
document.getElementById('guideBtn').addEventListener('click', () => onboarding.classList.add('is-open'));
document.getElementById('skipGuideBtn').addEventListener('click', () => onboarding.classList.remove('is-open'));
document.getElementById('pokeCompleteBtn').addEventListener('click', completePokedAction);
document.getElementById('pokeDismissBtn').addEventListener('click', () => {
  pendingPoke = null;
  pokeOverlay.classList.remove('is-active');
  showToast('稍后也可以从账本继续处理');
});
document.getElementById('startGuideBtn').addEventListener('click', () => {
  onboarding.classList.remove('is-open');
  focusRoom('bath');
  guideMarkerKey = 'paper';
  setTimeout(() => showToast('先找到卫生纸旁的 +，开始补充卫生纸'), 520);
});
document.getElementById('resetDemoBtn').addEventListener('click', () => {
  latestDemoExpenseId = null;
  pendingPoke = null;
  incomingPokeShown = false;
  guideMarkerKey = null;
  document.getElementById('ledgerHudBtn')?.classList.remove('is-attention');
  pokeOverlay.classList.remove('is-active');
  resetDemo();
  closeObjectPanel();
  document.querySelectorAll('.world-overlay').forEach((overlay) => overlay.classList.remove('is-open'));
  focusHome();
  showToast('Demo 已重置');
});

document.querySelectorAll('[data-add-type]').forEach((button) => button.addEventListener('click', () => setAddMode(button.dataset.addType)));
document.getElementById('backAddTypeBtn').addEventListener('click', resetAddComposer);
addForm.addEventListener('submit', (event) => {
  event.preventDefault();
  submitAddComposer();
});

store.subscribe(renderAll);

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;
  camera.left = -frustum * aspect;
  camera.right = frustum * aspect;
  camera.top = frustum;
  camera.bottom = -frustum;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', resize);
resize();

function animate(now) {
  requestAnimationFrame(animate);
  if (cameraTween) {
    const t = Math.min((now - cameraTween.start) / cameraTween.duration, 1);
    const e = ease(t);
    camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, e);
    controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, e);
    camera.zoom = THREE.MathUtils.lerp(cameraTween.fromZoom, cameraTween.toZoom, e);
    camera.updateProjectionMatrix();
    if (t >= 1) cameraTween = null;
  }
  const seconds = now * 0.001;
  markerSprites.forEach((marker, key) => {
    if (!marker.visible) return;
    marker.position.y = marker.userData.baseY + Math.sin(seconds * 2.2 + key.length) * 0.065;
    const base = marker.userData.baseScale?.x ?? 0.66;
    const pulse = guideMarkerKey === key ? 1.18 + Math.sin(seconds * 4.6) * 0.08 : 1;
    marker.scale.setScalar(base * pulse);
  });
  controls.update();
  positionContextPanel();
  renderer.render(scene, camera);
}

buildApartment();
renderAll();
renderer.domElement.style.cursor = 'grab';
requestAnimationFrame(animate);
