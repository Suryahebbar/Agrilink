export interface InsurancePolicy {
  id: string;
  name: string;
  code: string;
  provider: string;
  type: 'government' | 'private';
  category: 'yield_index' | 'weather_index' | 'revenue_protection' | 'comprehensive_peril';
  tagline: string;
  description: string;
  
  // Premium rates (% of sum insured)
  kharifPremiumRate: number; // e.g. 2.0%
  rabiPremiumRate: number;   // e.g. 1.5%
  commercialHorticultureRate: number; // e.g. 5.0%
  governmentSubsidyRate: number; // % of gross premium covered by Govt/State
  
  // Policy details
  minSumInsuredPerAcre: number;
  maxSumInsuredPerAcre: number;
  coveragePerils: string[];
  waitingPeriodDays: number;
  claimTurnaroundDays: number;
  payoutMethod: string;
  inspectionRequired: boolean;
  requiredDocuments: string[];
  
  // Pros and Cons
  highlights: string[];
  fcoRecommendationTier: 'Highly Recommended' | 'Recommended' | 'Standard';
  fcoSuitabilityNote: string;
}

export const INSURANCE_CATALOG: InsurancePolicy[] = [
  {
    id: 'pmfby-govt',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    code: 'GOV-PMFBY-2026',
    provider: 'Ministry of Agriculture & Farmers Welfare / AIC of India',
    type: 'government',
    category: 'yield_index',
    tagline: 'Comprehensive National Crop Insurance with heavy central & state premium subsidies.',
    description: 'Government of India flagship yield and weather index insurance. Premium paid by farmers is pegged low (2% Kharif, 1.5% Rabi, 5% Commercial/Horticulture), with the rest subsidized by Central & State governments.',
    kharifPremiumRate: 2.0,
    rabiPremiumRate: 1.5,
    commercialHorticultureRate: 5.0,
    governmentSubsidyRate: 75.0, // High subsidy
    minSumInsuredPerAcre: 15000,
    maxSumInsuredPerAcre: 65000,
    coveragePerils: [
      'Prevented Sowing / Planting Risk',
      'Standing Crop Mid-Season Adversity (Drought, Flood, Dry spells)',
      'Post-Harvest Loss (up to 14 days post harvest)',
      'Localized Calamities (Hailstorm, Landslide, Inundation)'
    ],
    waitingPeriodDays: 7,
    claimTurnaroundDays: 45,
    payoutMethod: 'Direct DBT Bank Transfer linked to Aadhaar / Bhoomi RTC',
    inspectionRequired: true,
    requiredDocuments: ['Pahani / RTC Document', 'Aadhaar Card', 'Bank Passbook / Cancelled Cheque', 'Sowing Certificate'],
    highlights: [
      'Lowest out-of-pocket farmer premium rate in the market',
      'Covers complete lifecycle from prevented sowing to post-harvest',
      'Mandatory link with KCC crop loan accounts'
    ],
    fcoRecommendationTier: 'Highly Recommended',
    fcoSuitabilityNote: 'Best suited for standard food grains, pulses, and oilseed pooling clusters looking for maximum government subsidy.'
  },
  {
    id: 'hdfc-ergo-agri',
    name: 'HDFC ERGO Krishi Suraksha - Parametric Crop Cover',
    code: 'PRV-HDFC-KS26',
    provider: 'HDFC ERGO General Insurance Co.',
    type: 'private',
    category: 'weather_index',
    tagline: 'High-speed automated satellite & weather station trigger payouts with fast turnaround.',
    description: 'Private parametric crop insurance offering high-speed payouts when localized weather stations or satellite NDVI indices breach rainfall or temperature thresholds.',
    kharifPremiumRate: 3.5,
    rabiPremiumRate: 2.8,
    commercialHorticultureRate: 4.8,
    governmentSubsidyRate: 0,
    minSumInsuredPerAcre: 25000,
    maxSumInsuredPerAcre: 150000,
    coveragePerils: [
      'Deficit & Excess Rainfall (Automated AWS trigger)',
      'Extreme Heatwaves & Frost index',
      'High Windspeed & Cyclone damage',
      'Unseasonal Rain during harvest window'
    ],
    waitingPeriodDays: 3,
    claimTurnaroundDays: 14,
    payoutMethod: 'Fast Electronic NEFT Settlement directly to Pool Escrow or Farmer Accounts',
    inspectionRequired: false,
    requiredDocuments: ['RTC / Land Integration Proof', 'AgriLink Pool Contract', 'KYC Document'],
    highlights: [
      'No lengthy field yield cutting experiment required',
      '14-day rapid claim settlement via automated parametric sensors',
      'High sum insured cap suited for high-value coffee, arecanut, and spices'
    ],
    fcoRecommendationTier: 'Highly Recommended',
    fcoSuitabilityNote: 'Ideal for Commercial & Plantation clusters (Coffee, Pepper, Arecanut, Cardamom) requiring quick turnaround without red tape.'
  },
  {
    id: 'icici-lombard-crop',
    name: 'ICICI Lombard Kisan Kavach - Comprehensive Peril',
    code: 'PRV-ICICI-KK26',
    provider: 'ICICI Lombard General Insurance Ltd.',
    type: 'private',
    category: 'comprehensive_peril',
    tagline: 'Custom farm-level individual damage assessment with FCO surveyor sign-off.',
    description: 'Private tailored farm risk policy that allows pool-level group coverage with expedited FCO on-site damage assessment integration.',
    kharifPremiumRate: 4.0,
    rabiPremiumRate: 3.2,
    commercialHorticultureRate: 5.5,
    governmentSubsidyRate: 0,
    minSumInsuredPerAcre: 20000,
    maxSumInsuredPerAcre: 180000,
    coveragePerils: [
      'Pest Outbreak & Fungal Disease Epidemics (Kole Roga, Leaf Rust)',
      'Flash Floods & Soil Erosion',
      'Hailstorm & Severe Lightning Storms',
      'Post-Harvest Storage Fire & Spoilage in transit'
    ],
    waitingPeriodDays: 5,
    claimTurnaroundDays: 18,
    payoutMethod: 'AgriLink Pool Smart Contract Escrow / Bank Settlement',
    inspectionRequired: true,
    requiredDocuments: ['RTC Record', 'FCO Inspection Certificate', 'Damage Geotagged Media'],
    highlights: [
      'Includes pest & disease epidemic coverage often excluded in standard schemes',
      'Integrated FCO field inspection workflow',
      'Flexible sum insured customized to input investment cost'
    ],
    fcoRecommendationTier: 'Recommended',
    fcoSuitabilityNote: 'Recommended for horticulture pools exposed to severe monsoon pest/fungal rot threats.'
  },
  {
    id: 'bajaj-allianz-crop',
    name: 'Bajaj Allianz Farm Shield Plus',
    code: 'PRV-BAJAJ-FSP26',
    provider: 'Bajaj Allianz General Insurance',
    type: 'private',
    category: 'revenue_protection',
    tagline: 'Guaranteed Revenue Protection against severe market price drop + crop destruction.',
    description: 'Hybrid crop insurance blending localized yield loss coverage with price drop protection buffers during harvest liquidation.',
    kharifPremiumRate: 4.5,
    rabiPremiumRate: 3.8,
    commercialHorticultureRate: 6.2,
    governmentSubsidyRate: 0,
    minSumInsuredPerAcre: 30000,
    maxSumInsuredPerAcre: 200000,
    coveragePerils: [
      'Severe Yield Reduction (< 60% of regional average)',
      'Extreme Price Crash Buffer Protection',
      'Inundation & Landslide',
      'Wildlife / Elephant Herd Crop Depredation'
    ],
    waitingPeriodDays: 7,
    claimTurnaroundDays: 21,
    payoutMethod: 'Direct Pool Bank Account Transfer',
    inspectionRequired: true,
    requiredDocuments: ['Land RTC Document', 'AgriLink Farm Agreement', 'Market APMC Price Index Slip'],
    highlights: [
      'Unique wildlife depredation coverage for Western Ghats / Chikkamagaluru border farms',
      'Revenue buffer mechanism',
      'Covers transport losses up to regional APMC market'
    ],
    fcoRecommendationTier: 'Recommended',
    fcoSuitabilityNote: 'Best suited for coffee & cardamom estates bordering forest fringes with elephant corridor risks.'
  },
  {
    id: 'wbcis-govt',
    name: 'Restructured Weather Based Crop Insurance (RWBCIS)',
    code: 'GOV-WBCIS-2026',
    provider: 'AIC of India & State Agriculture Department',
    type: 'government',
    category: 'weather_index',
    tagline: 'Government subsidized weather parametric insurance for notified talukas.',
    description: 'State and Central sponsored weather index insurance using Reference Weather Stations (RWS) data to compensate farmers against adverse weather triggers.',
    kharifPremiumRate: 2.0,
    rabiPremiumRate: 1.5,
    commercialHorticultureRate: 5.0,
    governmentSubsidyRate: 70.0,
    minSumInsuredPerAcre: 18000,
    maxSumInsuredPerAcre: 80000,
    coveragePerils: [
      'Rainfall Deficit / Consecutive Dry Days',
      'Excess Unseasonal Rainfall at Flowering Stage',
      'Relative Humidity & High Temperature fluctuations',
      'Chilling hours shortage for temperate crops'
    ],
    waitingPeriodDays: 0,
    claimTurnaroundDays: 35,
    payoutMethod: 'Aadhaar Payment Bridge to Farmer Bank Account',
    inspectionRequired: false,
    requiredDocuments: ['RTC Pahani Copy', 'Aadhaar Card', 'Land Registration Number'],
    highlights: [
      '100% transparent weather station trigger calculation',
      'No individual assessment required',
      'Subsidized government premium'
    ],
    fcoRecommendationTier: 'Standard',
    fcoSuitabilityNote: 'Good for smallholder farmers located within 15 km of an operational IMD weather station.'
  }
];

export interface PremiumCalculationParams {
  cropName: string;
  season: 'Kharif' | 'Rabi' | 'Commercial/Horticulture' | 'Perennial';
  acres: number;
  estimatedCost: number;
  expectedRevenue?: number;
  policyId?: string;
}

export interface PremiumCalculationResult {
  policy: InsurancePolicy;
  sumInsuredPerAcre: number;
  totalSumInsured: number;
  applicableRatePercent: number;
  grossPremium: number;
  govtSubsidyAmount: number;
  farmerNetPremium: number;
  perAcreCost: number;
  isRecommended: boolean;
}

export function calculateInsurancePremium(params: PremiumCalculationParams): PremiumCalculationResult[] {
  const { cropName, season, acres, estimatedCost, expectedRevenue, policyId } = params;
  
  const targetPolicies = policyId 
    ? INSURANCE_CATALOG.filter(p => p.id === policyId)
    : INSURANCE_CATALOG;

  const results: PremiumCalculationResult[] = targetPolicies.map(policy => {
    // Determine base rate based on crop & season
    let baseRate = policy.kharifPremiumRate;
    const lowerCrop = (cropName || '').toLowerCase();
    const isCommercial = lowerCrop.includes('coffee') || 
      lowerCrop.includes('pepper') || 
      lowerCrop.includes('arecanut') || 
      lowerCrop.includes('cardamom') || 
      lowerCrop.includes('rubber') || 
      lowerCrop.includes('tea') || 
      lowerCrop.includes('ginger') || 
      lowerCrop.includes('sugarcane') ||
      season === 'Commercial/Horticulture' || 
      season === 'Perennial';

    if (isCommercial) {
      baseRate = policy.commercialHorticultureRate;
    } else if (season === 'Rabi') {
      baseRate = policy.rabiPremiumRate;
    } else {
      baseRate = policy.kharifPremiumRate;
    }

    // Determine sum insured per acre
    const defaultSumInsured = acres > 0 && estimatedCost > 0 
      ? Math.max(policy.minSumInsuredPerAcre, Math.min(policy.maxSumInsuredPerAcre, Math.round(estimatedCost / acres)))
      : (policy.minSumInsuredPerAcre + policy.maxSumInsuredPerAcre) / 2;

    const totalSumInsured = Math.round(defaultSumInsured * acres);
    const grossPremium = Math.round((totalSumInsured * baseRate) / 100);
    
    // Calculate government subsidy if applicable
    const govtSubsidyAmount = policy.type === 'government' 
      ? Math.round((grossPremium * policy.governmentSubsidyRate) / 100) 
      : 0;

    const farmerNetPremium = Math.max(0, grossPremium - govtSubsidyAmount);
    const perAcreCost = acres > 0 ? Math.round(farmerNetPremium / acres) : 0;

    const isRecommended = isCommercial 
      ? (policy.id === 'hdfc-ergo-agri' || policy.id === 'icici-lombard-crop')
      : (policy.id === 'pmfby-govt');

    return {
      policy,
      sumInsuredPerAcre: defaultSumInsured,
      totalSumInsured,
      applicableRatePercent: baseRate,
      grossPremium,
      govtSubsidyAmount,
      farmerNetPremium,
      perAcreCost,
      isRecommended
    };
  });

  return results;
}
