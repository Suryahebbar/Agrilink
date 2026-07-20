import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmerOrder, IFarmerOrder } from '@/lib/models/FarmerOrder';
import { Seller, ISeller } from '@/lib/models/supplier';

export async function GET() {
  try {
    await connectDB();
    
    // Get all farmer orders with full details
    const allFarmerOrders = await FarmerOrder.find({}).sort({ createdAt: -1 }).limit(5);
    
    // Get all suppliers
    const suppliers = await Seller.find({}).select('_id companyName').limit(3);
    
    // Prepare detailed response
    const orderDetails = allFarmerOrders.map((order: IFarmerOrder) => ({
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      itemCount: order.items.length,
      items: order.items.map(item => ({
        name: item.name,
        sellerId: item.sellerId,
        seller: (item as any).seller,
        price: item.price,
        quantity: item.quantity
      }))
    }));
    
    const supplierDetails = suppliers.map((supplier: ISeller) => ({
      id: supplier._id.toString(),
      companyName: supplier.companyName
    }));
    
    // Test query for each supplier
    const supplierTests = await Promise.all(
      supplierDetails.map(async (supplier: { id: string; companyName: string }) => {
        const sellerOrders = await FarmerOrder.find({
          'items.sellerId': { $in: [supplier.id, supplier.id] }
        });
        
        return {
          supplierId: supplier.id,
          companyName: supplier.companyName,
          ordersFound: sellerOrders.length,
          orderDetails: sellerOrders.map((order: IFarmerOrder) => ({
            orderNumber: order.orderNumber,
            matchingItems: order.items.filter((item: any) => 
              item.sellerId?.toString() === supplier.id
            ).length,
            allSellerIds: order.items.map((item: any) => item.sellerId)
          }))
        };
      })
    );
    
    return NextResponse.json({
      message: 'Debug completed',
      data: {
        farmerOrders: orderDetails,
        suppliers: supplierDetails,
        supplierTests: supplierTests
      }
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
