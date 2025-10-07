import React from 'react';
import Icon from '../Icon';
import Tooltip from '../Tooltip';

interface AspectRatioEditorUIProps {
    outpaintingState: { image: { x: number, y: number, width: number, height: number } };
    viewTransform: { scale: number, panX: number, panY: number };
    handleCancelOutpainting: () => void;
    handleCropAndSave: () => void;
    confirmAspectRatioEdit: () => void;
    outpaintingWidthInput: string;
    outpaintingHeightInput: string;
    handleAspectRatioInputChange: (part: 'width' | 'height', value: string) => void;
    handleAspectRatioKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleSwapAspectRatio: () => void;
    isBgTransparent: boolean;
    setIsBgTransparent: (isTransparent: boolean) => void;
    outpaintingBgColor: string;
    setOutpaintingBgColor: (color: string) => void;
    t: (key: string) => string;
}

const AspectRatioEditorUI: React.FC<AspectRatioEditorUIProps> = ({
    outpaintingState, viewTransform,
    handleCancelOutpainting, handleCropAndSave, confirmAspectRatioEdit,
    outpaintingWidthInput, outpaintingHeightInput,
    handleAspectRatioInputChange, handleAspectRatioKeyDown, handleSwapAspectRatio,
    isBgTransparent, setIsBgTransparent, outpaintingBgColor, setOutpaintingBgColor, t
}) => {
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
                <Tooltip text={t('workspace.crop')} position="top">
                    <button onClick={handleCropAndSave} className="w-12 h-12 flex items-center justify-center bg-[#2a2a2a] text-gray-200 rounded-full hover:bg-[#383838] transition-colors" title={t('workspace.crop')}>
                        <Icon name="crop" className="w-6 h-6" />
                    </button>
                </Tooltip>
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
                <Tooltip text="Transparent Background" position="top">
                    <button 
                        onClick={() => setIsBgTransparent(true)}
                        className={`w-12 h-12 flex items-center justify-center bg-[#2a2a2a] rounded-full hover:bg-[#383838] transition-colors relative overflow-hidden
                        ${isBgTransparent ? 'ring-2 ring-offset-2 ring-offset-[#1c1c1c] ring-[#d1fe17]' : ''}`}
                    >
                        <div className="w-7 h-7 rounded-full checkerboard border-2 border-white/50"></div>
                    </button>
                </Tooltip>
                 <div 
                    className={`relative w-12 h-12 flex items-center justify-center bg-[#2a2a2a] rounded-full hover:bg-[#383838] transition-colors
                    ${!isBgTransparent ? 'ring-2 ring-offset-2 ring-offset-[#1c1c1c] ring-[#d1fe17]' : ''}`} 
                    title={t('workspace.change_bg_color')}
                    onClick={() => setIsBgTransparent(false)}
                >
                    <input
                        type="color"
                        value={outpaintingBgColor}
                        onChange={(e) => {
                            setOutpaintingBgColor(e.target.value);
                            setIsBgTransparent(false);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-7 h-7 rounded-full border-2 border-white/50 pointer-events-none" style={{ backgroundColor: outpaintingBgColor }} />
                </div>
            </div>
        </div>
    );
}

export default AspectRatioEditorUI;