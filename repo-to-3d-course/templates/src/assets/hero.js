/* Hero scene: nested wireframe shells with orbiting blocks.
   Flat, line-first 3D so it reads as technical drafting, not as a game engine.
   Everything is drawn in the theme's ink/accent, so it re-colours with the page.
   Swap the geometry for one that means something in YOUR subject (nested shells
   read as containment/hierarchy; a lattice reads as a graph; a stack reads as layers). */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas = document.querySelector("[data-hero-canvas]");
if (canvas && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const cssVar = (name, fallback) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 13);

  const world = new THREE.Group();
  scene.add(world);

  const lineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.85 });
  const accentMat = new THREE.MeshBasicMaterial();
  const inkMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.88 });

  function applyTheme() {
    const ink = new THREE.Color(cssVar("--ink", "#111111"));
    const accent = new THREE.Color(cssVar("--accent", "#ffe500"));
    lineMat.color = ink;
    inkMat.color = ink;
    accentMat.color = accent;
  }
  applyTheme();
  new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // three nested shells — containment, from outermost to innermost
  const shells = [];
  [4.7, 3.2, 1.95].forEach((size, i) => {
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size)),
      lineMat,
    );
    edges.userData.speed = 0.055 - i * 0.012;
    world.add(edges);
    shells.push(edges);
  });

  // the value at the centre of the chain
  const core = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 1.05), accentMat);
  world.add(core);
  const coreEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.06, 1.06, 1.06)),
    lineMat,
  );
  world.add(coreEdges);

  // free-floating blocks orbiting the shells
  const blocks = [];
  const blockGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
  for (let i = 0; i < 12; i++) {
    const mesh = new THREE.Mesh(blockGeo, i % 5 === 0 ? accentMat : inkMat);
    const radius = 3.6 + Math.random() * 1.5;
    const angle = (i / 12) * Math.PI * 2;
    mesh.userData = {
      radius,
      angle,
      y: (Math.random() - 0.5) * 4.6,
      spin: 0.3 + Math.random() * 0.6,
      drift: 0.06 + Math.random() * 0.12,
    };
    mesh.position.set(Math.cos(angle) * radius, mesh.userData.y, Math.sin(angle) * radius);
    mesh.scale.setScalar(0.5 + Math.random() * 0.6);
    world.add(mesh);
    blocks.push(mesh);
  }

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener(
    "pointermove",
    (e) => {
      pointer.tx = (e.clientX / innerWidth - 0.5) * 2;
      pointer.ty = (e.clientY / innerHeight - 0.5) * 2;
    },
    { passive: true },
  );

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 760 ? 15 : 11.5;
    world.position.x = w < 900 ? 0 : 3.1;
    world.position.y = w < 900 ? 0 : -0.3;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener("resize", resize);

  let visible = true;
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
  }).observe(canvas);
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden && visible;
  });

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const t = clock.getElapsedTime();

    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    world.rotation.y = t * 0.08 + pointer.x * 0.32;
    world.rotation.x = Math.sin(t * 0.15) * 0.06 - pointer.y * 0.22;

    shells.forEach((shell, i) => {
      shell.rotation.y = t * shell.userData.speed * (i % 2 ? -1 : 1);
      shell.rotation.x = t * shell.userData.speed * 0.6;
    });

    core.rotation.set(t * 0.5, t * 0.35, 0);
    coreEdges.rotation.copy(core.rotation);
    core.position.y = Math.sin(t * 0.8) * 0.18;
    coreEdges.position.copy(core.position);

    blocks.forEach((b) => {
      const d = b.userData;
      d.angle += d.drift * 0.012;
      b.position.set(Math.cos(d.angle) * d.radius, d.y + Math.sin(t * 0.4 + d.angle) * 0.5, Math.sin(d.angle) * d.radius);
      b.rotation.x = t * d.spin * 0.4;
      b.rotation.y = t * d.spin * 0.55;
    });

    renderer.render(scene, camera);
  });
}
