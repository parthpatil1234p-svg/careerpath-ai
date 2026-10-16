/**
 * local-industry-radar.js - Local Maharashtra & Khandesh Industrial Proximity Radar
 * Displays verified regional employers (Jain Irrigation, Supreme, Bajaj, Bosch, etc.)
 * with distance in KM, open roles, and direct skill alignment.
 */

(function () {
  'use strict';

  // Distance offsets relative to different reference cities (in KM)
  const CITY_OFFSETS = {
    'Jalgaon': 0,
    'Bhusawal': 28,
    'Chhatrapati Sambhajinagar': 155,
    'Nashik': 235,
    'Pune': 340
  };

  let activeCity = localStorage.getItem('cp_regional_city') || 'Jalgaon';
  let cachedCompanies = [];

  async function fetchRegionalCompanies(city) {
    try {
      const apiUrl = (window.API_BASE_URL || (window.location.origin.includes('5500') ? 'http://localhost:5000' : 'https://careerpath-ai-bdbt.onrender.com')) + '/api/careers/regional/companies?city=' + encodeURIComponent(city || '');
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to load regional companies');
      const data = await res.json();
      return (data.data && data.data.companies) ? data.data.companies : [];
    } catch (err) {
      console.warn('[LocalIndustryRadar] Fetch error, using local fallback:', err);
      return getFallbackCompanies();
    }
  }

  function getFallbackCompanies() {
    return [
      {
        id: 'jain-irrigation',
        name: 'Jain Irrigation Systems Ltd',
        cluster: 'Jalgaon Agri-Tech & Irrigation Hub',
        city: 'Jalgaon',
        distanceKm: 8,
        industry: 'Micro-Irrigation, Solar Pumping & Agri-Biotech',
        website: 'https://www.jains.com',
        openingsCount: 14,
        topRoles: ['IoT Sensor Telemetry Engineer', 'Automation Engineer (PLC)', 'Agronomy Tech Specialist'],
        requiredSkills: ['IoT Sensor Telemetry', 'Micro-irrigation Automation', 'Embedded C / Arduino', 'Python'],
        verifiedPartner: true,
        hiringFresher: true
      },
      {
        id: 'supreme-industries-jalgaon',
        name: 'Supreme Industries Ltd',
        cluster: 'Jalgaon Gadegaon Industrial Belt',
        city: 'Jalgaon',
        distanceKm: 12,
        industry: 'Plastic Piping & Industrial Extrusion Automation',
        website: 'https://www.supreme.co.in',
        openingsCount: 9,
        topRoles: ['PLC / SCADA Maintenance Engineer', 'Production Quality Inspector'],
        requiredSkills: ['PLC Programming (Siemens/Allen-Bradley)', 'SCADA / HMI Screen Design'],
        verifiedPartner: true,
        hiringFresher: true
      },
      {
        id: 'central-railway-bhusawal',
        name: 'Central Railway Electric Locomotive Workshop',
        cluster: 'Bhusawal Railway Heavy Engineering Hub',
        city: 'Bhusawal',
        distanceKm: 28,
        industry: 'Heavy Traction Motors & Railway Signaling',
        website: 'https://cr.indianrailways.gov.in',
        openingsCount: 16,
        topRoles: ['Locomotive Electronics Trainee', 'Signaling Automation Apprentice'],
        requiredSkills: ['Industrial Sensor & Relay Circuits', 'PLC Programming (Siemens/Allen-Bradley)'],
        verifiedPartner: true,
        hiringFresher: true
      },
      {
        id: 'bajaj-auto-waluj',
        name: 'Bajaj Auto Ltd',
        cluster: 'Waluj MIDC Automotive Hub',
        city: 'Chhatrapati Sambhajinagar',
        distanceKm: 155,
        industry: 'Automotive Robotics & Manufacturing',
        website: 'https://www.bajajauto.com',
        openingsCount: 22,
        topRoles: ['Robotic Welding Cell Programmer', 'Body Assembly Automation Engineer'],
        requiredSkills: ['PLC Programming (Siemens/Allen-Bradley)', 'Predictive Maintenance'],
        verifiedPartner: true,
        hiringFresher: true
      },
      {
        id: 'bosch-nashik',
        name: 'Bosch India Ltd',
        cluster: 'Ambad MIDC Precision Systems Hub',
        city: 'Nashik',
        distanceKm: 238,
        industry: 'Common Rail Injectors & Industry 4.0 Telemetry',
        website: 'https://www.bosch.in',
        openingsCount: 20,
        topRoles: ['Micro-machining Automation Engineer', 'Embedded ECU Firmware Testing Trainee'],
        requiredSkills: ['Embedded C / Arduino', 'Python for Industrial Analytics'],
        verifiedPartner: true,
        hiringFresher: true
      }
    ];
  }

  function renderRadarComponent(container, companies, selectedCity) {
    if (!container) return;

    const html = `
      <div class="local-industry-radar card border border-secondary border-opacity-25 bg-dark bg-opacity-75 shadow-lg rounded-4 p-4 mt-4">
        <!-- Header -->
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
          <div class="d-flex align-items-center gap-3">
            <div class="p-2.5 rounded-3 bg-success bg-opacity-20 text-success border border-success border-opacity-30">
              <i class="bi bi-geo-alt-fill fs-4"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2">
                <h5 class="text-white fw-bold mb-0">Maharashtra Industrial Proximity Radar</h5>
                <span class="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-30 font-mono small">Khandesh & MIDC</span>
              </div>
              <p class="text-muted small mb-0 mt-0.5">Explore 30+ verified employers in Jalgaon, Bhusawal, Aurangabad & Nashik hiring local engineering talent.</p>
            </div>
          </div>

          <!-- Reference City Selector -->
          <div class="d-flex align-items-center gap-2">
            <span class="text-white-50 small fw-medium"><i class="bi bi-crosshair me-1 text-info"></i>Campus Center:</span>
            <select class="form-select form-select-sm bg-dark text-white border-secondary border-opacity-50 font-mono" id="radarCitySelector" style="width: auto;">
              <option value="Jalgaon" ${selectedCity === 'Jalgaon' ? 'selected' : ''}>📍 Jalgaon (GHRCEM / KBCNMU)</option>
              <option value="Bhusawal" ${selectedCity === 'Bhusawal' ? 'selected' : ''}>📍 Bhusawal (28 km)</option>
              <option value="Chhatrapati Sambhajinagar" ${selectedCity === 'Chhatrapati Sambhajinagar' ? 'selected' : ''}>📍 Chhatrapati Sambhajinagar (155 km)</option>
              <option value="Nashik" ${selectedCity === 'Nashik' ? 'selected' : ''}>📍 Nashik MIDC (235 km)</option>
              <option value="Pune" ${selectedCity === 'Pune' ? 'selected' : ''}>📍 Pune Tech Corridor (340 km)</option>
            </select>
          </div>
        </div>

        <!-- Metric highlights -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-md-3">
            <div class="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-20 text-center">
              <div class="fs-4 fw-bold text-white font-mono">${companies.length}</div>
              <div class="text-muted small">Verified Regional Hubs</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-20 text-center">
              <div class="fs-4 fw-bold text-success font-mono">${companies.reduce((acc, c) => acc + (c.openingsCount || 0), 0)}+</div>
              <div class="text-muted small">Active Fresher Openings</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-20 text-center">
              <div class="fs-4 fw-bold text-warning font-mono">8 km</div>
              <div class="text-muted small">Nearest Industry Proximity</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-20 text-center">
              <div class="fs-4 fw-bold text-info font-mono">100%</div>
              <div class="text-muted small">Campus Drive Alignment</div>
            </div>
          </div>
        </div>

        <!-- Companies Grid -->
        <div class="row g-3" id="radarCompaniesGrid">
          ${companies.map(c => `
            <div class="col-md-6 col-lg-4">
              <div class="card h-100 bg-dark bg-opacity-40 border border-secondary border-opacity-25 rounded-3 p-3.5 hover-border-primary transition-all">
                <div class="d-flex align-items-start justify-content-between gap-2 mb-2">
                  <h6 class="text-white fw-bold mb-0 text-truncate" title="${c.name}">${c.name}</h6>
                  <span class="badge ${c.distanceKm <= 15 ? 'bg-success' : c.distanceKm <= 50 ? 'bg-primary' : 'bg-secondary'} bg-opacity-25 ${c.distanceKm <= 15 ? 'text-success' : c.distanceKm <= 50 ? 'text-info' : 'text-white-50'} border border-current border-opacity-30 font-mono small text-nowrap">
                    <i class="bi bi-geo me-1"></i>${c.distanceKm} km
                  </span>
                </div>

                <div class="text-info small fw-medium mb-2">${c.cluster || c.city}</div>
                <p class="text-muted small mb-3" style="font-size: 0.8rem; line-height: 1.4;">${c.industry}</p>

                <div class="mb-3">
                  <div class="text-white-50 small mb-1.5 fw-semibold" style="font-size: 0.72rem; text-transform: uppercase;">Top Roles in Demand:</div>
                  <div class="d-flex flex-wrap gap-1">
                    ${(c.topRoles || []).slice(0, 2).map(r => `
                      <span class="badge bg-secondary bg-opacity-25 text-white-50 font-mono" style="font-size: 0.7rem;">${r}</span>
                    `).join('')}
                  </div>
                </div>

                <div class="mt-auto pt-2.5 border-top border-secondary border-opacity-20 d-flex align-items-center justify-content-between">
                  <span class="text-success small fw-medium">
                    <i class="bi bi-briefcase me-1"></i>${c.openingsCount || 5} Openings
                  </span>
                  <a href="${c.website}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-info btn-xs px-2.5 py-1 text-decoration-none rounded-2 font-mono">
                    Explore Hub <i class="bi bi-arrow-up-right ms-0.5"></i>
                  </a>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach selector event
    const sel = container.querySelector('#radarCitySelector');
    if (sel) {
      sel.addEventListener('change', async (e) => {
        const newCity = e.target.value;
        localStorage.setItem('cp_regional_city', newCity);
        const updated = await fetchRegionalCompanies(newCity);
        renderRadarComponent(container, updated, newCity);
      });
    }
  }

  // Export globally
  window.initLocalIndustryRadar = async function (targetId, defaultCity) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const city = defaultCity || activeCity;
    const companies = await fetchRegionalCompanies(city);
    renderRadarComponent(el, companies, city);
  };

  // Auto-init if element exists on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    const autoContainer = document.getElementById('localIndustryRadarContainer');
    if (autoContainer) {
      window.initLocalIndustryRadar('localIndustryRadarContainer');
    }
  });
})();
