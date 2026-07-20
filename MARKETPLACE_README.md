# 🌾 AgriLink Marketplace

A comprehensive Amazon-style e-commerce platform for agricultural products, connecting farmers with trusted suppliers across India.

## 🚀 Features

### 🛒 Core E-Commerce Features
- **Product Catalog**: Browse and search agricultural products with advanced filtering
- **Shopping Cart**: Persistent cart with quantity management and real-time updates
- **Multi-Step Checkout**: Secure checkout with multiple payment methods (COD, UPI, Card)
- **Order Management**: Complete order lifecycle from placement to delivery tracking
- **Seller Profiles**: Verified seller information with ratings and reviews
- **Customer Reviews**: Product and seller rating system

### 🎨 User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, intuitive interface following consistent theme
- **Real-time Updates**: Live cart updates, order status tracking
- **Search & Discovery**: Advanced search with filters, sorting, and category browsing
- **Error Handling**: Comprehensive error boundaries and loading states
- **Toast Notifications**: User-friendly feedback system

### 📦 Product Management
- **Categories**: Seeds, Fertilizers, Pesticides, Tools, Irrigation, Machinery, Organic Products
- **Product Details**: Comprehensive product information with images and specifications
- **Stock Management**: Real-time inventory tracking and low-stock alerts
- **Seller Integration**: Products from verified suppliers with seller information

### 🏪 Marketplace Features
- **Hot Deals**: Flash sales, bulk offers, and seasonal promotions
- **Seller Directory**: Browse and connect with verified sellers
- **Help Center**: Comprehensive FAQ and customer support system
- **Search Results**: Advanced search with filters and sorting options

## 🛠️ Technical Architecture

### **Frontend (Next.js 14)**
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom theme colors
- **Components**: Reusable React components with TypeScript
- **State Management**: React hooks for local state
- **Error Handling**: React Error Boundaries
- **Notifications**: Custom toast notification system

### **Backend (Node.js)**
- **API Routes**: Next.js API routes for all marketplace operations
- **Database**: MongoDB with Mongoose ODM
- **Models**: Separate models for marketplace orders and existing supplier data
- **Authentication**: Ready for user authentication integration
- **Validation**: Input validation and error handling

### **Database Models**
- **MarketplaceOrder**: Customer orders with status tracking
- **Product**: Integration with existing product model
- **Seller**: Integration with existing seller model
- **Order History**: Complete order lifecycle tracking

## 📁 Project Structure

```
app/
├── marketplace/
│   ├── layout.tsx                 # Marketplace layout with navigation
│   ├── page.tsx                   # Homepage with products and deals
│   ├── categories/page.tsx        # Category browsing
│   ├── deals/page.tsx             # Hot deals and offers
│   ├── sellers/page.tsx           # Seller directory
│   ├── search/page.tsx            # Search results
│   ├── help/page.tsx              # Help and support
│   ├── cart/page.tsx              # Shopping cart
│   ├── checkout/page.tsx          # Multi-step checkout
│   ├── orders/
│   │   ├── page.tsx               # Order history
│   │   └── [id]/page.tsx          # Order tracking
│   ├── products/
│   │   └── [id]/page.tsx          # Product details
│   └── seller/
│       └── [id]/page.tsx          # Seller profile
├── api/marketplace/
│   ├── products/route.ts          # Product listing API
│   ├── products/[id]/route.ts     # Product details API
│   ├── products/sample/route.ts   # Sample products API
│   ├── orders/route.ts            # Order management API
│   ├── orders/[id]/route.ts       # Order tracking API
│   └── sellers/[id]/route.ts     # Seller profile API
components/
├── ErrorBoundary.tsx             # Error handling component
├── LoadingSpinner.tsx             # Loading states
└── Toast.tsx                      # Notification system
lib/models/
├── marketplace-order.ts          # Marketplace order model
└── order.ts                       # Existing supplier order model
```

## 🎯 Key Pages & Features

### **Homepage (`/marketplace`)**
- Featured products carousel
- Hot deals section
- Trusted sellers showcase
- Category navigation
- Search functionality

### **Product Pages**
- **Product Listing**: `/marketplace/products/[id]`
- **Product Details**: Images, specifications, reviews, seller info
- **Add to Cart**: Quantity selection and cart management
- **Buy Now**: Direct checkout option

### **Shopping Experience**
- **Cart**: `/marketplace/cart` - Cart management with item updates
- **Checkout**: `/marketplace/checkout` - Multi-step secure checkout
- **Orders**: `/marketplace/orders` - Order history and tracking

### **Seller Features**
- **Seller Directory**: `/marketplace/sellers` - Browse verified sellers
- **Seller Profiles**: `/marketplace/seller/[id]` - Detailed seller information
- **Seller Products**: Products by specific sellers

### **Discovery & Support**
- **Categories**: `/marketplace/categories` - Browse by product categories
- **Deals**: `/marketplace/deals` - Hot deals and promotions
- **Search**: `/marketplace/search` - Advanced search with filters
- **Help**: `/marketplace/help` - FAQ and customer support

## 🔧 Installation & Setup

### **Prerequisites**
- Node.js 18+ 
- MongoDB instance
- npm or yarn

### **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd bpfis_main

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start the development server
npm run dev
```

### **Environment Variables**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/agrilink

# Next.js
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 📊 API Endpoints

### **Products**
- `GET /api/marketplace/products` - List products with filters
- `GET /api/marketplace/products/[id]` - Get product details
- `POST /api/marketplace/products/sample` - Create sample products

### **Orders**
- `POST /api/marketplace/orders` - Place new order
- `GET /api/marketplace/orders/[id]` - Get order details
- `PUT /api/marketplace/orders/[id]` - Update order status

### **Sellers**
- `GET /api/marketplace/sellers/[id]` - Get seller profile
- `GET /api/marketplace/sellers/[id]/products` - Get seller products

## 🎨 Theme & Styling

### **Color Palette**
- **Primary**: `#1f3b2c` (Green)
- **Secondary**: `#e2d4b7` (Light Brown)
- **Accent**: `#6b7280` (Gray)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Yellow)
- **Error**: `#ef4444` (Red)

### **Design System**
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent spacing using Tailwind classes
- **Components**: Reusable components with consistent styling
- **Responsive**: Mobile-first responsive design

## 🔐 Security Features

- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Using Mongoose ODM
- **XSS Protection**: Proper input sanitization
- **Error Handling**: Secure error messages without information leakage
- **Authentication Ready**: Prepared for user authentication integration

## 📱 Mobile Responsiveness

- **Mobile-First**: Optimized for mobile devices
- **Touch-Friendly**: Appropriate touch targets and gestures
- **Responsive Navigation**: Mobile menu and search
- **Performance**: Optimized images and lazy loading

## 🚀 Performance Optimizations

- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js Image component
- **Caching**: API response caching where appropriate
- **Bundle Size**: Optimized bundle with tree shaking

## 🔄 Cart Persistence

- **LocalStorage**: Cart data persists across sessions
- **Real-time Updates**: Cart count updates across all pages
- **Event System**: Custom events for cart state changes
- **Fallback**: Graceful handling of localStorage failures

## 📦 Sample Data

The marketplace includes a sample products API that creates realistic agricultural products:
- **8 Product Categories**: Seeds, Fertilizers, Tools, Irrigation, Machinery, Organic, Pesticides
- **Realistic Pricing**: Appropriate pricing for agricultural products
- **Seller Information**: Verified seller profiles with ratings
- **Product Details**: Comprehensive product specifications

## 🛠️ Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check
npm run type-check
```

## 📈 Future Enhancements

### **Planned Features**
- **User Authentication**: Customer and seller login system
- **Payment Gateway Integration**: Razorpay, PayU integration
- **Advanced Analytics**: Sales analytics and insights
- **Mobile App**: React Native mobile application
- **Multi-language Support**: Regional language support
- **Advanced Search**: AI-powered product recommendations
- **Live Chat**: Real-time customer support chat
- **Subscription Services**: Regular delivery subscriptions

### **Technical Improvements**
- **Microservices Architecture**: Separate services for scalability
- **Redis Caching**: Improved performance with caching
- **Elasticsearch**: Advanced search capabilities
- **CDN Integration**: Global content delivery
- **Load Balancing**: High availability setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- **Email**: support@agrilink.com
- **Phone**: 1800-123-4567
- **Help Center**: `/marketplace/help`

## 🌟 Acknowledgments

- **Next.js Team**: For the amazing framework
- **Tailwind CSS**: For the utility-first CSS framework
- **MongoDB**: For the flexible database solution
- **Agricultural Community**: For inspiring this platform

---

**🌾 AgriLink Marketplace - Connecting Farmers, Growing India 🇮🇳**
