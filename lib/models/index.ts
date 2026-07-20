import mongoose from 'mongoose';

// Import models to register them with Mongoose
import { Seller } from './seller';
import { Product } from './supplier';
import { Cart } from './Cart';
import { FarmerOrder } from './FarmerOrder';

// Export models
export { Seller, Product, Cart, FarmerOrder };

// Export mongoose instance
export default mongoose;
