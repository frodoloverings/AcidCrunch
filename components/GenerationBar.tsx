
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Icon from './Icon';
import { Language } from '../i18n';
import { WorkspaceImage, LiveState } from '../types';
import Tooltip from './Tooltip';
import VoiceControl from './VoiceControl';

interface GenerationBarProps {
    userPrompt: string;
    onUserPromptChange: (prompt: string) => void;
    onGenerate: () => void;
    loadingAction: 'generate' | 'reasoning' | 'enhance' | 'rtx' | 'mix' | 'rep' | 'ref' | null;
    canGenerate: boolean;
    language: Language;
    isMagicPromptEnabled: boolean;
    onMagicPromptToggle: () => void;
    isBadModeEnabled: boolean;
    onBadModeToggle: () => void;
    isReasoningModeEnabled: boolean;
    onReasoningModeToggle: () => void;
    selectedImages: WorkspaceImage[];
    workspaceImages: WorkspaceImage[];
    highlightedRefs: number[];
    isAspectRatioEditorActive?: boolean;
    t: (key: string) => string;
    onExpandPromptEditor: () => void;
    onClearPrompt: () => void;
    onAddImage: () => void;
    onOpenCamera: () => void;
    onShowPresets: () => void;
    onFocusOnImage: (imageId: number) => void;
    aspectRatio: string;
    onAspectRatioChange: (ratio: string) => void;
    liveState: LiveState;
    startSession: () => void;
    stopSession: () => void;
    liveTranscript: { user: string; model: string } | null;
}

const MIN_HEIGHT = 136;
const MAX_HEIGHT = 500;
const MIN_WIDTH = 600;
const MAX_WIDTH = 1200;

const ReferenceThumbnail: React.FC<{ image: WorkspaceImage, index: number, onClick: () => void }> = ({ image, index, onClick }) => {
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        let objectUrl: string | null = null;
        if (typeof image.source === 'string') {
            setImageUrl(image.source);
        } else {
            objectUrl = URL.createObjectURL(image.source);
            setImageUrl(objectUrl);
        }
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [image.source]);
    
    if (!imageUrl) return null;

    return (
        <div 
            onClick={onClick}
            className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-transparent group cursor-pointer"
        >
            <img src={imageUrl} alt={`Reference ${index + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                @{index + 1}
            </div>
        </div>
    );
};

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="px-2 py-1 text-xs font-semibold text-gray-200 bg-[#2a2a2a] border border-[#383838] rounded-md min-w-[24px] text-center">
        {children}
    </div>
);

const GenerationBar: React.FC<GenerationBarProps> = ({
    userPrompt,
    onUserPromptChange,
    onGenerate,
    loadingAction,
    canGenerate,
    language,
    isMagicPromptEnabled,
    onMagicPromptToggle,
    isBadModeEnabled,
    onBadModeToggle,
    isReasoningModeEnabled,
    onReasoningModeToggle,
    selectedImages,
    workspaceImages,
    highlightedRefs,
    t,
    onExpandPromptEditor,
    onClearPrompt,
    onAddImage,
    onOpenCamera,
    onShowPresets,
    onFocusOnImage,
    isAspectRatioEditorActive,
    aspectRatio,
    onAspectRatioChange,
    liveState,
    startSession,
    stopSession,
    liveTranscript
}) => {
    const [barHeight, setBarHeight] = useState(MIN_HEIGHT);
    const [barWidth, setBarWidth] = useState(730);

    const isResizingRef = useRef<'vertical' | 'horizontal-left' | 'horizontal-right' | null>(null);
    const startYRef = useRef(0);
    const startHeightRef = useRef(0);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);
    const barRef = useRef<HTMLDivElement>(null);
    const aspectRatioRef = useRef<HTMLDivElement>(null);
    const addMenuRef = useRef<HTMLDivElement>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const rendererRef = useRef<HTMLDivElement>(null);

    const isLoading = loadingAction !== null;

    const [isHoverIndicatorVisible, setIsHoverIndicatorVisible] = useState(false);
    const [hoverPos, setHoverPos] = useState<{ x: number | null, y: number | null }>({ x: null, y: null });
    const indicatorTimeoutRef = useRef<number | null>(null);
    const [isAspectRatioOpen, setIsAspectRatioOpen] = useState(false);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

    useEffect(() => {
        setBarHeight(currentHeight => Math.max(currentHeight, MIN_HEIGHT));
    }, []);

    const syncScroll = () => {
        if (textareaRef.current && rendererRef.current) {
            rendererRef.current.scrollTop = textareaRef.current.scrollTop;
            rendererRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    const renderHighlightedPrompt = useMemo(() => {
        const parts = userPrompt.split(/(@[1-9][0-9]*)/g);
        return (
            <>
                {parts.map((part, index) => {
                    if (part.match(/^@[1-9][0-9]*$/)) {
                        const refNum = parseInt(part.substring(1));
                        const isHighlighted = highlightedRefs.includes(refNum);
                        return (
                            <span key={index} className={isHighlighted ? 'text-[#d1fe17]' : 'text-gray-200'}>
                                {part}
                            </span>
                        );
                    }
                    return <span key={index}>{part}</span>;
                })}
                {userPrompt.length === 0 && '\u00A0'}
            </>
        );
    }, [userPrompt, highlightedRefs]);


    const handleVerticalMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current);
        isResizingRef.current = 'vertical';
        startYRef.current = e.clientY;
        startHeightRef.current = barHeight;
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
        
        setIsHoverIndicatorVisible(false);
        indicatorTimeoutRef.current = window.setTimeout(() => setHoverPos({ x: null, y: null }), 300);
    }, [barHeight]);

    const handleHorizontalMouseDown = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
        e.preventDefault();
        if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current);
        isResizingRef.current = side === 'left' ? 'horizontal-left' : 'horizontal-right';
        startXRef.current = e.clientX;
        startWidthRef.current = barWidth;
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';

        setIsHoverIndicatorVisible(false);
        indicatorTimeoutRef.current = window.setTimeout(() => setHoverPos({ x: null, y: null }), 300);
    }, [barWidth]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current) return;
            
            if (isResizingRef.current === 'vertical') {
                const deltaY = e.clientY - startYRef.current;
                const newHeight = startHeightRef.current - deltaY;
                setBarHeight(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight)));
            } else if (isResizingRef.current === 'horizontal-left') {
                const deltaX = e.clientX - startXRef.current;
                const newWidth = startWidthRef.current - deltaX * 2;
                setBarWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
            } else if (isResizingRef.current === 'horizontal-right') {
                const deltaX = e.clientX - startXRef.current;
                const newWidth = startWidthRef.current + deltaX * 2;
                setBarWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
            }
        };

        const handleMouseUp = () => {
            if (isResizingRef.current) {
                isResizingRef.current = null;
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        };
        
        const handleClickOutside = (event: MouseEvent) => {
            if (isAspectRatioOpen && aspectRatioRef.current && !aspectRatioRef.current.contains(event.target as Node)) {
                setIsAspectRatioOpen(false);
            }
            if (isAddMenuOpen && addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
                setIsAddMenuOpen(false);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleClickOutside);
            if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current);
        };
    }, [isAspectRatioOpen, isAddMenuOpen]);

    const handleHoverMove = (e: React.MouseEvent, side: 'top' | 'left' | 'right') => {
        if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current);
        if (!isResizingRef.current && barRef.current) {
            const rect = barRef.current.getBoundingClientRect();
            if (side === 'top') {
                setHoverPos({ x: e.clientX - rect.left, y: 0 });
            } else if (side === 'left') {
                setHoverPos({ x: 0, y: e.clientY - rect.top });
            } else { // right
                setHoverPos({ x: rect.width, y: e.clientY - rect.top });
            }
            setIsHoverIndicatorVisible(true);
        }
    };
    
    const handleHoverLeave = () => {
        setIsHoverIndicatorVisible(false);
        indicatorTimeoutRef.current = window.setTimeout(() => setHoverPos({ x: null, y: null }), 300);
    };
    
    const isReasoningActionable = isReasoningModeEnabled && selectedImages.length === 1 && !!userPrompt.trim() && !isAspectRatioEditorActive;
    const isReasoningModeDisabledBySelection = isReasoningModeEnabled && selectedImages.length > 1;

    const generateButtonIcon = isAspectRatioEditorActive ? 'check' : isReasoningActionable ? 'sparkle-star' : 'arrow-up';

    const generateTooltipText = isAspectRatioEditorActive
        ? t('generate_bar.button_generate_outpainting')
        : isReasoningActionable
        ? `${t('generate_bar.reasoning')} (Ctrl+Enter)`
        : `${t('generate_bar.button_generate')} (Ctrl+Enter)`;

    const showTopIndicator = isHoverIndicatorVisible && !isResizingRef.current && hoverPos.y === 0;
    const showLeftIndicator = isHoverIndicatorVisible && !isResizingRef.current && hoverPos.x === 0;
    const showRightIndicator = isHoverIndicatorVisible && !isResizingRef.current && hoverPos.x !== null && hoverPos.x > 0;
        
    const aspectRatioGroups = {
        Automatic: ['Auto'],
        Landscape: ['21:9', '16:9', '4:3', '3:2'],
        Square: ['1:1'],
        Portrait: ['9:16', '3:4', '2:3'],
        Flexible: ['5:4', '4:5'],
    };

    return (
        <div 
            className={`relative ${selectedImages.length > 0 ? 'pt-[72px]' : ''} pointer-events-none w-full md:mx-auto`}
            style={{ width: `min(${barWidth}px, 100%)` }}
        >
            {selectedImages.length > 0 && (
                <div className="absolute top-2 left-2 md:left-[24px] z-10 flex items-center flex-wrap gap-2 pointer-events-auto">
                    {selectedImages.map((image) => {
                        const globalIndex = workspaceImages.findIndex(wsImg => wsImg.id === image.id);
                        if (globalIndex === -1) return null;
                        return <ReferenceThumbnail key={image.id} image={image} index={globalIndex} onClick={() => onFocusOnImage(image.id)} />
                    })}
                </div>
            )}
            
            <div 
                ref={barRef}
                className="w-full bg-[#1c1c1c] border border-[#262626] rounded-2xl p-4 flex flex-col relative pointer-events-auto md:rounded-[40px] md:p-[18px]"
                style={{ height: `min(${barHeight}px, 40vh)` }}
            >
                {/* Grab Areas - Desktop only */}
                <div className="hidden md:block">
                    <div
                        className="absolute inset-x-0 -top-2 h-5 cursor-ns-resize z-20"
                        onMouseDown={handleVerticalMouseDown}
                        onMouseMove={(e) => handleHoverMove(e, 'top')}
                        onMouseLeave={handleHoverLeave}
                    />
                    <div
                        className="absolute inset-y-0 -left-2 w-5 cursor-ew-resize z-20"
                        onMouseDown={(e) => handleHorizontalMouseDown(e, 'left')}
                        onMouseMove={(e) => handleHoverMove(e, 'left')}
                        onMouseLeave={handleHoverLeave}
                    />
                    <div
                        className="absolute inset-y-0 -right-2 w-5 cursor-ew-resize z-20"
                        onMouseDown={(e) => handleHorizontalMouseDown(e, 'right')}
                        onMouseMove={(e) => handleHoverMove(e, 'right')}
                        onMouseLeave={handleHoverLeave}
                    />
                    {/* Visual Indicator */}
                    <div
                        className="absolute inset-0 rounded-[40px] border-[#d1fe17] pointer-events-none transition-opacity duration-300"
                        style={{
                            opacity: isHoverIndicatorVisible && !isResizingRef.current ? 1 : 0,
                            borderTopWidth: showTopIndicator ? '3px' : '0px',
                            borderLeftWidth: showLeftIndicator ? '3px' : '0px',
                            borderRightWidth: showRightIndicator ? '3px' : '0px',
                            maskImage: 
                                (showTopIndicator && `radial-gradient(80px 40px at ${hoverPos.x}px top, black 40%, transparent 90%)`) ||
                                (showLeftIndicator && `radial-gradient(40px 80px at left ${hoverPos.y}px, black 40%, transparent 90%)`) ||
                                (showRightIndicator && `radial-gradient(40px 80px at right ${hoverPos.y}px, black 40%, transparent 90%)`) || 'none',
                            WebkitMaskImage: 
                                (showTopIndicator && `radial-gradient(80px 40px at ${hoverPos.x}px top, black 40%, transparent 90%)`) ||
                                (showLeftIndicator && `radial-gradient(40px 80px at left ${hoverPos.y}px, black 40%, transparent 90%)`) ||
                                (showRightIndicator && `radial-gradient(40px 80px at right ${hoverPos.y}px, black 40%, transparent 90%)`) || 'none',
                        }}
                    />
                </div>
                
                <div className="flex flex-col h-full">
                    <div className="relative w-full flex-grow min-h-0">
                        <textarea
                            ref={textareaRef}
                            value={userPrompt}
                            onChange={(e) => {
                                onUserPromptChange(e.target.value);
                                syncScroll();
                            }}
                            onScroll={syncScroll}
                            placeholder={t('generate_bar.placeholder')}
                            className="prompt-textarea absolute inset-0 w-full bg-transparent border-none p-3 pr-28 text-transparent placeholder:text-gray-500 focus:outline-none focus:ring-0 resize-none caret-white"
                        />
                         <div
                            ref={rendererRef}
                            className="prompt-textarea absolute inset-0 w-full border-none p-3 pr-28 text-gray-200 resize-none overflow-auto pointer-events-none whitespace-pre-wrap break-words"
                        >
                            {renderHighlightedPrompt}
                        </div>
                        <Tooltip text={t('generate_bar.clear_prompt')} position="left">
                            <button
                                onClick={onClearPrompt}
                                className="absolute top-2 right-12 flex items-center justify-center w-10 h-10 bg-[#222222] hover:bg-[#333333] text-gray-400 hover:text-white rounded-full transition-colors"
                                style={{ visibility: userPrompt ? 'visible' : 'hidden' }}
                            >
                                <Icon name="trash" className="w-5 h-5" />
                            </button>
                        </Tooltip>
                         <Tooltip text={`${t('generate_bar.expand_prompt')} (T)`} position="left">
                            <button 
                                onClick={onExpandPromptEditor} 
                                className="absolute top-2 right-0 flex items-center justify-center w-10 h-10 bg-[#222222] hover:bg-[#333333] text-gray-400 hover:text-white rounded-full transition-colors"
                            >
                                <Icon name="arrows-pointing-out" className="w-5 h-5" />
                            </button>
                        </Tooltip>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex justify-between items-center mt-3 flex-shrink-0 gap-2">
                        {/* Left buttons */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="relative" ref={addMenuRef}>
                                <Tooltip text="Add, Presets & Modes" position="top">
                                    <button
                                        onClick={() => setIsAddMenuOpen(p => !p)}
                                        aria-label="Add, Presets & Modes"
                                        className="flex items-center justify-center w-10 h-10 bg-[#222222] hover:bg-[#333333] rounded-full transition-colors duration-200"
                                    >
                                        <Icon name="plus" className="w-5 h-5 text-white" />
                                    </button>
                                </Tooltip>
                                {isAddMenuOpen && (
                                    <div className="absolute bottom-full left-0 mb-2 w-[225px] bg-[#1c1c1c] border border-[#262626] rounded-xl p-2 shadow-lg z-30 flex flex-col gap-1">
                                        <button
                                            onClick={() => { onAddImage(); setIsAddMenuOpen(false); }}
                                            className="flex items-center gap-3 text-left w-full bg-transparent hover:bg-[#2a2a2a] font-semibold py-2 px-3 rounded-lg transition-colors duration-200 text-gray-200"
                                        >
                                            <Kbd>+</Kbd>
                                            <span>{t('generate_bar.add_image')}</span>
                                        </button>
                                        <button
                                            onClick={() => { onOpenCamera(); setIsAddMenuOpen(false); }}
                                            className="hidden md:flex items-center gap-3 text-left w-full bg-transparent hover:bg-[#2a2a2a] font-semibold py-2 px-3 rounded-lg transition-colors duration-200 text-gray-200"
                                        >
                                            <Kbd>C</Kbd>
                                            <span>{t('generate_bar.camera')}</span>
                                        </button>
                                        <div className="w-full h-px bg-white/10 my-1"></div>
                                        <button
                                            onClick={() => { onShowPresets(); setIsAddMenuOpen(false); }}
                                            className="flex items-center gap-3 text-left w-full bg-transparent hover:bg-[#2a2a2a] font-semibold py-2 px-3 rounded-lg transition-colors duration-200 text-gray-200"
                                        >
                                            <Kbd>P</Kbd>
                                            <span>{t('generate_bar.presets_beta')}</span>
                                        </button>
                                        <div className="w-full h-px bg-white/10 my-1"></div>
                                        <button
                                            onClick={onReasoningModeToggle}
                                            role="switch"
                                            aria-checked={isReasoningModeEnabled}
                                            className="flex items-center justify-between w-full bg-transparent hover:bg-[#2a2a2a] font-semibold py-2 px-3 rounded-lg transition-colors duration-200 text-gray-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Kbd>R</Kbd>
                                                <span className={`transition-colors ${isReasoningModeEnabled ? 'text-white' : 'text-gray-400'}`}>{t('generate_bar.reasoning')}</span>
                                            </div>
                                            <div className="relative w-10 h-5 flex-shrink-0 bg-black rounded-full">
                                                <span className={`absolute top-[2px] left-[2px] block w-4 h-4 rounded-full transform transition-transform duration-300 ease-in-out ${isReasoningModeEnabled ? 'bg-gradient-to-br from-[#A991FF] to-[#FF96AA] translate-x-5' : 'bg-gray-500 translate-x-0'}`} />
                                            </div>
                                        </button>
                                        <button
                                            onClick={onMagicPromptToggle}
                                            role="switch"
                                            aria-checked={isMagicPromptEnabled}
                                            className="flex items-center justify-between w-full bg-transparent hover:bg-[#2a2a2a] font-semibold py-2 px-3 rounded-lg transition-colors duration-200 text-gray-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Kbd>M</Kbd>
                                                <span className={`transition-colors ${isMagicPromptEnabled ? 'text-white' : 'text-gray-400'}`}>{t('generate_bar.magic_prompt')}</span>
                                            </div>
                                            <div className="relative w-10 h-5 flex-shrink-0 bg-black rounded-full">
                                                <span className={`absolute top-[2px] left-[2px] block w-4 h-4 rounded-full transform transition-transform duration-300 ease-in-out ${isMagicPromptEnabled ? 'bg-[#D1FE17] translate-x-5' : 'bg-gray-500 translate-x-0'}`} />
                                            </div>
                                        </button>
                                        <button
                                            onClick={onBadModeToggle}
                                            role="switch"
                                            aria-checked={isBadModeEnabled}
                                            className="flex items-center justify-between w-full bg-transparent hover:bg-[#2a2a2a] font-semibold py-2 px-3 rounded-lg transition-colors duration-200 text-gray-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Kbd>B</Kbd>
                                                <span className={`transition-colors ${isBadModeEnabled ? 'text-white' : 'text-gray-400'}`}>{t('generate_bar.bad_mode')}</span>
                                            </div>
                                            <div className="relative w-10 h-5 flex-shrink-0 bg-black rounded-full">
                                                <span className={`absolute top-[2px] left-[2px] block w-4 h-4 rounded-full transform transition-transform duration-300 ease-in-out ${isBadModeEnabled ? 'bg-red-500 translate-x-5' : 'bg-gray-500 translate-x-0'}`} />
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="relative" ref={aspectRatioRef}>
                                <Tooltip text="Aspect Ratio" position="top">
                                    <button
                                        onClick={() => setIsAspectRatioOpen(p => !p)}
                                        disabled={isAspectRatioEditorActive}
                                        className="flex items-center gap-2 bg-[#222222] hover:bg-[#333333] font-semibold py-2 px-3 rounded-full transition-colors duration-200 h-10 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                    >
                                        <span className="transition-colors text-gray-400">Ratio</span>
                                        <span className="text-white">{aspectRatio}</span>
                                    </button>
                                </Tooltip>
                                {isAspectRatioOpen && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-[#1c1c1c] border border-[#262626] rounded-xl p-2 shadow-lg z-30">
                                        {Object.entries(aspectRatioGroups).map(([group, ratios]) => (
                                            <div key={group} className="mb-2 last:mb-0">
                                                <p className="text-xs text-gray-500 font-bold px-2 mb-1">{group}</p>
                                                <div className="grid grid-cols-4 gap-1">
                                                    {ratios.map(ratio => (
                                                        <button
                                                            key={ratio}
                                                            onClick={() => { onAspectRatioChange(ratio); setIsAspectRatioOpen(false); }}
                                                            className={`py-2 px-1 rounded-md font-mono text-sm transition-colors ${
                                                                aspectRatio === ratio 
                                                                    ? 'bg-[#d1fe17] text-black' 
                                                                    : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#383838]'
                                                            }`}
                                                        >
                                                            {ratio}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="w-px h-6 bg-white/10 mx-1 flex-shrink-0"></div>

                            <div className="flex items-center gap-2 overflow-x-auto prompt-textarea flex-shrink min-w-0">
                                {isMagicPromptEnabled && (
                                    <Tooltip text={`${t('generate_bar.magic_prompt')} (M)`} position="top">
                                        <button
                                            onClick={onMagicPromptToggle}
                                            className="flex items-center gap-2 bg-[#d1fe17]/20 border border-[#d1fe17]/50 text-white font-semibold py-2 px-3 rounded-full transition-colors duration-200 h-10 hover:bg-[#d1fe17]/30 flex-shrink-0"
                                        >
                                            <span>{t('generate_bar.magic_mode_active')}</span>
                                            <Icon name="x" className="w-4 h-4 text-white/70 hover:text-white" />
                                        </button>
                                    </Tooltip>
                                )}
                                {isBadModeEnabled && (
                                    <Tooltip text={t('generate_bar.bad_mode')} position="top">
                                        <button
                                            onClick={onBadModeToggle}
                                            className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-white font-semibold py-2 px-3 rounded-full transition-colors duration-200 h-10 hover:bg-red-500/30 flex-shrink-0"
                                        >
                                            <span>{t('generate_bar.bad_mode_active')}</span>
                                            <Icon name="x" className="w-4 h-4 text-white/70 hover:text-white" />
                                        </button>
                                    </Tooltip>
                                )}
                                {isReasoningModeEnabled && (
                                    <Tooltip text={`${t('generate_bar.reasoning')} (R)`} position="top">
                                        <button
                                            onClick={onReasoningModeToggle}
                                            disabled={isReasoningModeDisabledBySelection}
                                            className={`flex items-center gap-2 border font-semibold py-2 px-3 rounded-full transition-colors duration-200 h-10 flex-shrink-0 ${
                                                isReasoningModeDisabledBySelection
                                                    ? 'bg-gray-500/20 border-gray-500/50 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-br from-[#A991FF]/20 to-[#FF96AA]/20 border-purple-400/50 text-white hover:opacity-80'
                                            }`}
                                        >
                                            <span>{t('generate_bar.reasoning_mode_active')}</span>
                                            {!isReasoningModeDisabledBySelection && <Icon name="x" className="w-4 h-4 text-white/70 hover:text-white" />}
                                        </button>
                                    </Tooltip>
                                )}
                            </div>
                        </div>

                        {/* Right buttons */}
                        <div className="flex items-center gap-2">
                             <VoiceControl
                                liveState={liveState}
                                startSession={startSession}
                                stopSession={stopSession}
                                liveTranscript={liveTranscript}
                            />
                            <Tooltip text={generateTooltipText} position="top">
                                <button
                                    onClick={onGenerate}
                                    disabled={isLoading || !canGenerate}
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 bg-[#d1fe17] hover:bg-lime-300 text-black disabled:bg-[#2D2F31] disabled:text-gray-500 disabled:cursor-not-allowed"
                                >
                                    <Icon name={generateButtonIcon} className="w-5 h-5" />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GenerationBar;