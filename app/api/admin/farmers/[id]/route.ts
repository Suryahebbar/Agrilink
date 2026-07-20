import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { Product, FarmerOrder } from '@/lib/models';
import FarmerSchemeProfile from '@/models/FarmerSchemeProfile';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { LandDetails } from '@/lib/models/LandDetails';
import { LandIntegration } from '@/lib/models/LandIntegration';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectDB();
    
    // Find farmer by ID
    const farmer = await User.findOne({ _id: id, role: 'farmer' })
      .select('-password -__v');

    if (!farmer) {
      return NextResponse.json(
        { error: 'Farmer not found' },
        { status: 404 }
      );
    }

    // Fetch comprehensive farmer profile data
    const farmerObjectId = new mongoose.Types.ObjectId(id);
    
    // Get farmer's scheme profile with all detailed information
    const schemeProfile = await FarmerSchemeProfile.findOne({ 
      userId: farmerObjectId, 
      isActive: true 
    }).sort({ isDefault: -1 });

    // Fetch data from the three collections
    const [
      farmerProfileData,
      landDetailsData,
      landIntegrationSentData,
      landIntegrationReceivedData
    ] = await Promise.all([
      // Farmer Profile collection - try both user and userId fields
      FarmerProfile.findOne({ $or: [{ user: farmerObjectId }, { userId: id }] }),
      
      // Land Details collection - try both user and userId fields  
      LandDetails.find({ $or: [{ user: farmerObjectId }, { userId: id }] }).sort({ createdAt: -1 }),
      
      // Land Integration - requests sent by this farmer
      LandIntegration.find({ requestingUser: farmerObjectId })
        .populate('targetUser', 'name email')
        .populate('landDetails.requestingUser.landId', 'rtcDetails')
        .populate('landDetails.targetUser.landId', 'rtcDetails')
        .sort({ requestDate: -1 }),
      
      // Land Integration - requests received by this farmer
      LandIntegration.find({ targetUser: farmerObjectId })
        .populate('requestingUser', 'name email')
        .populate('landDetails.requestingUser.landId', 'rtcDetails')
        .populate('landDetails.targetUser.landId', 'rtcDetails')
        .sort({ requestDate: -1 })
    ]);

    // Get farmer's products
    const products = await Product.find({ farmerId: farmerObjectId })
      .select('name price stock category status createdAt updatedAt')
      .sort({ createdAt: -1 });

    // Get farmer's orders
    const orders = await FarmerOrder.find({ farmerId: farmerObjectId })
      .select('total status paymentStatus createdAt updatedAt items')
      .populate('items.productId', 'name price')
      .sort({ createdAt: -1 })
      .limit(20);

    // Calculate statistics
    const totalProducts = await Product.countDocuments({ farmerId: farmerObjectId });
    const totalOrders = await FarmerOrder.countDocuments({ farmerId: farmerObjectId });
    const completedOrders = await FarmerOrder.countDocuments({ 
      farmerId: farmerObjectId, 
      status: 'completed' 
    });
    const pendingOrders = await FarmerOrder.countDocuments({ 
      farmerId: farmerObjectId, 
      status: 'pending' 
    });

    // Calculate total revenue from completed orders
    const revenueData = await FarmerOrder.aggregate([
      { $match: { farmerId: farmerObjectId, status: 'completed' } },
      { $unwind: '$items' },
      { $group: {
        _id: null,
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }}
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // Format products data
    const formattedProducts = products.map((product: any) => ({
      _id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stockQuantity,
      category: product.category,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    // Format orders data
    const formattedOrders = orders.map((order: any) => ({
      _id: order._id,
      total: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item: any) => ({
        productId: typeof item.productId === 'object' && item.productId !== null ? item.productId.toString() : item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity
      }))
    }));

    // Enhanced farmer data with all related information
    const enhancedFarmer = {
      ...farmer.toObject(),
      // Basic farmer information
      basicInfo: {
        fullName: farmer.name,
        email: farmer.email,
        phone: farmer.phone,
        address: farmer.address,
        profilePicture: farmer.profilePicture,
        isVerified: farmer.isVerified,
        role: farmer.role,
        createdAt: farmer.createdAt,
        updatedAt: farmer.updatedAt
      },
      // Detailed scheme profile information
      profileData: schemeProfile ? {
        profileName: schemeProfile.profileName,
        scheme_name: schemeProfile.profileData?.scheme_name,
        official_link: schemeProfile.profileData?.official_link,
        land_size: schemeProfile.profileData?.land_size,
        farmer_category: schemeProfile.profileData?.farmer_category,
        location_state: schemeProfile.profileData?.location_state,
        location_district: schemeProfile.profileData?.location_district,
        location_taluk: schemeProfile.profileData?.location_taluk,
        village_rtc_data: schemeProfile.profileData?.village_rtc_data,
        crop_type: schemeProfile.profileData?.crop_type,
        season: schemeProfile.profileData?.season,
        irrigation_type: schemeProfile.profileData?.irrigation_type,
        water_source_capacity: schemeProfile.profileData?.water_source_capacity,
        organic_certification: schemeProfile.profileData?.organic_certification,
        farmer_age: schemeProfile.profileData?.farmer_age,
        gender: schemeProfile.profileData?.gender,
        income_catogory: schemeProfile.profileData?.income_catogory,
        pm_kisan_registration: schemeProfile.profileData?.pm_kisan_registration,
        equipment_ownership: schemeProfile.profileData?.equipment_ownership,
        fpo_membership: schemeProfile.profileData?.fpo_membership,
        insurance_status_pmfby: schemeProfile.profileData?.insurance_status_pmfby,
        disaster_affected_region: schemeProfile.profileData?.disaster_affected_region,
        soil_type: schemeProfile.profileData?.soil_type,
        isActive: schemeProfile.isActive,
        isDefault: schemeProfile.isDefault,
        createdAt: schemeProfile.createdAt,
        updatedAt: schemeProfile.updatedAt
      } : null,
      // Scheme search results
      schemeSearchResults: schemeProfile?.searchResults?.map((result: any) => ({
        eligibleSchemes: result.eligibleSchemes,
        count: result.count,
        searchedAt: result.searchedAt
      })) || [],
      // Farmer Profile collection data
      farmerProfile: farmerProfileData ? {
        verifiedName: farmerProfileData.verifiedName,
        kannadaName: farmerProfileData.kannadaName,
        aadhaarKannadaName: farmerProfileData.aadhaarKannadaName,
        rtcAddress: farmerProfileData.rtcAddress,
        nameVerificationStatus: farmerProfileData.nameVerificationStatus,
        age: farmerProfileData.age,
        gender: farmerProfileData.gender,
        homeAddress: farmerProfileData.homeAddress,
        idProof: farmerProfileData.idProof,
        contactNumber: farmerProfileData.contactNumber,
        dob: farmerProfileData.dob,
        landParcelIdentity: farmerProfileData.landParcelIdentity,
        ownershipVerified: farmerProfileData.ownershipVerified,
        soilProperties: farmerProfileData.soilProperties,
        irrigationPotential: farmerProfileData.irrigationPotential,
        croppingHistory: farmerProfileData.croppingHistory,
        totalCultivableArea: farmerProfileData.totalCultivableArea,
        revenueObligations: farmerProfileData.revenueObligations,
        mutationTraceability: farmerProfileData.mutationTraceability,
        documents: farmerProfileData.documents,
        readyToIntegrate: farmerProfileData.readyToIntegrate,
        readyToIntegrateDate: farmerProfileData.readyToIntegrateDate,
        createdAt: farmerProfileData.createdAt,
        updatedAt: farmerProfileData.updatedAt
      } : null,
      // Land Details collection data
      landDetails: landDetailsData.map((land: any) => ({
        _id: land._id,
        sketchImage: land.sketchImage,
        landData: land.landData,
        rtcDetails: land.rtcDetails,
        processingStatus: land.processingStatus,
        processedAt: land.processedAt,
        createdAt: land.createdAt,
        updatedAt: land.updatedAt
      })),
      // Land Integration collection data
      landIntegrations: {
        sent: landIntegrationSentData.map((integration: any) => ({
          _id: integration._id,
          targetUser: integration.targetUser,
          status: integration.status,
          requestDate: integration.requestDate,
          responseDate: integration.responseDate,
          integrationPeriod: integration.integrationPeriod,
          landDetails: integration.landDetails,
          financialAgreement: integration.financialAgreement,
          agreementDocument: integration.agreementDocument,
          signatures: integration.signatures,
          executionDate: integration.executionDate,
          blockchain: integration.blockchain,
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt
        })),
        received: landIntegrationReceivedData.map((integration: any) => ({
          _id: integration._id,
          requestingUser: integration.requestingUser,
          status: integration.status,
          requestDate: integration.requestDate,
          responseDate: integration.responseDate,
          integrationPeriod: integration.integrationPeriod,
          landDetails: integration.landDetails,
          financialAgreement: integration.financialAgreement,
          agreementDocument: integration.agreementDocument,
          signatures: integration.signatures,
          executionDate: integration.executionDate,
          blockchain: integration.blockchain,
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt
        }))
      },
      // Business statistics
      statistics: {
        totalProducts,
        totalOrders,
        completedOrders,
        pendingOrders,
        totalRevenue,
        averageOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0
      },
      // Products and orders
      products: formattedProducts,
      orders: formattedOrders
    };

    return NextResponse.json({
      success: true,
      data: enhancedFarmer
    });
  } catch (error) {
    console.error('Error fetching farmer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch farmer details' },
      { status: 500 }
    );
  }
}
