/**
 * three-progress.js — High-Tech 3D Holographic Journey Marker
 *
 * Renders a calibrated, glowing holographic telemetry ring:
 * - Glowing outer gauge track with calibration ticks
 * - Luminous arc fill that advances with completion percentage
 * - Central glowing core crystal with dual orbit rings
 * - Smooth mouse tilt parallax
 * - Performance: clamped pixel ratio, WebGL fallback
 */

(function () {
  let activeRenderer = null;
  let activeAnimationId = null;

  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  function initProgressOrb(containerId, percentage = 0) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;

    const fallbackEl = document.getElementById(`${containerId}-fallback`);

    if (!isWebGLAvailable() || typeof THREE === 'undefined') {
      if (fallbackEl) fallbackEl.classList.remove('d-none');
      return;
    }

    // Cleanup previous instance
    if (activeRenderer) {
      if (activeAnimationId) cancelAnimationFrame(activeAnimationId);
      if (activeRenderer.domElement && activeRenderer.domElement.parentNode) {
        activeRenderer.domElement.parentNode.removeChild(activeRenderer.domElement);
      }
      activeRenderer.dispose();
      activeRenderer = null;
    }

    const width = container.clientWidth || 240;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.pointerEvents = 'auto';
    container.appendChild(renderer.domElement);
    activeRenderer = renderer;

    const clampedPct = Math.max(0, Math.min(100, Math.round(percentage)));

    // Colors
    const isCompleted = clampedPct >= 100;
    const activeColor = isCompleted ? 0x10B981 : (clampedPct > 0 ? 0x00F2FE : 0x64748B);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(activeColor, 2.5, 30);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);

    const compassGroup = new THREE.Group();
    scene.add(compassGroup);

    // 1. Base Dark Calibration Ring
    const baseRingGeo = new THREE.RingGeometry(2.0, 2.25, 64);
    const baseRingMat = new THREE.MeshBasicMaterial({
      color: 0x1E293B,
      side: THREE.DoubleSide,
    });
    const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
    compassGroup.add(baseRing);

    // 2. Progress Arc
    const arcAngle = (clampedPct / 100) * (Math.PI * 2);
    if (arcAngle > 0.05) {
      const arcGeo = new THREE.RingGeometry(1.95, 2.3, 64, 1, Math.PI / 2, -arcAngle);
      const arcMat = new THREE.MeshBasicMaterial({
        color: activeColor,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const arcMesh = new THREE.Mesh(arcGeo, arcMat);
      compassGroup.add(arcMesh);
    }

    // 3. Central Glowing Crystal
    const coreGeo = new THREE.OctahedronGeometry(0.85, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: activeColor,
      emissive: activeColor,
      emissiveIntensity: 0.75,
      roughness: 0.15,
      metalness: 0.8,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    compassGroup.add(coreMesh);

    // 4. Orbiting Wireframe Cage
    const cageGeo = new THREE.IcosahedronGeometry(1.25, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0x8B5CF6,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    compassGroup.add(cageMesh);

    // 5. Waypoint Needle / Arrow at the tip of progress arc
    const needleGeo = new THREE.ConeGeometry(0.16, 0.7, 16);
    const needleMat = new THREE.MeshBasicMaterial({
      color: activeColor,
    });
    const needle = new THREE.Mesh(needleGeo, needleMat);
    const tipAngle = Math.PI / 2 - arcAngle;
    const needleRadius = 2.12;
    needle.position.set(Math.cos(tipAngle) * needleRadius, Math.sin(tipAngle) * needleRadius, 0.05);
    needle.rotation.z = tipAngle - Math.PI / 2;
    compassGroup.add(needle);

    // Mouse tilt
    let targetTiltX = 0;
    let targetTiltY = 0;

    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      targetTiltY = (x / rect.width - 0.5) * 0.6;
      targetTiltX = (y / rect.height - 0.5) * 0.6;
    });

    container.addEventListener('mouseleave', () => {
      targetTiltX = 0;
      targetTiltY = 0;
    });

    // Resize
    window.addEventListener('resize', () => {
      if (!container || !activeRenderer) return;
      const w = container.clientWidth || 240;
      const h = container.clientHeight || 240;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      activeRenderer.setSize(w, h);
    });

    // Animate
    let clock = new THREE.Clock();
    const animate = () => {
      activeAnimationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      coreMesh.rotation.y = elapsed * 0.5;
      coreMesh.rotation.x = elapsed * 0.3;
      cageMesh.rotation.y = -elapsed * 0.3;

      compassGroup.rotation.x += (targetTiltX - compassGroup.rotation.x) * 0.08;
      compassGroup.rotation.y += (targetTiltY - compassGroup.rotation.y) * 0.08;

      renderer.render(scene, camera);
    };

    animate();
  }

  window.initProgressOrb = initProgressOrb;
})();
