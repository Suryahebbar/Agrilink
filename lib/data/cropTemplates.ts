export interface StageTemplate {
  stageId: string;
  name: string;
  startDayOffset: number; // Day offset relative to sowing
  endDayOffset: number;
  description: string;
  irrigationFrequencyDays: number; // Every N days
  irrigationNote: string;
  fertilizers: {
    name: string;
    dosagePerAcre: string;
    recommendedDayOffset: number;
    type: 'Basal' | 'Top-Dressing' | 'Micronutrient' | 'Foliar Spray';
  }[];
  pestRisks: {
    pestName: string;
    type: 'insect' | 'fungal' | 'bacterial' | 'viral';
    symptoms: string;
    preventionAdvisory: string;
    severity: 'low' | 'medium' | 'high';
  }[];
}

export interface CropTemplate {
  cropId: string;
  cropName: string;
  scientificName: string;
  category: 'Cereal' | 'Plantation' | 'Pulse' | 'Vegetable' | 'Oilseed';
  recommendedSeasons: string[];
  totalGrowthDurationDays: number;
  expectedYieldPerAcre: string;
  standardLabourHoursPerAcre: number;
  stages: StageTemplate[];
}

export const CROP_TEMPLATES: Record<string, CropTemplate> = {
  paddy: {
    cropId: 'paddy',
    cropName: 'Paddy (Rice)',
    scientificName: 'Oryza sativa',
    category: 'Cereal',
    recommendedSeasons: ['Kharif', 'Rabi'],
    totalGrowthDurationDays: 120,
    expectedYieldPerAcre: '22 - 28 Quintals',
    standardLabourHoursPerAcre: 60,
    stages: [
      {
        stageId: 'nursery_sowing',
        name: 'Nursery & Land Prep (D+0 to D+20)',
        startDayOffset: 0,
        endDayOffset: 20,
        description: 'Puddling, nursery raising, and basal organic manure application.',
        irrigationFrequencyDays: 2,
        irrigationNote: 'Maintain shallow 2-3cm standing water in nursery bed.',
        fertilizers: [
          { name: 'DAP (Diammonium Phosphate)', dosagePerAcre: '50 kg', recommendedDayOffset: 0, type: 'Basal' },
          { name: 'MOP (Potash)', dosagePerAcre: '25 kg', recommendedDayOffset: 0, type: 'Basal' },
          { name: 'Zinc Sulphate', dosagePerAcre: '10 kg', recommendedDayOffset: 5, type: 'Micronutrient' }
        ],
        pestRisks: [
          {
            pestName: 'Nursery Thrips',
            type: 'insect',
            symptoms: 'Curled leaf tips, silver streaking on young nursery seedlings.',
            preventionAdvisory: 'Foliar spray of Neem Seed Kernel Extract (NSKE 5%) or Azadirachtin.',
            severity: 'medium'
          }
        ]
      },
      {
        stageId: 'transplanting_tillering',
        name: 'Transplanting & Active Tillering (D+21 to D+50)',
        startDayOffset: 21,
        endDayOffset: 50,
        description: 'Sapling transplantation and maximum tiller formation stage.',
        irrigationFrequencyDays: 3,
        irrigationNote: 'Maintain 3-5cm constant submergence during tillering.',
        fertilizers: [
          { name: 'Urea (1st Split)', dosagePerAcre: '35 kg', recommendedDayOffset: 25, type: 'Top-Dressing' },
          { name: 'Urea (2nd Split)', dosagePerAcre: '35 kg', recommendedDayOffset: 45, type: 'Top-Dressing' }
        ],
        pestRisks: [
          {
            pestName: 'Yellow Stem Borer',
            type: 'insect',
            symptoms: 'Dead hearts in vegetative stage and white ears at panicle stage.',
            preventionAdvisory: 'Install Pheromone traps @ 8 traps/acre; apply Cartap Hydrochloride 4G.',
            severity: 'high'
          },
          {
            pestName: 'Paddy Blast (Magnaporthe)',
            type: 'fungal',
            symptoms: 'Spindle-shaped lesions with gray-white centers and brown margins on leaves.',
            preventionAdvisory: 'Spray Tricyclazole 75 WP @ 0.6g/L or Isoprothiolane 40 EC.',
            severity: 'high'
          }
        ]
      },
      {
        stageId: 'panicle_flowering',
        name: 'Panicle Initiation & Flowering (D+51 to D+85)',
        startDayOffset: 51,
        endDayOffset: 85,
        description: 'Panicle emergence, pollen shed, and milky grain filling.',
        irrigationFrequencyDays: 4,
        irrigationNote: 'Ensure soil does not crack; alternate wetting and moderate drying.',
        fertilizers: [
          { name: 'MOP (Potash 2nd dose)', dosagePerAcre: '15 kg', recommendedDayOffset: 55, type: 'Top-Dressing' },
          { name: '13-0-45 (Potassium Nitrate)', dosagePerAcre: '2 kg', recommendedDayOffset: 70, type: 'Foliar Spray' }
        ],
        pestRisks: [
          {
            pestName: 'Brown Plant Hopper (BPH)',
            type: 'insect',
            symptoms: 'Hopper burn patches; sudden yellowing and drying of crop base.',
            preventionAdvisory: 'Drain excess water; spray Triflumezopyrim 10 SC @ 94 ml/acre.',
            severity: 'high'
          }
        ]
      },
      {
        stageId: 'grain_maturity_harvest',
        name: 'Maturity & Harvesting (D+86 to D+120)',
        startDayOffset: 86,
        endDayOffset: 120,
        description: 'Grain hardening, moisture dropping to 14-16%, cutting and threshing.',
        irrigationFrequencyDays: 0,
        irrigationNote: 'Withdraw all standing water completely 10-12 days before harvest.',
        fertilizers: [],
        pestRisks: [
          {
            pestName: 'False Smut',
            type: 'fungal',
            symptoms: 'Individual grains transformed into greenish-yellow velvety spore balls.',
            preventionAdvisory: 'Avoid late nitrogen application; spray Copper Hydroxide if humid.',
            severity: 'low'
          }
        ]
      }
    ]
  },
  coffee: {
    cropId: 'coffee',
    cropName: 'Coffee (Robusta / Arabica)',
    scientificName: 'Coffea canephora',
    category: 'Plantation',
    recommendedSeasons: ['Perennial / Monsoon'],
    totalGrowthDurationDays: 240,
    expectedYieldPerAcre: '8 - 12 Quintals (Clean Coffee)',
    standardLabourHoursPerAcre: 85,
    stages: [
      {
        stageId: 'blossom_berry_setting',
        name: 'Blossom Showers & Berry Setting (D+0 to D+45)',
        startDayOffset: 0,
        endDayOffset: 45,
        description: 'Post-summer irrigation/showers inducing blossom and berry set.',
        irrigationFrequencyDays: 7,
        irrigationNote: 'Sprinkler irrigation of 1.5 inches to trigger uniform blossoming.',
        fertilizers: [
          { name: 'NPK 17-17-17 (Pre-Monsoon)', dosagePerAcre: '100 kg', recommendedDayOffset: 20, type: 'Basal' },
          { name: 'Zinc + Boron Foliar', dosagePerAcre: '1.5 kg', recommendedDayOffset: 35, type: 'Foliar Spray' }
        ],
        pestRisks: [
          {
            pestName: 'Coffee Berry Borer (Hypothenemus)',
            type: 'insect',
            symptoms: 'Pin-hole entry near the navel of green and ripe berries.',
            preventionAdvisory: 'Install Broca Ethanol-Methanol lures; maintain strict gleaning.',
            severity: 'high'
          }
        ]
      },
      {
        stageId: 'monsoon_berry_growth',
        name: 'Monsoon Development & Shade Management (D+46 to D+150)',
        startDayOffset: 46,
        endDayOffset: 150,
        description: 'Berry expansion, two-tier shade tree pruning, and drainage clearing.',
        irrigationFrequencyDays: 0,
        irrigationNote: 'Ensure free runoff; do not allow water stagnation near root collars.',
        fertilizers: [
          { name: 'NPK 17-17-17 (Post-Monsoon)', dosagePerAcre: '100 kg', recommendedDayOffset: 140, type: 'Top-Dressing' }
        ],
        pestRisks: [
          {
            pestName: 'Black Rot / Koleroga',
            type: 'fungal',
            symptoms: 'Blackening of leaves and berries hanging by mycelial threads.',
            preventionAdvisory: 'Foliar spray of 1% Bordeaux mixture before monsoon onset.',
            severity: 'high'
          },
          {
            pestName: 'White Stem Borer',
            type: 'insect',
            symptoms: 'Ridges on main trunk bark; foliage yellowing and wilt.',
            preventionAdvisory: 'Bark tracing, stem scrubbing, and applying lime coating.',
            severity: 'high'
          }
        ]
      },
      {
        stageId: 'berry_ripening_picking',
        name: 'Berry Ripening & Selective Picking (D+151 to D+240)',
        startDayOffset: 151,
        endDayOffset: 240,
        description: 'Color change to deep ruby red; multiple selective fly-picking rounds.',
        irrigationFrequencyDays: 14,
        irrigationNote: 'Light irrigation if extended dry spell occurs during fruit ripening.',
        fertilizers: [],
        pestRisks: [
          {
            pestName: 'Mealybugs / Green Scale',
            type: 'insect',
            symptoms: 'White waxy clusters along shoots, sooty mould on foliage.',
            preventionAdvisory: 'Drench root collars with Chlorpyrifos or spray mineral oil.',
            severity: 'medium'
          }
        ]
      }
    ]
  },
  maize: {
    cropId: 'maize',
    cropName: 'Maize (Corn)',
    scientificName: 'Zea mays',
    category: 'Cereal',
    recommendedSeasons: ['Kharif', 'Rabi', 'Summer'],
    totalGrowthDurationDays: 105,
    expectedYieldPerAcre: '25 - 30 Quintals',
    standardLabourHoursPerAcre: 35,
    stages: [
      {
        stageId: 'germination_knee_high',
        name: 'Germination to Knee-High (D+0 to D+30)',
        startDayOffset: 0,
        endDayOffset: 30,
        description: 'Plant emergence, thinning to 1 plant per hill, initial inter-cultivation.',
        irrigationFrequencyDays: 6,
        irrigationNote: 'Irrigate immediately after sowing and again at 4-leaf stage.',
        fertilizers: [
          { name: 'DAP', dosagePerAcre: '50 kg', recommendedDayOffset: 0, type: 'Basal' },
          { name: 'MOP', dosagePerAcre: '20 kg', recommendedDayOffset: 0, type: 'Basal' },
          { name: 'Urea (1st Top Dress)', dosagePerAcre: '30 kg', recommendedDayOffset: 25, type: 'Top-Dressing' }
        ],
        pestRisks: [
          {
            pestName: 'Fall Armyworm (FAW - Spodoptera frugiperda)',
            type: 'insect',
            symptoms: 'Pinholes in whorl leaves, ragged shot-hole appearance, frass in central whorl.',
            preventionAdvisory: 'Whorl application of Emamectin Benzoate 5 SG @ 0.4g/L or Chlorantraniliprole.',
            severity: 'high'
          }
        ]
      },
      {
        stageId: 'tasseling_silking',
        name: 'Tasseling & Silking Stage (D+31 to D+65)',
        startDayOffset: 31,
        endDayOffset: 65,
        description: 'Critical moisture period: tassel pollen release and silk emergence.',
        irrigationFrequencyDays: 5,
        irrigationNote: 'CRITICAL: Water stress during silking drops grain yield by up to 40%.',
        fertilizers: [
          { name: 'Urea (2nd Top Dress)', dosagePerAcre: '30 kg', recommendedDayOffset: 45, type: 'Top-Dressing' }
        ],
        pestRisks: [
          {
            pestName: 'Stem Borer (Chilo partellus)',
            type: 'insect',
            symptoms: 'Dead heart in young crops, entry holes plugged with fecal pellets.',
            preventionAdvisory: 'Release Trichogramma chilonis egg parasitoids @ 50,000/acre.',
            severity: 'medium'
          }
        ]
      },
      {
        stageId: 'grain_filling_maturity',
        name: 'Cob Maturity & Drying (D+66 to D+105)',
        startDayOffset: 66,
        endDayOffset: 105,
        description: 'Dough stage, black layer formation at cob base indicating physiological maturity.',
        irrigationFrequencyDays: 8,
        irrigationNote: 'Stop irrigation 10 days before manual de-husking and machine threshing.',
        fertilizers: [],
        pestRisks: [
          {
            pestName: 'Turcicum Leaf Blight',
            type: 'fungal',
            symptoms: 'Long elliptical grayish-green or tan lesions on leaves.',
            preventionAdvisory: 'Spray Mancozeb 75 WP @ 2g/L at first disease symptom.',
            severity: 'medium'
          }
        ]
      }
    ]
  },
  tomato: {
    cropId: 'tomato',
    cropName: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    category: 'Vegetable',
    recommendedSeasons: ['Year-round'],
    totalGrowthDurationDays: 110,
    expectedYieldPerAcre: '180 - 250 Quintals',
    standardLabourHoursPerAcre: 75,
    stages: [
      {
        stageId: 'transplanting_vegetative',
        name: 'Transplantation & Staking (D+0 to D+30)',
        startDayOffset: 0,
        endDayOffset: 30,
        description: 'Raised bed planting, drip line setup, and bamboo stake trellising.',
        irrigationFrequencyDays: 2,
        irrigationNote: 'Drip irrigation 1-2 hours daily depending on evapotranspiration.',
        fertilizers: [
          { name: 'NPK 19-19-19', dosagePerAcre: '25 kg', recommendedDayOffset: 10, type: 'Top-Dressing' },
          { name: 'Calcium Nitrate', dosagePerAcre: '15 kg', recommendedDayOffset: 25, type: 'Top-Dressing' }
        ],
        pestRisks: [
          {
            pestName: 'Whitefly / Leaf Curl Virus',
            type: 'viral',
            symptoms: 'Upward curling of leaves, thickened veins, stunted shrubby growth.',
            preventionAdvisory: 'Install yellow sticky traps @ 20/acre; spray Imidacloprid 17.8 SL.',
            severity: 'high'
          }
        ]
      },
      {
        stageId: 'flowering_fruiting',
        name: 'Flowering & Fruit Expansion (D+31 to D+75)',
        startDayOffset: 31,
        endDayOffset: 75,
        description: 'Continuous cluster flowering, fruit set, and calcium/boron supplementation.',
        irrigationFrequencyDays: 2,
        irrigationNote: 'Maintain uniform soil moisture to avoid Blossom End Rot (BER).',
        fertilizers: [
          { name: '0-52-34 (Monopotassium Phosphate)', dosagePerAcre: '20 kg', recommendedDayOffset: 40, type: 'Foliar Spray' },
          { name: 'Boron 20%', dosagePerAcre: '1 kg', recommendedDayOffset: 50, type: 'Foliar Spray' }
        ],
        pestRisks: [
          {
            pestName: 'Fruit Borer (Helicoverpa armigera)',
            type: 'insect',
            symptoms: 'Circular bored holes in developing green and breaker fruits.',
            preventionAdvisory: 'Pheromone traps; spray Spinosad 45 SC @ 0.3 ml/L.',
            severity: 'high'
          },
          {
            pestName: 'Early / Late Blight',
            type: 'fungal',
            symptoms: 'Target-board concentric ring spots on lower leaves turning black.',
            preventionAdvisory: 'Spray Azoxystrobin + Difenoconazole @ 1ml/L.',
            severity: 'high'
          }
        ]
      },
      {
        stageId: 'harvest_plucking',
        name: 'Fruit Harvesting Cycles (D+76 to D+110)',
        startDayOffset: 76,
        endDayOffset: 110,
        description: 'Pickings every 3-4 days at breaker to pink ripe stage for Mandi transit.',
        irrigationFrequencyDays: 3,
        irrigationNote: 'Regular light watering after each major harvesting batch.',
        fertilizers: [
          { name: '0-0-50 (SOP)', dosagePerAcre: '15 kg', recommendedDayOffset: 80, type: 'Top-Dressing' }
        ],
        pestRisks: [
          {
            pestName: 'Bacterial Wilt (Ralstonia)',
            type: 'bacterial',
            symptoms: 'Sudden rapid daytime wilting of plant while leaves remain green.',
            preventionAdvisory: 'Drench root zones with Streptocycline (1g/10L) + Copper Oxychloride.',
            severity: 'high'
          }
        ]
      }
    ]
  }
};
