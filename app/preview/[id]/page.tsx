import Link from 'next/link';
import ZoomableImage from '@/components/ZoomableImage';

export const runtime = 'edge';

export default async function PreviewPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  return (
    <div className="min-h-screen bg-[#222] relative overflow-hidden m-0 p-0">
      <Link
        href="/"
        className="fixed top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-black/80 transition z-50 flex items-center gap-2 backdrop-blur-md border border-white/20"
      >
        <span>←</span> トップ画面へ
      </Link>

      <ZoomableImage src={`/api/image/${id}`} alt="共有画像" />
    </div>
  );
}
