import fs from 'fs';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { extractRTCData, extractAadhaarData } from './pdf-extract.service';
import Document from '../models/Document';
import OcrResult from '../models/OcrResult';

export async function processDocument(documentId: string, userId: string, sourcePath?: string) {
  const doc = await Document.findById(documentId);
  if (!doc) throw new Error('document_not_found');
  if (doc.owner.toString() !== userId.toString()) throw new Error('forbidden');

  const effectivePath = sourcePath || doc.path;

  let result = await OcrResult.findOne({ document: doc._id });
  if (!result) {
    result = await OcrResult.create({ document: doc._id, owner: userId, status: 'pending' });
  } else {
    result.status = 'pending';
    result.error = undefined;
    await result.save();
  }

  try {
    let extractedData: any = {};
    let rawText = '';

    // Normalize document type for comparison
    const docType = doc.type.toLowerCase().replace(/-/g, '');
    
    // Extract data based on document type
    if (docType === 'rtc') {
      extractedData = await extractRTCData(effectivePath);
      rawText = JSON.stringify(extractedData, null, 2);
    } else if (docType === 'aadhaar' || docType === 'aadhar') {
      extractedData = await extractAadhaarData(effectivePath);
      rawText = JSON.stringify(extractedData, null, 2);
    } else {
      // Generic text extraction
      const { execSync } = require('child_process');
      const TMP = `/tmp/generic_${uuidv4()}.txt`;
      try {
        execSync(`pdftotext -layout -nopgbrk "${effectivePath}" "${TMP}"`);
        rawText = fs.readFileSync(TMP, "utf8");
        try { fs.unlinkSync(TMP); } catch {}
      } catch (e) {
        rawText = '';
      }
      extractedData = { rawText };
    }

    // Update result
    result.status = 'completed';
    result.text = rawText.slice(0, 50000);
    result.fields = extractedData;
    result.confidence = 95; // High confidence for positional extraction
    await result.save();

    console.log(`Document processed successfully: ${documentId}`);
    return result;
  } catch (err: any) {
    console.error('Document processing error:', err);
    result.status = 'error';
    result.error = err.message;
    await result.save();
    throw err;
  }
}

export async function getDocumentResult(documentId: string, userId: string) {
  const doc = await Document.findById(documentId);
  if (!doc) throw new Error('document_not_found');
  if (doc.owner.toString() !== userId.toString()) throw new Error('forbidden');

  return await OcrResult.findOne({ document: doc._id, owner: userId });
}