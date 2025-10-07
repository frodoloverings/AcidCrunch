
import React, { useState, useEffect } from 'react';
import Icon from './Icon';

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

export default PromptEditorModal;
