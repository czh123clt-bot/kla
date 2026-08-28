import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlayingCard, ARSettings, QuadCorners, Point2D, CapturedPhoto } from '../types';
import { processARFrame } from '../utils/arEngine';
import { detectWhiteCardCorners, detectWhiteCardAtPoint } from '../utils/whiteCardDetector';
import { generateCardSVG } from '../utils/cardGenerator';
import { Camera, RefreshCw, Sliders, Maximize, Minimize, Flashlight, Image as ImageIcon, Sparkles, CheckCircle2 } from 'lucide-react';

interface CameraViewProps {
  selectedCard: PlayingCard;
  settings: ARSettings;
  onOpenSettings: () => void;
  onOpenGallery: () => void;
  onOpenSuitRankModal?: () => void;
  onCapturePhoto: (photo: CapturedPhoto) => void;
  savedPhotosCount: number;
  corners: QuadCorners;
  setCorners: React.Dispatch<React.SetStateAction<QuadCorners>>;
  cards: PlayingCard[];
}

export const CameraView: React.FC<CameraViewProps> = ({
  selectedCard,
  settings,
  onOpenSettings,
  onOpenGallery,
  onOpenSuitRankModal,
  onCapturePhoto,
  savedPhotosCount,
  corners,
  setCorners,
  cards,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Loaded Card Image element
  const cardImageRef = useRef<HTMLImageElement | null>(null);
  const [cardImageLoaded, setCardImageLoaded] = useState<boolean>(false);

  // Active Corner / Box dragging state
  const [activeDragPoint, setActiveDragPoint] = useState<keyof QuadCorners | 'center' | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; initialCorners: QuadCorners } | null>(null);

  // Load selected card image whenever selectedCard changes
  useEffect(() => {
    if (!selectedCard.dataUrl) return;
    setCardImageLoaded(false);
    const img = new Image();
    if (selectedCard.dataUrl.startsWith('http://') || selectedCard.dataUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      cardImageRef.current = img;
      setCardImageLoaded(true);
    };
    img.onerror = (e) => {
      console.warn('Failed to load card image, using SVG fallback for:', selectedCard.name, e);
      if (selectedCard.suit && selectedCard.rank) {
        const fallbackSvg = generateCardSVG(selectedCard.suit, selectedCard.rank);
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          cardImageRef.current = fallbackImg;
          setCardImageLoaded(true);
        };
        fallbackImg.src = fallbackSvg;
      }
    };
    img.src = selectedCard.dataUrl;
  }, [selectedCard]);

  // Start Camera Stream
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          setCameraPermission('granted');
          setErrorMessage('');
        } catch (playErr: any) {
          if (playErr.name === 'AbortError') {
            console.warn('Camera play() interrupted by a new request or stream switch (handled):', playErr);
          } else {
            throw playErr;
          }
        }
      }

      // List camera devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setCameraDevices(videoInputs);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Camera Access Error:', err);
      setCameraPermission('denied');
      setErrorMessage(err.message || '无法调用摄像头，请确保在浏览器中授予相机权限。');
    }
  }, []);

  useEffect(() => {
    startCamera(selectedDeviceId);
  }, [selectedDeviceId, startCamera]);

  // Set default initial corners according to canvas dimensions
  const initializeCorners = useCallback((width: number, height: number) => {
    // Standard Playing Card Ratio 1:1.4 (e.g. width=220, height=308)
    const cardW = Math.min(width * 0.45, 260);
    const cardH = cardW * 1.4;
    const cx = width / 2;
    const cy = height / 2;

    setCorners({
      topLeft: { x: cx - cardW / 2, y: cy - cardH / 2 },
      topRight: { x: cx + cardW / 2, y: cy - cardH / 2 },
      bottomRight: { x: cx + cardW / 2, y: cy + cardH / 2 },
      bottomLeft: { x: cx - cardW / 2, y: cy + cardH / 2 },
    });
  }, [setCorners]);

  // Live Canvas Rendering & AR Composite Loop
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 720;

        if (canvas.width !== vw || canvas.height !== vh) {
          canvas.width = vw;
          canvas.height = vh;
          initializeCorners(vw, vh);
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          // 1. Draw live raw video frame to canvas
          ctx.drawImage(video, 0, 0, vw, vh);

          // 2. Auto white card corner snap if enabled
          if (settings.autoDetectWhiteCard) {
            const autoCorners = detectWhiteCardCorners(ctx, vw, vh, corners);
            if (autoCorners) {
              setCorners(autoCorners);
            }
          }

          // 3. Process photorealistic AR playing card light & shadow blend
          if (cardImageRef.current && cardImageLoaded) {
            processARFrame(ctx, vw, vh, cardImageRef.current, corners, settings);
          }

          // 4. Draw interactive corner points & target bounding box lines if enabled
          if (settings.showCornerHandles) {
            drawTargetBoxUI(ctx, corners);
          }
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [corners, settings, cardImageLoaded, initializeCorners, setCorners]);

  // Live timer for HUD telemetry
  const [recTime, setRecTime] = useState<string>('00:00:00');

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const hrs = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const secs = String(elapsed % 60).padStart(2, '0');
      setRecTime(`${hrs}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Draw target box UI (corner handles, center crosshair, guide lines) in Sophisticated Dark HUD aesthetic
  const drawTargetBoxUI = (ctx: CanvasRenderingContext2D, c: QuadCorners) => {
    ctx.save();

    // Bounding Box Polygon Path
    ctx.beginPath();
    ctx.moveTo(c.topLeft.x, c.topLeft.y);
    ctx.lineTo(c.topRight.x, c.topRight.y);
    ctx.lineTo(c.bottomRight.x, c.bottomRight.y);
    ctx.lineTo(c.bottomLeft.x, c.bottomLeft.y);
    ctx.closePath();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();

    // Subtle dark glass guide mask highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fill();

    // Draw Corner Brackets (HUD Camera style)
    const pts = [
      { key: 'topLeft', p: c.topLeft },
      { key: 'topRight', p: c.topRight },
      { key: 'bottomRight', p: c.bottomRight },
      { key: 'bottomLeft', p: c.bottomLeft },
    ];

    pts.forEach(({ p }) => {
      // Outer HUD ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#050505';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });

    // Draw Center Alignment Crosshair & Monospace HUD Label
    const cx = (c.topLeft.x + c.bottomRight.x) / 2;
    const cy = (c.topLeft.y + c.bottomRight.y) / 2;

    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();

    // HUD Badge Label background
    const labelText = 'TARGETING: SURFACE FOUND [98%]';
    ctx.font = '10px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(labelText).width;

    ctx.fillStyle = 'rgba(5, 5, 5, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.fillRect(cx - textWidth / 2 - 10, cy - 32, textWidth + 20, 20);
    ctx.strokeRect(cx - textWidth / 2 - 10, cy - 32, textWidth + 20, 20);

    ctx.fillStyle = '#e0e0e0';
    ctx.textAlign = 'center';
    ctx.fillText(labelText, cx, cy - 18);

    ctx.restore();
  };

  // Touch / Click Ripple feedback state
  const [tapRipple, setTapRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  // Pointer/Touch Dragging Event Handlers & Click-to-Detect White Card
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Visual ripple effect at tap position
    setTapRipple({ x: e.clientX, y: e.clientY, id: Date.now() });
    setTimeout(() => setTapRipple(null), 600);

    // If manual corner handles are enabled, check if user clicked a handle first
    if (settings.showCornerHandles) {
      const points: Array<{ key: keyof QuadCorners; p: Point2D }> = [
        { key: 'topLeft', p: corners.topLeft },
        { key: 'topRight', p: corners.topRight },
        { key: 'bottomRight', p: corners.bottomRight },
        { key: 'bottomLeft', p: corners.bottomLeft },
      ];

      for (const pt of points) {
        const dist = Math.hypot(clickX - pt.p.x, clickY - pt.p.y);
        if (dist < 32) {
          setActiveDragPoint(pt.key);
          dragStartRef.current = { x: clickX, y: clickY, initialCorners: { ...corners } };
          return;
        }
      }

      const cx = (corners.topLeft.x + corners.bottomRight.x) / 2;
      const cy = (corners.topLeft.y + corners.bottomRight.y) / 2;
      if (Math.hypot(clickX - cx, clickY - cy) < 120) {
        setActiveDragPoint('center');
        dragStartRef.current = { x: clickX, y: clickY, initialCorners: { ...corners } };
        return;
      }
    }

    // Direct click/tap on white card: detect card quadrilateral around click point
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      const detectedQuad = detectWhiteCardAtPoint(ctx, canvas.width, canvas.height, clickX, clickY);
      if (detectedQuad) {
        setCorners(detectedQuad);
        setToastMessage(`已对准贴合 "${selectedCard.name}"`);
        setTimeout(() => setToastMessage(''), 2000);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeDragPoint || !dragStartRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const deltaX = currentX - dragStartRef.current.x;
    const deltaY = currentY - dragStartRef.current.y;
    const initial = dragStartRef.current.initialCorners;

    if (activeDragPoint === 'center') {
      setCorners({
        topLeft: { x: initial.topLeft.x + deltaX, y: initial.topLeft.y + deltaY },
        topRight: { x: initial.topRight.x + deltaX, y: initial.topRight.y + deltaY },
        bottomRight: { x: initial.bottomRight.x + deltaX, y: initial.bottomRight.y + deltaY },
        bottomLeft: { x: initial.bottomLeft.x + deltaX, y: initial.bottomLeft.y + deltaY },
      });
    } else {
      setCorners({
        ...corners,
        [activeDragPoint]: {
          x: initial[activeDragPoint].x + deltaX,
          y: initial[activeDragPoint].y + deltaY,
        },
      });
    }
  };

  const handlePointerUp = () => {
    setActiveDragPoint(null);
    dragStartRef.current = null;
  };

  // Capture High-Res AR Photo
  const handleCapture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    setIsCapturing(true);
    setFlashActive(true);

    // Trigger flash animation
    setTimeout(() => setFlashActive(false), 250);

    // Create a high resolution original video snapshot canvas
    const origCanvas = document.createElement('canvas');
    origCanvas.width = canvas.width;
    origCanvas.height = canvas.height;
    const origCtx = origCanvas.getContext('2d');
    if (origCtx) {
      origCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const photo: CapturedPhoto = {
      id: `photo-${Date.now()}`,
      timestamp: Date.now(),
      originalDataUrl: origCanvas.toDataURL('image/jpeg', 0.95),
      compositeDataUrl: canvas.toDataURL('image/png'),
      cardName: selectedCard.name,
      corners: { ...corners },
      blendSettings: { ...settings },
    };

    onCapturePhoto(photo);

    // Toast feedback
    setToastMessage(`已拍照！成功打印 "${selectedCard.name}"`);
    setTimeout(() => setToastMessage(''), 3000);
    setIsCapturing(false);
  };

  // Toggle Fullscreen Mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Toggle Camera Torch / Flashlight if supported
  const toggleTorch = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      if (track && (track.getCapabilities() as any).torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !torchOn } as any],
          });
          setTorchOn(!torchOn);
        } catch (err) {
          console.error('Torch Toggle Error:', err);
        }
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Hidden Source Video Stream */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="hidden"
      />

      {/* Main Fullscreen Live Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full object-cover cursor-crosshair touch-none"
      />

      {/* Touch/Click Ripple Feedback */}
      {tapRipple && (
        <div
          key={tapRipple.id}
          style={{ left: tapRipple.x, top: tapRipple.y }}
          className="fixed z-30 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border-2 border-white/90 bg-white/30 animate-ping pointer-events-none"
        />
      )}

      {/* Camera Flash Animation Effect */}
      {flashActive && (
        <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200 pointer-events-none" />
      )}

      {/* Camera Permission Denied Warning State */}
      {cameraPermission === 'denied' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/90 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4">
            <Camera className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">需要摄像头权限</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">{errorMessage}</p>
          <button
            onClick={() => startCamera(selectedDeviceId)}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl transition-all"
          >
            重新请求摄像头权限
          </button>
        </div>
      )}

      {/* Top Floating Action Bar & Telemetry Header */}
      <div className="absolute top-0 inset-x-0 z-20 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10 px-4 md:px-6 py-2.5 flex items-center justify-between text-[#e0e0e0] font-mono-hud text-[11px] pointer-events-auto shadow-2xl">
        {/* Brand & AR Badge */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[0.2em] font-bold text-white/40 uppercase">AETHER / AR-V1</span>
          <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-serif-display italic text-base font-bold text-white tracking-wide">Lumina Imprinter</span>
        </div>

        {/* Center Telemetry Status */}
        <div className="hidden lg:flex items-center gap-6 text-[10px] tracking-widest text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            REC [ {recTime} ]
          </span>
          <span>FPS [ 60.0 ]</span>
          <span>ISO [ 400 ]</span>
          <span>EXP [ -0.3 ]</span>
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Select Suit & Card Button */}
          {onOpenSuitRankModal && (
            <button
              onClick={onOpenSuitRankModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white text-black font-mono-hud text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-lg active:scale-95"
              title="重新选择花色与卡牌"
            >
              <span className="text-sm">♠♥</span>
              <span>选牌</span>
            </button>
          )}

          {/* Switch Camera Dropdown */}
          {cameraDevices.length > 1 && (
            <button
              onClick={() => {
                const currentIndex = cameraDevices.findIndex((d) => d.deviceId === selectedDeviceId);
                const nextDevice = cameraDevices[(currentIndex + 1) % cameraDevices.length];
                setSelectedDeviceId(nextDevice.deviceId);
              }}
              className="p-2 rounded bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 transition-colors"
              title="切换摄像头"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Torch / Flashlight */}
          <button
            onClick={toggleTorch}
            className={`p-2 rounded border text-xs transition-colors ${
              torchOn ? 'bg-white text-black font-bold border-white' : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/15'
            }`}
            title="闪光灯/手电筒"
          >
            <Flashlight className="w-3.5 h-3.5" />
          </button>

          {/* AR Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 transition-colors"
            title="光影与相框设置"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 transition-colors"
            title="全屏显示"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Floating Capture Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-white text-black px-4 py-2 rounded-sm text-xs font-mono-hud font-bold shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-top-2 duration-200 uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          {toastMessage}
        </div>
      )}

      {/* Floating Shutter & Gallery Trigger Controls */}
      <div className="absolute bottom-32 inset-x-0 z-20 flex items-center justify-center gap-6 pointer-events-auto">
        {/* Gallery Trigger Button */}
        <button
          onClick={onOpenGallery}
          className="relative p-3 rounded-sm bg-[#0a0a0a]/90 backdrop-blur-md hover:bg-white/10 text-white/80 border border-white/20 shadow-2xl transition-all group"
          title="查看拍摄相册"
        >
          <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
          {savedPhotosCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-black font-mono-hud font-extrabold text-[9px] flex items-center justify-center shadow-md">
              {savedPhotosCount}
            </span>
          )}
        </button>

        {/* Shutter Take Photo Button */}
        <button
          onClick={handleCapture}
          disabled={isCapturing}
          className="relative px-6 py-3.5 bg-white text-black hover:bg-neutral-200 rounded-sm font-mono-hud text-xs font-bold tracking-[0.2em] uppercase shadow-2xl border border-white transition-all transform active:scale-95 flex items-center gap-2"
          title="印制与拍照"
        >
          <Camera className="w-4 h-4" />
          <span>IMPRINT PATTERN</span>
        </button>

        {/* Settings Shortcut */}
        <button
          onClick={onOpenSettings}
          className="p-3 rounded-sm bg-[#0a0a0a]/90 backdrop-blur-md hover:bg-white/10 text-white/80 border border-white/20 shadow-2xl transition-all group"
          title="调整设置"
        >
          <Sliders className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
};
