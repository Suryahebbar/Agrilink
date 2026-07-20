import mongoose, { Document, Schema } from 'mongoose';

// Inventory Log Interface
interface IInventoryLog {
  type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'damage' | 'expired';
  quantity: number;
  reason?: string;
  referenceId?: mongoose.Types.ObjectId;
  referenceType?: 'order' | 'purchase' | 'adjustment';
  previousStock: number;
  newStock: number;
  costPerUnit?: number;
  totalCost?: number;
  createdAt: Date;
  createdBy?: mongoose.Types.ObjectId;
}

const InventoryLogSchema = new Schema<IInventoryLog>({
  type: {
    type: String,
    enum: ['purchase', 'sale', 'adjustment', 'return', 'damage', 'expired'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  referenceId: {
    type: Schema.Types.ObjectId
  },
  referenceType: {
    type: String,
    enum: ['order', 'purchase', 'adjustment']
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  costPerUnit: {
    type: Number,
    min: 0,
    get: (value: number) => parseFloat(value.toFixed(2))
  },
  totalCost: {
    type: Number,
    min: 0,
    get: (value: number) => parseFloat(value.toFixed(2))
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Seller'
  }
});

// Inventory Interface
export interface IInventory extends Document {
  productId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderThreshold: number;
  reorderLevel: number;
  maxStock: number;
  minStock: number;
  averageCost: number;
  totalValue: number;
  lastUpdated: Date;
  logs: IInventoryLog[];
  alerts: {
    lowStock: boolean;
    outOfStock: boolean;
    overstock: boolean;
    reorderNeeded: boolean;
  };
  location?: string;
  batchNumber?: string;
  expiryDate?: Date;
  manufacturingDate?: Date;
  supplierInfo?: {
    name: string;
    contact: string;
    gstNumber?: string;
  };
  qualityStatus: 'good' | 'damaged' | 'expired' | 'quarantine';
  createdAt: Date;
  updatedAt: Date;
}

// Inventory Schema
const InventorySchema = new Schema<IInventory>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true,
    index: true
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
    index: true
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reservedStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  availableStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reorderThreshold: {
    type: Number,
    required: true,
    min: 0,
    default: 5
  },
  reorderLevel: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
  maxStock: {
    type: Number,
    required: true,
    min: 0,
    default: 1000
  },
  minStock: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  averageCost: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
    get: (value: number) => parseFloat(value.toFixed(2))
  },
  totalValue: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
    get: (value: number) => parseFloat(value.toFixed(2))
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  logs: [InventoryLogSchema],
  alerts: {
    lowStock: { type: Boolean, default: false },
    outOfStock: { type: Boolean, default: false },
    overstock: { type: Boolean, default: false },
    reorderNeeded: { type: Boolean, default: false }
  },
  location: {
    type: String,
    trim: true
  },
  batchNumber: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date,
    index: true
  },
  manufacturingDate: {
    type: Date
  },
  supplierInfo: {
    name: { type: String, trim: true },
    contact: { type: String, trim: true },
    gstNumber: { type: String, trim: true }
  },
  qualityStatus: {
    type: String,
    enum: ['good', 'damaged', 'expired', 'quarantine'],
    default: 'good',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes
InventorySchema.index({ sellerId: 1, currentStock: 1 });
InventorySchema.index({ sellerId: 1, 'alerts.lowStock': 1 });
InventorySchema.index({ sellerId: 1, 'alerts.outOfStock': 1 });
InventorySchema.index({ sellerId: 1, qualityStatus: 1 });
InventorySchema.index({ expiryDate: 1 });

// Pre-save middleware
InventorySchema.pre('save', function(next: any) {
  this.updatedAt = new Date();
  
  // Calculate available stock
  this.availableStock = Math.max(0, this.currentStock - this.reservedStock);
  
  // Calculate total value
  this.totalValue = this.currentStock * this.averageCost;
  
  // Update alerts
  this.alerts.lowStock = this.currentStock <= this.reorderThreshold;
  this.alerts.outOfStock = this.currentStock === 0;
  this.alerts.overstock = this.currentStock >= this.maxStock;
  this.alerts.reorderNeeded = this.currentStock <= this.reorderLevel;
  
  next();
});

// Virtual methods
InventorySchema.methods.addStock = function(quantity: number, type: string, reason?: string, costPerUnit?: number, createdBy?: mongoose.Types.ObjectId) {
  const previousStock = this.currentStock;
  this.currentStock += quantity;
  const newStock = this.currentStock;
  
  // Update average cost
  if (costPerUnit && type === 'purchase') {
    const totalCost = previousStock * this.averageCost + quantity * costPerUnit;
    this.averageCost = totalCost / newStock;
  }
  
  // Add log
  this.logs.push({
    type,
    quantity,
    reason,
    previousStock,
    newStock,
    costPerUnit,
    totalCost: costPerUnit ? quantity * costPerUnit : undefined,
    createdBy
  });
  
  this.lastUpdated = new Date();
  return this.save();
};

InventorySchema.methods.removeStock = function(quantity: number, type: string, reason?: string, referenceId?: mongoose.Types.ObjectId, referenceType?: string, createdBy?: mongoose.Types.ObjectId) {
  const previousStock = this.currentStock;
  this.currentStock = Math.max(0, this.currentStock - quantity);
  const newStock = this.currentStock;
  
  // Add log
  this.logs.push({
    type,
    quantity: -quantity,
    reason,
    referenceId,
    referenceType,
    previousStock,
    newStock,
    createdBy
  });
  
  this.lastUpdated = new Date();
  return this.save();
};

InventorySchema.methods.reserveStock = function(quantity: number) {
  if (this.availableStock >= quantity) {
    this.reservedStock += quantity;
    return this.save();
  }
  throw new Error('Insufficient stock available');
};

InventorySchema.methods.releaseStock = function(quantity: number) {
  this.reservedStock = Math.max(0, this.reservedStock - quantity);
  return this.save();
};

// Static methods
InventorySchema.statics.getLowStockItems = function(sellerId: mongoose.Types.ObjectId) {
  return this.find({
    sellerId,
    'alerts.lowStock': true,
    'alerts.outOfStock': false
  }).populate('productId');
};

InventorySchema.statics.getOutOfStockItems = function(sellerId: mongoose.Types.ObjectId) {
  return this.find({
    sellerId,
    'alerts.outOfStock': true
  }).populate('productId');
};

InventorySchema.statics.getExpiringItems = function(sellerId: mongoose.Types.ObjectId, days: number = 30) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  return this.find({
    sellerId,
    expiryDate: { $lte: expiryDate },
    qualityStatus: { $ne: 'expired' }
  }).populate('productId');
};

export const Inventory = mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);
