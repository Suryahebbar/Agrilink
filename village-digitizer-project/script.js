const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const wrap = document.getElementById('canvasWrap');

const STORAGE_KEY = 'village_plots_v2'; // Increment version for new schema

const img = new Image();
img.src = "village_map_clear.png"; // Use the high-resolution clear image

let imgLoaded = false;
let scale = 1, offsetX = 0, offsetY = 0;
let isPanning = false, panStart = null, spaceDown = false;

let plots = [];              // Array of saved features (polygons and lines)
let currentPoints = [];      // Points of feature currently being drawn (image pixel coordinates)
let selectedPlotId = null;   // Active highlighted plot ID
let tempCrops = [];          // Temporary crop array for the currently open form

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupFormTabs();
  setupDrawingModeToggle();
  setupCropHandlers();
  setupSearch();
  setupAgreementHandlers();

  document.getElementById('cancelEditBtn').addEventListener('click', cancelPlot);

  // Set default agreement date to today
  document.getElementById('ag_date').valueAsDate = new Date();
});

// --- Tab Switching ---
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = 'tab-' + btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');

      if (btn.getAttribute('data-tab') === 'agreement') {
        populateAgreementSelector();
      }
    });
  });
}

// --- Form Section Tabs ---
function setupFormTabs() {
  document.querySelectorAll('.form-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.form-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      const secId = 'form-sec-' + btn.getAttribute('data-form-sec');
      document.getElementById(secId).classList.add('active');
    });
  });
}

// --- Drawing Mode Toggle ---
function setupDrawingModeToggle() {
  const modeSelect = document.getElementById('drawingMode');
  modeSelect.addEventListener('change', () => {
    cancelPlot();
    setStatus(`Switched to ${modeSelect.value === 'polygon' ? 'Land Parcel' : 'Correction Line'} mode. Click on map to place points.`);
  });
}

function getSelectedDrawingMode() {
  return document.getElementById('drawingMode').value;
}

// --- Canvas Resizing & Drawing ---
function resizeCanvas() {
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
  draw();
}
window.addEventListener('resize', resizeCanvas);

img.onload = function () {
  imgLoaded = true;
  // Initial fit-to-screen scaling
  const fitScale = Math.min(wrap.clientWidth / img.width, wrap.clientHeight / img.height) * 0.95;
  scale = fitScale;
  offsetX = (wrap.clientWidth - img.width * scale) / 2;
  offsetY = (wrap.clientHeight - img.height * scale) / 2;
  resizeCanvas();
  loadPlots();
};

function imgToScreen(pt) {
  return [pt[0] * scale + offsetX, pt[1] * scale + offsetY];
}
function screenToImg(x, y) {
  return [(x - offsetX) / scale, (y - offsetY) / scale];
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!imgLoaded) return;

  // Draw Cadastral Map
  ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);

  // Draw Saved Features
  plots.forEach(p => {
    const isSelected = p.id === selectedPlotId;
    const isLine = p.type === 'line';

    let strokeColor = isLine ? 'rgba(216, 67, 21, 0.85)' : 'rgba(46, 125, 50, 0.8)';
    let fillColor = isLine ? 'none' : 'rgba(46, 125, 50, 0.08)';
    let lineWidth = 2;

    if (isSelected) {
      strokeColor = isLine ? '#ff5722' : '#2e7d32';
      fillColor = isLine ? 'none' : 'rgba(46, 125, 50, 0.25)';
      lineWidth = 4;
    }

    const label = isLine ? 'Correction' : p.administrative.survey;
    drawFeature(p.points, strokeColor, fillColor, !isLine, label, lineWidth, isSelected);
  });

  // Draw Current Tracing Feature
  if (currentPoints.length > 0) {
    const isLine = getSelectedDrawingMode() === 'line';
    drawFeature(currentPoints, 'rgba(216, 67, 21, 0.95)', 'rgba(216, 67, 21, 0.08)', false, null, 2.5, false);

    // If drawing polygon and has at least 2 points, draw dashed line back to start
    if (!isLine && currentPoints.length >= 2) {
      ctx.beginPath();
      const [sxStart, syStart] = imgToScreen(currentPoints[0]);
      const [sxEnd, syEnd] = imgToScreen(currentPoints[currentPoints.length - 1]);
      ctx.moveTo(sxEnd, syEnd);
      ctx.lineTo(sxStart, syStart);
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(216, 67, 21, 0.6)';
      ctx.stroke();
      ctx.setLineDash([]); // Reset
    }

    // Draw vertices with index numbers
    currentPoints.forEach((pt, idx) => {
      const [sx, sy] = imgToScreen(pt);
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#d84315';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw point index number
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(idx + 1, sx, sy);
    });
  }
}

function drawFeature(points, strokeColor, fillColor, closed, label, lineWidth = 2, isSelected = false) {
  if (points.length < 2) return;
  ctx.beginPath();
  const [sx0, sy0] = imgToScreen(points[0]);
  ctx.moveTo(sx0, sy0);
  for (let i = 1; i < points.length; i++) {
    const [sx, sy] = imgToScreen(points[i]);
    ctx.lineTo(sx, sy);
  }
  if (closed) ctx.closePath();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeColor;
  ctx.stroke();

  if (closed && fillColor !== 'none') {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  if (label) {
    // Calculate centroid for polygon label placement or midpoint for line label
    let cx = 0, cy = 0;
    if (closed) {
      const c = getCentroid(points);
      cx = c[0];
      cy = c[1];
    } else {
      const midIdx = Math.floor(points.length / 2);
      cx = points[midIdx][0];
      cy = points[midIdx][1];
    }

    const [sx, sy] = imgToScreen([cx, cy]);
    ctx.font = isSelected ? 'bold 14px "Plus Jakarta Sans", sans-serif' : '500 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = isSelected ? '#1b5e20' : '#d84315';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text background shadow
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'white';
    ctx.strokeText(label, sx, sy);
    ctx.fillText(label, sx, sy);
  }
}

// --- Interaction & Event Handlers ---
let wasPanning = false;

canvas.addEventListener('click', (e) => {
  if (e.button !== 0) return; // Only left click
  if (wasPanning) {
    wasPanning = false; // Reset flag and ignore click
    return;
  }
  if (isPanning) return;
  if (document.getElementById('formArea').style.display === 'block') return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const pt = screenToImg(x, y);

  currentPoints.push(pt);
  updateStatus();
  draw();
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 2 || spaceDown) {
    isPanning = true;
    wasPanning = false;
    panStart = [e.clientX - offsetX, e.clientY - offsetY];
  } else if (e.button === 0) {
    wasPanning = false; // Reset flag on any normal left click
  }
});

window.addEventListener('mouseup', () => {
  if (isPanning) {
    isPanning = false;
    // wasPanning remains true if we moved in mousemove, so the subsequent click is ignored.
  }
});

window.addEventListener('mousemove', (e) => {
  if (isPanning && panStart) {
    wasPanning = true;
    offsetX = e.clientX - panStart[0];
    offsetY = e.clientY - panStart[1];
    draw();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    spaceDown = true;
    canvas.style.cursor = 'grab';
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    finishPlot();
  }
  if (e.key === 'Escape') cancelPlot();
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    spaceDown = false;
    canvas.style.cursor = 'crosshair';
  }
});

wrap.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const imgPt = screenToImg(mx, my);
  const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
  scale *= zoomFactor;
  scale = Math.max(0.02, Math.min(scale, 20));
  offsetX = mx - imgPt[0] * scale;
  offsetY = my - imgPt[1] * scale;
  draw();
}, { passive: false });

document.getElementById('undoPointBtn').addEventListener('click', () => {
  currentPoints.pop();
  updateStatus();
  draw();
});
document.getElementById('cancelBtn').addEventListener('click', cancelPlot);
document.getElementById('finishBtn').addEventListener('click', finishPlot);

function cancelPlot() {
  currentPoints = [];
  document.getElementById('formArea').style.display = 'none';
  tempCrops = [];
  editingPlotId = null;
  document.getElementById('savePlotBtn').textContent = 'Save Feature';
  document.getElementById('cancelEditBtn').style.display = 'none';
  renderCropsTable();
  updateStatus();
  draw();
}

function updateStatus() {
  const mode = getSelectedDrawingMode();
  const minPoints = mode === 'polygon' ? 3 : 2;
  const name = mode === 'polygon' ? 'Land Parcel' : 'Correction Line';

  if (currentPoints.length === 0) {
    setStatus(`Ready to draw a ${name}. Left-click on the map to place vertices.`);
  } else if (currentPoints.length < minPoints) {
    setStatus(`${currentPoints.length} point(s) placed. Need at least ${minPoints} points to finish.`);
  } else {
    setStatus(`${currentPoints.length} point(s) placed. Click more vertices or press Enter / click "Finish Feature".`);
  }
}

function setStatus(msg) {
  document.getElementById('status').textContent = msg;
}

// --- GIS Calculations ---
function getCentroid(pts) {
  const n = pts.length;
  if (n === 0) return [0, 0];
  if (n < 3) {
    let sx = 0, sy = 0;
    pts.forEach(p => { sx += p[0]; sy += p[1]; });
    return [sx / n, sy / n];
  }
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < n; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const factor = (p1[0] * p2[1] - p2[0] * p1[1]);
    area += factor;
    cx += (p1[0] + p2[0]) * factor;
    cy += (p1[1] + p2[1]) * factor;
  }
  area = area * 0.5;
  if (Math.abs(area) < 1e-5) {
    let sx = 0, sy = 0;
    pts.forEach(p => { sx += p[0]; sy += p[1]; });
    return [sx / n, sy / n];
  }
  cx = cx / (6 * area);
  cy = cy / (6 * area);
  return [Math.round(cx * 100) / 100, Math.round(cy * 100) / 100];
}

function calculateArea(pts) {
  const n = pts.length;
  if (n < 3) return 0;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    area += (p1[0] * p2[1] - p2[0] * p1[1]);
  }
  return Math.round(Math.abs(area * 0.5) * 100) / 100;
}

function getBoundingBox(pts) {
  if (pts.length === 0) return [0, 0, 0, 0];
  let minX = pts[0][0], maxX = pts[0][0];
  let minY = pts[0][1], maxY = pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return [Math.round(minX), Math.round(minY), Math.round(maxX), Math.round(maxY)];
}

function getPerimeter(pts, closed) {
  if (pts.length < 2) return 0;
  let perim = 0;
  const limit = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < limit; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    perim += Math.sqrt(dx * dx + dy * dy);
  }
  return Math.round(perim * 100) / 100;
}

function getSideLengths(pts, closed) {
  if (pts.length < 2) return [];
  const lengths = [];
  const limit = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < limit; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    lengths.push(Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100);
  }
  return lengths;
}

// --- Finish Tracing and Open Form ---
function finishPlot() {
  const mode = getSelectedDrawingMode();
  const isLine = mode === 'line';
  const minPoints = isLine ? 2 : 3;

  if (currentPoints.length < minPoints) {
    setStatus(`Cannot finish. Need at least ${minPoints} points.`);
    return;
  }

  // Pre-calculate GIS fields
  const centroid = getCentroid(currentPoints);
  const bbox = getBoundingBox(currentPoints);
  const area = isLine ? 0 : calculateArea(currentPoints);
  const perimeter = getPerimeter(currentPoints, !isLine);
  const sideLengths = getSideLengths(currentPoints, !isLine);

  // Format coordinate array
  const coordinates = isLine ? currentPoints : [[...currentPoints, currentPoints[0]]];
  const geojsonFeature = {
    type: "Feature",
    geometry: {
      type: isLine ? "LineString" : "Polygon",
      coordinates: coordinates
    }
  };

  // Populate GIS fields
  document.getElementById('f_geojson').value = JSON.stringify(geojsonFeature.geometry);
  document.getElementById('f_centroid').value = centroid.join(', ');
  document.getElementById('f_bbox').value = `(${bbox[0]}, ${bbox[1]}) to (${bbox[2]}, ${bbox[3]})`;
  document.getElementById('f_pixel_area').value = isLine ? 'N/A (LineString)' : `${area} sq px`;
  document.getElementById('f_pixel_perimeter').value = `${perimeter} px`;
  document.getElementById('f_side_lengths').value = JSON.stringify(sideLengths);

  // Setup UI tabs / fields depending on Line vs Polygon
  document.getElementById('formTitle').textContent = isLine ? 'Correction Line Details' : 'Land Parcel Details';

  const formTabCrops = document.querySelector('.form-tab-btn[data-form-sec="crops-sec"]');
  const formTabOwner = document.querySelector('.form-tab-btn[data-form-sec="owner-sec"]');
  const formTabLand = document.querySelector('.form-tab-btn[data-form-sec="land-sec"]');

  if (isLine) {
    formTabCrops.style.display = 'none';
    formTabOwner.style.display = 'none';
    formTabLand.style.display = 'none';

    // default/optional survey no for lines
    document.getElementById('f_survey').value = 'Correction_' + Date.now().toString().slice(-4);
  } else {
    formTabCrops.style.display = 'inline-block';
    formTabOwner.style.display = 'inline-block';
    formTabLand.style.display = 'inline-block';

    // clear default values for polygon
    document.getElementById('f_survey').value = '';
    
    // Set default address, latitude, and longitude
    document.getElementById('f_address').value = 'CHIKSIKENCHIGUDDE, Kudumallige, Thirthahalli, Shivamogga, 577234.';
    document.getElementById('f_latitude').value = 13.6828;
    document.getElementById('f_longitude').value = 75.2104;
  }

  // Switch form to Admin section
  document.querySelector('.form-tab-btn[data-form-sec="admin-sec"]').click();

  // Reveal Form
  document.getElementById('formArea').style.display = 'block';
  document.getElementById('f_survey').focus();
  setStatus('Feature ready. Complete the form details below and click "Save Feature".');
}

// --- Crop Form Details Array management ---
function setupCropHandlers() {
  document.getElementById('addCropBtn').addEventListener('click', () => {
    const name = document.getElementById('c_name').value.trim();
    const season = document.getElementById('c_season').value.trim();
    const area = document.getElementById('c_area').value.trim();
    const landUse = document.getElementById('c_land_use').value;
    const irrigation = document.getElementById('c_irrigation').value.trim();

    if (!name) {
      alert('Please enter a crop name');
      return;
    }

    tempCrops.push({
      name: name,
      season: season || ' - ',
      area: area || ' - ',
      land_use: landUse,
      irrigation: irrigation || ' - '
    });

    // Reset fields
    document.getElementById('c_name').value = '';
    document.getElementById('c_season').value = '';
    document.getElementById('c_area').value = '';
    document.getElementById('c_irrigation').value = '';

    renderCropsTable();
  });
}

function renderCropsTable() {
  const tbody = document.querySelector('#cropsTable tbody');
  tbody.innerHTML = '';
  tempCrops.forEach((c, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(c.name)}</strong></td>
      <td>${escapeHtml(c.season)}</td>
      <td>${escapeHtml(c.area)}</td>
      <td><button type="button" class="del-crop-btn danger small-btn" data-index="${idx}"></button></td>
    `;
    tbody.appendChild(tr);
  });

  // Attach deletion handlers
  tbody.querySelectorAll('.del-crop-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      tempCrops.splice(idx, 1);
      renderCropsTable();
    });
  });
}

let editingPlotId = null;

// --- Save Plot Feature ---
document.getElementById('savePlotBtn').addEventListener('click', () => {
  const survey = document.getElementById('f_survey').value.trim();
  if (!survey) {
    setStatus('Survey number is required.');
    document.querySelector('.form-tab-btn[data-form-sec="admin-sec"]').click();
    document.getElementById('f_survey').focus();
    return;
  }

  const mode = getSelectedDrawingMode();
  const isLine = mode === 'line';

  if (editingPlotId) {
    // Editing an existing plot
    const idx = plots.findIndex(p => p.id === editingPlotId);
    if (idx !== -1) {
      const existing = plots[idx];
      const pointsUpdated = currentPoints.length > 0;
      
      plots[idx] = {
        id: existing.id,
        type: existing.type,
        points: pointsUpdated ? currentPoints.slice() : existing.points,
        administrative: {
          district: document.getElementById('f_district').value.trim(),
          taluk: document.getElementById('f_taluk').value.trim(),
          hobli: document.getElementById('f_hobli').value.trim(),
          village: document.getElementById('f_village').value.trim(),
          survey: survey,
          surnoc: document.getElementById('f_surnoc').value.trim(),
          hissa: document.getElementById('f_hissa').value.trim(),
          ulpin: document.getElementById('f_ulpin').value.trim(),
          olc: document.getElementById('f_olc').value.trim()
        },
        owner: isLine ? {} : {
          name: document.getElementById('f_owner').value.trim(),
          father: document.getElementById('f_father').value.trim(),
          khata: document.getElementById('f_khata').value.trim(),
          ownership_type: document.getElementById('f_ownership_type').value,
          address: document.getElementById('f_address').value.trim()
        },
        land: isLine ? {} : {
          total_area: document.getElementById('f_total_area').value.trim(),
          cultivable_area: document.getElementById('f_cultivable_area').value.trim(),
          pot_kharab_a: document.getElementById('f_pot_kharab_a').value.trim(),
          pot_kharab_b: document.getElementById('f_pot_kharab_b').value.trim(),
          revenue: document.getElementById('f_revenue').value.trim(),
          jodi: document.getElementById('f_jodi').value.trim(),
          cess: document.getElementById('f_cess').value.trim(),
          water_rate: document.getElementById('f_water_rate').value.trim(),
          soil: document.getElementById('f_soil').value.trim(),
          land_type: document.getElementById('f_land_type').value,
          irrigation_source: document.getElementById('f_irrigation_source').value.trim(),
          trees: document.getElementById('f_trees').value.trim()
        },
        gis: pointsUpdated ? {
          geojson_geom: JSON.parse(document.getElementById('f_geojson').value || '{}'),
          centroid: getCentroid(currentPoints),
          bbox: getBoundingBox(currentPoints),
          area: isLine ? 0 : calculateArea(currentPoints),
          perimeter: getPerimeter(currentPoints, !isLine),
          side_lengths: getSideLengths(currentPoints, !isLine),
          latitude: parseFloat(document.getElementById('f_latitude').value) || null,
          longitude: parseFloat(document.getElementById('f_longitude').value) || null
        } : existing.gis,
        crops: isLine ? [] : tempCrops.slice()
      };
      
      setStatus(`Updated land parcel ${survey} details.`);
    }
    
    editingPlotId = null;
    document.getElementById('savePlotBtn').textContent = 'Save Feature';
  } else {
    // Saving a new plot
    const feature = {
      id: (isLine ? 'line_' : 'plot_') + Date.now(),
      type: mode,
      points: currentPoints.slice(),
      administrative: {
        district: document.getElementById('f_district').value.trim(),
        taluk: document.getElementById('f_taluk').value.trim(),
        hobli: document.getElementById('f_hobli').value.trim(),
        village: document.getElementById('f_village').value.trim(),
        survey: survey,
        surnoc: document.getElementById('f_surnoc').value.trim(),
        hissa: document.getElementById('f_hissa').value.trim(),
        ulpin: document.getElementById('f_ulpin').value.trim(),
        olc: document.getElementById('f_olc').value.trim()
      },
      owner: isLine ? {} : {
        name: document.getElementById('f_owner').value.trim(),
        father: document.getElementById('f_father').value.trim(),
        khata: document.getElementById('f_khata').value.trim(),
        ownership_type: document.getElementById('f_ownership_type').value,
        address: document.getElementById('f_address').value.trim()
      },
      land: isLine ? {} : {
        total_area: document.getElementById('f_total_area').value.trim(),
        cultivable_area: document.getElementById('f_cultivable_area').value.trim(),
        pot_kharab_a: document.getElementById('f_pot_kharab_a').value.trim(),
        pot_kharab_b: document.getElementById('f_pot_kharab_b').value.trim(),
        revenue: document.getElementById('f_revenue').value.trim(),
        jodi: document.getElementById('f_jodi').value.trim(),
        cess: document.getElementById('f_cess').value.trim(),
        water_rate: document.getElementById('f_water_rate').value.trim(),
        soil: document.getElementById('f_soil').value.trim(),
        land_type: document.getElementById('f_land_type').value,
        irrigation_source: document.getElementById('f_irrigation_source').value.trim(),
        trees: document.getElementById('f_trees').value.trim()
      },
      gis: {
        geojson_geom: JSON.parse(document.getElementById('f_geojson').value || '{}'),
        centroid: getCentroid(currentPoints),
        bbox: getBoundingBox(currentPoints),
        area: isLine ? 0 : calculateArea(currentPoints),
        perimeter: getPerimeter(currentPoints, !isLine),
        side_lengths: getSideLengths(currentPoints, !isLine),
        latitude: parseFloat(document.getElementById('f_latitude').value) || null,
        longitude: parseFloat(document.getElementById('f_longitude').value) || null
      },
      crops: isLine ? [] : tempCrops.slice()
    };
    plots.push(feature);
    setStatus(`Saved ${isLine ? 'Correction Line' : 'Land Parcel ' + survey}. Click map to draw next.`);
  }

  // Clean up
  currentPoints = [];
  tempCrops = [];
  document.getElementById('formArea').style.display = 'none';

  // Reset form inputs (keep default admin locations)
  ['f_survey', 'f_surnoc', 'f_hissa', 'f_ulpin', 'f_olc',
    'f_owner', 'f_father', 'f_khata', 'f_address',
    'f_total_area', 'f_cultivable_area', 'f_pot_kharab_a', 'f_pot_kharab_b', 'f_revenue', 'f_jodi', 'f_cess', 'f_water_rate', 'f_soil', 'f_irrigation_source', 'f_trees',
    'f_latitude', 'f_longitude'].forEach(id => document.getElementById(id).value = '');

  savePlots();
  renderPlotList();
  draw();
});

// --- Database & Filter Logic ---
function setupSearch() {
  document.getElementById('searchBox').addEventListener('input', () => {
    renderPlotList();
  });
}

function renderPlotList() {
  const query = document.getElementById('searchBox').value.toLowerCase().trim();
  const list = document.getElementById('plotList');
  list.innerHTML = '';

  const filtered = plots.filter(p => {
    if (!query) return true;
    const survey = p.administrative.survey.toLowerCase();
    const ownerName = p.owner.name ? p.owner.name.toLowerCase() : '';
    const village = p.administrative.village.toLowerCase();
    const district = p.administrative.district.toLowerCase();
    const type = p.type.toLowerCase();
    return survey.includes(query) || ownerName.includes(query) || village.includes(query) || district.includes(query) || type.includes(query);
  });

  filtered.slice().reverse().forEach(p => {
    const isLine = p.type === 'line';
    const row = document.createElement('div');
    row.className = `plotRow ${isLine ? 'correction-line-row' : 'land-parcel-row'} ${p.id === selectedPlotId ? 'selected-row' : ''}`;

    let metaText = '';
    if (isLine) {
      metaText = `LineString · ${p.gis.perimeter} px length`;
    } else {
      metaText = `${p.owner.name || 'No Owner'} · Extent: ${p.land.total_area || ' - '} · ${p.crops.length} Crop(s)`;
    }

    row.innerHTML = `
      <div>
        <div style="display:flex; align-items:center;">
          <span class="sn">${escapeHtml(p.administrative.survey)}</span>
          <span class="badge ${isLine ? 'line' : 'parcel'}">${isLine ? 'line' : 'parcel'}</span>
        </div>
        <div class="meta">${escapeHtml(metaText)}</div>
      </div>
      <div style="display:flex; align-items:center; gap:6px;">
        <button class="edit-info" data-id="${p.id}" style="border:none; background:none; padding:4px; font-size:16px; cursor:pointer;"></button>
        <button class="del" data-id="${p.id}" style="border:none; background:none; padding:4px; font-size:16px; cursor:pointer;"></button>
      </div>
    `;

    // Highlight & Pan on click
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('del') || e.target.classList.contains('edit-info')) return;
      selectAndCenterFeature(p);
    });

    list.appendChild(row);
  });

  // Attach edit button click handlers
  list.querySelectorAll('.edit-info').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const p = plots.find(plot => plot.id === id);
      if (!p) return;
      
      editingPlotId = p.id;
      document.getElementById('savePlotBtn').textContent = 'Update Feature';
      document.getElementById('cancelEditBtn').style.display = 'inline-block';
      
      // Load administrative details
      document.getElementById('f_district').value = p.administrative.district || 'Shivamogga';
      document.getElementById('f_taluk').value = p.administrative.taluk || 'Thirthahalli';
      document.getElementById('f_hobli').value = p.administrative.hobli || 'Mandagadde';
      document.getElementById('f_village').value = p.administrative.village || 'CHIKSIKENCHIGUDDE';
      document.getElementById('f_survey').value = p.administrative.survey || '';
      document.getElementById('f_surnoc').value = p.administrative.surnoc || '';
      document.getElementById('f_hissa').value = p.administrative.hissa || '';
      document.getElementById('f_ulpin').value = p.administrative.ulpin || '';
      document.getElementById('f_olc').value = p.administrative.olc || '';
      
      // Load owner details
      if (p.owner) {
        document.getElementById('f_owner').value = p.owner.name || '';
        document.getElementById('f_father').value = p.owner.father || '';
        document.getElementById('f_khata').value = p.owner.khata || '';
        document.getElementById('f_ownership_type').value = p.owner.ownership_type || 'Patta';
        document.getElementById('f_address').value = p.owner.address || '';
      }
      
      // Load land details
      if (p.land) {
        document.getElementById('f_total_area').value = p.land.total_area || '';
        document.getElementById('f_cultivable_area').value = p.land.cultivable_area || '';
        document.getElementById('f_pot_kharab_a').value = p.land.pot_kharab_a || '';
        document.getElementById('f_pot_kharab_b').value = p.land.pot_kharab_b || '';
        document.getElementById('f_revenue').value = p.land.revenue || '';
        document.getElementById('f_jodi').value = p.land.jodi || '';
        document.getElementById('f_cess').value = p.land.cess || '';
        document.getElementById('f_water_rate').value = p.land.water_rate || '';
        document.getElementById('f_soil').value = p.land.soil || '';
        document.getElementById('f_land_type').value = p.land.land_type || 'Dry';
        document.getElementById('f_irrigation_source').value = p.land.irrigation_source || '';
        document.getElementById('f_trees').value = p.land.trees || '';
      }
      
      // Load GIS fields
      if (p.gis) {
        document.getElementById('f_geojson').value = p.gis.geojson_geom ? JSON.stringify(p.gis.geojson_geom) : '{}';
        document.getElementById('f_centroid').value = p.gis.centroid ? p.gis.centroid.join(', ') : '';
        document.getElementById('f_bbox').value = p.gis.bbox ? `(${p.gis.bbox[0]}, ${p.gis.bbox[1]}) to (${p.gis.bbox[2]}, ${p.gis.bbox[3]})` : '';
        document.getElementById('f_pixel_area').value = p.type === 'line' ? 'N/A (LineString)' : `${p.gis.area} sq px`;
        document.getElementById('f_pixel_perimeter').value = `${p.gis.perimeter} px`;
        document.getElementById('f_side_lengths').value = JSON.stringify(p.gis.side_lengths || []);
        document.getElementById('f_latitude').value = p.gis.latitude || '';
        document.getElementById('f_longitude').value = p.gis.longitude || '';
      }
      
      currentPoints = p.points ? p.points.slice() : [];
      tempCrops = p.crops ? p.crops.slice() : [];
      renderCropsTable();
      
      // Show form tab area
      document.getElementById('formArea').style.display = 'block';
      document.querySelector('.tab-btn[data-tab="digitize"]').click();
      document.querySelector('.form-tab-btn[data-form-sec="admin-sec"]').click();
      
      setStatus(`Editing parcel Survey ${p.administrative.survey}. Draw on canvas to redraw coordinates, or edit details and click Update.`);
      draw();
    });
  });

  // Attach delete button click handlers
  list.querySelectorAll('.del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (confirm('Delete this feature?')) {
        plots = plots.filter(p => p.id !== id);
        if (selectedPlotId === id) selectedPlotId = null;
        if (editingPlotId === id) {
          editingPlotId = null;
          document.getElementById('savePlotBtn').textContent = 'Save Feature';
        }
        savePlots();
        renderPlotList();
        draw();
      }
    });
  });

  const parcelCount = plots.filter(p => p.type === 'polygon').length;
  const lineCount = plots.filter(p => p.type === 'line').length;
  document.getElementById('countLabel').textContent = `${parcelCount} parcel(s), ${lineCount} correction line(s) saved`;
}

function selectAndCenterFeature(p) {
  selectedPlotId = p.id;
  document.querySelectorAll('.plotRow').forEach(r => r.classList.remove('selected-row'));

  // Center on its centroid
  const centroid = p.gis.centroid;
  const viewWidth = wrap.clientWidth;
  const viewHeight = wrap.clientHeight;

  // Make active focus zoom scale a bit higher to show clearly
  scale = 0.8;
  offsetX = viewWidth / 2 - centroid[0] * scale;
  offsetY = viewHeight / 2 - centroid[1] * scale;

  draw();
  renderPlotList();
}

// --- Export GeoJSON ---
document.getElementById('exportBtn').addEventListener('click', () => {
  const geojson = {
    type: "FeatureCollection",
    features: plots.map(p => {
      const isLine = p.type === 'line';
      return {
        type: "Feature",
        id: p.id,
        properties: {
          feature_type: p.type,
          administrative: p.administrative,
          owner: p.owner,
          land_content: p.land,
          gis_computed: {
            centroid: p.gis.centroid,
            bbox: p.gis.bbox,
            area_px: p.gis.area,
            perimeter_px: p.gis.perimeter,
            side_lengths_px: p.gis.side_lengths,
            latitude_ref: p.gis.latitude,
            longitude_ref: p.gis.longitude
          },
          crops: p.crops
        },
        geometry: p.gis.geojson_geom
      };
    }),
    _source_image_size: { width: img.width, height: img.height }
  };

  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'agrilink_farm_database.geojson';
  a.click();
});

// --- Sync to AgriLink Database ---
document.getElementById('syncBtn').addEventListener('click', async () => {
  if (plots.length === 0) {
    alert('No plots to sync. Please draw and save some features first.');
    return;
  }
  
  setStatus('Syncing plots with AgriLink Database...');
  
  try {
    const formattedPlots = plots.map(p => {
      const isLine = p.type === 'line';
      return {
        id: p.id,
        type: p.type,
        points: p.points,
        administrative: p.administrative,
        owner: p.owner,
        land: p.land,
        gis: {
          geojson_geom: p.gis.geojson_geom,
          centroid: p.gis.centroid,
          bbox: p.gis.bbox,
          area: p.gis.area,
          perimeter: p.gis.perimeter,
          side_lengths: p.gis.side_lengths,
          latitude: p.gis.latitude,
          longitude: p.gis.longitude
        },
        crops: p.crops
      };
    });

    const res = await fetch('http://localhost:3000/api/digitizer/plots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formattedPlots)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      alert(`Sync successful! ${data.message}`);
      setStatus(`Synced ${plots.length} features with AgriLink database.`);
    } else {
      alert(`Sync failed: ${data.error || 'Unknown error'}`);
      setStatus(`Sync failed: ${data.error || 'Server error'}`);
    }
  } catch (err) {
    console.error('Error syncing plots:', err);
    alert('Sync failed. Please ensure the AgriLink server is running.');
    setStatus('Sync failed: Network error.');
  }
});

// --- Clear Database ---
document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Are you sure you want to delete ALL data? This will clear all parcels and lines.')) return;
  plots = [];
  selectedPlotId = null;
  savePlots();
  renderPlotList();
  draw();
  setStatus('Database cleared.');
});

// --- Persistence ---
function savePlots() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plots));
  } catch (err) {
    console.error('Localstorage save failed', err);
    setStatus('Warning: could not save progress locally (quota exceeded).');
  }
}

function loadPlots() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      plots = JSON.parse(raw);
      renderPlotList();
      draw();
    }
  } catch (err) {
    console.error('Localstorage load failed', err);
  }
}

// --- Agreement Handlers & Compilation ---
function populateAgreementSelector() {
  const container = document.getElementById('agreementParcelSelector');
  container.innerHTML = '';

  const polygons = plots.filter(p => p.type === 'polygon');
  if (polygons.length === 0) {
    container.innerHTML = '<div style="font-size:12px; color:var(--text-muted); padding:8px;">No land parcels available. Trace and save some parcels first.</div>';
    return;
  }

  polygons.forEach(p => {
    const div = document.createElement('div');
    div.className = 'parcel-checkbox-item';
    div.innerHTML = `
      <input type="checkbox" id="chk_${p.id}" value="${p.id}" />
      <label for="chk_${p.id}">Survey No. ${escapeHtml(p.administrative.survey)} (${escapeHtml(p.owner.name || 'Unknown Owner')})</label>
    `;
    container.appendChild(div);
  });
}

function setupAgreementHandlers() {
  const modal = document.getElementById('agreementModal');
  const generateBtn = document.getElementById('generateAgreementBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');

  generateBtn.addEventListener('click', () => {
    // Collect checked parcels
    const checkedBoxes = document.querySelectorAll('#agreementParcelSelector input[type="checkbox"]:checked');
    if (checkedBoxes.length === 0) {
      alert('Please select at least one land parcel to integrate.');
      return;
    }

    const selectedIds = Array.from(checkedBoxes).map(cb => cb.value);
    const selectedParcels = plots.filter(p => selectedIds.includes(p.id));

    compileAgreement(selectedParcels);
    modal.classList.add('active');
  });

  closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });
}

function compileAgreement(parcels) {
  const firstParty = document.getElementById('ag_first_party').value.trim() || 'Agrilink Farm Services Ltd.';
  const secondParty = document.getElementById('ag_second_party').value.trim() || 'Lead Farmer';
  const rawDate = document.getElementById('ag_date').value;
  const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN');
  const termsText = document.getElementById('ag_terms').value;

  // Render Table of Integrated Lands
  let tableRows = '';
  parcels.forEach((p, index) => {
    const cropsText = p.crops.map(c => `${c.name} (${c.area})`).join(', ') || 'None';
    tableRows += `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${escapeHtml(p.administrative.survey)}</strong> / Surnoc ${escapeHtml(p.administrative.surnoc || ' - ')} / Hissa ${escapeHtml(p.administrative.hissa || ' - ')}</td>
        <td>${escapeHtml(p.administrative.village)} / ${escapeHtml(p.administrative.hobli)}</td>
        <td>${escapeHtml(p.owner.name)}</td>
        <td>${escapeHtml(p.land.total_area || ' - ')} (${escapeHtml(p.land.land_type || 'Dry')})</td>
        <td>${escapeHtml(cropsText)}</td>
      </tr>
    `;
  });

  const printout = document.getElementById('agreementPrintout');
  printout.innerHTML = `
    <div class="agreement-header">
      <div class="logo" style="font-size:26px; color:#1b5e20;">AGRILINK</div>
      <h3 class="agreement-title">Agreement of Land Integration</h3>
      <div class="agreement-meta">Dated: ${escapeHtml(dateStr)} | Executed at Koppa Hobli, Karnataka</div>
    </div>
    
    <p>This Agreement is made on this <strong>${escapeHtml(dateStr)}</strong> by and between:</p>
    <p style="margin-bottom:12px;"><strong>PARTY OF THE FIRST PART (Integrator):</strong> <strong>${escapeHtml(firstParty)}</strong>, represented by its authorized signatory.</p>
    <p style="margin-bottom:12px;"><strong>PARTY OF THE SECOND PART (Consortium/Farmer):</strong> <strong>${escapeHtml(secondParty)}</strong>, being the lawful owner(s) or lessee(s) of the land parcels hereinafter described.</p>
    
    <div class="agreement-section">
      <h4>1. Description of Integrated Lands</h4>
      <p>The Second Party agrees to integrate the following land parcels for cooperative crop cultivation and tech-enabled farming services:</p>
      <table class="agreement-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Survey/Hissa No</th>
            <th>Village/Hobli</th>
            <th>Registered Owner</th>
            <th>Extent</th>
            <th>Active Crops</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>

    <div class="agreement-section" style="page-break-inside: avoid;">
      <h4>2. Definitive Digital Sketch Boundary</h4>
      <p>The integrated parcel boundary, generated from the digitized grama naksha boundary coordinates, is detailed below. The parties agree that this geometry defines the digital workspace for Agrilink drone surveys and collective farming:</p>
      <div class="sketch-container">
        <canvas id="sketchCanvas" class="sketch-canvas" width="600" height="350"></canvas>
        <div class="sketch-caption">Digital boundary outline showing merged plots (Survey Nos: ${parcels.map(p => p.administrative.survey).join(', ')})</div>
      </div>
    </div>

    <div class="agreement-section" style="page-break-inside: avoid;">
      <h4>3. Terms and Conditions</h4>
      <p style="white-space: pre-wrap; font-size:12.5px;">${escapeHtml(termsText)}</p>
    </div>

    <div class="signatures" style="page-break-inside: avoid;">
      <div class="sig-box">
        <strong>First Party Signatory</strong><br>
        For ${escapeHtml(firstParty)}<br>
        <span style="font-size:10px; color:#888; margin-top:20px; display:inline-block;">(Signature & Stamp)</span>
      </div>
      <div class="sig-box">
        <strong>Second Party Signatory</strong><br>
        Consortium Member / Lead Owner<br>
        <span style="font-size:10px; color:#888; margin-top:20px; display:inline-block;">(Signature)</span>
      </div>
    </div>
  `;

  // Draw the custom merged digital sketch!
  setTimeout(() => {
    renderDigitalSketch(parcels);
  }, 100);
}

function renderDigitalSketch(parcels) {
  const sCanvas = document.getElementById('sketchCanvas');
  if (!sCanvas) return;
  const sCtx = sCanvas.getContext('2d');

  // Clear sketch canvas
  sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);

  // Draw grid pattern for professional look
  sCtx.strokeStyle = '#eef3ee';
  sCtx.lineWidth = 1;
  const gridSize = 30;
  for (let x = 0; x < sCanvas.width; x += gridSize) {
    sCtx.beginPath();
    sCtx.moveTo(x, 0);
    sCtx.lineTo(x, sCanvas.height);
    sCtx.stroke();
  }
  for (let y = 0; y < sCanvas.height; y += gridSize) {
    sCtx.beginPath();
    sCtx.moveTo(0, y);
    sCtx.lineTo(sCanvas.width, y);
    sCtx.stroke();
  }

  // Calculate bounding box of SELECTED parcels
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  parcels.forEach(p => {
    p.points.forEach(pt => {
      if (pt[0] < minX) minX = pt[0];
      if (pt[0] > maxX) maxX = pt[0];
      if (pt[1] < minY) minY = pt[1];
      if (pt[1] > maxY) maxY = pt[1];
    });
  });

  const width = maxX - minX;
  const height = maxY - minY;
  if (width <= 0 || height <= 0) return;

  // Fit into canvas with padding
  const padding = 40;
  const drawW = sCanvas.width - padding * 2;
  const drawH = sCanvas.height - padding * 2;
  const sScale = Math.min(drawW / width, drawH / height);

  const sOffsetX = (sCanvas.width - width * sScale) / 2;
  const sOffsetY = (sCanvas.height - height * sScale) / 2;

  function sketchToScreen(pt) {
    return [
      (pt[0] - minX) * sScale + sOffsetX,
      (pt[1] - minY) * sScale + sOffsetY
    ];
  }

  // Draw each selected parcel polygon
  parcels.forEach((p, idx) => {
    const pts = p.points;
    if (pts.length < 3) return;

    sCtx.beginPath();
    const [x0, y0] = sketchToScreen(pts[0]);
    sCtx.moveTo(x0, y0);
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = sketchToScreen(pts[i]);
      sCtx.lineTo(x, y);
    }
    sCtx.closePath();

    // Transparent fills for overlay
    sCtx.fillStyle = 'rgba(46, 125, 50, 0.15)';
    sCtx.fill();

    sCtx.lineWidth = 3;
    sCtx.strokeStyle = '#2e7d32';
    sCtx.stroke();

    // Label Survey No at Centroid
    const c = getCentroid(pts);
    const [sx, sy] = sketchToScreen(c);
    sCtx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    sCtx.fillStyle = '#1b5e20';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';

    sCtx.lineWidth = 3;
    sCtx.strokeStyle = '#ffffff';
    sCtx.strokeText(p.administrative.survey, sx, sy);
    sCtx.fillText(p.administrative.survey, sx, sy);
  });
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
