import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceOrder } from '@/lib/models/marketplace-order';
import { Product } from '@/lib/models/supplier';
import { connectDB } from '@/lib/db';

interface PaymentRequest {
  orderId: string;
  paymentMethod: 'card' | 'upi' | 'netbanking' | 'wallet';
  paymentDetails: {
    cardNumber?: string;
    cardExpiry?: string;
    cardCvv?: string;
    cardName?: string;
    upiId?: string;
    bankCode?: string;
    walletType?: string;
  };
  billingAddress?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

export async function POST(request: Request) {
  try {
    const paymentData: PaymentRequest = await request.json();
    const { orderId, paymentMethod, paymentDetails, billingAddress } = paymentData;

    await connectDB();

    // Find order
    const order = await MarketplaceOrder.findById(orderId);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check order status
    if (order.paymentStatus === 'completed') {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 400 });
    }

    // Simulate payment processing (in production, integrate with actual payment gateway)
    const paymentResult = await processPayment({
      amount: order.total,
      method: paymentMethod,
      details: paymentDetails,
      orderId: order.orderId
    });

    if (!paymentResult.success) {
      return NextResponse.json({ 
        error: paymentResult.message || 'Payment failed',
        code: paymentResult.code 
      }, { status: 400 });
    }

    // Update order with payment information
    order.paymentStatus = 'completed';
    order.paymentMethod = paymentMethod;
    order.paymentDetails = {
      method: paymentMethod,
      transactionId: paymentResult.transactionId,
      gateway: 'demo-gateway',
      processedAt: new Date(),
      amount: order.total
    };
    
    // Update order status to confirmed
    order.status = 'confirmed';
    order.confirmedAt = new Date();
    
    await order.save();

    // Decrease product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: -item.quantity }
      });
    }

    return NextResponse.json({
      message: 'Payment processed successfully',
      orderId: order._id,
      transactionId: paymentResult.transactionId,
      orderStatus: order.status,
      estimatedDelivery: order.estimatedDelivery
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
  }
}

// Simulate payment gateway integration
async function processPayment(paymentData: {
  amount: number;
  method: string;
  details: any;
  orderId: string;
}): Promise<{ success: boolean; transactionId?: string; message?: string; code?: string }> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // In production, this would integrate with actual payment gateways like:
  // - Razorpay (for Indian market)
  // - Stripe
  // - PayPal
  // - PhonePe/Google Pay (UPI)

  // Demo validation
  if (paymentData.method === 'card') {
    const { cardNumber, cardExpiry, cardCvv } = paymentData.details;
    
    // Basic validation (in production, use proper validation)
    if (!cardNumber || !cardExpiry || !cardCvv) {
      return { success: false, message: 'Invalid card details', code: 'INVALID_CARD' };
    }
    
    // Demo: reject certain test cards
    if (cardNumber.includes('4000')) {
      return { success: false, message: 'Card declined', code: 'CARD_DECLINED' };
    }
  }

  if (paymentData.method === 'upi') {
    const { upiId } = paymentData.details;
    
    if (!upiId || !upiId.includes('@')) {
      return { success: false, message: 'Invalid UPI ID', code: 'INVALID_UPI' };
    }
  }

  // Simulate success
  return {
    success: true,
    transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`
  };
}

// Webhook endpoint for payment gateway notifications
export async function POST_WEBHOOK(request: Request) {
  try {
    const webhookData = await request.json();
    
    // Verify webhook signature (in production)
    // const signature = request.headers.get('x-signature');
    // const isValid = verifyWebhookSignature(webhookData, signature);
    
    await connectDB();

    const { orderId, status, transactionId, amount } = webhookData;

    // Find and update order
    const order = await MarketplaceOrder.findOne({ orderId });
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order based on payment status
    if (status === 'success') {
      order.paymentStatus = 'completed';
      order.status = 'confirmed';
      order.paymentDetails = {
        transactionId,
        gateway: 'payment-gateway',
        processedAt: new Date(),
        amount
      };
      
      // Decrease stock only on successful payment
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stockQuantity: -item.quantity }
        });
      }
    } else if (status === 'failed') {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      order.notes = `Payment failed: ${webhookData.reason || 'Unknown error'}`;
    }

    await order.save();

    return NextResponse.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
