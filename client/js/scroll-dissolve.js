/**
 * scroll-dissolve.js — Interactive WebGL Shader Transformation
 * Vengeance UI Scroll Dissolve Reveal Component Engine
 * CareerPath AI · Team 404 Brain Not Found
 */

(function () {
  'use strict';

  // GLSL Vertex Shader
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // GLSL Fragment Shader: Layer 1 (Front - Dissolving with Cyan-Violet Neon Glow)
  const fragmentShaderFront = `
    uniform sampler2D uTexture;
    uniform vec2 uResolution;
    uniform vec2 uImageResolution;
    uniform float uDissolve;
    uniform vec2 uCenter;
    uniform float uTime;
    uniform float uGrayscale;
    uniform float uEdgeIntensity;
    uniform float uEdgeBrightness;
    varying vec2 vUv;

    mat3 sobelX = mat3(
      -1.0, 0.0, 1.0,
      -2.0, 0.0, 2.0,
      -1.0, 0.0, 1.0
    );

    mat3 sobelY = mat3(
      -1.0, -2.0, -1.0,
       0.0,  0.0,  0.0,
       1.0,  2.0,  1.0
    );

    float getLuminance(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
    }

    float sobel(sampler2D tex, vec2 uv, vec2 texelSize) {
      float gx = 0.0;
      float gy = 0.0;
      for (int i = -1; i <= 1; i++) {
        for (int j = -1; j <= 1; j++) {
          vec2 offset = vec2(float(i), float(j)) * texelSize;
          float lum = getLuminance(texture2D(tex, uv + offset).rgb);
          gx += lum * sobelX[i + 1][j + 1];
          gy += lum * sobelY[i + 1][j + 1];
        }
      }
      return sqrt(gx * gx + gy * gy);
    }

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return value;
    }

    void main() {
      vec2 ratio = vec2(
        min((uResolution.x / uResolution.y) / (uImageResolution.x / uImageResolution.y), 1.0),
        min((uResolution.y / uResolution.x) / (uImageResolution.y / uImageResolution.x), 1.0)
      );

      vec2 uv = vec2(
        vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
        vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
      );

      vec4 texColor = texture2D(uTexture, uv);

      vec2 centeredUv = vUv - uCenter;
      float aspect = uResolution.x / uResolution.y;
      centeredUv.x *= aspect;
      float dist = length(centeredUv);
      float angle = atan(centeredUv.y, centeredUv.x);

      float noiseScale = 6.0;
      vec2 pixelatedUv = floor(vUv * uResolution / noiseScale) * noiseScale / uResolution;
      float blockNoise = fbm(pixelatedUv * 100.0) * 0.15;
      float angularNoise = fbm(vec2(angle * 5.0, 0.0)) * 0.15;
      float totalNoise = blockNoise + angularNoise;
      float noisyDist = dist + totalNoise;

      float maxDist = length(vec2(aspect * 0.5, 0.5));
      float normalizedDist = noisyDist / maxDist;
      float dissolveThreshold = uDissolve * 1.5;

      vec2 texelSize = 1.0 / uResolution;
      float edge = sobel(uTexture, uv, texelSize);
      edge = pow(edge, 0.7) * 2.0;
      edge = clamp(edge, 0.0, 1.0);

      float dissolveMask = smoothstep(dissolveThreshold - 0.03, dissolveThreshold, normalizedDist);

      // CareerPath AI EduTech Indigo-to-Cyan Edge Glow (#4F46E5 to #06B6D4)
      vec3 edgeColor = mix(vec3(0.31, 0.27, 0.90), vec3(0.02, 0.71, 0.83), vUv.x);
      vec3 finalColor = texColor.rgb;

      float edgeGlowIntensity = uEdgeIntensity * 1.5;
      float edgeGlow = edge * edgeGlowIntensity;
      finalColor += edgeColor * edgeGlow * uEdgeBrightness;

      float edgeZoneWidth = 0.14 * (1.0 - uDissolve) + 0.02;
      float edgeZone = smoothstep(dissolveThreshold - edgeZoneWidth, dissolveThreshold - edgeZoneWidth + 0.04, normalizedDist) *
                       smoothstep(dissolveThreshold + 0.02, dissolveThreshold - 0.02, normalizedDist);
      float sparkle = hash(floor(vUv * uResolution / 4.0)) * edgeZone;
      float edgeBrightness = (1.0 - uDissolve) * uEdgeBrightness;
      finalColor += edgeColor * (sparkle * 1.8 * edgeBrightness);

      float alpha = dissolveMask * texColor.a;
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  // GLSL Fragment Shader: Layer 2 (Back - Revealed State)
  const fragmentShaderBack = `
    uniform sampler2D uTexture;
    uniform vec2 uResolution;
    uniform vec2 uImageResolution;
    varying vec2 vUv;

    void main() {
      vec2 ratio = vec2(
        min((uResolution.x / uResolution.y) / (uImageResolution.x / uImageResolution.y), 1.0),
        min((uResolution.y / uResolution.x) / (uImageResolution.y / uImageResolution.x), 1.0)
      );

      vec2 uv = vec2(
        vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
        vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
      );

      vec4 texColor = texture2D(uTexture, uv);
      gl_FragColor = texColor;
    }
  `;

  let renderer, scene, camera, material1, material2;
  let targetProgress = 0.0;
  let currentProgress = 0.0;
  let isUserInteracting = false;
  let clock;

  function initDissolveShader() {
    const container = document.getElementById('scrollDissolveContainer');
    const canvas = document.getElementById('scrollDissolveCanvas');
    if (!container || !canvas || typeof THREE === 'undefined') return;

    clock = new THREE.Clock();

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 600;

    // 1. Renderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(width, height);
    } catch (e) {
      console.warn('WebGL initialization failed, using CSS fallback:', e);
      return;
    }

    // 2. Scene & Camera
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    // 3. Texture Loader
    const textureLoader = new THREE.TextureLoader();
    const imgFrontUrl = 'assets/state-before-skills.svg';
    const imgBackUrl = 'assets/state-after-roadmap.svg';

    let tex1Loaded = false;
    let tex2Loaded = false;

    const tex1 = textureLoader.load(imgFrontUrl, () => {
      tex1Loaded = true;
      if (tex1Loaded && tex2Loaded) setupMeshes(tex1, tex2, width, height);
    });

    const tex2 = textureLoader.load(imgBackUrl, () => {
      tex2Loaded = true;
      if (tex1Loaded && tex2Loaded) setupMeshes(tex1, tex2, width, height);
    });

    bindControls(container);
  }

  function setupMeshes(texture1, texture2, width, height) {
    const uniforms1 = {
      uTexture: { value: texture1 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uImageResolution: { value: new THREE.Vector2(1200, 800) },
      uDissolve: { value: 0.0 },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0.0 },
      uGrayscale: { value: 0.0 },
      uEdgeIntensity: { value: 0.0 },
      uEdgeBrightness: { value: 1.0 },
    };

    const uniforms2 = {
      uTexture: { value: texture2 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uImageResolution: { value: new THREE.Vector2(1200, 800) },
    };

    material1 = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShaderFront,
      uniforms: uniforms1,
      transparent: true,
    });

    material2 = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShaderBack,
      uniforms: uniforms2,
      transparent: true,
    });

    const geom = new THREE.PlaneGeometry(2, 2);
    const meshBack = new THREE.Mesh(geom, material2);
    meshBack.position.z = -0.1;
    scene.add(meshBack);

    const meshFront = new THREE.Mesh(geom, material1);
    meshFront.position.z = 0;
    scene.add(meshFront);

    // Hide fallback layer once WebGL is active
    const fallbackLayers = document.querySelectorAll('.dissolve-fallback-layer');
    fallbackLayers.forEach(l => l.style.display = 'none');

    // Start render loop
    requestAnimationFrame(renderLoop);
  }

  function renderLoop() {
    requestAnimationFrame(renderLoop);

    // Smooth lerp progress
    currentProgress += (targetProgress - currentProgress) * 0.12;
    if (Math.abs(targetProgress - currentProgress) < 0.001) {
      currentProgress = targetProgress;
    }

    const elapsed = clock ? clock.getElapsedTime() : 0;

    if (material1) {
      material1.uniforms.uTime.value = elapsed;
      material1.uniforms.uDissolve.value = currentProgress;
      material1.uniforms.uGrayscale.value = Math.min(1.0, currentProgress / 0.4);
      material1.uniforms.uEdgeIntensity.value = currentProgress * 0.6;
      material1.uniforms.uEdgeBrightness.value = 1.0 - currentProgress;
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function bindControls(container) {
    const slider = document.getElementById('dissolveScrubber');
    const btnBefore = document.getElementById('btnDissolveBefore');
    const btnAfter = document.getElementById('btnDissolveAfter');

    // Scrubber slider input
    if (slider) {
      slider.addEventListener('input', (e) => {
        isUserInteracting = true;
        targetProgress = parseFloat(e.target.value) / 100;
        updateButtonsUI();
      });
    }

    // Quick toggle buttons
    if (btnBefore) {
      btnBefore.addEventListener('click', () => {
        isUserInteracting = true;
        targetProgress = 0.0;
        if (slider) slider.value = 0;
        updateButtonsUI();
      });
    }

    if (btnAfter) {
      btnAfter.addEventListener('click', () => {
        isUserInteracting = true;
        targetProgress = 1.0;
        if (slider) slider.value = 100;
        updateButtonsUI();
      });
    }

    function updateButtonsUI() {
      if (!btnBefore || !btnAfter) return;
      if (targetProgress < 0.5) {
        btnBefore.classList.add('active');
        btnAfter.classList.remove('active');
      } else {
        btnAfter.classList.add('active');
        btnBefore.classList.remove('active');
      }

      // Sync CSS fallback crossfade if active
      const fallbackFront = document.querySelector('.dissolve-fallback-layer.front');
      if (fallbackFront && fallbackFront.style.display !== 'none') {
        fallbackFront.style.opacity = (1 - targetProgress).toString();
      }
    }

    // Scroll Telemetry: Auto-scrub as section scrolls through viewport
    function onScroll() {
      if (isUserInteracting) return; // let user keep manual control if they touched it

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // When section is centered in viewport, progress moves from 0 to 1
      const start = windowHeight * 0.85;
      const end = windowHeight * 0.15;
      const progress = (start - rect.top) / (start - end + rect.height * 0.5);
      const clamped = Math.max(0, Math.min(1, progress));

      targetProgress = clamped;
      if (slider) slider.value = Math.round(clamped * 100);
      updateButtonsUI();
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Window resize handler
    window.addEventListener('resize', () => {
      if (!renderer || !container) return;
      const w = container.clientWidth || 900;
      const h = container.clientHeight || 600;
      renderer.setSize(w, h);
      if (material1) material1.uniforms.uResolution.value.set(w, h);
      if (material2) material2.uniforms.uResolution.value.set(w, h);
    });
  }

  // Initialize on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDissolveShader);
  } else {
    initDissolveShader();
  }
})();
