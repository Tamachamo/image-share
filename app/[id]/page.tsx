import ZoomableImage from '@/components/ZoomableImage';

export const runtime = 'edge';

export default async function ViewerPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  return (
    <div className="min-h-screen bg-[#222] overflow-hidden m-0 p-0">
      <ZoomableImage src={`/api/image/${id}`} alt="共有画像" />
    </div>
  );
}
