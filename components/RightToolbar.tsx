import React from 'react';
import { Tool } from '../types';
import Icon from './Icon';
import Tooltip from './Tooltip';

interface RightToolbarProps {
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onClear: () => void;
    onFocus: () => void;
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
    context: 'canvas' | 'editor';
    t: (key: string) => string;
}

const ToolButton: React.FC<{ name: string; iconName: string; isActive?: boolean; isDisabled?: boolean; onClick: () => void; hotkey?: string }> = ({ name, iconName, isActive, isDisabled, onClick, hotkey }) => (
    <Tooltip text={hotkey ? `${name} (${hotkey})` : name} position="left">
        <button
            onClick={onClick}
            aria-label={name}
            disabled={isDisabled}
            className={`p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[#d1fe17] w-full h-10 flex items-center justify-center ${isActive ? 'bg-[#d1fe17]/80 text-black' : 'hover:bg-white/10 text-gray-300'} disabled:text-gray-600 disabled:bg-transparent disabled:cursor-not-allowed`}
        >
            <Icon name={iconName} className="w-6 h-6" />
        </button>
    </Tooltip>
);

const RightToolbar: React.FC<RightToolbarProps> = ({
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onClear,
    onFocus,
    activeTool,
    onToolChange,
    context,
    t
}) => {
    return (
        <div 
            className="w-14 bg-[#1c1c1c] rounded-2xl p-2 shadow-2xl flex flex-col items-center gap-2 border border-[#262626]" 
        >
            <ToolButton name={t('toolbar.right.undo')} iconName="undo" onClick={onUndo} isDisabled={!canUndo} hotkey="Ctrl+Z" />
            <ToolButton name={t('toolbar.right.redo')} iconName="redo" onClick={onRedo} isDisabled={!canRedo} hotkey="Ctrl+Shift+Z" />

            <div className="w-full h-px bg-white/20 my-1"></div>

            <ToolButton name={t('toolbar.right.selection')} iconName="cursor" isActive={activeTool === Tool.Selection} onClick={() => onToolChange(Tool.Selection)} hotkey="V" />
            <ToolButton name={t('toolbar.right.hand')} iconName="hand" isActive={activeTool === Tool.Hand} onClick={() => onToolChange(Tool.Hand)} hotkey="H" />
            {context === 'editor' && (
                <Tooltip text={t('toolbar.right.focus')} position="left">
                    <button onClick={onFocus} className={`p-2 rounded-lg transition-colors duration-200 hover:bg-white/10 text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[#d1fe17] w-full h-10 flex items-center justify-center`}>
                         <Icon name="focus" className="w-6 h-6" />
                    </button>
                </Tooltip>
            )}
            
            <div className="flex-grow"></div>

            <div className="w-full h-px bg-white/20 my-1"></div>
            <ToolButton 
                name={context === 'editor' ? t('toolbar.right.clear_sketches') : "Clear Canvas"} 
                iconName="trash" 
                onClick={onClear} 
            />
        </div>
    );
};

export default RightToolbar;