# AgriLink

> Next-Generation Decentralized Agricultural Land Pooling, Plot Digitization, and Marketplace Platform.

---

## Executive Summary

AgriLink is an end-to-end agricultural platform designed to resolve land fragmentation, enhance agricultural productivity, and eliminate intermediaries for small and marginal farmers. By integrating Geographic Information Systems (GIS), cryptographic smart contracts, and decentralized storage, AgriLink enables transparent boundary sharing, automated revenue agreements, and verifiable land records.

---

## The Core Challenge: Agricultural Fragmentation

Small and marginal farmers often operate disjointed, small-scale land parcels that prevent the adoption of modern mechanization, precision irrigation, and bulk resource procurement. Traditional consolidation models suffer from lack of trust, manual survey disputes, and non-transparent leasing or revenue-sharing arrangements.

---

## The Solution: Village Digitizer & Land Integration

The **Village Digitizer** is a foundational subsystem within AgriLink that bridges physical survey boundaries and digital agricultural workflows.

### Why Village Digitizer Was Introduced
- **Bhoomi & Survey Record Standardization**: Converts traditional cadastre/survey plots (District, Taluk, Hobli, Village, Survey No., Hissa, and ULPIN) into standardized digital vectors.
- **Centroid & Boundary GIS Mapping**: Captures high-precision polygon coordinates, calculates cultivable versus pot kharab areas, and registers geospatial attributes.
- **Neighbor & Boundary Adjacency Detection**: Identifies adjacent parcels eligible for collective farming without altering underlying title deeds.
- **Smart Pooling Integration**: Feeds validated plot geometries directly into AgriLink's smart contract engine, enabling farmers to pool land, share operational overhead, and receive algorithmic profit payouts backed by immutable execution.

---

## System Architecture & Key Capabilities

### 1. Land Integration & Smart Pooling
- Boundary verification and automated mutual agreement generation.
- Cryptographic execution via Ethereum / Polygon compatible smart contracts.
- Decentralized document preservation using IPFS (Pinata / Web3.Storage).

### 2. Multi-Role Portals
- **Farmers**: Land linking, pool creation/joining, crop planning, weather forecasts, and marketplace sales.
- **FCO / Field Officers**: Ground verification, dispute management, and plot inspection approval.
- **Village Digitizers / Surveyors**: Cadastral mapping, GeoJSON geometry sync, and land boundary digitization.
- **Buyers & Suppliers**: Direct farm-gate procurement, farm input ordering, and logistics transparency.
- **Administrators**: Platform auditing, governance parameters, and user verification workflows.

### 3. Digital Agricultural Marketplace
- Direct farmer-to-buyer transactions without intermediary markups.
- Verified supply chain tracing and product quality records.

---

## Technology Stack

- **Framework**: Next.js 16 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS, Radix UI Primitives, Lucide Icons
- **Database & ODM**: MongoDB, Mongoose
- **Authentication & Security**: NextAuth / Custom JWT Auth with role-based access control, bcryptjs
- **Web3 & Blockchain**: Ethers.js v6, Solidity Smart Contracts, IPFS (Pinata)
- **Cloud & Media**: Cloudinary, jsPDF, html2canvas, Chart.js, XLSX

---

## Repository Structure

```text
├── app/
│   ├── about/                   # Company information and vision
│   ├── admin/                   # Administrative controls and governance
│   ├── api/
│   │   ├── digitizer/plots/     # REST APIs for Cadastral GeoJSON sync
│   │   ├── farmer/              # Land linking, pooling, agreements, profile
│   │   └── ...                  # Auth, OTP, file upload routes
│   ├── components/              # Reusable UI, contracts, and layout modules
│   ├── dashboard/               # Farmer, Supplier, and Officer Dashboards
│   ├── features/                # Platform capability overviews
│   ├── globals.css              # Global styles
│   └── page.tsx                 # Landing page
├── lib/
│   ├── db.ts                    # MongoDB connection lifecycle
│   └── models/                  # Mongoose data schemas (DigitizedPlot, User, etc.)
├── public/                      # Static assets and media
├── .env.example                 # Environment configuration template
├── package.json                 # Project dependencies and run scripts
└── tsconfig.json                # TypeScript compiler configuration
```

---

## Getting Started

### Prerequisites
- Node.js `>= 18.0.0`
- npm `>= 9.0.0` (or yarn / pnpm)
- MongoDB instance (local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/Suryahebbar/Agrilink.git
cd Agrilink
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and populate the required parameters:

```env
# Database
MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>?retryWrites=true&w=majority"

# Authentication
AUTH_SECRET="your-jwt-auth-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Notifications & Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="AgriLink <your-email@gmail.com>"
FAST2SMS_API_KEY="your-fast2sms-key"

# Blockchain & Smart Contracts
BLOCKCHAIN_MODE="development"
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_RPC_URL="https://polygon-rpc.com"
BLOCKCHAIN_CONTRACT_ADDRESS="0x..."
BLOCKCHAIN_ADMIN_PRIVATE_KEY="0x..."
NEXT_PUBLIC_CONTRACT_ADDRESS="0x..."

# Decentralized Storage & Media
IPFS_ENABLED=true
IPFS_PROVIDER="pinata"
PINATA_JWT="your-pinata-jwt"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Build and Production

To create an optimized production build:

```bash
# Compile and build the Next.js application
npm run build

# Start the production server
npm run start
```

### Linting & Code Quality
```bash
npm run lint
```

---

## Village Plot Digitizer Tool

A browser-based digitization utility to trace farmland plot boundaries directly over scanned village cadastral maps (Akarband / Grama Naksha), tag survey numbers and land ownership records, and synchronize or export them as GeoJSON.

### Running the Village Digitizer

Serve the standalone digitizer project directory locally:

```bash
cd village-digitizer-project
python -m http.server 8000
```
*(Alternatively, you can use `npx serve .` or `python3 -m http.server 8000`)*

Then open [http://localhost:8000](http://localhost:8000) in your browser.

---

## API Overview: Village Digitizer Plot Sync

The Village Digitizer module exposes RESTful endpoints for GIS map digitizers to batch synchronize cadastral plots:

- **`GET /api/digitizer/plots`**: Fetches all registered digitized cadastral plots.
- **`POST /api/digitizer/plots`**: Ingests and upserts survey numbers, GeoJSON boundaries, ownership records, and land classification data.

---

## License

This project is licensed under the MIT License.

