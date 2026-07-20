"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface LandData {
  centroidLatitude: number;
  centroidLongitude: number;
  sideLengths: number[];
  vertices: Array<{ latitude: number; longitude: number; order: number }>;
  totalArea?: number;
  geojson?: string;
}

export default function LandDetailsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string>('');
  const [landData, setLandData] = useState<LandData | null>(null);
  const [sketchImage, setSketchImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Load saved land data from localStorage on component mount
  useEffect(() => {
    const savedLandData = localStorage.getItem('landDetailsData');
    if (savedLandData) {
      try {
        const parsedData = JSON.parse(savedLandData);
        setLandData(parsedData);
        
        // If we have saved data, restore it to the farmland tool when it initializes
        setTimeout(() => {
          if ((window as any).restoreLandData) {
            (window as any).restoreLandData(parsedData);
          }
        }, 1000); // Give time for the farmland tool to initialize
      } catch (error) {
        console.error('Error parsing saved land data:', error);
      }
    }
  }, []);

  // Save land data to localStorage whenever it changes
  useEffect(() => {
    if (landData) {
      localStorage.setItem('landDetailsData', JSON.stringify(landData));
    }
  }, [landData]);

  // Save sketch image to localStorage whenever it changes
  useEffect(() => {
    if (sketchImage) {
      // Convert file to base64 for localStorage storage
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem('landSketchImage', reader.result as string);
      };
      reader.readAsDataURL(sketchImage);
    }
  }, [sketchImage]);

  // Load saved sketch image from localStorage on component mount
  useEffect(() => {
    const savedImage = localStorage.getItem('landSketchImage');
    if (savedImage) {
      try {
        // Convert base64 back to file
        const base64Data = savedImage.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        const file = new File([blob], 'restored-sketch.jpg', { type: 'image/jpeg' });
        setSketchImage(file);
      } catch (error) {
        console.error('Error restoring sketch image:', error);
      }
    }
  }, []);

  // Get current logged-in user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me'); // Assuming you have an auth endpoint
        if (response.ok) {
          const userData = await response.json();
          console.log('Auth response:', userData);
          
          // Check for both possible ID fields (id or _id)
          const userId = userData.user?.id || userData.user?._id;
          
          if (userId) {
            setUserId(userId);
            console.log('Current user ID:', userId);
          } else {
            console.error('No user ID found in auth response:', userData);
          }
        } else {
          // Fallback: try to get from KYC endpoint which should have user info
          const kycResponse = await fetch('/api/farmer/kyc');
          if (kycResponse.ok) {
            const kycData = await kycResponse.json();
            console.log('KYC response:', kycData);
            
            if (kycData.profile && kycData.profile.user) {
              setUserId(kycData.profile.user);
              console.log('User ID from KYC:', kycData.profile.user);
            } else {
              console.error('No user ID found in KYC response:', kycData);
            }
          } else {
            console.error('Both auth and KYC endpoints failed');
          }
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    getCurrentUser();
  }, []);

  const saveLandDetails = async (computedData: LandData, geojsonString: string) => {
    if (!userId) {
      console.error('User ID is required for saving land details');
      return; // Don't show error message, just log and return
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
        // Fetch RTC data from user's profile to get land extent
        let rtcExtent = '';
        try {
          const kycResponse = await fetch('/api/farmer/kyc');
          if (kycResponse.ok) {
            const kycData = await kycResponse.json();
            console.log('KYC response data:', kycData);
            
            // Try multiple possible fields for land extent
            rtcExtent = kycData.profile?.totalCultivableArea || 
                        kycData.profile?.landParcelIdentity || 
                        kycData.profile?.rtcOcrText || '';
            
            console.log('RTC extent found:', rtcExtent);
            console.log('Available land fields:', {
              totalCultivableArea: kycData.profile?.totalCultivableArea,
              landParcelIdentity: kycData.profile?.landParcelIdentity,
              rtcOcrText: kycData.profile?.rtcOcrText ? 'present' : 'missing'
            });
          }
        } catch (error) {
          console.error('Error fetching RTC data:', error);
        }

        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('centroidLatitude', computedData.centroidLatitude.toString());
        formData.append('centroidLongitude', computedData.centroidLongitude.toString());
        formData.append('sideLengths', JSON.stringify(computedData.sideLengths));
        formData.append('vertices', JSON.stringify(computedData.vertices));
        formData.append('geojson', geojsonString);
        
        // Include RTC extent for land size calculation
        if (rtcExtent) {
          formData.append('extent', rtcExtent);
          console.log('Including RTC extent in save:', rtcExtent);
        } else {
          console.log('No RTC extent found, land size will not be calculated');
        }
      
      if (sketchImage) {
        formData.append('sketchImage', sketchImage);
      }

      const response = await fetch('/api/farmer/land-details', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setSaveMessage('Land details saved successfully!');
        setLandData(computedData);
        
        // Keep form state intact - no clearing or refreshing
        // The canvas, inputs, and all data remain as they were
        console.log('Land details saved successfully, form state preserved');
        
        // Optional: Clear the success message after a few seconds
        setTimeout(() => {
          setSaveMessage('');
        }, 3000);
      } else {
        setSaveMessage(result.error || 'Failed to save land details');
      }
    } catch (error) {
      console.error('Error saving land details:', error);
      setSaveMessage('Failed to save land details');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Make saveLandDetails available globally for the farmland tool
    (window as any).saveLandDetails = saveLandDetails;
  }, [saveLandDetails, userId, sketchImage]);

  useEffect(() => {
    // Only initialize Leaflet after user is loaded and we have a userId
    if (isLoadingUser || !userId) return;
    
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Load Leaflet CSS and JS
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
    document.head.appendChild(leafletCSS);

    const leafletJS = document.createElement('script');
    leafletJS.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
    leafletJS.onload = () => {
      // After Leaflet loads, initialize the farmland tool
      initializeFarmlandTool();
    };
    document.head.appendChild(leafletJS);

    return () => {
      // Cleanup
      if (leafletCSS.parentNode) {
        leafletCSS.parentNode.removeChild(leafletCSS);
      }
      if (leafletJS.parentNode) {
        leafletJS.parentNode.removeChild(leafletJS);
      }
    };
  }, [isLoadingUser, userId]); // Only re-run when user loading state changes

  const initializeFarmlandTool = () => {
    if (!containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // === tiny DOM helpers ===
    function make(tag: string, attrs: any = {}, parent: HTMLElement = containerRef.current!) {
      const e = document.createElement(tag);
      for (const k in attrs) if (k !== 'text') e.setAttribute(k, attrs[k]);
      if (attrs.text) e.textContent = attrs.text;
      parent.appendChild(e);
      return e;
    }

    // === geo helpers ===
    // convert east(dx), north(dy) meters to lat/lon (approx for local areas)
    function addMeters(lat: number, lon: number, dx: number, dy: number) {
      const R = 6378137;
      const newLat = lat + (dy / R) * (180 / Math.PI);
      const newLon = lon + (dx / (R * Math.cos(lat * Math.PI / 180))) * (180 / Math.PI);
      return [newLat, newLon];
    }

    // area-weighted centroid for polygon in planar coordinates (x=east, y=north)
    function polygonCentroidMeters(pts: number[][]) {
      const n = pts.length;
      if (n < 3) return [0, 0];
      // ensure closed
      const P = pts.slice();
      if (P[0][0] !== P[P.length - 1][0] || P[0][1] !== P[P.length - 1][1]) P.push([P[0][0], P[0][1]]);

      let A = 0; let Cx = 0; let Cy = 0;
      for (let i = 0; i < P.length - 1; i++) {
        const x0 = P[i][0], y0 = P[i][1];
        const x1 = P[i + 1][0], y1 = P[i + 1][1];
        const cross = x0 * y1 - x1 * y0;
        A += cross;
        Cx += (x0 + x1) * cross;
        Cy += (y0 + y1) * cross;
      }
      A = A / 2.0;
      if (Math.abs(A) < 1e-9) {
        // fallback to mean
        let sx = 0, sy = 0;
        for (const p of pts) { sx += p[0]; sy += p[1]; }
        return [sx / pts.length, sy / pts.length];
      }
      Cx = Cx / (6 * A);
      Cy = Cy / (6 * A);
      return [Cx, Cy];
    }

    // convert feet->meters if needed
    function toMetersList(arr: number[], unit: string) {
      if (unit === 'feet') return arr.map(v => v * 0.3048);
      return arr.slice();
    }

    // --- Build UI ---
    const wrap = make('div', { style: 'display:flex;gap:12px;padding:12px;font-family:Arial;color:#1f3b2c;' });
    const left = make('div', { style: 'width:520px;' }, wrap);
    const right = make('div', { style: 'flex:1;' }, wrap);

    // canvas area
    make('h3', { text: 'Sketch (click vertices in order)', style: 'color:#1f3b2c;font-weight:600;margin-bottom:8px;' }, left);
    const fileInput = make('input', { type: 'file', accept: 'image/*', style: 'width:100%;color:#1f3b2c;border:1px solid #e2d4b7;padding:8px;border-radius:4px;background:white;' }, left);
    const canvas = make('canvas', { style: 'border:1px solid #e2d4b7;margin-top:8px;cursor:crosshair;background:white;' }, left) as HTMLCanvasElement;
    canvas.width = 500; canvas.height = 700;
    const ctx = canvas.getContext('2d')!;

    // controls
    make('h4', { text: 'Controls', style: 'color:#1f3b2c;font-weight:600;margin:16px 0 8px 0;' }, left);
    const btnClear = make('button', { text: 'Clear Points', style: 'margin-right:6px;color:#1f3b2c;border:1px solid #e2d4b7;background:#fffaf1;padding:6px 12px;border-radius:4px;cursor:pointer;' }, left);
    const btnComplete = make('button', { text: 'Complete Polygon', style: 'color:#1f3b2c;border:1px solid #e2d4b7;background:#fffaf1;padding:6px 12px;border-radius:4px;cursor:pointer;' }, left);

    // inputs
    make('h4', { text: 'Inputs', style: 'color:#1f3b2c;font-weight:600;margin:16px 0 8px 0;' }, left);
    make('label', { text: 'Centroid Latitude', style: 'color:#1f3b2c;display:block;margin-bottom:4px;font-weight:500;' }, left);
    const inLat = make('input', { type: 'number', step: '0.0000001', style: 'width:100%;color:#1f3b2c;border:1px solid #e2d4b7;padding:8px;border-radius:4px;background:white;margin-bottom:12px;' }, left) as HTMLInputElement;
    make('label', { text: 'Centroid Longitude', style: 'color:#1f3b2c;display:block;margin-bottom:4px;font-weight:500;' }, left);
    const inLon = make('input', { type: 'number', step: '0.0000001', style: 'width:100%;color:#1f3b2c;border:1px solid #e2d4b7;padding:8px;border-radius:4px;background:white;margin-bottom:12px;' }, left) as HTMLInputElement;
    
    // Add info text about automatic calculation
    make('div', { 
      text: 'Note: Side lengths and land area will be calculated automatically from the polygon vertices you mark on the sketch.', 
      style: 'color:#6b7280;font-size:12px;margin-bottom:12px;padding:8px;background:#f9fafb;border-radius:4px;' 
    }, left);

    const btnCompute = make('button', { text: 'Compute Coordinates', style: 'margin-top:8px;width:100%;color:#1f3b2c;border:1px solid #e2d4b7;background:#fffaf1;padding:10px;border-radius:4px;cursor:pointer;font-weight:600;' }, left);

    // outputs
    make('h4', { text: 'Output', style: 'color:#1f3b2c;font-weight:600;margin-bottom:8px;' }, right);
    const outPre = make('pre', { style: 'height:230px;overflow:auto;border:1px solid #e2d4b7;padding:8px;background:#fafafa;color:#1f3b2c;font-family:monospace;font-size:12px;' }, right);
    const btnDownload = make('button', { text: 'Download GeoJSON', style: 'color:#1f3b2c;border:1px solid #e2d4b7;background:#fffaf1;padding:8px 12px;border-radius:4px;cursor:pointer;margin-top:8px;' }, right);

    // map
    make('h4', { text: 'Map', style: 'color:#1f3b2c;font-weight:600;margin:16px 0 8px 0;' }, right);
    const mapDiv = make('div', { id: 'ft-map', style: 'height:400px;border:1px solid #e2d4b7;border-radius:4px;' }, right);

    // init leaflet
    const L = (window as any).L;
    const map = L.map(mapDiv).setView([12.97, 77.59], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 22 }).addTo(map);
    let parcelLayer: any = null;

    // canvas state
    let img: HTMLImageElement | null = null;
    let pts: number[][] = []; // pixel points
    let closed = false;

    function drawCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (img) {
        const ar = img.width / img.height;
        let dw = canvas.width, dh = dw / ar;
        if (dh > canvas.height) { dh = canvas.height; dw = dh * ar; }
        const ox = (canvas.width - dw) / 2, oy = (canvas.height - dh) / 2;
        (canvas as any)._imgOffset = { ox, oy, dw, dh };
        ctx.drawImage(img, 0, 0, img.width, img.height, ox, oy, dw, dh);
      } else {
        (canvas as any)._imgOffset = { ox: 0, oy: 0, dw: canvas.width, dh: canvas.height };
      }

      ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.fillStyle = '#111';
      if (pts.length > 0) {
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const [x, y] = pts[i];
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        if (closed) ctx.closePath();
        ctx.stroke();
        for (const [x, y] of pts) {
          ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    fileInput.addEventListener('change', (e: any) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      setSketchImage(f); // Store the image file
      const r = new FileReader();
      r.onload = function (ev: any) {
        img = new Image();
        img.onload = function () {
          if (!img) return;
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

    canvas.addEventListener('click', function (e: any) {
      if (closed) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      pts.push([x, y]);
      drawCanvas();
    });

    btnClear.addEventListener('click', function () { pts = []; closed = false; drawCanvas(); outPre.textContent = ''; if (parcelLayer) { map.removeLayer(parcelLayer); parcelLayer = null; } });
    btnComplete.addEventListener('click', function () { if (pts.length < 3) { alert('Add at least 3 vertices'); return; } closed = true; drawCanvas(); });

    // MAIN compute function (updated to auto-calculate side lengths)
    btnCompute.addEventListener('click', function () {
      if (!closed) { alert('Complete polygon first'); return; }
      const latC = parseFloat(inLon.value), lonC = parseFloat(inLat.value);
      if (isNaN(latC) || isNaN(lonC)) { alert('Enter valid centroid'); return; }

      // Auto-calculate side lengths from pixel coordinates
      const pixelSideLengths = [];
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % pts.length];
        pixelSideLengths.push(Math.hypot(x2 - x1, y2 - y1));
      }

      // Use a default scale factor (you can adjust this based on your needs)
      // For now, we'll assume 1 pixel = 1 meter for simplicity
      // In a real application, you might want to calibrate this
      const metersPerPixel = 1.0;
      const measuredMeters = pixelSideLengths.map(length => length * metersPerPixel);

      // pixel centroid (centroid in pixel coordinates)
      let cx = 0, cy = 0;
      for (const p of pts) { cx += p[0]; cy += p[1]; }
      cx /= pts.length; cy /= pts.length;

      // build offsets in meters relative to pixel centroid
      const offsets = pts.map(([x, y]) => {
        const dx_px = x - cx;           // east positive
        const dy_px = cy - y;          // north positive (invert y)
        return [dx_px * metersPerPixel, dy_px * metersPerPixel]; // [east_m, north_m]
      });

      // compute polygon centroid in meters (area-weighted) using offsets as vertices
      const centroid_m = polygonCentroidMeters(offsets); // [cx_m, cy_m] in meters

      // translate offsets so centroid becomes (0,0) in meter-space
      const translated_offsets = offsets.map(([ex, ny]) => [ex - centroid_m[0], ny - centroid_m[1]]);

      // convert translated_offsets to lat/lon using addMeters with given centroid latC,lonC as anchor
      const latlonVerts = translated_offsets.map(([east_m, north_m]) => addMeters(latC, lonC, east_m, north_m));

      // build GeoJSON (lon,lat)
      const coords = latlonVerts.map(([lat, lon]) => [lon, lat]);
      coords.push(coords[0]);
      const geojson = {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [coords] },
          properties: {}
        }]
      };

      // Calculate actual geographic side lengths in meters
      const geoSideLengths = [];
      for (let i = 0; i < latlonVerts.length; i++) {
        const [lat1, lon1] = latlonVerts[i];
        const [lat2, lon2] = latlonVerts[(i + 1) % latlonVerts.length];
        
        // Haversine formula to calculate distance between two lat/lon points
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        geoSideLengths.push(distance);
      }

      // Calculate total area in square meters using Shoelace formula
      let totalArea = 0;
      if (latlonVerts.length >= 3) {
        for (let i = 0; i < latlonVerts.length; i++) {
          const j = (i + 1) % latlonVerts.length;
          totalArea += latlonVerts[i][0] * latlonVerts[j][1];
          totalArea -= latlonVerts[j][0] * latlonVerts[i][1];
        }
        totalArea = Math.abs(totalArea) / 2;
      }

      // Output vertices and calculated data
      let out = 'Vertices (lat, lon):\n';
      for(let i=0;i<latlonVerts.length;i++){
        out += `${i+1}: ${latlonVerts[i][0].toFixed(7)}, ${latlonVerts[i][1].toFixed(7)}\n`;
      }
      out += `\nCalculated Side Lengths (meters):\n`;
      for(let i=0;i<geoSideLengths.length;i++){
        out += `Side ${i+1}: ${geoSideLengths[i].toFixed(2)} m\n`;
      }
      out += `\nCentroid: ${latC.toFixed(7)}, ${lonC.toFixed(7)}\n`;
      outPre.textContent = out;

      // render on map
      if(parcelLayer) map.removeLayer(parcelLayer);
      parcelLayer = L.geoJSON(geojson, { style: { color: '#e63946', weight: 2, fillOpacity: 0.25 } }).addTo(map);
      // add anchor marker
      L.circleMarker([latC, lonC], { radius: 5, color: 'blue', fill: true, fillColor: 'blue' }).addTo(map);
      map.fitBounds(parcelLayer.getBounds());

      // download
      btnDownload.onclick = function () {
        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); (a as any).href = URL.createObjectURL(blob); a.download = 'parcel.geojson'; a.click();
      };

      // Save to database with calculated data
      console.log('DEBUG: Frontend computed coordinates - latC:', latC, 'lonC:', lonC);
      const computedData: LandData = {
        centroidLatitude: latC,
        centroidLongitude: lonC,
        sideLengths: geoSideLengths, // Use calculated geographic side lengths
        vertices: latlonVerts.map((coord, index) => ({
          latitude: coord[0],
          longitude: coord[1],
          order: index + 1
        })),
        totalArea: totalArea // Use calculated area
      };

      // Call the save function from component scope
      (window as any).saveLandDetails?.(computedData, JSON.stringify(geojson));
      
      // IMPORTANT: Do not clear any form data after save
      // Keep all inputs, canvas, and computed results visible
      // The user can continue working or make adjustments if needed
    });

    // initial help
    outPre.textContent = "Steps:\\n1. Upload sketch image.\\n2. Click polygon vertices in order (anticlockwise or clockwise).\\n3. Click 'Complete Polygon'.\\n4. Enter centroid (lat,lon).\\n5. Click 'Compute Coordinates'.";
    drawCanvas();

    // Make restoreLandData available globally
    (window as any).restoreLandData = (savedData: LandData) => {
      // Restore centroid inputs (swapped to match corrected logic)
      if (inLat && savedData.centroidLongitude) {
        inLat.value = savedData.centroidLongitude.toString();
      }
      if (inLon && savedData.centroidLatitude) {
        inLon.value = savedData.centroidLatitude.toString();
      }
      
      // Restore output display
      if (outPre && savedData.vertices && savedData.sideLengths) {
        let out = 'Vertices (lat, lon):\n';
        for(let i = 0; i < savedData.vertices.length; i++){
          out += `${i+1}: ${savedData.vertices[i].latitude.toFixed(7)}, ${savedData.vertices[i].longitude.toFixed(7)}\n`;
        }
        out += `\nCalculated Side Lengths (meters):\n`;
        for(let i = 0; i < savedData.sideLengths.length; i++){
          out += `Side ${i+1}: ${savedData.sideLengths[i].toFixed(2)} m\n`;
        }
        out += `\nCentroid: ${savedData.centroidLatitude.toFixed(7)}, ${savedData.centroidLongitude.toFixed(7)}\n`;
        out += `\n\n(Restored from previous session)`;
        outPre.textContent = out;
      }
      
      // Restore map if we have GeoJSON
      if (savedData.geojson && map && parcelLayer) {
        try {
          const geojson = JSON.parse(savedData.geojson);
          if (parcelLayer) {
            map.removeLayer(parcelLayer);
          }
          parcelLayer = L.geoJSON(geojson, { style: { color: '#e63946', weight: 2, fillOpacity: 0.25 } }).addTo(map);
          
          // Add centroid marker
          if (savedData.centroidLatitude && savedData.centroidLongitude) {
            L.circleMarker([savedData.centroidLatitude, savedData.centroidLongitude], { 
              radius: 5, 
              color: 'blue', 
              fill: true, 
              fillColor: 'blue' 
            }).addTo(map);
          }
          
          map.fitBounds(parcelLayer.getBounds());
        } catch (error) {
          console.error('Error restoring map data:', error);
        }
      }
    };

    // Try to restore saved data if available
    const savedLandData = localStorage.getItem('landDetailsData');
    const savedImage = localStorage.getItem('landSketchImage');
    
    if (savedLandData) {
      try {
        const parsedData = JSON.parse(savedLandData);
        setTimeout(() => {
          (window as any).restoreLandData(parsedData);
        }, 500); // Small delay to ensure map is ready
      } catch (error) {
        console.error('Error restoring saved land data:', error);
      }
    }
    
    // Restore sketch image if available
    if (savedImage) {
      try {
        const restoredImg = new Image();
        restoredImg.onload = function () {
          if (!restoredImg) return;
          // resize canvas to keep reasonable size, but preserve aspect
          const maxW = 520;
          const scale = Math.min(maxW / restoredImg.width, 1);
          canvas.width = Math.round(restoredImg.width * scale);
          canvas.height = Math.round(restoredImg.height * scale);
          img = restoredImg; // Set the global img variable
          drawCanvas();
        };
        restoredImg.src = savedImage;
      } catch (error) {
        console.error('Error restoring sketch image:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f3b2c]">Land Details</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Upload your land sketch and map it to geographic coordinates.
          </p>
        </div>
        <Link
          href="/dashboard/farmer/land"
          className="inline-flex items-center justify-center rounded-md border border-[#e2d4b7] px-4 py-2 text-xs font-medium text-[#1f3b2c] hover:bg-[#f7f0de]"
        >
          ← Back to Land Integration
        </Link>
      </div>

      {/* User Loading State */}
      {isLoadingUser && (
        <div className="bg-white border border-[#e2d4b7] rounded-lg p-6 text-center">
          <p className="text-[#6b7280]">Loading user information...</p>
        </div>
      )}

      {/* No User Found */}
      {!isLoadingUser && !userId && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">Please log in to save land details. The mapping tool will still work, but data won't be saved.</p>
        </div>
      )}

      {/* Save Status */}
      {saveMessage && (
        <div className={`p-4 rounded-lg border ${
          saveMessage.includes('successfully') 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {saveMessage}
        </div>
      )}

      <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[#1f3b2c] mb-2">Land Mapping Tool</h2>
          <p className="text-sm text-[#6b7280]">
            Use this tool to convert your land sketch to precise geographic coordinates. Upload an image of your land sketch, mark the boundaries, and enter the centroid coordinates.
          </p>
          <p className="text-sm text-[#6b7280] mt-2">
            <strong>Note:</strong> After computing coordinates, your land details will be automatically saved to the database for your account.
          </p>
          {!userId && !isLoadingUser && (
            <p className="text-sm text-orange-600 mt-2">
              <strong>Warning:</strong> You are not logged in. Your land details will not be saved.
            </p>
          )}
        </div>
        
        <div 
          ref={containerRef}
          className="border border-[#e2d4b7] rounded-lg overflow-hidden"
        />
      </div>
    </div>
  );
}
