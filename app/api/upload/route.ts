import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'edge';

function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const shortId = Math.random().toString(36).substring(2, 8);
    
    const S3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

    const fileData = base64ToUint8Array(data.base64);

    await S3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: shortId,
      Body: fileData,
      ContentType: data.mimeType || 'image/png',
    }));

    return NextResponse.json({ shortId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
