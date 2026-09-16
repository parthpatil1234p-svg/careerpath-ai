/**
 * three-roadmap-path.js — High-Tech 3D Route Map & Milestone Stepping Stones
 *
 * Renders a glowing, interactive 3D route of weekly milestones:
 * - Numbered stepping-stone platforms with glowing status halos
 * - Radiant curve track connecting milestones with additive glow
 * - Status Color Coding:
 *     - Completed: Radiant Emerald (#10B981)
 *     - Current / Active: Electric Cyan (#00F2FE) with pulsing halo
 *     - Upcoming: Tech Indigo (#6366F1)
 * - Interactive raycasting: clicking milestone platform scrolls to #week-card-${w}
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

  function initRoadmapPath(containerId, weeklyData = []) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;

    const fallbackEl = document.getElementById(`${containerId}-fallback`) || document.getElementById('roadmap-canvas-fallback');

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

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 14, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.pointerEvents = 'auto';
    container.appendChild(renderer.domElement);
    activeRenderer = renderer;

    // Tooltip
    let tooltip = container.querySelector('.path-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'path-tooltip';
      container.appendChild(tooltip);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00F2FE, 2.5, 60);
    pointLight.position.set(0, 10, 8);
    scene.add(pointLight);

    const pathGroup = new THREE.Group();
    scene.add(pathGroup);

    const totalWeeks = weeklyData.length || 8;
    const interactiveMeshes = [];
    const milestonePoints = [];

    const spanX = 20;
    const startX = -spanX / 2;
    const stepX = spanX / Math.max(totalWeeks - 1, 1);

    for (let i = 0; i < totalWeeks; i++) {
      const x = startX + i * stepX;
      const progressFactor = totalWeeks > 1 ? i / (totalWeeks - 1) : 0;
      const z = Math.sin(progressFactor * Math.PI * 2) * 2.5;
      const y = Math.cos(progressFactor * Math.PI) * 0.6;
      milestonePoints.push(new THREE.Vector3(x, y, z));
    }

    // Luminous Connecting Tube / Curve
    if (milestonePoints.length > 1) {
      const curve = new THREE.CatmullRomCurve3(milestonePoints);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.12, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0x38BDF8,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      pathGroup.add(tubeMesh);
    }

    // Stardust Field
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 30;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.14,
      color: 0x00F2FE,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    pathGroup.add(new THREE.Points(pGeo, pMat));

    // Active Week index
    let activeWeekIdx = -1;
    for (let i = 0; i < weeklyData.length; i++) {
      const w = weeklyData[i];
      const isCompleted = w.status === 'completed' || w.isCompleted;
      const isInProgress = w.status === 'in-progress' || w.isActive;
      if (isInProgress || (!isCompleted && activeWeekIdx === -1)) {
        activeWeekIdx = i;
        break;
      }
    }
    if (activeWeekIdx === -1) activeWeekIdx = 0;

    const haloMeshes = [];

    // Milestone Nodes
    for (let i = 0; i < totalWeeks; i++) {
      const pt = milestonePoints[i];
      const weekInfo = weeklyData[i] || { weekNumber: i + 1, theme: `Week ${i + 1}`, status: 'upcoming' };

      const isCompleted = weekInfo.status === 'completed';
      const isActive = i === activeWeekIdx;

      let color = 0x6366F1; // Tech Indigo (upcoming)
      let colorHex = '#6366F1';
      let statusLabel = 'Upcoming';

      if (isCompleted) {
        color = 0x10B981; // Radiant Emerald
        colorHex = '#10B981';
        statusLabel = 'Completed';
      } else if (isActive) {
        color = 0x00F2FE; // Electric Cyan
        colorHex = '#00F2FE';
        statusLabel = 'Current Focus';
      }

      const stoneGroup = new THREE.Group();
      stoneGroup.position.copy(pt);

      // Cylinder Platform
      const cylGeo = new THREE.CylinderGeometry(0.9, 1.1, 0.4, 32);
      const cylMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: isActive ? 0.8 : (isCompleted ? 0.6 : 0.3),
        roughness: 0.25,
        metalness: 0.6,
      });
      const cylMesh = new THREE.Mesh(cylGeo, cylMat);
      cylMesh.userData = { ...weekInfo, colorHex, statusLabel, color };
      stoneGroup.add(cylMesh);
      interactiveMeshes.push(cylMesh);

      // Glowing Halo Ring
      const haloGeo = new THREE.TorusGeometry(1.3, 0.04, 16, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: isActive ? 0.85 : 0.45,
        blending: THREE.AdditiveBlending,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      stoneGroup.add(halo);
      haloMeshes.push(halo);

      pathGroup.add(stoneGroup);
    }

    // Raycaster & Interactivity
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-9999, -9999);
    let hoveredMesh = null;
    let targetRotY = 0;
    let lastClientX = null;
    let lastClientY = null;

    const updateTooltipPosition = (clientX, clientY) => {
      if (!tooltip || clientX === null || clientY === null) return;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const pad = 12;
      const tipWidth = Math.min(260, Math.max(180, rect.width - pad * 2));
      const tipRect = tooltip.getBoundingClientRect();
      const tipHeight = tipRect.height || tooltip.offsetHeight || 140;

      let left;
      if (x > rect.width * 0.45 || (x + 14 + tipWidth > rect.width - pad)) {
        left = x - tipWidth - 14;
      } else {
        left = x + 14;
      }

      if (left < pad) {
        left = pad;
      }
      if (left + tipWidth > rect.width - pad) {
        left = Math.max(pad, rect.width - tipWidth - pad);
      }

      let top = y - 14;
      if (top + tipHeight > rect.height - pad) {
        top = Math.max(pad, rect.height - tipHeight - pad);
      }
      if (top < pad) {
        top = pad;
      }

      tooltip.style.width = `${Math.round(tipWidth)}px`;
      tooltip.style.maxWidth = `${rect.width - pad * 2}px`;
      tooltip.style.left = `${Math.round(left)}px`;
      tooltip.style.top = `${Math.round(top)}px`;
    };

    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      lastClientX = e.clientX;
      lastClientY = e.clientY;

      mouse.x = (x / rect.width) * 2 - 1;
      mouse.y = -(y / rect.height) * 2 + 1;

      targetRotY = (x / rect.width - 0.5) * 0.4;

      updateTooltipPosition(e.clientX, e.clientY);
    });

    container.addEventListener('mouseleave', () => {
      mouse.x = -9999;
      mouse.y = -9999;
      targetRotY = 0;
      lastClientX = null;
      lastClientY = null;
      if (tooltip) tooltip.classList.remove('visible');
      if (hoveredMesh) {
        hoveredMesh.scale.set(1, 1, 1);
        hoveredMesh = null;
      }
    });

    // Click to scroll to week card
    container.addEventListener('click', () => {
      if (hoveredMesh && hoveredMesh.userData) {
        const wNum = hoveredMesh.userData.weekNumber;
        const targetCard = document.getElementById(`week-card-${wNum}`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetCard.classList.add('active-week');
          setTimeout(() => targetCard.classList.remove('active-week'), 2000);
        }
      }
    });

    // Resize
    window.addEventListener('resize', () => {
      if (!container || !activeRenderer) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      activeRenderer.setSize(w, h);
    });

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      activeAnimationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      haloMeshes.forEach((h, i) => {
        h.rotation.z = elapsed * 0.8 + i * 0.2;
      });

      pathGroup.rotation.y += (targetRotY - pathGroup.rotation.y) * 0.05;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hoveredMesh !== hit) {
          if (hoveredMesh) hoveredMesh.scale.set(1, 1, 1);
          hoveredMesh = hit;
          hoveredMesh.scale.set(1.25, 1.25, 1.25);

          const w = hit.userData;
          tooltip.innerHTML = `
            <div class="tooltip-header" style="border-left: 3px solid ${w.colorHex};">
              <span class="tooltip-code" style="color: ${w.colorHex};">WEEK ${w.weekNumber} · ${w.statusLabel.toUpperCase()}</span>
              <h4 class="tooltip-title">${w.theme || `Week ${w.weekNumber}`}</h4>
            </div>
            <p class="tooltip-body">Click stone to scroll to weekly modules</p>
          `;
          tooltip.classList.add('visible');
          updateTooltipPosition(lastClientX, lastClientY);
          container.style.cursor = 'pointer';
        }
      } else {
        if (hoveredMesh) {
          hoveredMesh.scale.set(1, 1, 1);
          hoveredMesh = null;
          tooltip.classList.remove('visible');
          container.style.cursor = 'default';
        }
      }

      renderer.render(scene, camera);
    };

    animate();
  }

  window.initRoadmapPath = initRoadmapPath;
})();
