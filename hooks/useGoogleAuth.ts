import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleDriveFile, GoogleUserProfile } from '../types';

const GOOGLE_IDENTITY_SRC = 'https://accounts.google.com/gsi/client';

declare global {
    interface Window {
        google?: any;
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

    const tokenClientRef = useRef<any>(null);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

    const clearError = useCallback(() => setError(null), []);

    const fetchUserInfo = useCallback(async (token: string) => {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error(`Не удалось получить данные пользователя: ${response.statusText}`);
            }

            const data = await response.json();
            setUser({
                name: data.name ?? data.email ?? 'Google User',
                email: data.email,
                picture: data.picture,
            });
            setIsAuthorized(true);
        } catch (err) {
            console.error('Ошибка получения профиля Google:', err);
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка при получении профиля Google.');
            setIsAuthorized(false);
            setUser(null);
            setAccessToken(null);
        }
    }, []);

    const initializeTokenClient = useCallback(() => {
        if (!window.google?.accounts?.oauth2 || tokenClientRef.current || !clientId) {
            return;
        }

        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid email profile https://www.googleapis.com/auth/drive.readonly',
            callback: async (tokenResponse: any) => {
                if (tokenResponse?.error) {
                    setError(`Ошибка авторизации Google: ${tokenResponse.error}`);
                    return;
                }

                const token = tokenResponse?.access_token as string | undefined;
                if (!token) {
                    setError('Google не вернул access token.');
                    return;
                }

                setAccessToken(token);
                await fetchUserInfo(token);
            },
        });

        setIsReady(true);
    }, [clientId, fetchUserInfo]);

    useEffect(() => {
        if (!clientId) {
            setError('Не настроен VITE_GOOGLE_CLIENT_ID для авторизации через Google.');
            return;
        }

        let cancelled = false;

        const handleLoad = () => {
            if (cancelled) return;
            initializeTokenClient();
        };

        const handleError = () => {
            if (cancelled) return;
            setError('Не удалось загрузить сервисы авторизации Google.');
        };

        const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_IDENTITY_SRC}"]`);

        if (existingScript) {
            if (existingScript.dataset.loaded === 'true') {
                handleLoad();
            } else {
                existingScript.addEventListener('load', handleLoad);
                existingScript.addEventListener('error', handleError);
            }
        } else {
            const script = document.createElement('script');
            script.src = GOOGLE_IDENTITY_SRC;
            script.async = true;
            script.defer = true;
            script.addEventListener('load', () => {
                script.dataset.loaded = 'true';
                handleLoad();
            });
            script.addEventListener('error', handleError);
            document.head.appendChild(script);
        }

        return () => {
            cancelled = true;
            const script = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_IDENTITY_SRC}"]`);
            script?.removeEventListener('load', handleLoad);
            script?.removeEventListener('error', handleError);
        };
    }, [clientId, initializeTokenClient]);

    const signIn = useCallback(() => {
        if (!tokenClientRef.current) {
            setError('Сервис авторизации Google ещё не готов. Подождите немного и попробуйте снова.');
            return;
        }

        clearError();
        tokenClientRef.current.requestAccessToken({ prompt: isAuthorized ? 'none' : 'consent' });
    }, [clearError, isAuthorized]);

    const signOut = useCallback(() => {
        if (accessToken && window.google?.accounts?.oauth2?.revoke) {
            window.google.accounts.oauth2.revoke(accessToken, () => {});
        }
        setAccessToken(null);
        setIsAuthorized(false);
        setUser(null);
        setDriveFiles([]);
    }, [accessToken]);

    const loadDriveFiles = useCallback(async () => {
        if (!accessToken) {
            setError('Сначала войдите через Google, чтобы увидеть Google Drive.');
            return;
        }

        setIsLoadingDriveFiles(true);
        clearError();
        try {
            const url = new URL('https://www.googleapis.com/drive/v3/files');
            url.search = new URLSearchParams({
                pageSize: '25',
                fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
                orderBy: 'modifiedTime desc',
                q: 'trashed=false',
            }).toString();

            const response = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) {
                const text = await response.text();
                let message = text || response.statusText;
                try {
                    const parsed = JSON.parse(text);
                    message = parsed?.error?.message ?? message;
                } catch (e) {
                    // ignore json parse errors
                }

                if (response.status === 401) {
                    setIsAuthorized(false);
                    setAccessToken(null);
                    setUser(null);
                }

                throw new Error(message || 'Не удалось загрузить список файлов Google Drive.');
            }

            const data = await response.json();
            setDriveFiles(Array.isArray(data.files) ? data.files : []);
        } catch (err) {
            console.error('Ошибка при загрузке Google Drive:', err);
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка при обращении к Google Drive.');
        } finally {
            setIsLoadingDriveFiles(false);
        }
    }, [accessToken, clearError]);

    return {
        isReady,
        isAuthorized,
        user,
        driveFiles,
        isLoadingDriveFiles,
        error,
        signIn,
        signOut,
        loadDriveFiles,
        clearError,
    };
};

export default useGoogleAuth;
