
import React, { useRef, useEffect } from 'react';
import Icon from './Icon';

interface CameraConsentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    t: (key: string) => string;
}

const CameraConsentModal: React.FC<CameraConsentModalProps> = ({ isOpen, onClose, onConfirm, t }) => {
    const modalRef = useRef<HTMLDivElement>(null);

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

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div ref={modalRef} className="relative flex flex-col bg-[#1c1c1c] rounded-2xl p-6 shadow-2xl border border-[#262626] w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-white">{t('camera_consent_modal.title')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                <div className="text-gray-400 mb-6 space-y-4">
                    <p>{t('camera_consent_modal.p1')}</p>
                    <p>{t('camera_consent_modal.p2')}</p>
                </div>
                <div className="flex justify-end gap-4 mt-2">
                    <button onClick={onClose} className="bg-[#2a2a2a] hover:bg-[#383838] text-gray-200 font-bold py-2 px-6 rounded-lg transition-colors">
                        {t('camera_consent_modal.cancel_button')}
                    </button>
                    <button onClick={onConfirm} className="bg-[#d1fe17] hover:bg-lime-300 text-black font-bold py-2 px-6 rounded-lg transition-colors">
                        {t('camera_consent_modal.agree_button')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CameraConsentModal;
