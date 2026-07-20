import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { Order } from '@/lib/models/supplier';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { adminAuthMiddleware } from '@/lib/admin-auth-middleware';

export async function POST(request: NextRequest) {
  return adminAuthMiddleware(async (req: NextRequest) => {
    try {
      await connectDB();
      
      const admin = (req as any).admin;
      const body = await req.json();
      const { action, resourceType, resourceIds, data } = body;
      
      if (!action || !resourceType || !resourceIds || !Array.isArray(resourceIds)) {
        return NextResponse.json(
          { error: 'Missing required fields: action, resourceType, resourceIds' },
          { status: 400 }
        );
      }
      
      const results = [];
      const errors = [];
      
      for (const resourceId of resourceIds) {
        try {
          let result;
          
          switch (resourceType) {
            case 'users':
              if (action === 'updateStatus') {
                const status = data.status;
                
                // Try supplier first
                let user = await Seller.findById(resourceId);
                if (user) {
                  (user as any).status = status;
                  await user.save();
                  result = { id: resourceId, type: 'supplier', status: 'updated' };
                } else {
                  // Try farmer
                  user = await FarmerProfile.findById(resourceId);
                  if (user) {
                    (user as any).status = status;
                    await user.save();
                    result = { id: resourceId, type: 'farmer', status: 'updated' };
                  } else {
                    throw new Error('User not found');
                  }
                }
              } else if (action === 'delete') {
                const supplierResult = await Seller.findByIdAndDelete(resourceId);
                if (supplierResult) {
                  result = { id: resourceId, type: 'supplier', status: 'deleted' };
                } else {
                  const farmerResult = await FarmerProfile.findByIdAndDelete(resourceId);
                  if (farmerResult) {
                    result = { id: resourceId, type: 'farmer', status: 'deleted' };
                  } else {
                    throw new Error('User not found');
                  }
                }
              } else {
                throw new Error('Invalid action for users');
              }
              break;
              
            case 'orders':
              if (action === 'updateStatus') {
                const status = data.status;
                
                // Try supplier order first
                let order = await Order.findById(resourceId);
                if (order) {
                  (order as any).status = status;
                  await order.save();
                  result = { id: resourceId, type: 'supplier_order', status: 'updated' };
                } else {
                  // Try farmer order
                  order = await FarmerOrder.findById(resourceId);
                  if (order) {
                    (order as any).status = status;
                    await order.save();
                    result = { id: resourceId, type: 'farmer_order', status: 'updated' };
                  } else {
                    throw new Error('Order not found');
                  }
                }
              } else if (action === 'delete') {
                const orderResult = await Order.findByIdAndDelete(resourceId);
                if (orderResult) {
                  result = { id: resourceId, type: 'supplier_order', status: 'deleted' };
                } else {
                  const farmerOrderResult = await FarmerOrder.findByIdAndDelete(resourceId);
                  if (farmerOrderResult) {
                    result = { id: resourceId, type: 'farmer_order', status: 'deleted' };
                  } else {
                    throw new Error('Order not found');
                  }
                }
              } else {
                throw new Error('Invalid action for orders');
              }
              break;
              
            case 'suppliers':
              if (action === 'updateStatus') {
                const supplier = await Seller.findById(resourceId);
                if (!supplier) {
                  throw new Error('Supplier not found');
                }
                (supplier as any).status = data.status;
                await supplier.save();
                result = { id: resourceId, type: 'supplier', status: 'updated' };
              } else if (action === 'delete') {
                const supplier = await Seller.findByIdAndDelete(resourceId);
                if (!supplier) {
                  throw new Error('Supplier not found');
                }
                result = { id: resourceId, type: 'supplier', status: 'deleted' };
              } else {
                throw new Error('Invalid action for suppliers');
              }
              break;
              
            case 'farmers':
              if (action === 'updateStatus') {
                const farmer = await FarmerProfile.findById(resourceId);
                if (!farmer) {
                  throw new Error('Farmer not found');
                }
                (farmer as any).status = data.status;
                await farmer.save();
                result = { id: resourceId, type: 'farmer', status: 'updated' };
              } else if (action === 'delete') {
                const farmer = await FarmerProfile.findByIdAndDelete(resourceId);
                if (!farmer) {
                  throw new Error('Farmer not found');
                }
                result = { id: resourceId, type: 'farmer', status: 'deleted' };
              } else {
                throw new Error('Invalid action for farmers');
              }
              break;
              
            default:
              throw new Error('Invalid resource type');
          }
          
          results.push(result);
          
        } catch (error) {
          errors.push({
            id: resourceId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      return NextResponse.json({
        message: `Bulk ${action} completed`,
        results,
        errors,
        summary: {
          total: resourceIds.length,
          successful: results.length,
          failed: errors.length
        }
      });
      
    } catch (error) {
      console.error('Bulk operation error:', error);
      return NextResponse.json(
        { error: 'Failed to perform bulk operation' },
        { status: 500 }
      );
    }
  })(request);
}
