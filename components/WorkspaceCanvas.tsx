
import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Tool, Point, WorkspaceImage, AnyLayer, ImageLayer, TextLayer, ArrowLayer, BrushLayer, LassoLayer } from '../types';
import Icon from './Icon';
import Tooltip from './Tooltip';

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
  onResizeAndGenerate: (
    imageId: number, 
    dataUrl: string, 
    finalRect: { width: number; height: number; originalWidth: number; originalHeight: number; }
  ) => void;
  loadingMessage: string;
  t: (key: string) => string;
  onAspectRatioEditorChange: (isActive: boolean) => void;
  onEnhance: () => void;
  onRtxGenerate: () => void;
  onMix: () => void;
  loadingAction: 'generate' | 'reasoning' | 'enhance' | 'rtx' | 'mix' | null;
}

export interface WorkspaceCanvasRef {
  resetView: () => void;
  getAnnotatedImage: (imageId: number) => Promise<string | null>;
  getViewportCenter: () => Point;
  focusOnImage: (imageId: number) => void;
  enterAspectRatioMode: (id: number) => void;
  confirmAspectRatioEdit: () => void;
}

type CanvasAction = 'drag' | 'resize' | 'pan' | 'marquee' | 'potential_drag' | 'panImageInFrame' | 'panFrame' | 'none';
type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r';

const HANDLE_SIZE = 20;
const VISUAL_HANDLE_SIZE = 8;
const ZOOM_SENSITIVITY = 0.001;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 20;
const DRAG_THRESHOLD = 5; // pixels
const MAX_EDIT_DIMENSION = 1500;
const ASPECT_RATIO_FRAME_MAX_VIEWPORT_PERCENT = 0.45; // Frame should not exceed 45% of viewport

const WorkspaceCanvas = forwardRef<WorkspaceCanvasRef, WorkspaceCanvasProps>(({
  images, selectedImageIds, highlightedRefs, initialTransform, onWorkspaceUpdate, onSelectImages, onEditRequest, onViewTransformChange, onDownload, onDelete, t, loadingMessage, onResizeAndGenerate, onAspectRatioEditorChange, onEnhance, onRtxGenerate, onMix, loadingAction
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageElementsRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const objectUrlsRef = useRef<Map<number, string>>(new Map());
  
  const [isSpacebarDown, setIsSpacebarDown] = useState(false);
  const [viewTransform, setViewTransform] = useState(initialTransform);
  const [cursorStyle, setCursorStyle] = useState('crosshair');

  const actionRef = useRef<CanvasAction>('none');
  const panStartRef = useRef<{x: number, y: number, panX: number, panY: number} | null>(null);
  const resizingImageRef = useRef<{ original: WorkspaceImage; handle: ResizeHandle; isSymmetrical: boolean } | null>(null);

  const [marquee, setMarquee] = useState<{ start: Point; end: Point } | null>(null); // in world coords
  const dragStartPosRef = useRef<Point | null>(null); // in world coords
  const dragStartRef = useRef<{ mousePos: Point; images: WorkspaceImage[] } | null>(null);
  
  const [layerImageCache, setLayerImageCache] = useState<Map<string, HTMLImageElement>>(new Map());

  const rafId = useRef(0);
  const needsRender = useRef(true);
  const requestRender = useCallback(() => { needsRender.current = true; }, []);

  const [outpaintingState, setOutpaintingState] = useState<{
    image: WorkspaceImage;
    originalState: WorkspaceImage;
  } | null>(null);
  const [outpaintingBgColor, setOutpaintingBgColor] = useState<string>('#0000FF');

  const [outpaintingWidthInput, setOutpaintingWidthInput] = useState('');
  const [outpaintingHeightInput, setOutpaintingHeightInput] = useState('');

    const getViewportCenter = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const { panX, panY, scale } = viewTransform;
        return {
            x: (canvas.clientWidth / 2 - panX) / scale,
            y: (canvas.clientHeight / 2 - panY) / scale,
        };
    }, [viewTransform]);

  const handleCancelOutpainting = useCallback(() => {
    if (!outpaintingState) return;
    const { originalState } = outpaintingState;
    const revertedImages = images.map(img =>
        img.id === originalState.id ? originalState : img
    );
    onWorkspaceUpdate(revertedImages, false); 
    setOutpaintingState(null);
  }, [images, onWorkspaceUpdate, outpaintingState]);

  useEffect(() => {
      onAspectRatioEditorChange?.(!!outpaintingState);
  }, [outpaintingState, onAspectRatioEditorChange]);


  useEffect(() => {
    onViewTransformChange?.(viewTransform);
  }, [viewTransform, onViewTransformChange]);

  useEffect(() => {
    const currentImageIds = new Set(images.map(i => i.id));
    images.forEach(imgData => {
      const existingImage = imageElementsRef.current.get(imgData.id);
      const isNewSource = typeof imgData.source === 'string' && imgData.source && existingImage?.src !== imgData.source;
      const needsToLoad = !existingImage || isNewSource;
      
      if (needsToLoad) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          imageElementsRef.current.set(imgData.id, img);
          requestRender();
        };
        if (typeof imgData.source === 'string') {
            img.src = imgData.source;
        } else if (imgData.source instanceof File) {
            const existingUrl = objectUrlsRef.current.get(imgData.id);
            if (existingUrl) window.URL.revokeObjectURL(existingUrl);
            const url = window.URL.createObjectURL(imgData.source);
            objectUrlsRef.current.set(imgData.id, url);
            img.src = url;
        }
      }
    });
    const urlsToRevoke: string[] = [];
    for (const id of imageElementsRef.current.keys()) {
        if (!currentImageIds.has(id)) {
            imageElementsRef.current.delete(id);
            const url = objectUrlsRef.current.get(id);
            if (url) {
                urlsToRevoke.push(url);
                objectUrlsRef.current.delete(id);
            }
        }
    }
    urlsToRevoke.forEach(url => window.URL.revokeObjectURL(url));
    requestRender();
    return () => {
        for (const url of objectUrlsRef.current.values()) {
            window.URL.revokeObjectURL(url);
        }
    };
  }, [images, requestRender]);

  useEffect(() => {
    const allLayers = images.flatMap(img => img.layers);
    const allImageUrls = allLayers
      .filter((l): l is ImageLayer => l.type === 'image')
      .map(l => l.src)
      .filter(src => !layerImageCache.has(src) || !layerImageCache.get(src)?.complete);
    const uniqueUrls = Array.from(new Set(allImageUrls));
    if (uniqueUrls.length > 0) {
      let loadedCount = 0;
      const newImages = new Map(layerImageCache);
      uniqueUrls.forEach(src => {
        const img = new Image();
        img.onload = () => {
          newImages.set(src, img);
          loadedCount++;
          if (loadedCount === uniqueUrls.length) {
            setLayerImageCache(newImages);
            requestRender();
          }
        };
        img.src = src;
      });
    }
  }, [images, layerImageCache, requestRender]);

  const autoZoomToFitFrame = useCallback((frame: WorkspaceImage) => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    
    const requiredScaleX = clientWidth * ASPECT_RATIO_FRAME_MAX_VIEWPORT_PERCENT / frame.width;
    const requiredScaleY = clientHeight * ASPECT_RATIO_FRAME_MAX_VIEWPORT_PERCENT / frame.height;
    const newScale = Math.min(requiredScaleX, requiredScaleY, MAX_ZOOM);

    const newPanX = (clientWidth / 2) - (frame.x + frame.width / 2) * newScale;
    const newPanY = (clientHeight / 2) - (frame.y + frame.height / 2) * newScale;
    
    setViewTransform({ scale: newScale, panX: newPanX, panY: newPanY });
    requestRender();
  }, [requestRender]);

  const handleEnterOutpaintingMode = useCallback((imageId: number) => {
    const imageToOutpaint = images.find(img => img.id === imageId);
    if (!imageToOutpaint) return;
    
    const imageState = { ...imageToOutpaint };
    const viewportCenter = getViewportCenter();
    const centeredX = viewportCenter.x - imageState.width / 2;
    const centeredY = viewportCenter.y - imageState.height / 2;
    const centeredImageFrame = { ...imageState, x: centeredX, y: centeredY };
    const centeredOriginalState = { ...imageState, x: centeredX, y: centeredY };
    
    const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
    const w = Math.round(centeredImageFrame.originalWidth);
    const h = Math.round(centeredImageFrame.originalHeight);
    const commonDivisor = gcd(w, h);
    
    let aspectWidth = w / commonDivisor;
    let aspectHeight = h / commonDivisor;

    // If the simplified ratio numbers are still large, round them further.
    if (aspectWidth > 99 || aspectHeight > 99) {
        const maxVal = Math.max(aspectWidth, aspectHeight);
        // Divisor to reduce to two significant digits, e.g., 10 for 3-digit numbers, 100 for 4-digit numbers.
        const divisor = Math.pow(10, Math.floor(Math.log10(maxVal)) - 1);
        if (divisor > 0) {
            aspectWidth = Math.round(aspectWidth / divisor);
            aspectHeight = Math.round(aspectHeight / divisor);
        }
    }

    setOutpaintingState({ image: centeredImageFrame, originalState: centeredOriginalState });
    onWorkspaceUpdate(images.map(i => i.id === centeredImageFrame.id ? centeredImageFrame : i), false);
    setOutpaintingWidthInput(String(aspectWidth)); setOutpaintingHeightInput(String(aspectHeight)); onSelectImages([imageId]); autoZoomToFitFrame(centeredImageFrame);
  }, [images, getViewportCenter, onWorkspaceUpdate, onSelectImages, autoZoomToFitFrame]);

  const confirmAspectRatioEdit = useCallback(async () => {
    if (!outpaintingState) return;
    const { image: finalImageState, originalState } = outpaintingState;

    const imageEl = imageElementsRef.current.get(originalState.id);
    if (imageEl && imageEl.complete) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = Math.round(finalImageState.originalWidth);
        tempCanvas.height = Math.round(finalImageState.originalHeight);
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = outpaintingBgColor;
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            const scaleX = tempCanvas.width / finalImageState.width;
            const scaleY = tempCanvas.height / finalImageState.height;
            const drawX = (originalState.x - finalImageState.x) * scaleX;
            const drawY = (originalState.y - finalImageState.y) * scaleY;
            const drawW = originalState.width * scaleX;
            const drawH = originalState.height * scaleY;
            ctx.drawImage(imageEl, drawX, drawY, drawW, drawH);
            const dataUrl = tempCanvas.toDataURL('image/png');
            
            onResizeAndGenerate(
                finalImageState.id,
                dataUrl,
                {
                    width: finalImageState.width, height: finalImageState.height,
                    originalWidth: Math.round(finalImageState.originalWidth), originalHeight: Math.round(finalImageState.originalHeight),
                }
            );
        }
    }
    setOutpaintingState(null);
  }, [outpaintingState, onResizeAndGenerate, outpaintingBgColor]);

  useImperativeHandle(ref, () => ({
    resetView: () => {
        setViewTransform({ scale: 1, panX: 0, panY: 0 });
        requestRender();
    },
    getAnnotatedImage: async (imageId: number) => {
        const imageToRender = images.find(img => img.id === imageId);
        const imageEl = imageElementsRef.current.get(imageId);
        if (!imageToRender || !imageEl || !imageEl.complete) return null;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageToRender.originalWidth;
        tempCanvas.height = imageToRender.originalHeight;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(imageEl, 0, 0, tempCanvas.width, tempCanvas.height);
        const hasEdits = imageToRender.layers && imageToRender.layers.length > 0;
        if (hasEdits) {
            const editorScale = Math.min(MAX_EDIT_DIMENSION / imageToRender.originalWidth, MAX_EDIT_DIMENSION / imageToRender.originalHeight, 1);
            const editorCanvasWidth = imageToRender.originalWidth * editorScale;
            await Promise.all(
                imageToRender.layers
                    .filter((l): l is ImageLayer => l.type === 'image')
                    .map((l: ImageLayer) => {
                        const cachedImg = layerImageCache.get(l.src);
                        if (cachedImg && cachedImg.complete) return Promise.resolve();
                        return new Promise<void>(resolve => {
                            const img = new Image();
                            img.onload = () => {
                                setLayerImageCache(prev => new Map(prev).set(l.src, img));
                                resolve();
                            };
                            img.src = l.src;
                        });
                    })
            );
            ctx.save();
            const uniformScale = tempCanvas.width / editorCanvasWidth;
            ctx.scale(uniformScale, uniformScale);
            imageToRender.layers.forEach(layer => drawLayer(ctx, layer, layerImageCache));
            ctx.restore();
        }
        return tempCanvas.toDataURL('image/png');
    },
    getViewportCenter: getViewportCenter,
    focusOnImage: (imageId: number) => {
        const image = images.find(img => img.id === imageId);
        const container = containerRef.current;
        if (!image || !container) return;

        const { clientWidth, clientHeight } = container;
        const PADDING_PERCENT = 0.8;

        const scaleX = clientWidth * PADDING_PERCENT / image.width;
        const scaleY = clientHeight * PADDING_PERCENT / image.height;
        const newScale = Math.min(scaleX, scaleY, MAX_ZOOM);

        const newPanX = (clientWidth / 2) - (image.x + image.width / 2) * newScale;
        const newPanY = (clientHeight / 2) - (image.y + image.height / 2) * newScale;
        setViewTransform({ scale: newScale, panX: newPanX, panY: newPanY }); requestRender();
    },
    enterAspectRatioMode: handleEnterOutpaintingMode,
    confirmAspectRatioEdit: confirmAspectRatioEdit,
  }));
  
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(viewTransform.panX, viewTransform.panY);
    ctx.scale(viewTransform.scale, viewTransform.scale);
    
    const BORDER_RADIUS = 32;
    const scaledRadius = BORDER_RADIUS / viewTransform.scale;
    
    const renderedImages = outpaintingState ? [images.find(i => i.id === outpaintingState.image.id)].filter(Boolean) as WorkspaceImage[] : images;

    renderedImages.forEach((img) => {
      const imgEl = imageElementsRef.current.get(img.id);
      
      const isInOutpainting = outpaintingState?.image.id === img.id;
      
      if (isInOutpainting) {
          const { image: frame, originalState } = outpaintingState;
          
          ctx.fillStyle = outpaintingBgColor;
          ctx.beginPath();
          ctx.roundRect(frame.x, frame.y, frame.width, frame.height, scaledRadius);
          ctx.fill();

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(frame.x, frame.y, frame.width, frame.height, scaledRadius);
          ctx.clip();
          
          if (imgEl && imgEl.complete) {
              ctx.drawImage(imgEl, originalState.x, originalState.y, originalState.width, originalState.height);
          }
          ctx.restore();

      } else { // Default rendering for non-outpainting images
        ctx.save();
        if (img.isReasoning) ctx.filter = 'blur(8px)';
        if (imgEl && imgEl.complete) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(img.x, img.y, img.width, img.height, scaledRadius);
          ctx.clip();
          ctx.drawImage(imgEl, img.x, img.y, img.width, img.height);
          ctx.restore();
        }
        ctx.restore();
      }

      if (img.isLoading && (!imgEl || !imgEl.complete)) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(img.x, img.y, img.width, img.height, scaledRadius);
        ctx.clip();
        ctx.fillStyle = 'rgba(28, 28, 28, 0.7)';
        ctx.fillRect(img.x, img.y, img.width, img.height);
        ctx.restore();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1 / viewTransform.scale;
        ctx.beginPath();
        ctx.roundRect(img.x, img.y, img.width, img.height, scaledRadius);
        ctx.stroke();
      }
      
      const hasEdits = img.layers && img.layers.length > 0;
      if (hasEdits && !isInOutpainting) {
          const editorScale = Math.min(MAX_EDIT_DIMENSION / img.originalWidth, MAX_EDIT_DIMENSION / img.originalHeight, 1);
          const editorCanvasWidth = img.originalWidth * editorScale;
          const renderScale = img.width / editorCanvasWidth;
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(img.x, img.y, img.width, img.height, scaledRadius);
          ctx.clip();
          ctx.translate(img.x, img.y);
          ctx.scale(renderScale, renderScale);
          img.layers.forEach(layer => drawLayer(ctx, layer, layerImageCache));
          ctx.restore();
      }

      const globalIndex = images.findIndex(i => i.id === img.id);
      if (!img.isLoading && !isInOutpainting) {
        const isSelected = selectedImageIds.includes(img.id);
        const isHighlighted = highlightedRefs.includes(globalIndex + 1);
        if (isHighlighted || isSelected) {
            ctx.strokeStyle = '#d1fe17';
            ctx.lineWidth = (isHighlighted ? 4 : 3) / viewTransform.scale;
            ctx.beginPath();
            ctx.roundRect(img.x, img.y, img.width, img.height, scaledRadius);
            ctx.stroke();
        }
        const tag = `@${globalIndex + 1}`;
        const fontSize = 20 / viewTransform.scale;
        const padding = 8 / viewTransform.scale;
        ctx.font = `bold ${fontSize}px 'Space Grotesk'`;
        const textMetrics = ctx.measureText(tag);
        const textWidth = textMetrics.width;
        const tagHeight = fontSize + padding * 1.5;
        const OFFSET = 16 / viewTransform.scale;
        const tagBoxX = img.x + OFFSET;
        const tagBoxY = img.y + OFFSET;
        const tagTextY = tagBoxY + tagHeight / 2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(tagBoxX, tagBoxY, textWidth + padding * 2, tagHeight, [8 / viewTransform.scale]);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(tag, tagBoxX + padding, tagTextY);
      }
    });
    
    const imageForHandles = outpaintingState?.image ?? (selectedImageIds.length === 1 ? images.find(img => img.id === selectedImageIds[0]) : null);

    if (imageForHandles) {
        const img = imageForHandles;
        const isSelected = selectedImageIds.includes(img.id);
        if (!img.isLoading && (isSelected || outpaintingState)) {
            ctx.strokeStyle = '#d1fe17';
            ctx.lineWidth = 3 / viewTransform.scale;
            ctx.beginPath();
            ctx.roundRect(img.x, img.y, img.width, img.height, scaledRadius);
            ctx.stroke();
            
            // Only draw handles for regular selected images, not for outpainting frame
            if (!outpaintingState && isSelected) {
                const handles = getResizeHandles(img);
                const handleSize = VISUAL_HANDLE_SIZE / viewTransform.scale;
                const halfHandle = handleSize / 2;
                ctx.fillStyle = '#d1fe17';
                Object.values(handles.corners).forEach(p => ctx.fillRect(p.x - halfHandle, p.y - halfHandle, handleSize, handleSize));
            }
        }
    }

    if (marquee) {
        ctx.strokeStyle = 'rgba(209, 254, 23, 0.8)';
        ctx.fillStyle = 'rgba(209, 254, 23, 0.2)';
        ctx.lineWidth = 1 / viewTransform.scale;
        const rectX = Math.min(marquee.start.x, marquee.end.x);
        const rectY = Math.min(marquee.start.y, marquee.end.y);
        const rectW = Math.abs(marquee.start.x - marquee.end.x);
        const rectH = Math.abs(marquee.start.y - marquee.end.y);
        ctx.fillRect(rectX, rectY, rectW, rectH);
        ctx.strokeRect(rectX, rectY, rectW, rectH);
    }
    
    ctx.restore();
  }, [viewTransform, images, selectedImageIds, highlightedRefs, marquee, layerImageCache, outpaintingState, outpaintingBgColor]);

  useEffect(() => {
    const tick = () => {
      if (needsRender.current) {
        renderCanvas();
        needsRender.current = false;
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [renderCanvas]);

  useEffect(() => { requestRender() }, [images, selectedImageIds, marquee, layerImageCache, renderCanvas, outpaintingState]);
  
  const getMousePos = (e: MouseEvent | React.MouseEvent | React.PointerEvent | WheelEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    return {
      x: (x - viewTransform.panX) / viewTransform.scale,
      y: (y - viewTransform.panY) / viewTransform.scale,
    };
  };

  const updateCursor = useCallback((pos?: Point) => {
    if (actionRef.current !== 'none') return;
    
    let newCursor = 'crosshair';

    if (outpaintingState && pos) {
        const { image: frame, originalState } = outpaintingState;
        newCursor = 'default';
        if (isOverRect(pos, originalState)) {
            newCursor = 'move';
        } else if (isOverRect(pos, frame)) {
            newCursor = 'grab';
        }
    } else if (isSpacebarDown) {
        newCursor = 'grab';
    } else if (pos) {
        const hoveredImage = getImageAtPosition(pos, [...images].reverse());
        if (selectedImageIds.length === 1) {
            const selectedImg = images.find(img => img.id === selectedImageIds[0]);
            if (selectedImg && !selectedImg.isLoading) {
                const handle = getResizeHandleAtPosition(pos, selectedImg, viewTransform.scale, false);
                if (handle) {
                    if (handle === 'tl' || handle === 'br') newCursor = 'nwse-resize';
                    else newCursor = 'nesw-resize';
                } else if (hoveredImage && selectedImageIds.includes(hoveredImage.id)) {
                    newCursor = 'move';
                }
            }
        }
        if (newCursor === 'crosshair' && hoveredImage && !hoveredImage.isLoading) {
            newCursor = 'pointer';
        }
    }
    setCursorStyle(prev => prev === newCursor ? prev : newCursor);
  }, [images, selectedImageIds, isSpacebarDown, viewTransform.scale, outpaintingState]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const pos = getMousePos(e);

    if (outpaintingState) {
        if (isOverRect(pos, outpaintingState.image)) {
            const { image: frame, originalState } = outpaintingState;
            
            const ds = 1 - e.deltaY * ZOOM_SENSITIVITY;
            const newWidth = originalState.width * ds;
            const newHeight = originalState.height * ds;
            
            const newX = pos.x - (pos.x - originalState.x) * ds;
            const newY = pos.y - (pos.y - originalState.y) * ds;
            
            const newOriginalState = { ...originalState, width: newWidth, height: newHeight, x: newX, y: newY };
            setOutpaintingState(prev => prev ? { ...prev, originalState: newOriginalState } : null);
            requestRender();
        }
        return;
    }
    
    const mousePosScreen = { x: e.clientX, y: e.clientY };
    const rect = canvas.getBoundingClientRect();
    const x = (mousePosScreen.x - rect.left);
    const y = (mousePosScreen.y - rect.top);
    const ds = 1 - e.deltaY * ZOOM_SENSITIVITY;
    const nextScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewTransform.scale * ds));
    const dx = x * (1-ds);
    const dy = y * (1-ds);
    setViewTransform({
        scale: nextScale,
        panX: viewTransform.panX * ds + dx,
        panY: viewTransform.panY * ds + dy,
    });
    requestRender();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-outpainting-ui]')) return;
    if ((e.target as HTMLElement).closest('[data-canvas-ui-interactive]')) return;
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const pos = getMousePos(e);
    dragStartPosRef.current = pos;
    
    if (outpaintingState) {
        const { image: frame, originalState } = outpaintingState;
        if (isOverRect(pos, originalState)) {
            actionRef.current = 'panImageInFrame';
            dragStartRef.current = { mousePos: pos, images: [{ ...originalState }] };
            return;
        }
        if (isOverRect(pos, frame)) {
            actionRef.current = 'panFrame';
            dragStartRef.current = { mousePos: pos, images: [{ ...frame }, { ...originalState }] };
            setCursorStyle('grabbing');
            return;
        }
        if (!isOverRect(pos, frame)) {
            handleCancelOutpainting();
        }
        return;
    }

    if (isSpacebarDown) {
        actionRef.current = 'pan';
        panStartRef.current = { x: e.clientX, y: e.clientY, panX: viewTransform.panX, panY: viewTransform.panY };
        setCursorStyle('grabbing');
        return;
    }

    const imageToInteract = images.find(img => selectedImageIds.length === 1 && img.id === selectedImageIds[0]);
    if (imageToInteract) {
        const handle = getResizeHandleAtPosition(pos, imageToInteract, viewTransform.scale, false);
        if (handle) {
            actionRef.current = 'resize';
            resizingImageRef.current = { original: { ...imageToInteract }, handle, isSymmetrical: e.altKey };
            updateCursor(pos);
            return;
        }
    }
    
    const clickedImage = getImageAtPosition(pos, [...images].reverse());
    if (clickedImage && !clickedImage.isLoading) {
        actionRef.current = 'potential_drag';
        setCursorStyle('move');
        const imagesToDrag = selectedImageIds.includes(clickedImage.id)
            ? images.filter(img => selectedImageIds.includes(img.id))
            : [clickedImage];
        dragStartRef.current = {
            mousePos: pos,
            images: imagesToDrag.map(img => ({...img}))
        };
    } else {
        actionRef.current = 'marquee';
        setMarquee({ start: pos, end: pos });
        setCursorStyle('crosshair');
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const pos = getMousePos(e);
    
    if (actionRef.current === 'none') {
        updateCursor(pos);
    } else if (actionRef.current === 'pan' && panStartRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        const startPan = panStartRef.current;
        setViewTransform(prev => ({ ...prev, panX: startPan.panX + dx, panY: startPan.panY + dy }));
    } else if (actionRef.current === 'potential_drag' || actionRef.current === 'drag') {
        if (actionRef.current === 'potential_drag' && dragStartPosRef.current) {
            const dist = Math.hypot(pos.x - dragStartPosRef.current.x, pos.y - dragStartPosRef.current.y);
            if (dist * viewTransform.scale > DRAG_THRESHOLD) {
                actionRef.current = 'drag';
                if (!outpaintingState) {
                    const clickedImageId = dragStartRef.current!.images[0].id;
                    if (!selectedImageIds.includes(clickedImageId)) {
                        onSelectImages([clickedImageId]);
                    }
                }
            }
        }
        if (actionRef.current === 'drag' && dragStartRef.current) {
            const dx = pos.x - dragStartRef.current.mousePos.x;
            const dy = pos.y - dragStartRef.current.mousePos.y;
            const originalPositions = new Map(dragStartRef.current.images.map(img => [img.id, {x: img.x, y: img.y}]));
            
            const moveLogic = (img: WorkspaceImage) => {
                const originalPos = originalPositions.get(img.id);
                return originalPos ? { ...img, x: originalPos.x + dx, y: originalPos.y + dy } : img;
            }
            onWorkspaceUpdate(images.map(moveLogic), false);
        }
    } else if (actionRef.current === 'panImageInFrame' && dragStartRef.current && outpaintingState) {
        const dx = pos.x - dragStartRef.current.mousePos.x;
        const dy = pos.y - dragStartRef.current.mousePos.y;
        const startPos = dragStartRef.current.images[0];
        const { image: frame, originalState } = outpaintingState;
        
        let newX = startPos.x + dx;
        let newY = startPos.y + dy;
        
        newX = Math.max(frame.x, Math.min(newX, frame.x + frame.width - originalState.width));
        newY = Math.max(frame.y, Math.min(newY, frame.y + frame.height - originalState.height));
        
        const newOriginalState = { ...originalState, x: newX, y: newY };
        setOutpaintingState(prev => prev ? { ...prev, originalState: newOriginalState } : null);
    } else if (actionRef.current === 'panFrame' && dragStartRef.current && outpaintingState) {
        const dx = pos.x - dragStartRef.current.mousePos.x;
        const dy = pos.y - dragStartRef.current.mousePos.y;
        const startFramePos = dragStartRef.current.images[0];
        const startOriginalPos = dragStartRef.current.images[1];
        
        const newFrameState = { ...outpaintingState.image, x: startFramePos.x + dx, y: startFramePos.y + dy };
        const newOriginalState = { ...outpaintingState.originalState, x: startOriginalPos.x + dx, y: startOriginalPos.y + dy };
        
        setOutpaintingState({ image: newFrameState, originalState: newOriginalState });
        onWorkspaceUpdate(
            images.map(i => i.id === newFrameState.id ? newFrameState : i),
            false
        );
    } else if (actionRef.current === 'resize' && resizingImageRef.current) {
        const isOutpaintingResize = !!outpaintingState;
        resizingImageRef.current.isSymmetrical = e.altKey || isOutpaintingResize;

        let { result } = calculateNewResizeAttributes(resizingImageRef.current.original, resizingImageRef.current.handle, pos, viewTransform.scale, resizingImageRef.current.isSymmetrical);
        
        if (isOutpaintingResize) {
            const container = containerRef.current;
            if (container) {
                const { clientWidth: viewportWidth, clientHeight: viewportHeight } = container;
                const maxWidthInWorld = (viewportWidth * ASPECT_RATIO_FRAME_MAX_VIEWPORT_PERCENT) / viewTransform.scale;
                const maxHeightInWorld = (viewportHeight * ASPECT_RATIO_FRAME_MAX_VIEWPORT_PERCENT) / viewTransform.scale;
    
                if (result.width > maxWidthInWorld || result.height > maxHeightInWorld) {
                    const ratio = Math.min(maxWidthInWorld / result.width, maxHeightInWorld / result.height);
                    
                    const newWidth = result.width * ratio;
                    const newHeight = result.height * ratio;
    
                    const original = resizingImageRef.current.original;
                    const handle = resizingImageRef.current.handle;
                    
                    result.width = newWidth;
                    result.height = newHeight;
    
                    if (resizingImageRef.current.isSymmetrical) {
                        const centerX = original.x + original.width / 2;
                        const centerY = original.y + original.height / 2;
                        result.x = centerX - newWidth / 2;
                        result.y = centerY - newHeight / 2;
                    } else { // Corner resize
                        const right = original.x + original.width;
                        const bottom = original.y + original.height;
                        const anchorX = handle.includes('l') ? right : original.x;
                        const anchorY = handle.includes('t') ? bottom : original.y;
    
                        result.x = handle.includes('l') ? anchorX - newWidth : anchorX;
                        result.y = handle.includes('t') ? anchorY - newHeight : anchorY;
                    }
                    const originalPixelDensity = original.originalWidth / original.width;
                    result.originalWidth = Math.round(newWidth * originalPixelDensity);
                    result.originalHeight = Math.round(newHeight * originalPixelDensity);
                }
            }
        }

        const update = (img: WorkspaceImage) => ({ ...img, ...result });

        if (isOutpaintingResize) {
            const newFrameState = update(outpaintingState.image);
            const original = outpaintingState.originalState;
            const newOriginalX = newFrameState.x + (newFrameState.width - original.width) / 2;
            const newOriginalY = newFrameState.y + (newFrameState.height - original.height) / 2;
            const newOriginalState = { ...original, x: newOriginalX, y: newOriginalY };

            const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
            const commonDivisor = gcd(Math.round(newFrameState.originalWidth), Math.round(newFrameState.originalHeight));
            const aspectWidth = Math.round(newFrameState.originalWidth / commonDivisor);
            const aspectHeight = Math.round(newFrameState.originalHeight / commonDivisor);

            setOutpaintingState({ image: newFrameState, originalState: newOriginalState });
            onWorkspaceUpdate(images.map(i => i.id === newFrameState.id ? newFrameState : i), false);
            setOutpaintingWidthInput(String(aspectWidth));
            setOutpaintingHeightInput(String(aspectHeight));
            autoZoomToFitFrame(newFrameState);
        } else {
            onWorkspaceUpdate(images.map(i => i.id === resizingImageRef.current!.original.id ? update(i) : i), false);
        }
    } else if (actionRef.current === 'marquee' && marquee) {
        setMarquee({ ...marquee, end: pos });
    }
    requestRender();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    if (actionRef.current === 'potential_drag' && dragStartRef.current) { // Click
        const clickedImageId = dragStartRef.current.images[0].id;
        if (e.shiftKey) {
            const newSelection = selectedImageIds.includes(clickedImageId)
                ? selectedImageIds.filter(id => id !== clickedImageId)
                : [...selectedImageIds, clickedImageId];
            onSelectImages(newSelection);
        } else {
            onSelectImages([clickedImageId]);
        }
    } else if (actionRef.current === 'drag' || actionRef.current === 'panImageInFrame' || actionRef.current === 'panFrame') {
        if (!outpaintingState) {
           onWorkspaceUpdate(images, true);
        }
    } else if (actionRef.current === 'resize' && resizingImageRef.current) {
        if (outpaintingState) {
            // Already in outpainting, just finish resize
        } else {
            // Side handles are disabled for normal images, so we no longer enter outpainting mode from here.
            // This logic now only applies to corner-handle resizes.
            onWorkspaceUpdate(images, true);
        }
    } else if (actionRef.current === 'marquee' && marquee) {
        const marqueeRect = {
            x: Math.min(marquee.start.x, marquee.end.x), y: Math.min(marquee.start.y, marquee.end.y),
            width: Math.abs(marquee.start.x - marquee.end.x), height: Math.abs(marquee.start.y - marquee.end.y),
        };
        if (marqueeRect.width * viewTransform.scale < DRAG_THRESHOLD && marqueeRect.height * viewTransform.scale < DRAG_THRESHOLD) {
            if (!e.shiftKey) onSelectImages([]);
        } else {
            const newlySelected = images.filter(img => {
                const imgRect = { x: img.x, y: img.y, width: img.width, height: img.height };
                return !(imgRect.x > marqueeRect.x + marqueeRect.width ||
                         imgRect.x + imgRect.width < marqueeRect.x ||
                         imgRect.y > marqueeRect.y + marqueeRect.height ||
                         imgRect.y + imgRect.height < marqueeRect.y);
            }).map(img => img.id);
            if (e.shiftKey) {
                const currentSelection = new Set(selectedImageIds);
                newlySelected.forEach(id => currentSelection.has(id) ? null : currentSelection.add(id));
                onSelectImages(Array.from(currentSelection));
            } else {
                onSelectImages(newlySelected);
            }
        }
        setMarquee(null);
    }
    
    actionRef.current = 'none';
    panStartRef.current = null;
    dragStartPosRef.current = null;
    dragStartRef.current = null;
    resizingImageRef.current = null;
    updateCursor(getMousePos(e));
    requestRender();
  };
  
  const updateFrameAspectRatio = useCallback((wStr: string, hStr: string) => {
    const wRatio = parseInt(wStr, 10);
    const hRatio = parseInt(hStr, 10);

    const container = containerRef.current;
    if (!container) return;
    const { clientWidth: viewportWidth, clientHeight: viewportHeight } = container;

    if (outpaintingState && !isNaN(wRatio) && wRatio > 0 && !isNaN(hRatio) && hRatio > 0) {
        const { originalState, image: currentFrame } = outpaintingState;
        
        const originalArea = originalState.width * originalState.height;
        const newAspectRatio = wRatio / hRatio;

        let newFrameWorldWidth = Math.sqrt(originalArea * newAspectRatio);
        let newFrameWorldHeight = newFrameWorldWidth / newAspectRatio;

        const maxWidthInWorld = (viewportWidth * ASPECT_RATIO_FRAME_MAX_VIEWPORT_PERCENT) / viewTransform.scale;
        const maxHeightInWorld = (viewportHeight * ASPECT_RATIO_FRAME_MAX_VIEWPORT_PERCENT) / viewTransform.scale;
        
        if (newFrameWorldWidth > maxWidthInWorld || newFrameWorldHeight > maxHeightInWorld) {
             const ratio = Math.min(maxWidthInWorld / newFrameWorldWidth, maxHeightInWorld / newFrameWorldHeight);
             newFrameWorldWidth *= ratio;
             newFrameWorldHeight *= ratio;
        }

        const centerX = currentFrame.x + currentFrame.width / 2;
        const centerY = currentFrame.y + currentFrame.height / 2;
        
        const newX = centerX - newFrameWorldWidth / 2;
        const newY = centerY - newFrameWorldHeight / 2;
        
        const originalPixelDensity = originalState.originalWidth / originalState.width;
        
        const newImageState = { 
            ...currentFrame, 
            x: newX, y: newY, 
            width: newFrameWorldWidth, 
            height: newFrameWorldHeight, 
            originalWidth: Math.round(newFrameWorldWidth * originalPixelDensity),
            originalHeight: Math.round(newFrameWorldHeight * originalPixelDensity),
        };
        
        const newOriginalX = newX + (newFrameWorldWidth - originalState.width) / 2;
        const newOriginalY = newY + (newFrameWorldHeight - originalState.height) / 2;
        const newOriginalState = { ...originalState, x: newOriginalX, y: newOriginalY };

        setOutpaintingState({ image: newImageState, originalState: newOriginalState });
        onWorkspaceUpdate(
            images.map(i => i.id === newImageState.id ? newImageState : i),
            false
        );
        autoZoomToFitFrame(newImageState);
    }
  }, [outpaintingState, images, onWorkspaceUpdate, viewTransform.scale, autoZoomToFitFrame]);

  const handleAspectRatioInputChange = useCallback((part: 'width' | 'height', value: string) => {
    if (!/^\d{0,2}$/.test(value)) return;
    
    if (part === 'width') {
        setOutpaintingWidthInput(value);
        updateFrameAspectRatio(value, outpaintingHeightInput);
    } else {
        setOutpaintingHeightInput(value);
        updateFrameAspectRatio(outpaintingWidthInput, value);
    }
  }, [outpaintingWidthInput, outpaintingHeightInput, updateFrameAspectRatio]);
  
  const handleSwapAspectRatio = useCallback(() => {
    const currentW = outpaintingWidthInput;
    const currentH = outpaintingHeightInput;
    setOutpaintingWidthInput(currentH);
    setOutpaintingHeightInput(currentW);
    updateFrameAspectRatio(currentH, currentW);
  }, [outpaintingWidthInput, outpaintingHeightInput, updateFrameAspectRatio]);


  const handleAspectRatioKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const swapButton = input.parentElement?.querySelector('button');
      if (!swapButton) return;

      // When in the RIGHT input, and pressing Backspace at the start
      if (e.key === 'Backspace' && input.selectionStart === 0 && input.selectionEnd === 0 && input === swapButton.nextElementSibling) {
          e.preventDefault();
          (swapButton.previousElementSibling as HTMLInputElement)?.focus();
      }
      // When in the LEFT input, and pressing Delete at the end
      if (e.key === 'Delete' && input.selectionStart === input.value.length && input.selectionEnd === input.value.length && input === swapButton.previousElementSibling) {
          e.preventDefault();
          (swapButton.nextElementSibling as HTMLInputElement)?.focus();
      }
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
        if (e.code === 'Space' && !outpaintingState) {
            setIsSpacebarDown(true);
        }
        if (e.code === 'Escape' && outpaintingState) {
            handleCancelOutpainting();
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            setIsSpacebarDown(false);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [outpaintingState, handleCancelOutpainting]);
  
  useEffect(() => { updateCursor(); }, [isSpacebarDown, updateCursor]);

  const singleSelectedImg = selectedImageIds.length === 1 && !outpaintingState ? images.find(img => img.id === selectedImageIds[0]) : null;
  const isLoading = loadingAction !== null;

  return (
    <div 
        ref={containerRef} 
        className="absolute inset-0 w-full h-full"
        style={{ cursor: cursorStyle, touchAction: 'none' }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      {images.filter(img => img.isLoading).map(img => {
            const screenX = img.x * viewTransform.scale + viewTransform.panX;
            const screenY = img.y * viewTransform.scale + viewTransform.panY;
            const screenW = img.width * viewTransform.scale;
            const screenH = img.height * viewTransform.scale;
            if (!containerRef.current || screenX + screenW < 0 || screenX > containerRef.current.clientWidth || screenY + screenH < 0 || screenY > containerRef.current.clientHeight) return null;
            return (
                <div key={`loader-${img.id}`}
                     className="absolute flex flex-col items-center justify-center pointer-events-none gap-4 text-white"
                     style={{ left: screenX, top: screenY, width: screenW, height: screenH }}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                    {loadingMessage && (
                        <p className="text-lg font-semibold bg-black/50 p-2 rounded-lg shadow-lg">
                            {loadingMessage}
                        </p>
                    )}
                </div>
            );
        })}
      {singleSelectedImg && (
          <div className="absolute z-10 flex flex-col items-center justify-center gap-4 pointer-events-none"
              style={{
                  left: singleSelectedImg.x * viewTransform.scale + viewTransform.panX,
                  top: singleSelectedImg.y * viewTransform.scale + viewTransform.panY,
                  width: singleSelectedImg.width * viewTransform.scale,
                  height: 0
              }}>
              <div data-canvas-ui-interactive="true" className="flex items-center gap-2 bg-[#1c1c1c] p-2 rounded-full shadow-lg pointer-events-auto" style={{transform: 'translateY(-50px)'}}>
                  <Tooltip text={`${t('toolbar.edit_image')} (Shift+E)`} position="top">
                      <button onClick={() => onEditRequest(singleSelectedImg.id)} disabled={isLoading} className="w-10 h-10 bg-[#d1fe17] text-black rounded-full flex items-center justify-center hover:bg-lime-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          <Icon name="edit" className="w-5 h-5" />
                      </button>
                  </Tooltip>
                  <Tooltip text={`${t('workspace.aspect_ratio_edit')} (Shift+A)`} position="top">
                      <button onClick={() => handleEnterOutpaintingMode(singleSelectedImg.id)} disabled={isLoading} className="w-10 h-10 bg-[#2a2a2a] text-white rounded-full flex items-center justify-center hover:bg-[#383838] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          <Icon name="arrows-pointing-out" className="w-5 h-5" />
                      </button>
                  </Tooltip>
                  <Tooltip text={t('toolbar.rtx')} position="top">
                      <button onClick={onRtxGenerate} disabled={isLoading} className="w-10 h-10 bg-[#2a2a2a] text-white rounded-full flex items-center justify-center hover:bg-[#383838] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm">
                          RTX
                      </button>
                  </Tooltip>
                  <Tooltip text={`${t('toolbar.left.enhance')} (E)`} position="top">
                      <button onClick={onEnhance} disabled={isLoading} className="w-10 h-10 bg-[#2a2a2a] text-white rounded-full flex items-center justify-center hover:bg-[#383838] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          <Icon name="diamond" className="w-5 h-5" />
                      </button>
                  </Tooltip>
                  <Tooltip text={t('toolbar.mix')} position="top">
                        <button onClick={onMix} disabled={isLoading} className="w-10 h-10 bg-[#2a2a2a] text-white rounded-full flex items-center justify-center hover:bg-[#383838] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm">
                            MIX
                        </button>
                  </Tooltip>
                  <Tooltip text={`${t('generate_bar.download')} (Shift+S)`} position="top">
                      <button onClick={onDownload} disabled={isLoading} className="w-10 h-10 bg-[#2a2a2a] text-white rounded-full flex items-center justify-center hover:bg-[#383838] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          <Icon name="download" className="w-5 h-5" />
                      </button>
                  </Tooltip>
                  <Tooltip text={`${t('toolbar.right.delete_image')} (Del)`} position="top">
                      <button onClick={onDelete} disabled={isLoading} className="w-10 h-10 bg-[#2a2a2a] text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          <Icon name="trash" className="w-5 h-5" />
                      </button>
                  </Tooltip>
              </div>
          </div>
      )}
      {outpaintingState && (() => {
        const { image } = outpaintingState;
        const screenRect = {
            x: image.x * viewTransform.scale + viewTransform.panX,
            y: image.y * viewTransform.scale + viewTransform.panY,
            width: image.width * viewTransform.scale,
            height: image.height * viewTransform.scale,
        };
        const centerX = screenRect.x + screenRect.width / 2;
        const GAP = 16;
        const BUTTON_DIAMETER = 48;

        return (
            <div data-outpainting-ui className="absolute inset-0 pointer-events-none z-20">
                {/* Control Bar */}
                <div className="absolute flex gap-2 items-center pointer-events-auto" style={{ top: Math.max(16, screenRect.y - GAP - BUTTON_DIAMETER), left: centerX, transform: 'translateX(-50%)' }}>
                    <button onClick={handleCancelOutpainting} className="w-12 h-12 flex items-center justify-center bg-[#2a2a2a] text-gray-200 rounded-full hover:bg-red-500 transition-colors" title="Cancel (Esc)"> <Icon name="x" className="w-7 h-7" /> </button>
                     <div className="flex items-center gap-0 bg-[#2a2a2a] h-12 rounded-xl text-center font-bold text-lg p-1">
                        <input 
                            type="text"
                            maxLength={2}
                            value={outpaintingWidthInput}
                            onChange={(e) => handleAspectRatioInputChange('width', e.target.value)}
                            onKeyDown={handleAspectRatioKeyDown}
                            className="w-16 h-full bg-transparent text-white text-center focus:outline-none appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button onClick={handleSwapAspectRatio} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-white/10 rounded-md transition-colors" title="Swap ratio">
                            <Icon name="swap-horizontal" className="w-6 h-6" />
                        </button>
                         <input 
                            type="text"
                            maxLength={2}
                            value={outpaintingHeightInput}
                            onChange={(e) => handleAspectRatioInputChange('height', e.target.value)}
                            onKeyDown={handleAspectRatioKeyDown}
                             className="w-16 h-full bg-transparent text-white text-center focus:outline-none appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                     </div>
                     <div className="relative w-12 h-12 flex items-center justify-center bg-[#2a2a2a] rounded-full hover:bg-[#383838] transition-colors" title={t('workspace.change_bg_color')}>
                        <input
                            type="color"
                            value={outpaintingBgColor}
                            onChange={(e) => setOutpaintingBgColor(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="w-7 h-7 rounded-full border-2 border-white/50 pointer-events-none" style={{ backgroundColor: outpaintingBgColor }} />
                    </div>
                </div>
            </div>
        );
      })()}
    </div>
  );
});

// --- Drawing Helper Functions ---
const drawLayer = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, layer: AnyLayer, imageCache: Map<string, HTMLImageElement>) => {
    ctx.save();
    if (layer.type === 'image') {
        const imgEl = imageCache.get(layer.src);
        if (imgEl && imgEl.complete) (ctx as CanvasRenderingContext2D).drawImage(imgEl, layer.x, layer.y, layer.width, layer.height);
    } else if (layer.type === 'text') {
        const textLayer = layer as TextLayer;
        ctx.font = `${textLayer.fontSize}px ${textLayer.fontFamily}`; ctx.textAlign = textLayer.align; ctx.textBaseline = 'top';
        const lines = textLayer.text.split('\n'); const lineHeight = textLayer.fontSize * 1.2;
        const getXPos = (line: string) => {
            let xPos = textLayer.x;
            if (textLayer.align === 'center') xPos = textLayer.x + textLayer.width / 2;
            else if (textLayer.align === 'right') xPos = textLayer.x + textLayer.width;
            return xPos;
        };
        ctx.strokeStyle = 'black'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
        lines.forEach((line, i) => ctx.strokeText(line, getXPos(line), textLayer.y + i * lineHeight));
        ctx.fillStyle = textLayer.color;
        lines.forEach((line, i) => ctx.fillText(line, getXPos(line), textLayer.y + i * lineHeight));
    } else {
        // Annotation Layers
        ctx.translate(layer.x, layer.y);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (layer.type === Tool.Brush) {
            const brushLayer = layer as BrushLayer;
            ctx.strokeStyle = brushLayer.color;
            ctx.lineWidth = brushLayer.size;
            ctx.beginPath();
            if (brushLayer.points.length > 0) {
                ctx.moveTo(brushLayer.points[0].x, brushLayer.points[0].y);
                for (let i = 1; i < brushLayer.points.length; i++) {
                    ctx.lineTo(brushLayer.points[i].x, brushLayer.points[i].y);
                }
            }
            ctx.stroke();
        } else if (layer.type === Tool.Lasso) {
            const lassoLayer = layer as LassoLayer;
            ctx.lineWidth = 2;
            ctx.strokeStyle = lassoLayer.color;
            const colorWithAlpha = lassoLayer.color.startsWith('#') ? `${lassoLayer.color}80` : lassoLayer.color;
            ctx.fillStyle = colorWithAlpha;
            ctx.beginPath();
            if (lassoLayer.points.length > 0) {
                ctx.moveTo(lassoLayer.points[0].x, lassoLayer.points[0].y);
                for (let i = 1; i < lassoLayer.points.length; i++) {
                    ctx.lineTo(lassoLayer.points[i].x, lassoLayer.points[i].y);
                }
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (layer.type === Tool.Arrow) {
            const arrowLayer = layer as ArrowLayer;
            const { start, end } = arrowLayer;
            const headlen = Math.max(arrowLayer.size * 1.5, 10);
            const angle = Math.atan2(end.y - start.y, end.x - start.x);

            const draw = () => {
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 7), end.y - headlen * Math.sin(angle - Math.PI / 7));
                ctx.moveTo(end.x, end.y);
                ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 7), end.y - headlen * Math.sin(angle + Math.PI / 7));
                ctx.stroke();
            };
            ctx.strokeStyle = '#000000'; ctx.lineWidth = arrowLayer.size + 4; draw();
            ctx.strokeStyle = arrowLayer.color; ctx.lineWidth = arrowLayer.size; draw();
        }
    }
    ctx.restore();
};

const isOverRect = (pos: Point, rect: { x: number; y: number; width: number; height: number; }) => {
    return pos.x >= rect.x && pos.x <= rect.x + rect.width && pos.y >= rect.y && pos.y <= rect.y + rect.height;
}

const getImageAtPosition = (pos: Point, images: WorkspaceImage[]): WorkspaceImage | null => {
  for (const img of images) {
    if (isOverRect(pos, img)) return img;
  }
  return null;
};

const getResizeHandles = (image: WorkspaceImage): { corners: Record<string, Point>; sides: Record<string, Point> } => ({
  corners: {
      tl: { x: image.x, y: image.y }, tr: { x: image.x + image.width, y: image.y },
      bl: { x: image.x, y: image.y + image.height }, br: { x: image.x + image.width, y: image.y + image.height }
  },
  sides: {
      t: { x: image.x + image.width / 2, y: image.y }, b: { x: image.x + image.width / 2, y: image.y + image.height },
      l: { x: image.x, y: image.y + image.height / 2 }, r: { x: image.x + image.width, y: image.y + image.height / 2 }
  }
});

const getResizeHandleAtPosition = (pos: Point, image: WorkspaceImage, scale: number, allowSideHandles: boolean): ResizeHandle | null => {
  const handles = getResizeHandles(image); const margin = HANDLE_SIZE / scale;
  for (const [key, p] of Object.entries(handles.corners) as [string, Point][]) {
    if (Math.hypot(pos.x - p.x, pos.y - p.y) < margin) return key as ResizeHandle;
  }
  if (allowSideHandles) {
      for (const [key, p] of Object.entries(handles.sides) as [string, Point][]) {
        if (Math.hypot(pos.x - p.x, pos.y - p.y) < margin) return key as ResizeHandle;
      }
  }
  return null;
};

const calculateNewResizeAttributes = (
  original: WorkspaceImage, handle: ResizeHandle, pos: Point, scale: number, isSymmetrical: boolean
): { result: { x: number; y: number; width: number; height: number; originalWidth: number; originalHeight: number; } } => {
    const originalAspectRatio = original.originalWidth / original.originalHeight;
    const right = original.x + original.width;
    const bottom = original.y + original.height;
    const minDim = 20 / scale;
    let newRect = { x: original.x, y: original.y, width: original.width, height: original.height };

    if (isSymmetrical) { // ALT is pressed. Resize from center, maintain aspect ratio.
        const Cx = original.x + original.width / 2;
        const Cy = original.y + original.height / 2;
        let newWidth, newHeight;
        
        const tempWidth = Math.max(2 * Math.abs(pos.x - Cx), minDim);
        const tempHeight = Math.max(2 * Math.abs(pos.y - Cy), minDim);
        if (tempWidth / tempHeight > originalAspectRatio) {
            newWidth = tempHeight * originalAspectRatio;
            newHeight = tempHeight;
        } else {
            newWidth = tempWidth;
            newHeight = tempWidth / originalAspectRatio;
        }
        
        newRect.x = Cx - newWidth / 2;
        newRect.y = Cy - newHeight / 2;
        newRect.width = newWidth;
        newRect.height = newHeight;
    } else { // Asymmetrical resize from corner, MAINTAINING aspect ratio.
        if (['tl', 'tr', 'bl', 'br'].includes(handle)) {
            const anchorX = handle.includes('l') ? right : original.x;
            const anchorY = handle.includes('t') ? bottom : original.y;
            
            const tempWidth = Math.abs(pos.x - anchorX);
            const tempHeight = Math.abs(pos.y - anchorY);
            
            let newWidth, newHeight;
            if (tempWidth / tempHeight > originalAspectRatio) {
                newHeight = tempWidth / originalAspectRatio;
                newWidth = tempWidth;
            } else {
                newWidth = tempHeight * originalAspectRatio;
                newHeight = tempHeight;
            }
            
            newRect.width = Math.max(newWidth, minDim);
            newRect.height = Math.max(newHeight, minDim);
            
            if (handle.includes('l')) {
                newRect.x = anchorX - newRect.width;
            }
            if (handle.includes('t')) {
                newRect.y = anchorY - newRect.height;
            }
        }
    }
    
    // Preserve pixel density to calculate new originalWidth/Height
    const originalPixelDensity = original.originalWidth / original.width;
    const newOriginalWidth = Math.round(newRect.width * originalPixelDensity);
    const newOriginalHeight = Math.round(newRect.height * originalPixelDensity);

    return { result: { ...newRect, originalWidth: newOriginalWidth, originalHeight: newOriginalHeight } };
};

export default WorkspaceCanvas;
