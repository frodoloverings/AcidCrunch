
import React, { useRef, useEffect, useState } from 'react';
import Icon from './Icon';

interface DonateModalProps {
    isOpen: boolean;
    onClose: () => void;
    t: (key: string) => string;
}

const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose, t }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState('sber');

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
            <div ref={modalRef} className="relative flex flex-col bg-[#1c1c1c] rounded-2xl p-6 shadow-2xl border border-[#262626] w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-white">{t('donate_modal.title')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-gray-400 mb-6">{t('donate_modal.description')}</p>
                <div className="flex border-b border-gray-700 mb-4">
                    <button onClick={() => setActiveTab('sber')} className={`py-2 px-4 font-semibold ${activeTab === 'sber' ? 'text-[#d1fe17] border-b-2 border-[#d1fe17]' : 'text-gray-400'}`}>{t('donate_modal.tab_sber')}</button>
                    <button onClick={() => setActiveTab('yandex')} className={`py-2 px-4 font-semibold ${activeTab === 'yandex' ? 'text-[#d1fe17] border-b-2 border-[#d1fe17]' : 'text-gray-400'}`}>{t('donate_modal.tab_yandex')}</button>
                </div>
                <div>
                    {activeTab === 'sber' && (
                        <div className="text-center">
                           <img src="https://raw.githubusercontent.com/frodoloverings/qr-storage/main/image.png" alt="Sber QR Code" className="w-64 h-64 mx-auto rounded-lg" />
                        </div>
                    )}
                    {activeTab === 'yandex' && (
                        <div className="text-center">
                            <a href="https://tips.yandex.ru/guest/payment/3556182" target="_blank" rel="noopener noreferrer" className="inline-block w-64 h-64">
                                <button className="w-full h-full bg-red-600 hover:bg-red-700 text-white text-3xl font-bold rounded-lg transition-colors flex items-center justify-center">
                                    {t('donate_modal.yandex_pay_button')}
                                </button>
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DonateModal;
