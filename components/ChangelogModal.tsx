
import React, { useRef, useEffect, useState } from 'react';
import Icon from './Icon';

interface ChangelogModalProps {
    isOpen: boolean;
    onClose: () => void;
    t: (key: string) => string;
}

const ChangeLogEntry: React.FC<{
    version: string;
    subtitle: string;
    features: string;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ version, subtitle, features, isOpen, onToggle }) => (
    <div>
        <button
            onClick={onToggle}
            className="w-full text-left p-3 bg-[#2a2a2a] hover:bg-[#383838] rounded-lg transition-colors text-gray-200 flex justify-between items-center"
        >
            <div>
                <h4 className="text-xl font-bold text-[#d1fe17]">{version}</h4>
                <p className="text-lg text-white mt-1">{subtitle}</p>
            </div>
            <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} className="w-6 h-6 transition-transform" />
        </button>
        <div
            className="grid transition-[grid-template-rows] duration-300 ease-in-out"
            style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
        >
            <div className="overflow-hidden">
                <div className="pt-4 pl-4 ml-4 border-l-2 border-gray-700">
                    <div className="space-y-3 text-gray-300">
                        {features.trim().split('\n').map((line, index) => (
                            <p key={index}>{line.trim().replace(/^- /, '')}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose, t }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [openVersion, setOpenVersion] = useState('v2_2');

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

    const handleToggle = (version: string) => {
        setOpenVersion(prev => (prev === version ? null : version));
    };

    const versions = ['v2_2', 'v2_0', 'v1_5_1', 'v1_5', 'v1_4', 'v1_3', 'v1_2', 'v1_1', 'v1_0'];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div ref={modalRef} className="relative flex flex-col bg-[#1c1c1c] rounded-2xl p-6 shadow-2xl border border-[#262626] w-full max-w-2xl max-h-[85vh]">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h3 className="text-2xl font-bold text-white">{t('changelog.title')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto pr-4">
                     {versions.map(version => (
                        <div key={version} className="mb-2">
                            <ChangeLogEntry
                                version={t(`changelog.${version}.title`)}
                                subtitle={t(`changelog.${version}.subtitle`)}
                                features={t(`changelog.${version}.features`)}
                                isOpen={openVersion === version}
                                onToggle={() => handleToggle(version)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChangelogModal;