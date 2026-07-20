// farmland_tool.js
// COMPLETE corrected tool: scales polygon, computes AREA-WEIGHTED centroid in meters,
// recenters polygon so centroid equals given centroid, converts to lat/lon and exports GeoJSON.

// === tiny DOM helpers ===
function make(tag, attrs={}, parent=document.body){
  const e = document.createElement(tag);
  for(const k in attrs) if(k !== 'text') e.setAttribute(k, attrs[k]);
  if(attrs.text) e.textContent = attrs.text;
  parent.appendChild(e);
  return e;
}

// === geo helpers ===
// convert east(dx), north(dy) meters to lat/lon (approx for local areas)
function addMeters(lat, lon, dx, dy){
  const R = 6378137;
  const newLat = lat + (dy / R) * (180/Math.PI);
  const newLon = lon + (dx / (R * Math.cos(lat * Math.PI/180))) * (180/Math.PI);
  return [newLat, newLon];
}

// area-weighted centroid for polygon in planar coordinates (x=east, y=north)
// input: points array [[x0,y0],[x1,y1],...], polygon must be closed OR will be closed here
function polygonCentroidMeters(pts){
  const n = pts.length;
  if(n < 3) return [0,0];
  // ensure closed
  const P = pts.slice();
  if(P[0][0] !== P[P.length-1][0] || P[0][1] !== P[P.length-1][1]) P.push([P[0][0], P[0][1]]);

  let A = 0; let Cx = 0; let Cy = 0;
  for(let i=0;i<P.length-1;i++){
    const x0 = P[i][0], y0 = P[i][1];
    const x1 = P[i+1][0], y1 = P[i+1][1];
    const cross = x0*y1 - x1*y0;
    A += cross;
    Cx += (x0 + x1) * cross;
    Cy += (y0 + y1) * cross;
  }
  A = A / 2.0;
  if(Math.abs(A) < 1e-9) {
    // fallback to mean
    let sx=0, sy=0;
    for(let p of pts){ sx+=p[0]; sy+=p[1]; }
    return [sx/pts.length, sy/pts.length];
  }
  Cx = Cx / (6*A);
  Cy = Cy / (6*A);
  return [Cx, Cy];
}

// convert feet->meters if needed
function toMetersList(arr, unit){
  if(unit === 'feet') return arr.map(v => v * 0.3048);
  return arr.slice();
}

// --- Build UI (same layout as before) ---
const wrap = make('div',{style:'display:flex;gap:12px;padding:12px;font-family:Arial;'});
const left = make('div',{style:'width:520px;'},wrap);
const right = make('div',{style:'flex:1;'},wrap);

// canvas area
make('h3',{text:'Sketch (click vertices in order)'}, left);
const fileInput = make('input',{type:'file', accept:'image/*', style:'width:100%;'}, left);
const canvas = make('canvas',{style:'border:1px solid #ccc;margin-top:8px;cursor:crosshair;'}, left);
canvas.width = 500; canvas.height = 700;
const ctx = canvas.getContext('2d');

// controls
make('h4',{text:'Controls'}, left);
const btnClear = make('button',{text:'Clear Points', style:'margin-right:6px;'}, left);
const btnComplete = make('button',{text:'Complete Polygon'}, left);

// inputs
make('h4',{text:'Inputs'}, left);
make('label',{text:'Centroid Latitude'}, left);
const inLat = make('input',{type:'number', step:'0.0000001', style:'width:100%;'}, left);
make('label',{text:'Centroid Longitude'}, left);
const inLon = make('input',{type:'number', step:'0.0000001', style:'width:100%;'}, left);
make('label',{text:'Side lengths (comma-separated, same order as clicked edges)'}, left);
const inLens = make('textarea',{rows:3, style:'width:100%;'}, left);
make('label',{text:'Units'}, left);
const unitSel = make('select',{style:'width:100%;'}, left);
make('option',{value:'feet', text:'feet'}, unitSel);
make('option',{value:'meters', text:'meters'}, unitSel);

const btnCompute = make('button',{text:'Compute Coordinates', style:'margin-top:8px;width:100%;'}, left);

// outputs
make('h4',{text:'Output'}, right);
const outPre = make('pre',{style:'height:230px;overflow:auto;border:1px solid #ddd;padding:8px;background:#fafafa;'}, right);
const btnDownload = make('button',{text:'Download GeoJSON'}, right);

// map
make('h4',{text:'Map'}, right);
const mapDiv = make('div',{id:'ft-map', style:'height:400px;border:1px solid #ccc;'}, right);

// init leaflet
const map = L.map(mapDiv).setView([12.97,77.59], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:22}).addTo(map);
let parcelLayer=null;

// canvas state
let img = null;
let pts = []; // pixel points
let closed = false;

function drawCanvas(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(img){
    const ar = img.width / img.height;
    let dw = canvas.width, dh = dw / ar;
    if(dh > canvas.height){ dh = canvas.height; dw = dh * ar; }
    const ox = (canvas.width - dw) / 2, oy = (canvas.height - dh) / 2;
    canvas._imgOffset = {ox, oy, dw, dh};
    ctx.drawImage(img, 0,0, img.width, img.height, ox, oy, dw, dh);
  } else {
    canvas._imgOffset = {ox:0, oy:0, dw:canvas.width, dh:canvas.height};
  }

  ctx.strokeStyle = '#111'; ctx.lineWidth=2; ctx.fillStyle='#111';
  if(pts.length>0){
    ctx.beginPath();
    for(let i=0;i<pts.length;i++){
      const [x,y] = pts[i];
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    if(closed) ctx.closePath();
    ctx.stroke();
    for(const [x,y] of pts){
      ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill();
    }
  }
}

fileInput.addEventListener('change', e=>{
  const f = e.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = function(ev){
    img = new Image();
    img.onload = function(){
      // resize canvas to keep reasonable size, but preserve aspect
      const maxW = 520;
      const scale = Math.min(maxW / img.width, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      drawCanvas();
    };
    img.src = ev.target.result;
  };
  r.readAsDataURL(f);
});

canvas.addEventListener('click', function(e){
  if(closed) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  pts.push([x,y]);
  drawCanvas();
});

btnClear.addEventListener('click', function(){ pts=[]; closed=false; drawCanvas(); outPre.textContent=''; if(parcelLayer) { map.removeLayer(parcelLayer); parcelLayer=null; } });
btnComplete.addEventListener('click', function(){ if(pts.length<3){ alert('Add at least 3 vertices'); return; } closed=true; drawCanvas(); });

// MAIN compute function (fixed centroid approach)
btnCompute.addEventListener('click', function(){
  if(!closed){ alert('Complete polygon first'); return; }
  const latC = parseFloat(inLat.value), lonC = parseFloat(inLon.value);
  if(isNaN(latC) || isNaN(lonC)){ alert('Enter valid centroid'); return; }
  const rawLens = inLens.value.split(',').map(s=>s.trim()).filter(s=>s!=='');
  if(rawLens.length === 0){ alert('Enter side lengths'); return; }
  const lens = rawLens.map(v=>parseFloat(v));
  if(lens.some(v => isNaN(v))){ alert('All side lengths must be numeric'); return; }
  if(lens.length !== pts.length){ alert(`Number of sides (${lens.length}) must equal number of clicked edges (${pts.length})`); return; }

  // convert to meters
  const measuredMeters = toMetersList(lens, unitSel.value);

  // compute pixel edge lengths
  const pixEdges = [];
  for(let i=0;i<pts.length;i++){
    const [x1,y1] = pts[i];
    const [x2,y2] = pts[(i+1)%pts.length];
    pixEdges.push(Math.hypot(x2-x1, y2-y1));
  }

  const perPix = pixEdges.reduce((a,b)=>a+b,0);
  const perReal = measuredMeters.reduce((a,b)=>a+b,0);
  if(perPix === 0){ alert('Invalid polygon'); return; }
  const metersPerPixel = perReal / perPix;

  // pixel centroid (centroid in pixel coordinates)
  let cx = 0, cy = 0;
  for(const p of pts){ cx += p[0]; cy += p[1]; }
  cx /= pts.length; cy /= pts.length;

  // build offsets in meters relative to pixel centroid
  const offsets = pts.map(([x,y])=>{
    const dx_px = x - cx;           // east positive
    const dy_px = cy - y;          // north positive (invert y)
    return [dx_px * metersPerPixel, dy_px * metersPerPixel]; // [east_m, north_m]
  });

  // compute polygon centroid in meters (area-weighted) using offsets as vertices
  // polygonCentroidMeters expects points in order [[x,y],...]
  const centroid_m = polygonCentroidMeters(offsets); // [cx_m, cy_m] in meters

  // translate offsets so centroid becomes (0,0) in meter-space (i.e., centroid located at given latC,lonC)
  const translated_offsets = offsets.map(([ex, ny]) => [ex - centroid_m[0], ny - centroid_m[1]]);

  // convert translated_offsets to lat/lon using addMeters with given centroid latC,lonC as anchor
  const latlonVerts = translated_offsets.map(([east_m, north_m]) => addMeters(latC, lonC, east_m, north_m));

  // build GeoJSON (lon,lat)
  const coords = latlonVerts.map(([lat,lon]) => [lon, lat]);
  coords.push(coords[0]);
  const geojson = {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [coords] },
      properties: {}
    }]
  };

  // Output vertices
  let out = 'Vertices (lat, lon):\n';
  for(let i=0;i<latlonVerts.length;i++){
    out += `${i+1}: ${latlonVerts[i][0].toFixed(7)}, ${latlonVerts[i][1].toFixed(7)}\n`;
  }
  // compute centroid of final geojson to confirm
  let sumLat = 0, sumLon = 0;
  for(const v of latlonVerts){ sumLat+=v[0]; sumLon+=v[1]; }
  const avgLat = sumLat/latlonVerts.length, avgLon = sumLon/latlonVerts.length;
  out += `\nMean(lat,lon) of vertices: ${avgLat.toFixed(7)}, ${avgLon.toFixed(7)}\n`;
  out += `Provided centroid: ${latC.toFixed(7)}, ${lonC.toFixed(7)}\n`;
  outPre.textContent = out;

  // render on map
  if(parcelLayer) map.removeLayer(parcelLayer);
  parcelLayer = L.geoJSON(geojson, { style: { color: '#e63946', weight: 2, fillOpacity: 0.25 } }).addTo(map);
  // add anchor marker
  L.circleMarker([latC, lonC], { radius: 5, color: 'blue', fill:true, fillColor:'blue' }).addTo(map);
  map.fitBounds(parcelLayer.getBounds());

  // download
  btnDownload.onclick = function(){
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'parcel.geojson'; a.click();
  };

});

// initial help
outPre.textContent = "Steps:\\n1. Upload sketch image.\\n2. Click polygon vertices in order (anticlockwise or clockwise).\\n3. Click 'Complete Polygon'.\\n4. Enter centroid (lat,lon) and side lengths (same order).\\n5. Click 'Compute Coordinates'.";
drawCanvas();

