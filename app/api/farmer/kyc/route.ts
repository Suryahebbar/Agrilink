import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { FarmerProfile } from '../../../../lib/models/FarmerProfile';
import { processDocument, getDocumentResult } from '../../../../lib/services/simple-extract.service';
import { getUserFromRequest } from '../../../../lib/auth';
import { v4 as uuidv4 } from 'uuid';
import Document from '../../../../lib/models/Document';
import { uploadFile } from '@/lib/cloudinary';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Function to normalize names for comparison (remove punctuation and spaces)
function normalizeNameForComparison(name: string | null | undefined): string | null {
  if (!name) return null;
  
  return name
    .replace(/[.,;:!?'"(){}[\]\\]/g, '') // Remove all punctuation marks
    .replace(/\s+/g, '') // Remove all spaces
    .trim();
}

// Strip all Kannada vowel signs/modifiers to get raw consonants
function getKannadaConsonants(name: string | null | undefined): string {
  if (!name) return '';
  const cleaned = name
    .replace(/[.,;:!?'"(){}[\]\\/\-_+*&%#@]/g, '') // Remove punctuation
    .replace(/\s+/g, '') // Remove spaces
    .replace(/\u0000/g, ''); // Remove null chars
  return cleaned.replace(/[\u0C82\u0CBE-\u0CCD\u0CD5\u0CD6]/g, '');
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function getSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return (maxLength - dist) / maxLength;
}

function matchKannadaNames(rtcName: string | null | undefined, aadhaarName: string | null | undefined): boolean {
  if (!rtcName || !aadhaarName) return false;
  
  const cleanRTC = rtcName.replace(/[.,;:!?'"(){}[\]\\/\-_+*&%#@]/g, '').replace(/\s+/g, '').replace(/\u0000/g, '').trim();
  const cleanAadhaar = aadhaarName.replace(/[.,;:!?'"(){}[\]\\/\-_+*&%#@]/g, '').replace(/\s+/g, '').replace(/\u0000/g, '').trim();
  
  if (cleanRTC === cleanAadhaar) return true;
  
  const consRTC = getKannadaConsonants(rtcName);
  const consAadhaar = getKannadaConsonants(aadhaarName);
  
  if (consRTC && consAadhaar && consRTC === consAadhaar) return true;
  
  const similarity = getSimilarity(cleanRTC, cleanAadhaar);
  if (similarity >= 0.70) return true;
  
  if (consRTC && consAadhaar && (consRTC.includes(consAadhaar) || consAadhaar.includes(consRTC))) {
    return true;
  }
  
  return false;
}

function matchLocation(location: any, aadharFullText: string): boolean {
  if (!location) return false;
  
  const aadharLower = aadharFullText.toLowerCase();
  const village = location.village ? location.village.toLowerCase() : '';
  const taluk = location.taluk ? location.taluk.toLowerCase() : '';
  
  const cleanVillage = village.replace(/[.,;:!?'"(){}[\]\\/\-_+*&%#@\s\u0000]/g, '');
  const cleanTaluk = taluk.replace(/[.,;:!?'"(){}[\]\\/\-_+*&%#@\s\u0000]/g, '');
  
  let villageMatch = false;
  let talukMatch = false;
  
  // 1. Direct Kannada match in Aadhaar text
  if (cleanVillage && aadharFullText.replace(/\s+/g, '').includes(cleanVillage)) {
    villageMatch = true;
  }
  if (cleanTaluk && aadharFullText.replace(/\s+/g, '').includes(cleanTaluk)) {
    talukMatch = true;
  }
  
  // 2. Consonant match in Kannada
  const consVillage = getKannadaConsonants(village);
  const consTaluk = getKannadaConsonants(taluk);
  const consAadhar = getKannadaConsonants(aadharFullText);
  
  if (consVillage && consAadhar.includes(consVillage)) {
    villageMatch = true;
  }
  if (consTaluk && consAadhar.includes(consTaluk)) {
    talukMatch = true;
  }
  
  // 3. Simple phonetic / English keyword check (fallback)
  const englishKeywords: { [key: string]: string[] } = {
    'ಾತೂರು': ['hathur', 'hathuru', 'athur'],
    'ನರಸಿಂಹಾಜಪರ': ['narasimharajapura', 'narasimha', 'n.r.pura', 'nr pura'],
    'ಬೆಳೂರು': ['bellur', 'belur'],
    'ಬಾಳೆಹೊನ್ನೂರು': ['balehonnur', 'balehonnuru'],
    'ಾೆೊನೂರು': ['balehonnur', 'balehonnuru']
  };
  
  for (const [kanKey, engKeys] of Object.entries(englishKeywords)) {
    if (village.includes(kanKey) || kanKey.includes(village)) {
      if (engKeys.some(k => aadharLower.includes(k))) {
        villageMatch = true;
      }
    }
    if (taluk.includes(kanKey) || kanKey.includes(taluk)) {
      if (engKeys.some(k => aadharLower.includes(k))) {
        talukMatch = true;
      }
    }
  }
  
  if (village.match(/[a-z]/i) && aadharLower.includes(village)) villageMatch = true;
  if (taluk.match(/[a-z]/i) && aadharLower.includes(taluk)) talukMatch = true;
  
  return villageMatch || talukMatch;
}



export async function POST(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    if (auth.role !== 'farmer') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const userId = auth.sub;
    const rtcFile = formData.get('rtc') as File | null;
    const aadharFile = formData.get('aadhar') as File | null;

    if (!rtcFile && !aadharFile) {
      return NextResponse.json({ message: 'No files uploaded' }, { status: 400 });
    }

    await connectDB();

    let extractedData: any = { farmer: {}, land: {} };
    let rtcText = '';
    let aadharText = '';

    // Process RTC file
    if (rtcFile) {
      const rtcBuffer = Buffer.from(await rtcFile.arrayBuffer());
      const rtcTmpPath = path.join(os.tmpdir(), `kyc_rtc_${uuidv4()}.pdf`);
      fs.writeFileSync(rtcTmpPath, rtcBuffer);
      
      // Upload to Cloudinary
      const uploadResult = await uploadFile(rtcBuffer, 'kyc/rtc');
      
      if (!uploadResult.success || !uploadResult.data) {
        console.error('Failed to upload RTC document to Cloudinary:', uploadResult.error);
        throw new Error('Failed to upload RTC document to Cloudinary');
      }

      // Create document record with Cloudinary URL
      const rtcDoc = await Document.create({
        owner: userId,
        type: 'rtc',
        originalName: rtcFile.name,
        mimeType: rtcFile.type,
        size: rtcFile.size,
        path: uploadResult.data.url,
        cloudinaryId: uploadResult.data.publicId,
      });

      // Process document using simple extraction
      const rtcResult = await processDocument(rtcDoc._id.toString(), userId, rtcTmpPath);
      rtcText = rtcResult.text || '';

      try { fs.unlinkSync(rtcTmpPath); } catch {}
      
      // Extract and map RTC data
      if (rtcResult.status === 'completed' && rtcResult.fields) {
        const rtcData = rtcResult.fields;
        console.log('RTC Data extracted:', JSON.stringify(rtcData, null, 2));
        
        extractedData.farmer.verifiedName = rtcData.ownership?.owners?.[0] || null;
        extractedData.farmer.kannadaName = rtcData.ownership?.owners?.[0] || null;
        extractedData.farmer.rtcAddress = rtcData.location ? 
          `${rtcData.location.village || ''}, ${rtcData.location.hobli || ''}, ${rtcData.location.taluk || ''}`.replace(/^, |, $/g, '') : 
          null;
        extractedData.land.location = rtcData.location || null;
        // Don't set homeAddress here - let Aadhaar address take priority
        
        extractedData.land.landParcelIdentity = rtcData.land_identification?.survey_number || null;
        extractedData.land.totalCultivableArea = rtcData.land_details?.total_extent || null;
        extractedData.land.mutationTraceability = rtcData.ownership?.mutation_no || rtcData.land_identification?.hissa_number || null;
        extractedData.land.soilProperties = rtcData.land_details?.soil_type || null;
        // Ownership verification will be set based on name matching
        extractedData.land.ownershipVerified = false; // Will be updated after name verification
        
        console.log('RTC Kannada Name extracted:', extractedData.farmer.kannadaName);
        console.log('RTC Address extracted:', extractedData.farmer.rtcAddress);
      }
    }

    // Process Aadhaar file
    if (aadharFile) {
      const aadharBuffer = Buffer.from(await aadharFile.arrayBuffer());
      const aadharTmpPath = path.join(os.tmpdir(), `kyc_aadhaar_${uuidv4()}.pdf`);
      fs.writeFileSync(aadharTmpPath, aadharBuffer);
      
      // Upload to Cloudinary
      const uploadResult = await uploadFile(aadharBuffer, 'kyc/aadhaar');
      
      if (!uploadResult.success || !uploadResult.data) {
        console.error('Failed to upload Aadhaar document to Cloudinary:', uploadResult.error);
        throw new Error('Failed to upload Aadhaar document to Cloudinary');
      }

      // Create document record with Cloudinary URL
      const aadharDoc = await Document.create({
        owner: userId,
        type: 'aadhaar',
        originalName: aadharFile.name,
        mimeType: aadharFile.type,
        size: aadharFile.size,
        path: uploadResult.data.url,
        cloudinaryId: uploadResult.data.publicId,
      });

      // Process document using simple extraction
      const aadharResult = await processDocument(aadharDoc._id.toString(), userId, aadharTmpPath);
      aadharText = aadharResult.text || '';

      try { fs.unlinkSync(aadharTmpPath); } catch {}
      
      // Map extracted data to farmer profile format
      if (aadharResult.status === 'completed' && aadharResult.fields) {
        const aadharData = aadharResult.fields;
        console.log('Aadhaar Data extracted:', JSON.stringify(aadharData, null, 2));
        
        extractedData.farmer.verifiedName = extractedData.farmer.verifiedName || aadharData.name_english || aadharData.name_kannada || null;
        extractedData.farmer.aadhaarKannadaName = aadharData.name_kannada || null;
        extractedData.farmer.idProof = aadharData.aadhaar_number ? `Aadhaar: ****${aadharData.aadhaar_number.slice(-4)}` : null;
        extractedData.farmer.gender = aadharData.gender || null;
        extractedData.farmer.homeAddress = aadharData.address || null; // Set to Aadhaar address (should be English)
        extractedData.farmer.mobile = aadharData.mobile || null;
        extractedData.farmer.dob = aadharData.dob || null;
        
        console.log('Aadhaar Kannada Name extracted:', extractedData.farmer.aadhaarKannadaName);
        console.log('Aadhaar Address extracted:', extractedData.farmer.homeAddress);
      }
    }

    // Name & Location verification logic - compare Kannada names and addresses from RTC and Aadhaar
    let nameVerificationStatus: 'verified' | 'not_verified' | 'pending' = 'pending';
    let shouldStoreRTCData = false;
    
    if (extractedData.farmer.kannadaName && extractedData.farmer.aadhaarKannadaName) {
      const rtcName = extractedData.farmer.kannadaName;
      const aadhaarName = extractedData.farmer.aadhaarKannadaName;
      
      console.log(`Name verification: RTC="${rtcName}" vs Aadhaar="${aadhaarName}"`);
      
      const nameMatches = matchKannadaNames(rtcName, aadhaarName);
      const locationMatches = matchLocation(extractedData.land.location, aadharText);
      
      // Calculate loose similarity
      const rtcClean = rtcName.replace(/[.,;:!?'"(){}[\]\\/\-_+*&%#@\s\u0000]/g, '');
      const aadhaarClean = aadhaarName.replace(/[.,;:!?'"(){}[\]\\/\-_+*&%#@\s\u0000]/g, '');
      const similarity = getSimilarity(rtcClean, aadhaarClean);
      
      const rtcCons = getKannadaConsonants(rtcName);
      const aadhaarCons = getKannadaConsonants(aadhaarName);
      
      const looseNameMatch = similarity >= 0.40 || 
                             (rtcCons && aadhaarCons && (rtcCons.includes(aadhaarCons) || aadhaarCons.includes(rtcCons)));
      
      console.log(`Matching details: nameMatches=${nameMatches}, locationMatches=${locationMatches}, similarity=${similarity}, looseNameMatch=${looseNameMatch}`);
      
      // Verify if names match exactly/robustly, OR if loose name matches and location matches!
      if (nameMatches || (looseNameMatch && locationMatches)) {
        nameVerificationStatus = 'verified';
        shouldStoreRTCData = true;
        extractedData.land.ownershipVerified = true;
        console.log('✅ Verification successful (Names matched or loose name match + location match) - storing RTC data');
      } else {
        nameVerificationStatus = 'not_verified';
        shouldStoreRTCData = false;
        extractedData.land.ownershipVerified = false;
        console.log('❌ Verification failed (Names do not match and location does not reinforce)');
      }
    } else if (!extractedData.farmer.kannadaName && !extractedData.farmer.aadhaarKannadaName) {
      nameVerificationStatus = 'pending';
      shouldStoreRTCData = false;
      console.log('⏳ Both names missing - pending status');
    } else {
      nameVerificationStatus = 'pending';
      shouldStoreRTCData = false;
      console.log('⏳ One name missing - pending status');
    }

    // Update or create farmer profile with extracted data
    const profile = await FarmerProfile.findOneAndUpdate(
      { userId, user: auth.sub }, // Add user field to avoid duplicate key error
      { 
        $set: {
          userId,
          user: auth.sub, // Ensure user field is set
          documents: {
            rtc: rtcFile ? { uploaded: true, extractedText: rtcText, uploadedAt: new Date() } : undefined,
            aadhaar: aadharFile ? { uploaded: true, extractedText: aadharText, uploadedAt: new Date() } : undefined,
          },
          // Farmer profile fields - always store Aadhaar data
          verifiedName: extractedData.farmer?.verifiedName || undefined,
          kannadaName: shouldStoreRTCData ? extractedData.farmer?.kannadaName : undefined,
          aadhaarKannadaName: extractedData.farmer?.aadhaarKannadaName || undefined,
          rtcAddress: shouldStoreRTCData ? extractedData.farmer?.rtcAddress : undefined,
          nameVerificationStatus,
          gender: extractedData.farmer?.gender || undefined,
          homeAddress: extractedData.farmer?.homeAddress || undefined, // This will be Aadhaar address (English)
          idProof: extractedData.farmer?.idProof || undefined,
          contactNumber: extractedData.farmer?.mobile || undefined,
          dob: extractedData.farmer?.dob || undefined,
          
          // Land profile fields - only store if names match
          landParcelIdentity: shouldStoreRTCData ? (extractedData.land?.landParcelIdentity || undefined) : undefined,
          ownershipVerified: extractedData.land?.ownershipVerified || false, // Based on name matching
          soilProperties: shouldStoreRTCData ? (extractedData.land?.soilProperties || undefined) : undefined,
          totalCultivableArea: shouldStoreRTCData ? (extractedData.land?.totalCultivableArea || undefined) : undefined,
          mutationTraceability: shouldStoreRTCData ? (extractedData.land?.mutationTraceability || undefined) : undefined,
          
          // Legacy fields for backward compatibility
          rtcOcrText: shouldStoreRTCData ? (rtcText || undefined) : undefined,
          aadharOcrText: aadharText || undefined,
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: shouldStoreRTCData 
        ? 'Documents processed successfully - Names matched, all data stored'
        : 'Documents processed - Names did not match, only Aadhaar data stored',
      extractedData,
      profile,
      nameVerificationStatus,
      shouldStoreRTCData,
      storedData: {
        aadhaarData: true,
        rtcData: shouldStoreRTCData
      }
    });
  } catch (error: any) {
    console.error('farmer/kyc POST error', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Processing failed' 
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    if (auth.role !== 'farmer') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const profile = await FarmerProfile.findOne({ userId: auth.sub });

    if (!profile) {
      return NextResponse.json({ 
        message: 'No profile found. Please upload documents first.',
        profile: null 
      }, { status: 200 });
    }

    return NextResponse.json({ 
      message: 'Profile found',
      profile 
    });
  } catch (error) {
    console.error('farmer/kyc GET error', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
