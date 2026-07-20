import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export const uploadFile = async (file: Buffer, folder: string, publicId?: string) => {
  try {
    // Check if Cloudinary is properly configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary environment variables are missing');
      return {
        success: false,
        error: 'Cloudinary configuration missing',
      };
    }

    console.log(`Starting Cloudinary upload for ${publicId || 'unnamed file'} to folder ${folder}`);
    
    // Convert buffer to base64 string with proper MIME type detection
    const base64String = `data:application/octet-stream;base64,${file.toString('base64')}`;
    
    const uploadOptions = {
      folder: `bpfis/${folder}`,
      resource_type: 'auto' as const,
      overwrite: true,
      timeout: 60000, // 60 seconds timeout
    };

    // Only add public_id if it's provided
    if (publicId) {
      (uploadOptions as any).public_id = publicId;
    }
    
    console.log('Upload options:', uploadOptions);
    
    const result = await cloudinary.uploader.upload(base64String, uploadOptions);

    console.log('Cloudinary upload successful:', result.public_id);

    return {
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      },
    };
  } catch (error: any) {
    console.error('Cloudinary upload error details:', {
      message: error.message,
      code: error.code,
      http_code: error.http_code,
      name: error.name
    });
    
    return {
      success: false,
      error: error.message || 'Failed to upload file to Cloudinary',
    };
  }
};

export const deleteFile = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete file from Cloudinary',
    };
  }
};

export default cloudinary;
