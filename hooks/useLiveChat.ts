
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type, Blob } from '@google/genai';
import { Tool, LiveState } from '../types';

interface UseLiveChatProps {
    ai: GoogleGenAI;
    onFunctionCall: (name: string, args: any) => void;
    onTranscriptUpdate: (transcript: { user: string; model: string } | null) => void;
    onMessageHistoryUpdate: (message: { sender: 'USER' | 'AI'; text: string }) => void;
}

// --- Audio Helper Functions ---
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

const functionDeclarations: FunctionDeclaration[] = [
    { name: 'generate', description: 'Generates or edits an image based on a prompt. Use this for creating new content or applying changes to selected images.', parameters: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING, description: 'A detailed description of the desired image or changes.' } }, required: ['prompt'] } },
    { name: 'enhance', description: 'Enhances the quality and details of the currently selected image.', parameters: { type: Type.OBJECT, properties: {} } },
    { name: 'regenerate', description: 'Regenerates the selected image using its previous generation context.', parameters: { type: Type.OBJECT, properties: {} } },
    { name: 'mix', description: 'Intelligently combines the layers and annotations of the selected image into a new, cohesive scene.', parameters: { type: Type.OBJECT, properties: {} } },
    { name: 'undo', description: 'Undoes the last action taken on the canvas or in the editor.', parameters: { type: Type.OBJECT, properties: {} } },
    { name: 'redo', description: 'Redoes the last undone action.', parameters: { type: Type.OBJECT, properties: {} } },
    { name: 'deleteSelection', description: 'Deletes the currently selected images from the canvas.', parameters: { type: Type.OBJECT, properties: {} } },
    { name: 'reset', description: 'Clears the entire canvas, deleting all images and history.', parameters: { type: Type.OBJECT, properties: {} } },
    { name: 'showPresets', description: 'Opens the modal window to view and select from a list of predefined prompts.', parameters: { type: Type.OBJECT, properties: {} } },
    { name: 'download', description: 'Downloads the currently selected image.', parameters: { type: Type.OBJECT, properties: {} } },
    { name: 'changeTool', description: 'Changes the active tool in the image editor.', parameters: { type: Type.OBJECT, properties: { tool: { type: Type.STRING, description: `The tool to switch to. Must be one of: "${Object.values(Tool).join('", "')}".` } }, required: ['tool'] } },
    { name: 'exitEditor', description: 'Saves any changes made in the image editor and returns to the main canvas view.', parameters: { type: Type.OBJECT, properties: {} } },
    { name: 'selectImage', description: 'Selects one or more images on the canvas by their number (e.g., "@1", "@2"). This replaces any current selection.', parameters: { type: Type.OBJECT, properties: { imageNumbers: { type: Type.ARRAY, description: 'An array of numbers corresponding to the images on screen. For example, to select the first image (@1), provide [1]. To select images 2 and 3, provide [2, 3].', items: { type: Type.NUMBER, } } }, required: ['imageNumbers'] } },
    { name: 'clearSelection', description: 'Deselects all currently selected images.', parameters: { type: Type.OBJECT, properties: {} } },
];


export const useLiveChat = (props: UseLiveChatProps) => {
    const { ai } = props;
    const [liveState, setLiveState] = useState<LiveState>(LiveState.IDLE);
    
    // A ref to hold the latest callback props. This is crucial for avoiding stale closures
    // in the long-lived `onmessage` callback of the live session.
    const callbackRef = useRef(props);
    useEffect(() => {
        callbackRef.current = props;
    }, [props]);

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const audioQueueRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);
    const currentInputTranscription = useRef<string>('');
    const currentOutputTranscription = useRef<string>('');

    const cleanup = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;
        
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
        inputAudioContextRef.current?.close().catch(console.error);
        inputAudioContextRef.current = null;
        
        outputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current = null;
        
        audioQueueRef.current.forEach(source => source.stop());
        audioQueueRef.current.clear();
        nextStartTimeRef.current = 0;

        callbackRef.current.onTranscriptUpdate(null);
        setLiveState(LiveState.IDLE);
    }, []);
    
    useEffect(() => () => cleanup(), [cleanup]);

    const startSession = useCallback(async () => {
        if (liveState !== LiveState.IDLE && liveState !== LiveState.ERROR) return;
        
        cleanup(); // Ensure a clean state before starting
        setLiveState(LiveState.CONNECTING);

        try {
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    tools: [{ functionDeclarations }],
                    systemInstruction: 'You are Sally, a friendly and helpful AI assistant for the BananaCrunch image editor. Be concise and conversational. When asked to perform an action, call the appropriate function.',
                },
                callbacks: {
                    onopen: async () => {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        mediaStreamRef.current = stream;
                        
                        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        inputAudioContextRef.current = inputCtx;
                        
                        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                        outputAudioContextRef.current = outputCtx;

                        const source = inputCtx.createMediaStreamSource(stream);
                        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = processor;
                        
                        processor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(processor);
                        processor.connect(inputCtx.destination);
                        setLiveState(LiveState.LISTENING);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription?.text) {
                            currentInputTranscription.current += message.serverContent.inputTranscription.text;
                            callbackRef.current.onTranscriptUpdate({ user: currentInputTranscription.current, model: currentOutputTranscription.current });
                        }
                        if (message.serverContent?.outputTranscription?.text) {
                             setLiveState(LiveState.SPEAKING);
                             currentOutputTranscription.current += message.serverContent.outputTranscription.text;
                             callbackRef.current.onTranscriptUpdate({ user: currentInputTranscription.current, model: currentOutputTranscription.current });
                        }

                        if (message.serverContent?.turnComplete) {
                            callbackRef.current.onTranscriptUpdate(null);
                            if (currentInputTranscription.current.trim()) {
                                callbackRef.current.onMessageHistoryUpdate({ sender: 'USER', text: currentInputTranscription.current.trim() });
                            }
                            if (currentOutputTranscription.current.trim()) {
                                callbackRef.current.onMessageHistoryUpdate({ sender: 'AI', text: currentOutputTranscription.current.trim() });
                            }
                            currentInputTranscription.current = '';
                            currentOutputTranscription.current = '';
                            setLiveState(prev => (prev === LiveState.THINKING ? prev : LiveState.LISTENING));
                        }

                        if (message.toolCall?.functionCalls) {
                            setLiveState(LiveState.THINKING);
                            for (const fc of message.toolCall.functionCalls) {
                                callbackRef.current.onFunctionCall(fc.name, fc.args);
                                sessionPromiseRef.current?.then(session => {
                                    session.sendToolResponse({
                                        functionResponses: { id: fc.id, name: fc.name, response: { result: `ok, command ${fc.name} received.` } }
                                    });
                                });
                            }
                        }

                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        const outputCtx = outputAudioContextRef.current;
                        if (audioData && outputCtx) {
                           setLiveState(LiveState.SPEAKING);
                           const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                           const source = outputCtx.createBufferSource();
                           source.buffer = audioBuffer;
                           source.connect(outputCtx.destination);
                           
                           const currentTime = outputCtx.currentTime;
                           const startTime = Math.max(currentTime, nextStartTimeRef.current);
                           source.start(startTime);
                           
                           nextStartTimeRef.current = startTime + audioBuffer.duration;
                           audioQueueRef.current.add(source);
                           source.onended = () => {
                                audioQueueRef.current.delete(source);
                                if (audioQueueRef.current.size === 0) {
                                    setLiveState(prev => (prev === LiveState.SPEAKING ? LiveState.LISTENING : prev));
                                }
                           };
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setLiveState(LiveState.ERROR);
                        cleanup();
                    },
                    onclose: () => {
                        cleanup();
                    },
                },
            });
        } catch (error) {
            console.error('Failed to start session:', error);
            setLiveState(LiveState.ERROR);
            cleanup();
        }
    }, [ai, cleanup, liveState]);

    const stopSession = useCallback(() => {
        cleanup();
    }, [cleanup]);

    return { liveState, startSession, stopSession };
};
