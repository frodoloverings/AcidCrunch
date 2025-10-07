import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Tool, Point, WorkspaceImage } from '../types';
import { getResizeHandleAtPosition, getImageAtPosition, isOverRect, calculateNewResizeAttributes, calculateNewFreeResizeAttributes, ResizeHandle } from '../components/workspace/geometry';

type CanvasAction = 'drag' | 'resize' | 'pan' | 'marquee' | 'potential_drag' | 'panImageInFrame' | 'panFrame' | 'none';
type OutpaintingState = { image: WorkspaceImage; originalState: WorkspaceImage; } | null;

const ZOOM_SENSITIVITY = 0.001;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 20;
const DRAG_THRESHOLD = 5;

interface UseWorkspaceInputProps {
    tool: Tool;
    images: WorkspaceImage[];
    selectedImageIds: number[];
    onSelectImages: (ids: number[]) => void;
    onWorkspaceUpdate: (images: WorkspaceImage[], addToHistory?: boolean) => void;
    containerRef: React.RefObject<HTMLDivElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    viewTransform: { scale: number; panX: number; panY: number; };
    setViewTransform: React.Dispatch<React.SetStateAction<{ scale: number; panX: number; panY: number; }>>;
    outpaintingState: OutpaintingState;
    setOutpaintingState: React.Dispatch<React.SetStateAction<OutpaintingState>>;
    handleCancelOutpainting: () => void;
    requestRender: () => void;
    onAspectRatioUpdate: (w: string, h: string) => void;
}

export const useWorkspaceInput = ({
    tool, images, selectedImageIds, onSelectImages, onWorkspaceUpdate, containerRef, canvasRef,
    viewTransform, setViewTransform, outpaintingState, setOutpaintingState,
    handleCancelOutpainting, requestRender, onAspectRatioUpdate
}: UseWorkspaceInputProps) => {

    const [isSpacebarDown, setIsSpacebarDown] = useState(false);
    const [cursorStyle, setCursorStyle] = useState('crosshair');
    const [marquee, setMarquee] = useState<{ start: Point; end: Point } | null>(null);

    const actionRef = useRef<CanvasAction>('none');
    const panStartRef = useRef<{ x: number, y: number, panX: number, panY: number } | null>(null);
    const resizingImageRef = useRef<{ original: WorkspaceImage; handle: ResizeHandle; isProportional: boolean } | null>(null);
    const dragStartPosRef = useRef<Point | null>(null);
    const dragStartRef = useRef<{ mousePos: Point; images: WorkspaceImage[] } | null>(null);
    const isPinchingRef = useRef(false);
    // FIX: Explicitly typed the ref to ensure TypeScript correctly infers the type of the `midpoint` property.
    const lastPinchStateRef = useRef<{ distance: number; scale: number; panX: number; panY: number; midpoint: Point }>({ distance: 0, scale: 1, panX: 0, panY: 0, midpoint: { x: 0, y: 0 } });

    const getMousePos = useCallback((e: MouseEvent | React.MouseEvent | React.PointerEvent | WheelEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left);
        const y = (e.clientY - rect.top);
        return {
            x: (x - viewTransform.panX) / viewTransform.scale,
            y: (y - viewTransform.panY) / viewTransform.scale,
        };
    }, [canvasRef, viewTransform]);

    const updateCursor = useCallback((pos?: Point) => {
        if (actionRef.current !== 'none') return;
        let newCursor = 'crosshair';

        if (outpaintingState && pos) {
            const { image: frame, originalState } = outpaintingState;
            const handle = getResizeHandleAtPosition(pos, frame, viewTransform.scale, true);
            if (handle) {
                if (['tl', 'br'].includes(handle) || ['tr', 'bl'].includes(handle)) {
                    newCursor = handle.startsWith('t') ? (handle.endsWith('l') ? 'nwse-resize' : 'nesw-resize') : (handle.endsWith('l') ? 'nesw-resize' : 'nwse-resize');
                } else if (['t', 'b'].includes(handle)) {
                    newCursor = 'ns-resize';
                } else {
                    newCursor = 'ew-resize';
                }
            } else if (isOverRect(pos, originalState)) {
                newCursor = 'move';
            } else if (isOverRect(pos, frame)) {
                newCursor = 'grab';
            }
        } else if (isSpacebarDown || tool === Tool.Hand) {
            newCursor = 'grab';
        } else if (pos) {
            const hoveredImage = getImageAtPosition(pos, [...images].reverse());
            if (selectedImageIds.length === 1) {
                const selectedImg = images.find(img => img.id === selectedImageIds[0]);
                if (selectedImg && !selectedImg.isLoading) {
                    const handle = getResizeHandleAtPosition(pos, selectedImg, viewTransform.scale, false);
                    if (handle) {
                        newCursor = (handle === 'tl' || handle === 'br') ? 'nwse-resize' : 'nesw-resize';
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
    }, [images, selectedImageIds, isSpacebarDown, viewTransform.scale, outpaintingState, tool]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left);
        const y = (e.clientY - rect.top);
        const ds = 1 - e.deltaY * ZOOM_SENSITIVITY;
        const nextScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewTransform.scale * ds));
        const newPanX = x - (x - viewTransform.panX) * (nextScale / viewTransform.scale);
        const newPanY = y - (y - viewTransform.panY) * (nextScale / viewTransform.scale);
        setViewTransform({ scale: nextScale, panX: newPanX, panY: newPanY });
        requestRender();
    }, [canvasRef, viewTransform.scale, viewTransform.panX, viewTransform.panY, setViewTransform, requestRender]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (isPinchingRef.current) return;
        if ((e.target as HTMLElement).closest('[data-outpainting-ui]')) return;
        if ((e.target as HTMLElement).closest('[data-canvas-ui-interactive]')) return;
        
        if (e.button === 1 || (isSpacebarDown && !outpaintingState) || tool === Tool.Hand) {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            actionRef.current = 'pan';
            panStartRef.current = { x: e.clientX, y: e.clientY, panX: viewTransform.panX, panY: viewTransform.panY };
            setCursorStyle('grabbing');
            return;
        }
        
        if (e.button !== 0) return;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        const pos = getMousePos(e);
        dragStartPosRef.current = pos;
        
        if (outpaintingState) {
            const { image: frame, originalState } = outpaintingState;
            const handle = getResizeHandleAtPosition(pos, frame, viewTransform.scale, true);
            if (handle) {
                actionRef.current = 'resize';
                resizingImageRef.current = { original: { ...frame }, handle, isProportional: e.ctrlKey || e.metaKey };
                updateCursor(pos);
                return;
            }
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

        const imageToInteract = images.find(img => selectedImageIds.length === 1 && img.id === selectedImageIds[0]);
        if (imageToInteract) {
            const handle = getResizeHandleAtPosition(pos, imageToInteract, viewTransform.scale, false);
            if (handle) {
                actionRef.current = 'resize';
                resizingImageRef.current = { original: { ...imageToInteract }, handle, isProportional: e.ctrlKey || e.metaKey };
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
    }, [getMousePos, isSpacebarDown, outpaintingState, tool, viewTransform, images, selectedImageIds, updateCursor, handleCancelOutpainting, onSelectImages]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        const pos = getMousePos(e);
        
        if (actionRef.current === 'none') {
            updateCursor(pos);
        } else if (actionRef.current === 'pan' && panStartRef.current) {
            const startPan = panStartRef.current;
            const dx = e.clientX - startPan.x;
            const dy = e.clientY - startPan.y;
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
                onWorkspaceUpdate(images.map(img => {
                    const originalPos = originalPositions.get(img.id);
                    return originalPos ? { ...img, x: originalPos.x + dx, y: originalPos.y + dy } : img;
                }), false);
            }
        } else if (actionRef.current === 'panImageInFrame' && dragStartRef.current && outpaintingState) {
            const dx = pos.x - dragStartRef.current.mousePos.x;
            const dy = pos.y - dragStartRef.current.mousePos.y;
            const startPos = dragStartRef.current.images[0];
            const newOriginalState = { ...outpaintingState.originalState, x: startPos.x + dx, y: startPos.y + dy };
            setOutpaintingState(prev => prev ? { ...prev, originalState: newOriginalState } : null);
        } else if (actionRef.current === 'panFrame' && dragStartRef.current && outpaintingState) {
            const dx = pos.x - dragStartRef.current.mousePos.x;
            const dy = pos.y - dragStartRef.current.mousePos.y;
            const startFramePos = dragStartRef.current.images[0];
            const startOriginalPos = dragStartRef.current.images[1];
            const newFrameState = { ...outpaintingState.image, x: startFramePos.x + dx, y: startFramePos.y + dy };
            const newOriginalState = { ...outpaintingState.originalState, x: startOriginalPos.x + dx, y: startOriginalPos.y + dy };
            setOutpaintingState({ image: newFrameState, originalState: newOriginalState });
            onWorkspaceUpdate(images.map(i => i.id === newFrameState.id ? newFrameState : i), false);
        } else if (actionRef.current === 'resize' && resizingImageRef.current) {
            const isOutpaintingResize = !!outpaintingState;
            resizingImageRef.current.isProportional = e.ctrlKey || e.metaKey;

            const { result } = isOutpaintingResize
                ? calculateNewFreeResizeAttributes(resizingImageRef.current.original, resizingImageRef.current.handle, pos, viewTransform.scale, resizingImageRef.current.isProportional)
                : calculateNewResizeAttributes(resizingImageRef.current.original, resizingImageRef.current.handle, pos, viewTransform.scale, resizingImageRef.current.isProportional);
            
            if (isOutpaintingResize) {
                const newFrameState = { ...outpaintingState.image, ...result };
                const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
                const commonDivisor = gcd(Math.round(newFrameState.originalWidth), Math.round(newFrameState.originalHeight));
                onAspectRatioUpdate(String(Math.round(newFrameState.originalWidth / commonDivisor)), String(Math.round(newFrameState.originalHeight / commonDivisor)));
                setOutpaintingState({ image: newFrameState, originalState: outpaintingState.originalState });
                onWorkspaceUpdate(images.map(i => i.id === newFrameState.id ? newFrameState : i), false);
            } else {
                onWorkspaceUpdate(images.map(i => i.id === resizingImageRef.current!.original.id ? { ...i, ...result } : i), false);
            }
        } else if (actionRef.current === 'marquee' && marquee) {
            setMarquee({ ...marquee, end: pos });
        }
        requestRender();
    }, [getMousePos, setViewTransform, viewTransform.scale, outpaintingState, selectedImageIds, onSelectImages, onWorkspaceUpdate, images, setOutpaintingState, onAspectRatioUpdate, marquee, requestRender, updateCursor]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        
        if (actionRef.current === 'potential_drag' && dragStartRef.current) { // Click
            const clickedImageId = dragStartRef.current.images[0].id;
            if (e.shiftKey) {
                onSelectImages(selectedImageIds.includes(clickedImageId) ? selectedImageIds.filter(id => id !== clickedImageId) : [...selectedImageIds, clickedImageId]);
            } else {
                onSelectImages([clickedImageId]);
            }
        } else if (['drag', 'panImageInFrame', 'panFrame', 'resize'].includes(actionRef.current) && !outpaintingState) {
            onWorkspaceUpdate(images, true);
        } else if (actionRef.current === 'marquee' && marquee) {
            const marqueeRect = { x: Math.min(marquee.start.x, marquee.end.x), y: Math.min(marquee.start.y, marquee.end.y), width: Math.abs(marquee.start.x - marquee.end.x), height: Math.abs(marquee.start.y - marquee.end.y) };
            if (marqueeRect.width * viewTransform.scale < DRAG_THRESHOLD && marqueeRect.height * viewTransform.scale < DRAG_THRESHOLD) {
                if (!e.shiftKey) onSelectImages([]);
            } else {
                const newlySelected = images.filter(img => isOverRect(img, marqueeRect)).map(img => img.id);
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
    }, [getMousePos, onSelectImages, selectedImageIds, outpaintingState, onWorkspaceUpdate, images, marquee, viewTransform.scale, updateCursor, requestRender]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
            if (e.code === 'Space' && !outpaintingState) setIsSpacebarDown(true);
            if (e.code === 'Escape' && outpaintingState) handleCancelOutpainting();
        };
        const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacebarDown(false); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [outpaintingState, handleCancelOutpainting]);

    useEffect(() => { updateCursor(); }, [isSpacebarDown, updateCursor]);
    
    // The original pinch-to-zoom logic was incomplete and caused a type error.
    // This has been replaced with the correct implementation, ensuring smooth zooming and panning on touch devices.
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const getDistance = (t1: Touch, t2: Touch) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const getMidpoint = (t1: Touch, t2: Touch): Point => ({ x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 });

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault(); 
                actionRef.current = 'none'; 
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
                
                // FIX: Renamed destructured `midpoint` to `lastMidpoint` to resolve a TypeScript type inference issue.
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
                const newPanXFromZoom = (newMidpoint.x - rect.left) - worldX * newScale;
                const newPanYFromZoom = (newMidpoint.y - rect.top) - worldY * newScale;
                
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
        const handleTouchEnd = (e: TouchEvent) => { if (e.touches.length < 2) isPinchingRef.current = false; };

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
    }, [viewTransform, requestRender, setViewTransform, containerRef]);

    return {
        cursorStyle,
        marquee,
        isSpacebarDown,
        handleWheel,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp
    };
};
