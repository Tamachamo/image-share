export const runtime = 'edge';

export default function ViewerPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-[#222] flex items-center justify-center overflow-hidden m-0 p-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={`/api/image/${params.id}`} 
        alt="共有画像" 
        className="max-w-full max-h-screen object-contain"
      />
    </div>
  );
}
