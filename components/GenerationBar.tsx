
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Icon from './Icon';
import { Language } from '../i18n';
import { WorkspaceImage } from '../types';
import Tooltip from './Tooltip';

interface GenerationBarProps {
    userPrompt: string;
    onUserPromptChange: (prompt: string) => void;
    onGenerate: () => void;
    onReasoning: () => void;
    loadingAction: 'generate' | 'reasoning' | 'enhance' | 'rtx' | 'mix' | null;
    canGenerate: boolean;
    language: Language;
    isMagicPromptEnabled: boolean;
    onMagicPromptToggle: () => void;
    selectedImages: WorkspaceImage[];
    workspaceImages: WorkspaceImage[];
    highlightedRefs: number[];
    isAspectRatioEditorActive?: boolean;
    t: (key: string) => string;
    onExpandPromptEditor: () => void;
    onClearPrompt: () => void;
    onAddImage: () => void;
    onShowPresets: () => void;
    onFocusOnImage: (imageId: number) => void;
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


const GenerationBar: React.FC<GenerationBarProps> = ({
    userPrompt,
    onUserPromptChange,
    onGenerate,
    onReasoning,
    loadingAction,
    canGenerate,
    language,
    isMagicPromptEnabled,
    onMagicPromptToggle,
    selectedImages,
    workspaceImages,
    highlightedRefs,
    t,
    onExpandPromptEditor,
    onClearPrompt,
    onAddImage,
    onShowPresets,
    onFocusOnImage,
    isAspectRatioEditorActive,
}) => {
    const [barHeight, setBarHeight] = useState(MIN_HEIGHT);
    const [barWidth, setBarWidth] = useState(730);

    const isResizingRef = useRef<'vertical' | 'horizontal-left' | 'horizontal-right' | null>(null);
    const startYRef = useRef(0);
    const startHeightRef = useRef(0);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);
    const barRef = useRef<HTMLDivElement>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const rendererRef = useRef<HTMLDivElement>(null);

    const isLoading = loadingAction !== null;

    const [isHoverIndicatorVisible, setIsHoverIndicatorVisible] = useState(false);
    const [hoverPos, setHoverPos] = useState<{ x: number | null, y: number | null }>({ x: null, y: null });
    const indicatorTimeoutRef = useRef<number | null>(null);

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

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current);
        };
    }, []);

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

    const isReasoningDisabled = isLoading || !userPrompt.trim() || selectedImages.length !== 1 || isAspectRatioEditorActive;

    const showTopIndicator = isHoverIndicatorVisible && !isResizingRef.current && hoverPos.y === 0;
    const showLeftIndicator = isHoverIndicatorVisible && !isResizingRef.current && hoverPos.x === 0;
    const showRightIndicator = isHoverIndicatorVisible && !isResizingRef.current && hoverPos.x !== null && hoverPos.x > 0;

    const generateTooltipText = isAspectRatioEditorActive
        ? t('generate_bar.button_generate_outpainting')
        : `${t('generate_bar.button_generate')} (Shift+Enter)`;

    return (
        <div 
            className={`relative ${selectedImages.length > 0 ? 'pt-[72px]' : ''} pointer-events-none`}
            style={{ width: `${barWidth}px` }}
        >
            {selectedImages.length > 0 && (
                <div className="absolute top-2 left-[24px] z-10 flex items-center flex-wrap gap-2 pointer-events-auto">
                    {selectedImages.map((image) => {
                        const globalIndex = workspaceImages.findIndex(wsImg => wsImg.id === image.id);
                        if (globalIndex === -1) return null;
                        return <ReferenceThumbnail key={image.id} image={image} index={globalIndex} onClick={() => onFocusOnImage(image.id)} />
                    })}
                </div>
            )}
            
            <div 
                ref={barRef}
                className="w-full bg-[#1c1c1c] border border-[#262626] rounded-[40px] p-[18px] flex flex-col relative pointer-events-auto"
                style={{ height: `${barHeight}px` }}
            >
                {/* Grab Areas */}
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
                    <div className="flex justify-between items-center mt-3 flex-shrink-0">
                        {/* Left buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Tooltip text={`${t('generate_bar.add_image')} (+)`} position="top">
                                 <button
                                    onClick={onAddImage}
                                    aria-label={t('generate_bar.add_image')}
                                    className="flex items-center justify-center w-10 h-10 bg-[#222222] hover:bg-[#333333] rounded-full transition-colors duration-200"
                                >
                                    <Icon name="plus" className="w-5 h-5 text-white" />
                                </button>
                            </Tooltip>
                             <Tooltip text={`${t('generate_bar.presets_beta')} (P)`} position="top">
                                <button
                                    onClick={onShowPresets}
                                    aria-label={t('generate_bar.presets_beta')}
                                    className="flex items-center justify-center w-10 h-10 bg-[#222222] hover:bg-[#333333] rounded-full transition-colors duration-200"
                                >
                                    <Icon name="list" className="w-5 h-5 text-white" />
                                </button>
                            </Tooltip>

                            <div className="w-px h-6 bg-white/10 mx-1"></div>
                            
                             <Tooltip text={`${t('generate_bar.magic_prompt')} (M)`} position="top">
                                <button
                                    onClick={onMagicPromptToggle}
                                    role="switch"
                                    aria-checked={isMagicPromptEnabled}
                                    className={`flex items-center gap-3 bg-[#222222] hover:bg-[#333333] font-semibold py-2 px-3 rounded-full transition-colors duration-200 h-10`}
                                >
                                    <span className={`transition-colors ${isMagicPromptEnabled ? 'text-[#D1FE17]' : 'text-gray-400'}`}>
                                        Magic
                                    </span>
                                    {/* Switch Track */}
                                    <div className="relative w-10 h-5 flex-shrink-0 bg-black rounded-full">
                                        {/* Switch Thumb */}
                                        <span
                                            className={`absolute top-[2px] left-[2px] block w-4 h-4 rounded-full transform transition-transform duration-300 ease-in-out ${
                                                isMagicPromptEnabled ? 'bg-[#D1FE17] translate-x-5' : 'bg-gray-500 translate-x-0'
                                            }`}
                                        />
                                    </div>
                                </button>
                             </Tooltip>
                        </div>
                        {/* Right buttons */}
                        <div className="flex items-center gap-2">
                            <Tooltip text={`${t('generate_bar.reasoning')} (R)`} position="top">
                                <button
                                    onClick={onReasoning}
                                    disabled={isReasoningDisabled}
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-gradient-to-br from-[#A991FF] to-[#FF96AA] text-black hover:opacity-90 disabled:bg-none disabled:bg-[#2D2F31] disabled:text-gray-500 disabled:cursor-not-allowed"
                                >
                                    <Icon name="sparkle-star" className="w-5 h-5" />
                                </button>
                            </Tooltip>
                            <Tooltip text={generateTooltipText} position="top">
                                <button
                                    onClick={onGenerate}
                                    disabled={isLoading || !canGenerate}
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 bg-[#d1fe17] hover:bg-lime-300 text-black disabled:bg-[#2D2F31] disabled:text-gray-500 disabled:cursor-not-allowed"
                                >
                                    <Icon name={isAspectRatioEditorActive ? 'check' : 'arrow-up'} className="w-5 h-5" />
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
