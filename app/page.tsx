'use client';

import { useState, useEffect, useRef } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shortUrl, setShortUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setShortUrl('');
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(selectedFile);
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  // ❌ 画像の選択を解除する関数
  const handleClear = () => {
    setFile(null);
    setShortUrl('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // inputのリセット
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const pastedFile = items[i].getAsFile();
          if (pastedFile) {
            const fileName = `pasted_image_${new Date().getTime()}.png`;
            const fileWithTimestamp = new File([pastedFile], fileName, { type: pastedFile.type });
            handleFileSelect(fileWithTimestamp);
            e.preventDefault();
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const base64Data = (event.target?.result as string).split(',')[1];
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: base64Data,
            mimeType: file.type
          }),
        });

        const result = await response.json();
        if (result.shortId) {
          const generatedUrl = `${window.location.origin}/${result.shortId}`;
          setShortUrl(generatedUrl);
        } else {
          alert('エラー: ' + result.error);
        }
      } catch (err) {
        alert('通信エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">作戦マップ共有</h1>
        <p className="text-xs text-center text-gray-500 mb-6">
          画像をコピーして <b>Ctrl+V</b> で貼り付けできます
        </p>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"
              required={!file} // ファイルがない時だけ必須にする
            />
            
            {/* プレビュー表示エリア（×ボタン追加） */}
            {previewUrl && (
              <div className="mt-4 flex justify-center relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="プレビュー" className="max-h-48 rounded border border-gray-200 shadow-sm" />
                
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute -top-3 -right-3 bg-gray-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-500 transition-colors"
                  aria-label="画像をクリア"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <button type="submit" disabled={loading || !file} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400 transition shadow">
            {loading ? 'アップロード中...' : 'URL化する'}
          </button>
        </form>

        {/* 完了画面（続けて作成する案内を追加） */}
        {shortUrl && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-sm font-bold text-green-800 mb-2">✅ 生成完了</p>
            <input type="text" readOnly value={shortUrl} className="w-full p-2 border rounded text-sm mb-2" onClick={(e) => { e.currentTarget.select(); navigator.clipboard.writeText(e.currentTarget.value); }} />
            <p className="text-xs text-center text-gray-500 mb-3">※クリックで自動コピー</p>
            <a href={shortUrl} target="_blank" rel="noreferrer" className="block text-center text-blue-600 underline text-sm font-bold mb-4">
              プレビューを開く
            </a>
            
            <hr className="border-green-200 mb-3" />
            <p className="text-xs text-green-800 text-center font-medium leading-relaxed">
              💡 別の画像をURL化する場合は、<br />
              この画面のまま「ファイルを選択」するか<br />
              画像をペーストしてください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
