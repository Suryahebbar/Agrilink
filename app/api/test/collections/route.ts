import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Get collection names and counts
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check each collection
    const farmerProfileCount = await db.collection('farmerprofiles').countDocuments();
    const landDetailsCount = await db.collection('landdetails').countDocuments();
    const landIntegrationCount = await db.collection('landintegrations').countDocuments();
    
    // Get sample data
    const farmerProfileSample = await db.collection('farmerprofiles').findOne({});
    const landDetailsSample = await db.collection('landdetails').findOne({});
    const landIntegrationSample = await db.collection('landintegrations').findOne({});
    
    return NextResponse.json({
      collections: collections.map(c => c.name),
      counts: {
        farmerprofiles: farmerProfileCount,
        landdetails: landDetailsCount,
        landintegrations: landIntegrationCount
      },
      samples: {
        farmerProfile: farmerProfileSample,
        landDetails: landDetailsSample,
        landIntegration: landIntegrationSample
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
