import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const sellerId = request.headers.get('x-seller-id');
    
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 401 });
    }

    if (sellerId === 'temp-seller-id') {
      return NextResponse.json(
        { error: 'Cannot create products with temporary seller ID' },
        { status: 400 }
      );
    }

    // Simple test without database
    return NextResponse.json({
      message: 'Test successful - Seller ID is valid',
      sellerId,
      status: 'success'
    });

  } catch (error) {
    console.error('❌ Error in test:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
