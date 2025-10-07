import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleDriveFile, GoogleUserProfile } from '../types';

const GOOGLE_API_SRC = 'https://apis.google.com/js/api.js';
const DRIVE_DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const GOOGLE_SCOPES = 'openid email profile https://www.googleapis.com/auth/drive.file';

declare global {
    interface Window {
        gapi?: any;
    }
}

interface UseGoogleAuthResult {
    isReady: boolean;
    isAuthorized: boolean;
    user: GoogleUserProfile | null;
    driveFiles: GoogleDriveFile[];
    isLoadingDriveFiles: boolean;
    error: string | null;
    signIn: () => void;
    signOut: () => void;
    loadDriveFiles: () => Promise<void>;
    uploadFile: (file: Blob | File, options?: { name?: string; mimeType?: string; parents?: string[] }) => Promise<GoogleDriveFile | null>;
    clearError: () => void;
}

export const useGoogleAuth = (): UseGoogleAuthResult => {
    const [isReady, setIsReady] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [user, setUser] = useState<GoogleUserProfile | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
    const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const authInstanceRef = useRef<any>(null);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;

    const clearError = useCallback(() => setError(null), []);

    const resetAuthState = useCallback(() => {
        setIsAuthorized(false);
        setUser(null);
        setAccessToken(null);
        setDriveFiles([]);
        try {
            window.gapi?.client?.setToken?.(null);
        } catch (setTokenError) {
            console.error('Не удалось очистить токен Google API:', setTokenError);
        }
    }, []);

    const syncUserFromGoogle = useCallback(async (): Promise<string | null> => {
        const authInstance = authInstanceRef.current;
        if (!authInstance) {
            return null;
        }

        const googleUser = authInstance.currentUser?.get?.();
        if (!googleUser || !googleUser.isSignedIn?.()) {
            resetAuthState();
            return null;
        }

        try {
            const authResponse = await googleUser.reloadAuthResponse?.();
            const token = authResponse?.access_token as string | undefined;
            if (!token) {
                throw new Error('Google не вернул access token.');
            }

            const profile = googleUser.getBasicProfile?.();
            setUser({
                name: profile?.getName?.() || profile?.getEmail?.() || 'Google User',
                email: profile?.getEmail?.() || '',
                picture: profile?.getImageUrl?.() || undefined,
            });
            setIsAuthorized(true);
            setAccessToken(token);

            try {
                window.gapi?.client?.setToken?.({ access_token: token });
            } catch (setTokenError) {
                console.error('Не удалось передать токен в Google API клиент:', setTokenError);
            }

            return token;
        } catch (err) {
            console.error('Ошибка получения профиля Google:', err);
            setError(err instanceof Error ? err.message : 'Не удалось получить данные профиля Google. Попробуйте снова.');
            resetAuthState();
            return null;
        }
    }, [resetAuthState]);

    const handleAuthStatusChange = useCallback((signedIn: boolean) => {
        if (signedIn) {
            void syncUserFromGoogle();
        } else {
            resetAuthState();
        }
    }, [resetAuthState, syncUserFromGoogle]);

    const initializeAuthClient = useCallback(() => {
        if (!window.gapi?.load || authInstanceRef.current) {
            if (authInstanceRef.current) {
                setIsReady(true);
                handleAuthStatusChange(authInstanceRef.current.isSignedIn?.get?.() ?? false);
            }
            return;
        }

        window.gapi.load('client:auth2', async () => {
            try {
                await window.gapi.client.init({
                    apiKey,
                    clientId,
                    discoveryDocs: [DRIVE_DISCOVERY_DOC],
                    scope: GOOGLE_SCOPES,
                });

                authInstanceRef.current = window.gapi.auth2?.getAuthInstance?.();
                if (!authInstanceRef.current) {
                    throw new Error('Не удалось инициализировать Google Auth.');
                }

                authInstanceRef.current.isSignedIn?.listen(handleAuthStatusChange);
                setIsReady(true);
                handleAuthStatusChange(authInstanceRef.current.isSignedIn?.get?.() ?? false);
            } catch (err) {
                console.error('Ошибка инициализации Google API:', err);
                setError('Не удалось инициализировать Google API. Проверьте настройки OAuth.');
            }
        });
    }, [apiKey, clientId, handleAuthStatusChange]);

    useEffect(() => {
        if (!clientId) {
            setError('Не настроен VITE_GOOGLE_CLIENT_ID для авторизации через Google.');
            setIsReady(false);
            return;
        }

        if (!apiKey) {
            setError('Не настроен VITE_GOOGLE_API_KEY для доступа к Google Drive.');
            setIsReady(false);
            return;
        }

        let cancelled = false;

        const attachScript = (
            src: string,
            onLoad: () => void,
            onError: () => void,
        ): { script: HTMLScriptElement | null; loadHandler: () => void; errorHandler: () => void } => {
            const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);

            const loadHandler = () => {
                if (cancelled) return;
                const element = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
                if (element) {
                    element.dataset.loaded = 'true';
                }
                onLoad();
            };

            const errorHandler = () => {
                if (cancelled) return;
                onError();
            };

            if (existing) {
                existing.addEventListener('load', loadHandler);
                existing.addEventListener('error', errorHandler);
                if (existing.dataset.loaded === 'true' || existing.readyState === 'complete') {
                    loadHandler();
                }
                return { script: existing, loadHandler, errorHandler };
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.defer = true;
            script.addEventListener('load', loadHandler);
            script.addEventListener('error', errorHandler);
            document.head.appendChild(script);

            return { script, loadHandler, errorHandler };
        };

        const handleLoad = () => {
            if (cancelled) return;
            initializeAuthClient();
        };

        const handleError = () => {
            if (cancelled) return;
            setError('Не удалось загрузить клиент Google API.');
        };

        const gapiScriptHandle = attachScript(GOOGLE_API_SRC, handleLoad, handleError);

        return () => {
            cancelled = true;
            gapiScriptHandle?.script?.removeEventListener('load', gapiScriptHandle.loadHandler);
            gapiScriptHandle?.script?.removeEventListener('error', gapiScriptHandle.errorHandler);
        };
    }, [clientId, apiKey, initializeAuthClient]);

    const performSignIn = useCallback(async () => {
        const authInstance = authInstanceRef.current;
        if (!authInstance || !isReady) {
            setError('Сервисы Google ещё не готовы. Подождите немного и попробуйте снова.');
            return;
        }

        clearError();
        try {
            await authInstance.signIn({ scope: GOOGLE_SCOPES, prompt: 'consent' });
            await syncUserFromGoogle();
        } catch (err: any) {
            if (err?.error === 'popup_closed_by_user') {
                return;
            }
            console.error('Ошибка авторизации Google:', err);
            const message = err?.error_description || err?.details || (err instanceof Error ? err.message : null);
            if (message) {
                setError(`Ошибка авторизации Google: ${message}`);
            } else {
                setError('Не удалось выполнить вход через Google.');
            }
        }
    }, [clearError, isReady, syncUserFromGoogle]);

    const performSignOut = useCallback(async () => {
        const authInstance = authInstanceRef.current;
        if (!authInstance) {
            resetAuthState();
            return;
        }

        try {
            await authInstance.signOut();
            await authInstance.disconnect?.();
        } catch (err) {
            console.error('Ошибка выхода из Google:', err);
        } finally {
            resetAuthState();
        }
    }, [resetAuthState]);

    const loadDriveFiles = useCallback(async () => {
        if (!authInstanceRef.current || !authInstanceRef.current.isSignedIn?.get?.()) {
            setError('Сначала войдите через Google, чтобы увидеть Google Drive.');
            return;
        }

        const token = await syncUserFromGoogle();
        if (!token) {
            return;
        }

        if (!window.gapi?.client?.drive?.files?.list) {
            setError('Клиент Google Drive ещё не готов. Попробуйте ещё раз позже.');
            return;
        }

        setIsLoadingDriveFiles(true);
        clearError();
        try {
            const response = await window.gapi.client.drive.files.list({
                pageSize: 25,
                fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
                orderBy: 'modifiedTime desc',
                q: 'trashed=false',
            });

            if (response.status !== 200) {
                const message = response.result?.error?.message || 'Не удалось загрузить список файлов Google Drive.';
                if (response.status === 401) {
                    resetAuthState();
                }
                throw new Error(message);
            }

            const files = Array.isArray(response.result?.files)
                ? response.result.files.map((file: any) => ({
                    id: file.id,
                    name: file.name,
                    mimeType: file.mimeType,
                    modifiedTime: file.modifiedTime,
                    webViewLink: file.webViewLink,
                }))
                : [];
            setDriveFiles(files);
        } catch (err) {
            console.error('Ошибка при загрузке Google Drive:', err);
            const code = (err as any)?.status ?? (err as any)?.result?.error?.code;
            if (code === 401) {
                resetAuthState();
            }
            const message = (err as any)?.result?.error?.message ?? (err instanceof Error ? err.message : null) ??
                'Неизвестная ошибка при обращении к Google Drive.';
            setError(message);
        } finally {
            setIsLoadingDriveFiles(false);
        }
    }, [clearError, resetAuthState, syncUserFromGoogle]);

    const uploadFile = useCallback(async (
        file: Blob | File,
        options?: { name?: string; mimeType?: string; parents?: string[] },
    ) => {
        if (!authInstanceRef.current || !authInstanceRef.current.isSignedIn?.get?.()) {
            setError('Сначала войдите через Google, чтобы загружать файлы на диск.');
            return null;
        }

        const token = await syncUserFromGoogle();
        if (!token) {
            return null;
        }

        const mimeType = options?.mimeType ?? (file instanceof File && file.type ? file.type : 'application/octet-stream');
        const metadata: Record<string, unknown> = {
            name: options?.name ?? (file instanceof File ? file.name : `BananaCrunch-${Date.now()}`),
            mimeType,
        };

        if (options?.parents?.length) {
            metadata.parents = options.parents;
        }

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        try {
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            });

            if (!response.ok) {
                const text = await response.text();
                let message = text || response.statusText;
                try {
                    const parsed = JSON.parse(text);
                    message = parsed?.error?.message ?? message;
                } catch (parseError) {
                    // ignore JSON errors
                }

                if (response.status === 401) {
                    resetAuthState();
                }

                throw new Error(message || 'Не удалось загрузить файл на Google Drive.');
            }

            const uploaded = await response.json();
            const uploadedFile: GoogleDriveFile = {
                id: uploaded.id,
                name: uploaded.name,
                mimeType: uploaded.mimeType ?? mimeType,
                modifiedTime: uploaded.modifiedTime,
                webViewLink: uploaded.webViewLink,
            };

            setDriveFiles(prev => {
                const existing = prev.filter(item => item.id !== uploadedFile.id);
                return [uploadedFile, ...existing];
            });

            return uploadedFile;
        } catch (err) {
            console.error('Ошибка загрузки файла в Google Drive:', err);
            const message = err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке файла на Google Drive.';
            setError(message);
            return null;
        }
    }, [resetAuthState, syncUserFromGoogle]);

    return {
        isReady,
        isAuthorized,
        user,
        driveFiles,
        isLoadingDriveFiles,
        error,
        signIn: () => { void performSignIn(); },
        signOut: () => { void performSignOut(); },
        loadDriveFiles,
        uploadFile,
        clearError,
    };
};

export default useGoogleAuth;
