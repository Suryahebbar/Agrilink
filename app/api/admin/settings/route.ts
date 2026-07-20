import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

interface SystemSettings {
  platform: {
    name: string;
    version: string;
    maintenance: boolean;
    maintenanceMessage: string;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
  };
  security: {
    passwordMinLength: number;
    sessionTimeout: number;
    twoFactorAuth: boolean;
  };
  features: {
    farmerRegistration: boolean;
    supplierApproval: boolean;
    documentVerification: boolean;
  };
}

const defaultSettings: SystemSettings = {
  platform: {
    name: 'BPFIS Platform',
    version: '1.0.0',
    maintenance: false,
    maintenanceMessage: 'System is currently under maintenance. Please try again later.'
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true
  },
  security: {
    passwordMinLength: 8,
    sessionTimeout: 120,
    twoFactorAuth: false
  },
  features: {
    farmerRegistration: true,
    supplierApproval: true,
    documentVerification: true
  }
};

export async function GET() {
  try {
    await connectDB();
    
    // For now, return default settings
    // In a real implementation, these would be stored in a database
    return NextResponse.json({ settings: defaultSettings });
    
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const settings = body.settings;
    
    // Validate settings structure
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      );
    }
    
    // In a real implementation, save to database
    // For now, just return success
    return NextResponse.json({ message: 'Settings updated successfully' });
    
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
