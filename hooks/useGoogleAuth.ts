import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleDriveFile, GoogleUserProfile } from '../types';

const GOOGLE_IDENTITY_SRC = 'https://accounts.google.com/gsi/client';
const GOOGLE_API_SRC = 'https://apis.google.com/js/api.js';
const DRIVE_DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const GOOGLE_SCOPES = 'openid email profile https://www.googleapis.com/auth/drive.file';

declare global {
    interface Window {
        google?: any;
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

    const [isGisReady, setIsGisReady] = useState(false);
    const [isGapiReady, setIsGapiReady] = useState(false);

    const tokenClientRef = useRef<any>(null);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;

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
        if (tokenClientRef.current) {
            setIsGisReady(true);
            return;
        }

        if (!window.google?.accounts?.oauth2 || !clientId) {
            return;
        }

        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: GOOGLE_SCOPES,
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
                try {
                    window.gapi?.client?.setToken?.({ access_token: token });
                } catch (setTokenError) {
                    console.error('Не удалось передать токен в Google API клиент:', setTokenError);
                }
                await fetchUserInfo(token);
            },
        });

        setIsGisReady(true);
    }, [clientId, fetchUserInfo]);

    const initializeGapiClient = useCallback(() => {
        if (isGapiReady || !window.gapi?.load || !apiKey) {
            return;
        }

        window.gapi.load('client', async () => {
            try {
                await window.gapi.client.init({
                    apiKey,
                    discoveryDocs: [DRIVE_DISCOVERY_DOC],
                });
                setIsGapiReady(true);
            } catch (err) {
                console.error('Ошибка инициализации Google API:', err);
                setError('Не удалось инициализировать клиент Google API.');
            }
        });
    }, [apiKey, isGapiReady, setError]);

    useEffect(() => {
        setIsReady(isGisReady && isGapiReady);
    }, [isGisReady, isGapiReady]);

    useEffect(() => {
        if (!clientId) {
            setError('Не настроен VITE_GOOGLE_CLIENT_ID для авторизации через Google.');
            return;
        }

        if (!apiKey) {
            setError('Не настроен VITE_GOOGLE_API_KEY для доступа к Google Drive.');
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
            initializeTokenClient();
        };

        const handleError = () => {
            if (cancelled) return;
            setError('Не удалось загрузить сервисы авторизации Google.');
        };

        const gisScriptHandle = attachScript(GOOGLE_IDENTITY_SRC, handleLoad, handleError);

        const handleGapiLoad = () => {
            if (cancelled) return;
            initializeGapiClient();
        };

        const handleGapiError = () => {
            if (cancelled) return;
            setError('Не удалось загрузить клиент Google API.');
        };

        const gapiScriptHandle = attachScript(GOOGLE_API_SRC, handleGapiLoad, handleGapiError);

        return () => {
            cancelled = true;
            gisScriptHandle?.script?.removeEventListener('load', gisScriptHandle.loadHandler);
            gisScriptHandle?.script?.removeEventListener('error', gisScriptHandle.errorHandler);
            gapiScriptHandle?.script?.removeEventListener('load', gapiScriptHandle.loadHandler);
            gapiScriptHandle?.script?.removeEventListener('error', gapiScriptHandle.errorHandler);
        };
    }, [clientId, apiKey, initializeTokenClient, initializeGapiClient, setError]);

    const signIn = useCallback(() => {
        if (!tokenClientRef.current || !isReady) {
            setError('Сервис авторизации Google ещё не готов. Подождите немного и попробуйте снова.');
            return;
        }

        clearError();
        tokenClientRef.current.requestAccessToken({ prompt: isAuthorized ? 'none' : 'consent' });
    }, [clearError, isAuthorized, isReady]);

    const signOut = useCallback(() => {
        if (accessToken && window.google?.accounts?.oauth2?.revoke) {
            window.google.accounts.oauth2.revoke(accessToken, () => {});
        }
        try {
            window.gapi?.client?.setToken?.(null);
        } catch (setTokenError) {
            console.error('Не удалось очистить токен Google API:', setTokenError);
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
                    setIsAuthorized(false);
                    setAccessToken(null);
                    setUser(null);
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
                setIsAuthorized(false);
                setAccessToken(null);
                setUser(null);
            }
            const message = (err as any)?.result?.error?.message ?? (err instanceof Error ? err.message : null) ??
                'Неизвестная ошибка при обращении к Google Drive.';
            setError(message);
        } finally {
            setIsLoadingDriveFiles(false);
        }
    }, [accessToken, clearError]);

    const uploadFile = useCallback(async (
        file: Blob | File,
        options?: { name?: string; mimeType?: string; parents?: string[] },
    ) => {
        if (!accessToken) {
            setError('Сначала войдите через Google, чтобы загружать файлы на диск.');
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
                headers: { Authorization: `Bearer ${accessToken}` },
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
                    setIsAuthorized(false);
                    setAccessToken(null);
                    setUser(null);
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
    }, [accessToken, setError]);

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
        uploadFile,
        clearError,
    };
};

export default useGoogleAuth;
