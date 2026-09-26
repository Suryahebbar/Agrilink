import mongoose from 'mongoose';

// Import models to register them with Mongoose
import { Seller } from './seller';
import { Product } from './supplier';
import { Cart } from './Cart';
import { FarmerOrder } from './FarmerOrder';
import { DigitizedPlot } from './DigitizedPlot';
import { FarmPool } from './FarmPool';
import { ConflictTicket } from './ConflictTicket';
import Scheme from './Scheme';
import SchemeRecommendation from './SchemeRecommendation';
import { SponsoredAd } from './SponsoredAd';
import { PoolPurchaseProposal } from './PoolPurchaseProposal';
import { PoolContributionLog } from './PoolContributionLog';
import { PoolSettlement } from './PoolSettlement';
import { FarmLifecyclePlan } from './FarmLifecyclePlan';
import { CropSale } from './CropSale';
import { PoolInvestment } from './PoolInvestment';

// Export models
export { 
  Seller, 
  Product, 
  Cart, 
  FarmerOrder, 
  DigitizedPlot, 
  FarmPool, 
  ConflictTicket, 
  Scheme, 
  SchemeRecommendation, 
  SponsoredAd, 
  PoolPurchaseProposal,
  PoolContributionLog,
  PoolSettlement,
  FarmLifecyclePlan,
  CropSale,
  PoolInvestment
};

// Export mongoose instance
export default mongoose;
