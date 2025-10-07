import React, { useRef, useEffect, useState } from 'react';
import Icon from './Icon';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
    onUseStudioKey: () => void;
    currentKeySource: 'user' | 'studio';
    t: (key: string) => string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, onUseStudioKey, currentKeySource, t }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [apiKeyInput, setApiKeyInput] = useState('');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (apiKeyInput.trim()) {
            onSave(apiKeyInput.trim());
            onClose();
        }
    };

    const handleUseStudio = () => {
        onUseStudioKey();
        onClose();
    };


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div ref={modalRef} className="relative flex flex-col bg-[#1c1c1c] rounded-2xl p-6 shadow-2xl border border-[#262626] w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-white">{t('api_key_modal.title')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                <div className="text-gray-400 mb-4">
                    <p>{t('api_key_modal.description')}</p>
                    <p className="mt-2">{t('api_key_modal.current_key')} <span className={`font-bold ${currentKeySource === 'user' ? 'text-green-400' : 'text-cyan-400'}`}>{currentKeySource === 'user' ? t('api_key_modal.user_key_display') : t('api_key_modal.studio_key_display')}</span></p>
                </div>
                <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={t('api_key_modal.placeholder')}
                    className="w-full bg-[#111] border border-[#363636] rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d1fe17]"
                />
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={handleUseStudio} className="bg-[#2a2a2a] hover:bg-[#383838] text-gray-200 font-bold py-2 px-6 rounded-lg transition-colors">
                        {t('api_key_modal.use_studio_key_button')}
                    </button>
                    <button onClick={handleSave} disabled={!apiKeyInput.trim()} className="bg-[#d1fe17] hover:bg-lime-300 text-black font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-600 disabled:text-gray-800 disabled:cursor-not-allowed">
                        {t('api_key_modal.save_button')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;