

import React, { useRef, useEffect, useState } from 'react';
import Icon from './Icon';

interface HallOfFameModalProps {
    isOpen: boolean;
    onClose: () => void;
    t: (key: string) => string;
}

const FameEntry: React.FC<{
    name: string;
    link: string;
    desc: string;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ name, link, desc, isOpen, onToggle }) => {
    return (
        <div>
            <button
                onClick={onToggle}
                className="w-full text-left p-4 bg-[#2a2a2a] hover:bg-[#383838] rounded-lg transition-colors text-gray-200 flex justify-between items-center"
            >
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-3 text-lg text-white hover:text-cyan-300 transition-colors group"
                >
                    <Icon name="link" className="w-5 h-5 text-gray-500 group-hover:text-cyan-300 transition-colors" />
                    <span className="group-hover:underline">{name}</span>
                </a>
                <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} className="w-6 h-6 transition-transform" />
            </button>
            <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: isOpen ? '1000px' : '0px' }}
            >
                <div className="pt-4 pl-4 ml-4 border-l-2 border-gray-700">
                    <p className="text-gray-300">{desc}</p>
                </div>
            </div>
        </div>
    );
};


const HallOfFameModal: React.FC<HallOfFameModalProps> = ({ isOpen, onClose, t }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [openEntry, setOpenEntry] = useState<string | null>(null);

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

    const handleToggle = (name: string) => {
        setOpenEntry(prev => (prev === name ? null : name));
    };

    const creator = { name: 'Волков Фёдор (aka AcidCrunch)', link: 'https://t.me/acidcrunch', desc: t('hall_of_fame.creator_desc') };
    const secondPilots = [
        { name: 'M I K H Ξ Y S', link: 'https://t.me/mouseinmilk', desc: t('hall_of_fame.mikheys_desc') },
    ];
    const goldenBoys = [
        { name: 'Назар | Авито • Боты', link: 'https://t.me/naz_ai', desc: t('hall_of_fame.nazar_desc') },
    ];
    const upgraders = [
        { name: 'Islam Ibrakhimzhanov', link: 'https://t.me/shumbola_ai', desc: t('hall_of_fame.islam_desc') },
        { name: 'Иван Филатов', link: 'https://t.me/neiro_secrets', desc: t('hall_of_fame.filatov_desc') },
    ];
    const boosters = [
        { name: 'Max Kim (Нейромания)', link: 'https://t.me/NeuromaniacMAX', desc: t('hall_of_fame.max_kim_desc') },
        { name: 'Сергей Беляк', link: 'https://t.me/belyakAi', desc: t('hall_of_fame.belyak_desc') },
        { name: 'Нейросетевые мемы', link: 'https://t.me/stdif_kos', desc: t('hall_of_fame.memes_desc') },
    ];


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div ref={modalRef} className="relative flex flex-col bg-[#1c1c1c] rounded-2xl p-6 shadow-2xl border border-[#262626] w-full max-w-2xl max-h-[80vh]">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h3 className="text-2xl font-bold text-white">{t('hall_of_fame.title')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto space-y-5 pr-2">
                     <div>
                        <h4 className="text-xl font-bold text-[#d1fe17] mb-3">{t('hall_of_fame.creator')}</h4>
                        <div className="space-y-2">
                            <FameEntry 
                                name={creator.name}
                                link={creator.link}
                                desc={creator.desc}
                                isOpen={openEntry === creator.name}
                                onToggle={() => handleToggle(creator.name)}
                            />
                        </div>
                    </div>
                     <div>
                        <h4 className="text-xl font-bold text-[#d1fe17] mb-3">{t('hall_of_fame.second_pilot')}</h4>
                        <div className="space-y-2">
                            {secondPilots.map(person => (
                                 <FameEntry 
                                    key={person.name}
                                    name={person.name}
                                    link={person.link}
                                    desc={person.desc}
                                    isOpen={openEntry === person.name}
                                    onToggle={() => handleToggle(person.name)}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-[#d1fe17] mb-3">{t('hall_of_fame.golden_boys')}</h4>
                        <div className="space-y-2">
                            {goldenBoys.map(person => (
                                 <FameEntry 
                                    key={person.name}
                                    name={person.name}
                                    link={person.link}
                                    desc={person.desc}
                                    isOpen={openEntry === person.name}
                                    onToggle={() => handleToggle(person.name)}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-[#d1fe17] mb-3">{t('hall_of_fame.upgraders')}</h4>
                        <div className="space-y-2">
                            {upgraders.map(person => (
                                 <FameEntry 
                                    key={person.name}
                                    name={person.name}
                                    link={person.link}
                                    desc={person.desc}
                                    isOpen={openEntry === person.name}
                                    onToggle={() => handleToggle(person.name)}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                         <h4 className="text-xl font-bold text-[#d1fe17] mb-3">{t('hall_of_fame.boosters')}</h4>
                         <div className="space-y-2">
                            {boosters.map(person => (
                                 <FameEntry 
                                    key={person.name}
                                    name={person.name}
                                    link={person.link}
                                    desc={person.desc}
                                    isOpen={openEntry === person.name}
                                    onToggle={() => handleToggle(person.name)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HallOfFameModal;