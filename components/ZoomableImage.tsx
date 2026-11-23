'use client';

import { useRef, useEffect } from 'react';

type Props = {
  src: string;
  alt: string;
};

export default function ZoomableImage({ src, alt }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    let scale = 1;
    let x = 0;
    let y = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    // ピンチ用
    let pinchDist = 0;
    let pinchStartScale = 1;
    let pinchStartX = 0;
    let pinchStartY = 0;
    let pinchMidX = 0;
    let pinchMidY = 0;

    let lastTap = 0;
    let rafId: number | null = null;

    const clampScale = (s: number) => Math.min(Math.max(s, 1), 5);

    // 1フレームに1回だけGPUで描画更新
    const scheduleRender = (animate = false) => {
      if (animate) {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        img.style.transition = 'transform 0.18s cubic-bezier(0.2, 0, 0, 1)';
        img.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
        return;
      }

      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        img.style.transition = 'none';
        img.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      });
    };

    const reset = () => {
      scale = 1;
      x = 0;
      y = 0;
      scheduleRender(true);
    };

    const toggleZoom = (clientX: number, clientY: number) => {
      if (scale > 1) {
        reset();
      } else {
        const rect = container.getBoundingClientRect();
        const cx = clientX - (rect.left + rect.width / 2);
        const cy = clientY - (rect.top + rect.height / 2);
        scale = 2.5;
        x = -cx * (scale - 1);
        y = -cy * (scale - 1);
        scheduleRender(true);
      }
    };

    // --- スマホ: ネイティブタッチイベント ---
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isDragging = false;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        pinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        pinchStartScale = scale;
        pinchStartX = x;
        pinchStartY = y;
        const rect = container.getBoundingClientRect();
        pinchMidX = (t1.clientX + t2.clientX) / 2 - (rect.left + rect.width / 2);
        pinchMidY = (t1.clientY + t2.clientY) / 2 - (rect.top + rect.height / 2);
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTap < 280) {
          e.preventDefault();
          toggleZoom(e.touches[0].clientX, e.touches[0].clientY);
          lastTap = 0;
          return;
        }
        lastTap = now;

        if (scale > 1) {
          isDragging = true;
          startX = e.touches[0].clientX - x;
          startY = e.touches[0].clientY - y;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchDist > 0) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const nextScale = clampScale(pinchStartScale * (dist / pinchDist));

        if (nextScale === 1) {
          scale = 1;
          x = 0;
          y = 0;
        } else {
          const rect = container.getBoundingClientRect();
          const curMidX = (t1.clientX + t2.clientX) / 2 - (rect.left + rect.width / 2);
          const curMidY = (t1.clientY + t2.clientY) / 2 - (rect.top + rect.height / 2);
          const ratio = nextScale / pinchStartScale;

          scale = nextScale;
          x = curMidX - (pinchMidX - pinchStartX) * ratio;
          y = curMidY - (pinchMidY - pinchStartY) * ratio;
        }
        scheduleRender(false);
      } else if (e.touches.length === 1 && isDragging && scale > 1) {
        e.preventDefault();
        x = e.touches[0].clientX - startX;
        y = e.touches[0].clientY - startY;
        scheduleRender(false);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchDist = 0;
      if (e.touches.length === 0) {
        isDragging = false;
        if (scale <= 1.02) reset();
      } else if (e.touches.length === 1 && scale > 1) {
        // 2本指から1本指に戻したとき、そのままスムーズにスライド継続
        isDragging = true;
        startX = e.touches[0].clientX - x;
        startY = e.touches[0].clientY - y;
      }
    };

    // --- PC: ホイール＆ドラッグ ---
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const prevScale = scale;
      const nextScale = clampScale(scale * (e.deltaY < 0 ? 1.15 : 0.87));
      if (nextScale === 1) {
        scale = 1;
        x = 0;
        y = 0;
      } else {
        const rect = container.getBoundingClientRect();
        const cx = e.clientX - (rect.left + rect.width / 2);
        const cy = e.clientY - (rect.top + rect.height / 2);
        const ratio = nextScale / prevScale;
        scale = nextScale;
        x = cx - (cx - x) * ratio;
        y = cy - (cy - y) * ratio;
      }
      scheduleRender(false);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (scale <= 1) return;
      e.preventDefault();
      isDragging = true;
      startX = e.clientX - x;
      startY = e.clientY - y;
      img.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || scale <= 1) return;
      x = e.clientX - startX;
      y = e.clientY - startY;
      scheduleRender(false);
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      img.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
    };

    const onDblClick = (e: MouseEvent) => {
      toggleZoom(e.clientX, e.clientY);
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('dblclick', onDblClick);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('dblclick', onDblClick);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] bg-[#222] flex items-center justify-center overflow-hidden touch-none select-none"
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
        className="w-full h-full object-contain"
      />
    </div>
  );
}
