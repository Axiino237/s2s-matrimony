import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Check,
  Crop,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

interface PhotoCropModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => Promise<void> | void;
  isSaving?: boolean;
}

const VIEWPORT_SIZE = 300; // 300px square viewport
const TARGET_EXPORT_SIZE = 600; // 600px square high-res export

export const PhotoCropModal: React.FC<PhotoCropModalProps> = ({
  isOpen,
  imageUrl,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const [safeSrc, setSafeSrc] = useState<string>('');
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialPan, setInitialPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const viewportRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Safely prepare image URL (converting external URLs to blob to avoid canvas taint)
  useEffect(() => {
    if (!isOpen || !imageUrl) {
      setSafeSrc('');
      return;
    }

    let isMounted = true;
    let objectUrlToRevoke: string | null = null;

    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
      setSafeSrc(imageUrl);
    } else {
      fetch(imageUrl, { mode: 'cors' })
        .then((res) => res.blob())
        .then((blob) => {
          if (!isMounted) return;
          const url = URL.createObjectURL(blob);
          objectUrlToRevoke = url;
          setSafeSrc(url);
        })
        .catch(() => {
          if (isMounted) setSafeSrc(imageUrl);
        });
    }

    // Reset controls on new image
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);

    return () => {
      isMounted = false;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [isOpen, imageUrl]);

  // Load image natural dimensions
  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imageElementRef.current = img;
    setNaturalSize({
      width: img.naturalWidth || 300,
      height: img.naturalHeight || 300,
    });
  };

  // Base scale so the image covers the viewport completely
  const baseScale = React.useMemo(() => {
    if (!naturalSize.width || !naturalSize.height) return 1;
    // When rotated 90 or 270 deg, width and height swap
    const isSideways = rotation % 180 !== 0;
    const effectiveW = isSideways ? naturalSize.height : naturalSize.width;
    const effectiveH = isSideways ? naturalSize.width : naturalSize.height;
    return Math.max(VIEWPORT_SIZE / effectiveW, VIEWPORT_SIZE / effectiveH);
  }, [naturalSize, rotation]);

  // Dragging logic - Mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPan({ ...pan });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setPan({
      x: initialPan.x + dx,
      y: initialPan.y + dy,
    });
  }, [isDragging, dragStart, initialPan]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Dragging logic - Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setInitialPan({ ...pan });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;
    setPan({
      x: initialPan.x + dx,
      y: initialPan.y + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(Math.max(1, prev + delta), 3.5));
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Rotate 90 deg clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset adjustments
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  // Export cropped photo to canvas
  const handleSaveCrop = async () => {
    if (!imageElementRef.current || !safeSrc) return;

    try {
      const img = imageElementRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = TARGET_EXPORT_SIZE;
      canvas.height = TARGET_EXPORT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Move center
      ctx.translate(TARGET_EXPORT_SIZE / 2, TARGET_EXPORT_SIZE / 2);

      // Translate pan (scaled to target export size)
      const scaleMultiplier = TARGET_EXPORT_SIZE / VIEWPORT_SIZE;
      ctx.translate(pan.x * scaleMultiplier, pan.y * scaleMultiplier);

      // Rotate
      ctx.rotate((rotation * Math.PI) / 180);

      // Draw image
      const drawW = naturalSize.width * baseScale * zoom * scaleMultiplier;
      const drawH = naturalSize.height * baseScale * zoom * scaleMultiplier;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      await onSave(croppedDataUrl);
    } catch (err) {
      console.error('Failed to crop photo:', err);
    }
  };

  if (!isOpen || !imageUrl) return null;

  const currentDisplayW = naturalSize.width * baseScale * zoom;
  const currentDisplayH = naturalSize.height * baseScale * zoom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-primary flex items-center justify-center">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Crop & Adjust Photo</h3>
              <p className="text-xs text-slate-500">Frame your face perfectly for your profile</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="p-6 bg-slate-900 flex flex-col items-center justify-center select-none relative">
          <div
            ref={viewportRef}
            className="relative overflow-hidden bg-slate-950 rounded-2xl cursor-grab active:cursor-grabbing shadow-2xl touch-none border-2 border-white/20"
            style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* Image Layer */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px)`,
              }}
            >
              {safeSrc && (
                <img
                  ref={imageElementRef}
                  src={safeSrc}
                  alt="Crop Target"
                  crossOrigin="anonymous"
                  onLoad={handleImageLoaded}
                  draggable={false}
                  style={{
                    width: `${currentDisplayW}px`,
                    height: `${currentDisplayH}px`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                  }}
                />
              )}
            </div>

            {/* Avatar Rounded Guide Overlay with Mask */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]">
              {/* Subtle Rule-of-Thirds Grid */}
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-30">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5 font-medium">
            <span>ðŸ–±ï¸ Drag to reposition</span>
            <span>â€¢</span>
            <span>Scroll or use slider to zoom</span>
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="p-5 space-y-4 bg-slate-50/60 border-t border-slate-100">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
              disabled={zoom <= 1}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center disabled:opacity-40 transition-colors shadow-xs"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
              disabled={zoom >= 3}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center disabled:opacity-40 transition-colors shadow-xs"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-600 w-11 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Quick Adjustment Buttons */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Rotate</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
                title="Reset to center"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              Resolution: 600Ã—600
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 bg-white border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="btn btn-outline btn-sm px-4 text-xs font-semibold rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveCrop}
            disabled={isSaving}
            className="btn bg-rose-600 hover:bg-rose-700 text-white btn-sm px-5 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
