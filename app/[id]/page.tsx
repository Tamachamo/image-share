export const runtime = 'edge';

export default async function ViewerPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  return (
    <div className="min-h-screen bg-[#222] flex items-center justify-center overflow-hidden m-0 p-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={`/api/image/${id}`} 
        alt="共有画像" 
        className="max-w-full max-h-screen object-contain"
      />
    </div>
  );
}
