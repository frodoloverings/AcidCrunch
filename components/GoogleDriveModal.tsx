import React from 'react';
import Icon from './Icon';
import { GoogleDriveFile, GoogleUserProfile } from '../types';

interface GoogleDriveModalProps {
    isOpen: boolean;
    onClose: () => void;
    isAuthorized: boolean;
    isReady: boolean;
    user: GoogleUserProfile | null;
    driveFiles: GoogleDriveFile[];
    isLoading: boolean;
    error: string | null;
    onSignIn: () => void;
    onSignOut: () => void;
    onRefresh: () => void;
    onClearError: () => void;
}

const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
    isOpen,
    onClose,
    isAuthorized,
    isReady,
    user,
    driveFiles,
    isLoading,
    error,
    onSignIn,
    onSignOut,
    onRefresh,
    onClearError,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-2xl rounded-2xl border border-[#2d2d2d] bg-[#171717] p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Icon name="google" className="h-8 w-8 text-[#d1fe17]" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">Google Drive</h2>
                            <p className="text-sm text-gray-400">Авторизуйтесь через Google, чтобы подключить диск и быстро импортировать файлы.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-white/10">
                        <Icon name="x" className="h-5 w-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-600/40 bg-red-900/40 px-4 py-3 text-sm text-red-200">
                        <span className="flex-1">{error}</span>
                        <button onClick={onClearError} className="text-xs font-semibold uppercase tracking-wide text-red-200/80 hover:text-red-100">
                            Сбросить
                        </button>
                    </div>
                )}

                {!isAuthorized ? (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-10 text-center">
                        <Icon name="lock" className="h-12 w-12 text-[#d1fe17]" />
                        <p className="max-w-md text-base text-gray-300">
                            Войдите через Google, чтобы мы могли получить ваш адрес почты и показать содержимое Google Drive. Мы используем только доступ на чтение.
                        </p>
                        <button
                            onClick={onSignIn}
                            disabled={!isReady}
                            className="rounded-full bg-[#d1fe17] px-6 py-3 text-base font-bold text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-200"
                        >
                            {isReady ? 'Войти через Google' : 'Загрузка сервисов Google...'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4">
                            {user?.picture && (
                                <img src={user.picture} alt={user.name} className="h-14 w-14 rounded-full border border-white/10 object-cover" />
                            )}
                            <div className="min-w-[180px]">
                                <p className="text-lg font-semibold text-white">{user?.name}</p>
                                <p className="text-sm text-gray-400">{user?.email}</p>
                            </div>
                            <div className="ml-auto flex items-center gap-3">
                                <button
                                    onClick={onRefresh}
                                    disabled={isLoading}
                                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isLoading ? 'Обновляем...' : 'Обновить список'}
                                </button>
                                <button
                                    onClick={onSignOut}
                                    className="rounded-full border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10"
                                >
                                    Выйти
                                </button>
                            </div>
                        </div>

                        <div className="max-h-80 overflow-y-auto rounded-2xl border border-white/5 bg-black/30 p-4">
                            {driveFiles.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-gray-400">
                                    <Icon name="folder" className="h-12 w-12 text-gray-500" />
                                    <p className="text-base">Нет доступных файлов. Попробуйте обновить список.</p>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {driveFiles.map((file) => (
                                        <li key={file.id} className="rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-base font-semibold text-white">{file.name}</p>
                                                    <p className="text-xs uppercase tracking-wide text-gray-400">{file.mimeType}</p>
                                                </div>
                                                {file.modifiedTime && (
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(file.modifiedTime).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                            {file.webViewLink && (
                                                <a
                                                    href={file.webViewLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#d1fe17] hover:underline"
                                                >
                                                    <Icon name="external-link" className="h-4 w-4" />
                                                    Открыть в Google Drive
                                                </a>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoogleDriveModal;
