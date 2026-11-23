'use client';

import { useState, useRef, useEffect } from 'react';

type Props = {
  src: string;
  alt: string;
};

export default function ZoomableImage({ src, alt }: Props) {
  const [displayScale, setDisplayScale] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const labelRef = useRef<HTMLButtonElement>(null);

  // Reactの再描画を起こさずに位置・倍率を管理するRef
  const state = useRef({
    scale: 1,
    x: 0,
    y: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    pinchDist: null as number | null,
    pinchScale: 1,
    lastTap: 0,
  });

  const clampScale = (s: number) => Math.min(Math.max(s, 1), 5);

  // GPUを使ってDOMを直接更新（再描画なし）
  const applyTransform = (animate = false) => {
    const img = imgRef.current;
    if (!img) return;
    const { x, y, scale, isDragging } = state.current;
    img.style.transition = animate ? 'transform 0.15s ease-out' : 'none';
    img.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    img.style.cursor = scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in';

    if (labelRef.current) {
      labelRef.current.textContent = `${Math.round(scale * 100)}%`;
    }
  };

  const syncButtonState = () => {
    setDisplayScale(state.current.scale);
  };

  const handleReset = () => {
    state.current.scale = 1;
    state.current.x = 0;
    state.current.y = 0;
    applyTransform(true);
    syncButtonState();
  };

  const handleZoom = (delta: number, animate = true) => {
    const next = clampScale(Number((state.current.scale + delta).toFixed(2)));
    state.current.scale = next;
    if (next === 1) {
      state.current.x = 0;
      state.current.y = 0;
    }
    applyTransform(animate);
    syncButtonState();
  };

  const handleDoubleClick = () => {
    if (state.current.scale > 1) {
      handleReset();
    } else {
      state.current.scale = 2.5;
      applyTransform(true);
      syncButtonState();
    }
  };

  // PC: ホイールズーム（passive: false でブラウザのスクロールを確実に防止）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      handleZoom(delta, false);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // PC: ドラッグ移動
  const handleMouseDown = (e: React.MouseEvent) => {
    if (state.current.scale <= 1) return;
    e.preventDefault();
    state.current.isDragging = true;
    state.current.startX = e.clientX - state.current.x;
    state.current.startY = e.clientY - state.current.y;
    applyTransform(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!state.current.isDragging || state.current.scale <= 1) return;
    state.current.x = e.clientX - state.current.startX;
    state.current.y = e.clientY - state.current.startY;
    applyTransform(false);
  };

  const handleMouseUp = () => {
    if (!state.current.isDragging) return;
    state.current.isDragging = false;
    applyTransform(false);
  };

  // スマホ: タッチ操作（ピンチ・スワイプ・ダブルタップ）
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      state.current.pinchDist = Math.hypot(dx, dy);
      state.current.pinchScale = state.current.scale;
      state.current.isDragging = false;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - state.current.lastTap < 300) {
        handleDoubleClick();
        state.current.lastTap = 0;
        return;
      }
      state.current.lastTap = now;

      if (state.current.scale > 1) {
        state.current.isDragging = true;
        state.current.startX = e.touches[0].clientX - state.current.x;
        state.current.startY = e.touches[0].clientY - state.current.y;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && state.current.pinchDist !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const next = clampScale(state.current.pinchScale * (dist / state.current.pinchDist));
      state.current.scale = next;
      if (next === 1) {
        state.current.x = 0;
        state.current.y = 0;
      }
      applyTransform(false);
    } else if (e.touches.length === 1 && state.current.isDragging && state.current.scale > 1) {
      state.current.x = e.touches[0].clientX - state.current.startX;
      state.current.y = e.touches[0].clientY - state.current.startY;
      applyTransform(false);
    }
  };

  const handleTouchEnd = () => {
    state.current.pinchDist = null;
    state.current.isDragging = false;
    syncButtonState();
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-screen flex items-center justify-center overflow-hidden touch-none select-none"
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
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        style={{
          transform: 'translate3d(0px, 0px, 0) scale(1)',
          willChange: 'transform',
          cursor: 'zoom-in',
        }}
        className="max-w-full max-h-screen object-contain"
      />

      {/* 右下隅のズーム操作バー */}
      <div className="fixed bottom-2 right-2 flex items-center gap-0.5 bg-black/50 text-white px-1.5 py-1 rounded-full backdrop-blur-md border border-white/20 shadow-lg z-50">
        <button
          type="button"
          onClick={() => handleZoom(-0.5)}
          disabled={displayScale <= 1}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 disabled:opacity-30 font-bold text-sm"
          aria-label="縮小"
        >
          －
        </button>
        <button
          ref={labelRef}
          type="button"
          onClick={handleReset}
          className="px-1.5 text-[11px] font-mono hover:bg-white/20 rounded py-0.5"
          aria-label="リセット"
        >
          100%
        </button>
        <button
          type="button"
          onClick={() => handleZoom(0.5)}
          disabled={displayScale >= 5}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 disabled:opacity-30 font-bold text-sm"
          aria-label="拡大"
        >
          ＋
        </button>
      </div>
    </div>
  );
}
