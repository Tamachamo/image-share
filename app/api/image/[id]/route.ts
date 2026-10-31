import { NextRequest } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'edge';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = params.id;

    const S3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

    const result = await S3.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: id,
    }));

    const response = new Response(result.Body as any);
    response.headers.set('Content-Type', result.ContentType || 'image/png');
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return response;
    
  } catch (error) {
    return new Response('画像が見つかりません', { status: 404 });
  }
}
