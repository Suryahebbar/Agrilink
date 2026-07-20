export interface Image {
  url: string;
  alt?: string;
}

export interface Seller {
  _id: string;
  companyName: string;
  verificationStatus?: 'verified' | 'pending' | 'unverified';
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: Image[];
  seller: Seller;
  category: string;
  stock: number;
  rating: number;
  reviewCount: number;
  tags?: string[];
  specifications?: Record<string, any>;
  featured?: boolean;
  bestseller?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: string;
}
