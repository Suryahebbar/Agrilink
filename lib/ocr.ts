// Simple PDF extraction without OCR/AI - using pdftotext
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TMP = "/tmp/simple_extract.txt";

// Extract raw text from PDF using pdftotext
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Write buffer to temporary file
    const tempPdf = TMP.replace('.txt', '.pdf');
    fs.writeFileSync(tempPdf, buffer);
    
    // Extract text using pdftotext
    execSync(`pdftotext -layout -nopgbrk "${tempPdf}" "${TMP}"`);
    const text = fs.readFileSync(TMP, "utf8")
      .replace(/\u00A0/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .trim();
    
    // Clean up temp files
    try { 
      fs.unlinkSync(TMP); 
      fs.unlinkSync(tempPdf); 
    } catch {}
    
    return text;
  } catch (e) {
    console.warn('pdftotext extraction failed', e);
    return '';
  }
}

// Simple field extraction using the new service
export async function extractFarmerAndLandProfileFromText(
  rawRtcText: string,
  rawAadhaarText: string
): Promise<any> {
  // Import the extraction functions
  const { extractRTCData, extractAadhaarData } = await import('./services/pdf-extract.service');
  
  let rtcData: any = {};
  let aadhaarData: any = {};
  
  try {
    // Parse RTC data if available
    if (rawRtcText) {
      const lines = rawRtcText.split('\n').map(l => l.trim()).filter(Boolean);
      
      // Simple manual parsing
      rtcData = {
        location: {
          taluk: lines.find(l => l.includes('ತಾಲೂಕು'))?.split(' ')[0] || null,
          hobli: lines.find(l => l.includes('ಹೋಬಳಿ'))?.split(' ')[0] || null,
          village: lines.find(l => l.includes('ಗ್ರಾಮ'))?.split(' ')[0] || null
        },
        land_identification: {
          survey_number: lines.find(l => l.includes('ನಂಬರ್'))?.match(/[\d/]+/)?.[0] || null
        },
        land_details: {
          total_extent: lines.find(l => l.match(/\d+\.\d+\.\d+\.\d+/))?.match(/\d+\.\d+\.\d+\.\d+/)?.[0] || null
        },
        ownership: {
          owners: lines.filter(l => /^[A-Za-z\u0C80-\u0CFF\s]+$/.test(l)).slice(0, 3)
        }
      };
    }
    
    // Parse Aadhaar data if available
    if (rawAadhaarText) {
      const lines = rawAadhaarText.split('\n').map(l => l.trim()).filter(Boolean);
      aadhaarData = {
        name: lines.find(l => /^[A-Za-z\s]{3,}$/.test(l)) || null,
        aadhaarNumber: lines.find(l => l.match(/\d{4}\s\d{4}\s\d{4}/))?.replace(/\s/g, '') || null,
        dob: lines.find(l => l.match(/\d{2}\/\d{2}\/\d{4}/)) || null,
        gender: lines.find(l => l.match(/Male|Female/)) || null
      };
    }
  } catch (e) {
    console.warn('Field extraction failed', e);
  }

  return {
    farmer: {
      verifiedName: rtcData.ownership?.owners?.[0] || aadhaarData.name || null,
      gender: aadhaarData.gender || null,
      homeAddress: rtcData.location ? 
        `${rtcData.location.village || ''}, ${rtcData.location.hobli || ''}, ${rtcData.location.taluk || ''}`.replace(/^, |, $/g, '') : 
        aadhaarData.address || null,
      idProof: aadhaarData.aadhaarNumber ? `Aadhaar: ****${aadhaarData.aadhaarNumber.slice(-4)}` : null,
    },
    land: {
      landParcelIdentity: rtcData.land_identification?.survey_number || null,
      totalCultivableArea: rtcData.land_details?.total_extent || null,
      ownershipVerified: rtcData.ownership?.owners?.length > 0,
      soilProperties: null,
    },
  };
}
