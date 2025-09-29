
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { GENERATE_PROMPT, MAGIC_PROMPT_SYSTEM_INSTRUCTION, REASONING_SYSTEM_INSTRUCTION } from './constants';
import { Tool, AnyLayer, LogEntry, WorkspaceImage, Preset, PresetCategory, PresetTags, ArrowLayer, TextLayer, PromptHistoryEntry } from './types';
import WorkspaceCanvas, { WorkspaceCanvasRef } from './components/WorkspaceCanvas';
import ImageEditor, { ImageEditorRef } from './components/ImageEditor';
import LeftToolbar from './components/LeftToolbar';
import RightToolbar from './components/RightToolbar';
import GenerationBar from './components/GenerationBar';
import Icon from './components/Icon';
import { useTranslations, Language } from './i18n';
import { getPresetData } from './presets';
import InfoModal from './components/InfoModal';
import Header from './components/Header';
import DonateModal from './components/DonateModal';
import HallOfFameModal from './components/HallOfFameModal';
import ChangelogModal from './components/ChangelogModal';
import AsciiBackground from './components/AsciiBackground';
import ApiKeyModal from './components/ApiKeyModal';


interface ActionLogProps {
    logs: LogEntry[];
    promptHistory: PromptHistoryEntry[];
    onClose: () => void;
    t: (key: string) => string;
}

const ActionLog: React.FC<ActionLogProps> = ({ logs, promptHistory, onClose, t }) => {
    const [activeTab, setActiveTab] = useState<'log' | 'history'>('log');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const getLogAppearance = (type: LogEntry['type']) => {
        switch (type) {
            case 'action': return { icon: '>', color: 'text-cyan-400' };
            case 'api_request': return { icon: '↑', color: 'text-orange-400' };
            case 'api_response': return { icon: '↓', color: 'text-green-400' };
            case 'error': return { icon: '!', color: 'text-red-400' };
            default: return { icon: '?', color: 'text-gray-400' };
        }
    };

    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeTab === 'log') {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, activeTab]);

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="relative flex flex-col bg-[#1c1c1c] rounded-2xl p-6 shadow-2xl border border-[#262626] w-full max-w-2xl max-h-[80vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-2xl font-bold text-white">Console</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex border-b border-white/10 mb-4 flex-shrink-0">
                    <button 
                        onClick={() => setActiveTab('log')}
                        className={`py-2 px-4 font-semibold transition-colors ${activeTab === 'log' ? 'text-[#d1fe17] border-b-2 border-[#d1fe17]' : 'text-gray-400 hover:text-white'}`}
                    >
                        Action Log
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`py-2 px-4 font-semibold transition-colors ${activeTab === 'history' ? 'text-[#d1fe17] border-b-2 border-[#d1fe17]' : 'text-gray-400 hover:text-white'}`}
                    >
                        Prompt History
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto space-y-2 pr-2 bg-[#111] p-3 rounded-lg font-mono text-sm">
                    {activeTab === 'log' && (
                        <>
                            {logs.length === 0 ? (
                                <p className="text-gray-500">{t('log.empty')}</p>
                            ) : (
                                logs.map((log, index) => {
                                    const { icon, color } = getLogAppearance(log.type);
                                    return (
                                        <div key={index} className="flex items-start gap-3">
                                            <span className="text-gray-500 whitespace-nowrap">{log.timestamp}</span>
                                            <span className={`font-bold ${color}`}>{icon}</span>
                                            <div className="flex-1 break-words">
                                                <p className="text-gray-200">{log.message}</p>
                                                {log.payload && (
                                                    <pre className="mt-1 text-xs bg-black/30 p-2 rounded-md overflow-x-auto text-gray-400 whitespace-pre-wrap">
                                                        {JSON.stringify(log.payload, null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={logsEndRef} />
                        </>
                    )}
                    {activeTab === 'history' && (
                         <>
                            {promptHistory.length === 0 ? (
                                <p className="text-gray-500">No prompts in history yet.</p>
                            ) : (
                                [...promptHistory].reverse().map((entry, index) => {
                                    const originalIndex = promptHistory.length - 1 - index;
                                    return (
                                        <div key={originalIndex} className="bg-black/30 p-3 rounded-md group relative">
                                            {entry.tags && entry.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {entry.tags.map(tag => (
                                                        <span key={tag} className="px-2 py-0.5 bg-[#2a2a2a] text-[#d1fe17] text-xs font-bold rounded-full">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-gray-300 whitespace-pre-wrap">{entry.prompt}</p>
                                            <button 
                                                onClick={() => handleCopy(entry.prompt, originalIndex)}
                                                className="absolute top-2 right-2 px-2 py-1 bg-[#2a2a2a] text-gray-400 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#383838] hover:text-white"
                                            >
                                                {copiedIndex === originalIndex ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const PresetsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onPresetClick: (prompt: string) => void;
    language: Language;
    t: (key: string) => string;
}> = ({ isOpen, onClose, onPresetClick, language, t }) => {
    const [openCategory, setOpenCategory] = useState<string | null>(null);
    const [activeTag, setActiveTag] = useState<PresetTags | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const presetsRef = useRef<HTMLDivElement>(null);
    const presetsListRef = useRef<HTMLDivElement>(null);
    const scrollPositionRef = useRef<number>(0);
    const PRESET_DATA = getPresetData(language);

const handleClosePresets = useCallback(() => {
    const list = presetsListRef.current;
    if (list) {
        scrollPositionRef.current = list.scrollTop;
        try { sessionStorage.setItem('presetsScrollTop', String(scrollPositionRef.current)); } catch {}
    }
    onClose();
}, [onClose]);

    const totalPresets = useMemo(() => {
        return PRESET_DATA.reduce((acc, category) => acc + category.presets.length, 0);
    }, [PRESET_DATA]);

    const tagOrder = [PresetTags.CHARACTER, PresetTags.ENVIRONMENT, PresetTags.STYLE, PresetTags.RETOUCH, PresetTags.COMPOSITION, PresetTags.DESIGN, PresetTags.D3];

    const filteredPresetData = useMemo(() => {
        let data = PRESET_DATA;
        // Tag filter
        if (activeTag) {
            data = data.map(category => ({
                ...category,
                presets: category.presets.filter(preset => preset.tag === activeTag)
            })).filter(category => category.presets.length > 0);
        }
        // Search filter
        if (searchQuery.trim()) {
            const lowercasedQuery = searchQuery.toLowerCase();
            data = data.map(category => ({
                ...category,
                presets: category.presets.filter(preset => 
                    preset.name.toLowerCase().includes(lowercasedQuery) ||
                    (preset.description && preset.description.toLowerCase().includes(lowercasedQuery)) ||
                    preset.prompt.toLowerCase().includes(lowercasedQuery)
                )
            })).filter(category => category.presets.length > 0);
        }
        return data;
    }, [activeTag, searchQuery, PRESET_DATA]);

    const handleToggleCategory = (categoryName: string) => {
        setOpenCategory(prev => prev === categoryName ? null : categoryName);
    };
    
    const handleTagClick = (tag: PresetTags | null) => {
        setActiveTag(tag);
        setOpenCategory(null);
    };

    useEffect(() => {
    const modalEl = presetsRef.current;
    const listEl = presetsListRef.current;

    const handleClickOutside = (event: MouseEvent) => {
        if (modalEl && !modalEl.contains(event.target as Node)) {
            if (listEl) {
                scrollPositionRef.current = listEl.scrollTop;
                try { sessionStorage.setItem('presetsScrollTop', String(scrollPositionRef.current)); } catch {}
            }
            onClose();
        }
    };

    if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);

        try {
            const saved = sessionStorage.getItem('presetsScrollTop');
            if (saved) {
                const n = Number(saved);
                if (!Number.isNaN(n)) scrollPositionRef.current = n;
            }
        } catch {}

        const raf = requestAnimationFrame(() => {
            if (listEl) listEl.scrollTop = scrollPositionRef.current;
        });

        return () => {
            cancelAnimationFrame(raf);
            document.removeEventListener('mousedown', handleClickOutside);
            if (listEl) {
                scrollPositionRef.current = listEl.scrollTop;
                try { sessionStorage.setItem('presetsScrollTop', String(scrollPositionRef.current)); } catch {}
            }
        };
    }

    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
}, [isOpen, onClose]);
if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40" onClick={handleClosePresets}>
            <div ref={presetsRef} onClick={e => e.stopPropagation()} className="absolute w-full max-w-2xl bg-[#1c1c1c] rounded-2xl p-4 shadow-2xl border border-[#262626] max-h-[70vh] overflow-y-auto z-10 flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-xl font-bold text-white">{t('presets.title')} ({totalPresets})</h3>
                    <button onClick={handleClosePresets} className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                 <div className="mb-4 flex-shrink-0">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('presets.search_placeholder')}
                        className="w-full bg-[#111] border border-[#363636] rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d1fe17]"
                    />
                </div>
                <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0 border-b border-white/10 pb-4">
                    <button onClick={() => handleTagClick(null)} className={`px-3 py-1 text-sm rounded-full transition-colors capitalize font-bold ${!activeTag ? 'bg-[#d1fe17] text-black' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#383838]'}`}>{t('presets.tags.all')}</button>
                    {tagOrder.map(tag => (
                        <button key={tag} onClick={() => handleTagClick(tag)} className={`px-3 py-1 text-sm rounded-full transition-colors capitalize font-bold ${activeTag === tag ? 'bg-[#d1fe17] text-black' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#383838]'}`}>{t(`presets.tags.${tag}`)}</button>
                    ))}
                </div>
                <div ref={presetsListRef} className="space-y-2 overflow-y-auto pr-2">
                    {filteredPresetData.map((category) => (
                        <div key={category.category}>
                            <button onClick={() => handleToggleCategory(category.category)} className="w-full text-left p-3 bg-[#2a2a2a] hover:bg-[#383838] rounded-lg transition-colors text-gray-200 flex justify-between items-center">
                                <h4 className="text-lg font-semibold">{category.emoji} {category.category}</h4>
                                <Icon name={openCategory === category.category ? 'chevron-up' : 'chevron-down'} className="w-5 h-5 transition-transform" />
                            </button>
                            <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: openCategory === category.category ? '1000px' : '0px' }}>
                                <div className="pt-2 pl-4 border-l-2 border-gray-700 ml-4 mt-1 flex flex-col gap-2">
                                    {category.presets.map((preset) => (
                                        <button key={preset.name} onClick={() => { onPresetClick(preset.prompt); onClose(); }} className="text-left p-3 bg-black/20 hover:bg-white/10 rounded-lg transition-colors text-gray-300">
                                            <p className="font-semibold">{preset.name}</p>
                                            {preset.description && <p className="text-sm text-gray-400 mt-1">{preset.description}</p>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PromptEditorModal: React.FC<{
    isOpen: boolean;
    initialPrompt: string;
    onSave: (newPrompt: string) => void;
    onClose: () => void;
    t: (key: string) => string;
}> = ({ isOpen, initialPrompt, onSave, onClose, t }) => {
    const [prompt, setPrompt] = useState(initialPrompt);

    useEffect(() => {
        if (isOpen) {
            setPrompt(initialPrompt);
        }
    }, [isOpen, initialPrompt]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(prompt);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="relative flex flex-col bg-[#1c1c1c] rounded-2xl p-6 shadow-2xl border border-[#262626] w-full max-w-2xl h-[70vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-2xl font-bold text-white">{t('prompt_modal.title')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('generate_bar.placeholder')}
                    className="flex-grow w-full bg-[#111] border border-[#363636] rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d1fe17] resize-none text-lg"
                    autoFocus
                />
                <div className="flex justify-end gap-4 mt-4 flex-shrink-0">
                    <button onClick={onClose} className="bg-[#2a2a2a] hover:bg-[#383838] text-gray-200 font-bold py-2 px-6 rounded-lg transition-colors">
                        {t('prompt_modal.cancel')}
                    </button>
                    <button onClick={handleSave} className="bg-[#d1fe17] hover:bg-lime-300 text-black font-bold py-2 px-6 rounded-lg transition-colors">
                        {t('prompt_modal.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [viewMode, setViewMode] = useState<'canvas' | 'editor'>('canvas');
    const [editingImageId, setEditingImageId] = useState<number | null>(null);

    const [workspaceImages, setWorkspaceImages] = useState<WorkspaceImage[]>([]);
    const [manualSelectedImageIds, setManualSelectedImageIds] = useState<number[]>([]);
    
    const [loadingAction, setLoadingAction] = useState<'generate' | 'reasoning' | 'enhance' | 'rtx' | 'mix' | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [userPrompt, setUserPrompt] = useState('');
    
    const addImageInputRef = useRef<HTMLInputElement>(null);
    const workspaceCanvasRef = useRef<WorkspaceCanvasRef>(null);
    const imageEditorRef = useRef<ImageEditorRef>(null);
    
    const handleFocusOnImage = useCallback((imageId: number) => {
        workspaceCanvasRef.current?.focusOnImage(imageId);
    }, []);

    const [canvasHistory, setCanvasHistory] = useState<WorkspaceImage[][]>([[]]);
    const [canvasHistoryIndex, setCanvasHistoryIndex] = useState(0);
    
    const [isLogVisible, setIsLogVisible] = useState(false);
    const [isInfoVisible, setIsInfoVisible] = useState(false);
    const [isDonateVisible, setIsDonateVisible] = useState(false);
    const [isHallOfFameVisible, setIsHallOfFameVisible] = useState(false);
    const [isChangelogVisible, setIsChangelogVisible] = useState(false);
    const [isApiKeyModalVisible, setIsApiKeyModalVisible] = useState(false);
    const [apiKeySource, setApiKeySource] = useState<'user' | 'studio'>(() => {
        try {
            return localStorage.getItem('apiKey') ? 'user' : 'studio';
        } catch {
            return 'studio';
        }
    });
    const [apiKey, setApiKey] = useState<string | null>(() => {
        try {
            return localStorage.getItem('apiKey');
        } catch {
            return null;
        }
    });
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [promptHistory, setPromptHistory] = useState<PromptHistoryEntry[]>([]);
    const [language, setLanguage] = useState<Language>('en');
    const [isMagicPromptEnabled, setIsMagicPromptEnabled] = useState(false);
    const [showPresets, setShowPresets] = useState(false);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const dragCounter = useRef(0);
    const [isAspectRatioEditorActive, setIsAspectRatioEditorActive] = useState(false);
    
    const [editorHistoryCounter, setEditorHistoryCounter] = useState(0);

    const [canvasViewTransform, setCanvasViewTransform] = useState({ scale: 1, panX: 0, panY: 0 });
    
    const t = useTranslations(language);

    const handleEditorHistoryUpdate = useCallback(() => {
        setEditorHistoryCounter(c => c + 1);
    }, []);

    const ai = useMemo(() => {
        const key = apiKeySource === 'user' && apiKey ? apiKey : process.env.API_KEY;
        return new GoogleGenAI({ apiKey: key! });
    }, [apiKey, apiKeySource]);

    const [activeTool, setActiveTool] = useState<Tool>(Tool.Hand);
    const [brushColor, setBrushColor] = useState('#EF4444'); // red-500
    const [brushSize, setBrushSize] = useState(20);

    const [highlightedRefs, setHighlightedRefs] = useState<number[]>([]);
    
    const editingImage = useMemo(() => workspaceImages.find(img => img.id === editingImageId), [workspaceImages, editingImageId]);
    
    const combinedSelectedImageIds = useMemo(() => {
        const referencedIds = (userPrompt.match(/@[1-9][0-9]*/g) || [])
            .map(ref => parseInt(ref.substring(1)))
            .filter(num => num > 0 && num <= workspaceImages.length)
            .map(num => workspaceImages[num - 1].id);

        const allIds = new Set([...manualSelectedImageIds, ...referencedIds]);
        return Array.from(allIds);
    }, [userPrompt, workspaceImages, manualSelectedImageIds]);

    const selectedImages = useMemo(() => {
        const selectedMap = new Map(combinedSelectedImageIds.map(id => [id, workspaceImages.find(img => img.id === id)]));
        return combinedSelectedImageIds.map(id => selectedMap.get(id)).filter((img): img is WorkspaceImage => !!img);
    }, [combinedSelectedImageIds, workspaceImages]);


    const handleViewTransformChange = useCallback((transform: { panX: number; panY: number; scale: number; }) => {
        setCanvasViewTransform(transform);
    }, []);

    useEffect(() => {
        const matches = userPrompt.match(/@[1-9][0-9]*/g) || [];
        const refs = matches.map(m => parseInt(m.substring(1)));
        setHighlightedRefs(Array.from(new Set(refs)));
    }, [userPrompt]);

    const addLog = useCallback((type: LogEntry['type'], message: string, payload?: any) => {
        const timestamp = new Date().toLocaleTimeString('ru-RU');
        setLogs(prev => [...prev, { timestamp, type, message, payload }]);
    }, []);

    const addPromptToHistory = useCallback((prompt: string, tags: string[] = []) => {
        if (!prompt || !prompt.trim()) return;
        setPromptHistory(prev => {
            if (prev.length > 0) {
                const lastEntry = prev[prev.length - 1];
                if (lastEntry.prompt === prompt && JSON.stringify(lastEntry.tags.sort()) === JSON.stringify(tags.sort())) {
                    return prev;
                }
            }
            const newHistory = [...prev, { prompt, tags }];
            if (newHistory.length > 100) { // Keep last 100 prompts
                return newHistory.slice(newHistory.length - 100);
            }
            return newHistory;
        });
    }, []);
    
    const handleSaveApiKey = (key: string) => {
        try {
            localStorage.setItem('apiKey', key);
            setApiKey(key);
            setApiKeySource('user');
        } catch (e) {
            console.error("Failed to save API key to localStorage", e);
            setError("Could not save API key. Local storage might be disabled.");
        }
    };

    const handleUseStudioKey = () => {
        try {
            localStorage.removeItem('apiKey');
            setApiKey(null);
            setApiKeySource('studio');
        } catch (e) {
            console.error("Failed to remove API key from localStorage", e);
        }
    };

    const updateCanvasHistory = useCallback((newWorkspaceState: WorkspaceImage[]) => {
        const newHistory = canvasHistory.slice(0, canvasHistoryIndex + 1);
        newHistory.push(newWorkspaceState);
        setCanvasHistory(newHistory);
        setCanvasHistoryIndex(newHistory.length - 1);
    }, [canvasHistory, canvasHistoryIndex]);

    const handleWorkspaceUpdate = useCallback((newImages: WorkspaceImage[], addToHistory: boolean = true) => {
        setWorkspaceImages(newImages);
        if (addToHistory) {
            updateCanvasHistory(newImages);
        }
    }, [updateCanvasHistory]);

    const handleDeleteSelected = useCallback(() => {
        if (combinedSelectedImageIds.length === 0) return;
        const newImages = workspaceImages.filter(img => !combinedSelectedImageIds.includes(img.id));
        handleWorkspaceUpdate(newImages);
        setManualSelectedImageIds([]);
    }, [combinedSelectedImageIds, workspaceImages, handleWorkspaceUpdate]);
    
    const handleResetCanvas = useCallback(() => {
        handleWorkspaceUpdate([]);
        setManualSelectedImageIds([]);
        setError(null);
        setUserPrompt('');
        setLogs([]);
        setEditingImageId(null);
        setViewMode('canvas');
    }, [handleWorkspaceUpdate]);
    
    const handleAddImageClick = () => {
        addImageInputRef.current?.click();
    };
    
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
                            x: 0, 
                            y: 0,
                            width: newWidth,
                            height: newHeight,
                            originalWidth: img.width,
                            originalHeight: img.height,
                            layers: [],
                            annotationHistory: [{ layers: [] }],
                            annotationHistoryIndex: 0,
                        });
                    };
                    img.src = URL.createObjectURL(file);
                });
            });
    
        Promise.all(newImagesPromises).then(newImages => {
            if (newImages.length === 0) return;
    
            const viewportCenter = workspaceCanvasRef.current?.getViewportCenter() || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            
            const positionedImages = newImages.map((image, i) => ({
                ...image,
                x: viewportCenter.x - (image.width / 2) + (i * 40),
                y: viewportCenter.y - (image.height / 2) + (i * 40),
            }));

            const newImageIds = positionedImages.map(img => img.id);
            handleWorkspaceUpdate([...workspaceImages, ...positionedImages]);
            setManualSelectedImageIds(newImageIds);
        });
    }, [workspaceImages, handleWorkspaceUpdate]);

    const handleDownload = async () => {
        if (combinedSelectedImageIds.length !== 1) {
            setError(t('error.no_image_to_download'));
            return;
        }
        const imageId = combinedSelectedImageIds[0];
        const imageToDownload = workspaceImages.find(img => img.id === imageId);
        if (!imageToDownload) {
             setError(t('error.no_image_to_download'));
            return;
        }

        const annotatedImage = await workspaceCanvasRef.current?.getAnnotatedImage(imageId);
        if (!annotatedImage) return;

        fetch(annotatedImage)
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const fileType = blob.type.split('/')[1] || 'png';
                link.download = `edited-image-${Date.now()}.${fileType}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error('Error downloading image:', error);
                setError('Не удалось скачать изображение.');
            });
    };
    
    const handleUndo = useCallback(() => {
        if (viewMode === 'canvas' && canvasHistoryIndex > 0) {
            const newIndex = canvasHistoryIndex - 1;
            setCanvasHistoryIndex(newIndex);
            setWorkspaceImages(canvasHistory[newIndex]);
            setError(null);
        } else if (viewMode === 'editor') {
            imageEditorRef.current?.undo();
        }
    }, [viewMode, canvasHistoryIndex, canvasHistory]);

    const handleRedo = useCallback(() => {
        if (viewMode === 'canvas' && canvasHistoryIndex < canvasHistory.length - 1) {
            const newIndex = canvasHistoryIndex + 1;
            setCanvasHistoryIndex(newIndex);
            setWorkspaceImages(canvasHistory[newIndex]);
            setError(null);
        } else if (viewMode === 'editor') {
            imageEditorRef.current?.redo();
        }
    }, [viewMode, canvasHistory, canvasHistoryIndex]);

    const findNewImagePosition = (allImages: WorkspaceImage[], placeholderWidth: number, referenceImage?: WorkspaceImage | null): { x: number, y: number } => {
        const MARGIN = 20;
        const viewportCenter = workspaceCanvasRef.current?.getViewportCenter() || { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        if (allImages.length === 0) {
            return { x: viewportCenter.x - placeholderWidth / 2, y: viewportCenter.y };
        }

        const rightmostX = Math.max(...allImages.map(img => img.x + img.width));
        
        // Align vertically with the reference image if provided, otherwise use its y if it's the only one, or viewport center y.
        const yPosition = referenceImage 
            ? referenceImage.y 
            : (allImages.length === 1 ? allImages[0].y : viewportCenter.y);

        return { x: rightmostX + MARGIN, y: yPosition };
    };

    const handleEnhance = useCallback(async () => {
        if (combinedSelectedImageIds.length !== 1) {
            setError(t('error.no_image_to_enhance'));
            return;
        }
        const imageToEnhance = workspaceImages.find(img => img.id === combinedSelectedImageIds[0]);
        if (!imageToEnhance) {
            setError(t('error.no_image_to_enhance'));
            return;
        }

        addLog('action', t('log.action.start_enhance'));
        setLoadingAction('enhance');
        setLoadingMessage(t('loading.enhancing'));
        setError(null);
        
        const { x: newX, y: newY } = findNewImagePosition(workspaceImages, imageToEnhance.width, imageToEnhance);
        
        const placeholder: WorkspaceImage = {
            ...imageToEnhance,
            id: Date.now(),
            x: newX,
            y: newY,
            isLoading: true,
            isReasoning: true, // This will trigger the blur effect
            layers: [],
            annotationHistory: [{ layers: [] }],
            annotationHistoryIndex: 0,
        };
        const placeholderId = placeholder.id;
        handleWorkspaceUpdate([...workspaceImages, placeholder], false);


        try {
            const imageSource = imageToEnhance.source;
            let base64Image: string;
            let mimeType: string;
            
            if (typeof imageSource === 'string') {
                const parts = imageSource.split(',');
                mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
                base64Image = parts[1];
            } else { // It's a File
                mimeType = imageSource.type;
                base64Image = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(imageSource);
                });
            }
            
            let enhancePrompt = `The provided image is a low-resolution image. 
Please upscale the image to a high-resolution, perfectly detailed image. 
**DO NOT add any elements or render outside of the provided reference image subject.** 
The resulting image should be a clearer, higher-resolution version of the input, and nothing more and match in shapes and colors.

However, if the content of the image can't be determined, you are free to be creative and add objects or textures to match the shapes and colors within the image.`;
            
            if (userPrompt.trim()) {
                enhancePrompt += `\n\n${userPrompt.trim()}`;
            }

            const finalEnhancePrompt = `${enhancePrompt}\n\n!important:Your response should ONLY be the resulting image, with no other text, commentary, or markdown.`;

            addPromptToHistory(finalEnhancePrompt, ['Enhance']);
            addLog('api_request', 'Enhance request sent to API', { prompt: finalEnhancePrompt });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: {
                    parts: [
                        { inlineData: { data: base64Image, mimeType: mimeType } },
                        { text: finalEnhancePrompt },
                    ],
                },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });
            addLog('api_response', 'Enhance response received');

            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imagePart?.inlineData) {
                const newImageBase64 = imagePart.inlineData.data;
                const newMimeType = imagePart.inlineData.mimeType || 'image/png';
                const newDataSource = `data:${newMimeType};base64,${newImageBase64}`;

                const img = new Image();
                img.onload = () => {
                     setWorkspaceImages(currentImages => {
                        const finalImages = currentImages.map(i => i.id === placeholderId ? {
                            ...i,
                            source: newDataSource,
                            width: img.width,
                            height: img.height,
                            originalWidth: img.width,
                            originalHeight: img.height,
                            isLoading: false,
                            isReasoning: false,
                        } : i);
                        updateCanvasHistory(finalImages);
                        return finalImages;
                    });
                    setManualSelectedImageIds([placeholderId]);
                    setTimeout(() => workspaceCanvasRef.current?.focusOnImage(placeholderId), 50);
                };
                img.src = newDataSource;

            } else {
                const safetyReason = response.candidates?.[0]?.finishReason;
                const message = safetyReason === 'SAFETY' ? t('error.content_blocked_by_safety') : t('error.model_no_image');
                setError(message);
                addLog('error', message, response);
                setWorkspaceImages(currentImages => currentImages.filter(i => i.id !== placeholderId));
            }
        } catch (e: any) {
            console.error(e);
            const errorMessage = `${t('error.api_error_prefix')} ${e.message}`;
            setError(errorMessage);
            addLog('error', errorMessage, e);
            setWorkspaceImages(currentImages => currentImages.filter(i => i.id !== placeholderId));
        } finally {
            setLoadingAction(null);
            setLoadingMessage('');
        }
    }, [combinedSelectedImageIds, workspaceImages, userPrompt, t, ai, addLog, handleWorkspaceUpdate, updateCanvasHistory, addPromptToHistory]);

    const handleRtxGenerate = useCallback(async () => {
        if (combinedSelectedImageIds.length !== 1) {
            setError(t('error.no_image_to_enhance'));
            return;
        }
        const imageToEnhance = workspaceImages.find(img => img.id === combinedSelectedImageIds[0]);
        if (!imageToEnhance) {
            setError(t('error.no_image_to_enhance'));
            return;
        }
    
        addLog('action', t('log.action.start_rtx'));
        setLoadingAction('rtx');
        setLoadingMessage(t('loading.rtx'));
        setError(null);

        const { x: newX, y: newY } = findNewImagePosition(workspaceImages, imageToEnhance.width, imageToEnhance);
        
        const placeholder: WorkspaceImage = {
            ...imageToEnhance,
            id: Date.now(),
            x: newX,
            y: newY,
            isLoading: true,
            isReasoning: true, // This will trigger the blur effect
            layers: [],
            annotationHistory: [{ layers: [] }],
            annotationHistoryIndex: 0,
        };
        const placeholderId = placeholder.id;
        handleWorkspaceUpdate([...workspaceImages, placeholder], false);
    
    
        try {
            const imageSource = imageToEnhance.source;
            let base64Image: string;
            let mimeType: string;
            
            if (typeof imageSource === 'string') {
                const parts = imageSource.split(',');
                mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
                base64Image = parts[1];
            } else { // It's a File
                mimeType = imageSource.type;
                base64Image = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(imageSource);
                });
            }
            
            const rtxPrompt = 'Current graphic settings: low Change it to: ultra rtx';
            
            const finalRtxPrompt = `${rtxPrompt}\n\n!important:Your response should ONLY be the resulting image, with no other text, commentary, or markdown.`;
    
            addPromptToHistory(finalRtxPrompt, ['RTX']);
            addLog('api_request', 'RTX request sent to API', { prompt: finalRtxPrompt });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: {
                    parts: [
                        { inlineData: { data: base64Image, mimeType: mimeType } },
                        { text: finalRtxPrompt },
                    ],
                },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });
            addLog('api_response', 'RTX response received');
    
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imagePart?.inlineData) {
                const newImageBase64 = imagePart.inlineData.data;
                const newMimeType = imagePart.inlineData.mimeType || 'image/png';
                const newDataSource = `data:${newMimeType};base64,${newImageBase64}`;
    
                const img = new Image();
                img.onload = () => {
                     setWorkspaceImages(currentImages => {
                        const finalImages = currentImages.map(i => i.id === placeholderId ? {
                            ...i,
                            source: newDataSource,
                            width: img.width,
                            height: img.height,
                            originalWidth: img.width,
                            originalHeight: img.height,
                            isLoading: false,
                            isReasoning: false,
                        } : i);
                        updateCanvasHistory(finalImages);
                        return finalImages;
                    });
                    setManualSelectedImageIds([placeholderId]);
                    setTimeout(() => workspaceCanvasRef.current?.focusOnImage(placeholderId), 50);
                };
                img.src = newDataSource;
    
            } else {
                const safetyReason = response.candidates?.[0]?.finishReason;
                const message = safetyReason === 'SAFETY' ? t('error.content_blocked_by_safety') : t('error.model_no_image');
                setError(message);
                addLog('error', message, response);
                setWorkspaceImages(currentImages => currentImages.filter(i => i.id !== placeholderId));
            }
        } catch (e: any) {
            console.error(e);
            const errorMessage = `${t('error.api_error_prefix')} ${e.message}`;
            setError(errorMessage);
            addLog('error', errorMessage, e);
            setWorkspaceImages(currentImages => currentImages.filter(i => i.id !== placeholderId));
        } finally {
            setLoadingAction(null);
            setLoadingMessage('');
        }
    }, [combinedSelectedImageIds, workspaceImages, t, ai, addLog, handleWorkspaceUpdate, updateCanvasHistory, addPromptToHistory]);

    const handleMix = useCallback(async () => {
        if (combinedSelectedImageIds.length !== 1) {
            setError(t('error.no_image_to_mix'));
            return;
        }
        const imageToMix = workspaceImages.find(img => img.id === combinedSelectedImageIds[0]);
        if (!imageToMix) {
            setError(t('error.no_image_to_mix'));
            return;
        }
    
        addLog('action', t('log.action.start_mix'));
        setLoadingAction('mix');
        setError(null);
        
        const { x: newX, y: newY } = findNewImagePosition(workspaceImages, imageToMix.width, imageToMix);
        
        const placeholder: WorkspaceImage = {
            ...imageToMix,
            id: Date.now(),
            x: newX,
            y: newY,
            isLoading: true,
            isReasoning: true, // Blur effect
            layers: [],
            annotationHistory: [{ layers: [] }],
            annotationHistoryIndex: 0,
        };
        const placeholderId = placeholder.id;
        handleWorkspaceUpdate([...workspaceImages, placeholder], false);
    
        try {
            setLoadingMessage(t('loading.improving_prompt'));
            
            const annotatedImageB64 = await workspaceCanvasRef.current?.getAnnotatedImage(imageToMix.id);
            if (!annotatedImageB64) throw new Error(`Failed to get annotated image for mix.`);
            
            const parts = annotatedImageB64.split(',');
            const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
            const data = parts[1];
            const imagePart = { inlineData: { mimeType, data } };
    
            addLog('api_request', 'Sending mix prompt generation request', { system_instruction: 'MAGIC_PROMPT_SYSTEM_INSTRUCTION' });
            const magicPromptResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart] },
                config: { systemInstruction: MAGIC_PROMPT_SYSTEM_INSTRUCTION },
            });
            const generatedPrompt = magicPromptResponse.text?.trim();
    
            if (!generatedPrompt) {
                throw new Error(t('error.magic_prompt_generate_fail'));
            }
            addLog('api_response', 'Mix prompt generated', { prompt: generatedPrompt });
    
            setLoadingMessage(t('loading.generating_mixed_scene'));
            
            const promptForImageGeneration = `${generatedPrompt}\n\n!important:Your response should ONLY be the resulting image, with no other text, commentary, or markdown.`;
    
            addPromptToHistory(promptForImageGeneration, ['Mix', 'Magic Prompt']);
            addLog('api_request', 'Sending mix image generation request', { prompt: promptForImageGeneration });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [imagePart, { text: promptForImageGeneration }] },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });
            addLog('api_response', 'Mix image response received');
            
            const finalImagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
            if (finalImagePart?.inlineData) {
                const newImageBase64 = finalImagePart.inlineData.data;
                const newMimeType = finalImagePart.inlineData.mimeType || 'image/png';
                const newDataSource = `data:${newMimeType};base64,${newImageBase64}`;
    
                const img = new Image();
                img.onload = () => {
                     setWorkspaceImages(currentImages => {
                        const finalImages = currentImages.map(i => i.id === placeholderId ? {
                            ...i,
                            source: newDataSource,
                            width: img.width,
                            height: img.height,
                            originalWidth: img.width,
                            originalHeight: img.height,
                            isLoading: false,
                            isReasoning: false,
                        } : i);
                        updateCanvasHistory(finalImages);
                        return finalImages;
                    });
                    setManualSelectedImageIds([placeholderId]);
                    setTimeout(() => workspaceCanvasRef.current?.focusOnImage(placeholderId), 50);
                };
                img.src = newDataSource;
    
            } else {
                const safetyReason = response.candidates?.[0]?.finishReason;
                const message = safetyReason === 'SAFETY' ? t('error.content_blocked_by_safety') : t('error.model_no_image');
                throw new Error(message);
            }
    
        } catch (e: any) {
            console.error(e);
            const errorMessage = `${t('error.api_error_prefix')} ${e.message}`;
            setError(errorMessage);
            addLog('error', errorMessage, e);
            setWorkspaceImages(currentImages => currentImages.filter(i => i.id !== placeholderId));
        } finally {
            setLoadingAction(null);
            setLoadingMessage('');
        }
    
    }, [combinedSelectedImageIds, workspaceImages, addLog, t, ai, handleWorkspaceUpdate, updateCanvasHistory, addPromptToHistory]);

    const handleResizeAndGenerate = useCallback(async (
        imageId: number,
        dataUrl: string,
        finalRect: { width: number; height: number; originalWidth: number; originalHeight: number; }
    ) => {
        addLog('action', 'Starting outpainting process after resize...');
        setLoadingAction('generate');
        setLoadingMessage('Outpainting...');
        setError(null);
    
        const sourceWithBg = dataUrl;
        let imagesWithLoader: WorkspaceImage[] = [];
        setWorkspaceImages(current => {
            imagesWithLoader = current.map(img => {
                if (img.id === imageId) {
                    return {
                        ...img,
                        ...finalRect,
                        source: sourceWithBg,
                        isLoading: true,
                        layers: [],
                    };
                }
                return img;
            });
            return imagesWithLoader;
        });
        updateCanvasHistory(imagesWithLoader); // Save the state with the new background
    
        try {
            const base64Image = sourceWithBg.split(',')[1];
            const mimeType = sourceWithBg.match(/:(.*?);/)?.[1] || 'image/png';
            const imagePart = { inlineData: { mimeType, data: base64Image } };
            
            let finalPrompt = userPrompt; // Start with user prompt

            if (isMagicPromptEnabled) {
                addLog('action', t('log.magic_prompt_active'));
                setLoadingMessage(t('loading.improving_prompt'));
        
                const magicPromptContentParts: any[] = [imagePart];
                if (userPrompt.trim()) {
                    magicPromptContentParts.push({ text: userPrompt.trim() });
                }
        
                addLog('api_request', 'Sending prompt enhancement request to API for outpainting');
                const magicPromptResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: magicPromptContentParts },
                    config: { systemInstruction: MAGIC_PROMPT_SYSTEM_INSTRUCTION },
                });
                const improvedPrompt = magicPromptResponse.text?.trim();
                
                if (improvedPrompt) {
                    finalPrompt = improvedPrompt;
                    addLog('api_response', t('log.magic_prompt_success'), { prompt: finalPrompt });
                } else {
                    addLog('error', t('log.magic_prompt_fail'));
                }
            }

            setLoadingMessage(t('loading.generating_image'));
    
            let promptForImageGeneration = "Fill in the empty space, making it look natural and seamless.";
            if (finalPrompt.trim()) {
                promptForImageGeneration += ` The overall scene should follow this description: ${finalPrompt.trim()}`;
            }
    
            const tags = ['Outpainting', ...(isMagicPromptEnabled ? ['Magic Prompt'] : [])];
            addPromptToHistory(promptForImageGeneration, tags);
            addLog('api_request', 'Outpainting request sent to API', { prompt: promptForImageGeneration });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: {
                    parts: [
                        imagePart,
                        { text: promptForImageGeneration },
                    ],
                },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });
            addLog('api_response', 'Outpainting response received');
    
            const responseImagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (responseImagePart?.inlineData) {
                const newImageBase64 = responseImagePart.inlineData.data;
                const newMimeType = responseImagePart.inlineData.mimeType || 'image/png';
                const newDataSource = `data:${newMimeType};base64,${newImageBase64}`;
    
                const img = new Image();
                img.onload = () => {
                    setWorkspaceImages(currentImages => {
                        const finalImages = currentImages.map(i => i.id === imageId ? {
                            ...i,
                            source: newDataSource,
                            width: img.width,
                            height: img.height,
                            originalWidth: img.width,
                            originalHeight: img.height,
                            isLoading: false,
                        } : i);
                        updateCanvasHistory(finalImages);
                        return finalImages;
                    });
                    setTimeout(() => workspaceCanvasRef.current?.focusOnImage(imageId), 50);
                };
                img.src = newDataSource;
            } else {
                const safetyReason = response.candidates?.[0]?.finishReason;
                const message = safetyReason === 'SAFETY' ? t('error.content_blocked_by_safety') : t('error.model_no_image');
                throw new Error(message);
            }
        } catch (e: any) {
            console.error(e);
            const errorMessage = `${t('error.api_error_prefix')} ${e.message}`;
            setError(errorMessage);
            addLog('error', errorMessage, e);
            // Revert to the state before loading
            setWorkspaceImages(currentImages => currentImages.map(i => i.id === imageId ? { ...i, isLoading: false } : i));
        } finally {
            setLoadingAction(null);
            setLoadingMessage('');
        }
    }, [workspaceImages, addLog, t, ai, updateCanvasHistory, userPrompt, addPromptToHistory, isMagicPromptEnabled]);
    
    const handleGenerate = useCallback(async () => {
        setLoadingAction('generate');
        setError(null);
        addLog('action', t('log.action.start_generation'));
    
        let placeholder: WorkspaceImage;
        const referenceImage = selectedImages.length > 0 ? selectedImages[0] : null;
        const placeholderWidth = referenceImage ? referenceImage.width : 1024;
        const { x: newX, y: newY } = findNewImagePosition(workspaceImages, placeholderWidth, referenceImage);

        placeholder = {
            id: Date.now(),
            source: referenceImage ? referenceImage.source : '', // Copy source for blur, or empty for skeleton
            x: newX,
            y: newY,
            width: placeholderWidth,
            height: referenceImage ? referenceImage.height : 1024,
            originalWidth: referenceImage ? referenceImage.originalWidth : 1024,
            originalHeight: referenceImage ? referenceImage.originalHeight : 1024,
            layers: [],
            annotationHistory: [{ layers: [] }],
            annotationHistoryIndex: 0,
            isLoading: true,
            isReasoning: !!referenceImage, // Blur if there is a reference
        };
    
        const placeholderId = placeholder.id;
        handleWorkspaceUpdate([...workspaceImages, placeholder], false); // Add placeholder without adding to history yet
    
        try {
            const visualToApiIndexMap = new Map<number, number>();
            combinedSelectedImageIds.forEach((id, apiIndex) => {
                const visualIndex = workspaceImages.findIndex(img => img.id === id);
                if (visualIndex !== -1) {
                    visualToApiIndexMap.set(visualIndex + 1, apiIndex + 1);
                }
            });
    
            const processPrompt = (prompt: string) => prompt.replace(/@([1-9][0-9]*)/g, (match, visualIndexStr) => {
                const visualIndex = parseInt(visualIndexStr, 10);
                const apiIndex = visualToApiIndexMap.get(visualIndex);
                return apiIndex ? `@${apiIndex}` : match;
            });
            
            let finalPrompt = processPrompt(userPrompt);

            if (isMagicPromptEnabled) {
                addLog('action', t('log.magic_prompt_active'));
                setLoadingMessage(t('loading.improving_prompt'));
        
                const magicPromptImageParts = await Promise.all(selectedImages.map(async (img) => {
                    const annotatedImageB64 = await workspaceCanvasRef.current?.getAnnotatedImage(img.id);
                    if (!annotatedImageB64) throw new Error(`Failed to get annotated image for ID ${img.id} for prompt generation.`);
                    const parts = annotatedImageB64.split(',');
                    const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
                    const data = parts[1];
                    return { inlineData: { mimeType, data } };
                }));

                const magicPromptContentParts: any[] = [...magicPromptImageParts];
                if (userPrompt.trim()) {
                    magicPromptContentParts.push({ text: userPrompt.trim() });
                }
        
                addLog('api_request', 'Sending prompt enhancement request to API', { has_user_prompt: !!userPrompt.trim() });
                const magicPromptResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: magicPromptContentParts },
                    config: { systemInstruction: MAGIC_PROMPT_SYSTEM_INSTRUCTION },
                });
                const improvedPrompt = magicPromptResponse.text?.trim();
        
                if (improvedPrompt) {
                    finalPrompt = improvedPrompt;
                    addLog('api_response', t('log.magic_prompt_success'), { prompt: finalPrompt });
                } else {
                    if (!userPrompt.trim()) {
                        setError(t('error.magic_prompt_generate_fail'));
                        addLog('error', t('error.magic_prompt_generate_fail'), magicPromptResponse);
                        setWorkspaceImages(currentImages => currentImages.filter(i => i.id !== placeholderId));
                        setLoadingAction(null); setLoadingMessage('');
                        return;
                    } else {
                        addLog('error', t('log.magic_prompt_fail'));
                    }
                }
            }

            setLoadingMessage(t('loading.generating_image'));
            
            const promptForImageGeneration = selectedImages.length > 0
                ? `${finalPrompt}\n\n!important:Your response should ONLY be the resulting image, with no other text, commentary, or markdown.`
                : finalPrompt;

            const imageParts = await Promise.all(selectedImages.map(async (img) => {
                const annotatedImageB64 = await workspaceCanvasRef.current?.getAnnotatedImage(img.id);
                if (!annotatedImageB64) throw new Error(`Failed to get annotated image for ID ${img.id}`);
                const parts = annotatedImageB64.split(',');
                const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
                const data = parts[1];
                return { inlineData: { mimeType, data } };
            }));
    
            const contents = { parts: [...imageParts, { text: promptForImageGeneration }] };
            const tags = ['Generate', ...(isMagicPromptEnabled ? ['Magic Prompt'] : [])];
            addPromptToHistory(promptForImageGeneration, tags);
            addLog('api_request', 'Generate request sent to API', { prompt: promptForImageGeneration, imageCount: imageParts.length });
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents,
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });
    
            addLog('api_response', 'Generate response received');
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
            if (imagePart?.inlineData) {
                const newImageBase64 = imagePart.inlineData.data;
                const newMimeType = imagePart.inlineData.mimeType || 'image/png';
                const newDataSource = `data:${newMimeType};base64,${newImageBase64}`;
    
                const img = new Image();
                img.onload = () => {
                    setWorkspaceImages(currentImages => {
                        const finalImages = currentImages.map(i => i.id === placeholderId ? {
                            ...i,
                            source: newDataSource,
                            width: img.width,
                            height: img.height,
                            originalWidth: img.width,
                            originalHeight: img.height,
                            isLoading: false,
                            isReasoning: false,
                        } : i);
                        updateCanvasHistory(finalImages);
                        return finalImages;
                    });
                    setManualSelectedImageIds([placeholderId]);
                    setTimeout(() => workspaceCanvasRef.current?.focusOnImage(placeholderId), 50);
                };
                img.src = newDataSource;
            } else {
                const safetyReason = response.candidates?.[0]?.finishReason;
                const message = safetyReason === 'SAFETY' ? t('error.content_blocked_by_safety') : t('error.model_no_image');
                setError(message);
                addLog('error', message, response);
                setWorkspaceImages(currentImages => currentImages.filter(i => i.id !== placeholderId));
            }
        } catch (e: any) {
            console.error(e);
            const errorMessage = `${t('error.api_error_prefix')} ${e.message}`;
            setError(errorMessage);
            addLog('error', errorMessage, e);
            setWorkspaceImages(currentImages => currentImages.filter(i => i.id !== placeholderId));
        } finally {
            setLoadingAction(null);
            setLoadingMessage('');
        }
    }, [combinedSelectedImageIds, workspaceImages, userPrompt, addLog, t, ai, isMagicPromptEnabled, selectedImages, handleWorkspaceUpdate, updateCanvasHistory, addPromptToHistory]);

    const handleReasoning = useCallback(async () => {
        if (combinedSelectedImageIds.length !== 1 || (!userPrompt.trim() && !isMagicPromptEnabled)) {
            setError(t('error.no_image_to_enhance'));
            return;
        }

        setLoadingAction('reasoning');
        setError(null);
        addLog('action', "Starting reasoning and generation process...");
        
        const mainImage = selectedImages[0];
        let annotatedPlanImageId: number | null = null;
        let promptForFinalGeneration = userPrompt; // Start with the original prompt for the final step.

        try {
            // The prompt for the reasoning step is always the original user prompt.
            const promptForReasoning = userPrompt;

            // ========== STEP 1: CREATE PLACEHOLDER & SHOW LOADER IMMEDIATELY ==========
            setLoadingMessage(t('loading.creating_annotations'));
            const { x: newX, y: newY } = findNewImagePosition(workspaceImages, mainImage.width, mainImage);
            
            const placeholder: WorkspaceImage = {
                ...mainImage,
                id: Date.now(),
                x: newX,
                y: newY,
                isLoading: true,
                isReasoning: true, // Blur effect
                layers: [],
                annotationHistory: [{ layers: [] }],
                annotationHistoryIndex: 0,
            };
            annotatedPlanImageId = placeholder.id;
            
            let initialWorkspaceStateWithPlaceholder: WorkspaceImage[] = [];
            setWorkspaceImages(current => {
                initialWorkspaceStateWithPlaceholder = [...current, placeholder];
                return initialWorkspaceStateWithPlaceholder;
            });

            // ========== STEP 2: GET REASONING ANNOTATIONS (using original prompt) ==========
            const reasoningSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING },
                        start: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                        end: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                        position: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                        text: { type: Type.STRING },
                        label: { type: Type.STRING },
                    }
                }
            };

            addLog('api_request', 'Reasoning request sent to API', { prompt: promptForReasoning });
            const annotatedImageB64ForReasoning = await workspaceCanvasRef.current?.getAnnotatedImage(mainImage.id);
            if (!annotatedImageB64ForReasoning) throw new Error(`Failed to get annotated image for ID ${mainImage.id} for reasoning.`);
            const b64parts = annotatedImageB64ForReasoning.split(',');
            const mimeType = b64parts[0].match(/:(.*?);/)?.[1] || 'image/png';
            const data = b64parts[1];

            const reasoningResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ inlineData: { mimeType, data } }, { text: promptForReasoning }] },
                config: {
                    systemInstruction: REASONING_SYSTEM_INSTRUCTION,
                    responseMimeType: "application/json",
                    responseSchema: reasoningSchema,
                },
            });
            
            let parsedCommands: any[] = [];
            try {
                let jsonStr = reasoningResponse.text.trim();
                if (jsonStr.startsWith('```json')) {
                    jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
                } else if (jsonStr.startsWith('```')) {
                     jsonStr = jsonStr.substring(3, jsonStr.length - 3).trim();
                }
                parsedCommands = JSON.parse(jsonStr);
                if (!Array.isArray(parsedCommands)) throw new Error("Parsed JSON is not an array");
            } catch (e) {
                addLog('error', "Failed to parse reasoning response.", { error: e, response: reasoningResponse.text });
                throw new Error("Failed to parse reasoning response from AI.");
            }
            addLog('api_response', 'Reasoning response received (plan)', { plan: parsedCommands });

            // ========== STEP 3: ANIMATE DRAWING THE PLAN ==========
            setWorkspaceImages(current => current.map(img =>
                img.id === annotatedPlanImageId ? { ...img, isLoading: false, isReasoning: false } : img
            ));
            await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)));

            const { originalWidth, originalHeight } = mainImage;
            const editorScale = Math.min(1500 / originalWidth, 1500 / originalHeight, 1);
            const scaledWidth = originalWidth * editorScale;
            const scaledHeight = originalHeight * editorScale;
            const AI_COLORS = ['#FFD700', '#34D399', '#60A5FA', '#F472B6', '#A78BFA', '#FBBF24'];
            
            let currentLayers: AnyLayer[] = [];

            for (const [index, command] of parsedCommands.entries()) {
                const aiColor = AI_COLORS[index % AI_COLORS.length];

                if (command.type === 'arrow' && command.start && command.end && command.label) {
                    const start = { x: command.start.x * scaledWidth, y: command.start.y * scaledHeight };
                    const end = { x: command.end.x * scaledWidth, y: command.end.y * scaledHeight };
                    const minX = Math.min(start.x, end.x);
                    const minY = Math.min(start.y, end.y);
                    
                    currentLayers.push({
                        id: Date.now() + Math.random(), type: Tool.Arrow, color: aiColor, size: 12,
                        x: minX, y: minY,
                        width: Math.abs(start.x - end.x), height: Math.abs(start.y - end.y),
                        start: { x: start.x - minX, y: start.y - minY },
                        end: { x: end.x - minX, y: end.y - minY },
                    } as ArrowLayer);
                    currentLayers.push({
                        id: Date.now() + Math.random(), type: 'text', text: command.label,
                        x: (command.end.x * scaledWidth) + 10,
                        y: command.end.y * scaledHeight,
                        width: 200, height: 50, fontSize: 24,
                        color: aiColor, fontFamily: "'Space Grotesk', sans-serif", align: 'left',
                    });
                } else if (command.type === 'text' && command.position && command.text) {
                     currentLayers.push({
                        id: Date.now() + Math.random(), type: 'text', text: command.text,
                        x: command.position.x * scaledWidth,
                        y: command.position.y * scaledHeight,
                        width: 200, height: 50, fontSize: 32,
                        color: aiColor, fontFamily: "'Space Grotesk', sans-serif", align: 'left',
                    });
                }
                
                setWorkspaceImages(current => current.map(img =>
                    img.id === annotatedPlanImageId ? { ...img, layers: [...currentLayers] } : img
                ));
                await new Promise(resolve => setTimeout(resolve, 250));
            }
            
            // ========== STEP 4: SAVE PLAN TO HISTORY ==========
            let finalPlannedState: WorkspaceImage[] = [];
            setWorkspaceImages(current => {
                finalPlannedState = current.map(img =>
                    img.id === annotatedPlanImageId ? { ...img, isLoading: false, isReasoning: false } : img
                );
                return finalPlannedState;
            });
            await new Promise(resolve => requestAnimationFrame(resolve));
            updateCanvasHistory(finalPlannedState);

            // ========== STEP 5: MAGIC PROMPT ENHANCEMENT (IF ENABLED) ==========
            if (isMagicPromptEnabled) {
                addLog('action', t('log.magic_prompt_active'));
                setLoadingMessage(t('loading.improving_prompt'));
    
                const annotatedImageB64ForMagic = await workspaceCanvasRef.current?.getAnnotatedImage(mainImage.id);
                if (!annotatedImageB64ForMagic) throw new Error(`Failed to get annotated image for ID ${mainImage.id} for magic prompt.`);
                
                const magicParts = annotatedImageB64ForMagic.split(',');
                const magicMimeType = magicParts[0].match(/:(.*?);/)?.[1] || 'image/png';
                const magicData = magicParts[1];
                
                const magicPromptContentParts: any[] = [{ inlineData: { mimeType: magicMimeType, data: magicData } }];
                if (userPrompt.trim()) {
                    magicPromptContentParts.push({ text: userPrompt.trim() });
                }
    
                addLog('api_request', 'Sending prompt enhancement request to API', { has_user_prompt: !!userPrompt.trim() });
                const magicPromptResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: magicPromptContentParts },
                    config: { systemInstruction: MAGIC_PROMPT_SYSTEM_INSTRUCTION },
                });
                const improvedPrompt = magicPromptResponse.text?.trim();
    
                if (improvedPrompt) {
                    promptForFinalGeneration = improvedPrompt;
                    addLog('api_response', t('log.magic_prompt_success'), { prompt: promptForFinalGeneration });
                } else {
                    if (!userPrompt.trim()) {
                        throw new Error(t('error.magic_prompt_generate_fail'));
                    } else {
                        addLog('error', t('log.magic_prompt_fail'));
                    }
                }
            }

            // ========== STEP 6: GENERATE THE FINAL IMAGE ==========
            addLog('action', 'Reasoning complete, starting final image generation...');
            setLoadingMessage(t('loading.generating_image'));
            
            handleWorkspaceUpdate(
                finalPlannedState.map(img => img.id === annotatedPlanImageId ? { ...img, isLoading: true } : img),
                false
            );
            
            const annotatedImageB64ForGenerate = await workspaceCanvasRef.current?.getAnnotatedImage(annotatedPlanImageId);
            if (!annotatedImageB64ForGenerate) throw new Error(`Failed to get annotated image with plan for ID ${annotatedPlanImageId}`);

            const genParts = annotatedImageB64ForGenerate.split(',');
            const genMimeType = genParts[0].match(/:(.*?);/)?.[1] || 'image/png';
            const genData = genParts[1];
            const imagePart = { inlineData: { mimeType: genMimeType, data: genData } };

            const promptForImageGeneration = `${promptForFinalGeneration}\n\n!important:Your response should ONLY be the resulting image, with no other text, commentary, or markdown.`;

            const contents = { parts: [imagePart, { text: promptForImageGeneration }] };
            const tags = ['Reasoning', ...(isMagicPromptEnabled ? ['Magic Prompt'] : [])];
            addPromptToHistory(promptForImageGeneration, tags);
            addLog('api_request', 'Generate request sent to API (using reasoned plan)', { prompt: promptForImageGeneration });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents,
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });

            addLog('api_response', 'Final generate response received');
            const finalImagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

            if (finalImagePart?.inlineData) {
                const newImageBase64 = finalImagePart.inlineData.data;
                const newMimeType = finalImagePart.inlineData.mimeType || 'image/png';
                const newDataSource = `data:${newMimeType};base64,${newImageBase64}`;

                const img = new Image();
                img.onload = () => {
                    let finalImages: WorkspaceImage[] = [];
                    setWorkspaceImages(currentImages => {
                        finalImages = currentImages.map(i => i.id === annotatedPlanImageId ? {
                            ...i,
                            source: newDataSource,
                            width: img.width,
                            height: img.height,
                            originalWidth: img.width,
                            originalHeight: img.height,
                            isLoading: false,
                            layers: [],
                        } : i);
                        return finalImages;
                    });
                
                    setCanvasHistory(prevHistory => {
                        const newHistory = [...prevHistory];
                        newHistory.push(finalImages);
                        return newHistory;
                    });
                
                    setCanvasHistoryIndex(prevIndex => prevIndex + 1);

                    setManualSelectedImageIds(annotatedPlanImageId ? [annotatedPlanImageId] : []);
                    if (annotatedPlanImageId) {
                        setTimeout(() => workspaceCanvasRef.current?.focusOnImage(annotatedPlanImageId!), 50);
                    }
                };
                img.src = newDataSource;
            } else {
                const safetyReason = response.candidates?.[0]?.finishReason;
                const message = safetyReason === 'SAFETY' ? t('error.content_blocked_by_safety') : t('error.model_no_image');
                throw new Error(message);
            }
        } catch (e: any) {
            console.error(e);
            const errorMessage = `${t('error.api_error_prefix')} ${e.message}`;
            setError(errorMessage);
            addLog('error', errorMessage, e);
            if (annotatedPlanImageId) {
                handleWorkspaceUpdate(workspaceImages.filter(i => i.id !== annotatedPlanImageId), false);
            }
        } finally {
            setLoadingAction(null);
            setLoadingMessage('');
        }
    }, [combinedSelectedImageIds, workspaceImages, userPrompt, addLog, t, ai, handleWorkspaceUpdate, isMagicPromptEnabled, selectedImages, updateCanvasHistory, addPromptToHistory]);

    const handleEnterEditMode = useCallback((imageId: number) => {
        setEditingImageId(imageId);
        setManualSelectedImageIds([imageId]);
        setViewMode('editor');
        setActiveTool(Tool.Selection);
    }, []);

    const canGenerate = isAspectRatioEditorActive || !!userPrompt.trim() || (isMagicPromptEnabled && selectedImages.length > 0);

    const onGenerateAction = useCallback(() => {
        if (isAspectRatioEditorActive) {
            workspaceCanvasRef.current?.confirmAspectRatioEdit();
        } else {
            handleGenerate();
        }
    }, [isAspectRatioEditorActive, handleGenerate]);


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA'].includes(target.tagName) || isPromptModalOpen) {
                return;
            }
    
            const isCmdOrCtrl = e.metaKey || e.ctrlKey;
            const key = e.key.toLowerCase();
            const singleSelectedImageId = combinedSelectedImageIds.length === 1 ? combinedSelectedImageIds[0] : null;
    
            // Action hotkeys (prioritize over tool switching)
            if (e.shiftKey && key === 'enter') { // Generate
                e.preventDefault();
                if (canGenerate) onGenerateAction();
            } else if (!isCmdOrCtrl && !e.shiftKey && !e.altKey && (key === 'r' || key === 'к')) { // Reasoning
                e.preventDefault();
                if (userPrompt.trim() && combinedSelectedImageIds.length === 1) handleReasoning();
            } else if (!isCmdOrCtrl && !e.shiftKey && !e.altKey && (key === 'm' || key === 'ь')) { // Magic Prompt
                e.preventDefault();
                setIsMagicPromptEnabled(p => !p);
            } else if (key === '+') { // Add Image
                e.preventDefault();
                handleAddImageClick();
            } else if (!isCmdOrCtrl && !e.shiftKey && !e.altKey && (key === 'p' || key === 'з')) { // Presets
                e.preventDefault();
                setShowPresets(p => !p);
            } else if (e.shiftKey && (key === 'a' || key === 'ф')) { // Aspect Ratio
                e.preventDefault();
                if (singleSelectedImageId) {
                    workspaceCanvasRef.current?.enterAspectRatioMode(singleSelectedImageId);
                }
            } else if (e.shiftKey && (key === 'e' || key === 'у')) { // Edit Image
                e.preventDefault();
                if (singleSelectedImageId) handleEnterEditMode(singleSelectedImageId);
            } else if (!isCmdOrCtrl && !e.shiftKey && !e.altKey && (key === 'e' || key === 'у')) { // Enhance
                e.preventDefault();
                if (singleSelectedImageId) handleEnhance();
            } else if (e.shiftKey && (key === 's' || key === 'ы')) { // Save Image
                e.preventDefault();
                if (singleSelectedImageId) handleDownload();
            } else if (!isCmdOrCtrl && !e.shiftKey && !e.altKey && (key === 't' || key === 'е')) { // Expand Prompt Editor
                e.preventDefault();
                setIsPromptModalOpen(true);
            } else if (isCmdOrCtrl && (key === 'z' || key === 'я')) { // Undo/Redo
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            } else if (isCmdOrCtrl && (key === 'y' || key === 'н')) { // Redo for Windows
                e.preventDefault();
                handleRedo();
            } else if (e.key === 'Delete' || e.key === 'Backspace') { // Delete
                e.preventDefault();
                handleDeleteSelected();
            } else {
                // Tool hotkeys - only trigger if no modifier keys are pressed
                const toolMap: { [key: string]: Tool } = {
                    'v': Tool.Selection, 'м': Tool.Selection,
                    'h': Tool.Hand, 'р': Tool.Hand,
                    'b': Tool.Brush, 'и': Tool.Brush,
                    'l': Tool.Lasso, 'д': Tool.Lasso,
                    'a': Tool.Arrow, 'ф': Tool.Arrow,
                    'i': Tool.Text, 'ш': Tool.Text,
                };
    
                if (!isCmdOrCtrl && !e.altKey && !e.shiftKey && toolMap[key]) {
                    e.preventDefault();
                    setActiveTool(toolMap[key]);
                }
            }
        };
    
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        handleDeleteSelected, onGenerateAction, handleReasoning, handleUndo, handleRedo, isPromptModalOpen,
        canGenerate, combinedSelectedImageIds, handleEnhance, handleDownload, handleEnterEditMode, userPrompt
    ]);

    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            const target = event.target as HTMLElement;
            if (viewMode !== 'canvas' || ['INPUT', 'TEXTAREA'].includes(target.tagName) || isPromptModalOpen) {
                return;
            }

            const items = event.clipboardData?.items;
            if (!items) return;
            
            const imageFiles = Array.from(items)
                .filter(item => item.type.startsWith('image/'))
                .map(item => item.getAsFile())
                .filter((file): file is File => file !== null);

            if (imageFiles.length > 0) {
                event.preventDefault();
                const dataTransfer = new DataTransfer();
                imageFiles.forEach(file => dataTransfer.items.add(file));
                handleAddImage(dataTransfer.files);
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => {
            window.removeEventListener('paste', handlePaste);
        };
    }, [viewMode, isPromptModalOpen, handleAddImage]);

    const handleClear = () => {
        if (viewMode === 'canvas') {
            handleResetCanvas();
        } else if (viewMode === 'editor' && imageEditorRef.current) {
            imageEditorRef.current.clearAnnotations();
        }
    };

    const handleFocus = () => {
        if (viewMode === 'canvas') {
            workspaceCanvasRef.current?.resetView();
        } else if (viewMode === 'editor') {
            imageEditorRef.current?.resetView();
        }
    };

    const handleEditorSaveAndExit = (editedImageState: WorkspaceImage) => {
        const newImages = workspaceImages.map(img => {
            if (img.id === editingImageId) {
                // Update the original image with the new state from the editor
                return {
                    ...img,
                    layers: editedImageState.layers,
                    annotationHistory: editedImageState.annotationHistory,
                    annotationHistoryIndex: editedImageState.annotationHistoryIndex,
                };
            }
            return img;
        });
    
        handleWorkspaceUpdate(newImages);
    
        // Keep the edited image selected
        setManualSelectedImageIds([editingImageId!]);
    
        // Reset view state and exit editor mode
        setEditingImageId(null);
        setViewMode('canvas');
        setActiveTool(Tool.Hand);
    };

    const handleTextEditEnd = useCallback(() => {
        setActiveTool(Tool.Selection);
    }, []);
    
    const handleConfirmEdits = () => {
        imageEditorRef.current?.saveAndExit();
    };

    const handlePresetClick = (presetPrompt: string) => {
        setUserPrompt(userPrompt ? `${userPrompt}\n${presetPrompt}` : presetPrompt);
    };
    
    const handleClearPrompt = () => {
        setUserPrompt('');
    };

    const canUndo = viewMode === 'canvas' 
        ? canvasHistoryIndex > 0 
        : (imageEditorRef.current ? imageEditorRef.current.canUndo() : false);

    const canRedo = viewMode === 'canvas' 
        ? canvasHistoryIndex < canvasHistory.length - 1
        : (imageEditorRef.current ? imageEditorRef.current.canRedo() : false);

    // Drag and Drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDraggingOver(true);
        }
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDraggingOver(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        dragCounter.current = 0;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleAddImage(e.dataTransfer.files);
        }
    }, [handleAddImage]);


    return (
        <div 
            className="h-screen w-screen fixed inset-0 overflow-hidden text-gray-200"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {viewMode === 'canvas' && (
                <Header
                    language={language}
                    onLanguageChange={setLanguage}
                    onShowDonate={() => setIsDonateVisible(true)}
                    onShowHallOfFame={() => setIsHallOfFameVisible(true)}
                    onShowChangelog={() => setIsChangelogVisible(true)}
                    onShowLog={() => setIsLogVisible(true)}
                    onShowInfo={() => setIsInfoVisible(true)}
                    apiKeySource={apiKeySource}
                    onShowApiKeyModal={() => setIsApiKeyModalVisible(true)}
                    t={t}
                />
            )}
             {/* Background changes based on view mode */}
             {viewMode === 'canvas' ? (
                <AsciiBackground viewTransform={canvasViewTransform} />
            ) : (
                <div className="absolute inset-0 bg-black" />
            )}

            {/* Main view components */}
            {viewMode === 'canvas' && (
                <WorkspaceCanvas
                    ref={workspaceCanvasRef}
                    images={workspaceImages}
                    selectedImageIds={combinedSelectedImageIds}
                    highlightedRefs={highlightedRefs}
                    initialTransform={canvasViewTransform}
                    onWorkspaceUpdate={handleWorkspaceUpdate}
                    onSelectImages={setManualSelectedImageIds}
                    onEditRequest={handleEnterEditMode}
                    onViewTransformChange={handleViewTransformChange}
                    onDownload={handleDownload}
                    onDelete={handleDeleteSelected}
                    onResizeAndGenerate={handleResizeAndGenerate}
                    loadingMessage={loadingMessage}
                    t={t}
                    onAspectRatioEditorChange={setIsAspectRatioEditorActive}
                    onEnhance={handleEnhance}
                    onRtxGenerate={handleRtxGenerate}
                    onMix={handleMix}
                    loadingAction={loadingAction}
                />
            )}

            {viewMode === 'editor' && editingImage && (
                <div className="absolute inset-y-4 inset-x-24 z-10">
                    <ImageEditor
                        ref={imageEditorRef}
                        image={editingImage}
                        onSaveAndExit={handleEditorSaveAndExit}
                        tool={activeTool}
                        onToolChange={setActiveTool}
                        brushColor={brushColor}
                        brushSize={brushSize}
                        onTextEditEnd={handleTextEditEnd}
                        t={t}
                        onHistoryUpdate={handleEditorHistoryUpdate}
                    />
                </div>
            )}

            {/* Common UI Toolbars */}
            <div className="fixed left-4 top-1/2 -translate-y-1/2 z-20">
                {viewMode === 'editor' && (
                    <LeftToolbar
                        activeTool={activeTool}
                        onToolChange={setActiveTool}
                        brushColor={brushColor}
                        onBrushColorChange={setBrushColor}
                        brushSize={brushSize}
                        onBrushSizeChange={setBrushSize}
                        onConfirmEdits={handleConfirmEdits}
                        onAddLayer={() => imageEditorRef.current?.addLayer()}
                        t={t}
                    />
                )}
            </div>
            
            {!isAspectRatioEditorActive && (
                <div className="fixed right-4 top-1/2 -translate-y-1/2 z-20">
                    <RightToolbar
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                        onClear={handleClear}
                        onFocus={handleFocus}
                        activeTool={activeTool}
                        onToolChange={setActiveTool}
                        context={viewMode}
                        t={t}
                    />
                </div>
            )}


            {/* Canvas-only UI (Generation Bar and Errors) */}
            {viewMode === 'canvas' && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
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
                        onReasoning={handleReasoning}
                        loadingAction={loadingAction}
                        canGenerate={canGenerate}
                        language={language}
                        isMagicPromptEnabled={isMagicPromptEnabled}
                        onMagicPromptToggle={() => setIsMagicPromptEnabled(p => !p)}
                        selectedImages={selectedImages}
                        workspaceImages={workspaceImages}
                        highlightedRefs={highlightedRefs}
                        onExpandPromptEditor={() => setIsPromptModalOpen(true)}
                        onClearPrompt={handleClearPrompt}
                        onAddImage={handleAddImageClick}
                        onShowPresets={() => setShowPresets(true)}
                        onFocusOnImage={handleFocusOnImage}
                        isAspectRatioEditorActive={isAspectRatioEditorActive}
                        t={t}
                    />
                </div>
            )}
             
            {/* Global Modals */}
            <PresetsModal
                isOpen={showPresets}
                onClose={() => setShowPresets(false)}
                onPresetClick={handlePresetClick}
                language={language}
                t={t}
            />

            <InfoModal 
                isOpen={isInfoVisible}
                onClose={() => setIsInfoVisible(false)}
                t={t}
            />
            
            <PromptEditorModal
                isOpen={isPromptModalOpen}
                initialPrompt={userPrompt}
                onSave={setUserPrompt}
                onClose={() => setIsPromptModalOpen(false)}
                t={t}
            />

            <DonateModal
                isOpen={isDonateVisible}
                onClose={() => setIsDonateVisible(false)}
                t={t}
            />

            <ApiKeyModal
                isOpen={isApiKeyModalVisible}
                onClose={() => setIsApiKeyModalVisible(false)}
                onSave={handleSaveApiKey}
                onUseStudioKey={handleUseStudioKey}
                currentKeySource={apiKeySource}
                t={t}
            />

            <HallOfFameModal
                isOpen={isHallOfFameVisible}
                onClose={() => setIsHallOfFameVisible(false)}
                t={t}
            />

            <ChangelogModal
                isOpen={isChangelogVisible}
                onClose={() => setIsChangelogVisible(false)}
                t={t}
            />
            
            {/* Hidden Inputs */}
            <input type="file" ref={addImageInputRef} className="hidden" accept="image/*" multiple onChange={(e) => { handleAddImage(e.target.files); if(e.target) e.target.value = ''; }} />
            
            {isLogVisible && <ActionLog logs={logs} promptHistory={promptHistory} onClose={() => setIsLogVisible(false)} t={t} />}

            {/* Drag and Drop Overlay */}
            {isDraggingOver && (
                <div 
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none"
                >
                    <div 
                        className="w-11/12 h-5/6 border-4 border-dashed border-[#d1fe17] rounded-3xl flex flex-col items-center justify-center text-white"
                    >
                         <Icon name="upload" className="w-24 h-24 text-[#d1fe17]" />
                        <p className="text-3xl font-bold mt-4">{t('drop_zone.title')}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
