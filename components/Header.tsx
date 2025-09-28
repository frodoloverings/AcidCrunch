

import React from 'react';
import { Language } from '../i18n';
import Icon from './Icon';

interface HeaderProps {
    language: Language;
    onLanguageChange: (lang: Language) => void;
    onShowDonate: () => void;
    onShowHallOfFame: () => void;
    onShowChangelog: () => void;
    onShowLog: () => void;
    onShowInfo: () => void;
    t: (key: string) => string;
}

const Header: React.FC<HeaderProps> = ({
    language,
    onLanguageChange,
    onShowDonate,
    onShowHallOfFame,
    onShowChangelog,
    onShowLog,
    onShowInfo,
    t
}) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-30 flex justify-between items-center p-4 text-sm pointer-events-none">
            {/* Left Side */}
            <div className="pointer-events-auto">
                 <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white">BananaCrunch</h1>
                    <button 
                        onClick={onShowChangelog}
                        className="text-2xl font-bold text-[#d1fe17] hover:opacity-80 transition-opacity"
                        title={t('changelog.title')}
                    >
                        {t('changelog.v2_0.title')}
                    </button>
                </div>
                <div className="text-left text-gray-400 mt-1">
                    <span>
                        Telegram:{' '}
                        <a href="https://t.me/acidcrunch" target="_blank" rel="noopener noreferrer" className="underline text-[#d1fe17] hover:text-lime-300">
                            AcidCrunch.
                        </a>
                    </span>
                    <span className="ml-4">
                        Gpt Prompts:{' '}
                        <a href="https://chatgpt.com/g/g-68b88ecdc91481919c227a0ca12f8a2d-bananna-crunch" target="_blank" rel="noopener noreferrer" className="underline text-[#d1fe17] hover:text-lime-300">
                            Banana Crunch bot
                        </a>
                    </span>
                </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 pointer-events-auto">
                <div className="flex items-center bg-[#2a2a2a] rounded-full p-1">
                    <button
                        onClick={() => onLanguageChange('en')}
                        className={`px-3 py-1 rounded-full font-bold text-sm transition-colors ${
                            language === 'en' ? 'bg-[#d1fe17] text-black' : 'text-gray-300 hover:bg-[#383838]'
                        }`}
                    >
                        En
                    </button>
                    <button
                        onClick={() => onLanguageChange('ru')}
                        className={`px-3 py-1 rounded-full font-bold text-sm transition-colors ${
                            language === 'ru' ? 'bg-[#d1fe17] text-black' : 'text-gray-300 hover:bg-[#383838]'
                        }`}
                    >
                        Ru
                    </button>
                </div>
                <button
                    onClick={onShowDonate}
                    className="px-4 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                >
                    {t('donate.button')}
                </button>
                <button
                    onClick={onShowHallOfFame}
                    className="px-4 py-2 bg-[#2a2a2a] text-gray-200 font-bold rounded-full hover:bg-[#383838] transition-colors"
                >
                    {t('hall_of_fame.button')}
                </button>
                <button
                    onClick={onShowLog}
                    className="px-4 py-2 bg-[#2a2a2a] text-gray-200 font-bold rounded-full hover:bg-[#383838] transition-colors"
                >
                    Log
                </button>
                <button
                    onClick={onShowInfo}
                    className="w-9 h-9 flex items-center justify-center bg-[#2a2a2a] text-gray-200 rounded-full hover:bg-[#383838] transition-colors"
                    aria-label={t('toolbar.right.info')}
                >
                    <Icon name="info" className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};

export default Header;
