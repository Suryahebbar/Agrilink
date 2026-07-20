import nodemailer from 'nodemailer';
import { Seller } from '@/lib/models/seller';

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || 'AgriLink <noreply@agrilink.app>';

if (!host || !user || !pass) {
  console.warn('SMTP environment variables are not fully set. Seller notifications may not send.');
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: false,
  auth: user && pass ? { user, pass } : undefined,
});

interface SellerOrderItemSummary {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export async function sendSellerNewOrderEmail(
  sellerId: string,
  orderId: string,
  customerName: string,
  items: SellerOrderItemSummary[],
  totalAmount: number
) {
  try {
    if (!host || !user || !pass) {
      console.warn('Skipping seller notification email because SMTP env vars are missing');
      return;
    }

    const seller = await Seller.findById(sellerId).select('email companyName settings');
    if (!seller) {
      console.warn('Cannot send seller order email, seller not found:', sellerId);
      return;
    }

    const settings = (seller as any).settings || {};

    // Respect notification toggles
    if (!settings.orderNotifications || !settings.emailNotifications) {
      console.log('Skipping seller order email due to notification settings:', {
        sellerId,
        orderNotifications: settings.orderNotifications,
        emailNotifications: settings.emailNotifications,
      });
      return;
    }

    const subject = `New order ${orderId} from ${customerName}`;
    const lines = items.map(
      (it) => `- ${it.name} x ${it.quantity} @ ₹${it.price} = ₹${it.subtotal}`
    );

    const text = [
      `Hello ${seller.companyName || 'Seller'},`,
      '',
      `You have received a new order ${orderId} from ${customerName}.`,
      '',
      'Items:',
      ...lines,
      '',
      `Total: ₹${totalAmount}`,
      '',
      'Please log in to your supplier dashboard to view and process this order.',
      '',
      '— AgriLink',
    ].join('\n');

    await transporter.sendMail({
      from,
      to: seller.email,
      subject,
      text,
    });

    console.log('Seller new-order email sent to', seller.email, 'for order', orderId);
  } catch (err) {
    console.error('Failed to send seller new-order email', err);
  }
}
