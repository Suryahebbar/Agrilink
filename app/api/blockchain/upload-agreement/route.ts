import { NextRequest, NextResponse } from 'next/server';

// Dynamic import for web3.storage to avoid TypeScript issues
const importWeb3Storage = async () => {
  try {
    const web3Storage = await import('web3.storage');
    return web3Storage;
  } catch (error) {
    console.error('Failed to import web3.storage:', error);
    return null;
  }
};

export async function POST(req: NextRequest) {
  try {
    const web3StorageModule = await importWeb3Storage();
    if (!web3StorageModule) {
      return NextResponse.json(
        { error: 'Web3.Storage module not available' },
        { status: 500 }
      );
    }

    const client = new web3StorageModule.Web3Storage({ token: process.env.WEB3STORAGE_KEY! });

    const data = await req.formData();
    const file = data.get('file') as File;
    const agreementId = data.get('agreementId') as string;
    const userId = data.get('userId') as string;

    if (!file || !agreementId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, agreementId, userId' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const web3File = new web3StorageModule.File(
      [buffer], 
      file.name, 
      { type: file.type }
    );

    const filename = `agreements/${userId}/${agreementId}/${file.name}`;
    const cid = await client.put([web3File], {
      name: filename,
      wrapWithDirectory: true
    });

    return NextResponse.json({
      success: true,
      cid: cid,
      filename: file.name,
      ipfsUrl: `https://ipfs.io/ipfs/${cid}/${file.name}`,
      gatewayUrl: `https://gateway.ipfs.io/ipfs/${cid}/${file.name}`
    });

  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    return NextResponse.json(
      { error: 'Failed to upload to IPFS' },
      { status: 500 }
    );
  }
}
