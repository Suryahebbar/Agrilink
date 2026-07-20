import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Seller } from '@/lib/models/supplier';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { Order } from '@/lib/models/supplier';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { adminAuthMiddleware } from '@/lib/admin-auth-middleware';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  return adminAuthMiddleware(async (req: NextRequest) => {
    try {
      await connectDB();
      
      const resolvedParams = await context.params;
      const exportType = resolvedParams.type;
      const { searchParams } = new URL(req.url);
      const format = searchParams.get('format') || 'csv';
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      
      let data: any[] = [];
      let filename = '';
      
      // Build date filter
      let dateFilter: any = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }
      
      switch (exportType) {
        case 'users':
          const [suppliers, farmers] = await Promise.all([
            Seller.find(dateFilter).lean(),
            FarmerProfile.find(dateFilter).lean()
          ]);
          
          data = [
            ...suppliers.map((s: any) => ({
              ID: s._id,
              Name: s.name,
              Email: s.email,
              Phone: s.phone,
              Role: 'Supplier',
              Company: s.companyName,
              Status: s.status || 'pending',
              'Created At': s.createdAt
            })),
            ...farmers.map((f: any) => ({
              ID: f._id,
              Name: f.name,
              Email: f.email,
              Phone: f.phone,
              Role: 'Farmer',
              Farm: f.farmName,
              Status: f.status || 'pending',
              'Created At': f.createdAt
            }))
          ];
          filename = 'users';
          break;
          
        case 'orders':
          const [supplierOrders, farmerOrders] = await Promise.all([
            Order.find(dateFilter).populate('sellerId', 'name companyName').lean(),
            FarmerOrder.find(dateFilter).lean()
          ]);
          
          data = [
            ...supplierOrders.map((order: any) => ({
              'Order ID': order._id,
              'Order Number': order.orderNumber || `ORD-${order._id.toString().slice(-6)}`,
              Type: 'Supplier',
              Customer: (order as any).customer?.name || 'Guest',
              Email: (order as any).customer?.email || 'N/A',
              Amount: order.totalAmount || 0,
              Status: (order as any).status || 'pending',
              Seller: (order as any).sellerId?.name || 'N/A',
              'Created At': order.createdAt
            })),
            ...farmerOrders.map((order: any) => ({
              'Order ID': order._id,
              'Order Number': order.orderNumber || `FRM-${order._id.toString().slice(-6)}`,
              Type: 'Farmer',
              Customer: (order as any).customer?.name || 'Guest',
              Email: (order as any).customer?.email || 'N/A',
              Amount: order.items?.reduce((sum: number, item: any) => 
                sum + (item.price * item.quantity), 0) || 0,
              Status: (order as any).status || 'pending',
              Seller: 'Multiple',
              'Created At': order.createdAt
            }))
          ];
          filename = 'orders';
          break;
          
        case 'suppliers':
          const suppliersData = await Seller.find(dateFilter).lean();
          data = suppliersData.map((s: any) => ({
            ID: s._id,
            Name: s.name,
            Email: s.email,
            Phone: s.phone,
            Company: s.companyName,
            Address: s.address,
            Status: s.status || 'pending',
            'Products Count': s.products?.length || 0,
            'Created At': s.createdAt
          }));
          filename = 'suppliers';
          break;
          
        case 'farmers':
          const farmersData = await FarmerProfile.find(dateFilter).lean();
          data = farmersData.map((f: any) => ({
            ID: f._id,
            Name: f.name,
            Email: f.email,
            Phone: f.phone,
            Farm: f.farmName,
            Address: f.address,
            Status: f.status || 'pending',
            'Created At': f.createdAt
          }));
          filename = 'farmers';
          break;
          
        default:
          return NextResponse.json(
            { error: 'Invalid export type' },
            { status: 400 }
          );
      }
      
      if (format === 'csv') {
        const csv = convertToCSV(data);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`
          }
        });
      } else if (format === 'json') {
        return new NextResponse(JSON.stringify(data, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.json"`
          }
        });
      } else {
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        );
      }
      
    } catch (error) {
      console.error('Export error:', error);
      return NextResponse.json(
        { error: 'Failed to export data' },
        { status: 500 }
      );
    }
  })(request);
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Handle commas and quotes in values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}
