
import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Tool, Point, WorkspaceImage, ImageLayer } from '../types';
import { useWorkspaceInput } from '../hooks/useWorkspaceInput';
import { drawLayer } from './workspace/drawing';
import { getResizeHandles } from './workspace/geometry';
import FloatingActionBar from './workspace/FloatingActionBar';
import AspectRatioEditorUI from './workspace/AspectRatioEditorUI';

interface WorkspaceCanvasProps {
  images: WorkspaceImage[];
  selectedImageIds: number[];
  highlightedRefs: number[];
  initialTransform: { panX: number, panY: number, scale: number };
  onWorkspaceUpdate: (images: WorkspaceImage[], addToHistory?: boolean) => void;
  onSelectImages: (ids: number[]) => void;
  onEditRequest: (id: number) => void;
  onViewTransformChange?: (transform: { panX: number, panY: number, scale: number }) => void;
  onDownload: () => void;
  onDelete: () => void;
  onResizeAndGenerate: (imageId: number, dataUrl: string, finalRect: { width: number; height: number; originalWidth: number; originalHeight: number; }) => void;
  loadingMessage: string;
  t: (key: string) => string;
  onAspectRatioEditorChange: (isActive: boolean) => void;
  onEnhance: () => void;
  onRtxGenerate: () => void;
  onMix: () => void;
  onRefGenerate: () => void;
  onRegenerate: (imageId: number) => void;
  onReplicaGenerate: () => void;
  loadingAction: 'generate' | 'reasoning' | 'enhance' | 'rtx' | 'mix' | 'rep' | 'ref' | null;
  tool: Tool;
  areCornersRounded: boolean;
}

export interface WorkspaceCanvasRef {
  resetView: () => void;
  getAnnotatedImage: (imageId: number) => Promise<string | null>;
  getViewportCenter: () => Point;
  focusOnImage: (imageId: number) => void;
  enterAspectRatioMode: (id: number) => void;
  confirmAspectRatioEdit: () => void;
}

type OutpaintingState = { image: WorkspaceImage; originalState: WorkspaceImage; } | null;

const VISUAL_HANDLE_SIZE = 8;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 20;
const MAX_EDIT_DIMENSION = 1500;

const WorkspaceCanvas = forwardRef<WorkspaceCanvasRef, WorkspaceCanvasProps>(({
  images, selectedImageIds, highlightedRefs, initialTransform, onWorkspaceUpdate, onSelectImages, onEditRequest, onViewTransformChange, onDownload, onDelete, t, loadingMessage, onResizeAndGenerate, onAspectRatioEditorChange, onEnhance, onRtxGenerate, onMix, onRefGenerate, onRegenerate, onReplicaGenerate, loadingAction, tool, areCornersRounded
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageElementsRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const objectUrlsRef = useRef<Map<number, string>>(new Map());
  
  const [viewTransform, setViewTransform] = useState(initialTransform);
  const [layerImageCache, setLayerImageCache] = useState<Map<string, HTMLImageElement>>(new Map());

  const [outpaintingState, setOutpaintingState] = useState<OutpaintingState>(null);
  const [outpaintingBgColor, setOutpaintingBgColor] = useState<string>('#FF0000');
  const [isBgTransparent, setIsBgTransparent] = useState(false);
  const [outpaintingWidthInput, setOutpaintingWidthInput] = useState('');
  const [outpaintingHeightInput, setOutpaintingHeightInput] = useState('');

  const rafId = useRef(0);
  const needsRender = useRef(true);
  const requestRender = useCallback(() => { needsRender.current = true; }, []);

  const [animatedBorderRadius, setAnimatedBorderRadius] = useState(() => areCornersRounded ? 32 : 0);
  const animationFrameRef = useRef<number>(0);

  // Animate border radius
  useEffect(() => {
    const startRadius = animatedBorderRadius;
    const targetRadius = areCornersRounded ? 32 : 0;
    
    if (startRadius === targetRadius) return;

    const duration = 300; // ms
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // easeOutCubic for a smooth deceleration
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        const newRadius = startRadius + (targetRadius - startRadius) * easedProgress;

        setAnimatedBorderRadius(newRadius);
        requestRender(); // Redraw canvas on each animation frame

        if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            setAnimatedBorderRadius(targetRadius); // Snap to final value to ensure precision
        }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areCornersRounded, requestRender]);

    const autoZoomToFitFrame = useCallback((frame: WorkspaceImage, paddingPercent: number) => {
        if (!containerRef.current) return;
        const { clientWidth, clientHeight } = containerRef.current;
        const newScale = Math.min(clientWidth * paddingPercent / frame.width, clientHeight * paddingPercent / frame.height, MAX_ZOOM);
        const newPanX = (clientWidth / 2) - (frame.x + frame.width / 2) * newScale;
        const newPanY = (clientHeight / 2) - (frame.y + frame.height / 2) * newScale;
        setViewTransform({ scale: newScale, panX: newPanX, panY: newPanY });
        requestRender();
    }, [requestRender, setViewTransform]);

  const handleCancelOutpainting = useCallback(() => {
    if (!outpaintingState) return;
    onWorkspaceUpdate(images.map(img => img.id === outpaintingState.originalState.id ? outpaintingState.originalState : img), false); 
    setOutpaintingState(null);
  }, [images, onWorkspaceUpdate, outpaintingState]);

  const updateFrameAspectRatio = useCallback((wStr: string, hStr: string) => {
    const wRatio = parseInt(wStr, 10), hRatio = parseInt(hStr, 10);
    if (!outpaintingState || isNaN(wRatio) || wRatio <= 0 || isNaN(hRatio) || hRatio <= 0) return;
    const { originalState } = outpaintingState;
    const newAspectRatio = wRatio / hRatio;
    const originalAspectRatio = originalState.width / originalState.height;
    let newFrameWorldWidth = originalState.width, newFrameWorldHeight = originalState.height;

    if (newAspectRatio >= originalAspectRatio) newFrameWorldWidth = originalState.height * newAspectRatio;
    else newFrameWorldHeight = originalState.width / newAspectRatio;
    
    const originalCenterX = originalState.x + originalState.width / 2, originalCenterY = originalState.y + originalState.height / 2;
    const newX = originalCenterX - newFrameWorldWidth / 2, newY = originalCenterY - newFrameWorldHeight / 2;
    const originalPixelDensity = originalState.originalWidth / originalState.width;
    
    const newImageState = { ...outpaintingState.image, x: newX, y: newY, width: newFrameWorldWidth, height: newFrameWorldHeight, originalWidth: Math.round(newFrameWorldWidth * originalPixelDensity), originalHeight: Math.round(newFrameWorldHeight * originalPixelDensity) };
    setOutpaintingState({ image: newImageState, originalState });
    onWorkspaceUpdate(images.map(i => i.id === newImageState.id ? newImageState : i), false);
    autoZoomToFitFrame(newImageState, 0.5);
  }, [outpaintingState, images, onWorkspaceUpdate, autoZoomToFitFrame]);

  const {
    cursorStyle, marquee, handleWheel, handlePointerDown, handlePointerMove, handlePointerUp
  } = useWorkspaceInput({
      tool, images, selectedImageIds, onSelectImages, onWorkspaceUpdate, containerRef, canvasRef,
      viewTransform, setViewTransform, outpaintingState, setOutpaintingState, handleCancelOutpainting, requestRender,
      onAspectRatioUpdate: (w, h) => { setOutpaintingWidthInput(w); setOutpaintingHeightInput(h); }
  });

  const getViewportCenter = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    return {
        x: (canvas.clientWidth / 2 - viewTransform.panX) / viewTransform.scale,
        y: (canvas.clientHeight / 2 - viewTransform.panY) / viewTransform.scale,
    };
  }, [viewTransform]);

  useEffect(() => { onAspectRatioEditorChange?.(!!outpaintingState); }, [outpaintingState, onAspectRatioEditorChange]);
  useEffect(() => { onViewTransformChange?.(viewTransform); }, [viewTransform, onViewTransformChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver(() => requestRender());
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [requestRender]);

  useEffect(() => {
    const currentImageIds = new Set(images.map(i => i.id));
    images.forEach(imgData => {
      const existingImage = imageElementsRef.current.get(imgData.id);
      let needsToLoad = !existingImage;
      if (existingImage && typeof imgData.source === 'string' && existingImage.src !== imgData.source) {
        needsToLoad = true;
      } else if (existingImage && imgData.source instanceof File && !existingImage.src.startsWith('blob:')) {
        needsToLoad = true;
      }
      
      if (needsToLoad) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => { imageElementsRef.current.set(imgData.id, img); requestRender(); };
        if (imgData.source instanceof File) {
            const existingUrl = objectUrlsRef.current.get(imgData.id);
            if (existingUrl) window.URL.revokeObjectURL(existingUrl);
            const url = window.URL.createObjectURL(imgData.source);
            objectUrlsRef.current.set(imgData.id, url);
            img.src = url;
        } else {
            img.src = imgData.source;
        }
      }
    });

    const urlsToRevoke: string[] = [];
    for (const id of imageElementsRef.current.keys()) {
        if (!currentImageIds.has(id)) {
            imageElementsRef.current.delete(id);
            const url = objectUrlsRef.current.get(id);
            if (url) { urlsToRevoke.push(url); objectUrlsRef.current.delete(id); }
        }
    }
    urlsToRevoke.forEach(url => window.URL.revokeObjectURL(url));
    requestRender();
    return () => { for (const url of objectUrlsRef.current.values()) window.URL.revokeObjectURL(url); };
  }, [images, requestRender]);

  useEffect(() => {
    const uniqueUrls: string[] = Array.from(new Set(
        images.flatMap(img => img.layers || [])
              .filter((l): l is ImageLayer => l.type === 'image')
              .map(l => l.src)
              .filter(src => !layerImageCache.has(src) || !layerImageCache.get(src)?.complete)
    ));
    if (uniqueUrls.length > 0) {
      let loadedCount = 0;
      const newImages = new Map(layerImageCache);
      uniqueUrls.forEach(src => {
        const img = new Image();
        img.onload = () => {
          newImages.set(src, img);
          if (++loadedCount === uniqueUrls.length) { setLayerImageCache(newImages); requestRender(); }
        };
        img.src = src;
      });
    }
  }, [images, layerImageCache, requestRender]);

  const handleEnterOutpaintingMode = useCallback((imageId: number) => {
    const imageToOutpaint = images.find(img => img.id === imageId);
    if (!imageToOutpaint) return;
    
    const viewportCenter = getViewportCenter();
    const centeredState = { ...imageToOutpaint, x: viewportCenter.x - imageToOutpaint.width / 2, y: viewportCenter.y - imageToOutpaint.height / 2 };
    
    const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
    const commonDivisor = gcd(Math.round(centeredState.originalWidth), Math.round(centeredState.originalHeight));
    let aspectWidth = Math.round(centeredState.originalWidth / commonDivisor);
    let aspectHeight = Math.round(centeredState.originalHeight / commonDivisor);

    setOutpaintingState({ image: centeredState, originalState: centeredState });
    onWorkspaceUpdate(images.map(i => i.id === centeredState.id ? centeredState : i), false);
    setOutpaintingWidthInput(String(aspectWidth)); 
    setOutpaintingHeightInput(String(aspectHeight)); 
    onSelectImages([imageId]); 
    autoZoomToFitFrame(centeredState, 0.5);
  }, [images, getViewportCenter, onWorkspaceUpdate, onSelectImages, autoZoomToFitFrame]);

  const confirmAspectRatioEdit = useCallback(async () => {
    if (!outpaintingState) return;
    const { image: finalImageState, originalState } = outpaintingState;
    const imageEl = imageElementsRef.current.get(originalState.id);

    if (imageEl?.complete) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = Math.round(finalImageState.originalWidth);
        tempCanvas.height = Math.round(finalImageState.originalHeight);
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            const scaleX = tempCanvas.width / finalImageState.width;
            const scaleY = tempCanvas.height / finalImageState.height;
            ctx.drawImage(imageEl, (originalState.x - finalImageState.x) * scaleX, (originalState.y - finalImageState.y) * scaleY, originalState.width * scaleX, originalState.height * scaleY);
            onResizeAndGenerate(finalImageState.id, tempCanvas.toDataURL('image/png'), { ...finalImageState });
        }
    }
    setOutpaintingState(null);
  }, [outpaintingState, onResizeAndGenerate]);

  const handleCropAndSave = useCallback(async () => {
    if (!outpaintingState) return;
    const { image: frame, originalState: original } = outpaintingState;
    const imageEl = imageElementsRef.current.get(original.id);
    if (!imageEl?.complete) return;

    const newCanvas = document.createElement('canvas');
    newCanvas.width = Math.round(frame.originalWidth);
    newCanvas.height = Math.round(frame.originalHeight);
    const ctx = newCanvas.getContext('2d');
    if (!ctx) return;
    if (!isBgTransparent) { ctx.fillStyle = outpaintingBgColor; ctx.fillRect(0, 0, newCanvas.width, newCanvas.height); }
    
    const intersectX1 = Math.max(frame.x, original.x), intersectY1 = Math.max(frame.y, original.y);
    const intersectX2 = Math.min(frame.x + frame.width, original.x + original.width), intersectY2 = Math.min(frame.y + frame.height, original.y + original.height);
    const intersectWidth = intersectX2 - intersectX1, intersectHeight = intersectY2 - intersectY1;
    
    if (intersectWidth > 0 && intersectHeight > 0) {
        const sx = (intersectX1 - original.x) * (original.originalWidth / original.width);
        const sy = (intersectY1 - original.y) * (original.originalHeight / original.height);
        const dx = (intersectX1 - frame.x) * (frame.originalWidth / frame.width);
        const dy = (intersectY1 - frame.y) * (frame.originalHeight / frame.height);
        const sWidth = intersectWidth * (original.originalWidth / original.width);
        const sHeight = intersectHeight * (original.originalHeight / original.height);
        const dWidth = intersectWidth * (frame.originalWidth / frame.width);
        const dHeight = intersectHeight * (frame.originalHeight / frame.height);
        ctx.drawImage(imageEl, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    }
    const newImage: WorkspaceImage = { ...frame, source: newCanvas.toDataURL('image/png'), layers: [], annotationHistory: [{ layers: [] }], annotationHistoryIndex: 0, generationContext: undefined };
    onWorkspaceUpdate(images.map(img => img.id === newImage.id ? newImage : img), true);
    setOutpaintingState(null);
  }, [outpaintingState, images, onWorkspaceUpdate, isBgTransparent, outpaintingBgColor]);

  const handleAspectRatioInputChange = useCallback((part: 'width' | 'height', value: string) => {
    if (!/^\d{0,2}$/.test(value)) return;
    if (part === 'width') {
        setOutpaintingWidthInput(value);
    } else {
        setOutpaintingHeightInput(value);
    }
    updateFrameAspectRatio(part === 'width' ? value : outpaintingWidthInput, part === 'height' ? value : outpaintingHeightInput);
  }, [outpaintingWidthInput, outpaintingHeightInput, updateFrameAspectRatio]);
  
  const handleSwapAspectRatio = useCallback(() => {
    setOutpaintingWidthInput(outpaintingHeightInput);
    setOutpaintingHeightInput(outpaintingWidthInput);
    updateFrameAspectRatio(outpaintingHeightInput, outpaintingWidthInput);
  }, [outpaintingWidthInput, outpaintingHeightInput, updateFrameAspectRatio]);

  useImperativeHandle(ref, () => ({
    resetView: () => { setViewTransform({ scale: 1, panX: 0, panY: 0 }); requestRender(); },
    getAnnotatedImage: async (imageId: number) => {
        const imageToRender = images.find(img => img.id === imageId);
        const imageEl = imageElementsRef.current.get(imageId);
        if (!imageToRender || !imageEl?.complete) return null;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageToRender.originalWidth;
        tempCanvas.height = imageToRender.originalHeight;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(imageEl, 0, 0, tempCanvas.width, tempCanvas.height);
        if (imageToRender.layers?.length > 0) {
            const editorScale = Math.min(MAX_EDIT_DIMENSION / imageToRender.originalWidth, MAX_EDIT_DIMENSION / imageToRender.originalHeight, 1);
            const uniformScale = tempCanvas.width / (imageToRender.originalWidth * editorScale);
            ctx.save();
            ctx.scale(uniformScale, uniformScale);
            imageToRender.layers.forEach(layer => drawLayer(ctx, layer, layerImageCache));
            ctx.restore();
        }
        return tempCanvas.toDataURL('image/png');
    },
    getViewportCenter,
    focusOnImage: (imageId: number) => {
        const image = images.find(img => img.id === imageId);
        const container = containerRef.current;
        if (!image || !container) return;
        const { clientWidth, clientHeight } = container;
        const newScale = Math.min(clientWidth * 0.8 / image.width, clientHeight * 0.8 / image.height, MAX_ZOOM);
        setViewTransform({ scale: newScale, panX: (clientWidth / 2) - (image.x + image.width / 2) * newScale, panY: (clientHeight / 2) - (image.y + image.height / 2) * newScale });
        requestRender();
    },
    enterAspectRatioMode: handleEnterOutpaintingMode,
    confirmAspectRatioEdit,
  }));
  
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth, h = container.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(viewTransform.panX, viewTransform.panY);
    ctx.scale(viewTransform.scale, viewTransform.scale);
    
    const imagesToRender = outpaintingState ? [images.find(i => i.id === outpaintingState.image.id)].filter((i): i is WorkspaceImage => !!i) : images;

    imagesToRender.forEach((img) => {
      const imgEl = imageElementsRef.current.get(img.id);
      const isInOutpainting = outpaintingState?.image.id === img.id;
      
      const screenWidth = img.width * viewTransform.scale;
      const screenHeight = img.height * viewTransform.scale;
      const proportionalRadius = Math.min(screenWidth, screenHeight) * 0.05; // 5% of smaller dimension
      const screenRadius = Math.min(animatedBorderRadius, proportionalRadius);
      const imageBorderRadius = screenRadius / viewTransform.scale;

      if (isInOutpainting) {
          const { image: frame, originalState } = outpaintingState;
          if (!isBgTransparent) { ctx.fillStyle = outpaintingBgColor; ctx.beginPath(); ctx.roundRect(frame.x, frame.y, frame.width, frame.height, imageBorderRadius); ctx.fill(); }
          ctx.save(); ctx.beginPath(); ctx.roundRect(frame.x, frame.y, frame.width, frame.height, imageBorderRadius); ctx.clip();
          if (imgEl?.complete) ctx.drawImage(imgEl, originalState.x, originalState.y, originalState.width, originalState.height);
          ctx.restore();
      } else {
        ctx.save();
        if (img.isReasoning || img.isLoading) ctx.filter = 'blur(8px)';
        if (imgEl?.complete) {
          ctx.save(); ctx.beginPath(); ctx.roundRect(img.x, img.y, img.width, img.height, imageBorderRadius); ctx.clip();
          ctx.drawImage(imgEl, img.x, img.y, img.width, img.height);
          ctx.restore();
        }
        ctx.restore();
      }

      if (img.isLoading && !imgEl?.complete) {
        ctx.save(); ctx.beginPath(); ctx.roundRect(img.x, img.y, img.width, img.height, imageBorderRadius); ctx.clip();
        ctx.fillStyle = 'rgba(28, 28, 28, 0.7)'; ctx.fillRect(img.x, img.y, img.width, img.height);
        ctx.restore();
      }
      
      if (img.layers?.length > 0 && !isInOutpainting) {
          const editorScale = Math.min(MAX_EDIT_DIMENSION / img.originalWidth, MAX_EDIT_DIMENSION / img.originalHeight, 1);
          const renderScale = img.width / (img.originalWidth * editorScale);
          ctx.save(); ctx.beginPath(); ctx.roundRect(img.x, img.y, img.width, img.height, imageBorderRadius); ctx.clip();
          ctx.translate(img.x, img.y); ctx.scale(renderScale, renderScale);
          img.layers.forEach(layer => drawLayer(ctx, layer, layerImageCache));
          ctx.restore();
      }

      const globalIndex = images.findIndex(i => i.id === img.id);
      if (!img.isLoading && !isInOutpainting) {
        const isSelected = selectedImageIds.includes(img.id);
        const isHighlighted = highlightedRefs.includes(globalIndex + 1);
        if (isHighlighted || isSelected) {
            ctx.strokeStyle = '#d1fe17'; ctx.lineWidth = (isHighlighted ? 4 : 3) / viewTransform.scale;
            ctx.beginPath(); ctx.roundRect(img.x, img.y, img.width, img.height, imageBorderRadius); ctx.stroke();
        }

        const S = viewTransform.scale;
        
        // Non-linear scaling for tag elements to keep them legible at low zoom
        // world_size = A/S + B, which results in screen_size = A + B*S
        const fontSize = (28/3) / S + (20/3); // Screen size: ~9.3px to 16px (at S=1) -> min 10px at S=0.1
        const padding = 4 / S + 4;             // Screen size: 4px to 8px
        const offset = (16/3) / S + (20/3);    // Screen size: ~5.3px to 12px
        const tagBorderRadius = 4 / S + 4;     // Screen size: 4px to 8px

        const tag = `@${globalIndex + 1}`;
        
        ctx.font = `bold ${fontSize}px 'Space Grotesk'`;
        const textWidth = ctx.measureText(tag).width;
        const tagWidth = textWidth + padding * 2;
        const tagHeight = fontSize + padding * 1.5;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(img.x + offset, img.y + offset, tagWidth, tagHeight, tagBorderRadius);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(tag, img.x + offset + padding, img.y + offset + tagHeight / 2);
      }
    });
    
    const imageForHandles = outpaintingState?.image ?? (selectedImageIds.length === 1 ? images.find(img => img.id === selectedImageIds[0]) : null);
    if (imageForHandles && (selectedImageIds.includes(imageForHandles.id) || outpaintingState)) {
        const handles = getResizeHandles(imageForHandles);
        const handleSize = VISUAL_HANDLE_SIZE / viewTransform.scale;
        ctx.fillStyle = '#d1fe17';
        Object.values(handles.corners).forEach((p: Point) => ctx.fillRect(p.x - handleSize/2, p.y - handleSize/2, handleSize, handleSize));
        if (outpaintingState) Object.values(handles.sides).forEach((p: Point) => ctx.fillRect(p.x - handleSize/2, p.y - handleSize/2, handleSize, handleSize));
    }

    if (marquee) {
        ctx.strokeStyle = 'rgba(209, 254, 23, 0.8)'; ctx.fillStyle = 'rgba(209, 254, 23, 0.2)'; ctx.lineWidth = 1 / viewTransform.scale;
        ctx.fillRect(Math.min(marquee.start.x, marquee.end.x), Math.min(marquee.start.y, marquee.end.y), Math.abs(marquee.start.x - marquee.end.x), Math.abs(marquee.start.y - marquee.end.y));
        ctx.strokeRect(Math.min(marquee.start.x, marquee.end.x), Math.min(marquee.start.y, marquee.end.y), Math.abs(marquee.start.x - marquee.end.x), Math.abs(marquee.start.y - marquee.end.y));
    }
    ctx.restore();
  }, [viewTransform, images, selectedImageIds, highlightedRefs, marquee, layerImageCache, outpaintingState, outpaintingBgColor, isBgTransparent, animatedBorderRadius]);

  useEffect(() => {
    rafId.current = requestAnimationFrame(function tick() {
      if (needsRender.current) { renderCanvas(); needsRender.current = false; }
      rafId.current = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(rafId.current);
  }, [renderCanvas]);

  useEffect(() => { requestRender() }, [images, selectedImageIds, marquee, layerImageCache, outpaintingState, renderCanvas]);

  const singleSelectedImg = selectedImageIds.length === 1 && !outpaintingState ? images.find(img => img.id === selectedImageIds[0]) : null;

  return (
    <div 
        ref={containerRef} 
        className="absolute inset-0 w-full h-full"
        style={{ cursor: cursorStyle, touchAction: 'none' }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseDown={(e) => { if (e.button === 1) e.preventDefault() }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      {images.filter(img => img.isLoading).map(img => {
            const screenX = img.x * viewTransform.scale + viewTransform.panX, screenY = img.y * viewTransform.scale + viewTransform.panY;
            const screenW = img.width * viewTransform.scale, screenH = img.height * viewTransform.scale;
            if (!containerRef.current || screenX + screenW < 0 || screenX > containerRef.current.clientWidth || screenY + screenH < 0 || screenY > containerRef.current.clientHeight) return null;
            return (
                <div key={`loader-${img.id}`} className="absolute flex flex-col items-center justify-center pointer-events-none gap-4 text-white" style={{ left: screenX, top: screenY, width: screenW, height: screenH }}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                    {loadingMessage && <p className="text-lg font.semibold bg-black/50 p-2 rounded-lg shadow-lg">{loadingMessage}</p>}
                </div>
            );
        })}
      
      <FloatingActionBar 
        singleSelectedImg={singleSelectedImg} 
        isLoading={loadingAction !== null} 
        t={t} 
        onEditRequest={onEditRequest}
        onRegenerate={onRegenerate}
        onEnterAspectRatioMode={handleEnterOutpaintingMode}
        onRtxGenerate={onRtxGenerate}
        onEnhance={onEnhance}
        onMix={onMix}
        onRefGenerate={onRefGenerate}
        onReplicaGenerate={onReplicaGenerate}
        onDownload={onDownload}
        onDelete={onDelete}
        viewTransform={viewTransform}
      />
      
      {outpaintingState && (
        <AspectRatioEditorUI 
          outpaintingState={outpaintingState}
          viewTransform={viewTransform}
          handleCancelOutpainting={handleCancelOutpainting}
          handleCropAndSave={handleCropAndSave}
          confirmAspectRatioEdit={confirmAspectRatioEdit}
          outpaintingWidthInput={outpaintingWidthInput}
          outpaintingHeightInput={outpaintingHeightInput}
          handleAspectRatioInputChange={handleAspectRatioInputChange}
          handleAspectRatioKeyDown={(e) => {
              const input = e.currentTarget;
              const swapButton = input.parentElement?.querySelector('button');
              if (!swapButton) return;
              if (e.key === 'Backspace' && input.selectionStart === 0 && input === swapButton.nextElementSibling) {
                  e.preventDefault();
                  (swapButton.previousElementSibling as HTMLInputElement)?.focus();
              }
              if (e.key === 'Delete' && input.selectionStart === input.value.length && input === swapButton.previousElementSibling) {
                  e.preventDefault();
                  (swapButton.nextElementSibling as HTMLInputElement)?.focus();
              }
          }}
          handleSwapAspectRatio={handleSwapAspectRatio}
          isBgTransparent={isBgTransparent}
          setIsBgTransparent={setIsBgTransparent}
          outpaintingBgColor={outpaintingBgColor}
          setOutpaintingBgColor={setOutpaintingBgColor}
          t={t}
        />
      )}
    </div>
  );
});

export default WorkspaceCanvas;