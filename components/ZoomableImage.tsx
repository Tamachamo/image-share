'use client';

import { useState, useRef } from 'react';

type Props = {
  src: string;
  alt: string;
};

export default function ZoomableImage({ src, alt }: Props) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStart = useRef({ x: 0, y: 0 });
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef(1);
  const lastTap = useRef(0);

  const clampScale = (s: number) => Math.min(Math.max(s, 1), 5);

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoom = (delta: number) => {
    setScale((prev) => {
      const next = clampScale(Number((prev + delta).toFixed(2)));
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  // PC: マウスホイールでズーム
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.3 : -0.3;
    handleZoom(delta);
  };

  // PC: ドラッグ移動
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // PC: ダブルクリックでズーム切替
  const handleDoubleClick = () => {
    if (scale > 1) {
      handleReset();
    } else {
      setScale(2.5);
    }
  };

  // スマホ: タッチ開始（ピンチ・ドラッグ・ダブルタップ判定）
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.hypot(dx, dy);
      pinchStartScale.current = scale;
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        handleDoubleClick();
        lastTap.current = 0;
        return;
      }
      lastTap.current = now;

      if (scale > 1) {
        setIsDragging(true);
        dragStart.current = {
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y,
        };
      }
    }
  };

  // スマホ: タッチ移動（ピンチズーム・スワイプ移動）
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const nextScale = clampScale(pinchStartScale.current * (dist / pinchStartDist.current));
      setScale(nextScale);
      if (nextScale === 1) setPosition({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    pinchStartDist.current = null;
    setIsDragging(false);
  };

  return (
    <div
      className="w-full h-screen flex items-center justify-center overflow-hidden touch-none select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging || pinchStartDist.current ? 'none' : 'transform 0.15s ease-out',
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
        }}
        className="max-w-full max-h-screen object-contain"
      />

      {/* 右下のズーム操作バー */}
      <div className="fixed bottom-5 right-5 flex items-center gap-1 bg-black/60 text-white px-2 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg z-50">
        <button
          type="button"
          onClick={() => handleZoom(-0.5)}
          disabled={scale <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 disabled:opacity-30 font-bold text-lg"
          aria-label="縮小"
        >
          －
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-2 text-xs font-mono hover:bg-white/20 rounded py-1"
          aria-label="リセット"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          type="button"
          onClick={() => handleZoom(0.5)}
          disabled={scale >= 5}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 disabled:opacity-30 font-bold text-lg"
          aria-label="拡大"
        >
          ＋
        </button>
      </div>
    </div>
  );
}
