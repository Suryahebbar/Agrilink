# Village Plot Digitizer

A small browser tool to trace farmland plot boundaries directly on top of a scanned
village cadastral map (Akarband / Grama Naksha), tag each plot with survey number
and owner details, and export everything as a GeoJSON file.

## Files
- `index.html` – page structure
- `style.css` – styling
- `script.js` – all the drawing, panning/zooming, saving, and export logic
- `village_map.jpg` – your village map image (replace with your own if needed)

## How to run

Because the page loads `village_map.jpg` via `fetch`-like image loading, most
browsers block that over a plain `file://` path. Serve it locally instead —
one line, no install needed if you have Python:

```bash
cd village-digitizer-project
python3 -m http.server 8000
```

Then open **http://localhost:8000** in your browser.

(If you don't have Python, `npx serve` works the same way if you have Node.js installed.)

## Using it

1. Click points around a plot's boundary on the map, following the printed lines.
2. Press **Enter** or click **Finish plot** once you've gone all the way around.
3. Fill in survey number, owner, extent, land type, notes.
4. Click **Save plot** — it's stored in your browser's local storage automatically,
   so you can close the tab and resume later on the same browser/machine.
5. Repeat for as many plots as you want.
6. Click **Export GeoJSON** any time to download `village_plots.geojson` with
   everything you've traced so far.

Controls:
- Scroll to zoom in/out
- Right-click-drag, or hold Space and drag, to pan around
- Undo point / Cancel plot to fix mistakes mid-trace

## Notes on the exported GeoJSON

Coordinates are in **image pixel space** (x, y measured from the top-left of
`village_map.jpg`), not real-world latitude/longitude. This is intentional — it
keeps your traced plots pixel-perfect against the original government sketch.
It's meant to be displayed with Leaflet's `L.CRS.Simple` mode rather than a normal
lat/long tile map. If you'd like the accompanying Leaflet viewer for this file, ask
and it can be built to match.
