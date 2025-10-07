

import React, { useState, useRef, useEffect } from 'react';
import Icon from '../Icon';
import Tooltip from '../Tooltip';
import { WorkspaceImage } from '../../types';

interface FloatingActionBarProps {
  singleSelectedImg: WorkspaceImage | null;
  isLoading: boolean;
  t: (key: string) => string;
  onEditRequest: (id: number) => void;
  onRegenerate: (id: number) => void;
  onEnterAspectRatioMode: (id: number) => void;
  onRtxGenerate: () => void;
  onEnhance: () => void;
  onMix: () => void;
  onRefGenerate: () => void;
  onReplicaGenerate: () => void;
  onDownload: () => void;
  onDelete: () => void;
  viewTransform: { scale: number; panX: number; panY: number; };
}

const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  singleSelectedImg, isLoading, t,
  onEditRequest, onRegenerate, onEnterAspectRatioMode, onRtxGenerate, onEnhance, onMix, onRefGenerate, onReplicaGenerate, onDownload, onDelete,
  viewTransform
}) => {
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!singleSelectedImg) return null;

  const handleActionClick = (action: () => void) => {
    action();
    setIsActionsMenuOpen(false);
  };

  return (
    <div className="absolute z-10 flex flex-col items-center justify-center gap-4 pointer-events-none"
      style={{
        left: singleSelectedImg.x * viewTransform.scale + viewTransform.panX,
        top: singleSelectedImg.y * viewTransform.scale + viewTransform.panY,
        width: singleSelectedImg.width * viewTransform.scale,
        height: 0
      }}>
      <div data-canvas-ui-interactive="true" className="flex items-center gap-2 bg-[#1c1c1c] p-2 rounded-full shadow-lg pointer-events-auto" style={{ transform: 'translateY(-50px)' }}>
        {/* Group 1: Edit Setup */}
        <Tooltip text={`${t('toolbar.edit_image')} (Shift+E)`} position="top">
          <button onClick={() => onEditRequest(singleSelectedImg.id)} disabled={isLoading} className="w-10 h-10 bg-[#d1fe17] text-black rounded-full flex items-center justify-center hover:bg-lime-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <Icon name="edit" className="w-5 h-5" />
          </button>
        </Tooltip>
        <Tooltip text={`${t('workspace.aspect_ratio_edit')} (Shift+A)`} position="top">
          <button onClick={() => onEnterAspectRatioMode(singleSelectedImg.id)} disabled={isLoading} className="w-10 h-10 bg-[#2a2a2a] text-white rounded-full flex items-center justify-center hover:bg-[#383838] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <Icon name="arrows-pointing-out" className="w-5 h-5" />
          </button>
        </Tooltip>

        <div className="w-px h-6 bg-white/20" />
        
        {/* Group 2: Generative Actions */}
        <div className="relative" ref={actionsMenuRef}>
            <Tooltip text={t('toolbar.actions_tooltip')} position="top">
                <button 
                    onClick={() => setIsActionsMenuOpen(prev => !prev)} 
                    disabled={isLoading} 
                    className="w-auto h-10 px-4 bg-[#2a2a2a] text-white rounded-full flex items-center justify-center hover:bg-[#383838] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
                >
                    {t('toolbar.actions')}
                </button>
            </Tooltip>
            {isActionsMenuOpen && (
                <div className="absolute top-full mt-2 w-40 bg-[#2a2a2a] border border-[#383838] rounded-xl p-1 shadow-lg z-10 flex flex-col gap-1">
                    <Tooltip text={t('toolbar.left.enhance')} position="right" className="w-full">
                        <button onClick={() => handleActionClick(onEnhance)} className="w-full text-left px-3 py-2 text-gray-200 font-semibold rounded-lg hover:bg-[#383838] transition-colors">
                            Enhance
                        </button>
                    </Tooltip>
                    <Tooltip text={t('toolbar.rtx')} position="right" className="w-full">
                        <button onClick={() => handleActionClick(onRtxGenerate)} className="w-full text-left px-3 py-2 text-gray-200 font-semibold rounded-lg hover:bg-[#383838] transition-colors">
                            RTX
                        </button>
                    </Tooltip>
                    <Tooltip text={t('toolbar.mix')} position="right" className="w-full">
                        <button onClick={() => handleActionClick(onMix)} className="w-full text-left px-3 py-2 text-gray-200 font-semibold rounded-lg hover:bg-[#383838] transition-colors">
                            Mix
                        </button>
                    </Tooltip>
                    <Tooltip text={t('toolbar.ref')} position="right" className="w-full">
                        <button onClick={() => handleActionClick(onRefGenerate)} className="w-full text-left px-3 py-2 text-gray-200 font-semibold rounded-lg hover:bg-[#383838] transition-colors">
                            Reference
                        </button>
                    </Tooltip>
                    <Tooltip text={t('toolbar.rep')} position="right" className="w-full">
                        <button onClick={() => handleActionClick(onReplicaGenerate)} className="w-full text-left px-3 py-2 text-gray-200 font-semibold rounded-lg hover:bg-[#383838] transition-colors">
                            Replica
                        </button>
                    </Tooltip>
                </div>
            )}
        </div>
        
        <div className="w-px h-6 bg-white/20" />

        {/* Group 3: Management */}
        {singleSelectedImg.generationContext && (
          <Tooltip text={`${t('workspace.regenerate')} (Ctrl+R)`} position="top">
            <button onClick={() => onRegenerate(singleSelectedImg.id)} disabled={isLoading} className="w-10 h-10 bg-[#2a2a2a] text-white rounded-full flex items-center justify-center hover:bg-[#383838] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <Icon name="refresh" className="w-5 h-5" />
            </button>
          </Tooltip>
        )}
        <Tooltip text={`${t('generate_bar.download')} (Shift+S)`} position="top">
          <button onClick={onDownload} disabled={isLoading} className="w-10 h-10 bg-[#2a2a2a] text-white rounded-full flex items-center justify-center hover:bg-[#383838] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <Icon name="download" className="w-5 h-5" />
          </button>
        </Tooltip>
        <Tooltip text={`${t('toolbar.right.delete_image')} (Del)`} position="top">
          <button onClick={onDelete} disabled={isLoading} className="w-10 h-10 bg-[#2a2a2a] text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <Icon name="trash" className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default FloatingActionBar;
