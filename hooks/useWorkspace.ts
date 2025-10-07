
import { useState, useCallback, SetStateAction, Dispatch, RefObject } from 'react';
import { WorkspaceImage, LogEntry } from '../types';
import { WorkspaceCanvasRef } from '../components/WorkspaceCanvas';

interface UseWorkspaceProps {
    setLogs: Dispatch<SetStateAction<any[]>>;
    setEditingImageId: Dispatch<SetStateAction<number | null>>;
    workspaceCanvasRef: RefObject<WorkspaceCanvasRef>;
    addLog: (type: LogEntry['type'], message: string, payload?: any, isVerbose?: boolean) => void;
}

export const useWorkspace = ({ setLogs, setEditingImageId, workspaceCanvasRef, addLog }: UseWorkspaceProps) => {
    const [workspaceImages, setWorkspaceImages] = useState<WorkspaceImage[]>([]);
    const [manualSelectedImageIds, setManualSelectedImageIds] = useState<number[]>([]);
    const [canvasHistory, setCanvasHistory] = useState<WorkspaceImage[][]>([[]]);
    const [canvasHistoryIndex, setCanvasHistoryIndex] = useState(0);
    
    const handleWorkspaceUpdate = useCallback((updater: SetStateAction<WorkspaceImage[]>, addToHistory: boolean = true) => {
        setWorkspaceImages(prevImages => {
            const newImages = typeof updater === 'function' ? updater(prevImages) : updater;
            if (addToHistory) {
                setCanvasHistory(prevHistory => {
                    const newHistorySlice = prevHistory.slice(0, canvasHistoryIndex + 1);
                    newHistorySlice.push(newImages);
                    const newIndex = newHistorySlice.length - 1;
                    setCanvasHistoryIndex(newIndex);
                    addLog('state', `Workspace history updated. Index: ${newIndex}`, null, true);
                    return newHistorySlice;
                });
            }
            return newImages;
        });
    }, [canvasHistoryIndex, addLog]);

    const handleDeleteSelected = useCallback((selectedIds: number[]) => {
        if (selectedIds.length === 0) return;
        addLog('action', 'Deleting images', { ids: selectedIds }, true);
        handleWorkspaceUpdate(prevImages => prevImages.filter(img => !selectedIds.includes(img.id)));
        setManualSelectedImageIds([]);
    }, [handleWorkspaceUpdate, addLog]);
    
    const handleResetCanvas = useCallback(() => {
        addLog('action', 'Canvas reset');
        handleWorkspaceUpdate([]);
        setManualSelectedImageIds([]);
        setLogs([]);
        setEditingImageId(null);
    }, [handleWorkspaceUpdate, setLogs, setEditingImageId, addLog]);
    
    const handleAddImage = useCallback((files: FileList | null) => {
        if (!files || files.length === 0) return;
    
        const newImagesPromises = Array.from(files)
            .filter(file => file.type.startsWith('image/'))
            .map(file => {
                return new Promise<WorkspaceImage>((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        const screenHeight = window.innerHeight;
                        const targetHeight = screenHeight * 0.5;
                        const aspectRatio = img.width / img.height;
                        const newHeight = targetHeight;
                        const newWidth = newHeight * aspectRatio;
    
                        resolve({
                            id: Date.now() + Math.random(),
                            source: file,
                            x: 0, y: 0, width: newWidth, height: newHeight,
                            originalWidth: img.width, originalHeight: img.height,
                            layers: [], annotationHistory: [{ layers: [] }], annotationHistoryIndex: 0,
                        });
                    };
                    img.src = URL.createObjectURL(file);
                });
            });
    
        Promise.all(newImagesPromises).then(newImages => {
            if (newImages.length === 0) return;
            addLog('action', `Adding ${newImages.length} image(s)`, null, true);
    
            const viewportCenter = workspaceCanvasRef.current?.getViewportCenter() || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            const positionedImages = newImages.map((image, i) => ({
                ...image,
                x: viewportCenter.x - (image.width / 2) + (i * 40),
                y: viewportCenter.y - (image.height / 2) + (i * 40),
            }));
            const newImageIds = positionedImages.map(img => img.id);
            handleWorkspaceUpdate(prevImages => [...prevImages, ...positionedImages]);
            setManualSelectedImageIds(newImageIds);
        });
    }, [handleWorkspaceUpdate, workspaceCanvasRef, addLog]);

    const handleUndoCanvas = useCallback(() => {
        if (canvasHistoryIndex > 0) {
            const newIndex = canvasHistoryIndex - 1;
            addLog('action', 'Undo canvas state', { newIndex }, true);
            setCanvasHistoryIndex(newIndex);
            setWorkspaceImages(canvasHistory[newIndex]);
        }
    }, [canvasHistoryIndex, canvasHistory, addLog]);

    const handleRedoCanvas = useCallback(() => {
        if (canvasHistoryIndex < canvasHistory.length - 1) {
            const newIndex = canvasHistoryIndex + 1;
            addLog('action', 'Redo canvas state', { newIndex }, true);
            setCanvasHistoryIndex(newIndex);
            setWorkspaceImages(canvasHistory[newIndex]);
        }
    }, [canvasHistory, canvasHistoryIndex, addLog]);

    return {
        workspaceImages,
        setWorkspaceImages,
        manualSelectedImageIds,
        setManualSelectedImageIds,
        canvasHistory,
        canvasHistoryIndex,
        handleWorkspaceUpdate,
        handleDeleteSelected: () => handleDeleteSelected(manualSelectedImageIds),
        handleResetCanvas,
        handleAddImage,
        handleUndoCanvas,
        handleRedoCanvas,
    };
};