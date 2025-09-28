
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Tool } from '../types';
import Icon from './Icon';
import Tooltip from './Tooltip';

interface LeftToolbarProps {
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
    brushColor: string;
    onBrushColorChange: (color: string) => void;
    brushSize: number;
    onBrushSizeChange: (size: number) => void;
    onConfirmEdits: () => void;
    onAddLayer: () => void;
    t: (key: string) => string;
}

const ToolButton: React.FC<{ name: string; iconName: string; isActive: boolean; isDisabled?: boolean; onClick: () => void, hotkey?: string }> = ({ name, iconName, isActive, isDisabled, onClick, hotkey }) => (
    <Tooltip text={hotkey ? `${name} (${hotkey})` : name} position="right">
        <button
            onClick={onClick}
            aria-label={name}
            disabled={isDisabled}
            className={`p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[#d1fe17] w-full h-10 flex items-center justify-center 
                ${isActive ? 'bg-[#d1fe17] text-black' : 'hover:bg-white/10 text-gray-300'}
                ${isDisabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}`}
        >
            <Icon name={iconName} className="w-6 h-6" />
        </button>
    </Tooltip>
);

const LeftToolbar: React.FC<LeftToolbarProps> = ({
    activeTool,
    onToolChange,
    brushColor,
    onBrushColorChange,
    brushSize,
    onBrushSizeChange,
    onConfirmEdits,
    onAddLayer,
    t,
}) => {
    const sliderTrackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    const min = 2;
    const max = 50;
    
    const [inputValue, setInputValue] = useState(brushSize.toString());

    useEffect(() => {
        setInputValue(brushSize.toString());
    }, [brushSize]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputCommit = () => {
        let value = parseInt(inputValue, 10);
        if (isNaN(value)) {
            value = min;
        }
        const clampedValue = Math.max(min, Math.min(max, value));
        onBrushSizeChange(clampedValue);
        setInputValue(clampedValue.toString());
    };

    const handleValueChange = useCallback((e: MouseEvent | React.MouseEvent) => {
        if (!sliderTrackRef.current) return;
        const rect = sliderTrackRef.current.getBoundingClientRect();
        
        const relativeY = e.clientY - rect.top;
        const percentage = Math.max(0, Math.min(1, relativeY / rect.height));
        
        const value = Math.round(min + percentage * (max - min));
        onBrushSizeChange(value);
    }, [onBrushSizeChange, min, max]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => { if (isDragging) { e.preventDefault(); handleValueChange(e); }};
        const handleMouseUp = () => setIsDragging(false);
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleValueChange]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
        setIsDragging(true);
        handleValueChange(e);
    };

    const thumbPositionPercent = ((brushSize - min) / (max - min)) * 100;

    return (
        <div className={`w-14 bg-[#1c1c1c] rounded-2xl p-2 shadow-2xl flex flex-col items-center gap-2 border border-[#262626]`}>
            <ToolButton name={t('editor.confirm_edits')} iconName="check" isActive={true} onClick={onConfirmEdits} isDisabled={false} />
            <Tooltip text={t('toolbar.left.add_layer')} position="right">
                <button
                    onClick={onAddLayer}
                    aria-label={t('toolbar.left.add_layer')}
                    className={`p-2 rounded-lg transition-colors duration-200 hover:bg-white/10 text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[#d1fe17] w-full h-10 flex items-center justify-center`}
                >
                    <Icon name="plus" className="w-6 h-6" />
                </button>
            </Tooltip>

            <div className="w-full h-px bg-white/20 my-1"></div>
            
            <div className={`flex flex-col items-center gap-2 w-full`}>
                <ToolButton name={t('toolbar.left.brush')} iconName="brush" isActive={activeTool === Tool.Brush} onClick={() => onToolChange(Tool.Brush)} hotkey="B" />
                <ToolButton name={t('toolbar.left.lasso')} iconName="lasso" isActive={activeTool === Tool.Lasso} onClick={() => onToolChange(Tool.Lasso)} hotkey="L" />
                <ToolButton name={t('toolbar.left.arrow')} iconName="arrow" isActive={activeTool === Tool.Arrow} onClick={() => onToolChange(Tool.Arrow)} hotkey="A" />
                <ToolButton name={t('toolbar.left.text')} iconName="text" isActive={activeTool === Tool.Text} onClick={() => onToolChange(Tool.Text)} hotkey="I" />
                
                <div className="w-full h-px bg-white/20 my-1"></div>
                
                <div 
                    onMouseDown={handleMouseDown}
                    className={`relative bg-[#2a2a2a] p-2 rounded-xl flex flex-col items-center gap-2 select-none w-full cursor-pointer`}
                >
                    <div className="relative w-8 h-8 flex items-center justify-center">
                        <input
                            type="color"
                            value={brushColor}
                            onChange={(e) => onBrushColorChange(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            aria-label={t('toolbar.left.color_picker_title')}
                        />
                        <div className="w-6 h-6 rounded-full border-2 border-black/20 pointer-events-none" style={{ backgroundColor: brushColor }}></div>
                    </div>

                    <div ref={sliderTrackRef} className="relative h-12 w-full flex justify-center">
                        <div className="w-1.5 h-full bg-gray-500 rounded-full"></div>
                        <div 
                            className="absolute w-5 h-5 bg-[#d1fe17] rounded-full border-2 border-gray-900 pointer-events-none"
                            style={{ 
                                top: `calc(${thumbPositionPercent}% - 10px)`,
                                left: '50%',
                                transform: 'translateX(-50%)'
                            }}
                        ></div>
                    </div>
                     <input
                        type="number"
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleInputCommit}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleInputCommit(); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full bg-gray-800 text-white text-center rounded text-xs font-mono p-1 border-transparent focus:ring-1 focus:ring-[#d1fe17] focus:border-transparent appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min={min}
                        max={max}
                    />
                </div>
            </div>
        </div>
    );
};

export default LeftToolbar;
