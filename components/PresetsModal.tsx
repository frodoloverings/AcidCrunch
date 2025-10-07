
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Icon from './Icon';
import { Language } from '../i18n';
import { getPresetData } from '../presets';
import { PresetTags } from '../types';

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

export default PresetsModal;
