"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Crop {
  name: string;
  season?: string;
  area?: string;
  land_use?: string;
  irrigation?: string;
}

interface Plot {
  plotId: string;
  type: string;
  points: number[][];
  administrative: {
    district: string;
    taluk: string;
    hobli: string;
    village: string;
    survey: string;
    surnoc?: string;
    hissa?: string;
    ulpin?: string;
    olc?: string;
  };
  owner: {
    name?: string;
    father?: string;
    khata?: string;
    ownership_type?: string;
    address?: string;
  };
  land: {
    total_area?: string;
    cultivable_area?: string;
    pot_kharab_a?: string;
    pot_kharab_b?: string;
    revenue?: string;
    jodi?: string;
    cess?: string;
    water_rate?: string;
    soil?: string;
    land_type?: string;
    irrigation_source?: string;
    trees?: string;
  };
  gis: {
    geojson_geom: any;
    centroid: number[];
    bbox: number[];
    area: number;
    perimeter: number;
    side_lengths: number[];
    latitude?: number;
    longitude?: number;
  };
  crops: Crop[];
}

export default function LandDetailsPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Auth and User State
  const [userId, setUserId] = useState<string>('');
  const [registeredName, setRegisteredName] = useState<string>('');
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  
  // Dropdown States
  const [district, setDistrict] = useState('Shivamogga');
  const [taluk, setTaluk] = useState('Thirthahalli');
  const [hobli, setHobli] = useState('Mandagadde');
  const [village, setVillage] = useState('CHIKSIKENCHIGUDDE');
  const [surveyNumber, setSurveyNumber] = useState('');
  const [surnoc, setSurnoc] = useState('');
  const [hissa, setHissa] = useState('');
  const [period, setPeriod] = useState('2026-2027');

  // Loaded plots and filters
  const [allPlots, setAllPlots] = useState<Plot[]>([]);
  const [isLoadingPlots, setIsLoadingPlots] = useState(true);
  const [verifiedPlot, setVerifiedPlot] = useState<Plot | null>(null);
  
  // Map and Link Actions
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [linking, setLinking] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fetching, setFetching] = useState(false);
  
  // Leaflet Map instance ref for centering
  const mapInstanceRef = useRef<any>(null);
  const plotLayerRef = useRef<any>(null);

  // 1. Get current logged-in user and check verification status
  useEffect(() => {
    const getCurrentUserAndStatus = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          const id = userData.user?.id || userData.user?._id;
          if (id) {
            setUserId(id);
            setRegisteredName(userData.user?.fullName || '');
            
            // Check if user already has verified land linked
            const landRes = await fetch(`/api/farmer/land-details?userId=${id}`);
            const landData = await landRes.json();
            if (landRes.ok && landData.success && landData.data && landData.data.length > 0) {
              setIsVerified(true);
              
              const dbLand = landData.data[0];
              const mappedPlot: Plot = {
                plotId: dbLand._id,
                type: 'polygon',
                points: dbLand.landData?.vertices?.map((v: any) => [v.latitude, v.longitude]) || [],
                administrative: {
                  district: dbLand.rtcDetails?.district || 'Shivamogga',
                  taluk: dbLand.rtcDetails?.taluk || 'Thirthahalli',
                  hobli: dbLand.rtcDetails?.hobli || 'Mandagadde',
                  village: dbLand.rtcDetails?.village || 'CHIKSIKENCHIGUDDE',
                  survey: dbLand.rtcDetails?.surveyNumber || '',
                  surnoc: dbLand.rtcDetails?.surnoc || '',
                  hissa: dbLand.rtcDetails?.hissa || '',
                },
                owner: {
                  name: dbLand.rtcDetails?.ownerName || userData.user?.fullName,
                  father: dbLand.rtcDetails?.fatherName || '',
                  khata: dbLand.rtcDetails?.khataNumber || '',
                  ownership_type: dbLand.rtcDetails?.ownershipType || '',
                },
                land: {
                  total_area: dbLand.rtcDetails?.extent || '',
                  cultivable_area: dbLand.rtcDetails?.cultivable_area || dbLand.rtcDetails?.extent || '',
                  pot_kharab_a: dbLand.rtcDetails?.potKharabA || '0',
                  pot_kharab_b: dbLand.rtcDetails?.potKharabB || '0',
                  revenue: dbLand.rtcDetails?.revenue || '0.00',
                  jodi: dbLand.rtcDetails?.jodi || '0.00',
                  cess: dbLand.rtcDetails?.cess || '0.00',
                  water_rate: dbLand.rtcDetails?.waterRate || '0.00',
                  soil: dbLand.rtcDetails?.soilType || '',
                  land_type: dbLand.rtcDetails?.landType || 'Dry',
                  irrigation_source: dbLand.rtcDetails?.irrigationSource || 'Rainfed',
                  trees: dbLand.rtcDetails?.trees || 'None',
                },
                gis: {
                  geojson_geom: dbLand.landData?.geojson ? JSON.parse(dbLand.landData.geojson) : null,
                  centroid: [dbLand.landData?.centroidLatitude || 0, dbLand.landData?.centroidLongitude || 0],
                  bbox: [],
                  area: 0,
                  perimeter: 0,
                  side_lengths: dbLand.landData?.sideLengths || [],
                  latitude: dbLand.landData?.latitude,
                  longitude: dbLand.landData?.longitude,
                },
                crops: dbLand.rtcDetails?.allCrops || (dbLand.rtcDetails?.cropType 
                  ? dbLand.rtcDetails.cropType.split(',').map((name: string) => ({ name: name.trim() })) 
                  : [])
              };
              setVerifiedPlot(mappedPlot);
            }
          }
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };
    getCurrentUserAndStatus();
  }, []);

  // 2. Fetch all digitized plots for dropdowns (only if not verified yet)
  useEffect(() => {
    if (isVerified) return;
    const fetchPlots = async () => {
      try {
        const res = await fetch('/api/digitizer/plots');
        const data = await res.json();
        if (res.ok && data.success) {
          setAllPlots(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching digitized plots:', err);
      } finally {
        setIsLoadingPlots(false);
      }
    };
    fetchPlots();
  }, [isVerified]);

  // 3. Load Leaflet dynamic assets
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
    document.head.appendChild(leafletCSS);

    const leafletJS = document.createElement('script');
    leafletJS.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
    leafletJS.onload = () => {
      setLeafletLoaded(true);
    };
    document.head.appendChild(leafletJS);

    return () => {
      if (leafletCSS.parentNode) leafletCSS.parentNode.removeChild(leafletCSS);
      if (leafletJS.parentNode) leafletJS.parentNode.removeChild(leafletJS);
    };
  }, []);

  // 4. Render Leaflet Map for CRS.Simple on plot selection / verification
  useEffect(() => {
    if (!leafletLoaded || !verifiedPlot || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    mapContainerRef.current.innerHTML = '<div id="leaflet-simple-map" style="height: 480px; border-radius: 16px; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);"></div>';

    const map = L.map('leaflet-simple-map', {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 3,
      zoomControl: false
    });
    mapInstanceRef.current = map;
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const img = new Image();
    img.src = '/village_map_clear.png';
    img.onload = () => {
      const w = img.width;
      const h = img.height;

      const bounds = [[-h, 0], [0, w]];
      L.imageOverlay('/village_map_clear.png', bounds).addTo(map);
      map.fitBounds(bounds);

      const geojsonGeom = verifiedPlot.gis.geojson_geom;
      if (geojsonGeom) {
        const plotLayer = L.geoJSON(geojsonGeom, {
          coordsToLatLng: function (coords: number[]) {
            return L.latLng([-coords[1], coords[0]]);
          },
          style: {
            color: '#15803d',
            weight: 4,
            dashArray: '2, 5',
            fillColor: '#22c55e',
            fillOpacity: 0.25
          }
        }).addTo(map);
        plotLayerRef.current = plotLayer;

        plotLayer.on('mouseover', () => {
          plotLayer.setStyle({
            color: '#166534',
            weight: 5,
            fillOpacity: 0.4,
            fillColor: '#15803d'
          });
        });
        plotLayer.on('mouseout', () => {
          plotLayer.setStyle({
            color: '#15803d',
            weight: 4,
            fillOpacity: 0.25,
            fillColor: '#22c55e'
          });
        });

        const c = verifiedPlot.gis.centroid;
        if (c && c.length === 2) {
          const pinIcon = L.divIcon({
            html: `<div class="relative flex items-center justify-center">
                     <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-emerald-400 opacity-75"></span>
                     <div class="h-4 w-4 rounded-full bg-emerald-600 border-2 border-white "></div>
                   </div>`,
            className: 'custom-pin-icon',
            iconSize: [16, 16]
          });
          L.marker([-c[1], c[0]], { icon: pinIcon }).addTo(map)
            .bindPopup(`<strong>Farmland Center:</strong><br/>Survey No: ${verifiedPlot.administrative.survey}<br/>Coordinates: ${c[0].toFixed(1)}, ${c[1].toFixed(1)} px`)
            .openPopup();
        }

        map.fitBounds(plotLayer.getBounds());
      }
    };
  }, [leafletLoaded, verifiedPlot]);

  const handleResetMap = () => {
    if (mapInstanceRef.current && plotLayerRef.current) {
      mapInstanceRef.current.fitBounds(plotLayerRef.current.getBounds());
    }
  };

  // Unique lists for dropdown options based on all plots
  const availableSurveys = Array.from(
    new Set(
      allPlots
        .filter(p => p.administrative.district === district && p.administrative.village === village)
        .map(p => p.administrative.survey)
    )
  ).sort();

  const availableSurnocs = Array.from(
    new Set(
      allPlots
        .filter(p => p.administrative.survey === surveyNumber)
        .map(p => p.administrative.surnoc || ' - ')
    )
  ).sort();

  const availableHissas = Array.from(
    new Set(
      allPlots
        .filter(p => p.administrative.survey === surveyNumber && (p.administrative.surnoc || ' - ') === surnoc)
        .map(p => p.administrative.hissa || ' - ')
    )
  ).sort();

  // Fetch details & match user name with digitized database owner name
  const handleFetchAndVerify = async () => {
    setErrorMessage('');
    setSaveMessage('');
    setVerifiedPlot(null);
    setFetching(true);

    try {
      const response = await fetch('/api/farmer/verify-land', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          district,
          taluk,
          hobli,
          village,
          survey: surveyNumber,
          surnoc,
          hissa
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setVerifiedPlot(data.plot);
        setSaveMessage('Identity and land ownership matching successful! Press confirm below to link.');
      } else {
        setErrorMessage(data.error || 'Name match verification failed.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error occurred verifying ownership.');
    } finally {
      setFetching(false);
    }
  };

  // Link selected plot to farmer profile
  const handleLinkLand = async () => {
    if (!verifiedPlot || !userId) return;

    setLinking(true);
    setSaveMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/farmer/link-land', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plotId: verifiedPlot.plotId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSaveMessage('Land integration complete! Redirecting to dashboard...');
        setIsVerified(true);
        setTimeout(() => {
          window.location.href = `/dashboard/farmer?userId=${userId}`;
        }, 2000);
      } else {
        setErrorMessage(data.error || 'Failed to complete land integration.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Something went wrong during land integration. Please try again.');
    } finally {
      setLinking(false);
    }
  };

  // Trigger PDF Generation / Printing of Land Details Akarband Certificate
  const handleDownloadPDF = () => {
    if (!verifiedPlot) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is preventing document printing. Please allow popups.');
      return;
    }

    const points = verifiedPlot.points || [];
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    points.forEach(pt => {
      if (pt[0] < minX) minX = pt[0];
      if (pt[0] > maxX) maxX = pt[0];
      if (pt[1] < minY) minY = pt[1];
      if (pt[1] > maxY) maxY = pt[1];
    });

    const w = maxX - minX;
    const h = maxY - minY;

    const htmlContent = `
      <html>
        <head>
          <title>Akarband Certificate - Survey No. ${verifiedPlot.administrative.survey}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #1f3b2c;
              margin: 40px;
              padding: 0;
            }
            .header {
              border-bottom: 3px double #166534;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .logo {
              font-size: 26px;
              font-weight: 800;
              color: #166534;
              letter-spacing: 1px;
            }
            .certificate-title {
              font-size: 20px;
              font-weight: 700;
              color: #1f3b2c;
              margin: 0;
              text-align: right;
            }
            .meta-details {
              font-size: 11px;
              color: #6b7280;
              text-align: right;
              margin-top: 5px;
            }
            h3 {
              color: #166534;
              border-bottom: 1px solid #e2d4b7;
              padding-bottom: 6px;
              margin-top: 25px;
              font-size: 15px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th, td {
              border: 1px solid #e2d4b7;
              padding: 8px 10px;
              text-align: left;
              font-size: 12.5px;
            }
            th {
              background-color: #f0fdf4;
              color: #1f3b2c;
              font-weight: 600;
              width: 25%;
            }
            .sketch-container {
              text-align: center;
              margin-top: 20px;
              padding: 15px;
              border: 1px solid #e2d4b7;
              background-color: #fafafa;
              border-radius: 8px;
            }
            .sketch-canvas {
              background-color: #ffffff;
              border: 1px solid #cbd5e1;
            }
            .sketch-caption {
              font-size: 11px;
              color: #6b7280;
              margin-top: 8px;
            }
            .signatures {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            .sig-box {
              width: 250px;
              text-align: center;
              border-top: 1px solid #1f3b2c;
              padding-top: 10px;
              font-size: 11.5px;
            }
            @media print {
              body { margin: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">AGRILINK CADASTRAL SURVEY</div>
            <div>
              <div class="certificate-title">Official Land Akarband Ledger</div>
              <div class="meta-details">ID: AL-RTC-${verifiedPlot.plotId.substring(0, 8).toUpperCase()} | Date: ${new Date().toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          <p style="font-size: 12.5px; line-height: 1.6;">
            This document certifies the cadastral boundaries, revenue classifications, ownership credentials, and agricultural statistics for the land parcel described below, matching verified records of the Grama Land Register.
          </p>

          <h3>1. Location & Administrative Details</h3>
          <table>
            <tr>
              <th>District</th>
              <td>${verifiedPlot.administrative.district}</td>
              <th>Taluk</th>
              <td>${verifiedPlot.administrative.taluk}</td>
            </tr>
            <tr>
              <th>Hobli</th>
              <td>${verifiedPlot.administrative.hobli}</td>
              <th>Village</th>
              <td>${verifiedPlot.administrative.village}</td>
            </tr>
            <tr>
              <th>Survey / Surnoc / Hissa</th>
              <td colspan="3"><strong>${verifiedPlot.administrative.survey} / ${verifiedPlot.administrative.surnoc || ' - '} / ${verifiedPlot.administrative.hissa || ' - '}</strong></td>
            </tr>
          </table>

          <h3>2. Land Ownership Registry</h3>
          <table>
            <tr>
              <th>Land Owner Name</th>
              <td><strong>${verifiedPlot.owner.name || ' - '}</strong></td>
              <th>Father's / Husband's Name</th>
              <td>${verifiedPlot.owner.father || ' - '}</td>
            </tr>
            <tr>
              <th>Khata Number</th>
              <td>${verifiedPlot.owner.khata || ' - '}</td>
              <th>Ownership Type</th>
              <td>${verifiedPlot.owner.ownership_type || 'Joint / Single'}</td>
            </tr>
            <tr>
              <th>Registered Address</th>
              <td colspan="3">${verifiedPlot.owner.address || 'CHIKSIKENCHIGUDDE, Thirthahalli'}</td>
            </tr>
          </table>

          <h3>3. Area Classification & Revenue Assessment</h3>
          <table>
            <tr>
              <th>Total Extent Area</th>
              <td>${verifiedPlot.land.total_area || ' - '} Acres</td>
              <th>Cultivable Extent</th>
              <td>${verifiedPlot.land.cultivable_area || ' - '} Acres</td>
            </tr>
            <tr>
              <th>Pot Kharab Class A</th>
              <td>${verifiedPlot.land.pot_kharab_a || '0'} Acres</td>
              <th>Pot Kharab Class B</th>
              <td>${verifiedPlot.land.pot_kharab_b || '0'} Acres</td>
            </tr>
            <tr>
              <th>Assessed Land Revenue</th>
              <td>₹ ${verifiedPlot.land.revenue || '0.00'}</td>
              <th>Jodi / Quit Rent</th>
              <td>₹ ${verifiedPlot.land.jodi || '0.00'}</td>
            </tr>
            <tr>
              <th>Cesses Assessed</th>
              <td>₹ ${verifiedPlot.land.cess || '0.00'}</td>
              <th>Water Rates Assessment</th>
              <td>₹ ${verifiedPlot.land.water_rate || '0.00'}</td>
            </tr>
          </table>

          <h3>4. Soil Properties & Agriculture Classification</h3>
          <table>
            <tr>
              <th>Soil Properties / Class</th>
              <td>${verifiedPlot.land.soil || 'Not Specified'}</td>
              <th>Land Category Type</th>
              <td>${verifiedPlot.land.land_type || 'Dry'}</td>
            </tr>
            <tr>
              <th>Irrigation Source</th>
              <td>${verifiedPlot.land.irrigation_source || 'Rainfed'}</td>
              <th>Timber / Fruit Trees</th>
              <td>${verifiedPlot.land.trees || 'None'}</td>
            </tr>
          </table>

          <div class="agreement-section" style="page-break-inside: avoid;">
            <h3>5. Definitive Digital Boundary Plot Outline</h3>
            <div class="sketch-container">
              <canvas id="canvasPrint" class="sketch-canvas" width="600" height="300"></canvas>
              <div class="sketch-caption">Digital boundary outline showing merged plots (Survey No: ${verifiedPlot.administrative.survey})</div>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-box">
              <strong>AgriLink Survey Officer</strong><br>
              Signed Digitally with Blockchain Log
            </div>
            <div class="sig-box">
              <strong>Verified Farmer Signatory</strong><br>
              ${verifiedPlot.owner.name || ' - '}
            </div>
          </div>

          <script>
            const points = ${JSON.stringify(points)};
            const minX = ${minX}, maxX = ${maxX};
            const minY = ${minY}, maxY = ${maxY};
            const w = ${w}, h = ${h};
            
            const canvas = document.getElementById('canvasPrint');
            if (canvas) {
              const ctx = canvas.getContext('2d');
              
              ctx.strokeStyle = '#f1f5f9';
              ctx.lineWidth = 1;
              for (let x = 0; x < canvas.width; x += 25) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
              }
              for (let y = 0; y < canvas.height; y += 25) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
              }

              const padding = 30;
              const drawW = canvas.width - padding * 2;
              const drawH = canvas.height - padding * 2;
              const sScale = Math.min(drawW / w, drawH / h);
              const sOffsetX = (canvas.width - w * sScale) / 2;
              const sOffsetY = (canvas.height - h * sScale) / 2;

              function toScreen(pt) {
                return [
                  (pt[0] - minX) * sScale + sOffsetX,
                  (pt[1] - minY) * sScale + sOffsetY
                ];
              }

              if (points.length >= 3) {
                ctx.beginPath();
                const [x0, y0] = toScreen(points[0]);
                ctx.moveTo(x0, y0);
                for (let i = 1; i < points.length; i++) {
                  const [x, y] = toScreen(points[i]);
                  ctx.lineTo(x, y);
                }
                ctx.closePath();
                
                ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
                ctx.fill();
                ctx.lineWidth = 3.5;
                ctx.strokeStyle = '#15803d';
                ctx.stroke();

                const cx = (minX + maxX) / 2;
                const cy = (minY + maxY) / 2;
                const [sx, sy] = toScreen([cx, cy]);
                ctx.font = 'bold 11px sans-serif';
                ctx.fillStyle = '#166534';
                ctx.textAlign = 'center';
                ctx.strokeText("Survey " + "${verifiedPlot.administrative.survey}", sx, sy);
                ctx.fillText("Survey " + "${verifiedPlot.administrative.survey}", sx, sy);
              }
            }

            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1f3b2c]">
            {isVerified ? 'My Farmland Details' : 'Land Records Verification'}
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            {isVerified 
              ? 'Your verified land boundaries and crop records synced from the village cadastral database.' 
              : 'Link your digital RTC records by matching your registered name against the village database.'
            }
          </p>
        </div>
        {isVerified && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Akarband PDF
            </button>
            <Link
              href={`/dashboard/farmer?userId=${userId}`}
              className="inline-flex items-center justify-center rounded-xl bg-[#166534] px-4 py-2 text-xs font-semibold text-white hover:bg-[#14532d]"
            >
              Go to Dashboard Overview
            </Link>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {saveMessage && (
        <div className="p-4 rounded-xl border bg-green-50 border-green-200 text-green-800 text-sm animate-fadeIn">
          {saveMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl border bg-red-50 border-red-200 text-red-800 text-sm animate-fadeIn">
          {errorMessage}
        </div>
      )}

      {/* Loading States */}
      {isLoadingUser && (
        <div className="bg-white border border-[#e2d4b7] rounded-xl p-8 text-center">
          <p className="text-gray-500">Loading user credentials...</p>
        </div>
      )}

      {!isLoadingUser && !isVerified && (
        <div className="space-y-6">
          {/* Dropdown Selector Panel */}
          <div className="bg-white border border-[#e2d4b7] rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-[#1f3b2c]">Select Land Coordinates</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Registered Name: <strong>{registeredName}</strong>
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#e2d4b7] bg-gray-50 px-3 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#166534]"
                >
                  <option value="Shivamogga">Shivamogga</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Taluk</label>
                <select
                  value={taluk}
                  onChange={(e) => setTaluk(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#e2d4b7] bg-gray-50 px-3 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#166534]"
                >
                  <option value="Thirthahalli">Thirthahalli</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hobli</label>
                <select
                  value={hobli}
                  onChange={(e) => setHobli(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#e2d4b7] bg-gray-50 px-3 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#166534]"
                >
                  <option value="Mandagadde">Mandagadde</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Village</label>
                <select
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#e2d4b7] bg-gray-50 px-3 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#166534]"
                >
                  <option value="CHIKSIKENCHIGUDDE">CHIKSIKENCHIGUDDE</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Survey Number</label>
                <select
                  value={surveyNumber}
                  onChange={(e) => {
                    setSurveyNumber(e.target.value);
                    setSurnoc('');
                    setHissa('');
                  }}
                  className="w-full text-sm rounded-lg border border-[#e2d4b7] bg-white px-3 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#166534]"
                >
                  <option value="">Select Survey No</option>
                  {availableSurveys.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Surnoc</label>
                <select
                  value={surnoc}
                  onChange={(e) => {
                    setSurnoc(e.target.value);
                    setHissa('');
                  }}
                  disabled={!surveyNumber}
                  className="w-full text-sm rounded-lg border border-[#e2d4b7] bg-white px-3 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#166534] disabled:bg-gray-100"
                >
                  <option value="">Select Surnoc</option>
                  {availableSurnocs.map(sn => (
                    <option key={sn} value={sn}>{sn}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hissa No</label>
                <select
                  value={hissa}
                  onChange={(e) => setHissa(e.target.value)}
                  disabled={!surnoc}
                  className="w-full text-sm rounded-lg border border-[#e2d4b7] bg-white px-3 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#166534] disabled:bg-gray-100"
                >
                  <option value="">Select Hissa</option>
                  {availableHissas.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#e2d4b7] bg-white px-3 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#166534]"
                >
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleFetchAndVerify}
                disabled={!hissa || fetching}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {fetching ? 'Matching Owners...' : 'Verify Ownership Details'}
              </button>
            </div>
          </div>

          {/* Verification Results & Boundary Overlay Map */}
          {verifiedPlot && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
              {/* Info Card */}
              <div className="bg-white border border-[#e2d4b7] rounded-2xl p-6 space-y-6">
                <div className="border-b border-[#e2d4b7] pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#1f3b2c]">RTC Land Record Information</h3>
                    <p className="text-xs text-gray-500">Survey No. {verifiedPlot.administrative.survey} / Surnoc {verifiedPlot.administrative.surnoc || ' - '} / Hissa {verifiedPlot.administrative.hissa || ' - '}</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                    Digitized & Matched
                  </span>
                </div>

                {/* Owner & Khata details */}
                <div className="bg-[#fcfbf9] border border-[#e2d4b7]/50 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Owner Registry</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500 block">Registered Owner</span>
                      <strong className="text-[#1f3b2c] text-sm">{verifiedPlot.owner.name || ' - '}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Father's Name</span>
                      <strong className="text-[#1f3b2c] text-sm">{verifiedPlot.owner.father || ' - '}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Khata Number</span>
                      <strong className="text-[#1f3b2c] text-sm">{verifiedPlot.owner.khata || ' - '}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Ownership Class</span>
                      <strong className="text-[#1f3b2c] text-sm">{verifiedPlot.owner.ownership_type || ' - '}</strong>
                    </div>
                  </div>
                </div>

                {/* Cultivated metrics */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 block">Total Area</span>
                    <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.land.total_area || ' - '} Acres</strong>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Cultivable Area</span>
                    <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.land.cultivable_area || ' - '} Acres</strong>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Pot Kharab Class A</span>
                    <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.land.pot_kharab_a || '0'} Acres</strong>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Pot Kharab Class B</span>
                    <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.land.pot_kharab_b || '0'} Acres</strong>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Assessed Revenue</span>
                    <strong className="text-[#1f3b2c] font-semibold">₹ {verifiedPlot.land.revenue || '0.00'}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Soil Properties</span>
                    <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.land.soil || ' - '}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Latitude Reference</span>
                    <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.gis.latitude || ' - '}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Longitude Reference</span>
                    <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.gis.longitude || ' - '}</strong>
                  </div>
                </div>

                <div className="border-t border-[#e2d4b7] pt-4">
                  <span className="text-xs text-gray-500 block mb-2 font-semibold text-[#1f3b2c]">Active Crops ({verifiedPlot.crops.length})</span>
                  {verifiedPlot.crops.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {verifiedPlot.crops.map((crop, index) => (
                        <span key={index} className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 text-xs font-medium">
                          {crop.name} ({crop.area || 'All'}) - {crop.season || 'Annual'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No crops recorded</span>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleLinkLand}
                    disabled={linking}
                    className="w-full rounded-xl bg-[#166534] py-3 text-sm font-bold text-white hover:bg-[#14532d] active:scale-98 transition-all disabled:opacity-70 disabled:pointer-events-none"
                  >
                    {linking ? 'Linking Land...' : 'Confirm Verification & Integrate Land'}
                  </button>
                </div>
              </div>

              {/* Map Card */}
              <div className="bg-white border border-[#e2d4b7] rounded-2xl p-6 flex flex-col relative">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-bold text-[#1f3b2c]">Farmland Boundary Overlay</h3>
                  <button 
                    onClick={handleResetMap}
                    className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    Recenter Boundary
                  </button>
                </div>
                <div ref={mapContainerRef} className="flex-grow min-h-[400px] bg-gray-50 rounded-xl overflow-hidden relative">
                  {!leafletLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                      <p className="text-sm text-gray-500">Loading interactive mapping engine...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verified User Display */}
      {!isLoadingUser && isVerified && verifiedPlot && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Info Card */}
          <div className="bg-white border border-[#e2d4b7] rounded-2xl p-6 space-y-5">
            <div className="border-b border-[#e2d4b7] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1f3b2c]">Verified Land Record Information</h3>
                <p className="text-xs text-gray-500">Survey No. {verifiedPlot.administrative.survey} / Surnoc {verifiedPlot.administrative.surnoc || ' - '} / Hissa {verifiedPlot.administrative.hissa || ' - '}</p>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                Verified
              </span>
            </div>

            {/* Owner Details Registry */}
            <div className="bg-[#fcfbf9] border border-[#e2d4b7]/50 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Owner Registry</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 block">Registered Owner</span>
                  <strong className="text-[#1f3b2c] text-sm">{verifiedPlot.owner.name || ' - '}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Father's Name</span>
                  <strong className="text-[#1f3b2c] text-sm">{verifiedPlot.owner.father || ' - '}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Khata Number</span>
                  <strong className="text-[#1f3b2c] text-sm">{verifiedPlot.owner.khata || ' - '}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Ownership Class</span>
                  <strong className="text-[#1f3b2c] text-sm">{verifiedPlot.owner.ownership_type || ' - '}</strong>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="text-xs text-gray-500 block">Total Area</span>
                <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.land.total_area || ' - '} Acres</strong>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Cultivable Area</span>
                <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.land.cultivable_area || ' - '} Acres</strong>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Pot Kharab Class A</span>
                <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.land.pot_kharab_a || '0'} Acres</strong>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Pot Kharab Class B</span>
                <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.land.pot_kharab_b || '0'} Acres</strong>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Assessed Revenue</span>
                <strong className="text-[#1f3b2c] font-semibold">₹ {verifiedPlot.land.revenue || '0.00'}</strong>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Quit Rent (Jodi)</span>
                <strong className="text-[#1f3b2c] font-semibold">₹ {verifiedPlot.land.jodi || '0.00'}</strong>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Land Category Type</span>
                <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.land.land_type || 'Dry'}</strong>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Soil Properties</span>
                <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.land.soil || ' - '}</strong>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Irrigation Source</span>
                <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.land.irrigation_source || 'Rainfed'}</strong>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Registered Trees</span>
                <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.land.trees || 'None'}</strong>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Latitude Reference</span>
                <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.gis.latitude || ' - '}</strong>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Longitude Reference</span>
                <strong className="text-[#1f3b2c] font-semibold">{verifiedPlot.gis.longitude || ' - '}</strong>
              </div>
            </div>

            {/* Crops list */}
            <div className="border-t border-[#e2d4b7] pt-4">
              <span className="text-xs text-gray-500 block mb-2 font-semibold text-[#1f3b2c]">Crops Cultivated</span>
              {verifiedPlot.crops.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {verifiedPlot.crops.map((crop, index) => (
                    <span key={index} className="rounded-lg bg-[#f0fdf4] border border-green-200 text-green-800 px-2.5 py-1 text-xs font-medium">
                      {crop.name} {crop.area ? `(${crop.area} ac)` : ''}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic">No crops recorded</span>
              )}
            </div>
          </div>

          {/* Map Card */}
          <div className="bg-white border border-[#e2d4b7] rounded-2xl p-6 flex flex-col relative">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-[#1f3b2c]">Farmland Boundary Overlay</h3>
              <button 
                onClick={handleResetMap}
                className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold hover:bg-emerald-100 transition-colors"
              >
                Recenter Boundary
              </button>
            </div>
            <div ref={mapContainerRef} className="flex-grow min-h-[400px] bg-gray-50 rounded-xl overflow-hidden relative">
              {!leafletLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <p className="text-sm text-gray-500">Loading interactive mapping engine...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
