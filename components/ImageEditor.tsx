import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle, useLayoutEffect } from 'react';
import { Tool, Point, WorkspaceImage, AnnotationState, TextLayer, AnyLayer, ImageLayer, BrushLayer, LassoLayer, ArrowLayer } from '../types';
import Icon from './Icon';

// --- Constants ---
const MAX_EDIT_DIMENSION = 1500;
const ZOOM_SENSITIVITY = 0.001;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 20;
const HANDLE_SIZE = 20;
const VISUAL_HANDLE_SIZE = 8;

// --- Types ---
interface TextEditorState {
    value: string;
    color: string;
    align: 'left' | 'center' | 'right';
}

interface ImageEditorProps {
  image: WorkspaceImage;
  onSaveAndExit: (image: WorkspaceImage) => void;
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  brushColor: string;
  brushSize: number;
  onTextEditEnd: () => void;
  t: (key: string) => string;
  onHistoryUpdate: () => void;
  areCornersRounded: boolean;
}

export interface ImageEditorRef {
  resetView: () => void;
  undo: () => void;
  redo: () => void;
  clearAnnotations: () => void;
  addLayer: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveAndExit: () => void;
  deleteActiveLayer: () => void;
}

type EditorAction = 'draw' | 'pan' | 'moveLayer' | 'resizeLayer' | 'none';
type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br';

// --- Draft types for drawing actions ---
type DraftAnnotation = 
    | { type: Tool.Brush | Tool.Lasso; id: number; color: string; size: number; points: Point[] }
    | { type: Tool.Arrow; id: number; color: string; size: number; start: Point; end: Point };


const ImageEditor = forwardRef<ImageEditorRef, ImageEditorProps>(({
  image, onSaveAndExit, tool, onToolChange, brushColor, brushSize, onTextEditEnd, t, onHistoryUpdate, areCornersRounded
}, ref) => {
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fullCanvasRef = useRef<HTMLCanvasElement | OffscreenCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const addLayerInputRef = useRef<HTMLInputElement>(null);
  const cursorPreviewRef = useRef<HTMLDivElement>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const rafId = useRef(0);

  const [viewTransform, setViewTransform] = useState({ scale: 1, panX: 0, panY: 0 });
  const [isSpacebarDown, setIsSpacebarDown] = useState(false);
  const [cursorStyle, setCursorStyle] = useState('crosshair');
  const [textInput, setTextInput] = useState<TextEditorState | null>(null);

  const [history, setHistory] = useState<AnnotationState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [localLayers, setLocalLayers] = useState<AnyLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<number | null>(null);
  const [layerImageCache, setLayerImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
  
  const actionRef = useRef<EditorAction>('none');
  const panStartRef = useRef<{x: number, y: number, panX: number, panY: number} | null>(null);
  const draftAnnotationRef = useRef<DraftAnnotation | null>(null);
  const actionStartRef = useRef<{ pos: Point, layer?: AnyLayer, handle?: ResizeHandle, originalLayers: AnyLayer[] } | null>(null);
 
  const needsRender = useRef(true);
  const requestRender = useCallback(() => { needsRender.current = true; }, []);

  const isPinchingRef = useRef(false);
  const lastPinchStateRef = useRef({ distance: 0, scale: 1, panX: 0, panY: 0, midpoint: { x: 0, y: 0 } });

    useEffect(() => {
        onHistoryUpdate();
    }, [historyIndex, onHistoryUpdate]);

    // This effect ensures the canvas redraws when its container size changes.
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            requestRender();
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, [requestRender]);

  const fitAndCenter = useCallback(() => {
    const container = containerRef.current;
    const fullCanvas = fullCanvasRef.current;
    if (!container || !fullCanvas) return;

    const { width: canvasWidth, height: canvasHeight } = fullCanvas;
    const { clientWidth: containerWidth, clientHeight: containerHeight } = container;
    
    const scaleX = containerWidth / canvasWidth;
    const scaleY = containerHeight / canvasHeight;
    const newScale = Math.min(scaleX, scaleY) * 0.95;
    
    setViewTransform({
      scale: newScale,
      panX: (containerWidth - canvasWidth * newScale) / 2,
      panY: (containerHeight - canvasHeight * newScale) / 2,
    });
    requestRender();
  }, [requestRender]);

  useLayoutEffect(() => {
    sourceImageRef.current = new Image();
    sourceImageRef.current.crossOrigin = "anonymous";
    let objectUrl: string | null = null;
    const currentSourceImage = sourceImageRef.current;

    currentSourceImage.onload = () => {
        const scale = Math.min(MAX_EDIT_DIMENSION / currentSourceImage.width, MAX_EDIT_DIMENSION / currentSourceImage.height, 1);
        const scaledWidth = currentSourceImage.width * scale;
        const scaledHeight = currentSourceImage.height * scale;

        const canvas = ('OffscreenCanvas' in window)
            ? new OffscreenCanvas(scaledWidth, scaledHeight)
            : document.createElement('canvas');
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        (ctx as CanvasRenderingContext2D).drawImage(currentSourceImage, 0, 0, scaledWidth, scaledHeight);
        fullCanvasRef.current = canvas;

        // Initialize local history from the image prop
        const initialHistory = image.annotationHistory && image.annotationHistory.length > 0 
            ? image.annotationHistory 
            : [{ layers: [] }];
        const initialIndex = image.annotationHistoryIndex >= 0 && image.annotationHistoryIndex < initialHistory.length
            ? image.annotationHistoryIndex
            : initialHistory.length - 1;

        setHistory(initialHistory);
        setHistoryIndex(initialIndex);
        setLocalLayers(initialHistory[initialIndex].layers);

        fitAndCenter();
        redrawFullCanvas();

        if (objectUrl) URL.revokeObjectURL(objectUrl);
    };

    if (typeof image.source === 'string') {
        currentSourceImage.src = image.source;
    } else {
        objectUrl = URL.createObjectURL(image.source);
        currentSourceImage.src = objectUrl;
    }
  }, [image.id, image.source, image.annotationHistory, image.annotationHistoryIndex, fitAndCenter]);

  useEffect(() => {
    const newImageUrls = localLayers
      .filter((l): l is ImageLayer => l.type === 'image')
      .map(l => l.src)
      .filter(src => !layerImageCache.has(src) || !layerImageCache.get(src)?.complete);

    if (newImageUrls.length > 0) {
      let loadedCount = 0;
      const newImages = new Map(layerImageCache);

      newImageUrls.forEach(src => {
        const img = new Image();
        img.onload = () => {
          newImages.set(src, img);
          loadedCount++;
          if (loadedCount === newImageUrls.length) {
            setLayerImageCache(newImages);
            redrawFullCanvas();
          }
        };
        img.src = src;
      });
    }
  }, [localLayers, layerImageCache]);

  useEffect(() => {
    if (tool === Tool.Text) {
        setTextInput({ value: '', color: brushColor, align: 'left' });
    }
  }, [tool, brushColor]);

  const takeSnapshot = useCallback((newLayers: AnyLayer[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    const newState: AnnotationState = { layers: newLayers };
    newHistory.push(newState);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const deleteActiveLayer = useCallback(() => {
    if (!activeLayerId) return;

    const newLayers = localLayers.filter(layer => layer.id !== activeLayerId);
    setLocalLayers(newLayers);
    setActiveLayerId(null);
    takeSnapshot(newLayers);
  }, [activeLayerId, localLayers, takeSnapshot]);
  
  const redrawFullCanvas = useCallback(() => {
    const fullCanvas = fullCanvasRef.current;
    const sourceImage = sourceImageRef.current;
    if (!fullCanvas || !sourceImage || !sourceImage.complete) return;
    const ctx = fullCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, fullCanvas.width, fullCanvas.height);
    (ctx as CanvasRenderingContext2D).drawImage(sourceImage, 0, 0, fullCanvas.width, fullCanvas.height);
    
    localLayers.forEach(layer => drawLayer(ctx, layer, layerImageCache));
    
    if (draftAnnotationRef.current) {
        drawAnnotation(ctx, draftAnnotationRef.current);
    }
    
    if (activeLayerId) {
        const activeLayer = localLayers.find(l => l.id === activeLayerId);
        if(activeLayer) drawSelectionBox(ctx, activeLayer);
    }
    requestRender();
  }, [localLayers, activeLayerId, layerImageCache, requestRender]);

  useImperativeHandle(ref, () => ({
    resetView: fitAndCenter,
    undo: () => {
        setHistoryIndex(prevIndex => {
            if (prevIndex > 0) {
                const newIndex = prevIndex - 1;
                setLocalLayers(history[newIndex].layers);
                setActiveLayerId(null);
                return newIndex;
            }
            return prevIndex;
        });
    },
    redo: () => {
        setHistoryIndex(prevIndex => {
            if (prevIndex < history.length - 1) {
                const newIndex = prevIndex + 1;
                setLocalLayers(history[newIndex].layers);
                setActiveLayerId(null);
                return newIndex;
            }
            return prevIndex;
        });
    },
    clearAnnotations: () => {
        // Filter out annotations, keeping only image layers.
        const layersToKeep = localLayers.filter(layer => layer.type === 'image');
        
        // Only update state and history if there were annotations to clear.
        if (layersToKeep.length < localLayers.length) {
            setLocalLayers(layersToKeep);
            setActiveLayerId(null);
            takeSnapshot(layersToKeep);
        }
    },
    addLayer: () => addLayerInputRef.current?.click(),
    canUndo: () => historyIndex > 0,
    canRedo: () => historyIndex < history.length - 1,
    saveAndExit: () => {
        onSaveAndExit({
            ...image,
            layers: localLayers,
            annotationHistory: history,
            annotationHistoryIndex: historyIndex,
        });
    },
    deleteActiveLayer,
  }), [fitAndCenter, history, historyIndex, image, onSaveAndExit, localLayers, takeSnapshot, deleteActiveLayer]);

  const renderDisplayCanvas = useCallback(() => {
    const displayCanvas = displayCanvasRef.current;
    const fullCanvas = fullCanvasRef.current;
    if (!displayCanvas || !fullCanvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = displayCanvas.clientWidth;
    const h = displayCanvas.clientHeight;
    if (displayCanvas.width !== w * dpr || displayCanvas.height !== h * dpr) {
      displayCanvas.width = w * dpr;
      displayCanvas.height = h * dpr;
    }
    
    const ctx = displayCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);
    
    ctx.translate(viewTransform.panX, viewTransform.panY);
    ctx.scale(viewTransform.scale, viewTransform.scale);
    
    ctx.drawImage(fullCanvas, 0, 0);
    
    ctx.restore();
  }, [viewTransform]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const getDistance = (t1: Touch, t2: Touch) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const getMidpoint = (t1: Touch, t2: Touch) => ({ x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 });

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                actionRef.current = 'none'; // Prevent other actions
                isPinchingRef.current = true;
                const distance = getDistance(e.touches[0], e.touches[1]);
                const midpoint = getMidpoint(e.touches[0], e.touches[1]);
                lastPinchStateRef.current = {
                    distance,
                    scale: viewTransform.scale,
                    panX: viewTransform.panX,
                    panY: viewTransform.panY,
                    midpoint
                };
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2 && isPinchingRef.current) {
                e.preventDefault();
                const { distance: lastDist, scale: lastScale, panX: lastPanX, panY: lastPanY, midpoint: lastMidpoint } = lastPinchStateRef.current;
                
                const newDist = getDistance(e.touches[0], e.touches[1]);
                if (lastDist === 0) return; // Avoid division by zero
                const scaleFactor = newDist / lastDist;
                const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, lastScale * scaleFactor));

                const newMidpoint = getMidpoint(e.touches[0], e.touches[1]);
                const rect = container.getBoundingClientRect();
                
                // Pan from zoom
                const worldX = (lastMidpoint.x - rect.left - lastPanX) / lastScale;
                const worldY = (lastMidpoint.y - rect.top - lastPanY) / lastScale;
                const newPanXFromZoom = (lastMidpoint.x - rect.left) - worldX * newScale;
                const newPanYFromZoom = (lastMidpoint.y - rect.top) - worldY * newScale;
                
                // Pan from finger movement
                const panDx = newMidpoint.x - lastMidpoint.x;
                const panDy = newMidpoint.y - lastMidpoint.y;

                setViewTransform({
                    scale: newScale,
                    panX: newPanXFromZoom + panDx,
                    panY: newPanYFromZoom + panDy
                });
                requestRender();
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (e.touches.length < 2) {
                isPinchingRef.current = false;
            }
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);
        container.addEventListener('touchcancel', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [viewTransform, requestRender]);

  useEffect(() => {
    const tick = () => {
      if (needsRender.current) {
        renderDisplayCanvas();
        needsRender.current = false;
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [renderDisplayCanvas]);

  useEffect(() => { redrawFullCanvas() }, [localLayers, activeLayerId, redrawFullCanvas]);
  
  const getMousePos = (e: MouseEvent | React.MouseEvent | React.PointerEvent | WheelEvent): Point => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    const worldX = (x - viewTransform.panX) / viewTransform.scale;
    const worldY = (y - viewTransform.panY) / viewTransform.scale;
    return { x: worldX, y: worldY };
  };

  const updateCursor = useCallback((pos: Point) => {
    const isPanningTool = isSpacebarDown || tool === Tool.Hand;
    let newCursor = 'crosshair';

    if (isPanningTool) {
        newCursor = 'grab';
    } else if (tool === Tool.Selection) {
        const activeLayer = activeLayerId ? localLayers.find(l => l.id === activeLayerId) : undefined;
        if (activeLayer) {
            // Prevent resize cursor for annotation layers
            if (activeLayer.type !== Tool.Brush && activeLayer.type !== Tool.Lasso && activeLayer.type !== Tool.Arrow) {
                const handle = getHandleAtPosition(pos, activeLayer, viewTransform.scale);
                if (handle) {
                    newCursor = (handle === 'tl' || handle === 'br') ? 'nwse-resize' : 'nesw-resize';
                } else if (getLayerAtPosition(pos, [activeLayer])) {
                    newCursor = 'move';
                }
            } else if (getLayerAtPosition(pos, [activeLayer])) {
                newCursor = 'move';
            }
        }
        if (newCursor === 'crosshair' && getLayerAtPosition(pos, localLayers)) {
            newCursor = 'pointer';
        }
    } else {
        if (tool === Tool.Lasso) newCursor = 'crosshair';
        else if (tool === Tool.Brush || tool === Tool.Arrow) newCursor = 'none';
        else if (tool === Tool.Text) newCursor = 'text';
    }

    if (cursorStyle !== newCursor) {
        setCursorStyle(newCursor);
    }
}, [isSpacebarDown, tool, activeLayerId, localLayers, viewTransform.scale, cursorStyle]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    
    const ds = 1 - e.deltaY * ZOOM_SENSITIVITY;
    const nextScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewTransform.scale * ds));
    const k = nextScale / viewTransform.scale;

    setViewTransform({ 
        scale: nextScale, 
        panX: x - k * (x - viewTransform.panX), 
        panY: y - k * (y - viewTransform.panY) 
    });
    requestRender();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isPinchingRef.current) return;
    if (e.button === 1) { // Middle mouse button
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        actionRef.current = 'pan';
        panStartRef.current = { x: e.clientX, y: e.clientY, panX: viewTransform.panX, panY: viewTransform.panY };
        setCursorStyle('grabbing');
        return;
    }

    if (e.button !== 0 || textInput) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const pos = getMousePos(e);

    if (isSpacebarDown || tool === Tool.Hand) {
        actionRef.current = 'pan';
        panStartRef.current = { x: e.clientX, y: e.clientY, panX: viewTransform.panX, panY: viewTransform.panY };
        return;
    }

    if (tool === Tool.Selection) {
        const activeLayer = activeLayerId ? localLayers.find(l => l.id === activeLayerId) : undefined;
        // Prevent resize handles on annotation layers
        if (activeLayer && activeLayer.type !== Tool.Brush && activeLayer.type !== Tool.Lasso && activeLayer.type !== Tool.Arrow) {
            const handle = getHandleAtPosition(pos, activeLayer, viewTransform.scale);
            if(handle) {
                actionRef.current = 'resizeLayer';
                actionStartRef.current = { pos, layer: activeLayer, handle, originalLayers: localLayers };
                return;
            }
        }

        const layerAtPos = getLayerAtPosition(pos, [...localLayers].reverse());
        if (layerAtPos) {
            actionRef.current = 'moveLayer';
            setActiveLayerId(layerAtPos.id);
            // Store a deep copy of layers for robust move/resize operations
            actionStartRef.current = { pos, layer: layerAtPos, originalLayers: JSON.parse(JSON.stringify(localLayers)) };
            return;
        }

        setActiveLayerId(null);
        return;
    }

    actionRef.current = 'draw';
    setActiveLayerId(null); 
    
    const common = { id: Date.now(), color: brushColor, size: brushSize };
    if (tool === Tool.Brush || tool === Tool.Lasso) {
        draftAnnotationRef.current = { ...common, type: tool, points: [pos] };
    } else if (tool === Tool.Arrow) {
        draftAnnotationRef.current = { ...common, type: tool, start: pos, end: pos };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPinchingRef.current) return;
    const pos = getMousePos(e);

    if (actionRef.current === 'none') {
        updateCursor(pos);
    }
    
    const preview = cursorPreviewRef.current;
    const container = containerRef.current;
    if (preview && container) {
      const containerRect = container.getBoundingClientRect();
      preview.style.left = `${e.clientX - containerRect.left}px`;
      preview.style.top  = `${e.clientY - containerRect.top}px`;
      const scaledSize = brushSize * viewTransform.scale;
      preview.style.width = `${scaledSize}px`;
      preview.style.height = `${scaledSize}px`;
    }

    if (actionRef.current === 'pan' && panStartRef.current) {
        const startPan = panStartRef.current;
        const dx = e.clientX - startPan.x;
        const dy = e.clientY - startPan.y;
        setViewTransform(prev => ({ ...prev, panX: startPan.panX + dx, panY: startPan.panY + dy }));
        requestRender();
    } else if (actionRef.current === 'draw' && draftAnnotationRef.current) {
        if (draftAnnotationRef.current.type === Tool.Brush || draftAnnotationRef.current.type === Tool.Lasso) {
            draftAnnotationRef.current.points.push(pos);
        } else if (draftAnnotationRef.current.type === Tool.Arrow) {
            draftAnnotationRef.current.end = pos;
        }
        redrawFullCanvas();
    } else if (actionRef.current === 'moveLayer' && actionStartRef.current?.layer) {
        const { pos: startPos, layer, originalLayers } = actionStartRef.current;
        const originalLayer = originalLayers.find(l => l.id === layer.id)!;
        const dx = pos.x - startPos.x;
        const dy = pos.y - startPos.y;
        
        setLocalLayers(prevLayers => prevLayers.map(l => 
            l.id === layer.id ? { ...l, x: originalLayer.x + dx, y: originalLayer.y + dy } : l
        ));
        // No redrawFullCanvas needed here, useEffect on localLayers will handle it.
    } else if (actionRef.current === 'resizeLayer' && actionStartRef.current?.layer && actionStartRef.current.handle) {
        const { layer, handle } = actionStartRef.current;
        const newAttrs = calculateNewLayerAttributes(layer, handle, pos, true);
        
        setLocalLayers(prevLayers => prevLayers.map(l => {
            if (l.id === layer.id) {
                const updatedLayer = { ...l, ...newAttrs };
                if (updatedLayer.type === 'text') {
                    const scaleRatio = newAttrs.width / l.width;
                    updatedLayer.fontSize = (l as TextLayer).fontSize * scaleRatio;
                }
                return updatedLayer;
            }
            return l;
        }));
        // No redrawFullCanvas needed here, useEffect on localLayers will handle it.
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPinchingRef.current) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    let newLayers: AnyLayer[] | null = null;
    if (actionRef.current === 'draw' && draftAnnotationRef.current) {
        const newLayer = annotationToLayer(draftAnnotationRef.current);
        draftAnnotationRef.current = null;
        if (newLayer) {
            newLayers = [...localLayers, newLayer];
            setLocalLayers(newLayers);
        }
    } else if (actionRef.current === 'moveLayer' || actionRef.current === 'resizeLayer') {
        newLayers = localLayers;
    }
    
    if (newLayers) {
        takeSnapshot(newLayers);
    }
    
    actionRef.current = 'none';
    actionStartRef.current = null;
    panStartRef.current = null;
    redrawFullCanvas(); // Final draw for selection box etc.
    updateCursor(getMousePos(e));
  };

  const handleCancelText = () => {
    setTextInput(null);
    onTextEditEnd();
  };

  const handleConfirmText = () => {
    if (!textInput || !textInput.value.trim() || !fullCanvasRef.current) {
        setTextInput(null);
        onTextEditEnd();
        return;
    }

    const tempCtx = ('OffscreenCanvas' in window)
        ? new OffscreenCanvas(1, 1).getContext('2d')
        : document.createElement('canvas').getContext('2d');
    if (!tempCtx) return;

    const newFontSize = Math.max(36, Math.round(fullCanvasRef.current.height * 0.05));
    const fontFamily = "'Space Grotesk', sans-serif";
    tempCtx.font = `${newFontSize}px ${fontFamily}`;

    const lines = textInput.value.split('\n');
    const lineHeight = newFontSize * 1.2;
    let maxWidth = 0;
    lines.forEach(line => maxWidth = Math.max(maxWidth, tempCtx.measureText(line).width));
    const totalHeight = lines.length * lineHeight;

    const newLayer: TextLayer = {
        id: Date.now(), type: 'text', text: textInput.value,
        x: (fullCanvasRef.current.width - maxWidth) / 2, y: (fullCanvasRef.current.height - totalHeight) / 2,
        width: maxWidth, height: totalHeight, fontSize: newFontSize,
        color: textInput.color, fontFamily, align: textInput.align,
    };

    const newLayers = [...localLayers, newLayer];
    setLocalLayers(newLayers);
    setActiveLayerId(newLayer.id);
    takeSnapshot(newLayers);
    setTextInput(null);
    onTextEditEnd();
    onToolChange(Tool.Selection);
  };
  
  const handleAddNewLayer = (files: FileList | null) => {
    if (!files || files.length === 0 || !fullCanvasRef.current) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target!.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = fullCanvasRef.current!;
        const scale = Math.min(canvas.width / 2 / img.width, canvas.height / 2 / img.height);
        const newWidth = img.width * scale;
        const newHeight = img.height * scale;

        const newLayer: ImageLayer = {
          id: Date.now(), type: 'image', src: dataUrl,
          x: (canvas.width - newWidth) / 2, y: (canvas.height - newHeight) / 2,
          width: newWidth, height: newHeight,
        };
        const newLayers = [...localLayers, newLayer];
        setLocalLayers(newLayers);
        setActiveLayerId(newLayer.id);
        takeSnapshot(newLayers);
        onToolChange(Tool.Selection);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA'].includes(target.tagName)) {
            return;
        }
        if (e.code === 'Space') {
            setIsSpacebarDown(true);
            e.preventDefault();
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacebarDown(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const isPanning = actionRef.current === 'pan';
    const isHandTool = tool === Tool.Hand;

    if (isSpacebarDown || isHandTool) {
        setCursorStyle(isPanning ? 'grabbing' : 'grab');
    } else if (tool === Tool.Selection) {
        setCursorStyle('crosshair');
    } else if (tool === Tool.Lasso) {
        setCursorStyle('crosshair');
    } else if (tool === Tool.Brush || tool === Tool.Arrow) {
        setCursorStyle('none');
    } else if (tool === Tool.Text) {
        setCursorStyle('text');
    } else {
        setCursorStyle('crosshair');
    }

    const preview = cursorPreviewRef.current;
    if(preview) {
        const showPreview = (tool === Tool.Brush || tool === Tool.Arrow) && !isHandTool && !isSpacebarDown;
        preview.style.display = showPreview ? 'block' : 'none';
        if (showPreview) {
          preview.style.backgroundColor = `${brushColor}80`;
        }
    }
  }, [tool, isSpacebarDown, actionRef.current, brushColor]);

  return (
    <div 
        ref={containerRef} 
        className={`relative w-full h-full overflow-hidden bg-[#1c1c1c] border-2 border-gray-700 transition-[border-radius] duration-500 ease-in-out ${areCornersRounded ? 'rounded-2xl' : 'rounded-none'}`}
        style={{ touchAction: 'none', cursor: cursorStyle }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }}
        onDoubleClick={fitAndCenter}
    >
      <canvas ref={displayCanvasRef} className="w-full h-full" />
      <div
        ref={cursorPreviewRef}
        className="absolute rounded-full pointer-events-none"
        style={{
            border: '1px solid white', transform: 'translate(-50%, -50%)',
            display: 'none', zIndex: 10,
        }}
      />

      {textInput && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative flex flex-col bg-[#1c1c1c] rounded-2xl p-4 shadow-2xl border border-[#262626] w-96">
            <div className="absolute top-4 right-4">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <input
                  type="color"
                  value={textInput.color}
                  onChange={(e) => setTextInput(prev => prev ? { ...prev, color: e.target.value } : null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title={t('text_editor.color_picker_title')}
                />
                <div className="w-6 h-6 rounded-full border-2 border-white/20 pointer-events-none"
                  style={{ backgroundColor: textInput.color }} />
              </div>
            </div>
            <textarea
              value={textInput.value}
              onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
              placeholder={t('text_editor.placeholder')}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleConfirmText(); } }}
              className="bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none flex-grow mb-4 text-xl"
              rows={3}
              style={{ color: textInput.color }}
            />
            <div className="w-full flex items-center">
              <button
                onClick={handleCancelText}
                title={t('text_editor.cancel_title')}
                className="p-2.5 rounded-lg transition-colors duration-200 hover:bg-[#333333] text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1c1c1c] focus:ring-gray-500"
              >
                <Icon name="x" className="w-6 h-6" />
              </button>
              <div className="flex-grow flex justify-center items-center gap-2">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button key={align} onClick={() => setTextInput(prev => prev ? { ...prev, align } : null)}
                    title={t(`text_editor.align_${align}_title`)}
                    className={`p-2.5 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1c1c1c] focus:ring-[#d1fe17] ${textInput.align === align ? 'bg-[#d1fe17] text-black' : 'text-gray-400 hover:bg-white/10'}`}>
                    <Icon name={`align${align.charAt(0).toUpperCase() + align.slice(1)}`} className="w-6 h-6" />
                  </button>
                ))}
              </div>
              <button onClick={handleConfirmText} title={t('text_editor.confirm_title')}
                className="p-2.5 rounded-lg transition-colors duration-200 bg-[#d1fe17] hover:bg-lime-300 text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1c1c1c] focus:ring-[#d1fe17]">
                <Icon name="check" className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
      <input type="file" ref={addLayerInputRef} className="hidden" accept="image/*" onChange={(e) => { handleAddNewLayer(e.target.files); if (e.target) e.target.value = ''; }}/>
    </div>
  );
});

// --- Helper Functions ---
const drawAnnotation = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, ann: DraftAnnotation) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (ann.type === Tool.Brush) {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.size;
        ctx.beginPath();
        if (ann.points.length > 0) {
            ctx.moveTo(ann.points[0].x, ann.points[0].y);
            for (let i = 1; i < ann.points.length; i++) ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
    } else if (ann.type === Tool.Lasso) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = ann.color;
        const colorWithAlpha = ann.color.startsWith('#') ? `${ann.color}80` : ann.color; // 50% opacity
        ctx.fillStyle = colorWithAlpha;
        ctx.beginPath();
        if (ann.points.length > 0) {
            ctx.moveTo(ann.points[0].x, ann.points[0].y);
            for (let i = 1; i < ann.points.length; i++) ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (ann.type === Tool.Arrow) {
        const { start, end } = ann;
        const headlen = Math.max(ann.size * 1.5, 10);
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
        // Outline
        ctx.strokeStyle = '#000000'; ctx.lineWidth = ann.size + 4; draw();
        // Fill
        ctx.strokeStyle = ann.color; ctx.lineWidth = ann.size; draw();
    }
};

const drawLayer = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  layer: AnyLayer,
  imageCache: Map<string, HTMLImageElement>
) => {
    ctx.save();
    if (layer.type === 'image') {
        const imgEl = imageCache.get(layer.src);
        if (imgEl && imgEl.complete) {
            (ctx as CanvasRenderingContext2D).drawImage(imgEl, layer.x, layer.y, layer.width, layer.height);
        }
    } else if (layer.type === 'text') {
        const textLayer = layer as TextLayer;
        ctx.font = `${textLayer.fontSize}px ${textLayer.fontFamily}`;
        ctx.textAlign = textLayer.align;
        ctx.textBaseline = 'top';

        const lines = textLayer.text.split('\n');
        const lineHeight = textLayer.fontSize * 1.2;

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
                for (let i = 1; i < brushLayer.points.length; i++) ctx.lineTo(brushLayer.points[i].x, brushLayer.points[i].y);
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
                for (let i = 1; i < lassoLayer.points.length; i++) ctx.lineTo(lassoLayer.points[i].x, lassoLayer.points[i].y);
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

const drawSelectionBox = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, layer: AnyLayer) => {
    ctx.strokeStyle = '#d1fe17';
    ctx.lineWidth = 2;
    ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
    
    // Only draw resize handles for image and text layers
    if (layer.type === 'image' || layer.type === 'text') {
        ctx.fillStyle = '#d1fe17';
        const handles = getResizeHandles(layer);
        Object.values(handles).forEach(handle => {
            ctx.fillRect(handle.x - VISUAL_HANDLE_SIZE / 2, handle.y - VISUAL_HANDLE_SIZE / 2, VISUAL_HANDLE_SIZE, VISUAL_HANDLE_SIZE);
        });
    }
};

const getLayerAtPosition = (pos: Point, layers: AnyLayer[]): AnyLayer | null => {
  for (const layer of layers) {
    if (pos.x >= layer.x && pos.x <= layer.x + layer.width && pos.y >= layer.y && pos.y <= layer.y + layer.height) return layer;
  }
  return null;
};

const getResizeHandles = (layer: AnyLayer) => ({
  tl: { x: layer.x, y: layer.y },
  tr: { x: layer.x + layer.width, y: layer.y },
  bl: { x: layer.x, y: layer.y + layer.height },
  br: { x: layer.x + layer.width, y: layer.y + layer.height }
});

const getHandleAtPosition = (pos: Point, layer: AnyLayer, scale: number): ResizeHandle | null => {
  if (layer.type !== 'image' && layer.type !== 'text') return null;
  const handles = getResizeHandles(layer);
  const margin = HANDLE_SIZE / scale;
  for (const [key, p] of Object.entries(handles)) {
    if (Math.hypot(pos.x - (p as Point).x, pos.y - (p as Point).y) < margin) return key as ResizeHandle;
  }
  return null;
};

const calculateNewLayerAttributes = (
  original: AnyLayer, handle: ResizeHandle, pos: Point, maintainAspect: boolean
): { x: number; y: number; width: number; height: number } => {
  const aspectRatio = original.width / original.height;
  const right = original.x + original.width;
  const bottom = original.y + original.height;
  const minDim = 20;

  let newX = original.x;
  let newY = original.y;
  let newWidth = original.width;
  let newHeight = original.height;

  const anchor = {
    x: handle.includes('l') ? right : original.x,
    y: handle.includes('t') ? bottom : original.y,
  };

  let tempWidth = Math.abs(pos.x - anchor.x);
  let tempHeight = Math.abs(pos.y - anchor.y);

  if (maintainAspect) {
    if (tempWidth / tempHeight > aspectRatio) {
      newWidth = tempHeight * aspectRatio;
      newHeight = tempHeight;
    } else {
      newWidth = tempWidth;
      newHeight = tempWidth / aspectRatio;
    }
  } else {
     newWidth = tempWidth;
     newHeight = tempHeight;
  }

  if (newWidth < minDim) {
    newWidth = minDim;
    if (maintainAspect) newHeight = newWidth / aspectRatio;
  }
  if (newHeight < minDim) {
    newHeight = minDim;
    if (maintainAspect) newWidth = newHeight * aspectRatio;
  }
  
  newX = handle.includes('l') ? anchor.x - newWidth : anchor.x;
  newY = handle.includes('t') ? anchor.y - newHeight : anchor.y;

  return { x: newX, y: newY, width: newWidth, height: newHeight };
};

const annotationToLayer = (ann: DraftAnnotation): AnyLayer | null => {
    const common = { id: ann.id, color: ann.color, size: ann.size };
    
    if (ann.type === Tool.Brush || ann.type === Tool.Lasso) {
        if (ann.points.length < 2) return null;
        const xs = ann.points.map(p => p.x);
        const ys = ann.points.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        return {
            ...common,
            type: ann.type,
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            points: ann.points.map(p => ({ x: p.x - minX, y: p.y - minY })),
        } as BrushLayer | LassoLayer;
    }
    
    if (ann.type === Tool.Arrow) {
        if (Math.hypot(ann.end.x - ann.start.x, ann.end.y - ann.start.y) < 5) return null; // Ignore tiny arrows
        const { start, end } = ann;
        const minX = Math.min(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxX = Math.max(start.x, end.x);
        const maxY = Math.max(start.y, end.y);

        return {
            ...common,
            type: ann.type,
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            start: { x: start.x - minX, y: start.y - minY },
            end: { x: end.x - minX, y: end.y - minY },
        } as ArrowLayer;
    }

    return null;
};


export default ImageEditor;