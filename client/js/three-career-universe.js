/**
 * three-career-universe.js — High-Tech 3D Career Universe & Interactive Constellation
 *
 * Renders a breathtaking, luminous 3D tech constellation for the hero section:
 * - 1,000 sparkling stardust particles creating a living cosmic backdrop
 * - Central glowing quantum core with dual pulsing orbital rings
 * - 5 luminous career nodes with radiant emissive glow & rotating halos:
 *     1. Front-End Developer (Electric Cyan / #00F2FE)
 *     2. Full-Stack Developer (Vibrant Indigo / #6366F1)
 *     3. Data Analyst (Radiant Emerald / #10B981)
 *     4. UI/UX Designer (Luminous Amber / #F59E0B)
 *     5. Cybersecurity Analyst (Hot Rose / #F43F5E)
 * - Shimmering laser route lines connecting nodes to the center
 * - Interactive raycasting: hover displays a glassmorphic glowing HUD tooltip
 * - Click interaction: smoothly guides student to assessment.html?career=<slug>
 * - Performance: clamped pixel ratio, smooth lerp damping, WebGL fallback
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

  function initCareerUniverse(containerId) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;

    const fallbackEl = document.getElementById(`${containerId}-fallback`) || document.getElementById('webgl-fallback');

    if (!isWebGLAvailable() || typeof THREE === 'undefined') {
      if (fallbackEl) fallbackEl.classList.remove('d-none');
      return;
    }

    // Clean up any existing instance
    if (activeRenderer) {
      if (activeAnimationId) cancelAnimationFrame(activeAnimationId);
      if (activeRenderer.domElement && activeRenderer.domElement.parentNode) {
        activeRenderer.domElement.parentNode.removeChild(activeRenderer.domElement);
      }
      activeRenderer.dispose();
      activeRenderer = null;
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 460;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 22);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0); // Pure transparent
    renderer.domElement.style.pointerEvents = 'auto';
    container.appendChild(renderer.domElement);
    activeRenderer = renderer;

    // Tooltip overlay element
    let tooltip = container.querySelector('.universe-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'universe-tooltip';
      container.appendChild(tooltip);
    }
    tooltip.style.boxSizing = 'border-box';
    tooltip.style.wordBreak = 'break-word';

    // Compass / HUD Overlay Badges in DOM
    let compassOverlay = container.querySelector('.atlas-compass-overlay');
    if (!compassOverlay) {
      compassOverlay = document.createElement('div');
      compassOverlay.className = 'atlas-compass-overlay';
      compassOverlay.innerHTML = `
        <span class="atlas-coord-tag"><span class="pulse-dot"></span> LIVE 3D TELEMETRY</span>
        <span class="atlas-coord-tag">5 VERIFIED PATHS</span>
      `;
      container.appendChild(compassOverlay);
    }

    let hintOverlay = container.querySelector('.atlas-controls-hint');
    if (!hintOverlay) {
      hintOverlay = document.createElement('div');
      hintOverlay.className = 'atlas-controls-hint';
      hintOverlay.innerHTML = '✨ Hover node to inspect · Click to explore';
      container.appendChild(hintOverlay);
    }
    hintOverlay.style.left = '50%';
    hintOverlay.style.right = 'auto';
    hintOverlay.style.transform = 'translateX(-50%)';
    hintOverlay.style.whiteSpace = 'nowrap';

    // ------------------------------------------------------------------------
    // Lighting
    // ------------------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00F2FE, 2.5, 60);
    pointLight.position.set(0, 0, 8);
    scene.add(pointLight);

    const secondaryLight = new THREE.PointLight(0x8B5CF6, 2, 50);
    secondaryLight.position.set(10, -8, 5);
    scene.add(secondaryLight);

    const universeGroup = new THREE.Group();
    scene.add(universeGroup);

    // ------------------------------------------------------------------------
    // 1. Sparkling Particle Stardust Field
    // ------------------------------------------------------------------------
    const particleCount = 800;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const pColorChoices = [
      new THREE.Color(0x00F2FE), // Cyan
      new THREE.Color(0x8B5CF6), // Purple
      new THREE.Color(0x3B82F6), // Blue
      new THREE.Color(0x10B981), // Emerald
      new THREE.Color(0xFFFFFF), // White
    ];

    for (let i = 0; i < particleCount; i++) {
      const radius = 8 + Math.random() * 22;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      particlePos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePos[i * 3 + 2] = radius * Math.cos(phi) * 0.4; // Slightly flattened disk

      const col = pColorChoices[Math.floor(Math.random() * pColorChoices.length)];
      particleColors[i * 3] = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    universeGroup.add(particles);

    // ------------------------------------------------------------------------
    // 2. Central Radiant Quantum Core
    // ------------------------------------------------------------------------
    const centerGroup = new THREE.Group();

    // Central Glowing Crystal Core
    const centerGeo = new THREE.IcosahedronGeometry(1.5, 1);
    const centerMat = new THREE.MeshStandardMaterial({
      color: 0x00F2FE,
      emissive: 0x00F2FE,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.8,
      wireframe: false,
    });
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    centerGroup.add(centerMesh);

    // Wireframe Outer Cage
    const cageGeo = new THREE.IcosahedronGeometry(1.85, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0x8B5CF6,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    centerGroup.add(cageMesh);

    // Orbit Ring 1
    const ring1Geo = new THREE.TorusGeometry(2.5, 0.04, 16, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x00F2FE,
      transparent: true,
      opacity: 0.65,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    centerGroup.add(ring1);

    // Orbit Ring 2
    const ring2Geo = new THREE.TorusGeometry(3.1, 0.03, 16, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x8B5CF6,
      transparent: true,
      opacity: 0.5,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    centerGroup.add(ring2);

    universeGroup.add(centerGroup);

    // ------------------------------------------------------------------------
    // 3. The 5 Core Career Constellation Nodes
    // ------------------------------------------------------------------------
    const careers = [
      {
        slug: 'front-end-developer',
        name: 'Front-End Developer',
        desc: 'Master React, modern JavaScript, UI architecture, and high-performance web applications.',
        color: 0x00F2FE, // Electric Cyan
        colorHex: '#00F2FE',
        icon: 'bi-code-slash',
        code: 'ROLE 01',
        pos: [-7.8, 3.8, 1.2],
      },
      {
        slug: 'full-stack-developer',
        name: 'Full-Stack Developer',
        desc: 'Engineer scalable backends with Node.js, Express, MongoDB and modern component frontends.',
        color: 0x818CF8, // Indigo / Violet
        colorHex: '#818CF8',
        icon: 'bi-layers-half',
        code: 'ROLE 02',
        pos: [7.5, 4.2, -0.5],
      },
      {
        slug: 'data-analyst',
        name: 'Data Analyst',
        desc: 'Extract commercial intelligence with Python, SQL, statistical modeling and BI dashboards.',
        color: 0x10B981, // Emerald Green
        colorHex: '#10B981',
        icon: 'bi-graph-up-arrow',
        code: 'ROLE 03',
        pos: [1.2, -5.8, 1.8],
      },
      {
        slug: 'ui-ux-designer',
        name: 'UI/UX Designer',
        desc: 'Craft intuitive user experiences, Figma design systems, wireframes and interactive prototypes.',
        color: 0xF59E0B, // Luminous Amber
        colorHex: '#F59E0B',
        icon: 'bi-palette2',
        code: 'ROLE 04',
        pos: [-6.8, -4.2, -1.2],
      },
      {
        slug: 'cybersecurity-analyst',
        name: 'Cybersecurity Analyst',
        desc: 'Defend systems with threat analysis, network security, ethical testing, and cryptography.',
        color: 0xF43F5E, // Radiant Rose
        colorHex: '#F43F5E',
        icon: 'bi-shield-check',
        code: 'ROLE 05',
        pos: [7.8, -3.2, 0.8],
      },
    ];

    const interactiveMeshes = [];
    const haloRings = [];

    careers.forEach((c) => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(c.pos[0], c.pos[1], c.pos[2]);

      // Glowing Sphere Core
      const sphereGeo = new THREE.SphereGeometry(1.15, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: c.color,
        emissive: c.color,
        emissiveIntensity: 0.75,
        roughness: 0.2,
        metalness: 0.6,
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.userData = c;
      nodeGroup.add(sphereMesh);
      interactiveMeshes.push(sphereMesh);

      // Rotating Luminous Halo Ring
      const haloGeo = new THREE.TorusGeometry(1.65, 0.035, 16, 48);
      const haloMat = new THREE.MeshBasicMaterial({
        color: c.color,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.rotation.x = Math.PI / 2.5;
      nodeGroup.add(haloMesh);
      haloRings.push(haloMesh);

      // Outer Pulsing Glow Shell
      const glowGeo = new THREE.SphereGeometry(1.35, 24, 24);
      const glowMat = new THREE.MeshBasicMaterial({
        color: c.color,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      nodeGroup.add(glowMesh);

      universeGroup.add(nodeGroup);

      // Luminous Connecting Laser Line to Center
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(c.pos[0], c.pos[1], c.pos[2]),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: c.color,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      universeGroup.add(line);
    });

    // ------------------------------------------------------------------------
    // Inter-Career Constellation Lines (Connecting outer nodes)
    // ------------------------------------------------------------------------
    for (let i = 0; i < careers.length; i++) {
      const nextIdx = (i + 1) % careers.length;
      const c1 = careers[i];
      const c2 = careers[nextIdx];
      const interLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(c1.pos[0], c1.pos[1], c1.pos[2]),
        new THREE.Vector3(c2.pos[0], c2.pos[1], c2.pos[2]),
      ]);
      const interLineMat = new THREE.LineBasicMaterial({
        color: 0x38BDF8,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
      });
      const interLine = new THREE.Line(interLineGeo, interLineMat);
      universeGroup.add(interLine);
    }

    // ------------------------------------------------------------------------
    // Raycasting & Tooltips
    // ------------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-9999, -9999);
    let hoveredMesh = null;

    let targetTiltX = 0;
    let targetTiltY = 0;
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
      const tipHeight = tipRect.height || tooltip.offsetHeight || 160;

      // Smart flip: If cursor is on the right half of the canvas (>= 45%),
      // OR if placing on the right would exceed right boundary, flip to the left!
      let left;
      if (x > rect.width * 0.45 || (x + 16 + tipWidth > rect.width - pad)) {
        left = x - tipWidth - 16;
      } else {
        left = x + 16;
      }

      // Hard clamp inside container boundaries
      if (left < pad) {
        left = pad;
      }
      if (left + tipWidth > rect.width - pad) {
        left = Math.max(pad, rect.width - tipWidth - pad);
      }

      // Vertical positioning: align slightly above cursor, push up if overflowing bottom
      let top = y - 18;
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

    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      lastClientX = e.clientX;
      lastClientY = e.clientY;

      mouse.x = (x / rect.width) * 2 - 1;
      mouse.y = -(y / rect.height) * 2 + 1;

      // Parallax tilt
      targetTiltX = (y / rect.height - 0.5) * 0.45;
      targetTiltY = (x / rect.width - 0.5) * 0.45;

      updateTooltipPosition(e.clientX, e.clientY);
    };

    container.addEventListener('mousemove', onMouseMove);

    const onMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
      targetTiltX = 0;
      targetTiltY = 0;
      lastClientX = null;
      lastClientY = null;
      if (tooltip) tooltip.classList.remove('visible');
      if (hoveredMesh) {
        hoveredMesh.scale.set(1, 1, 1);
        hoveredMesh = null;
      }
    };
    container.addEventListener('mouseleave', onMouseLeave);

    // Click navigation
    const onClick = () => {
      if (hoveredMesh && hoveredMesh.userData) {
        const slug = hoveredMesh.userData.slug;
        if (slug) {
          window.location.href = `assessment.html?career=${slug}`;
        }
      }
    };
    container.addEventListener('click', onClick);

    // Resize Handler
    const onResize = () => {
      if (!container || !activeRenderer) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      activeRenderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ------------------------------------------------------------------------
    // Animation Loop
    // ------------------------------------------------------------------------
    let clock = new THREE.Clock();

    const animate = () => {
      activeAnimationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Rotate stardust particles slowly
      particles.rotation.y = elapsed * 0.035;
      particles.rotation.x = elapsed * 0.015;

      // Rotate central quantum core
      centerMesh.rotation.y = elapsed * 0.4;
      centerMesh.rotation.x = elapsed * 0.25;
      cageMesh.rotation.y = -elapsed * 0.3;
      cageMesh.rotation.z = elapsed * 0.2;
      ring1.rotation.z = elapsed * 0.5;
      ring2.rotation.x = elapsed * 0.4;

      // Rotate individual node halos
      haloRings.forEach((halo, idx) => {
        halo.rotation.z = elapsed * (0.6 + idx * 0.1);
      });

      // Smooth mouse tilt parallax
      universeGroup.rotation.x += (targetTiltX - universeGroup.rotation.x) * 0.06;
      universeGroup.rotation.y += (targetTiltY - universeGroup.rotation.y) * 0.06;

      // Raycasting
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hoveredMesh !== hit) {
          if (hoveredMesh) hoveredMesh.scale.set(1, 1, 1);
          hoveredMesh = hit;
          hoveredMesh.scale.set(1.3, 1.3, 1.3);

          const c = hit.userData;
          tooltip.innerHTML = `
            <div class="tooltip-header" style="border-left: 3px solid ${c.colorHex};">
              <span class="tooltip-code">${c.code}</span>
              <h4 class="tooltip-title">${c.name}</h4>
            </div>
            <p class="tooltip-body">${c.desc}</p>
            <div class="tooltip-cta">Click to explore path →</div>
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

  window.initCareerUniverse = initCareerUniverse;
})();
