# Plan #44: Pan-India Industrial Proximity Radar (Background Live Location & Zero-Map-Canvas Architecture)

> **Strategic Objective**: 
> Deliver an intelligent, real-time **Industrial Proximity Radar** that connects students directly to 60+ verified employers across India — featuring flagship depth in **Maharashtra (Khandesh & MIDC: Jalgaon, Bhusawal, Aurangabad, Nashik, Pune)** as well as major national hubs (**Bengaluru, NCR/Gurgaon/Noida, Hyderabad, Chennai, Gujarat**).
>
> **Core Architectural Rule**:
> - **Zero Clunky Display Map**: NO slow, heavy, screen-dominating map canvases (Leaflet / Google Maps iframes).
> - **Background Live Location**: Detect student coordinates (`lat`, `lng`) seamlessly in the background via `navigator.geolocation` (with IP / city fallback), dynamically calculating real-time Haversine distance (`📍 4.8 km from you`) to every verified employer and sorting them on a high-tech Radar HUD.

---

## 1. Goal Description & Problem Formulation

### Current Limitations
1. **Generic Job Scraping**: Standard job boards show remote listings or generic metro postings in Bengaluru and USA, ignoring tier-2/tier-3 local engineering talent (e.g. KBCNMU Jalgaon students, Pune diploma holders, Nashik freshers).
2. **Heavy Map Bloat in Competitor Apps**: When competitors attempt "location features", they embed massive 2MB Google/Leaflet map canvases with clunky pin icons that lag on mobile devices, consume battery, and distract from direct job applications.
3. **National vs. Regional Tension**: CareerPath AI must serve both:
   - Deep hyper-local focus: 30+ verified employers in Jalgaon, Bhusawal, Chhatrapati Sambhajinagar (Aurangabad), and Nashik MIDC.
   - Pan-India scalability: Seamless coverage for students across Karnataka, Telangana, NCR, Tamil Nadu, and Gujarat.

### What This Feature Accomplishes
1. **Background Live Geolocation**: Silently requests browser coordinates in the background (or lets student pick their home district).
2. **Real-Time Haversine Proximity Engine**: Computes exact kilometers between student's live location and company coordinates (`lat`, `lng`).
3. **High-Tech Radar HUD (No Map Canvas)**:
   - CSS-animated Radar Sweep Scanner indicating live connection and active GPS coordinates.
   - Quick distance filters: `< 15 km (Local Walk/Bike)`, `< 50 km (District Commute)`, `< 150 km (Intercity)`, `All India Industrial Clusters`.
   - Cluster dropdown to explore other industrial belts (e.g., "Khandesh & MIDC", "Pune Automotive Belt", "Bengaluru Tech Corridor", "NCR Manesar & Noida").
4. **Direct Campus & Walk-in Telemetry**:
   - Tags for `Verified Partner`, `Hiring Freshers`, `Internship Offered`, `Active Campus Drive`.
   - Required skills checklist matched against student's verified skill passport.
   - Direct recruiter application button or walk-in directions.

---

## 2. User Review Required

> [!IMPORTANT]
> **Zero Map Canvas & High Performance**:
> We will NOT render an interactive visual road map (no tiles, no zoom controls, no slow Mapbox/Google JS bundles). Instead, live background geolocation will compute exact proximity and display cards sorted by distance with a sleek, responsive Radar HUD.

> [!NOTE]
> **Privacy-Safe Geolocation with Zero-Error Fallback**:
> If a student denies browser location permission or is on an unsecured network, the system will never crash. It smoothly defaults to the nearest detected city via IP or defaults to **Jalgaon / Maharashtra (Khandesh & MIDC)** with an instant 1-click city switcher.

---

## 3. Pan-India Industrial Corridors & Employer Clusters

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                      PAN-INDIA INDUSTRIAL PROXIMITY RADAR HUBS                                  │
├──────────────────────────┬─────────────────────────────┬────────────────────────────────────────┤
│ 1. MAHARASHTRA KHANDESH  │ 2. MARATHWADA & NASHIK      │ 3. PUNE & MUMBAI CORRIDOR              │
│ • Jalgaon Agri-Tech      │ • Chhatrapati Sambhajinagar │ • Chakan & Bhosari Auto Hub            │
│ • Bhusawal Power & Rail  │   (Shendra & Waluj MIDC)    │ • Hinjewadi & Kharadi IT SEZ           │
│ • Gadegaon Industrial    │ • Ambad & Satpur MIDC       │ • Navi Mumbai & Thane FinTech          │
├──────────────────────────┼─────────────────────────────┼────────────────────────────────────────┤
│ 4. BENGALURU & SOUTH     │ 5. NCR & NORTH INDUSTRIAL   │ 6. GUJARAT AUTO & CHEMICAL             │
│ • Electronic City & OMR  │ • Gurgaon Cyber City        │ • Sanand Auto Corridor (Ahmedabad)     │
│ • Peenya Industrial Area │ • Manesar Automotive SEZ    │ • Vadodara Heavy Engineering           │
│ • Hyderabad HITEC City   │ • Noida Electronics Belt    │ • Surat Textile & Diamond Tech         │
└──────────────────────────┴─────────────────────────────┴────────────────────────────────────────┘
```

---

## 4. Proposed Changes

### Component 1: Data & Coordinate Layer

#### [MODIFY] `careerpath-ai/server/data/regionalCompaniesData.js`
1. Enrich all existing 30+ Maharashtra companies with exact GPS coordinates:
   - Jalgaon companies: `latitude: 21.0077`, `longitude: 75.5626`
   - Bhusawal companies: `latitude: 21.0454`, `longitude: 75.7885`
   - Aurangabad / Sambhajinagar: `latitude: 19.8762`, `longitude: 75.3433`
   - Nashik MIDC: `latitude: 19.9975`, `longitude: 73.7898`
   - Pune Chakan / Bhosari: `latitude: 18.5204`, `longitude: 73.8567`
2. Add 25+ verified pan-India employers across key national corridors:
   - **Bengaluru**: Infosys (Electronic City), Wipro (Sarjapur), Titan Engineering (Peenya), Bosch India (Adugodi), Ather Energy (Whitefield).
   - **NCR (Gurgaon/Noida/Manesar)**: Maruti Suzuki (Manesar), Samsung India Electronics (Noida Sec 81), Tata Consultancy Services (Gurgaon), Dixon Technologies (Noida).
   - **Hyderabad**: Dr. Reddy's Laboratories (Bachupally), Tech Mahindra (HITEC City), Bharat Biotech (Genome Valley), Cyient (Gachibowli).
   - **Gujarat (Ahmedabad/Sanand)**: Tata Motors Passenger Vehicles (Sanand), Zydus Lifesciences (Changodar), Larsen & Toubro Heavy Engineering (Hazira/Vadodara).
   - **Tamil Nadu (Chennai)**: Hyundai Motor India (Sriperumbudur), Ashok Leyland (Ennore), Zoho Corporation (Estancia SEZ, Guduvanchery).
3. Export an optimized Haversine distance calculator function:
   ```javascript
   function calculateHaversineKm(lat1, lon1, lat2, lon2) {
     const R = 6371; // Earth radius in km
     const dLat = (lat2 - lat1) * Math.PI / 180;
     const dLon = (lon2 - lon1) * Math.PI / 180;
     const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
               Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
               Math.sin(dLon/2) * Math.sin(dLon/2);
     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
     return Math.round(R * c * 10) / 10;
   }
   ```

---

### Component 2: Backend Controller & API Layer

#### [MODIFY] `careerpath-ai/server/controllers/careerController.js`
Upgrade `getRegionalCompanies` (`GET /api/careers/regional/companies`):
- Support query parameters:
  - `lat` & `lng`: Client's background live coordinates.
  - `maxDistanceKm`: Proximity filter (e.g. `15`, `50`, `150`).
  - `cluster`: Filter by specific corridor (e.g. `'khandesh'`, `'pune'`, `'bengaluru'`, `'ncr'`, `'all'`).
  - `state`: Filter by state (e.g. `'Maharashtra'`, `'Karnataka'`, `'NCR'`).
  - `verifiedOnly`: Boolean filter.
  - `hiringFresher`: Boolean filter.
- Dynamic Proximity Calculation:
  - If `lat` and `lng` are supplied, calculate dynamic `distanceKm` for every employer relative to the student.
  - Sort the array in ascending order of `distanceKm`.
  - Return metadata: `detectedCoordinates`, `nearestClusterName`, `totalInRadiusCount`.

---

### Component 3: Frontend Radar HUD & Job Board Tab

#### [MODIFY] `careerpath-ai/client/jobs.html`
1. Add **Tab 3** to `#jobsTab`:
   ```html
   <li class="nav-item" role="presentation">
     <button class="nav-link fw-semibold py-2 px-3.5 rounded-2 d-flex align-items-center gap-1.5" id="tabRadar" data-bs-toggle="pill" data-bs-target="#contentRadar" type="button" role="tab">
       <span class="pulse-dot-green"></span>
       <i class="bi bi-radar text-teal"></i> Industrial Proximity Radar
       <span class="badge bg-teal-subtle text-teal ms-1" id="badgeRadarCount">30+</span>
     </button>
   </li>
   ```
2. Add Tab 3 Content Pane (`#contentRadar`):
   - **Live Radar HUD Bar**:
     - Radar sweep graphic with real-time status: `📡 Live Proximity: Connected &bull; Lat 21.00°N, Lng 75.56°E (Jalgaon District, MH)`.
     - Location Refresh button (`[ 📍 Update GPS ]`).
     - Manual Corridor Switcher dropdown (`Khandesh & MIDC`, `Pune Auto Belt`, `Bengaluru Tech`, `NCR Hub`, etc.).
   - **Distance Quick-Filter Chips**:
     - `[ 🎯 Local (< 15 km) ]`
     - `[ 🚗 District Commute (< 50 km) ]`
     - `[ 🚆 Regional (< 150 km) ]`
     - `[ 🇮🇳 All India Corridors ]`
   - **Employer Radar Grid**:
     - Cards displaying exact distance badge: `📍 6.2 km away &bull; Gadegaon MIDC`.
     - Verified Partner seal, active fresher openings, and required skills tags.
     - Direct apply / walk-in recruitment contact details.

#### [MODIFY] `careerpath-ai/client/js/jobs.js`
1. Implement silent background geolocation:
   - On page load or tab activation, invoke `navigator.geolocation.getCurrentPosition()`.
   - On success: capture `lat`, `lng`, query `/api/careers/regional/companies?lat=...&lng=...`, and update HUD with user's live city and distance.
   - On permission prompt dismiss / denied: smoothly fallback to default flagship coordinates (Jalgaon / Maharashtra MIDC) with zero console errors.
2. Filter & card rendering logic:
   - Distance filtering (`< 15 km`, `< 50 km`, etc.).
   - Instant search input matching company name, industry, cluster, or skills.
   - Skill-match calculator comparing student's verified skills against employer requirements.

#### [MODIFY] `careerpath-ai/client/css/style.css`
1. Radar HUD styling:
   - Dark modern HUD panel with animated green/teal radar sweep pulse.
   - High-contrast distance pills (`bg-success-subtle` for `< 15 km`, `bg-primary-subtle` for `< 50 km`).
   - Clean employer cards with hover lift effect and mobile responsive grid.

---

### Component 4: Automated Verification Test

#### [NEW] `careerpath-ai/server/tests/proximity_radar_test.js`
1. Test Haversine distance formula with known benchmark coordinates (Jalgaon to Bhusawal = ~24 km; Jalgaon to Pune = ~345 km).
2. Test `getRegionalCompanies` endpoint with:
   - No coordinates (defaults to reference order).
   - Live coordinates for Jalgaon (`lat=21.0077, lng=75.5626`) -> assert nearest company is `< 10 km`.
   - Live coordinates for Bengaluru (`lat=12.9716, lng=77.5946`) -> assert Bengaluru companies rank at top.
   - Live coordinates for Gurgaon/NCR (`lat=28.4595, lng=77.0266`) -> assert NCR companies rank at top.
3. Test filter parameters (`maxDistanceKm`, `cluster`, `hiringFresher`).

---

## 5. Verification Plan

### Automated Tests
Run the test suite:
```powershell
node server/tests/proximity_radar_test.js
npm test
```
**Expected Outcome**: 100% of Haversine distance assertions pass within ±1 km tolerance, all national clusters return valid employers, zero syntax errors.

### Manual Verification
1. Start the server (`npm start`) and navigate to `http://localhost:5000/jobs.html`.
2. Click on the new **"📡 Industrial Proximity Radar"** tab.
3. Observe browser location request:
   - Allow location: HUD displays live coordinates and sorts companies by distance from current location.
   - Deny location: HUD smoothly falls back to Khandesh/MIDC with zero errors and lets user select any corridor from the dropdown.
4. Click `< 15 km`: only companies within 15 km remain visible.
5. Select "Bengaluru & South": companies from Electronic City & Peenya render immediately.
6. Check on mobile viewport: zero heavy map canvas, fast 60fps scrolling, clean touch targets.
