

import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../i18n';
import Icon from './Icon';
import Tooltip from './Tooltip';
import { GoogleUserProfile } from '../types';

interface HeaderProps {
    language: Language;
    onLanguageChange: (lang: Language) => void;
    onShowDonate: () => void;
    onShowHallOfFame: () => void;
    onShowChangelog: () => void;
    onShowLog: () => void;
    onShowInfo: () => void;
    onShowApiKeyModal: () => void;
    apiKeySource: 'user' | 'studio';
    areCornersRounded: boolean;
    onCornersRoundedChange: (rounded: boolean) => void;
    t: (key: string) => string;
    onShowGoogleDrive: () => void;
    onGoogleSignIn: () => void;
    onGoogleSignOut: () => void;
    isGoogleAuthorized: boolean;
    isGoogleReady: boolean;
    googleUser: GoogleUserProfile | null;
}

const DesktopMenu: React.FC<Omit<HeaderProps, 'onShowLog'> & { onClose: () => void }> = ({
    onShowHallOfFame, onShowChangelog, onShowInfo, onShowApiKeyModal, onShowDonate,
    apiKeySource, t, onClose, language, onLanguageChange, areCornersRounded, onCornersRoundedChange,
    onShowGoogleDrive, onGoogleSignIn, onGoogleSignOut, isGoogleAuthorized, isGoogleReady, googleUser
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleButtonClick = (action: () => void) => {
        action();
        onClose();
    };

    return (
        <div
            ref={menuRef}
            className="absolute top-full right-0 mt-2 bg-[#1c1c1c] rounded-2xl p-2 shadow-2xl border border-[#262626] w-64 flex flex-col gap-1"
        >
            <button onClick={() => handleButtonClick(onShowChangelog)} className="w-full text-left px-3 py-2 text-gray-200 font-semibold rounded-lg hover:bg-[#2a2a2a] transition-colors flex items-center gap-3">
                <span>{t('changelog.title')}</span>
                <span className="ml-auto text-sm font-bold text-[#d1fe17]">{t('changelog.v2_2.title')}</span>
            </button>
            <button onClick={() => handleButtonClick(onShowApiKeyModal)} className="w-full text-left px-3 py-2 text-gray-200 font-semibold rounded-lg hover:bg-[#2a2a2a] transition-colors flex items-center gap-3">
                <span>Key</span>
                 <span className={`ml-auto text-sm font-bold ${apiKeySource === 'user' ? 'text-green-400' : 'text-cyan-400'}`}>
                    {t(apiKeySource === 'user' ? 'api_key_modal.user_key_display' : 'api_key_modal.studio_key_display')}
                </span>
            </button>
            <div className="mt-1 rounded-xl border border-white/5 bg-black/30 p-3">
                {isGoogleAuthorized && googleUser ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            {googleUser.picture && (
                                <img src={googleUser.picture} alt={googleUser.name} className="h-10 w-10 rounded-full border border-white/10 object-cover" />
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{googleUser.name}</p>
                                <p className="truncate text-xs text-gray-400">{googleUser.email}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleButtonClick(onShowGoogleDrive)}
                                className="flex-1 rounded-full bg-[#d1fe17] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-lime-300"
                            >
                                Открыть Drive
                            </button>
                            <button
                                onClick={() => handleButtonClick(onGoogleSignOut)}
                                className="rounded-full border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20"
                            >
                                Выйти
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => {
                            if (!isGoogleReady) return;
                            handleButtonClick(onGoogleSignIn);
                        }}
                        disabled={!isGoogleReady}
                        className="w-full rounded-full bg-[#d1fe17] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-200"
                    >
                        {isGoogleReady ? 'Войти через Google' : 'Google загружается...'}
                    </button>
                )}
            </div>
            <div className="w-full h-px bg-white/10 my-1"></div>

             <a href="https://t.me/acidcrunch" target="_blank" rel="noopener noreferrer" 
                onClick={onClose}
                className="w-full text-left px-3 py-2 text-gray-200 font-semibold rounded-lg hover:bg-[#2a2a2a] transition-colors">
                Telegram
            </a>
            <a href="https://chatgpt.com/g/g-68b88ecdc91481919c227a0ca12f8a2d-bananna-crunch" target="_blank" rel="noopener noreferrer" 
                onClick={onClose}
                className="w-full text-left px-3 py-2 text-gray-200 font-semibold rounded-lg hover:bg-[#2a2a2a] transition-colors">
                Banana Crunch Bot
            </a>

            <div className="w-full h-px bg-white/10 my-1"></div>

            <button onClick={() => handleButtonClick(onShowDonate)} className="w-full text-left px-3 py-2 text-gray-200 font-semibold rounded-lg hover:bg-[#2a2a2a] transition-colors">
                {t('donate.button')}
            </button>
            <button onClick={() => handleButtonClick(onShowHallOfFame)} className="w-full text-left px-3 py-2 text-gray-200 font-semibold rounded-lg hover:bg-[#2a2a2a] transition-colors">{t('hall_of_fame.button')}</button>

            <div className="w-full h-px bg-white/10 my-1"></div>

            <div 
                className="px-3 py-1 flex items-center justify-between cursor-pointer rounded-lg hover:bg-[#2a2a2a] transition-colors"
                onClick={() => onLanguageChange(language === 'en' ? 'ru' : 'en')}
            >
                <span className="text-gray-200 font-semibold">Language</span>
                <div className="flex items-center bg-black p-1 rounded-full" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onLanguageChange('en')} className={`px-3 py-1 text-sm rounded-full transition-colors ${language === 'en' ? 'bg-[#d1fe17] text-black' : 'text-gray-400 hover:bg-[#383838]'}`}>EN</button>
                    <button onClick={() => onLanguageChange('ru')} className={`px-3 py-1 text-sm rounded-full transition-colors ${language === 'ru' ? 'bg-[#d1fe17] text-black' : 'text-gray-400 hover:bg-[#383838]'}`}>RU</button>
                </div>
            </div>

            <div 
                className="px-3 py-1 flex items-center justify-between cursor-pointer rounded-lg hover:bg-[#2a2a2a] transition-colors"
                onClick={() => onCornersRoundedChange(!areCornersRounded)}
            >
                 <span className="text-gray-200 font-semibold">Corners</span>
                 <div className="flex items-center bg-black p-1 rounded-full" onClick={e => e.stopPropagation()}>
                    <Tooltip text="Sharp Corners" position="bottom">
                        <button onClick={() => onCornersRoundedChange(false)} className={`flex items-center justify-center p-2 rounded-full transition-colors ${!areCornersRounded ? 'bg-[#d1fe17] text-black' : 'text-gray-400 hover:bg-[#383838]'}`}>
                            <Icon name="corner-sharp" className="w-5 h-5" />
                        </button>
                    </Tooltip>
                    <Tooltip text="Rounded Corners" position="bottom">
                        <button onClick={() => onCornersRoundedChange(true)} className={`flex items-center justify-center p-2 rounded-full transition-colors ${areCornersRounded ? 'bg-[#d1fe17] text-black' : 'text-gray-400 hover:bg-[#383838]'}`}>
                            <Icon name="corner-rounded" className="w-5 h-5" />
                        </button>
                    </Tooltip>
                </div>
            </div>

            <div className="w-full h-px bg-white/10 my-1"></div>
            
            <button onClick={() => handleButtonClick(onShowInfo)} className="w-full text-left px-3 py-2 text-gray-200 font-semibold rounded-lg hover:bg-[#2a2a2a] transition-colors">
                {t('toolbar.right.info')}
            </button>
        </div>
    );
};

const Header: React.FC<HeaderProps> = (props) => {
    const {
        onShowLog,
        t,
        onShowDonate,
        isGoogleAuthorized,
        onShowGoogleDrive,
        onGoogleSignIn,
        googleUser,
        isGoogleReady,
    } = props;
    const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-30 flex justify-between items-center p-4 text-sm bg-black/30 backdrop-blur-[40px]">
                {/* Left Side */}
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white">BananaCrunch</h1>
                        <button 
                            onClick={props.onShowChangelog}
                            className="text-2xl font-bold text-[#d1fe17] hover:opacity-80 transition-opacity"
                            title={t('changelog.title')}
                        >
                            {t('changelog.v2_2.title')}
                        </button>
                        <button onClick={onShowDonate} className="hidden md:block bg-white text-black font-bold py-2 px-4 rounded-full hover:bg-gray-200 transition-colors">
                            {t('donate.button')}
                        </button>
                         <a href="https://t.me/acidcrunch" target="_blank" rel="noopener noreferrer" className="hidden md:inline-block bg-[#2a2a2a] text-gray-200 font-bold py-2 px-4 rounded-full hover:bg-[#383838] transition-colors">
                            Telegram
                        </a>
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-2">
                    {isGoogleAuthorized && googleUser?.picture && (
                        <img
                            src={googleUser.picture}
                            alt={googleUser.name}
                            className="hidden h-10 w-10 rounded-full border border-white/10 object-cover md:block"
                        />
                    )}
                    <button
                        onClick={isGoogleAuthorized ? onShowGoogleDrive : onGoogleSignIn}
                        disabled={!isGoogleAuthorized && !isGoogleReady}
                        className={`${isGoogleAuthorized ? 'bg-[#d1fe17] text-black hover:bg-lime-300' : 'bg-[#2a2a2a] text-gray-200 hover:bg-[#383838]'} font-bold py-2 px-4 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                        {isGoogleAuthorized ? 'Google Drive' : 'Войти через Google'}
                    </button>
                    <button onClick={onShowLog} className="bg-[#2a2a2a] text-gray-200 font-bold py-2 px-4 rounded-full hover:bg-[#383838] transition-colors">
                        {t('toolbar.right.log')}
                    </button>
                    {!isGoogleAuthorized && (
                        <button
                            onClick={onGoogleSignIn}
                            disabled={!isGoogleReady}
                            className="bg-[#2a2a2a] text-gray-200 font-bold py-2 px-4 rounded-full transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Регистрация Google
                        </button>
                    )}

                    <div className="relative">
                        <button onClick={() => setIsDesktopMenuOpen(p => !p)} className="bg-[#2a2a2a] text-gray-200 font-bold py-2 px-4 rounded-full hover:bg-[#383838] transition-colors">
                           Menu
                        </button>
                        {isDesktopMenuOpen && <DesktopMenu {...props} onClose={() => setIsDesktopMenuOpen(false)} />}
                    </div>
                </div>

            </header>
        </>
    );
};

export default Header;