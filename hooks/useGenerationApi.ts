
import { useState, useCallback, SetStateAction, RefObject } from 'react';
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from '@google/genai';
import { MAGIC_PROMPT_SYSTEM_INSTRUCTION, REASONING_SYSTEM_INSTRUCTION, OUTPAINTING_PROMPT, OUTPAINTING_PROMPT_WITH_CONTEXT, BAD_MODE_SYSTEM_INSTRUCTION, ANALYZE_MODE_SYSTEM_INSTRUCTION } from '../constants';
import { WorkspaceImage, GenerationContext, AnyLayer, ArrowLayer, TextLayer, LogEntry, Tool } from '../types';
import { WorkspaceCanvasRef } from '../components/WorkspaceCanvas';

interface UseGenerationApiProps {
    ai: GoogleGenAI;
    userPrompt: string;
    isMagicPromptEnabled: boolean;
    isBadModeEnabled: boolean;
    selectedImages: WorkspaceImage[];
    workspaceImages: WorkspaceImage[];
    addLog: (type: LogEntry['type'], message: string, payload?: any, isVerbose?: boolean) => void;
    addPromptToHistory: (entry: { prompt: string; tags?: string[] }) => void;
    handleWorkspaceUpdate: (updater: SetStateAction<WorkspaceImage[]>, addToHistory?: boolean) => void;
    setManualSelectedImageIds: (ids: number[]) => void;
    t: (key: string, params?: { [key: string]: string | number }) => string;
    workspaceCanvasRef: RefObject<WorkspaceCanvasRef>;
    combinedSelectedImageIds: number[];
    aspectRatio: string;
}

// Helper to convert File or data URL to base64 string and mimeType
const getImageData = async (source: File | string): Promise<{ base64: string; mimeType: string; dataUrl: string }> => {
    if (source instanceof File) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result as string;
                resolve({
                    dataUrl,
                    base64: dataUrl.split(',')[1],
                    mimeType: source.type,
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(source);
        });
    }
    const dataUrl = source;
    const mimeType = dataUrl.match(/:(.*?);/)?.[1] ?? 'image/png';
    const base64 = dataUrl.split(',')[1];
    return { dataUrl, base64, mimeType };
};

// Helper to sanitize API responses for logging, removing large base64 image data.
const sanitizeApiResponse = (response: any) => {
    if (typeof response !== 'object' || response === null) {
        return response;
    }

    try {
        // Deep copy to avoid mutating the original response object which is used later.
        const sanitizedResponse = JSON.parse(JSON.stringify(response));

        if (sanitizedResponse.candidates && Array.isArray(sanitizedResponse.candidates)) {
            sanitizedResponse.candidates.forEach((candidate: any) => {
                if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
                    candidate.content.parts.forEach((part: any) => {
                        if (part.inlineData && typeof part.inlineData.data === 'string') {
                            // Replace the large base64 string with a placeholder.
                            part.inlineData.data = `***${part.inlineData.mimeType || 'image'} data removed***`;
                        }
                    });
                }
            });
        }
        
        return sanitizedResponse;
    } catch (e) {
        // If stringify fails (e.g., circular references, though unlikely for this API), return a placeholder.
        console.error("Failed to sanitize API response for logging:", e);
        return { error: "Failed to sanitize response." };
    }
};


export const useGenerationApi = ({
    ai, userPrompt, isMagicPromptEnabled, isBadModeEnabled, selectedImages, workspaceImages, addLog, addPromptToHistory,
    handleWorkspaceUpdate, setManualSelectedImageIds, t, workspaceCanvasRef, combinedSelectedImageIds, aspectRatio
}: UseGenerationApiProps) => {

    const [loadingAction, setLoadingAction] = useState<'generate' | 'reasoning' | 'enhance' | 'rtx' | 'mix' | 'rep' | 'ref' | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const getErrorMessageFromResponse = useCallback((response: GenerateContentResponse): string => {
        // Handle cases where the model provides no candidates at all, often a transient error.
        if (!response || !response.candidates || response.candidates.length === 0) {
            return t('error.model_no_response');
        }

        const finishReason = response.candidates[0].finishReason;
        if (finishReason === 'SAFETY' || finishReason === 'PROHIBITED_CONTENT') {
             return t('error.blocked_by_safety', { reason: finishReason });
        }

        // The .text accessor provides the first text part, which is useful for error messages.
        const textResponse = response.text?.trim();
        if (textResponse) {
             // Check for known error patterns in the text response
            if (textResponse.includes("prompt was blocked")) {
                 return t('error.blocked_by_safety', { reason: 'PROMPT_BLOCKED' });
            }
            return textResponse;
        }
        
        // If no text part, try to find any text part in the full response for a more detailed error.
        const anyTextPart = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
        if (anyTextPart) return anyTextPart;

        // Fallback for when there are candidates but no image part.
        return t('error.model_no_image');
    }, [t]);

    const findNewImagePosition = useCallback((allImages: WorkspaceImage[], placeholderWidth: number, referenceImage?: WorkspaceImage | null): { x: number, y: number } => {
        const MARGIN = 20;
        const viewportCenter = workspaceCanvasRef.current?.getViewportCenter() || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        if (allImages.length === 0) return { x: viewportCenter.x - placeholderWidth / 2, y: viewportCenter.y - placeholderWidth / 2 };
        const rightmostX = Math.max(...allImages.map(img => img.x + img.width));
        const yPosition = referenceImage ? referenceImage.y : (allImages.length === 1 ? allImages[0].y : viewportCenter.y);
        return { x: rightmostX + MARGIN, y: yPosition };
    }, [workspaceCanvasRef]);

    const processApiResponse = useCallback((
        response: GenerateContentResponse,
        placeholderId: number,
        context: GenerationContext
    ) => {
        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imagePart?.inlineData) {
            const newDataSource = `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
            const img = new Image();
            img.onload = () => {
                 handleWorkspaceUpdate(prevImages => prevImages.map(i => {
                    if (i.id === placeholderId) {
                        const aspectRatio = img.width / img.height;
                        const newHeight = i.height; // Keep height from placeholder for consistency
                        const newWidth = newHeight * aspectRatio;
                        return {
                            ...i, source: newDataSource, width: newWidth, height: newHeight,
                            originalWidth: img.width, originalHeight: img.height,
                            isLoading: false, isReasoning: false, generationContext: context,
                        };
                    }
                    return i;
                 }), true);
                setManualSelectedImageIds([placeholderId]);
            };
            img.onerror = () => {
                const message = t('error.image_load_fail');
                setError(message);
                addLog('error', message, { source: newDataSource.substring(0, 100) + '...' });
                handleWorkspaceUpdate(prevImages => prevImages.filter(i => i.id !== placeholderId), false);
            };
            img.src = newDataSource;
        } else {
            const message = getErrorMessageFromResponse(response);
            setError(message);
            addLog('error', message, sanitizeApiResponse(response));
            handleWorkspaceUpdate(prevImages => prevImages.filter(i => i.id !== placeholderId), false);
        }
    }, [addLog, getErrorMessageFromResponse, handleWorkspaceUpdate, setManualSelectedImageIds, setError, t]);
    
    const handleTextToImageGenerate = useCallback(async () => {
        if (!userPrompt.trim()) {
            setError("Please provide a prompt to generate an image.");
            return;
        }

        addLog('action', 'Starting text-to-image generation...');
        setLoadingAction('generate');
        setLoadingMessage(t('loading.generating_image'));
        setError(null);
        let placeholderId: number | null = null;
        
        try {
            const placeholderSize = 768;
            const { x: newX, y: newY } = findNewImagePosition(workspaceImages, placeholderSize, null);
            const placeholder: WorkspaceImage = {
                id: Date.now(),
                source: '',
                x: newX, y: newY,
                width: placeholderSize, height: placeholderSize,
                originalWidth: placeholderSize, originalHeight: placeholderSize,
                layers: [], annotationHistory: [{ layers: [] }], annotationHistoryIndex: 0,
                isLoading: true,
            };
            placeholderId = placeholder.id;
            handleWorkspaceUpdate(prevImages => [...prevImages, placeholder], false);

            const apiPrompt = `${userPrompt}\n\n!important:Your response should ONLY be the resulting image, with no other text, commentary, or markdown.`;
            const context: GenerationContext = { prompt: apiPrompt, annotatedImageSources: [], type: 'text-to-image' };

            addPromptToHistory({ prompt: apiPrompt, tags: ['Text-to-Image'] });
            addLog('api_request', `Text-to-image request sent`, { prompt: apiPrompt });

            const config: { responseModalities: Modality[]; imageConfig?: { aspectRatio: string } } = {
                responseModalities: [Modality.IMAGE],
            };
            if (aspectRatio !== 'Auto') {
                config.imageConfig = { aspectRatio };
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: apiPrompt }] },
                config,
            });
            addLog('api_response', `Text-to-image response received`, sanitizeApiResponse(response), true);

            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imagePart) {
                addLog('api_response', `Text-to-image successful.`, sanitizeApiResponse(response), true);
                processApiResponse(response, placeholderId, context);
            } else {
                const message = getErrorMessageFromResponse(response);
                setError(message);
                addLog('error', `Text-to-image failed. Error: ${message}`, sanitizeApiResponse(response));
                handleWorkspaceUpdate(prevImages => prevImages.filter(i => i.id !== placeholderId), false);
            }

        } catch (e: any) {
            console.error(e);
            const errorMessage = `${t('error.api_error_prefix')} ${e.message}`;
            setError(errorMessage);
            addLog('error', errorMessage, e);
            if (placeholderId) {
                handleWorkspaceUpdate(prevImages => prevImages.filter(i => i.id !== placeholderId), false);
            }
        } finally {
            setLoadingAction(null);
            setLoadingMessage('');
        }
    }, [ai, userPrompt, workspaceImages, addLog, addPromptToHistory, handleWorkspaceUpdate, findNewImagePosition, t, processApiResponse, aspectRatio]);

    const handleGenericImageModification = useCallback(async (
        action: 'enhance' | 'rtx' | 'ref', 
        loadingTextKey: string, 
        logTextKey: string,
        prompt: string,
        tags: string[]
    ) => {
        if (combinedSelectedImageIds.length !== 1) {
            setError(t('error.no_image_to_enhance')); return;
        }
        const imageToModify = workspaceImages.find(img => img.id === combinedSelectedImageIds[0]);
        if (!imageToModify) {
            setError(t('error.no_image_to_enhance')); return;
        }

        addLog('action', t(logTextKey));
        setLoadingAction(action);
        setLoadingMessage(t(loadingTextKey));
        setError(null);
        
        const { x: newX, y: newY } = findNewImagePosition(workspaceImages, imageToModify.width, imageToModify);
        const placeholder: WorkspaceImage = { ...imageToModify, id: Date.now(), x: newX, y: newY, isLoading: true, isReasoning: false, layers: [], annotationHistory: [{ layers: [] }], annotationHistoryIndex: 0 };
        const placeholderId = placeholder.id;
        handleWorkspaceUpdate(prevImages => [...prevImages, placeholder], false);

        try {
            const { base64, mimeType, dataUrl } = await getImageData(imageToModify.source);
            
            let finalPrompt = `${prompt}${userPrompt.trim() && prompt !== 'more like this picture.' ? `\n\n${userPrompt.trim()}` : ''}\n\n!important:Your response should ONLY be the resulting image, with no other text, commentary, or markdown.`;
            if (action === 'ref' && userPrompt.trim()) {
                finalPrompt = `more like this picture.\n\n${userPrompt.trim()}\n\n!important:Your response should ONLY be the resulting image, with no other text, commentary, or markdown.`;
            }
            if (action === 'ref' && !userPrompt.trim()){
                finalPrompt = prompt + "\n\n!important:Your response should ONLY be the resulting image, with no other text, commentary, or markdown."
            }


            const context: GenerationContext = { prompt: finalPrompt, annotatedImageSources: [{ id: imageToModify.id, source: dataUrl }], type: action };

            addPromptToHistory({ prompt: finalPrompt, tags });
            addLog('api_request', `${action} request sent to API`, { prompt: finalPrompt });
            
            const config: { responseModalities: Modality[]; imageConfig?: { aspectRatio: string } } = {
                responseModalities: [Modality.IMAGE],
            };
            if (aspectRatio !== 'Auto') {
                config.imageConfig = { aspectRatio };
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: finalPrompt }] },
                config,
            });
            addLog('api_response', `${action} response received`, sanitizeApiResponse(response), true);
            processApiResponse(response, placeholderId, context);
        } catch (e: any) {
            console.error(e);
            const errorMessage = `${t('error.api_error_prefix')} ${e.message}`;
            setError(errorMessage);
            addLog('error', errorMessage, e);
            handleWorkspaceUpdate(prevImages => prevImages.filter(i => i.id !== placeholderId), false);
        } finally {
            setLoadingAction(null);
            setLoadingMessage('');
        }
    }, [combinedSelectedImageIds, workspaceImages, userPrompt, t, ai, addLog, handleWorkspaceUpdate, addPromptToHistory, findNewImagePosition, processApiResponse, aspectRatio]);

    const handleEnhance = () => handleGenericImageModification('enhance', 'loading.enhancing', 'log.action.start_enhance', `Improve details and textures, depixelate, deblocking, edge-aware anti-aliasing, Upscale to 8k, Примени это для всего изображения включая все объекты, объёмы, линии углубления и окружение.`, ['Enhance']);
    const handleRtxGenerate = () => handleGenericImageModification('rtx', 'loading.rtx', 'log.action.start_rtx', 'Current graphics settings: low. Change to: ultra rtx, photorealism, improve the quality of sharpness, detail, maximum quality rendering? Keep the shape and composition, but improve the resolution of materials, leather, body, hairs, fur and enviroment', ['RTX']);
    
    const handleRefGenerate = () => {
        const prompt = userPrompt.trim()
            ? 'more like this picture.'
            : 'Generate a new image featuring a random object, character, or scene that belongs to the same world as the provided image. Maintain the original artistic style, mood, and overall aesthetic';

        handleGenericImageModification(
            'ref',
            'loading.generating_image',
            'log.action.start_ref',
            prompt,
            ['REF']
        );
    };

    const handleMix = useCallback(async () => {
        if (combinedSelectedImageIds.length !== 1) {
            setError(t('error.no_image_to_mix')); return;
        }
        const imageToMix = workspaceImages.find(img => img.id === combinedSelectedImageIds[0]);
        if (!imageToMix) return;

        addLog('action', t('log.action.start_mix'));
        setLoadingAction('mix');
        setLoadingMessage(t('loading.generating_mixed_scene'));
        setError(null);

        const { x: newX, y: newY } = findNewImagePosition(workspaceImages, imageToMix.width, imageToMix);
        const placeholder = { ...imageToMix, id: Date.now(), x: newX, y: newY, isLoading: true, isReasoning: false, layers: [], annotationHistory: [{ layers: [] }], annotationHistoryIndex: 0 };
        const placeholderId = placeholder.id;
        handleWorkspaceUpdate(prevImages => [...prevImages, placeholder], false);

        try {
            const annotatedImageSource = await workspaceCanvasRef.current?.getAnnotatedImage(imageToMix.id);
            if (!annotatedImageSource) throw new Error('Could not get annotated image.');

            const { base64, mimeType, dataUrl } = await getImageData(annotatedImageSource);
            
            setLoadingMessage(t('loading.improving_prompt'));
            addLog('action', t('log.magic_prompt_active'));
            const magicPromptResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: '' }] },
                config: { systemInstruction: MAGIC_PROMPT_SYSTEM_INSTRUCTION },
            });
            let finalPrompt = magicPromptResponse.text?.trim();

            if (!finalPrompt) {
                setError(t('error.magic_prompt_generate_fail'));
                addLog('error', t('error.magic_prompt_generate_fail'), sanitizeApiResponse(magicPromptResponse));
                handleWorkspaceUpdate(prevImages => prevImages.filter(i => i.id !== placeholderId), false);
                setLoadingAction(null); setLoadingMessage('');
                return;
            }

            finalPrompt += '\n\n!important:Your response should ONLY be the resulting image, with no other text, commentary, or markdown.';
            
            addLog('action', t('log.magic_prompt_success'));
            const context: GenerationContext = { prompt: finalPrompt, annotatedImageSources: [{ id: imageToMix.id, source: dataUrl }], type: 'mix' };

            addPromptToHistory({ prompt: finalPrompt, tags: ['Mix', 'Magic'] });
            addLog('api_request', 'Mix request sent to API', { prompt: finalPrompt });
            setLoadingMessage(t('loading.generating_mixed_scene'));

            const config: { responseModalities: Modality[]; imageConfig?: { aspectRatio: string } } = {
                responseModalities: [Modality.IMAGE],
            };
            if (aspectRatio !== 'Auto') {
                config.imageConfig = { aspectRatio };
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: finalPrompt }] },
                config,
            });
            addLog('api_response', 'Mix response received', sanitizeApiResponse(response), true);
            processApiResponse(response, placeholderId, context);
        } catch (e: any) {
            console.error(e);
            const errorMessage = `${t('error.api_error_prefix')} ${e.message}`;
            setError(errorMessage);
            addLog('error', errorMessage, e);
            handleWorkspaceUpdate(prevImages => prevImages.filter(i => i.id !== placeholderId), false);
        } finally {
            setLoadingAction(null); setLoadingMessage('');
        }
    }, [combinedSelectedImageIds, workspaceImages, ai, addLog, handleWorkspaceUpdate, t, workspaceCanvasRef, processApiResponse, findNewImagePosition, addPromptToHistory, aspectRatio]);

    const handleGenerate = useCallback(async (reasoningLayers?: AnyLayer[]) => {
        if (isBadModeEnabled) {
            const isTextToImage = selectedImages.length === 0;
            if (isTextToImage && !userPrompt.trim()) {
                setError("Please provide a prompt to generate an image in Bad Mode.");
                return;
            }
    
            addLog('action', `Starting Bad Mode generation (type: ${isTextToImage ? 'text-to-image' : 'edit'})`);
            setLoadingAction('generate');
            setError(null);
            let placeholderId: number | null = null;
    
            try {
                const placeholderSize = 768;
                const refImage = isTextToImage ? null : selectedImages[0];
                const placeholderWidth = refImage ? refImage.width : placeholderSize;
                const { x: newX, y: newY } = findNewImagePosition(workspaceImages, placeholderWidth, refImage);
                const placeholder: WorkspaceImage = {
                    id: Date.now(), source: '', x: newX, y: newY,
                    width: refImage ? refImage.width : placeholderSize,
                    height: refImage ? refImage.height : placeholderSize,
                    originalWidth: refImage ? refImage.originalWidth : placeholderSize,
                    originalHeight: refImage ? refImage.originalHeight : placeholderSize,
                    layers: [], annotationHistory: [{ layers: [] }], annotationHistoryIndex: 0,
                    isLoading: true,
                };
                placeholderId = placeholder.id;
                handleWorkspaceUpdate(prevImages => [...prevImages, placeholder], false);
    
                const allParts: any[] = [];
                const contextImageSources: GenerationContext['annotatedImageSources'] = [];

                if (!isTextToImage) {
                    for (const image of selectedImages) {
                        const annotatedImageSource = await workspaceCanvasRef.current?.getAnnotatedImage(image.id);
                        if (!annotatedImageSource) throw new Error(`${t('error.ref_image_fail')} (ID: ${image.id})`);
                        const { base64, mimeType, dataUrl } = await getImageData(annotatedImageSource);
                        allParts.push({ inlineData: { mimeType, data: base64 } });
                        contextImageSources.push({ id: image.id, source: dataUrl });
                    }
                }
                
                const combinedPrompt = `${BAD_MODE_SYSTEM_INSTRUCTION}\n\nUser request: ${userPrompt}`;
                allParts.push({ text: combinedPrompt });
                
                const MAX_ATTEMPTS = 3;
                let finalResponse: GenerateContentResponse | null = null;
                let success = false;
    
                for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                    addLog('action', `Bad Mode generation: Attempt ${attempt}/${MAX_ATTEMPTS}`);
                    setLoadingMessage(`Bad AI is processing... (Attempt ${attempt}/${MAX_ATTEMPTS})`);
                    
                    try {
                        const config: { responseModalities: Modality[]; imageConfig?: { aspectRatio: string } } = {
                            responseModalities: [Modality.IMAGE],
                        };
                        if (aspectRatio !== 'Auto') {
                            config.imageConfig = { aspectRatio };
                        }

                        const response = await ai.models.generateContent({
                            model: 'gemini-2.5-flash-image',
                            contents: { parts: allParts },
                            config,
                        });
                        
                        finalResponse = response;
                        addLog('api_response', `Bad Mode response received (attempt ${attempt})`, sanitizeApiResponse(response), true);

                        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

                        if (imagePart) {
                            addLog('api_response', `Bad Mode generation successful on attempt ${attempt}.`);
                            const historyPrompt = `// Bad Mode\n${userPrompt}`;
                            addPromptToHistory({ prompt: historyPrompt, tags: [isTextToImage ? 'Text-to-Image' : 'Generate', 'Bad Mode'] });
                            const context: GenerationContext = { prompt: historyPrompt, annotatedImageSources: contextImageSources, type: isTextToImage ? 'text-to-image' : 'generate' };
                            processApiResponse(response, placeholderId, context);
                            success = true;
                            break; 
                        } else {
                            const message = getErrorMessageFromResponse(response);
                            addLog('error', `Bad Mode attempt ${attempt} failed: ${message}`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }

                    } catch (e: any) {
                        finalResponse = e;
                        addLog('error', `Bad Mode attempt ${attempt} failed with exception: ${e.message}`, e);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
    
                if (!success) {
                    const message = finalResponse ? getErrorMessageFromResponse(finalResponse) : t('error.model_no_image');
                    setError(`All Bad Mode attempts failed. Last error: ${message}`);
                    addLog('error', `All Bad Mode attempts failed. Last error: ${message}`, sanitizeApiResponse(finalResponse));
                    if (placeholderId) {
                        handleWorkspaceUpdate(prevImages => prevImages.filter(i => i.id !== placeholderId), false);
                    }
                }
    
            } catch (e: any) {
                console.error(e);
                const errorMessage = `${t('error.api_error_prefix')} ${e.message}`;
                setError(errorMessage);
                addLog('error', errorMessage, e);
                if (placeholderId) {
                    handleWorkspaceUpdate(prevImages => prevImages.filter(i => i.id !== placeholderId), false);
                }
            } finally {
                setLoadingAction(null);
                setLoadingMessage('');
            }
            return;
        }

        if (selectedImages.length === 0) {
            await handleTextToImageGenerate();
            return;
        }

        addLog('action', t('log.action.start_generation'));
        setLoadingAction('generate');
        setError(null);
        let placeholderId: number | null = null;
        
        try {
            // Create placeholder immediately for all image-to-image generation types
            const refImage = selectedImages[0];
            const { x: newX, y: newY } = findNewImagePosition(workspaceImages, refImage.width, refImage);
            const placeholder: WorkspaceImage = { ...refImage, id: Date.now(), x: newX, y: newY, isLoading: true, layers: [], annotationHistory: [{ layers: [] }], annotationHistoryIndex: 0 };
            placeholderId = placeholder.id;
            handleWorkspaceUpdate(prevImages => [...prevImages, placeholder], false);

            const parts: ({ text: string } | { inlineData: { mimeType: string; data: string; } })[] = [];
            const contextImageSources: GenerationContext['annotatedImageSources'] = [];
            
            let apiPrompt = userPrompt;
            let historyPrompt = userPrompt;
            const tags: string[] = ['Generate'];

            if (isMagicPromptEnabled && !reasoningLayers) {
                setLoadingMessage(t('loading.improving_prompt'));
                addLog('action', t('log.magic_prompt_active'));
                
                const magicPromptParts: any[] = [];
                if (userPrompt.trim()) magicPromptParts.push({ text: userPrompt });

                for (const image of selectedImages) {
                    const annotatedImageSource = await workspaceCanvasRef.current?.getAnnotatedImage(image.id);
                    if (!annotatedImageSource) throw new Error('Could not get annotated image for Magic Prompt.');
                    const { base64, mimeType } = await getImageData(annotatedImageSource);
                    magicPromptParts.push({ inlineData: { data: base64, mimeType } });
                }

                try {
                    const magicPromptResponse = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: { parts: magicPromptParts },
                        config: { systemInstruction: MAGIC_PROMPT_SYSTEM_INSTRUCTION },
                    });
                    const enhancedPrompt = magicPromptResponse.text?.trim();

                    if (enhancedPrompt) {
                        apiPrompt = enhancedPrompt;
                        historyPrompt = enhancedPrompt;
                        addLog('action', t('log.magic_prompt_success'));
                    } else {
                        addLog('error', t('log.magic_prompt_fail_json'), sanitizeApiResponse(magicPromptResponse));
                    }
                } catch (e: any) {
                    addLog('error', t('log.magic_prompt_error', { message: e.message }), e);
                }
                tags.push('Magic');
            }

            apiPrompt += '\n\n!important:Your response should ONLY be the resulting image, with no other text, commentary, or markdown.';
            historyPrompt = apiPrompt;
            
            addPromptToHistory({ prompt: historyPrompt, tags });
            parts.push({ text: apiPrompt });

            for (const image of selectedImages) {
                const annotatedImageSource = await workspaceCanvasRef.current?.getAnnotatedImage(image.id);
                if (!annotatedImageSource) throw new Error(`${t('error.ref_image_fail')} (ID: ${image.id})`);
                const { base64, mimeType, dataUrl } = await getImageData(annotatedImageSource);
                parts.unshift({ inlineData: { mimeType, data: base64 } });
                contextImageSources.push({ id: image.id, source: dataUrl });
            }

            const context: GenerationContext = { prompt: historyPrompt, annotatedImageSources: contextImageSources, type: 'generate' };
            
            addLog('api_request', 'Generation request sent to API', { prompt: apiPrompt, images: contextImageSources.length });
            setLoadingMessage(t('loading.generating_image'));
            
            const config: { responseModalities: Modality[]; imageConfig?: { aspectRatio: string } } = {
                responseModalities: [Modality.IMAGE],
            };
            if (aspectRatio !== 'Auto') {
                config.imageConfig = { aspectRatio };
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts },
                config,
            });
                
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

            if (imagePart) {
                addLog('api_response', 'Generation successful.', sanitizeApiResponse(response), true);
                processApiResponse(response, placeholderId, context);
            } else {
                const message = getErrorMessageFromResponse(response);
                setError(message);
                addLog('error', `Generation failed. Last error: ${message}`, sanitizeApiResponse(response));
                if (placeholderId) {
                    handleWorkspaceUpdate(prevImages => prevImages.filter(i => i.id !== placeholderId), false);
                }
            }
        } catch (e: any) {
            console.error(e);
            const errorMessage = `${t('error.api_error_prefix')} ${e.message}`;
            setError(errorMessage);
            addLog('error', errorMessage, e);
            if (placeholderId) {
                handleWorkspaceUpdate(prevImages => prevImages.filter(i => i.id !== placeholderId), false);
            }
        } finally {
            setLoadingAction(null);
            setLoadingMessage('');
        }
    }, [ai, userPrompt, isMagicPromptEnabled, isBadModeEnabled, selectedImages, workspaceImages, t, addLog, handleWorkspaceUpdate, workspaceCanvasRef, findNewImagePosition, processApiResponse, addPromptToHistory, handleTextToImageGenerate, aspectRatio]);

    const handleReasoning = useCallback(async () => {
        if (combinedSelectedImageIds.length !== 1 || !userPrompt.trim()) {
            setError('Please select one image and write a prompt for reasoning.'); return;
        }
        const imageToReason = workspaceImages.find(img => img.id === combinedSelectedImageIds[0]);
        if (!imageToReason) return;
    
        setLoadingAction('reasoning');
        setLoadingMessage(t('loading.creating_annotations'));
        setError(null);
        addLog('action', 'Starting reasoning process...');
        addPromptToHistory({ prompt: userPrompt, tags: ['Reasoning'] });
    
        handleWorkspaceUpdate(prevImages => prevImages.map(img => img.id === imageToReason.id ? { ...img, isReasoning: true } : img), false);
    
        try {
            const annotatedImageSource = await workspaceCanvasRef.current?.getAnnotatedImage(imageToReason.id);
            if (!annotatedImageSource) throw new Error('Could not get annotated image for reasoning.');
    
            const { base64, mimeType } = await getImageData(annotatedImageSource);
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: userPrompt }] },
                config: {
                    systemInstruction: REASONING_SYSTEM_INSTRUCTION,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: { type: Type.STRING },
                                start: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                                end: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                                position: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                                label: { type: Type.STRING },
                            },
                        },
                    },
                },
            });
    
            addLog('api_response', 'Reasoning response received', sanitizeApiResponse(response), true);
            const jsonText = response.text.trim().replace(/^```json\n?/, '').replace(/```$/, '');
            const reasoningData = JSON.parse(jsonText);
    
            if (!Array.isArray(reasoningData)) throw new Error('Reasoning response is not a valid JSON array.');
    
            const reasoningColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7D154', '#B39DDB'];
            const MAX_EDIT_DIMENSION = 1500;
            const { originalWidth, originalHeight } = imageToReason;
            const editorScale = Math.min(MAX_EDIT_DIMENSION / originalWidth, MAX_EDIT_DIMENSION / originalHeight, 1);
            const scaledWidth = originalWidth * editorScale;
            const scaledHeight = originalHeight * editorScale;
    
            const newLayers: AnyLayer[] = reasoningData.map((item, index): AnyLayer | AnyLayer[] | null => {
                const color = reasoningColors[index % reasoningColors.length];
                const common = { id: Date.now() + index, color, size: 10 };
    
                if (item.type === 'arrow' && item.start && item.end && item.label) {
                    const start = { x: item.start.x * scaledWidth, y: item.start.y * scaledHeight };
                    const end = { x: item.end.x * scaledWidth, y: item.end.y * scaledHeight };
                    const minX = Math.min(start.x, end.x);
                    const minY = Math.min(start.y, end.y);
    
                    const arrowLayer: ArrowLayer = {
                        ...common, type: Tool.Arrow,
                        x: minX, y: minY,
                        width: Math.abs(start.x - end.x), height: Math.abs(start.y - end.y),
                        start: { x: start.x - minX, y: start.y - minY },
                        end: { x: end.x - minX, y: end.y - minY },
                    };
    
                    const textFontSize = Math.max(18, scaledHeight * 0.03);
                    const textLayer: TextLayer = {
                        id: Date.now() + 1000 + index, type: 'text', text: item.label,
                        x: (start.x + end.x) / 2, y: (start.y + end.y) / 2,
                        width: item.label.length * (textFontSize * 0.6), height: textFontSize,
                        fontSize: textFontSize, color, fontFamily: "'Space Grotesk', sans-serif", align: 'center',
                    };
                    return [arrowLayer, textLayer];
                }
                if (item.type === 'text' && item.position && item.label) {
                    const fontSize = Math.max(24, scaledHeight * 0.04);
                    return {
                        id: Date.now() + index, type: 'text', text: item.label,
                        x: item.position.x * scaledWidth, y: item.position.y * scaledHeight,
                        width: item.label.length * (fontSize * 0.6), height: fontSize,
                        fontSize, color, fontFamily: "'Space Grotesk', sans-serif", align: 'left',
                    } as TextLayer;
                }
                return null;
            }).flat().filter((l): l is AnyLayer => l !== null);
    
            handleWorkspaceUpdate(prevImages => prevImages.map(img =>
                img.id === imageToReason.id
                    ? { ...img, isReasoning: false, layers: [...img.layers, ...newLayers] }
                    : img
            ), true);
    
            window.setTimeout(() => {
                handleGenerate(newLayers);
            }, 100);
    
        } catch (e: any) {
            console.error(e);
            const errorMessage = `${t('error.api_error_prefix')} ${e.message}`;
            setError(errorMessage);
            addLog('error', errorMessage, e);
            handleWorkspaceUpdate(prevImages => prevImages.map(img => ({ ...img, isReasoning: false })), false);
            setLoadingAction(null); setLoadingMessage('');
        }
    }, [combinedSelectedImageIds, workspaceImages, userPrompt, ai, t, addLog, handleWorkspaceUpdate, workspaceCanvasRef, handleGenerate, addPromptToHistory]);
    
    const handleRegenerate = useCallback(async (imageId: number) => {
        const imageToRegen = workspaceImages.find(img => img.id === imageId);
        if (!imageToRegen?.generationContext) return;
    
        const { prompt, annotatedImageSources, type } = imageToRegen.generationContext;
        
        // Handle text-to-image regeneration differently
        if (type === 'text-to-image') {
            addLog('action', `Regenerating image (type: ${type})`);
            setLoadingAction('generate');
            setLoadingMessage(t('loading.generating_image'));
            setError(null);
            
            handleWorkspaceUpdate(prevImages => prevImages.map(img => img.id === imageId ? { ...img, isLoading: true } : img), false);
            
            try {
                let apiPrompt = prompt;
                 const tags = ['Regenerate', 'Text-to-Image'];
                if (isBadModeEnabled) {
                     tags.push('Bad Mode');
                    setLoadingMessage("Bad AI is crafting a rebellious prompt...");

                    const combinedPrompt = `${BAD_MODE_SYSTEM_INSTRUCTION}\n\nUser request: ${apiPrompt}`;
                    const allParts = [{ text: combinedPrompt }];
                    
                    addPromptToHistory({ prompt: apiPrompt, tags });
                    addLog('api_request', 'Text-to-image (Bad Mode) regen request sent', { prompt: apiPrompt });
                    
                    const config: { responseModalities: Modality[]; imageConfig?: { aspectRatio: string } } = {
                        responseModalities: [Modality.IMAGE],
                    };
                    if (aspectRatio !== 'Auto') {
                        config.imageConfig = { aspectRatio };
                    }

                    const finalResponse = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: { parts: allParts },
                        config,
                    });
                    
                    const context: GenerationContext = { prompt: apiPrompt, annotatedImageSources: [], type: 'text-to-image' };
                    processApiResponse(finalResponse, imageId, context);
                    return;
                }
                
                addPromptToHistory({ prompt: apiPrompt, tags });
                addLog('api_request', 'Text-to-image regeneration request sent to API', { prompt: apiPrompt });

                const config: { responseModalities: Modality[]; imageConfig?: { aspectRatio: string } } = {
                    responseModalities: [Modality.IMAGE],
                };
                if (aspectRatio !== 'Auto') {
                    config.imageConfig = { aspectRatio };
                }

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: apiPrompt }] },
                    config,
                });
                
                addLog('api_response', 'Text-to-image regeneration response received', sanitizeApiResponse(response), true);

                const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                if (imagePart?.inlineData) {
                    const newDataSource = `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
                    const img = new Image();
                    img.onload = () => {
                         handleWorkspaceUpdate(prevImages => prevImages.map(i => {
                            if (i.id === imageId) {
                                return { ...i, source: newDataSource, originalWidth: img.width, originalHeight: img.height, isLoading: false, generationContext: { ...imageToRegen.generationContext, prompt: apiPrompt } };
                            }
                            return i;
                         }), true);
                    };
                    img.src = newDataSource;
                } else {
                    throw new Error(getErrorMessageFromResponse(response));
                }

            } catch(e: any) {
                const errorMessage = `${t('error.api_error_prefix')} ${e.message}`;
                setError(errorMessage); addLog('error', errorMessage, e);
                handleWorkspaceUpdate(prevImages => prevImages.map(img => ({ ...img, isLoading: false })), false);
            } finally {
                setLoadingAction(null); setLoadingMessage('');
            }
            return;
        }


        setLoadingAction('generate');
        setLoadingMessage(t('loading.generating_image'));
        setError(null);
        addLog('action', `Regenerating image (type: ${type})`);
        
        addPromptToHistory({ prompt, tags: ['Regenerate', type] });
    
        handleWorkspaceUpdate(prevImages => prevImages.map(img => img.id === imageId ? { ...img, isLoading: true } : img), false);
    
        try {
            const parts: any[] = [{ text: prompt }];
            for (const { source } of annotatedImageSources) {
                const { base64, mimeType } = await getImageData(source);
                parts.unshift({ inlineData: { data: base64, mimeType } });
            }
    
            addLog('api_request', 'Regeneration request sent to API', { prompt, images: annotatedImageSources.length });
            
            const config: { responseModalities: Modality[]; imageConfig?: { aspectRatio: string } } = {
                responseModalities: [Modality.IMAGE],
            };
            if (aspectRatio !== 'Auto') {
                config.imageConfig = { aspectRatio };
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts },
                config,
            });
    
            addLog('api_response', 'Regeneration response received', sanitizeApiResponse(response), true);
    
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imagePart?.inlineData) {
                const newDataSource = `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
                const img = new Image();
                img.onload = () => {
                    handleWorkspaceUpdate(prevImages => prevImages.map(i => {
                        if (i.id === imageId) {
                            const aspectRatio = img.width / img.height;
                            const newHeight = i.height; // Keep canvas height of the image being replaced
                            const newWidth = newHeight * aspectRatio;
                            return {
                                ...i,
                                source: newDataSource,
                                width: newWidth,
                                height: newHeight,
                                originalWidth: img.width,
                                originalHeight: img.height,
                                isLoading: false,
                            };
                        }
                        return i;
                    }), true);
                };
                img.src = newDataSource;
            } else {
                throw new Error(getErrorMessageFromResponse(response));
            }
        } catch (e: any) {
            console.error(e);
            const errorMessage = `${t('error.api_error_prefix')} ${e.message}`;
            setError(errorMessage);
            addLog('error', errorMessage, e);
            handleWorkspaceUpdate(prevImages => prevImages.map(img => ({ ...img, isLoading: false })), false);
        } finally {
            setLoadingAction(null);
            setLoadingMessage('');
        }
    }, [workspaceImages, ai, addLog, handleWorkspaceUpdate, t, getErrorMessageFromResponse, addPromptToHistory, isBadModeEnabled, processApiResponse, aspectRatio]);
    
    const handleResizeAndGenerate = useCallback(async (
        imageId: number, 
        dataUrl: string, 
        finalRect: { width: number; height: number; originalWidth: number; originalHeight: number; }
    ) => {
        setLoadingAction('generate');
        setLoadingMessage(t('loading.generating_image'));
        setError(null);
        addLog('action', 'Starting outpainting generation...');
    
        handleWorkspaceUpdate(prevImages => prevImages.map(img => img.id === imageId ? { ...img, isLoading: true } : img), false);
    
        try {
            const { base64, mimeType, dataUrl: contextSource } = await getImageData(dataUrl);
            
            const finalPrompt = userPrompt.trim()
                ? OUTPAINTING_PROMPT_WITH_CONTEXT.replace('{user_prompt}', userPrompt.trim())
                : OUTPAINTING_PROMPT;

            const context: GenerationContext = {
                prompt: finalPrompt,
                annotatedImageSources: [{ id: imageId, source: contextSource }],
                type: 'outpainting'
            };
    
            addPromptToHistory({ prompt: finalPrompt, tags: ['Outpainting'] });
            addLog('api_request', 'Outpainting request sent to API', { prompt: finalPrompt });
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: finalPrompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
    
            addLog('api_response', 'Outpainting response received', sanitizeApiResponse(response), true);
    
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
            if (imagePart?.inlineData) {
                const newDataSource = `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
                const img = new Image();
                img.onload = () => {
                    handleWorkspaceUpdate(prevImages => prevImages.map(i => {
                        if (i.id === imageId) {
                            return {
                                ...i,
                                ...finalRect,
                                source: newDataSource,
                                isLoading: false,
                                generationContext: context,
                                layers: [],
                                annotationHistory: [{ layers: [] }],
                                annotationHistoryIndex: 0,
                            };
                        }
                        return i;
                    }), true);
                    setManualSelectedImageIds([imageId]);
                };
                img.src = newDataSource;
            } else {
                throw new Error(getErrorMessageFromResponse(response));
            }
        } catch (e: any) {
            console.error(e);
            const errorMessage = `${t('error.api_error_prefix')} ${e.message}`;
            setError(errorMessage);
            addLog('error', errorMessage, e);
            handleWorkspaceUpdate(prevImages => prevImages.map(img => ({ ...img, isLoading: false })), false);
        } finally {
            setLoadingAction(null);
            setLoadingMessage('');
        }
    }, [ai, userPrompt, addLog, addPromptToHistory, handleWorkspaceUpdate, setManualSelectedImageIds, t, getErrorMessageFromResponse]);

    const handleReplicaGenerate = useCallback(async () => {
        if (combinedSelectedImageIds.length !== 1) {
            setError("Please select one image for 'More Like This'.");
            return;
        }
        const sourceImage = workspaceImages.find(img => img.id === combinedSelectedImageIds[0]);
        if (!sourceImage) return;
    
        setLoadingAction('rep');
        setLoadingMessage('Analyzing image...');
        setError(null);
        addLog('action', t('log.action.start_rep'));
    
        let placeholderId: number | null = null;
        
        try {
            // Create placeholder immediately to show loader during analysis
            const { x: newX, y: newY } = findNewImagePosition(workspaceImages, sourceImage.width, sourceImage);
            const placeholder: WorkspaceImage = {
                id: Date.now(), source: '', x: newX, y: newY,
                width: sourceImage.width, height: sourceImage.height,
                originalWidth: sourceImage.originalWidth, originalHeight: sourceImage.originalHeight,
                layers: [], annotationHistory: [{ layers: [] }], annotationHistoryIndex: 0,
                isLoading: true,
            };
            placeholderId = placeholder.id;
            handleWorkspaceUpdate(prev => [...prev, placeholder], false);

            // --- STEP 1: Analyze Image ---
            const { base64, mimeType } = await getImageData(sourceImage.source);
    
            const analyzeResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ inlineData: { data: base64, mimeType } }] },
                config: {
                    systemInstruction: ANALYZE_MODE_SYSTEM_INSTRUCTION,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            GEN_PROMPT: { type: Type.STRING },
                            NEGATIVE_PROMPT: { type: Type.STRING },
                            PARAMS: {
                                type: Type.OBJECT,
                                properties: {
                                    aspect_ratio: { type: Type.STRING }
                                },
                            },
                        },
                        required: ["GEN_PROMPT", "NEGATIVE_PROMPT", "PARAMS"],
                    },
                },
            });
    
            addLog('api_response', 'Analysis for "Replica" received', sanitizeApiResponse(analyzeResponse), true);
            const jsonText = analyzeResponse.text.trim();
            const analysisResult = JSON.parse(jsonText);
            
            const genPrompt = analysisResult.GEN_PROMPT;
            if (!genPrompt) {
                throw new Error('Analysis failed to produce a generation prompt.');
            }
            addLog('action', 'Image analyzed, starting generation phase.', { genPrompt });
            addPromptToHistory({ prompt: genPrompt, tags: ['Replica', 'Analyzed'] });
            
            // --- STEP 2: Generate New Image ---
            setLoadingMessage('Generating similar image...');
            
            const ar = analysisResult.PARAMS?.aspect_ratio;
            const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
            let finalAspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1";
            if (ar && validAspectRatios.includes(ar)) {
                finalAspectRatio = ar as "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
            } else {
                 const sourceRatio = sourceImage.originalWidth / sourceImage.originalHeight;
                 const closest = validAspectRatios.reduce((prev, curr) => {
                     const [w, h] = curr.split(':').map(Number);
                     const ratio = w / h;
                     const prevDiff = Math.abs((prev.split(':').map(Number)[0] / prev.split(':').map(Number)[1]) - sourceRatio);
                     const currDiff = Math.abs(ratio - sourceRatio);
                     return currDiff < prevDiff ? curr : prev;
                 });
                 finalAspectRatio = closest as "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
            }
            
            const generateResponse = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: genPrompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/png',
                  aspectRatio: finalAspectRatio,
                },
            });
            
            const generatedImageB64 = generateResponse.generatedImages?.[0]?.image?.imageBytes;
    
            if (generatedImageB64) {
                const newDataSource = `data:image/png;base64,${generatedImageB64}`;
                const img = new Image();
                img.onload = () => {
                    const context: GenerationContext = {
                        prompt: genPrompt,
                        annotatedImageSources: [],
                        type: 'rep',
                    };
    
                     handleWorkspaceUpdate(prevImages => prevImages.map(i => {
                        if (i.id === placeholderId) {
                            const newAspectRatio = img.width / img.height;
                            const newHeight = i.height;
                            const newWidth = newHeight * newAspectRatio;
                            return {
                                ...i, source: newDataSource,
                                width: newWidth, height: newHeight,
                                originalWidth: img.width, originalHeight: img.height,
                                isLoading: false, generationContext: context,
                            };
                        }
                        return i;
                     }), true);
                    setManualSelectedImageIds([placeholderId]);
                };
                img.src = newDataSource;
    
            } else {
                throw new Error('The model did not return an image for the "Replica" generation.');
            }
    
        } catch (e: any) {
            console.error(e);
            const errorMessage = `${t('error.api_error_prefix')} ${e.message}`;
            setError(errorMessage);
            addLog('error', errorMessage, e);
            if (placeholderId) {
                handleWorkspaceUpdate(prev => prev.filter(i => i.id !== placeholderId), false);
            }
        } finally {
            setLoadingAction(null);
            setLoadingMessage('');
        }
    }, [ai, combinedSelectedImageIds, workspaceImages, addLog, addPromptToHistory, handleWorkspaceUpdate, setManualSelectedImageIds, t, findNewImagePosition]);

    return { loadingAction, loadingMessage, error, setError, handleGenerate, handleReasoning, handleEnhance, handleRtxGenerate, handleMix, handleRegenerate, handleResizeAndGenerate, handleReplicaGenerate, handleRefGenerate };
};