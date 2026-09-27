import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

// STEP 1  -  Extract raw text from PDF using pdfjs-dist
async function extractRaw(pdfPath: string): Promise<string> {
  if (!pdfPath || typeof pdfPath !== 'string') {
    throw new Error('Invalid PDF path provided');
  }

  try {
    let buffer: Buffer;
    if (isHttpUrl(pdfPath)) {
      const res = await fetch(pdfPath);
      if (!res.ok) {
        throw new Error(`Failed to download PDF (${res.status} ${res.statusText})`);
      }
      buffer = Buffer.from(await res.arrayBuffer());
    } else {
      buffer = fs.readFileSync(pdfPath);
    }

    const workerPath = path.resolve(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
    });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const items = textContent.items;
      let lastY = null;
      let pageText = '';
      
      for (const item of items) {
        if ('str' in item) {
          const cleanStr = item.str.replace(/\u0000/g, '');
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            pageText += '\n';
          }
          pageText += cleanStr;
          lastY = item.transform[5];
        }
      }
      fullText += pageText + '\n';
    }
    
    return fullText
      .replace(/\u00A0/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .trim();
  } catch (error) {
    console.error('pdfjs-dist extraction failed:', error);
    return '';
  }
}

// STEP 2  -  Clean into usable lines
function cleanLines(text: string): string[] {
  return text.split("\n").map(l => l.trim()).filter(Boolean);
}

// STEP 3  -  Parse based strictly on positions
function parseRTC(lines: string[]) {
  console.log('RTC lines for debugging:', lines);
  
  // Try to find location lines with actual place names (not just "ನಂಬರ್")
  // Try to find location lines with actual place names (not just "ನಂಬರ್")
  const locationLines = lines.filter(l => 
    l.includes('ತಾಲ್ಲೂಕು') || l.includes('ಹೋಬಳಿ') || 
    l.includes('ಗ್ರಾಮ') || l.includes('ವಿಳಾಸ') ||
    (l.includes('ತಾಲ್ಲೂ') && l.includes('ಕು:')) ||
    l.includes('ಹೋಬಳಿ') || l.includes('ಗ್ರಾ') ||
    l.includes('ಾಲೂ') || l.includes('ೂೕಬಳಿ') || l.includes('ಾ ಮ')
  );
  
  console.log('Found location lines:', locationLines);
  
  let taluk = null, hobli = null, village = null, survey_number = null;
  
  // Try to extract from location lines first
  if (locationLines.length > 0) {
    const locLine = locationLines[0]; // Use first location line
    console.log('Using location line:', locLine);
    
    const parts = locLine.split(':').map(p => p.trim());
    console.log('Colon-separated parts:', parts);
    
    if (parts.length >= 2) {
      // Taluk name is in parts[1], before "ಹೋಬಳಿ" or "ೆ ೂೕಬಳಿ"
      const talukPart = parts[1];
      const hobliLabelIdx = talukPart.search(/ಹೋಬಳಿ|ೆ\s*ೂೕಬಳಿ|ೂೕಬಳಿ/);
      if (hobliLabelIdx !== -1) {
        taluk = talukPart.substring(0, hobliLabelIdx).trim().replace(/\s+/g, '');
      } else {
        taluk = talukPart.trim().replace(/\s+/g, '');
      }
      
      // Hobli & Village are in parts[2]
      if (parts.length >= 3) {
        const remaining = parts[2]; // "ಾೆೊನೂ ರು ಾ ಮ ಾತೂರು ಸೆ ೕ ನಂಬ್ 1/*/3 ..."
        const graLabelIdx = remaining.search(/ಗ್ರಾಮ|ಾ\s*ಮ/);
        if (graLabelIdx !== -1) {
          hobli = remaining.substring(0, graLabelIdx).trim().replace(/\s+/g, '');
          
          const afterGra = remaining.substring(graLabelIdx).replace(/^(ಗ್ರಾಮ|ಾ\s*ಮ)/, '').trim();
          const numLabelIdx = afterGra.search(/ಸರ್ವೆ|ಸೆ\s*ೕ|ನಂಬರ್|ನಂಬ್/);
          if (numLabelIdx !== -1) {
            village = afterGra.substring(0, numLabelIdx).trim().replace(/\s+/g, '');
          } else {
            village = afterGra.trim().replace(/\s+/g, '');
          }
        }
      }
    }
    
    // Extract survey number from the last part
    const surveyMatch = locLine.match(/(\d+\/\S+|\d+\*\/\d+|\d+\/\*\/\d+)/);
    survey_number = surveyMatch ? surveyMatch[1] : null;
    
    console.log('Robust location extraction result:', { taluk, hobli, village, survey_number });
  }
  
  // Fallback to original logic if no location lines found
  if (!taluk && !hobli && !village) {
    const locLine = lines.find(l => l.includes("ನಂಬರ್"));
    console.log('Fallback to survey line:', locLine);
    
    if (locLine) {
      const t = locLine.split(" ").filter(Boolean);
      console.log('Location line parts:', t);
      
      // Try to find actual survey number (numeric)
      const surveyNum = t.find(v => v.match(/^\d+\/\S+|\d+\*\/\d+/)) || t.find(v => v.match(/\d+/));
      console.log('Found survey number:', surveyNum);
      
      // Find index of survey number to extract location parts before it
      const surveyIndex = t.findIndex(v => v === surveyNum || v.includes(surveyNum || ''));
      console.log('Survey index:', surveyIndex);
      
      if (surveyIndex > 0) {
        // Extract location parts from before the survey number
        const locationParts = t.slice(0, surveyIndex);
        console.log('Location parts:', locationParts);
        
        // Try to identify proper location names
        taluk = locationParts.find(p => p.includes('ತಾಲ್ಲೂ')) || locationParts[0] || null;
        hobli = locationParts.find(p => p.includes('ಹೋಬಳಿ') || p.includes('ಕು:')) || locationParts[1] || null;
        village = locationParts.find(p => p.includes('ಗ್ರಾ') || p.includes('ವಿಳಾಸ')) || 
                  (locationParts.length > 2 ? locationParts.slice(2).join(' ') : null);
        survey_number = surveyNum || null;
      } else {
        // Fallback to original logic
        taluk = t[0] || null;
        hobli = t[1] || null;
        village = t[2] || null;
        survey_number = t.find(v => v.includes("ನಂಬರ್") || v.match(/[\d/]+\*/)) || null;
      }
    }
  }
  
  console.log('Extracted location:', { taluk, hobli, village, survey_number });

  // VALID FROM (fixed format)
  const validFromLine = lines.find(l => l.includes("Valid from"));
  const valid_from = validFromLine?.match(/\d{2}\/\d{2}\/\d{4}\s*\d{2}:\d{2}/)?.[0] || null;

  // HISSA NUMBER
  const hissaLine = lines.find(l => l.includes("ಹಿಸ್ಸಾ"));
  console.log('Found hissa line:', hissaLine);
  let hissa_number = null;
  
  if (survey_number && survey_number.includes("/")) {
    hissa_number = survey_number.split("/").pop()?.replace("*", "") || null;
  } else {
    // Try to find hissa number separately
    const hissaMatch = hissaLine?.match(/(\d+)/);
    hissa_number = hissaMatch ? hissaMatch[1] : null;
  }
  
  console.log('Extracted hissa number:', hissa_number);

  // TOTAL EXTENT
  const extentLine = lines.find(l => l.match(/\d+\.\d+\.\d+\.\d+/));
  const total_extent = extentLine?.match(/\d+\.\d+\.\d+\.\d+/)?.[0] || null;

  // PHUT KHARAB A & B
  const extentIndex = lines.indexOf(extentLine || '');
  const phut_a = lines[extentIndex + 1]?.match(/\d+\.\d+\.\d+\.\d+/)?.[0] || null;
  const phut_b = lines[extentIndex + 2]?.match(/\d+\.\d+\.\d+\.\d+/)?.[0] || null;

  // LAND TAX
  const taxLine = lines.find(l => l.includes("ಕಂದಾಯ"));
  const land_tax = taxLine?.match(/\d+(\.\d+)?/)?.[0] || null;

  // SOIL TYPE
  const soilIdx = lines.findIndex(l => l.includes("ನಮೂನೆ"));
  const soil_type = soilIdx !== -1 ? lines[soilIdx + 1] : null;

  // OWNERSHIP
  const ownerLine = lines.find(l =>
    l.includes(".") &&
    l.match(/\d+\.\d+\.\d+\.\d+/) &&
    l.match(/\b\d{1,4}\b/) &&
    l.match(/\bMR\b/i)
  );

  let owners: string[] = [], ownerExtent = null, account_no = null, mutation_no = null, mutation_date = null;

  if (ownerLine) {
    console.log('Raw owner line:', ownerLine);
    const t = ownerLine.split(" ").filter(Boolean);
    const extIdx = t.findIndex(v => v.match(/\d+\.\d+\.\d+\.\d+/));
    
    const ownerPart = t.slice(0, extIdx).join(" ");
    console.log('Owner part before processing:', ownerPart);
    
    // Get the next line to check for additional name parts like "ಎಲ್"
    const ownerLineIndex = lines.indexOf(ownerLine);
    const nextLine = ownerLineIndex !== -1 && ownerLineIndex + 1 < lines.length 
      ? lines[ownerLineIndex + 1] 
      : null;
    
    console.log('Next line after owner:', nextLine);
    
    // Combine owner part with next line if it contains name parts
    let extractedName = ownerPart;
    if (nextLine && /[\u0C80-\u0CFF]/.test(nextLine)) {
      // Extract name part from next line (before stop words)
      let nextLineName = nextLine;
      const stopWords = ["ಕೋಂ", "ಬಿನ್"];
      
      for (const stopWord of stopWords) {
        const stopIndex = nextLineName.indexOf(stopWord);
        if (stopIndex !== -1) {
          nextLineName = nextLineName.substring(0, stopIndex);
          console.log(`Found stop word "${stopWord}" in next line, cutting to:`, nextLineName);
          break;
        }
      }
      
      // Extract only Kannada characters from next line
      const kannadaPart = nextLineName
        .match(/[\u0C80-\u0CFF\s.]+/g)?.[0] || nextLineName;
      
      // Combine the names
      extractedName = (ownerPart + ' ' + kannadaPart).trim();
      console.log('Combined name from owner + next line:', extractedName);
    }
    
    // Now apply stop words to the combined name
    const stopWords = ["ಕೋಂ", "ಬಿನ್"];
    for (const stopWord of stopWords) {
      const stopIndex = extractedName.indexOf(stopWord);
      if (stopIndex !== -1) {
        extractedName = extractedName.substring(0, stopIndex);
        console.log(`Found stop word "${stopWord}" in combined name, cutting to:`, extractedName);
        break;
      }
    }
    
    // Remove punctuation marks and clean up the name
    extractedName = extractedName
      .replace(/[.,]/g, '') // Remove dots and commas
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    console.log('Final extracted name:', extractedName);
    
    // Take only the first owner name (before any separators like -)
    const firstOwner = extractedName.split(/[-,]/)[0].trim();
    console.log('First owner name:', firstOwner);
    
    // Apply normalization (remove punctuation and spaces) to match Aadhar format
    const normalizedOwnerName = normalizeName(firstOwner);
    console.log('Normalized RTC owner name:', normalizedOwnerName);
    
    // Store the normalized name as a single-element array
    owners = normalizedOwnerName && normalizedOwnerName.length > 0 ? [normalizedOwnerName] : [];
    
    ownerExtent = t[extIdx];
    account_no = t[extIdx + 1] || null;
    mutation_no = t.slice(extIdx + 2).find(v => v.includes("MR")) || null;
  }

  const dateMatch = lines.find(l => l.match(/\d{2}\/\d{2}\/\d{4}/));
  mutation_date = dateMatch?.match(/\d{2}\/\d{2}\/\d{4}/)?.[0] || null;

  // CULTIVATION LINES
  const cultivation = lines
    .filter(l => l.match(/\d{4}-\d{4}/))
    .map(l => ({
      year: l.match(/\d{4}-\d{4}/)?.[0] || null,
      season: l.includes("ಮುಂಗಾರು") ? (l.includes("ಪೂ.") ? "ಪೂರ್ವ ಮುಂಗಾರು" : "ಉತ್ತರ ಮುಂಗಾರು") : null,
      crop: l.includes("ಹು") ? "ಹು" : null,
      extent: l.match(/\d+\.\d+\.\d+\.\d+/)?.[0] || null
    }));

  return {
    location: { taluk, hobli, village },
    land_identification: { survey_number, hissa_number, valid_from },
    land_details: {
      total_extent,
      phut_kharab_a: phut_a,
      phut_kharab_b: phut_b,
      remaining_extent: total_extent,
      land_tax,
      soil_type
    },
    ownership: {
      owners,
      extent: ownerExtent,
      account_no,
      mutation_no,
      mutation_date
    },
    cultivation
  };
}

// Function to normalize names by removing punctuation and spaces
function normalizeName(name: string | null): string | null {
  if (!name) return null;
  
  return name
    .replace(/[.,;:!?'"(){}[\]\\]/g, '') // Remove all punctuation marks
    .replace(/\s+/g, '') // Remove all spaces
    .trim();
}

// Main extraction function
export async function extractRTCData(pdfPath: string) {
  if (!pdfPath || typeof pdfPath !== 'string') {
    throw new Error('Invalid PDF path provided');
  }
  
  try {
    console.log(`Extracting data from: ${pdfPath}`);
    const raw = await extractRaw(pdfPath);
    if (!raw) {
      throw new Error('Failed to extract text from PDF');
    }
    
    const lines = cleanLines(raw);
    console.log(`Extracted ${lines.length} lines from PDF`);
    
    const result = parseRTC(lines);
    console.log('Parsed RTC data:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('RTC extraction error:', error);
    throw error;
  }
}

// For Aadhaar, use improved text extraction
export async function extractAadhaarData(pdfPath: string) {
  if (!pdfPath || typeof pdfPath !== 'string') {
    throw new Error('Invalid PDF path provided');
  }
  
  try {
    console.log(`Extracting Aadhaar data from: ${pdfPath}`);
    const raw = await extractRaw(pdfPath);
    const result = parseAadhaar(raw);
    console.log('Parsed Aadhaar data:', result);
    return result;
  } catch (error) {
    console.error('Aadhaar extraction error:', error);
    return {
      aadhaar_number: null,
      name_english: null,
      name_kannada: null,
      dob: null,
      gender: null,
      mobile: null,
      address: null
    };
  }
}

// Clean trailing commas/spaces
function clean(s: string): string | null {
  return s ? s.replace(/[,]+$/g, "").replace(/\s+/g, " ").trim() : null;
}

function parseAadhaar(text: string) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // -------------------------
  // Aadhaar Number
  // -------------------------
  const aadhaar = text.match(/\b\d{4}\s\d{4}\s\d{4}\b/);
  const aadhaarNumber = aadhaar ? aadhaar[0] : null;

  // -------------------------
  // Mobile Number
  // -------------------------
  const mobile = text.match(/[6-9]\d{9}/);
  const mobileNumber = mobile ? mobile[0] : null;

  // -------------------------
  // English Name
  // -------------------------
  const forbiddenEng = [
    "to", "c/o", "s/o", "w/o", "h/o",
    "address", "vtc", "po", "district",
    "state", "pin", "mobile", "dob",
    "male", "female", "verified",
    "signature", "digitally", "enrol",
    "identification", "authority", "india", "government", "unique",
    "uid", "enrollment", "card", "resident"
  ];

  const nameEnglish =
    lines.find(l =>
      /^[A-Za-z ]+$/.test(l) &&
      !forbiddenEng.some(f => l.toLowerCase().includes(f)) &&
      l.length > 3 &&
      l.length < 50 && // Reasonable name length
      l.split(' ').length >= 2 && // At least first and last name
      l.split(' ').length <= 4 // Max 4 name parts
    ) || null;

  // -------------------------
  // Kannada Name
  // -------------------------
  const forbiddenKan = [
    "ವಿಳಾ", "ನೋಂದಣಿ", "ನಂ", "DOB", "ಜನ್ಮ",
    "ವಿಳಾಸ", "ಮನೆ", "ರಸ್ತೆ", "ಬಡಾವಣೆ",
    "ತಾಲ್ಲೂಕು", "ಜಿಲ್ಲೆ", "ರಾಜ್ಯ", "ಪಿನ್",
    "ಸಹಿ", "ಸಹಿತ", "ಆಧಾರ್", "ಗುರುತು"
  ];

  const nameKannada =
    lines.find(l =>
      /[\u0C80-\u0CFF]+/.test(l) &&
      !forbiddenKan.some(f => l.includes(f)) &&
      l.length > 2 &&
      l.length < 30 && // Reasonable name length
      l.split(' ').length <= 3 // Max 3 name parts
    ) || null;

  // -------------------------
  // DOB
  // -------------------------
  const dobMatch = text.match(/DOB[: ]*(\d{2}\/\d{2}\/\d{4})/i);
  const dob = dobMatch ? dobMatch[1] : null;

  // -------------------------
  // Gender
  // -------------------------
  console.log('Aadhaar text for gender extraction:', text);
  
  let gender = null;
  
  // Try multiple patterns for gender extraction
  const genderPatterns = [
    /(?:Gender|GEN|G)[:\s]*(Male|Female|MALE|FEMALE)/i,
    /(?:Male|Female|MALE|FEMALE)(?:\s*[:\-])?/i,
    /\b(Male|Female|MALE|FEMALE)\b/i,
    /ಪುರುಷ|ಸ್ತ್ರೀ|ಮಹಿಳಾ/i // Kannada gender words
  ];
  
  for (const pattern of genderPatterns) {
    const match = text.match(pattern);
    if (match) {
      let genderValue = match[1];
      if (genderValue) {
        gender = genderValue.toUpperCase();
      } else {
        // Handle Kannada gender words
        const kannadaGender = match[0];
        if (kannadaGender.includes('ಪುರುಷ')) gender = 'MALE';
        else if (kannadaGender.includes('ಸ್ತ್ರೀ') || kannadaGender.includes('ಮಹಿಳಾ')) gender = 'FEMALE';
      }
      console.log(`Gender pattern matched: ${pattern}, result: ${gender}`);
      break;
    }
  }
  
  // Fallback to simple check
  if (!gender) {
    gender = /MALE|ಪುರುಷ/i.test(text)
      ? "MALE"
      : /FEMALE|ಸ್ತ್ರೀ|ಮಹಿಳಾ/i.test(text)
      ? "FEMALE"
      : null;
  }
  
  console.log('Final gender extraction result:', gender);

  // -------------------------
  // English Address
  // -------------------------
  let addrEng = null;
  const engStart = lines.findIndex(l =>
    /\b(?:C\/O|S\/O|W\/O|H\/O)\s*:/i.test(l) ||
    /\bAddress\s*:/i.test(l)
  );

  if (engStart !== -1) {
    let block = [];

    for (let i = engStart; i < lines.length; i++) {
      const line = lines[i];

      // If line contains Address: prefix, keep only the part after it
      const normalizedLine = /\bAddress\s*:/i.test(line)
        ? line.replace(/.*\bAddress\s*:\s*/i, '')
        : line;

      // stop conditions for English address
      if (line.match(/\b\d{4} \d{4} \d{4}\b/)) break;
      if (/Signature|Digitally|Verified|Enrol|Mobile:|VID\s*:|DOB|Details as on/i.test(line)) break;

      const cleaned = clean(normalizedLine);
      if (cleaned) block.push(cleaned);
    }
    addrEng = clean(block.join(", "));
  }

  // -------------------------
  // Kannada Address (pure Kannada only)
  // -------------------------
  let addrKan = null;
  const kanStart = lines.findIndex(
    l => l.includes("ವಿಳಾ") || l.includes("ವಿಳಾಸ")
  );

  if (kanStart !== -1) {
    let block = [];

    for (let i = kanStart + 1; i < lines.length; i++) {
      const line = lines[i].trim();

      // Stop ONLY if the line is clearly not Kannada
      if (line.match(/\b\d{4} \d{4} \d{4}\b/)) break; // Aadhaar number
      if (/Enrol|Signature|Digitally|Verified|DOB|Details as on/i.test(line)) break;

      const kan = line.match(/[\u0C80-\u0CFF]/g)?.length || 0;
      const eng = line.match(/[A-Za-z]/g)?.length || 0;

      // Keep line only if Kannada chars dominate English chars
      if (kan > eng) {
        block.push(clean(line));
      }
    }

    addrKan = clean(block.join(", "));
  }

  return {
    aadhaar_number: aadhaarNumber,
    name_english: normalizeName(nameEnglish),
    name_kannada: normalizeName(nameKannada),
    dob,
    gender,
    mobile: mobileNumber,
    address: addrEng || addrKan,
  };
}