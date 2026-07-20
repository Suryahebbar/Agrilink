import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { LandDetails } from '@/lib/models/LandDetails';
import { ObjectId } from 'mongodb';
import { uploadFile } from '@/lib/cloudinary';
import Document from '@/lib/models/Document';

// GET - Fetch all land details for a user
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const landDetails = await LandDetails.find({ userId }).sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      success: true, 
      data: landDetails,
      count: landDetails.length 
    });
  } catch (error) {
    console.error('Error fetching land details:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch land details' 
    }, { status: 500 });
  }
}

// POST - Create or update land details (upsert)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const formData = await request.formData();
    
    const userId = formData.get('userId') as string;
    const centroidLatitude = parseFloat(formData.get('centroidLatitude') as string);
    const centroidLongitude = parseFloat(formData.get('centroidLongitude') as string);
    const sideLengths = JSON.parse(formData.get('sideLengths') as string);
    const vertices = JSON.parse(formData.get('vertices') as string);
    const geojson = formData.get('geojson') as string;
    
    // RTC details are now optional - only get them if provided
    const surveyNumber = formData.get('surveyNumber') as string || '';
    const extent = formData.get('extent') as string || '';
    const location = formData.get('location') as string || '';
    const taluk = formData.get('taluk') as string || '';
    const hobli = formData.get('hobli') as string || '';
    const village = formData.get('village') as string || '';
    const soilType = formData.get('soilType') as string || '';
    const cropType = formData.get('cropType') as string || '';
    
    const sketchImage = formData.get('sketchImage') as File;
    
    console.log('Received land details data:', {
      userId,
      centroidLatitude,
      centroidLongitude,
      extent,
      surveyNumber,
      sideLengthsCount: sideLengths?.length,
      verticesCount: vertices?.length,
      hasImage: !!sketchImage
    });

    console.log('DEBUG: Backend received coordinates - centroidLatitude:', centroidLatitude, 'centroidLongitude:', centroidLongitude);
    console.log('DEBUG: Coordinate types - centroidLatitude:', typeof centroidLatitude, 'centroidLongitude:', typeof centroidLongitude);
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Convert userId string to ObjectId
    let userObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
    }

    // Handle image upload to Cloudinary
    let imageData = null;
    if (sketchImage && sketchImage.size > 0) {
      const buffer = Buffer.from(await sketchImage.arrayBuffer());
      
      // Upload to Cloudinary
      const uploadResult = await uploadFile(buffer, 'land-sketches');
      
      if (!uploadResult.success || !uploadResult.data) {
        console.error('Failed to upload land sketch to Cloudinary:', uploadResult.error);
        return NextResponse.json(
          { 
            success: false,
            error: uploadResult.error || 'Failed to upload land sketch to Cloudinary'
          }, 
          { status: 500 }
        );
      }

      // Create document record
      const doc = new Document({
        owner: userObjectId,
        type: 'land-sketch',
        originalName: sketchImage.name,
        mimeType: sketchImage.type,
        size: sketchImage.size,
        path: uploadResult.data.url,
        cloudinaryId: uploadResult.data.publicId,
        isPublic: true,
        tags: ['land-sketch', `user-${userId}`]
      });
      
      await doc.save();

      imageData = {
        filename: sketchImage.name,
        originalName: sketchImage.name,
        path: uploadResult.data.url,
        size: sketchImage.size,
        mimeType: sketchImage.type,
        cloudinaryId: uploadResult.data.publicId,
        documentId: doc._id,
        uploadedAt: new Date()
      };
    }

    // Calculate land size from RTC extent if available
    let landSizeInAcres = 0;
    if (extent) {
      const match = extent.match(/(\d+\.?\d*)\s*(acres?|hectares?|ha|ac)/i);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        
        if (unit.startsWith('hectare') || unit === 'ha') {
          // Convert hectares to acres (1 hectare = 2.47105 acres)
          landSizeInAcres = value * 2.47105;
        } else {
          // Already in acres
          landSizeInAcres = value;
        }
      }
    }

    // Create or update land details
    const landDetails = await LandDetails.findOneAndUpdate(
      { userId: userId }, // Using string userId for query
      {
        userId: userObjectId,
        sketchImage: imageData,
        landData: {
          centroidLatitude,
          centroidLongitude,
          sideLengths,
          vertices,
          landSizeInAcres,
          geojson
        },
        rtcDetails: {
          surveyNumber,
          extent,
          location,
          taluk,
          hobli,
          village,
          soilType,
          cropType
        },
        processingStatus: 'completed',
        processedAt: new Date()
      },
      { 
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    return NextResponse.json({ 
      success: true, 
      data: landDetails,
      message: landDetails.isNew ? 'Land details created successfully' : 'Land details updated successfully'
    });
  } catch (error: any) {
    console.error('Error saving land details:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to save land details',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// PUT - Update existing land details
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { id, userId, ...updateData } = body;
    
    if (!id || !userId) {
      return NextResponse.json({ error: 'Land details ID and User ID are required' }, { status: 400 });
    }

    const landDetails = await LandDetails.findOneAndUpdate(
      { _id: id, userId },
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!landDetails) {
      return NextResponse.json({ error: 'Land details not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: landDetails,
      message: 'Land details updated successfully' 
    });
  } catch (error) {
    console.error('Error updating land details:', error);
    return NextResponse.json({ 
      error: 'Failed to update land details' 
    }, { status: 500 });
  }
}

// DELETE - Delete land details
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    
    if (!id || !userId) {
      return NextResponse.json({ error: 'Land details ID and User ID are required' }, { status: 400 });
    }

    const landDetails = await LandDetails.findOneAndDelete({ _id: id, userId });

    if (!landDetails) {
      return NextResponse.json({ error: 'Land details not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Land details deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting land details:', error);
    return NextResponse.json({ 
      error: 'Failed to delete land details' 
    }, { status: 500 });
  }
}
