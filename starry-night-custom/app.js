// Starry Night Custom - Core Application Engine (3D Perspective Landscape Edition)

function tryCreateIcons() {
  try {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    } else {
      console.warn("Lucide library is undefined. Icons will not render.");
    }
  } catch (err) {
    console.error("Lucide rendering error:", err);
  }
}

// Global State
let state = {
  stars: [],
  constellations: [],
  constellationMap: {}, // Fast lookup for search
  
  // Observer Settings
  latitude: 37.56, // default Seoul
  longitude: 126.98,
  locationName: "GPS 관측지 (서울)",
  
  // Time Settings
  obsTime: new Date(),
  timeSpeed: 1, // multiplier (1 = realtime, 60 = 1m/s, 3600 = 1h/s, etc.)
  isPlaying: true,
  lastTimeUpdate: Date.now(),
  
  // 3D Perspective Camera Settings
  camAz: 180.0,    // Yaw: Camera heading in degrees (180 = facing South)
  camAlt: 15.0,    // Pitch: Camera altitude in degrees (15 = looking slightly up)
  fov: 90.0,       // Field of view in degrees (zoom level: lower = zoomed in, higher = wide angle)
  
  // Render Settings
  zoom: 1.0,       // Zoom multiplier (combined with FOV)
  panX: 0,
  panY: 0,
  constellationOpacity: 0.5,
  showLines: false,
  showIllustrations: false,
  showNames: false,
  showStarNames: false,
  
  // New Toggles
  showHorizon: true,
  showAtmosphere: true,
  showPlanets: false,
  showDSOs: false,
  calibrationMode: false,
  
  // Slewing Animation
  isSlewing: false,
  slewStartTime: 0,
  slewDuration: 1500, // 1.5 seconds
  slewStartAz: 0,
  slewStartAlt: 0,
  slewStartFov: 90,
  slewTargetAz: 0,
  slewTargetAlt: 0,
  slewTargetFov: 60,
  
  // Constellation Hover Highlighting
  hoveredConstellation: null,
  mouseScreenX: -1,
  mouseScreenY: -1,
  
  // Preloaded Images
  images: {},
  imagesLoaded: 0,
  totalImages: 0,
  
  // Selection / Hover
  selectedConstellation: null,
  selectedStar: null,
  
  // Interactive Controls
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  draggedDuringClick: false
};

// Children's Observatory (어린이천문대) Branches Coordinates (All 26 locations)
const observatories = {
  ilsan: { name: "어린이천문대 일산본사", lat: 37.69, lon: 126.81 },
  bundang: { name: "어린이천문대 분당지점", lat: 37.33, lon: 127.18 },
  songpa: { name: "어린이천문대 송파하남", lat: 37.53, lon: 127.23 },
  pangyo: { name: "어린이천문대 판교지점", lat: 37.42, lon: 127.08 },
  dongtan: { name: "어린이천문대 동탄지점", lat: 37.20, lon: 127.03 },
  bucheon: { name: "어린이천문대 부천지점", lat: 37.51, lon: 126.81 },
  gwanggyo: { name: "어린이천문대 광교지점", lat: 37.30, lon: 127.05 },
  ansan: { name: "어린이천문대 안산지점", lat: 37.32, lon: 126.86 },
  anyang: { name: "어린이천문대 안양지점", lat: 37.40, lon: 126.90 },
  uiwang: { name: "어린이천문대 의왕지점", lat: 37.35, lon: 126.98 },
  incheon: { name: "어린이천문대 인천지점", lat: 37.60, lon: 126.70 },
  paju: { name: "어린이천문대 파주지점", lat: 37.73, lon: 126.74 },
  sejong: { name: "어린이천문대 세종지점", lat: 36.49, lon: 127.22 },
  daejeon: { name: "어린이천문대 대전지점", lat: 36.36, lon: 127.31 },
  daegu: { name: "어린이천문대 대구지점", lat: 35.84, lon: 128.71 },
  ulsan: { name: "어린이천문대 울산지점", lat: 35.58, lon: 129.23 },
  gwangju: { name: "어린이천문대 광주지점", lat: 35.16, lon: 126.85 },
  guri: { name: "어린이천문대 구리지점", lat: 37.60, lon: 127.14 },
  dongseoul: { name: "어린이천문대 동서울지점", lat: 37.56, lon: 127.11 },
  seoseoul: { name: "어린이천문대 서서울지점", lat: 37.62, lon: 126.89 },
  suji: { name: "어린이천문대 수지지점", lat: 37.35, lon: 127.08 },
  cheonan: { name: "어린이천문대 천안지점", lat: 36.80, lon: 127.17 },
  byeollae: { name: "어린이천문대 별내지점", lat: 37.68, lon: 127.13 },
  yongin: { name: "어린이천문대 용인지점", lat: 37.26, lon: 127.10 },
  pyeongtaek: { name: "어린이천문대 평택지점", lat: 37.00, lon: 127.09 },
  hongcheon: { name: "어린이천문대 홍천관측소", lat: 37.69, lon: 127.88 }
};

// Canvas and DOM Elements
let canvas, ctx;
let elements = {};

// 1. Initialize Application
window.addEventListener('DOMContentLoaded', () => {
  initDOM();
  initCanvas();
  loadData();
  setupEventListeners();
  setupKeyboardCalibration();
  
  // Start Main Loop
  requestAnimationFrame(loop);
});

function initDOM() {
  elements = {
    canvasContainer: document.getElementById('canvas-container'),
    txtLocationName: document.getElementById('txt-location-name'),
    txtCoordinates: document.getElementById('txt-coordinates'),
    txtCurrentTime: document.getElementById('txt-current-time'),
    txtTimeSpeed: document.getElementById('txt-time-speed'),
    btnToggleMenu: document.getElementById('btn-toggle-menu'),
    menuOverlay: document.getElementById('menu-overlay'),
    menuContainer: document.getElementById('menu-container'),
    btnCloseMenu: document.getElementById('btn-close-menu'),
    searchInput: document.getElementById('search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    searchResults: document.getElementById('search-results'),
    sliderOpacity: document.getElementById('slider-opacity'),
    valOpacity: document.getElementById('val-opacity'),
    chkShowLines: document.getElementById('chk-show-lines'),
    chkShowIllustrations: document.getElementById('chk-show-illustrations'),
    chkShowNames: document.getElementById('chk-show-names'),
    chkShowStarNames: document.getElementById('chk-show-star-names'),
    chkShowPlanets: document.getElementById('chk-show-planets'),
    chkShowDSOs: document.getElementById('chk-show-dsos'),
    chkShowHorizon: document.getElementById('chk-show-horizon'),
    chkShowAtmosphere: document.getElementById('chk-show-atmosphere'),
    chkCalibrationMode: document.getElementById('chk-calibration-mode'),
    btnTimeRewind: document.getElementById('btn-time-rewind'),
    btnTimePlayPause: document.getElementById('btn-time-play-pause'),
    btnTimeForward: document.getElementById('btn-time-forward'),
    btnTimeNow: document.getElementById('btn-time-now'),
    selectObservatory: document.getElementById('select-observatory'),
    sliderLat: document.getElementById('slider-lat'),
    sliderLon: document.getElementById('slider-lon'),
    valLat: document.getElementById('val-lat'),
    valLon: document.getElementById('val-lon'),
    btnGps: document.getElementById('btn-gps'),
    speedButtons: document.querySelectorAll('.btn-speed'),
    cityButtons: document.querySelectorAll('.btn-city'),
    
    // Datetime Adjustments
    inputObsDatetime: document.getElementById('input-obs-datetime'),
    spinYear: document.getElementById('spin-year'),
    spinMonth: document.getElementById('spin-month'),
    spinDay: document.getElementById('spin-day'),
    spinHour: document.getElementById('spin-hour'),
    spinMinute: document.getElementById('spin-minute'),
    spinSecond: document.getElementById('spin-second'),
    btnSpins: document.querySelectorAll('.btn-spin'),
    
    // Calibration elements
    calibrationBar: document.getElementById('calibration-bar'),
    calConstName: document.getElementById('cal-const-name'),
    calCoordsVal: document.getElementById('cal-coords-val'),
    btnCopyCalibration: document.getElementById('btn-copy-calibration'),
    btnSaveCalibration: document.getElementById('btn-save-calibration'),
    btnFlipH: document.getElementById('btn-flip-h'),
    btnFlipV: document.getElementById('btn-flip-v'),
    btnRotate90: document.getElementById('btn-rotate-90'),

    // HUD Clickable Triggers and Dropdowns
    hudLocationTrigger: document.getElementById('hud-location-trigger'),
    hudLocationDropdown: document.getElementById('hud-location-dropdown'),
    hudTimeTrigger: document.getElementById('hud-time-trigger'),
    hudTimeDropdown: document.getElementById('hud-time-dropdown')
  };
  
  tryCreateIcons();
}

function initCanvas() {
  canvas = document.getElementById('sky-canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  const rect = elements.canvasContainer.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  limitPan();
}

function limitPan() {
  // Panning is disabled in 3D panoramic mode since we rotate the camera instead.
  state.panX = 0;
  state.panY = 0;
}

// Load Star and Constellation Data
function loadData() {
  fetch('starry_data.json?v=' + Date.now())
    .then(response => response.json())
    .then(data => {
      state.stars = data.stars.filter(s => !isNaN(s.ra) && !isNaN(s.dec));
      state.constellations = data.constellations;
      
      state.constellations.forEach(c => {
        state.constellationMap[c.name.toLowerCase()] = c;
        state.constellationMap[c.name_ko.toLowerCase()] = c;
        c.abbrev = getAbbrevFromFullName(c.name);
        if (c.abbrev) {
          state.constellationMap[c.abbrev.toLowerCase()] = c;
        }
      });
      
      preloadConstellationImages();
      console.log(`Loaded ${state.stars.length} stars and ${state.constellations.length} constellations.`);
    })
    .catch(err => {
      console.error("Error loading starry_data.json:", err);
      alert("데이터 파일을 로드하는 데 실패했습니다. process_assets.py 스크립트가 실행되었는지 확인해 주세요.");
    });
}

function getAbbrevFromFullName(fullname) {
  const reverseMap = {
    "Andromeda": "And", "Antlia": "Ant", "Apus": "Aps", "Aquila": "Aql", "Ara": "Ara",
    "Aries": "Ari", "Auriga": "Aur", "Bootes": "Boo", "Caelum": "Cae", "Camelopardalis": "Cam",
    "Cancer": "Cnc", "Canes Venatici": "CVn", "Canis Major": "CMa", "Canis Minor": "CMi",
    "Capricornus": "Cap", "Carina": "Car", "Cassiopeia": "Cas", "Centaurus": "Cen",
    "Cepheus": "Cep", "Cetus": "Cet", "Chamaeleon": "Cha", "Circinus": "Cir",
    "Columba": "Col", "Coma Berenices": "Com", "Corona Australis": "CrA", "Corona Borealis": "CrB",
    "Corvus": "Crv", "Crater": "Crt", "Cru": "Cru", "Cygnus": "Cyg", "Delphinus": "Del",
    "Dorado": "Dor", "Draco": "Dra", "Equuleus": "Equ", "Eridanus": "Eri", "Fornax": "For",
    "Gemini": "Gem", "Grus": "Gru", "Hercules": "Her", "Horologium": "Hor", "Hydra": "Hya",
    "Hydrus": "Hyi", "Ind": "Ind", "Lacerta": "Lac", "Leo": "Leo", "Leo Minor": "LMi",
    "Lep": "Lep", "Libra": "Lib", "Lup": "Lup", "Lyn": "Lyn", "Lyra": "Lyr",
    "Mensa": "Men", "Microscopium": "Mic", "Monoceros": "Mon", "Mus": "Mus", "Norma": "Nor",
    "Oct": "Oct", "Ophiuchus": "Oph", "Orion": "Ori", "Pavo": "Pav", "Pegasus": "Peg",
    "Perseus": "Per", "Phoenix": "Phe", "Pictor": "Pic", "Pisces": "Psc", "Piscis Austrinus": "PsA",
    "Puppis": "Pup", "Pyxis": "Pyx", "Reticulum": "Ret", "Sagitta": "Sge", "Sagittarius": "Sgr",
    "Scorpius": "Sco", "Sculptor": "Scl", "Scutum": "Sct", "Serpens Caput": "Ser",
    "Sextans": "Sex", "Taurus": "Tau", "Telescopium": "Tel", "Triangulum": "Tri",
    "Triangulum Australe": "TrA", "Tucana": "Tuc", "Ursa Major": "UMa", "Ursa Minor": "UMi",
    "Vela": "Vel", "Vir": "Vir", "Vol": "Vol", "Vul": "Vul"
  };
  return reverseMap[fullname] || null;
}

function preloadConstellationImages() {
  state.constellations.forEach(c => {
    if (c.image) {
      state.totalImages++;
      const img = new Image();
      img.src = c.image;
      img.onload = () => {
        state.imagesLoaded++;
      };
      img.onerror = () => {
        console.warn(`Failed to load constellation image: ${c.image}`);
      };
      state.images[c.name] = img;
    }
  });
}

// 2. Astronomical Coordinate Projection Math

// Get Local Sidereal Time (LST) in hours
function getLST(date, longitude) {
  const time = date.getTime();
  const julianDate = (time / 86400000) + 2440587.5;
  const d = julianDate - 2451545.0;
  
  let gmst = 18.697374558 + 24.06570982441908 * d;
  gmst = ((gmst % 24) + 24) % 24;
  
  let lst = gmst + longitude / 15.0;
  lst = ((lst % 24) + 24) % 24;
  return lst;
}

// Convert Right Ascension (RA) and Declination (Dec) to Altitude (Alt) and Azimuth (Az)
function raDecToAltAz(ra, dec, lst, lat) {
  const decRad = dec * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  
  let ha = lst - (ra / 15.0);
  const haRad = ha * 15.0 * Math.PI / 180;
  
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  const altRad = Math.asin(Math.max(-1.0, Math.min(1.0, sinAlt)));
  const alt = altRad * 180 / Math.PI;
  
  const cosAlt = Math.cos(altRad);
  let az = 0;
  if (Math.abs(cosAlt) > 0.0001) {
    const cosAz = (Math.sin(decRad) - Math.sin(altRad) * Math.sin(latRad)) / (cosAlt * Math.cos(latRad));
    const sinAz = -Math.cos(decRad) * Math.sin(haRad) / cosAlt;
    
    az = Math.atan2(sinAz, cosAz) * 180 / Math.PI;
    az = (az + 360) % 360;
  } else {
    az = 0;
  }
  
  return { alt, az };
}

// Get Sun Coordinates (Keplerian Solar model)
function getSunPosition(date) {
  const time = date.getTime();
  const julianDate = (time / 86400000) + 2440587.5;
  const d = julianDate - 2451545.0;
  
  let g = 357.529 + 0.98560028 * d;
  g = (g % 360 + 360) % 360;
  const gRad = g * Math.PI / 180;
  
  let L = 280.459 + 0.98564736 * d;
  L = (L % 360 + 360) % 360;
  
  let lambda = L + 1.915 * Math.sin(gRad) + 0.020 * Math.sin(2 * gRad);
  lambda = (lambda % 360 + 360) % 360;
  const lambdaRad = lambda * Math.PI / 180;
  
  const epsilon = (23.439 - 0.00000036 * d) * Math.PI / 180;
  
  const decRad = Math.asin(Math.sin(epsilon) * Math.sin(lambdaRad));
  const dec = decRad * 180 / Math.PI;
  
  let raRad = Math.atan2(Math.cos(epsilon) * Math.sin(lambdaRad), Math.cos(lambdaRad));
  let ra = raRad * 180 / Math.PI;
  ra = (ra + 360) % 360;
  
  return { ra, dec };
}

// NEW: 3D Perspective Projection (Gnomonic)
// Maps Alt-Az on the sky dome to screen coordinates looking in camera direction (camAz, camAlt)
function altAzToScreen(alt, az, cx, cy, R, zoom, panX, panY) {
  // If showing horizon is checked, clip things below the horizon
  if (state.showHorizon && alt < 0) return null;
  
  // Convert inputs to radians
  const altRad = alt * Math.PI / 180;
  const azRad = az * Math.PI / 180;
  
  const camAltRad = state.camAlt * Math.PI / 180;
  const camAzRad = state.camAz * Math.PI / 180;
  
  // 1. Calculate 3D unit vector for the star in horizontal coordinates
  // x = East, y = North, z = Zenith
  const xStar = Math.cos(altRad) * Math.sin(azRad);
  const yStar = Math.cos(altRad) * Math.cos(azRad);
  const zStar = Math.sin(altRad);
  
  // 2. Calculate 3D camera vector directions
  // Camera pointing direction (Look vector)
  const xLook = Math.cos(camAltRad) * Math.sin(camAzRad);
  const yLook = Math.cos(camAltRad) * Math.cos(camAzRad);
  const zLook = Math.sin(camAltRad);
  
  // Right vector on the screen (horizontal direction pointing right)
  const xRight = Math.cos(camAzRad);
  const yRight = -Math.sin(camAzRad);
  const zRight = 0;
  
  // Up vector on the screen (perpendicular to Look and Right vectors)
  const xUp = yRight * zLook - zRight * yLook;
  const yUp = zRight * xLook - xRight * zLook;
  const zUp = xRight * yLook - yRight * xLook;
  
  // 3. Project star vector onto camera coordinate system
  const d = xStar * xLook + yStar * yLook + zStar * zLook; // dot product along look vector
  
  // Stereographic projection allows wider projection angle without stretching distortion.
  // We avoid division by zero near the opposite point (d = -1) by checking d <= -0.99.
  if (d <= -0.99) return null;
  
  // Stereographic focal length scaling: F = cx / tan(fovRad / 4)
  const fovRad = (state.fov / zoom) * Math.PI / 180;
  const F = cx / Math.tan(fovRad / 4);
  
  // Stereographic offsets: divide by (1 + d) instead of d to preserve conformal shapes
  const u = (xStar * xRight + yStar * yRight + zStar * zRight) / (1 + d);
  const v = (xStar * xUp + yStar * yUp + zStar * zUp) / (1 + d);
  
  // Screen projection coordinates
  const screenX = cx + u * F + panX;
  const screenY = cy - v * F + panY;
  
  // If the coordinates go way off the canvas, clip them to optimize rendering
  if (screenX < -200 || screenX > cx * 2 + 200 || screenY < -200 || screenY > cy * 2 + 200) {
    return null;
  }
  
  return { x: screenX, y: screenY };
}

// 3. Keyboard Calibration Mode Keydown Handlers
function setupKeyboardCalibration() {
  window.addEventListener('keydown', (e) => {
    if (!state.calibrationMode || !state.selectedConstellation) return;
    
    // Ignore key events when typing in search input or other text controls
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    
    const c = state.selectedConstellation;
    const step = e.shiftKey ? 0.5 : 0.05; // 10x faster shift if Shift is pressed
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      c.dec += step;
      updateCalibrationUI();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      c.dec -= step;
      updateCalibrationUI();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const cosDec = Math.cos(c.dec * Math.PI / 180);
      c.ra -= step / Math.max(0.1, cosDec);
      if (c.ra < 0) c.ra += 360;
      updateCalibrationUI();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const cosDec = Math.cos(c.dec * Math.PI / 180);
      c.ra += step / Math.max(0.1, cosDec);
      if (c.ra >= 360) c.ra -= 360;
      updateCalibrationUI();
    } else if (e.key === '[' || e.key === '{') {
      e.preventDefault();
      c.position_angle = (c.position_angle - step * 10 + 360) % 360;
      updateCalibrationUI();
    } else if (e.key === ']' || e.key === '}') {
      e.preventDefault();
      c.position_angle = (c.position_angle + step * 10) % 360;
      updateCalibrationUI();
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      const factor = 1.01;
      c.width_deg *= factor;
      c.height_deg *= factor;
      updateCalibrationUI();
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      const factor = 0.99;
      c.width_deg *= factor;
      c.height_deg *= factor;
      updateCalibrationUI();
    } else if (e.key === 'h' || e.key === 'H') {
      e.preventDefault();
      c.flip_h = !c.flip_h;
      updateCalibrationUI();
    } else if (e.key === 'v' || e.key === 'V') {
      e.preventDefault();
      c.flip_v = !c.flip_v;
      updateCalibrationUI();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      c.position_angle = (c.position_angle + 90) % 360;
      updateCalibrationUI();
    }
  });
}

function updateCalibrationUI() {
  const c = state.selectedConstellation;
  if (c) {
    elements.calConstName.textContent = `${c.name_ko} (${c.name})`;
    const flipText = `좌우반전: ${c.flip_h ? 'ON' : 'OFF'} | 상하반전: ${c.flip_v ? 'ON' : 'OFF'}`;
    elements.calCoordsVal.textContent = `RA: ${c.ra.toFixed(4)}° | Dec: ${c.dec.toFixed(4)}° | Size: ${c.width_deg.toFixed(2)}° x ${c.height_deg.toFixed(2)}° | PA: ${c.position_angle.toFixed(1)}° | ${flipText}`;
  }
}

function copyCalibrationData() {
  if (!state.selectedConstellation) return;
  const c = state.selectedConstellation;
  
  const exportData = {
    name: c.name,
    ra: c.ra,
    dec: c.dec,
    width_deg: c.width_deg,
    height_deg: c.height_deg,
    position_angle: c.position_angle,
    flip_h: !!c.flip_h,
    flip_v: !!c.flip_v
  };
  
  navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
    .then(() => {
      alert(`${c.name_ko} 보정값 JSON이 클립보드에 복사되었습니다!\nstarry_data.json 파일 내의 해당 별자리 데이터에 덮어씌워 보존해 주세요.`);
    })
    .catch(err => {
      console.error("Clipboard copy failed:", err);
      alert(`보정값 복사 실패. 아래 값을 직접 복사해 주세요:\n${JSON.stringify(exportData)}`);
    });
}

function saveCalibrationDataToServer() {
  if (!state.selectedConstellation) return;
  const c = state.selectedConstellation;
  
  const payload = {
    name: c.name,
    ra: c.ra,
    dec: c.dec,
    width_deg: c.width_deg,
    height_deg: c.height_deg,
    position_angle: c.position_angle,
    flip_h: !!c.flip_h,
    flip_v: !!c.flip_v
  };
  
  // Visual loading feedback
  const originalHTML = elements.btnSaveCalibration.innerHTML;
  elements.btnSaveCalibration.innerHTML = '<i data-lucide="loader" class="animate-spin" style="width: 14px; height: 14px;"></i> 저장 중...';
  tryCreateIcons();
  elements.btnSaveCalibration.disabled = true;
  
  fetch('/api/save_calibration', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert(`${c.name_ko} 보정값이 starry_data.json 파일에 성공적으로 즉시 저장되었습니다!`);
    } else {
      alert(`저장 실패: ${data.message}`);
    }
  })
  .catch(err => {
    console.error("Save failed:", err);
    alert("서버 연결에 실패했습니다. 커스텀 Python 서버(server.py)가 실행 중인지 확인해 주세요.");
  })
  .finally(() => {
    elements.btnSaveCalibration.innerHTML = originalHTML;
    tryCreateIcons();
    elements.btnSaveCalibration.disabled = false;
  });
}

// 4. User Interface Event Handlers

function setupEventListeners() {
  // HUD Dropdown Toggles
  elements.hudLocationTrigger.addEventListener('click', (e) => {
    if (e.target.closest('.hud-dropdown')) return;
    e.stopPropagation();
    elements.hudLocationDropdown.classList.toggle('hidden');
    elements.hudTimeDropdown.classList.add('hidden'); // Close other dropdown
  });

  elements.hudTimeTrigger.addEventListener('click', (e) => {
    if (e.target.closest('.hud-dropdown')) return;
    e.stopPropagation();
    elements.hudTimeDropdown.classList.toggle('hidden');
    elements.hudLocationDropdown.classList.add('hidden'); // Close other dropdown
  });

  // Stop click events inside the dropdowns from closing them
  elements.hudLocationDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  elements.hudTimeDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!elements.hudLocationTrigger.contains(e.target) && !elements.hudLocationDropdown.contains(e.target)) {
      elements.hudLocationDropdown.classList.add('hidden');
    }
    if (!elements.hudTimeTrigger.contains(e.target) && !elements.hudTimeDropdown.contains(e.target)) {
      elements.hudTimeDropdown.classList.add('hidden');
    }
  });

  // Toggle Settings Panel Drawer
  elements.btnToggleMenu.addEventListener('click', () => {
    elements.menuOverlay.classList.toggle('menu-hidden');
  });
  
  elements.btnCloseMenu.addEventListener('click', () => {
    elements.menuOverlay.classList.add('menu-hidden');
  });
  
  elements.menuOverlay.addEventListener('click', (e) => {
    if (e.target === elements.menuOverlay && window.innerWidth <= 768) {
      elements.menuOverlay.classList.add('menu-hidden');
    }
  });

  // Settings Toggles
  elements.sliderOpacity.addEventListener('input', (e) => {
    state.constellationOpacity = e.target.value / 100;
    elements.valOpacity.textContent = `${e.target.value}%`;
  });
  
  elements.chkShowLines.addEventListener('change', (e) => {
    state.showLines = e.target.checked;
  });
  
  elements.chkShowIllustrations.addEventListener('change', (e) => {
    state.showIllustrations = e.target.checked;
  });
  
  elements.chkShowNames.addEventListener('change', (e) => {
    state.showNames = e.target.checked;
  });
  
  elements.chkShowStarNames.addEventListener('change', (e) => {
    state.showStarNames = e.target.checked;
  });

  elements.chkShowHorizon.addEventListener('change', (e) => {
    state.showHorizon = e.target.checked;
  });

  elements.chkShowAtmosphere.addEventListener('change', (e) => {
    state.showAtmosphere = e.target.checked;
  });

  elements.chkShowPlanets.addEventListener('change', (e) => {
    state.showPlanets = e.target.checked;
  });

  elements.chkShowDSOs.addEventListener('change', (e) => {
    state.showDSOs = e.target.checked;
  });

  elements.chkCalibrationMode.addEventListener('change', (e) => {
    state.calibrationMode = e.target.checked;
    if (state.calibrationMode) {
      elements.calibrationBar.classList.remove('hidden');
      updateCalibrationUI();
    } else {
      elements.calibrationBar.classList.add('hidden');
    }
  });
  
  elements.btnCopyCalibration.addEventListener('click', copyCalibrationData);
  elements.btnSaveCalibration.addEventListener('click', saveCalibrationDataToServer);

  elements.btnFlipH.addEventListener('click', () => {
    if (state.selectedConstellation) {
      state.selectedConstellation.flip_h = !state.selectedConstellation.flip_h;
      updateCalibrationUI();
    }
  });

  elements.btnFlipV.addEventListener('click', () => {
    if (state.selectedConstellation) {
      state.selectedConstellation.flip_v = !state.selectedConstellation.flip_v;
      updateCalibrationUI();
    }
  });

  elements.btnRotate90.addEventListener('click', () => {
    if (state.selectedConstellation) {
      state.selectedConstellation.position_angle = (state.selectedConstellation.position_angle + 90) % 360;
      updateCalibrationUI();
    }
  });

  // Observatory Selector (All 26 branches)
  elements.selectObservatory.addEventListener('change', (e) => {
    const obsKey = e.target.value;
    if (obsKey && observatories[obsKey]) {
      elements.cityButtons.forEach(b => b.classList.remove('active'));
      
      const obs = observatories[obsKey];
      state.latitude = obs.lat;
      state.longitude = obs.lon;
      state.locationName = obs.name;
      
      elements.sliderLat.value = obs.lat;
      elements.sliderLon.value = obs.lon;
      
      updateLocationUI();
    }
  });

  // Location Sliders
  elements.sliderLat.addEventListener('input', (e) => {
    state.latitude = parseFloat(e.target.value);
    state.locationName = "커스텀 관측지";
    elements.selectObservatory.value = "";
    updateLocationUI();
  });
  
  elements.sliderLon.addEventListener('input', (e) => {
    state.longitude = parseFloat(e.target.value);
    state.locationName = "커스텀 관측지";
    elements.selectObservatory.value = "";
    updateLocationUI();
  });

  // City Presets
  elements.cityButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.cityButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      elements.selectObservatory.value = "";
      
      state.latitude = parseFloat(btn.dataset.lat);
      state.longitude = parseFloat(btn.dataset.lon);
      state.locationName = btn.dataset.name;
      
      elements.sliderLat.value = state.latitude;
      elements.sliderLon.value = state.longitude;
      
      updateLocationUI();
    });
  });

  // GPS Sync
  elements.btnGps.addEventListener('click', () => {
    if (navigator.geolocation) {
      elements.btnGps.innerHTML = '<i data-lucide="loader" class="animate-spin"></i> 위치 수신 중...';
      lucide.createIcons();
      elements.selectObservatory.value = "";
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          state.latitude = position.coords.latitude;
          state.longitude = position.coords.longitude;
          state.locationName = "GPS 수신 위치";
          
          elements.sliderLat.value = state.latitude.toFixed(2);
          elements.sliderLon.value = state.longitude.toFixed(2);
          
          updateLocationUI();
          elements.btnGps.innerHTML = '<i data-lucide="navigation"></i> GPS 현위치';
          lucide.createIcons();
        },
        (err) => {
          alert("GPS 위치 수신 실패. 기본 위치로 유지합니다.");
          elements.btnGps.innerHTML = '<i data-lucide="navigation"></i> GPS 현위치';
          lucide.createIcons();
        }
      );
    } else {
      alert("이 브라우저는 GPS를 지원하지 않습니다.");
    }
  });

  // Time Controls
  elements.btnTimePlayPause.addEventListener('click', () => {
    state.isPlaying = !state.isPlaying;
    const icon = state.isPlaying ? 'pause' : 'play';
    elements.btnTimePlayPause.innerHTML = `<i data-lucide="${icon}"></i>`;
    lucide.createIcons();
    updateTimeSpeedUI();
  });

  elements.btnTimeRewind.addEventListener('click', () => {
    if (state.timeSpeed > 1) {
      state.timeSpeed = Math.floor(state.timeSpeed / 10);
    } else if (state.timeSpeed > -100000) {
      state.timeSpeed = state.timeSpeed === 1 ? -10 : state.timeSpeed * 10;
    }
    state.isPlaying = true;
    elements.btnTimePlayPause.innerHTML = `<i data-lucide="pause"></i>`;
    lucide.createIcons();
    updateTimeSpeedUI();
  });

  elements.btnTimeForward.addEventListener('click', () => {
    if (state.timeSpeed < -1) {
      state.timeSpeed = Math.floor(state.timeSpeed / 10);
    } else if (state.timeSpeed < 100000) {
      state.timeSpeed = state.timeSpeed === 1 ? 10 : state.timeSpeed * 10;
    }
    state.isPlaying = true;
    elements.btnTimePlayPause.innerHTML = `<i data-lucide="pause"></i>`;
    lucide.createIcons();
    updateTimeSpeedUI();
  });

  elements.btnTimeNow.addEventListener('click', () => {
    state.obsTime = new Date();
    state.timeSpeed = 1;
    state.isPlaying = true;
    elements.btnTimePlayPause.innerHTML = `<i data-lucide="pause"></i>`;
    lucide.createIcons();
    updateTimeSpeedUI();
  });

  elements.speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.speedButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.timeSpeed = parseInt(btn.dataset.speed);
      state.isPlaying = true;
      elements.btnTimePlayPause.innerHTML = `<i data-lucide="pause"></i>`;
      lucide.createIcons();
      updateTimeSpeedUI();
    });
  });

  // Search Features
  elements.searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    
    if (query.length > 0) {
      elements.btnClearSearch.classList.add('visible');
      performSearch(query);
    } else {
      elements.btnClearSearch.classList.remove('visible');
      elements.searchResults.classList.add('hidden');
    }
  });

  elements.btnClearSearch.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.btnClearSearch.classList.remove('visible');
    elements.searchResults.classList.add('hidden');
    state.selectedConstellation = null;
    updateCalibrationUI();
  });

  // Datetime Picker Change Event
  if (elements.inputObsDatetime) {
    elements.inputObsDatetime.addEventListener('input', (e) => {
      if (e.target.value) {
        state.obsTime = new Date(e.target.value);
        updateTimeUI();
      }
    });

    elements.inputObsDatetime.addEventListener('focus', () => {
      state.wasPlayingBeforeFocus = state.isPlaying;
      state.isPlaying = false;
      elements.btnTimePlayPause.innerHTML = `<i data-lucide="play"></i>`;
      lucide.createIcons();
      updateTimeSpeedUI();
    });

    elements.inputObsDatetime.addEventListener('blur', () => {
      if (state.wasPlayingBeforeFocus) {
        state.isPlaying = true;
        elements.btnTimePlayPause.innerHTML = `<i data-lucide="pause"></i>`;
        lucide.createIcons();
        updateTimeSpeedUI();
      }
    });
  }

  // Datetime Spinner Chevron Adjustment Events
  if (elements.btnSpins) {
    elements.btnSpins.forEach(btn => {
      btn.addEventListener('click', () => {
        // Pause simulation when manually adjusting spinners for smooth UX
        state.isPlaying = false;
        elements.btnTimePlayPause.innerHTML = `<i data-lucide="play"></i>`;
        lucide.createIcons();
        updateTimeSpeedUI();
        
        const unit = btn.dataset.unit;
        const action = btn.dataset.action;
        const multiplier = action === 'up' ? 1 : -1;
        
        const date = new Date(state.obsTime.getTime());
        
        if (unit === 'year') {
          date.setFullYear(date.getFullYear() + multiplier);
        } else if (unit === 'month') {
          date.setMonth(date.getMonth() + multiplier);
        } else if (unit === 'day') {
          date.setDate(date.getDate() + multiplier);
        } else if (unit === 'hour') {
          date.setHours(date.getHours() + multiplier);
        } else if (unit === 'minute') {
          date.setMinutes(date.getMinutes() + multiplier);
        } else if (unit === 'second') {
          date.setSeconds(date.getSeconds() + multiplier);
        }
        
        state.obsTime = date;
        updateTimeUI();
      });
    });
  }

  setupGestureControls();
}

function updateLocationUI() {
  elements.txtLocationName.textContent = state.locationName;
  const latStr = `${Math.abs(state.latitude).toFixed(2)}° ${state.latitude >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(state.longitude).toFixed(2)}° ${state.longitude >= 0 ? 'E' : 'W'}`;
  elements.txtCoordinates.textContent = `${latStr}, ${lonStr}`;
  
  elements.valLat.textContent = latStr;
  elements.valLon.textContent = lonStr;
}

function updateTimeSpeedUI() {
  let speedText = "실시간 (1x)";
  if (!state.isPlaying) {
    speedText = "일시정지됨";
  } else if (state.timeSpeed !== 1) {
    speedText = `${state.timeSpeed}배속`;
  }
  elements.txtTimeSpeed.textContent = speedText;
}

// === Major Star Bayer Designations Database ===
const BAYER_STAR_DB = {
  11767:  { ko: '북극성', en: 'Polaris',     bayer: 'Alpha Ursae Minoris',    bayerShort: 'a UMi' },
  32349:  { ko: '시리우스', en: 'Sirius',     bayer: 'Alpha Canis Majoris',    bayerShort: 'a CMa' },
  30438:  { ko: '카노푸스', en: 'Canopus',    bayer: 'Alpha Carinae',          bayerShort: 'a Car' },
  69673:  { ko: '아크투르스', en: 'Arcturus',  bayer: 'Alpha Bootis',           bayerShort: 'a Boo' },
  91262:  { ko: '베가', en: 'Vega',           bayer: 'Alpha Lyrae',            bayerShort: 'a Lyr' },
  24608:  { ko: '카펠라', en: 'Capella',      bayer: 'Alpha Aurigae',          bayerShort: 'a Aur' },
  24436:  { ko: '리겔', en: 'Rigel',          bayer: 'Beta Orionis',           bayerShort: 'b Ori' },
  37279:  { ko: '프로키온', en: 'Procyon',     bayer: 'Alpha Canis Minoris',    bayerShort: 'a CMi' },
  27989:  { ko: '베텔게우스', en: 'Betelgeuse', bayer: 'Alpha Orionis',         bayerShort: 'a Ori' },
  97649:  { ko: '알타이르', en: 'Altair',      bayer: 'Alpha Aquilae',          bayerShort: 'a Aql' },
  21421:  { ko: '알데바란', en: 'Aldebaran',   bayer: 'Alpha Tauri',            bayerShort: 'a Tau' },
  65474:  { ko: '스피카', en: 'Spica',         bayer: 'Alpha Virginis',         bayerShort: 'a Vir' },
  80763:  { ko: '안타레스', en: 'Antares',     bayer: 'Alpha Scorpii',          bayerShort: 'a Sco' },
  37826:  { ko: '폴룩스', en: 'Pollux',        bayer: 'Beta Geminorum',         bayerShort: 'b Gem' },
  113368: { ko: '포말하우트', en: 'Fomalhaut', bayer: 'Alpha Piscis Austrini',  bayerShort: 'a PsA' },
  102098: { ko: '데네브', en: 'Deneb',         bayer: 'Alpha Cygni',            bayerShort: 'a Cyg' },
  49669:  { ko: '레굴루스', en: 'Regulus',      bayer: 'Alpha Leonis',           bayerShort: 'a Leo' },
  36850:  { ko: '카스토르', en: 'Castor',       bayer: 'Alpha Geminorum',        bayerShort: 'a Gem' },
  54061:  { ko: '두베', en: 'Dubhe',            bayer: 'Alpha Ursae Majoris',    bayerShort: 'a UMa' },
  53910:  { ko: '메락', en: 'Merak',            bayer: 'Beta Ursae Majoris',     bayerShort: 'b UMa' },
  58001:  { ko: '펙다', en: 'Phecda',           bayer: 'Gamma Ursae Majoris',    bayerShort: 'g UMa' },
  59774:  { ko: '메그레즈', en: 'Megrez',       bayer: 'Delta Ursae Majoris',    bayerShort: 'd UMa' },
  62956:  { ko: '알리오스', en: 'Alioth',       bayer: 'Epsilon Ursae Majoris',  bayerShort: 'e UMa' },
  65378:  { ko: '미자르', en: 'Mizar',          bayer: 'Zeta Ursae Majoris',     bayerShort: 'z UMa' },
  67301:  { ko: '알카이드', en: 'Alkaid',       bayer: 'Eta Ursae Majoris',      bayerShort: 'h UMa' },
  7588:   { ko: '아케르나르', en: 'Achernar',    bayer: 'Alpha Eridani',          bayerShort: 'a Eri' },
  60718:  { ko: '아크룩스', en: 'Acrux',        bayer: 'Alpha Crucis',           bayerShort: 'a Cru' },
  68682:  { ko: '하달', en: 'Hadar',            bayer: 'Beta Centauri',          bayerShort: 'b Cen' },
  71683:  { ko: '리겔 켄타우루스', en: 'Rigel Kentaurus', bayer: 'Alpha Centauri', bayerShort: 'a Cen' },
};

function performSearch(query) {
  const results = [];
  const seen = new Set();
  
  // 1. Search Constellations
  const keys = Object.keys(state.constellationMap);
  for (const key of keys) {
    if (key.includes(query)) {
      const match = state.constellationMap[key];
      if (!seen.has('c_' + match.name)) {
        seen.add('c_' + match.name);
        results.push({ type: 'constellation', data: match });
      }
    }
    if (results.length >= 10) break;
  }
  
  // 2. Search Stars (Korean name, English name, Bayer designation)
  for (const [hipStr, info] of Object.entries(BAYER_STAR_DB)) {
    if (results.length >= 10) break;
    const hip = parseInt(hipStr);
    const matchKo = info.ko.toLowerCase().includes(query);
    const matchEn = info.en.toLowerCase().includes(query);
    const matchBayer = info.bayer.toLowerCase().includes(query);
    const matchBayerShort = info.bayerShort.toLowerCase().includes(query);
    
    if (matchKo || matchEn || matchBayer || matchBayerShort) {
      const starData = state.stars.find(s => s.hip === hip);
      if (starData && !seen.has('s_' + hip)) {
        seen.add('s_' + hip);
        results.push({ type: 'star', data: starData, info: info });
      }
    }
  }
  
  // 3. Search named stars not in Bayer DB
  if (results.length < 10) {
    for (const s of state.stars) {
      if (results.length >= 10) break;
      if (s.name && !seen.has('s_' + s.hip)) {
        const nameLC = s.name.toLowerCase();
        if (nameLC.includes(query)) {
          seen.add('s_' + s.hip);
          results.push({ type: 'star', data: s, info: null });
        }
      }
    }
  }
  
  if (results.length > 0) {
    elements.searchResults.innerHTML = '';
    results.forEach(r => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      
      if (r.type === 'constellation') {
        item.innerHTML = `
          <span>⭐ ${r.data.name_ko}</span>
          <span class="desc">${r.data.name} (${getAbbrevFromFullName(r.data.name) || ''})</span>
        `;
        item.addEventListener('click', () => {
          focusOnConstellation(r.data);
          elements.searchResults.classList.add('hidden');
        });
      } else {
        const info = r.info || BAYER_STAR_DB[r.data.hip];
        const displayName = info ? info.ko : r.data.name.split(' (')[0];
        const bayerText = info ? info.bayerShort : '';
        const engText = info ? info.en : (r.data.name.match(/\((.+)\)/) || ['', ''])[1];
        item.innerHTML = `
          <span>✦ ${displayName}</span>
          <span class="desc">${engText} ${bayerText ? '(' + bayerText + ')' : ''} mag ${r.data.mag.toFixed(1)}</span>
        `;
        item.addEventListener('click', () => {
          focusOnStar(r.data);
          elements.searchResults.classList.add('hidden');
        });
      }
      elements.searchResults.appendChild(item);
    });
    elements.searchResults.classList.remove('hidden');
  } else {
    elements.searchResults.classList.add('hidden');
  }
}

// Smooth slewing utility: interpolates angle with shortest-path wrap-around
function lerpAngle(from, to, t) {
  let diff = to - from;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return from + diff * t;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function startSlew(targetAz, targetAlt, targetFov) {
  state.isSlewing = true;
  state.slewStartTime = Date.now();
  state.slewStartAz = state.camAz;
  state.slewStartAlt = state.camAlt;
  state.slewStartFov = state.fov;
  state.slewTargetAz = targetAz;
  state.slewTargetAlt = Math.max(-10, Math.min(80, targetAlt));
  state.slewTargetFov = targetFov;
}

function updateSlewing() {
  if (!state.isSlewing) return;
  const elapsed = Date.now() - state.slewStartTime;
  const t = Math.min(1, elapsed / state.slewDuration);
  const eased = easeInOutCubic(t);
  
  state.camAz = lerpAngle(state.slewStartAz, state.slewTargetAz, eased);
  state.camAz = ((state.camAz % 360) + 360) % 360;
  state.camAlt = state.slewStartAlt + (state.slewTargetAlt - state.slewStartAlt) * eased;
  state.fov = state.slewStartFov + (state.slewTargetFov - state.slewStartFov) * eased;
  
  if (t >= 1) {
    state.isSlewing = false;
  }
}

function focusOnConstellation(constellation) {
  state.selectedConstellation = constellation;
  updateCalibrationUI();
  
  const lst = getLST(state.obsTime, state.longitude);
  const altAz = raDecToAltAz(constellation.ra, constellation.dec, lst, state.latitude);
  
  // Smooth slewing animation to constellation center
  startSlew(altAz.az, altAz.alt, 60.0);
  
  if (window.innerWidth <= 768) {
    elements.menuOverlay.classList.add('menu-hidden');
  }
}

function focusOnStar(starData) {
  state.selectedStar = { star: starData, x: 0, y: 0 };
  
  const lst = getLST(state.obsTime, state.longitude);
  const altAz = raDecToAltAz(starData.ra, starData.dec, lst, state.latitude);
  
  // Smooth slewing animation to star
  startSlew(altAz.az, altAz.alt, 50.0);
  
  if (window.innerWidth <= 768) {
    elements.menuOverlay.classList.add('menu-hidden');
  }
}

// 5. 3D Navigation Gestures (Drag to Rotate camAz/camAlt, Pinch/Wheel to Zoom fov)
function setupGestureControls() {
  const container = elements.canvasContainer;
  const dragThreshold = 5; // pixels
  let clickStartX = 0;
  let clickStartY = 0;
  
  const startDrag = (x, y) => {
    state.isDragging = true;
    state.draggedDuringClick = false;
    clickStartX = x;
    clickStartY = y;
    state.dragStartX = state.camAz;
    state.dragStartY = state.camAlt;
  };
  
  const moveDrag = (x, y) => {
    if (state.isDragging) {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      
      const dx = x - clickStartX;
      const dy = y - clickStartY;
      
      if (Math.sqrt(dx * dx + dy * dy) > dragThreshold) {
        state.draggedDuringClick = true;
      }
      
      // Calculate rotation sensitivity based on FOV (makes rotation proportional to zoom level)
      const sensitivityX = state.fov / w;
      const sensitivityY = state.fov / h;
      
      // Horizontal drag rotates Yaw (Azimuth)
      // Moving drag to the right should rotate view to the left
      state.camAz = (state.dragStartX - dx * sensitivityX + 360) % 360;
      
      // Vertical drag rotates Pitch (Altitude)
      // Moving drag down should look up, moving drag up should look down
      state.camAlt = Math.max(-85, Math.min(85, state.dragStartY + dy * sensitivityY));
    }
  };
  
  // Mouse
  container.addEventListener('mousedown', (e) => {
    startDrag(e.clientX, e.clientY);
  });
  
  container.addEventListener('mousemove', (e) => {
    moveDrag(e.clientX, e.clientY);
    // Track mouse position for constellation hover highlighting
    const rect = canvas.getBoundingClientRect();
    state.mouseScreenX = e.clientX - rect.left;
    state.mouseScreenY = e.clientY - rect.top;
  });
  
  window.addEventListener('mouseup', (e) => {
    if (state.isDragging) {
      state.isDragging = false;
      if (!state.draggedDuringClick) {
        handleCanvasClick(e.clientX, e.clientY);
      }
    }
  });

  // Mobile Touch
  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      state.isDragging = false;
      state.lastTouchDistance = getTouchDistance(e.touches);
    }
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (state.isDragging && e.touches.length === 1) {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      const factor = dist / state.lastTouchDistance;
      // Pinch to Zoom (adjusts FOV)
      state.fov = Math.max(25, Math.min(130, state.fov / factor));
      state.lastTouchDistance = dist;
    }
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    if (state.isDragging) {
      state.isDragging = false;
      if (!state.draggedDuringClick && e.changedTouches.length > 0) {
        handleCanvasClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    }
    state.lastTouchDistance = 0;
  });

  // Desktop Mouse Wheel Zoom
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
    // Mouse wheel adjusts FOV
    state.fov = Math.max(25, Math.min(130, state.fov * zoomFactor));
  }, { passive: false });
}

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Find closest 1-5 magnitude star when clicked
function handleCanvasClick(screenX, screenY) {
  const rect = canvas.getBoundingClientRect();
  const clickX = screenX - rect.left;
  const clickY = screenY - rect.top;
  
  let closestStar = null;
  let minDist = 20; // 20px click buffer
  
  const lst = getLST(state.obsTime, state.longitude);
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.42;
  
  state.stars.forEach(s => {
    if (s.mag <= 5.5) {
      const altAz = raDecToAltAz(s.ra, s.dec, lst, state.latitude);
      if (!state.showHorizon || altAz.alt >= 0) {
        const pos = altAzToScreen(altAz.alt, altAz.az, cx, cy, R, 1.0, 0, 0);
        if (pos) {
          const dist = Math.sqrt((pos.x - clickX) ** 2 + (pos.y - clickY) ** 2);
          if (dist < minDist) {
            minDist = dist;
            closestStar = { star: s, x: pos.x, y: pos.y, alt: altAz.alt, az: altAz.az };
          }
        }
      }
    }
  });
  
  state.selectedStar = closestStar;
}

// 6. Physics and Simulation Logic

function updatePhysics() {
  const now = Date.now();
  const dt = (now - state.lastTimeUpdate) / 1000;
  state.lastTimeUpdate = now;
  
  if (state.isPlaying) {
    const elapsedSeconds = dt * state.timeSpeed;
    state.obsTime = new Date(state.obsTime.getTime() + elapsedSeconds * 1000);
  }
  
  // Smooth slewing animation
  updateSlewing();
}

function formatTime(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

// 7. Canvas Render Loop

function render() {
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;
  
  ctx.clearRect(0, 0, w, h);
  
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.42;
  
  const lst = getLST(state.obsTime, state.longitude);
  const sunPos = getSunPosition(state.obsTime);
  const sunAltAz = raDecToAltAz(sunPos.ra, sunPos.dec, lst, state.latitude);
  
  const isDaylight = state.showAtmosphere && sunAltAz.alt > 0;
  
  // 1. Draw Sky Background
  if (isDaylight) {
    // Atmosphere daylight gradient (blue sky, brighter near horizon)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#0ea5e9'); // sky-500
    skyGrad.addColorStop(0.7, '#38bdf8'); // sky-400
    skyGrad.addColorStop(1, '#bae6fd'); // sky-200 near horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);
    
    // Sun light scatter overlay
    const sunScreen = altAzToScreen(sunAltAz.alt, sunAltAz.az, cx, cy, R, 1.0, 0, 0);
    if (sunScreen) {
      ctx.beginPath();
      const sunScatter = ctx.createRadialGradient(sunScreen.x, sunScreen.y, 0, sunScreen.x, sunScreen.y, w * 0.8);
      sunScatter.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      sunScatter.addColorStop(0.2, 'rgba(255, 254, 215, 0.2)');
      sunScatter.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.fillStyle = sunScatter;
      ctx.arc(sunScreen.x, sunScreen.y, w * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Night sky deep black space background
    ctx.fillStyle = '#02020a';
    ctx.fillRect(0, 0, w, h);
  }
  
  // 2. Draw Coordinate Grid Lines
  drawGrid(cx, cy, R);

  // 3. Pre-calculate star screen positions
  const renderedStars = [];
  state.stars.forEach(s => {
    const altAz = raDecToAltAz(s.ra, s.dec, lst, state.latitude);
    // Project and render
    const pos = altAzToScreen(altAz.alt, altAz.az, cx, cy, R, 1.0, 0, 0);
    if (pos) {
      renderedStars.push({ star: s, x: pos.x, y: pos.y, alt: altAz.alt, az: altAz.az });
    }
  });

  // 4. Render Constellation Illustrations
  if (state.showIllustrations && state.constellationOpacity > 0.01) {
    const currentOpacity = isDaylight ? state.constellationOpacity * 0.04 : state.constellationOpacity;
    if (currentOpacity > 0.01) {
      renderConstellationImages(lst, cx, cy, R, currentOpacity);
    }
  }

  // 5. Render Constellation Lines (Opacities boosted to 45% / 90% for high visibility)
  if (state.showLines) {
    renderConstellationLines(renderedStars);
  }

  // 6. Render Stars
  if (!isDaylight) {
    renderStars(renderedStars);
  } else {
    // Only brightest stars are visible in daytime atmosphere
    const daylightStars = renderedStars.filter(rs => rs.star.mag < 2.0);
    renderStars(daylightStars);
  }

  // 7. Render Sun
  renderSun(sunAltAz, cx, cy, R);

  // 7.5 Render Planets
  if (state.showPlanets && !isDaylight) {
    renderPlanets(lst, cx, cy, R);
  }

  // 7.6 Render Deep Sky Objects (Messier)
  if (state.showDSOs && !isDaylight) {
    renderDSOs(lst, cx, cy, R);
  }

  // 7.7 Constellation Hover Highlighting
  updateConstellationHover(renderedStars, cx, cy, R);

  // 8. Render Constellation & Star Labels
  renderLabels(renderedStars, lst, cx, cy, R, isDaylight);

  // 9. Render Selected Star Highlight
  if (state.selectedStar) {
    renderSelectedStarRing(lst, cx, cy, R);
  }

  // 10. Draw Ground Silhouette (Dark mountain silhouette at Alt <= 0)
  drawHorizonAndGround(cx, cy, w, h);

  // 11. Draw Star Info Tooltip Box
  if (state.selectedStar) {
    drawStarTooltip(lst, cx, cy, R);
  }
}

function drawGrid(cx, cy, R) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
  ctx.lineWidth = 1;
  
  // Concetric Alt circles
  const altRings = [60, 30, 0, -30, -60];
  altRings.forEach(alt => {
    // Sample points along this altitude ring and project them to draw smooth curve
    ctx.beginPath();
    let started = false;
    for (let az = 0; az <= 360; az += 5) {
      const pos = altAzToScreen(alt, az, cx, cy, R, 1.0, 0, 0);
      if (pos) {
        if (!started) {
          ctx.moveTo(pos.x, pos.y);
          started = true;
        } else {
          ctx.lineTo(pos.x, pos.y);
        }
      } else {
        started = false;
      }
    }
    ctx.stroke();
  });
  
  // Radial Azimuth meridian lines (every 30 degrees)
  for (let az = 0; az < 360; az += 30) {
    ctx.beginPath();
    let started = false;
    for (let alt = -85; alt <= 85; alt += 5) {
      const pos = altAzToScreen(alt, az, cx, cy, R, 1.0, 0, 0);
      if (pos) {
        if (!started) {
          ctx.moveTo(pos.x, pos.y);
          started = true;
        } else {
          ctx.lineTo(pos.x, pos.y);
        }
      } else {
        started = false;
      }
    }
    ctx.stroke();
  }
}

function renderConstellationImages(lst, cx, cy, R, opacity) {
  state.constellations.forEach(c => {
    const img = state.images[c.name];
    if (img && img.complete && img.naturalWidth !== 0) {
      const centerAltAz = raDecToAltAz(c.ra, c.dec, lst, state.latitude);
      
      const screenPos = altAzToScreen(centerAltAz.alt, centerAltAz.az, cx, cy, R, 1.0, 0, 0);
      if (screenPos) {
        const northAltAz = raDecToAltAz(c.ra, c.dec + 0.5, lst, state.latitude);
        const northPos = altAzToScreen(northAltAz.alt, northAltAz.az, cx, cy, R, 1.0, 0, 0);
        
        if (northPos) {
          const angleNorth = Math.atan2(northPos.y - screenPos.y, northPos.x - screenPos.x);
          
          // Stereographic scale factor at the center of the screen
          const fovRad = state.fov * Math.PI / 180;
          const F = cx / (2 * Math.tan(fovRad / 4));
          const w = (c.width_deg * Math.PI / 180) * F;
          const h = (c.height_deg * Math.PI / 180) * F;
          
          ctx.save();
          ctx.translate(screenPos.x, screenPos.y);
          
          const rotation = angleNorth + Math.PI / 2 - (c.position_angle * Math.PI / 180);
          ctx.rotate(rotation);
          
          // Apply horizontal/vertical flips if active
          const scaleX = c.flip_h ? -1 : 1;
          const scaleY = c.flip_v ? -1 : 1;
          ctx.scale(scaleX, scaleY);
          
          ctx.globalAlpha = state.selectedConstellation === c ? Math.min(1.0, opacity * 1.6) : opacity;
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
        }
      }
    }
  });
  ctx.globalAlpha = 1.0;
}

function renderConstellationLines(renderedStars) {
  const starMap = {};
  renderedStars.forEach(rs => {
    starMap[rs.star.hip] = rs;
  });
  
  state.constellations.forEach(c => {
    if (c.lines) {
      const isSelected = state.selectedConstellation === c;
      // High visibility: unselected = 48% opacity, selected = 90% opacity
      ctx.strokeStyle = isSelected ? 'rgba(56, 189, 248, 0.9)' : 'rgba(56, 189, 248, 0.48)';
      ctx.lineWidth = isSelected ? 2.2 : 1.4;
      
      c.lines.forEach(line => {
        const star1 = starMap[line[0]];
        const star2 = starMap[line[1]];
        
        if (star1 && star2) {
          ctx.beginPath();
          ctx.moveTo(star1.x, star1.y);
          ctx.lineTo(star2.x, star2.y);
          ctx.stroke();
        }
      });
    }
  });
}

function renderStars(renderedStars) {
  renderedStars.forEach(rs => {
    const mag = rs.star.mag;
    const maxRadius = 3.5;
    const minRadius = 0.45;
    const starRadius = Math.max(minRadius, Math.min(maxRadius, (6.0 - mag) * 0.7));
    
    if (mag < 3.0) {
      ctx.beginPath();
      const glowGrad = ctx.createRadialGradient(rs.x, rs.y, 0, rs.x, rs.y, starRadius * 3.5);
      glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      glowGrad.addColorStop(0.3, 'rgba(125, 211, 252, 0.35)');
      glowGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = glowGrad;
      ctx.arc(rs.x, rs.y, starRadius * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.beginPath();
    ctx.arc(rs.x, rs.y, starRadius, 0, Math.PI * 2);
    ctx.fillStyle = mag < 2.0 ? '#ffffff' : '#e0f2fe';
    ctx.fill();
  });
}

function renderSun(sunAltAz, cx, cy, R) {
  const sunPos = altAzToScreen(sunAltAz.alt, sunAltAz.az, cx, cy, R, 1.0, 0, 0);
  if (!sunPos) return;
  
  const sunRadius = 7;
  
  ctx.beginPath();
  const sunGlow = ctx.createRadialGradient(sunPos.x, sunPos.y, 0, sunPos.x, sunPos.y, sunRadius * 5.0);
  sunGlow.addColorStop(0, '#ffffff');
  sunGlow.addColorStop(0.2, '#fef08a');
  sunGlow.addColorStop(0.5, 'rgba(249, 115, 22, 0.35)');
  sunGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');
  ctx.fillStyle = sunGlow;
  ctx.arc(sunPos.x, sunPos.y, sunRadius * 5.0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(sunPos.x, sunPos.y, sunRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

function renderLabels(renderedStars, lst, cx, cy, R, isDaylight) {
  // 1. Star Names (Resized and brightened for high legibility for children - Doubled Size)
  if (state.showStarNames) {
    ctx.fillStyle = 'rgba(226, 232, 240, 0.95)'; // Slate-200, highly visible
    ctx.font = 'bold 32px var(--font-body)';      // Raised to 32px bold (doubled)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // Add text stroke and shadow for high contrast on star halos
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 7;                            // Doubled from 3.5
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    
    renderedStars.forEach(rs => {
      const magThreshold = isDaylight ? 1.0 : (state.fov < 60 ? 4.5 : 2.5);
      if (rs.star.name && rs.star.mag < magThreshold) {
        const text = "  " + rs.star.name.split(" ")[0];
        ctx.strokeText(text, rs.x + 8, rs.y);     // Added offset shift for larger font
        ctx.fillText(text, rs.x + 8, rs.y);
      }
    });
    ctx.shadowBlur = 0; // Reset shadow
  }

  // 2. Constellation Names (Resized and contrasted for elementary students - Doubled Size)
  if (state.showNames) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    state.constellations.forEach(c => {
      const centerAltAz = raDecToAltAz(c.ra, c.dec, lst, state.latitude);
      
      const pos = altAzToScreen(centerAltAz.alt, centerAltAz.az, cx, cy, R, 1.0, 0, 0);
      if (pos) {
        // Font sizing adjusts dynamically with FOV zoom (Base 52px, Min 44px, Max 76px - Doubled)
        const fontSize = Math.max(44, Math.min(76, 52 * (90 / state.fov)));
        
        ctx.shadowBlur = 5;
        if (state.selectedConstellation === c) {
          ctx.fillStyle = '#fb923c'; // Focus highlight orange
          ctx.font = `bold ${fontSize}px var(--font-display)`;
          ctx.shadowColor = 'rgba(249, 115, 22, 0.6)';
        } else {
          ctx.fillStyle = isDaylight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(241, 245, 249, 0.98)'; // Bright white
          ctx.font = `bold ${fontSize}px var(--font-display)`;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.95)'; // High contrast dark shadow outline
        }
        
        // High visibility outline (Doubled from 4 to 8)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = 8;
        ctx.strokeText(c.name_ko, pos.x, pos.y);
        ctx.fillText(c.name_ko, pos.x, pos.y);
        
        // Render English Subtitle
        if (state.fov < 85) {
          ctx.font = `bold ${fontSize - 8}px var(--font-body)`; // Offset doubled from -4 to -8
          ctx.fillStyle = isDaylight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(148, 163, 184, 0.85)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.lineWidth = 6; // Doubled from 3 to 6
          ctx.strokeText(c.name, pos.x, pos.y + fontSize + 8); // Offset doubled from +4 to +8
          ctx.fillText(c.name, pos.x, pos.y + fontSize + 8);
        }
      }
    });
    ctx.shadowBlur = 0; // Reset shadow
  }
}

// Draw panoramic landscape ground silhouette and direction labels (N, E, S, W, etc.)
function drawHorizonAndGround(cx, cy, w, h) {
  // 1. Draw direction labels along the horizon curve
  const directions = [
    { label: '북 (N)', az: 0 },
    { label: '북동 (NE)', az: 45 },
    { label: '동 (E)', az: 90 },
    { label: '남동 (SE)', az: 135 },
    { label: '남 (S)', az: 180 },
    { label: '남서 (SW)', az: 225 },
    { label: '서 (W)', az: 270 },
    { label: '북서 (NW)', az: 315 }
  ];
  
  ctx.font = 'bold 11px var(--font-display)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  
  directions.forEach(d => {
    // Render labels slightly above ground (Alt = 0.3)
    const pos = altAzToScreen(0.3, d.az, cx, cy, 0, 1.0, 0, 0);
    if (pos) {
      if (d.az === 180) {
        ctx.fillStyle = 'var(--color-primary)'; // South gets primary blue highlights (default focus direction)
      } else if (d.az % 90 === 0) {
        ctx.fillStyle = '#cbd5e1'; // Main N, E, W are gray-white
      } else {
        ctx.fillStyle = '#64748b'; // Intercardinal NE, SE, etc. are dim
      }
      ctx.fillText(d.label, pos.x, pos.y - 4);
    }
  });

  // 2. Draw ground mountain landscape silhouette
  if (!state.showHorizon) return;
  
  ctx.beginPath();
  let points = [];
  
  // Sample azimuth range in front of camera
  for (let dAz = -90; dAz <= 90; dAz += 1) {
    const az = (state.camAz + dAz + 360) % 360;
    // Mathematical deterministic landscape mountain shape based on azimuth
    const altNoise = -0.5 + Math.sin(az * 0.08) * 1.5 + Math.cos(az * 0.22) * 0.6 + Math.sin(az * 0.5) * 0.2;
    const pos = altAzToScreen(altNoise, az, cx, cy, 0, 1.0, 0, 0);
    if (pos) {
      points.push(pos);
    }
  }
  
  if (points.length === 0) return;
  
  ctx.moveTo(0, h);
  ctx.lineTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  
  // Dark deep blue landscape fill gradient (matches Starry Night silhouette)
  const groundGrad = ctx.createLinearGradient(0, h * 0.75, 0, h);
  groundGrad.addColorStop(0, '#04051a'); // Dark space blue
  groundGrad.addColorStop(1, '#010106'); // Deep black
  ctx.fillStyle = groundGrad;
  ctx.fill();
  
  // Thin neon silhouette border
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function renderSelectedStarRing(lst, cx, cy, R) {
  const rs = state.selectedStar;
  const altAz = raDecToAltAz(rs.star.ra, rs.star.dec, lst, state.latitude);
  
  if (!state.showHorizon || altAz.alt >= 0) {
    const pos = altAzToScreen(altAz.alt, altAz.az, cx, cy, R, 1.0, 0, 0);
    if (pos) {
      const pulseRadius = 8 + (Math.sin(Date.now() / 200) * 3);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'var(--color-primary)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

function drawStarTooltip(lst, cx, cy, R) {
  const rs = state.selectedStar;
  const altAz = raDecToAltAz(rs.star.ra, rs.star.dec, lst, state.latitude);
  
  if (state.showHorizon && altAz.alt < 0) {
    state.selectedStar = null;
    return;
  }
  
  const pos = altAzToScreen(altAz.alt, altAz.az, cx, cy, R, 1.0, 0, 0);
  if (!pos) return;
  
  const starName = rs.star.name ? rs.star.name : `HIP ${rs.star.hip}`;
  
  const popupW = 160;
  const popupH = 75;
  const popupX = pos.x - popupW / 2;
  const popupY = pos.y - popupH - 12;
  
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 10;
  
  ctx.fillStyle = 'rgba(8, 8, 28, 0.88)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 1.2;
  
  ctx.beginPath();
  ctx.roundRect(popupX, popupY, popupW, popupH, 10);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  ctx.beginPath();
  ctx.moveTo(pos.x - 8, popupY + popupH);
  ctx.lineTo(pos.x, pos.y - 4);
  ctx.lineTo(pos.x + 8, popupY + popupH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(8, 8, 28, 0.88)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.fill();
  ctx.stroke();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px var(--font-display)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  ctx.fillText(starName.split(" (")[0], popupX + 12, popupY + 12);
  
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '9px var(--font-body)';
  
  ctx.fillText(`밝기 등급: ${rs.star.mag.toFixed(2)} 등급`, popupX + 12, popupY + 30);
  ctx.fillText(`고도: ${altAz.alt.toFixed(1)}° | 방위: ${altAz.az.toFixed(1)}°`, popupX + 12, popupY + 42);
  ctx.fillText(`적경: ${(rs.star.ra / 15.0).toFixed(2)}h | 적위: ${rs.star.dec.toFixed(1)}°`, popupX + 12, popupY + 54);
  
  ctx.restore();
}

function updateTimeUI() {
  const date = state.obsTime;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  
  if (elements.spinYear) elements.spinYear.textContent = y;
  if (elements.spinMonth) elements.spinMonth.textContent = m;
  if (elements.spinDay) elements.spinDay.textContent = d;
  if (elements.spinHour) elements.spinHour.textContent = hh;
  if (elements.spinMinute) elements.spinMinute.textContent = mm;
  if (elements.spinSecond) elements.spinSecond.textContent = ss;
  
  if (elements.inputObsDatetime && document.activeElement !== elements.inputObsDatetime) {
    elements.inputObsDatetime.value = `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
  }
}

// ========================================================================
// 9. PLANETARY ORBIT CALCULATION (Keplerian Elements, J2000)
// ========================================================================

// Orbital elements for planets at J2000.0 epoch
// Format: [a, e, I, L, longPeri, longNode, rates...]
// a = semi-major axis (AU), e = eccentricity, I = inclination (deg),
// L = mean longitude (deg), longPeri = longitude of perihelion (deg), longNode = longitude of ascending node (deg)
const PLANET_ELEMENTS = {
  Mercury: {
    a0: 0.38709927, aRate: 0.00000037,
    e0: 0.20563593, eRate: 0.00001906,
    I0: 7.00497902, IRate: -0.00594749,
    L0: 252.25032350, LRate: 149472.67411175,
    wBar0: 77.45779628, wBarRate: 0.16047689,
    Om0: 48.33076593, OmRate: -0.12534081,
    emoji: '🌑', ko: '수성', size: 20
  },
  Venus: {
    a0: 0.72333566, aRate: 0.00000390,
    e0: 0.00677672, eRate: -0.00004107,
    I0: 3.39467605, IRate: -0.00078890,
    L0: 181.97909950, LRate: 58517.81538729,
    wBar0: 131.60246718, wBarRate: 0.00268329,
    Om0: 76.67984255, OmRate: -0.27769418,
    emoji: '🌕', ko: '금성', size: 24
  },
  Mars: {
    a0: 1.52371034, aRate: 0.00001847,
    e0: 0.09339410, eRate: 0.00007882,
    I0: 1.84969142, IRate: -0.00813131,
    L0: -4.55343205, LRate: 19140.30268499,
    wBar0: -23.94362959, wBarRate: 0.44441088,
    Om0: 49.55953891, OmRate: -0.29257343,
    emoji: '🔴', ko: '화성', size: 22
  },
  Jupiter: {
    a0: 5.20288700, aRate: -0.00011607,
    e0: 0.04838624, eRate: -0.00013253,
    I0: 1.30439695, IRate: -0.00183714,
    L0: 34.39644051, LRate: 3034.74612775,
    wBar0: 14.72847983, wBarRate: 0.21252668,
    Om0: 100.47390909, OmRate: 0.20469106,
    emoji: '🟠', ko: '목성', size: 30
  },
  Saturn: {
    a0: 9.53667594, aRate: -0.00125060,
    e0: 0.05386179, eRate: -0.00050991,
    I0: 2.48599187, IRate: 0.00193609,
    L0: 49.95424423, LRate: 1222.49362201,
    wBar0: 92.59887831, wBarRate: -0.41897216,
    Om0: 113.66242448, OmRate: -0.28867794,
    emoji: '🪐', ko: '토성', size: 28
  },
  Uranus: {
    a0: 19.18916464, aRate: -0.00196176,
    e0: 0.04725744, eRate: -0.00004397,
    I0: 0.77263783, IRate: -0.00242939,
    L0: 313.23810451, LRate: 428.48202785,
    wBar0: 170.95427630, wBarRate: 0.40805281,
    Om0: 74.01692503, OmRate: 0.04240589,
    emoji: '🌐', ko: '천왕성', size: 24
  },
  Neptune: {
    a0: 30.06992276, aRate: 0.00026291,
    e0: 0.00859048, eRate: 0.00005105,
    I0: 1.77004347, IRate: 0.00035372,
    L0: -55.12002969, LRate: 218.45945325,
    wBar0: 44.96476227, wBarRate: -0.32241464,
    Om0: 131.78422574, OmRate: -0.00508664,
    emoji: '🔵', ko: '해왕성', size: 22
  }
};

function getPlanetPosition(planet, date) {
  const T = ((date.getTime() / 86400000) + 2440587.5 - 2451545.0) / 36525.0; // Julian centuries from J2000
  
  const p = PLANET_ELEMENTS[planet];
  const a = p.a0 + p.aRate * T;
  const e = p.e0 + p.eRate * T;
  const I = (p.I0 + p.IRate * T) * Math.PI / 180;
  const L = (p.L0 + p.LRate * T) % 360;
  const wBar = (p.wBar0 + p.wBarRate * T) * Math.PI / 180;
  const Om = (p.Om0 + p.OmRate * T) * Math.PI / 180;
  
  // Mean anomaly
  let M = L - p.wBar0 - p.wBarRate * T;
  M = ((M % 360) + 360) % 360;
  const MRad = M * Math.PI / 180;
  
  // Solve Kepler's equation iteratively: E - e*sin(E) = M
  let E = MRad;
  for (let i = 0; i < 10; i++) {
    E = E - (E - e * Math.sin(E) - MRad) / (1 - e * Math.cos(E));
  }
  
  // True anomaly
  const v = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  
  // Heliocentric radius
  const r = a * (1 - e * Math.cos(E));
  
  // Argument of perihelion
  const w = wBar - Om;
  
  // Heliocentric ecliptic coordinates
  const xEcl = r * (Math.cos(Om) * Math.cos(v + w) - Math.sin(Om) * Math.sin(v + w) * Math.cos(I));
  const yEcl = r * (Math.sin(Om) * Math.cos(v + w) + Math.cos(Om) * Math.sin(v + w) * Math.cos(I));
  const zEcl = r * Math.sin(v + w) * Math.sin(I);
  
  // Get Earth's heliocentric position for geocentric conversion
  const earthPos = getEarthHeliocentricPosition(T);
  
  // Geocentric ecliptic
  const xGeo = xEcl - earthPos.x;
  const yGeo = yEcl - earthPos.y;
  const zGeo = zEcl - earthPos.z;
  
  // Convert ecliptic to equatorial (RA/Dec)
  const obliquity = (23.439 - 0.0000004 * T * 36525) * Math.PI / 180;
  const xEq = xGeo;
  const yEq = yGeo * Math.cos(obliquity) - zGeo * Math.sin(obliquity);
  const zEq = yGeo * Math.sin(obliquity) + zGeo * Math.cos(obliquity);
  
  const ra = ((Math.atan2(yEq, xEq) * 180 / Math.PI) + 360) % 360;
  const dec = Math.asin(zEq / Math.sqrt(xEq * xEq + yEq * yEq + zEq * zEq)) * 180 / Math.PI;
  
  return { ra, dec };
}

function getEarthHeliocentricPosition(T) {
  const a = 1.00000261 + 0.00000562 * T;
  const e = 0.01671123 - 0.00004392 * T;
  const L = (100.46457166 + 35999.37244981 * T) % 360;
  const wBar = (102.93768193 + 0.32327364 * T) * Math.PI / 180;
  
  let M = L - (102.93768193 + 0.32327364 * T);
  M = ((M % 360) + 360) % 360;
  const MRad = M * Math.PI / 180;
  
  let E = MRad;
  for (let i = 0; i < 10; i++) {
    E = E - (E - e * Math.sin(E) - MRad) / (1 - e * Math.cos(E));
  }
  
  const v = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  const r = a * (1 - e * Math.cos(E));
  
  const x = r * Math.cos(v + wBar);
  const y = r * Math.sin(v + wBar);
  const z = 0; // Earth orbit nearly in ecliptic
  
  return { x, y, z };
}

// Moon position (simplified Brown theory approximation)
function getMoonPosition(date) {
  const T = ((date.getTime() / 86400000) + 2440587.5 - 2451545.0) / 36525.0;
  
  // Simplified lunar coordinates
  const L0 = (218.3165 + 481267.8813 * T) % 360;
  const M = (134.9634 + 477198.8676 * T) % 360 * Math.PI / 180;
  const F = (93.2721 + 483202.0175 * T) % 360 * Math.PI / 180;
  const D = (297.8502 + 445267.1115 * T) % 360 * Math.PI / 180;
  const Ms = (357.5291 + 35999.0503 * T) % 360 * Math.PI / 180;
  
  let lon = L0 + 6.289 * Math.sin(M)
    + 1.274 * Math.sin(2 * D - M)
    + 0.658 * Math.sin(2 * D)
    + 0.214 * Math.sin(2 * M)
    - 0.186 * Math.sin(Ms)
    - 0.114 * Math.sin(2 * F);
  
  let lat = 5.128 * Math.sin(F)
    + 0.281 * Math.sin(M + F)
    + 0.278 * Math.sin(M - F);
  
  lon = ((lon % 360) + 360) % 360;
  const lonRad = lon * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  
  // Ecliptic to equatorial
  const obliquity = (23.439 - 0.0000004 * T * 36525) * Math.PI / 180;
  
  const x = Math.cos(latRad) * Math.cos(lonRad);
  const y = Math.cos(latRad) * Math.sin(lonRad);
  const z = Math.sin(latRad);
  
  const xEq = x;
  const yEq = y * Math.cos(obliquity) - z * Math.sin(obliquity);
  const zEq = y * Math.sin(obliquity) + z * Math.cos(obliquity);
  
  const ra = ((Math.atan2(yEq, xEq) * 180 / Math.PI) + 360) % 360;
  const dec = Math.asin(zEq / Math.sqrt(xEq * xEq + yEq * yEq + zEq * zEq)) * 180 / Math.PI;
  
  return { ra, dec };
}

function renderPlanets(lst, cx, cy, R) {
  const planets = Object.keys(PLANET_ELEMENTS);
  
  planets.forEach(name => {
    const p = PLANET_ELEMENTS[name];
    const pos = getPlanetPosition(name, state.obsTime);
    const altAz = raDecToAltAz(pos.ra, pos.dec, lst, state.latitude);
    
    if (state.showHorizon && altAz.alt < 0) return;
    
    const screenPos = altAzToScreen(altAz.alt, altAz.az, cx, cy, R, 1.0, 0, 0);
    if (!screenPos) return;
    
    // Dynamic size based on FOV (zoom)
    const size = Math.max(14, p.size * (60 / state.fov));
    
    // Draw emoji
    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.emoji, screenPos.x, screenPos.y);
    
    // Draw label below
    ctx.font = 'bold 14px var(--font-body)';
    ctx.fillStyle = 'rgba(255, 235, 180, 0.9)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.lineWidth = 4;
    ctx.strokeText(p.ko, screenPos.x, screenPos.y + size / 2 + 12);
    ctx.fillText(p.ko, screenPos.x, screenPos.y + size / 2 + 12);
  });
  
  // Moon
  const moonPos = getMoonPosition(state.obsTime);
  const moonAltAz = raDecToAltAz(moonPos.ra, moonPos.dec, lst, state.latitude);
  if ((!state.showHorizon || moonAltAz.alt >= 0)) {
    const moonScreen = altAzToScreen(moonAltAz.alt, moonAltAz.az, cx, cy, R, 1.0, 0, 0);
    if (moonScreen) {
      const moonSize = Math.max(18, 32 * (60 / state.fov));
      ctx.font = `${moonSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌙', moonScreen.x, moonScreen.y);
      
      ctx.font = 'bold 14px var(--font-body)';
      ctx.fillStyle = 'rgba(255, 255, 220, 0.9)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 4;
      ctx.strokeText('달', moonScreen.x, moonScreen.y + moonSize / 2 + 12);
      ctx.fillText('달', moonScreen.x, moonScreen.y + moonSize / 2 + 12);
    }
  }
}

// ========================================================================
// 10. MESSIER DEEP SKY OBJECTS (M1-M110)
// ========================================================================
// Types: SG=Spiral Galaxy, EG=Elliptical Galaxy, PN=Planetary Nebula, 
//        EN=Emission/Diffuse Nebula, OC=Open Cluster, GC=Globular Cluster, SNR=Supernova Remnant
const DSO_EMOJI = { SG: '🌀', EG: '🥚', EN: '💨', PN: '🧿', OC: '✨', GC: '🔮', SNR: '💥' };

const MESSIER_CATALOG = [
  { id:'M1',   ra:83.633,  dec:22.014,  type:'SNR', ko:'게성운' },
  { id:'M2',   ra:323.363, dec:-0.823,  type:'GC',  ko:'M2' },
  { id:'M3',   ra:205.548, dec:28.377,  type:'GC',  ko:'M3' },
  { id:'M4',   ra:245.897, dec:-26.526, type:'GC',  ko:'M4' },
  { id:'M5',   ra:229.638, dec:2.081,   type:'GC',  ko:'M5' },
  { id:'M6',   ra:265.083, dec:-32.217, type:'OC',  ko:'나비성단' },
  { id:'M7',   ra:268.467, dec:-34.793, type:'OC',  ko:'프톨레마이오스성단' },
  { id:'M8',   ra:271.083, dec:-24.380, type:'EN',  ko:'석호성운' },
  { id:'M9',   ra:259.800, dec:-18.517, type:'GC',  ko:'M9' },
  { id:'M10',  ra:254.288, dec:-4.100,  type:'GC',  ko:'M10' },
  { id:'M11',  ra:282.767, dec:-6.267,  type:'OC',  ko:'야생오리성단' },
  { id:'M12',  ra:251.809, dec:-1.949,  type:'GC',  ko:'M12' },
  { id:'M13',  ra:250.424, dec:36.462,  type:'GC',  ko:'헤르쿨레스 대성단' },
  { id:'M14',  ra:264.400, dec:-3.246,  type:'GC',  ko:'M14' },
  { id:'M15',  ra:322.493, dec:12.167,  type:'GC',  ko:'M15' },
  { id:'M16',  ra:274.700, dec:-13.783, type:'EN',  ko:'독수리성운' },
  { id:'M17',  ra:275.183, dec:-16.183, type:'EN',  ko:'오메가성운' },
  { id:'M18',  ra:275.233, dec:-17.133, type:'OC',  ko:'M18' },
  { id:'M19',  ra:255.657, dec:-26.268, type:'GC',  ko:'M19' },
  { id:'M20',  ra:270.617, dec:-23.033, type:'EN',  ko:'삼렬성운' },
  { id:'M21',  ra:270.967, dec:-22.500, type:'OC',  ko:'M21' },
  { id:'M22',  ra:279.100, dec:-23.903, type:'GC',  ko:'M22' },
  { id:'M23',  ra:269.267, dec:-19.017, type:'OC',  ko:'M23' },
  { id:'M24',  ra:274.717, dec:-18.517, type:'OC',  ko:'궁수자리 별구름' },
  { id:'M25',  ra:277.850, dec:-19.233, type:'OC',  ko:'M25' },
  { id:'M26',  ra:281.317, dec:-9.400,  type:'OC',  ko:'M26' },
  { id:'M27',  ra:299.902, dec:22.721,  type:'PN',  ko:'아령성운' },
  { id:'M28',  ra:276.137, dec:-24.870, type:'GC',  ko:'M28' },
  { id:'M29',  ra:305.967, dec:38.517,  type:'OC',  ko:'M29' },
  { id:'M30',  ra:325.092, dec:-23.180, type:'GC',  ko:'M30' },
  { id:'M31',  ra:10.685,  dec:41.269,  type:'SG',  ko:'안드로메다은하' },
  { id:'M32',  ra:10.674,  dec:40.866,  type:'EG',  ko:'M32' },
  { id:'M33',  ra:23.462,  dec:30.660,  type:'SG',  ko:'삼각형자리은하' },
  { id:'M34',  ra:40.517,  dec:42.783,  type:'OC',  ko:'M34' },
  { id:'M35',  ra:92.250,  dec:24.350,  type:'OC',  ko:'M35' },
  { id:'M36',  ra:84.083,  dec:34.133,  type:'OC',  ko:'M36' },
  { id:'M37',  ra:88.067,  dec:32.550,  type:'OC',  ko:'M37' },
  { id:'M38',  ra:82.167,  dec:35.833,  type:'OC',  ko:'M38' },
  { id:'M39',  ra:323.067, dec:48.433,  type:'OC',  ko:'M39' },
  { id:'M40',  ra:185.550, dec:58.083,  type:'OC',  ko:'위나맥스별' },
  { id:'M41',  ra:101.500, dec:-20.733, type:'OC',  ko:'M41' },
  { id:'M42',  ra:83.822,  dec:-5.391,  type:'EN',  ko:'오리온대성운' },
  { id:'M43',  ra:83.892,  dec:-5.268,  type:'EN',  ko:'드메이란성운' },
  { id:'M44',  ra:130.050, dec:19.667,  type:'OC',  ko:'프레세페성단' },
  { id:'M45',  ra:56.750,  dec:24.117,  type:'OC',  ko:'플레이아데스' },
  { id:'M46',  ra:115.467, dec:-14.817, type:'OC',  ko:'M46' },
  { id:'M47',  ra:114.150, dec:-14.500, type:'OC',  ko:'M47' },
  { id:'M48',  ra:123.433, dec:-5.800,  type:'OC',  ko:'M48' },
  { id:'M49',  ra:187.444, dec:8.000,   type:'EG',  ko:'M49' },
  { id:'M50',  ra:105.667, dec:-8.333,  type:'OC',  ko:'M50' },
  { id:'M51',  ra:202.470, dec:47.195,  type:'SG',  ko:'소용돌이은하' },
  { id:'M52',  ra:351.200, dec:61.593,  type:'OC',  ko:'M52' },
  { id:'M53',  ra:198.230, dec:18.169,  type:'GC',  ko:'M53' },
  { id:'M54',  ra:283.764, dec:-30.480, type:'GC',  ko:'M54' },
  { id:'M55',  ra:294.998, dec:-30.965, type:'GC',  ko:'M55' },
  { id:'M56',  ra:289.148, dec:30.184,  type:'GC',  ko:'M56' },
  { id:'M57',  ra:283.396, dec:33.029,  type:'PN',  ko:'고리성운' },
  { id:'M58',  ra:189.431, dec:11.818,  type:'SG',  ko:'M58' },
  { id:'M59',  ra:190.509, dec:11.647,  type:'EG',  ko:'M59' },
  { id:'M60',  ra:190.917, dec:11.553,  type:'EG',  ko:'M60' },
  { id:'M61',  ra:185.479, dec:4.474,   type:'SG',  ko:'M61' },
  { id:'M62',  ra:255.303, dec:-30.113, type:'GC',  ko:'M62' },
  { id:'M63',  ra:198.955, dec:42.029,  type:'SG',  ko:'해바라기은하' },
  { id:'M64',  ra:194.182, dec:21.683,  type:'SG',  ko:'검은눈은하' },
  { id:'M65',  ra:169.733, dec:13.092,  type:'SG',  ko:'M65' },
  { id:'M66',  ra:170.063, dec:12.991,  type:'SG',  ko:'M66' },
  { id:'M67',  ra:132.846, dec:11.814,  type:'OC',  ko:'M67' },
  { id:'M68',  ra:189.867, dec:-26.744, type:'GC',  ko:'M68' },
  { id:'M69',  ra:277.846, dec:-32.348, type:'GC',  ko:'M69' },
  { id:'M70',  ra:280.802, dec:-32.291, type:'GC',  ko:'M70' },
  { id:'M71',  ra:298.444, dec:18.779,  type:'GC',  ko:'M71' },
  { id:'M72',  ra:313.365, dec:-12.537, type:'GC',  ko:'M72' },
  { id:'M73',  ra:314.749, dec:-12.633, type:'OC',  ko:'M73' },
  { id:'M74',  ra:24.174,  dec:15.784,  type:'SG',  ko:'M74' },
  { id:'M75',  ra:301.520, dec:-21.921, type:'GC',  ko:'M75' },
  { id:'M76',  ra:25.582,  dec:51.575,  type:'PN',  ko:'작은아령성운' },
  { id:'M77',  ra:40.670,  dec:-0.014,  type:'SG',  ko:'M77' },
  { id:'M78',  ra:86.650,  dec:0.079,   type:'EN',  ko:'M78' },
  { id:'M79',  ra:81.046,  dec:-24.524, type:'GC',  ko:'M79' },
  { id:'M80',  ra:244.260, dec:-22.976, type:'GC',  ko:'M80' },
  { id:'M81',  ra:148.888, dec:69.065,  type:'SG',  ko:'보데은하' },
  { id:'M82',  ra:148.970, dec:69.680,  type:'SG',  ko:'시가은하' },
  { id:'M83',  ra:204.254, dec:-29.865, type:'SG',  ko:'남쪽바람개비은하' },
  { id:'M84',  ra:186.265, dec:12.887,  type:'EG',  ko:'M84' },
  { id:'M85',  ra:186.350, dec:18.191,  type:'EG',  ko:'M85' },
  { id:'M86',  ra:186.549, dec:12.946,  type:'EG',  ko:'M86' },
  { id:'M87',  ra:187.706, dec:12.391,  type:'EG',  ko:'처녀자리A' },
  { id:'M88',  ra:188.996, dec:14.420,  type:'SG',  ko:'M88' },
  { id:'M89',  ra:188.916, dec:12.556,  type:'EG',  ko:'M89' },
  { id:'M90',  ra:189.209, dec:13.163,  type:'SG',  ko:'M90' },
  { id:'M91',  ra:189.211, dec:14.497,  type:'SG',  ko:'M91' },
  { id:'M92',  ra:259.281, dec:43.136,  type:'GC',  ko:'M92' },
  { id:'M93',  ra:116.133, dec:-23.867, type:'OC',  ko:'M93' },
  { id:'M94',  ra:192.721, dec:41.120,  type:'SG',  ko:'M94' },
  { id:'M95',  ra:160.990, dec:11.704,  type:'SG',  ko:'M95' },
  { id:'M96',  ra:161.693, dec:11.820,  type:'SG',  ko:'M96' },
  { id:'M97',  ra:168.699, dec:55.019,  type:'PN',  ko:'올빼미성운' },
  { id:'M98',  ra:183.452, dec:14.900,  type:'SG',  ko:'M98' },
  { id:'M99',  ra:184.706, dec:14.417,  type:'SG',  ko:'M99' },
  { id:'M100', ra:185.729, dec:15.822,  type:'SG',  ko:'M100' },
  { id:'M101', ra:210.802, dec:54.349,  type:'SG',  ko:'바람개비은하' },
  { id:'M102', ra:226.623, dec:55.763,  type:'EG',  ko:'M102' },
  { id:'M103', ra:23.350,  dec:60.700,  type:'OC',  ko:'M103' },
  { id:'M104', ra:190.000, dec:-11.623, type:'SG',  ko:'솜브레로은하' },
  { id:'M105', ra:161.957, dec:12.581,  type:'EG',  ko:'M105' },
  { id:'M106', ra:184.740, dec:47.304,  type:'SG',  ko:'M106' },
  { id:'M107', ra:248.133, dec:-13.053, type:'GC',  ko:'M107' },
  { id:'M108', ra:167.879, dec:55.674,  type:'SG',  ko:'M108' },
  { id:'M109', ra:179.400, dec:53.375,  type:'SG',  ko:'M109' },
  { id:'M110', ra:10.092,  dec:41.685,  type:'EG',  ko:'M110' }
];

function renderDSOs(lst, cx, cy, R) {
  MESSIER_CATALOG.forEach(dso => {
    const altAz = raDecToAltAz(dso.ra, dso.dec, lst, state.latitude);
    if (state.showHorizon && altAz.alt < 0) return;
    
    const pos = altAzToScreen(altAz.alt, altAz.az, cx, cy, R, 1.0, 0, 0);
    if (!pos) return;
    
    const emoji = DSO_EMOJI[dso.type] || '✨';
    const size = Math.max(12, 18 * (60 / state.fov));
    
    // Draw DSO emoji
    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, pos.x, pos.y);
    
    // Label (only when zoomed in enough)
    if (state.fov < 75) {
      ctx.font = 'bold 11px var(--font-body)';
      ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 3;
      const label = dso.ko !== dso.id ? `${dso.id} ${dso.ko}` : dso.id;
      ctx.strokeText(label, pos.x, pos.y + size / 2 + 10);
      ctx.fillText(label, pos.x, pos.y + size / 2 + 10);
    }
  });
}

// ========================================================================
// 11. CONSTELLATION HOVER HIGHLIGHTING
// ========================================================================

function updateConstellationHover(renderedStars, cx, cy, R) {
  if (state.mouseScreenX < 0 || state.mouseScreenY < 0) return;
  if (!state.showLines && !state.showIllustrations) return;
  
  const starMap = {};
  renderedStars.forEach(rs => {
    starMap[rs.star.hip] = rs;
  });
  
  let closestDist = 25; // 25px threshold
  let hoveredConst = null;
  
  state.constellations.forEach(c => {
    if (!c.lines) return;
    
    c.lines.forEach(line => {
      const s1 = starMap[line[0]];
      const s2 = starMap[line[1]];
      if (!s1 || !s2) return;
      
      const d = pointToSegmentDist(state.mouseScreenX, state.mouseScreenY, s1.x, s1.y, s2.x, s2.y);
      if (d < closestDist) {
        closestDist = d;
        hoveredConst = c;
      }
    });
  });
  
  state.hoveredConstellation = hoveredConst;
  
  // Render hover effect
  if (hoveredConst && hoveredConst !== state.selectedConstellation) {
    // Brighten constellation lines
    const starMapLocal = starMap;
    if (hoveredConst.lines) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
      ctx.shadowBlur = 6;
      
      hoveredConst.lines.forEach(line => {
        const s1 = starMapLocal[line[0]];
        const s2 = starMapLocal[line[1]];
        if (s1 && s2) {
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.stroke();
        }
      });
      ctx.shadowBlur = 0;
    }
    
    // Show faint illustration overlay (18% opacity)
    const img = state.images[hoveredConst.name];
    if (img && img.complete && img.naturalWidth !== 0) {
      const lst = getLST(state.obsTime, state.longitude);
      const centerAltAz = raDecToAltAz(hoveredConst.ra, hoveredConst.dec, lst, state.latitude);
      const screenPos = altAzToScreen(centerAltAz.alt, centerAltAz.az, cx, cy, R, 1.0, 0, 0);
      if (screenPos) {
        const northAltAz = raDecToAltAz(hoveredConst.ra, hoveredConst.dec + 0.5, lst, state.latitude);
        const northPos = altAzToScreen(northAltAz.alt, northAltAz.az, cx, cy, R, 1.0, 0, 0);
        if (northPos) {
          const angleNorth = Math.atan2(northPos.y - screenPos.y, northPos.x - screenPos.x);
          const fovRad = state.fov * Math.PI / 180;
          const F = cx / (2 * Math.tan(fovRad / 4));
          const w = (hoveredConst.width_deg * Math.PI / 180) * F;
          const h = (hoveredConst.height_deg * Math.PI / 180) * F;
          
          ctx.save();
          ctx.translate(screenPos.x, screenPos.y);
          const rotation = angleNorth + Math.PI / 2 - (hoveredConst.position_angle * Math.PI / 180);
          ctx.rotate(rotation);
          const scaleX = hoveredConst.flip_h ? -1 : 1;
          const scaleY = hoveredConst.flip_v ? -1 : 1;
          ctx.scale(scaleX, scaleY);
          ctx.globalAlpha = 0.18;
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
        }
      }
    }
  }
}

// Point-to-segment distance helper
function pointToSegmentDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  
  if (lenSq === 0) return Math.sqrt((px - ax) * (px - ax) + (py - ay) * (py - ay));
  
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  
  return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}

// ========================================================================
// 12. MOUSE TRACKING FOR HOVER DETECTION
// ========================================================================

// This is set up in setupGestureControls but we also need passive mousemove tracking
// We'll add it at the end of DOMContentLoaded

// 8. Main Loop
function loop() {
  updatePhysics();
  elements.txtCurrentTime.textContent = formatTime(state.obsTime);
  updateTimeUI();
  render();
  requestAnimationFrame(loop);
}
