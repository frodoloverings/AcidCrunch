
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Tool, WorkspaceImage, LiveState } from './types';
import WorkspaceCanvas, { WorkspaceCanvasRef } from './components/WorkspaceCanvas';
import ImageEditor, { ImageEditorRef } from './components/ImageEditor';
import LeftToolbar from './components/LeftToolbar';
import RightToolbar from './components/RightToolbar';
import GenerationBar from './components/GenerationBar';
import Icon from './components/Icon';
import { useTranslations, Language } from './i18n';
import InfoModal from './components/InfoModal';
import Header from './components/Header';
import DonateModal from './components/DonateModal';
import HallOfFameModal from './components/HallOfFameModal';
import ChangelogModal from './components/ChangelogModal';
import AsciiBackground from './components/AsciiBackground';
import ActionLog from './components/ActionLog';
import PresetsModal from './components/PresetsModal';
import PromptEditorModal from './components/PromptEditorModal';
import ApiKeyModal from './components/ApiKeyModal';
import CameraModal from './components/CameraModal';
import GoogleDriveModal from './components/GoogleDriveModal';

import { useAppLog } from './hooks/useAppLog';
import { useWorkspace } from './hooks/useWorkspace';
import { useGenerationApi } from './hooks/useGenerationApi';
import { useLiveChat } from './hooks/useLiveChat';
import { useGoogleAuth } from './hooks/useGoogleAuth';


const App: React.FC = () => {
    // Refs
    const addImageInputRef = useRef<HTMLInputElement>(null);
    const workspaceCanvasRef = useRef<WorkspaceCanvasRef>(null);
    const imageEditorRef = useRef<ImageEditorRef>(null);

    // Simple UI State
    const [viewMode, setViewMode] = useState<'canvas' | 'editor'>('canvas');
    const [editingImageId, setEditingImageId] = useState<number | null>(null);
    const [isLogVisible, setIsLogVisible] = useState(false);
    const [isInfoVisible, setIsInfoVisible] = useState(false);
    const [isDonateVisible, setIsDonateVisible] = useState(false);
    const [isHallOfFameVisible, setIsHallOfFameVisible] = useState(false);
    const [isChangelogVisible, setIsChangelogVisible] = useState(false);
    const [showPresets, setShowPresets] = useState(false);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [isApiKeyModalVisible, setIsApiKeyModalVisible] = useState(false);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState(false);
    const [language, setLanguage] = useState<Language>('ru');
    const [canvasViewTransform, setCanvasViewTransform] = useState({ scale: 1, panX: 0, panY: 0 });
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const dragCounter = useRef(0);
    const [isAspectRatioEditorActive, setIsAspectRatioEditorActive] = useState(false);
    const [areCornersRounded, setAreCornersRounded] = useState(true);

    // Prompt & AI State
    const [userPrompt, setUserPrompt] = useState('');
    const [apiKey, setApiKey] = useState(process.env.API_KEY!);
    const [apiKeySource, setApiKeySource] = useState<'user' | 'studio'>('studio');
    const [isMagicPromptEnabled, setIsMagicPromptEnabled] = useState(false);
    const [isBadModeEnabled, setIsBadModeEnabled] = useState(false);
    const [isReasoningModeEnabled, setIsReasoningModeEnabled] = useState(false);
    const [aspectRatio, setAspectRatio] = useState<string>('Auto');
    const [queuedAction, setQueuedAction] = useState<{ name: string, args?: any } | null>(null);
    
    // Internationalization
    const t = useTranslations(language);

    // Custom Hooks for major logic separation
    const { logs, promptHistory, addLog, addPromptToHistory, setLogs } = useAppLog();

    const {
        isReady: isGoogleAuthReady,
        isAuthorized: isGoogleAuthorized,
        user: googleUser,
        driveFiles,
        isLoadingDriveFiles,
        error: googleAuthError,
        signIn: signInWithGoogle,
        signOut: signOutFromGoogle,
        loadDriveFiles,
        clearError: clearGoogleAuthError,
    } = useGoogleAuth();

    const handleOpenGoogleDrive = useCallback(() => {
        clearGoogleAuthError();
        setIsGoogleDriveModalOpen(true);
    }, [clearGoogleAuthError]);

    const handleGoogleSignIn = useCallback(() => {
        signInWithGoogle();
    }, [signInWithGoogle]);

    const handleGoogleSignOut = useCallback(() => {
        signOutFromGoogle();
        setIsGoogleDriveModalOpen(false);
        clearGoogleAuthError();
    }, [signOutFromGoogle, clearGoogleAuthError]);
    
    // Editor Tool State with logging wrappers
    const [activeTool, _setActiveTool] = useState<Tool>(Tool.Selection);
    const [brushColor, _setBrushColor] = useState('#EF4444');
    const [brushSize, _setBrushSize] = useState(20);
    const [editorHistoryCounter, setEditorHistoryCounter] = useState(0);

    const setActiveTool = useCallback((tool: Tool) => {
        addLog('ui', `Active tool changed to: ${tool}`, null, true);
        _setActiveTool(tool);
    }, [addLog]);

    const setBrushColor = useCallback((color: string) => {
        addLog('ui', `Brush color changed to: ${color}`, null, true);
        _setBrushColor(color);
    }, [addLog]);

    const setBrushSize = useCallback((size: number) => {
        addLog('ui', `Brush size changed to: ${size}`, null, true);
        _setBrushSize(size);
    }, [addLog]);
    
    const { 
        workspaceImages, handleWorkspaceUpdate, manualSelectedImageIds, setManualSelectedImageIds, 
        canvasHistoryIndex, canvasHistory, handleAddImage, handleDeleteSelected, 
        handleResetCanvas, handleUndoCanvas, handleRedoCanvas
    } = useWorkspace({ setLogs, setEditingImageId, workspaceCanvasRef, addLog });
    
    // Derived state for generation
    const promptReferenceNumbers = useMemo(() => {
        const matches = userPrompt.match(/@[1-9][0-9]*/g) || [];
        return matches
            .map(match => parseInt(match.substring(1), 10))
            .filter(ref => !Number.isNaN(ref));
    }, [userPrompt]);

    const workspaceImageMaps = useMemo(() => {
        const indexToId = new Map<number, number>();
        const imageById = new Map<number, WorkspaceImage>();

        workspaceImages.forEach((image, index) => {
            indexToId.set(index + 1, image.id);
            imageById.set(image.id, image);
        });

        return { indexToId, imageById };
    }, [workspaceImages]);

    const combinedSelectedImageIds = useMemo(() => {
        const referencedIds = promptReferenceNumbers
            .map(ref => workspaceImageMaps.indexToId.get(ref))
            .filter((id): id is number => typeof id === 'number');

        const allIds = new Set([...manualSelectedImageIds, ...referencedIds]);
        return Array.from(allIds);
    }, [promptReferenceNumbers, manualSelectedImageIds, workspaceImageMaps]);

    const selectedImages = useMemo(() => {
        return combinedSelectedImageIds
            .map(id => workspaceImageMaps.imageById.get(id))
            .filter((img): img is WorkspaceImage => !!img);
    }, [combinedSelectedImageIds, workspaceImageMaps]);

    const highlightedRefs = useMemo(() => {
        const validRefs = promptReferenceNumbers.filter(ref => workspaceImageMaps.indexToId.has(ref));
        return Array.from(new Set(validRefs));
    }, [promptReferenceNumbers, workspaceImageMaps]);

    useEffect(() => {
        try {
            const userApiKey = localStorage.getItem('userApiKey');
            const keySource = localStorage.getItem('apiKeySource') as 'user' | 'studio' | null;
            if (userApiKey && keySource === 'user') {
                setApiKey(userApiKey);
                setApiKeySource('user');
                addLog('action', 'Using user-provided API key.');
            } else {
                setApiKey(process.env.API_KEY!);
                setApiKeySource('studio');
            }
        } catch (e) {
            console.error("Could not access localStorage. Using default API key.", e);
            setApiKey(process.env.API_KEY!);
            setApiKeySource('studio');
        }
    }, [addLog]);

    useEffect(() => {
        if (isGoogleDriveModalOpen && isGoogleAuthorized) {
            void loadDriveFiles();
        }
    }, [isGoogleDriveModalOpen, isGoogleAuthorized, loadDriveFiles]);

    const ai = useMemo(() => new GoogleGenAI({ apiKey }), [apiKey]);

    const { 
        loadingAction, loadingMessage, error, setError, handleGenerate, handleReasoning, 
        handleEnhance, handleRtxGenerate, handleMix, handleRegenerate, handleResizeAndGenerate, handleReplicaGenerate,
        handleRefGenerate
    } = useGenerationApi({
        ai, userPrompt, isMagicPromptEnabled, isBadModeEnabled, selectedImages, workspaceImages, addLog, addPromptToHistory,
        handleWorkspaceUpdate, setManualSelectedImageIds, t, workspaceCanvasRef, combinedSelectedImageIds, aspectRatio
    });
    
    const handleSaveApiKey = (key: string) => {
        try {
            localStorage.setItem('userApiKey', key);
            localStorage.setItem('apiKeySource', 'user');
            setApiKey(key);
            setApiKeySource('user');
            addLog('action', 'Switched to user-provided API key.');
        } catch (e) {
            console.error("Could not save to localStorage.", e);
            setError("Could not save API key to local storage.");
        }
    };

    const handleUseStudioKey = () => {
        try {
            localStorage.removeItem('userApiKey');
            localStorage.setItem('apiKeySource', 'studio');
            setApiKey(process.env.API_KEY!);
            setApiKeySource('studio');
            addLog('action', 'Switched to Studio API key.');
        } catch (e) {
            console.error("Could not save to localStorage.", e);
            setError("Could not update API key source in local storage.");
        }
    };

    const handleAspectRatioEditorChange = useCallback((isActive: boolean) => {
        setIsAspectRatioEditorActive(isActive);
        if (isActive) {
            setActiveTool(Tool.Selection);
        }
    }, [setActiveTool]);

    // Combined Callbacks & Event Handlers
    const handleFocusOnImage = useCallback((imageId: number) => {
        workspaceCanvasRef.current?.focusOnImage(imageId);
    }, []);

    const handleDownload = useCallback(async () => {
        if (combinedSelectedImageIds.length !== 1) {
            setError(t('error.no_image_to_download'));
            return;
        }
        const annotatedImage = await workspaceCanvasRef.current?.getAnnotatedImage(combinedSelectedImageIds[0]);
        if (!annotatedImage) return;

        fetch(annotatedImage).then(res => res.blob()).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `edited-image-${Date.now()}.${blob.type.split('/')[1] || 'png'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }).catch(e => {
            console.error('Error downloading image:', e);
            setError('Не удалось скачать изображение.');
        });
    }, [combinedSelectedImageIds, setError, t]);
    
    const handleUndo = useCallback(() => {
        addLog('action', `Undo triggered in ${viewMode} view`, null, true);
        if (viewMode === 'canvas') {
            handleUndoCanvas();
            setError(null);
        } else {
            imageEditorRef.current?.undo();
        }
    }, [viewMode, handleUndoCanvas, addLog, setError]);

    const handleRedo = useCallback(() => {
        addLog('action', `Redo triggered in ${viewMode} view`, null, true);
        if (viewMode === 'canvas') {
            handleRedoCanvas();
            setError(null);
        } else {
            imageEditorRef.current?.redo();
        }
    }, [viewMode, handleRedoCanvas, addLog, setError]);

    const handleEnterEditMode = useCallback((imageId: number) => {
        addLog('ui', `Entering editor mode for image ID: ${imageId}`, null, true);
        setEditingImageId(imageId);
        setManualSelectedImageIds([imageId]);
        setViewMode('editor');
        setActiveTool(Tool.Selection);
    }, [addLog, setActiveTool]);

    const isReasoningActionable = isReasoningModeEnabled && selectedImages.length === 1 && !!userPrompt.trim() && !isAspectRatioEditorActive;

    const canGenerate = isAspectRatioEditorActive || !!userPrompt.trim() || (isMagicPromptEnabled && selectedImages.length > 0) || (isBadModeEnabled && selectedImages.length > 0) || isReasoningActionable;

    const onGenerateAction = useCallback(() => {
        if (isAspectRatioEditorActive) {
            workspaceCanvasRef.current?.confirmAspectRatioEdit();
        } else if (isReasoningActionable) {
            handleReasoning();
        }
        else {
            handleGenerate();
        }
    }, [isAspectRatioEditorActive, isReasoningActionable, handleGenerate, handleReasoning]);

    const handleCapture = useCallback((file: File) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        handleAddImage(dataTransfer.files);
        setIsCameraModalOpen(false);
    }, [handleAddImage]);

    const handleOpenCameraRequest = async () => {
        try {
            if (!navigator.permissions) {
                // For browsers that don't support Permissions API, just try to open.
                setIsCameraModalOpen(true);
                return;
            }
    
            const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
    
            if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
                setIsCameraModalOpen(true);
            } else if (permissionStatus.state === 'denied') {
                setError(t('error.cam_blocked'));
                addLog('error', "Camera access is blocked by the user.");
            }
        } catch (err) {
            console.error("Error checking camera permissions:", err);
            // Fallback if the query fails for some reason
            setIsCameraModalOpen(true);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isCmdOrCtrl = e.metaKey || e.ctrlKey;
            const key = e.key.toLowerCase();

            if (isCmdOrCtrl && key === 'enter') {
                if (isPromptModalOpen) return;
                e.preventDefault();
                if (canGenerate) onGenerateAction();
                return;
            }

            if (['INPUT', 'TEXTAREA'].includes(target.tagName) || isPromptModalOpen || isApiKeyModalVisible) return;
    
            const singleSelectedImageId = combinedSelectedImageIds.length === 1 ? combinedSelectedImageIds[0] : null;

            if (isCmdOrCtrl && !e.shiftKey && !e.altKey && (key === 'r' || key === 'к')) {
                e.preventDefault();
                if (singleSelectedImageId) {
                    const image = workspaceImages.find(img => img.id === singleSelectedImageId);
                    if (image?.generationContext) handleRegenerate(singleSelectedImageId);
                }
                return;
            }
    
            if (!isCmdOrCtrl && !e.shiftKey && !e.altKey && (key === 'r' || key === 'к')) { setIsReasoningModeEnabled(p => !p); } 
            else if (!isCmdOrCtrl && !e.shiftKey && !e.altKey && (key === 'm' || key === 'ь')) { setIsMagicPromptEnabled(p => !p); } 
            else if (!isCmdOrCtrl && !e.shiftKey && !e.altKey && (key === 'b' || key === 'и')) { setIsBadModeEnabled(p => !p); }
            else if (key === '+') { addImageInputRef.current?.click(); } 
            else if (!isCmdOrCtrl && !e.shiftKey && !e.altKey && (key === 'c' || key === 'с')) { handleOpenCameraRequest(); } 
            else if (!isCmdOrCtrl && !e.shiftKey && !e.altKey && (key === 'p' || key === 'з')) { setShowPresets(p => !p); } 
            else if (e.shiftKey && (key === 'a' || key === 'ф') && singleSelectedImageId) { workspaceCanvasRef.current?.enterAspectRatioMode(singleSelectedImageId); } 
            else if (e.shiftKey && (key === 'e' || key === 'у') && singleSelectedImageId) { handleEnterEditMode(singleSelectedImageId); } 
            else if (!isCmdOrCtrl && !e.shiftKey && !e.altKey && (key === 'e' || key === 'у') && singleSelectedImageId) { handleEnhance(); } 
            else if (e.shiftKey && (key === 's' || key === 'ы') && singleSelectedImageId) { handleDownload(); } 
            else if (!isCmdOrCtrl && !e.shiftKey && !e.altKey && (key === 't' || key === 'е')) { setIsPromptModalOpen(true); } 
            else if (isCmdOrCtrl && (key === 'z' || key === 'я')) { e.preventDefault(); e.shiftKey ? handleRedo() : handleUndo(); } 
            else if (isCmdOrCtrl && (key === 'y' || key === 'н')) { e.preventDefault(); handleRedo(); } 
            else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                viewMode === 'editor' ? imageEditorRef.current?.deleteActiveLayer() : handleDeleteSelected();
            } else {
                const toolMap: { [key: string]: Tool } = { 'v': Tool.Selection, 'м': Tool.Selection, 'h': Tool.Hand, 'р': Tool.Hand, 'l': Tool.Lasso, 'д': Tool.Lasso, 'a': Tool.Arrow, 'ф': Tool.Arrow, 'i': Tool.Text, 'ш': Tool.Text };
                if (!isCmdOrCtrl && !e.altKey && !e.shiftKey && toolMap[key]) { e.preventDefault(); setActiveTool(toolMap[key]); }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleDeleteSelected, onGenerateAction, handleUndo, handleRedo, isPromptModalOpen, canGenerate, combinedSelectedImageIds, handleEnhance, handleDownload, handleEnterEditMode, userPrompt, viewMode, handleRegenerate, workspaceImages, isApiKeyModalVisible, setActiveTool]);

    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            const target = event.target as HTMLElement;
            if (viewMode !== 'canvas' || ['INPUT', 'TEXTAREA'].includes(target.tagName) || isPromptModalOpen || isApiKeyModalVisible) return;
            const items = event.clipboardData?.items;
            if (!items) return;
            const imageFiles = Array.from(items).filter(item => item.type.startsWith('image/')).map(item => item.getAsFile()).filter((file): file is File => file !== null);
            if (imageFiles.length > 0) {
                event.preventDefault();
                const dataTransfer = new DataTransfer();
                imageFiles.forEach(file => dataTransfer.items.add(file));
                handleAddImage(dataTransfer.files);
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [viewMode, isPromptModalOpen, handleAddImage, isApiKeyModalVisible]);

    const handleClear = () => {
        addLog('action', `Clear triggered in ${viewMode} view`, null, true);
        if (viewMode === 'canvas') handleResetCanvas();
        else if (viewMode === 'editor') imageEditorRef.current?.clearAnnotations();
    };

    const handleFocus = useCallback(() => {
        addLog('action', `Focus triggered in ${viewMode} view`, null, true);
        if (viewMode === 'canvas') {
            if (isAspectRatioEditorActive && combinedSelectedImageIds.length === 1) {
                workspaceCanvasRef.current?.focusOnImage(combinedSelectedImageIds[0]);
            } else if (!isAspectRatioEditorActive) {
                workspaceCanvasRef.current?.resetView();
            }
        } else if (viewMode === 'editor') {
            imageEditorRef.current?.resetView();
        }
    }, [viewMode, isAspectRatioEditorActive, combinedSelectedImageIds, addLog]);

    const handleEditorSaveAndExit = (editedImageState: WorkspaceImage) => {
        addLog('ui', `Exiting editor mode for image ID: ${editingImageId}`, null, true);
        handleWorkspaceUpdate(workspaceImages.map(img => img.id === editingImageId ? { ...img, ...editedImageState } : img));
        setManualSelectedImageIds([editingImageId!]);
        setEditingImageId(null);
        setViewMode('canvas');
        setActiveTool(Tool.Selection);
    };

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDraggingOver(true);
    }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); dragCounter.current--;
        if (dragCounter.current === 0) setIsDraggingOver(false);
    }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); dragCounter.current = 0;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleAddImage(e.dataTransfer.files);
    }, [handleAddImage]);
    
    const canUndo = viewMode === 'canvas' ? canvasHistoryIndex > 0 : (imageEditorRef.current ? imageEditorRef.current.canUndo() : false);
    const canRedo = viewMode === 'canvas' ? canvasHistoryIndex < canvasHistory.length - 1 : (imageEditorRef.current ? imageEditorRef.current.canRedo() : false);
    
    // --- Voice Control Integration ---
    const [liveTranscript, setLiveTranscript] = useState<{ user: string; model: string } | null>(null);
    const [messageHistory, setMessageHistory] = useState<{ sender: 'USER' | 'AI'; text: string }[]>([]);

    const handleFunctionCall = useCallback((name: string, args: any) => {
        addLog('action', `Voice command received: ${name}`, args);
        const singleSelectedId = combinedSelectedImageIds.length === 1 ? combinedSelectedImageIds[0] : null;
        switch (name) {
            case 'generate':
                setUserPrompt(args.prompt || '');
                setQueuedAction({ name: 'generate' });
                break;
            case 'enhance':
                if (singleSelectedId) setQueuedAction({ name: 'enhance' });
                break;
            case 'regenerate':
                if (singleSelectedId) setQueuedAction({ name: 'regenerate', args: { imageId: singleSelectedId } });
                break;
            case 'mix':
                if (singleSelectedId) setQueuedAction({ name: 'mix' });
                break;
            case 'undo':
                handleUndo();
                break;
            case 'redo':
                handleRedo();
                break;
            case 'deleteSelection':
                handleDeleteSelected();
                break;
            case 'reset':
                handleResetCanvas();
                break;
            case 'showPresets':
                setShowPresets(true);
                break;
            case 'download':
                 if (singleSelectedId) handleDownload();
                break;
            case 'changeTool':
                if (viewMode === 'editor' && Object.values(Tool).includes(args.tool)) {
                    setActiveTool(args.tool as Tool);
                }
                break;
            case 'exitEditor':
                if (viewMode === 'editor') {
                    imageEditorRef.current?.saveAndExit();
                }
                break;
            case 'selectImage':
                if (args.imageNumbers && Array.isArray(args.imageNumbers)) {
                    const idsToSelect = args.imageNumbers
                        .map((num: any) => {
                            // Sanitize input: handle numbers, strings like "1", and strings like "@1"
                            const parsedNum = parseInt(String(num).replace('@', ''), 10);
                            if (isNaN(parsedNum)) {
                                return null;
                            }

                            const index = parsedNum - 1; // Model provides 1-based, we need 0-based
                            if (index >= 0 && index < workspaceImages.length) {
                                return workspaceImages[index].id;
                            }
                            return null;
                        })
                        .filter((id: number | null): id is number => id !== null);

                    if (idsToSelect.length > 0) {
                        setManualSelectedImageIds(idsToSelect);
                    }
                }
                break;
            case 'clearSelection':
                setManualSelectedImageIds([]);
                break;
            default:
                addLog('error', `Unknown voice command: ${name}`, args);
        }
    }, [addLog, combinedSelectedImageIds, viewMode, handleUndo, handleRedo, handleDeleteSelected, handleResetCanvas, handleDownload, setActiveTool, workspaceImages]);

    const { liveState, startSession, stopSession } = useLiveChat({
        ai,
        onFunctionCall: handleFunctionCall,
        onTranscriptUpdate: setLiveTranscript,
        onMessageHistoryUpdate: (message) => setMessageHistory(prev => [...prev, message]),
    });
    
     useEffect(() => {
        if (queuedAction) {
            const { name, args } = queuedAction;
            // This effect runs after the render, so `userPrompt` state is updated.
            if (name === 'generate') onGenerateAction();
            if (name === 'enhance') handleEnhance();
            if (name === 'regenerate') handleRegenerate(args.imageId);
            if (name === 'mix') handleMix();
            setQueuedAction(null);
        }
    }, [queuedAction, onGenerateAction, handleEnhance, handleRegenerate, handleMix]);
    
    const handleStartVoiceSession = async () => {
        try {
            if (!navigator.permissions) {
                // Fallback for browsers that don't support the Permissions API
                startSession();
                return;
            }

            const permissionName = 'microphone' as PermissionName;
            const permissionStatus = await navigator.permissions.query({ name: permissionName });

            if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
                startSession();
            } else if (permissionStatus.state === 'denied') {
                setError(t('error.mic_blocked'));
                addLog('error', "Microphone access is blocked by the user.");
            }
        } catch (err) {
            console.error("Error checking microphone permissions:", err);
            // Fallback if the query fails for some reason
            startSession();
        }
    };

    return (
        <div className="h-screen w-screen fixed inset-0 overflow-hidden text-gray-200" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
            {viewMode === 'canvas' && (
                <Header
                    language={language}
                    onLanguageChange={setLanguage}
                    onShowDonate={() => setIsDonateVisible(true)}
                    onShowHallOfFame={() => setIsHallOfFameVisible(true)}
                    onShowChangelog={() => setIsChangelogVisible(true)}
                    onShowLog={() => setIsLogVisible(true)}
                    onShowInfo={() => setIsInfoVisible(true)}
                    onShowApiKeyModal={() => setIsApiKeyModalVisible(true)}
                    apiKeySource={apiKeySource}
                    areCornersRounded={areCornersRounded}
                    onCornersRoundedChange={setAreCornersRounded}
                    t={t}
                    onShowGoogleDrive={handleOpenGoogleDrive}
                    onGoogleSignIn={handleGoogleSignIn}
                    onGoogleSignOut={handleGoogleSignOut}
                    isGoogleAuthorized={isGoogleAuthorized}
                    isGoogleReady={isGoogleAuthReady}
                    googleUser={googleUser}
                />
            )}
            
            {viewMode === 'canvas' ? <AsciiBackground viewTransform={canvasViewTransform} /> : <div className="absolute inset-0 bg-black" />}

            {viewMode === 'canvas' && (
                <WorkspaceCanvas ref={workspaceCanvasRef} images={workspaceImages} selectedImageIds={combinedSelectedImageIds} highlightedRefs={highlightedRefs} initialTransform={canvasViewTransform} onWorkspaceUpdate={handleWorkspaceUpdate} onSelectImages={setManualSelectedImageIds} onEditRequest={handleEnterEditMode} onViewTransformChange={setCanvasViewTransform} onDownload={handleDownload} onDelete={handleDeleteSelected} onResizeAndGenerate={handleResizeAndGenerate} loadingMessage={loadingMessage} t={t} onAspectRatioEditorChange={handleAspectRatioEditorChange} onEnhance={handleEnhance} onRtxGenerate={handleRtxGenerate} onMix={handleMix} onRefGenerate={handleRefGenerate} onRegenerate={handleRegenerate} onReplicaGenerate={handleReplicaGenerate} loadingAction={loadingAction} tool={activeTool} areCornersRounded={areCornersRounded} />
            )}

            {viewMode === 'editor' && workspaceImages.find(img => img.id === editingImageId) && (
                <div className="absolute inset-y-4 inset-x-4 md:inset-x-24 z-10">
                    <ImageEditor ref={imageEditorRef} image={workspaceImages.find(img => img.id === editingImageId)!} onSaveAndExit={handleEditorSaveAndExit} tool={activeTool} onToolChange={setActiveTool} brushColor={brushColor} brushSize={brushSize} onTextEditEnd={() => setActiveTool(Tool.Selection)} t={t} onHistoryUpdate={() => setEditorHistoryCounter(c => c + 1)} areCornersRounded={areCornersRounded} />
                </div>
            )}
            
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 md:left-4 md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:translate-x-0">
                {viewMode === 'editor' && (
                    <LeftToolbar activeTool={activeTool} onToolChange={setActiveTool} brushColor={brushColor} onBrushColorChange={setBrushColor} brushSize={brushSize} onBrushSizeChange={setBrushSize} onConfirmEdits={() => imageEditorRef.current?.saveAndExit()} onAddLayer={() => imageEditorRef.current?.addLayer()} t={t} />
                )}
            </div>
            
            <div className="fixed top-1/2 -translate-y-1/2 right-4 z-20">
                <RightToolbar onUndo={handleUndo} onRedo={handleRedo} canUndo={canUndo} canRedo={canRedo} onClear={handleClear} onFocus={handleFocus} activeTool={activeTool} onToolChange={setActiveTool} context={viewMode} t={t} canClear={!isAspectRatioEditorActive} />
            </div>

            {viewMode === 'canvas' && (
                <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto z-20">
                    {error && (
                        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative text-center w-full mb-2">
                            <span>{error}</span>
                            <button onClick={handleUndo} className="ml-4 underline font-semibold">{t('button.back')}</button>
                        </div>
                    )}
                    <GenerationBar
                        userPrompt={userPrompt}
                        onUserPromptChange={setUserPrompt}
                        onGenerate={onGenerateAction}
                        loadingAction={loadingAction}
                        canGenerate={canGenerate}
                        language={language}
                        isMagicPromptEnabled={isMagicPromptEnabled}
                        onMagicPromptToggle={() => setIsMagicPromptEnabled(p => !p)}
                        isBadModeEnabled={isBadModeEnabled}
                        onBadModeToggle={() => setIsBadModeEnabled(p => !p)}
                        isReasoningModeEnabled={isReasoningModeEnabled}
                        onReasoningModeToggle={() => setIsReasoningModeEnabled(p => !p)}
                        selectedImages={selectedImages}
                        workspaceImages={workspaceImages}
                        highlightedRefs={highlightedRefs}
                        onExpandPromptEditor={() => setIsPromptModalOpen(true)}
                        onClearPrompt={() => setUserPrompt('')}
                        onAddImage={() => addImageInputRef.current?.click()}
                        onOpenCamera={handleOpenCameraRequest}
                        onShowPresets={() => setShowPresets(true)}
                        onFocusOnImage={handleFocusOnImage}
                        isAspectRatioEditorActive={isAspectRatioEditorActive}
                        t={t}
                        aspectRatio={aspectRatio}
                        onAspectRatioChange={setAspectRatio}
                        liveState={liveState}
                        startSession={handleStartVoiceSession}
                        stopSession={stopSession}
                        liveTranscript={liveTranscript}
                    />
                </div>
            )}
             
            <PresetsModal isOpen={showPresets} onClose={() => setShowPresets(false)} onPresetClick={(prompt) => setUserPrompt(p => p ? `${p}\n${prompt}` : prompt)} language={language} t={t} />
            <InfoModal isOpen={isInfoVisible} onClose={() => setIsInfoVisible(false)} t={t} />
            <PromptEditorModal isOpen={isPromptModalOpen} initialPrompt={userPrompt} onSave={setUserPrompt} onClose={() => setIsPromptModalOpen(false)} t={t} />
            <DonateModal isOpen={isDonateVisible} onClose={() => setIsDonateVisible(false)} t={t} />
            <HallOfFameModal isOpen={isHallOfFameVisible} onClose={() => setIsHallOfFameVisible(false)} t={t} />
            <ChangelogModal isOpen={isChangelogVisible} onClose={() => setIsChangelogVisible(false)} t={t} />
            <ApiKeyModal
                isOpen={isApiKeyModalVisible}
                onClose={() => setIsApiKeyModalVisible(false)}
                onSave={handleSaveApiKey}
                onUseStudioKey={handleUseStudioKey}
                currentKeySource={apiKeySource}
                t={t}
            />
            <GoogleDriveModal
                isOpen={isGoogleDriveModalOpen}
                onClose={() => {
                    clearGoogleAuthError();
                    setIsGoogleDriveModalOpen(false);
                }}
                isAuthorized={isGoogleAuthorized}
                isReady={isGoogleAuthReady}
                user={googleUser}
                driveFiles={driveFiles}
                isLoading={isLoadingDriveFiles}
                error={googleAuthError}
                onSignIn={handleGoogleSignIn}
                onSignOut={handleGoogleSignOut}
                onRefresh={() => { void loadDriveFiles(); }}
                onClearError={clearGoogleAuthError}
            />
             <CameraModal
                isOpen={isCameraModalOpen}
                onClose={() => setIsCameraModalOpen(false)}
                onCapture={handleCapture}
                t={t}
            />
            
            <input type="file" ref={addImageInputRef} className="hidden" accept="image/*" multiple onChange={(e) => { handleAddImage(e.target.files); if(e.target) e.target.value = ''; }} />
            
            {isLogVisible && <ActionLog logs={logs} promptHistory={promptHistory} onClose={() => setIsLogVisible(false)} t={t} />}

            {isDraggingOver && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
                    <div className="w-11/12 h-5/6 border-4 border-dashed border-[#d1fe17] rounded-3xl flex flex-col items-center justify-center text-white">
                         <Icon name="upload" className="w-24 h-24 text-[#d1fe17]" />
                        <p className="text-3xl font-bold mt-4">{t('drop_zone.title')}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;