# Руководство: Реализация голосового управления с Gemini Live API

Это руководство описывает, как интегрировать в React-приложение голосовое управление в реальном времени с помощью Google Gemini Live API и Web Audio API. Мы создадим кастомный хук `useLiveChat`, аналогичный тому, что используется в этом проекте.

## Ключевые технологии

-   **React:** для создания пользовательского интерфейса.
-   **@google/genai:** официальный SDK для взаимодействия с Gemini API.
-   **Web Audio API:** встроенный в браузер API для обработки и воспроизведения аудио.

---

## Шаг 1: Установка зависимостей

Убедитесь, что у вас установлен пакет `@google/genai`:

```bash
npm install @google/genai
```

---

## Шаг 2: Вспомогательные функции для аудио

Gemini Live API принимает и отправляет аудио в виде Base64-строк, содержащих необработанные PCM-данные. Нам понадобятся функции для преобразования форматов.

```typescript
// helpers/audioUtils.ts

// Кодирует массив байт в Base64
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Декодирует Base64-строку в массив байт
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Декодирует необработанные PCM-данные в AudioBuffer для воспроизведения
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Данные приходят как 16-битные целые числа
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Преобразуем Int16 (-32768 до 32767) в Float32 (-1.0 до 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
```

---

## Шаг 3: Создание хука `useLiveChat`

Это ядро нашей системы. Хук будет управлять состоянием, подключением и обработкой данных.

```typescript
// hooks/useLiveChat.ts

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type, Blob } from '@google/genai';
import { encode, decode, decodeAudioData } from '../helpers/audioUtils';

// Определяем состояния для UI
export enum LiveState {
    IDLE = 'IDLE',
    CONNECTING = 'CONNECTING',
    LISTENING = 'LISTENING',
    THINKING = 'THINKING', // Когда модель выполняет Function Call
    ERROR = 'ERROR',
}

// Интерфейс для пропсов хука
interface UseLiveChatProps {
    // Коллбэк, который будет вызван, когда модель решит выполнить действие
    onFunctionCall: (name: string, args: any) => void;
    // Коллбэки для обновления UI
    onTranscriptUpdate: (transcript: { user: string; sally: string } | null) => void;
    onMessageHistoryUpdate: (message: { sender: 'USER' | 'SALLY'; text: string }) => void;
}

export const useLiveChat = ({ onFunctionCall, onTranscriptUpdate, onMessageHistoryUpdate }: UseLiveChatProps) => {
    const [liveState, setLiveState] = useState<LiveState>(LiveState.IDLE);

    // Используем Refs для хранения объектов, которые должны "пережить" ре-рендеры
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);

    const currentInputTranscription = useRef<string>('');
    const currentOutputTranscription = useRef<string>('');

    // Функция для полной очистки всех ресурсов
    const cleanup = useCallback(() => {
        // ... (полная реализация из файла hooks/useLiveChat.ts в проекте)
        // Важно: закрыть сессию, остановить микрофон, закрыть аудио-контексты
    }, []);
    
    // Запускаем очистку при размонтировании компонента
    useEffect(() => () => cleanup(), [cleanup]);

    const startSession = useCallback(async () => {
        if (liveState !== LiveState.IDLE && liveState !== LiveState.ERROR) return;
        setLiveState(LiveState.CONNECTING);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            // 1. Описываем функции, которые модель может вызывать
            const myFunctionDeclaration: FunctionDeclaration = {
              name: 'myCoolFunction',
              parameters: {
                type: Type.OBJECT,
                description: "Описание того, что делает ваша функция.",
                properties: {
                  someArgument: { type: Type.STRING, description: "Описание аргумента." },
                },
                required: ['someArgument'],
              },
            };

            // 2. Устанавливаем соединение
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                // 3. Конфигурация
                config: {
                    responseModalities: [Modality.AUDIO], // Мы хотим получать аудио в ответ
                    inputAudioTranscription: {}, // Включаем транскрипцию нашего голоса
                    outputAudioTranscription: {}, // Включаем транскрипцию голоса модели
                    tools: [{ functionDeclarations: [myFunctionDeclaration] }],
                    systemInstruction: 'Ты — полезный ассистент.',
                },
                // 4. Коллбэки для обработки событий
                callbacks: {
                    onopen: async () => {
                        // Настройка захвата аудио с микрофона
                        // ... (код из файла hooks/useLiveChat.ts в проекте)
                        setLiveState(LiveState.LISTENING);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Обработка транскрипции
                        if (message.serverContent?.inputTranscription?.text) {
                            currentInputTranscription.current += message.serverContent.inputTranscription.text;
                            onTranscriptUpdate({ user: currentInputTranscription.current, sally: currentOutputTranscription.current });
                        }
                        // ... аналогично для outputTranscription

                        // Обработка завершения "хода" диалога
                        if (message.serverContent?.turnComplete) {
                            onTranscriptUpdate(null); // Сбрасываем "живую" транскрипцию
                            if(currentInputTranscription.current.trim()) {
                                onMessageHistoryUpdate({ sender: 'USER', text: currentInputTranscription.current.trim() });
                            }
                            if(currentOutputTranscription.current.trim()) {
                                onMessageHistoryUpdate({ sender: 'SALLY', text: currentOutputTranscription.current.trim() });
                            }
                            currentInputTranscription.current = '';
                            currentOutputTranscription.current = '';
                            setLiveState(LiveState.LISTENING);
                        }

                        // ОБРАБОТКА ВЫЗОВА ФУНКЦИИ (САМОЕ ВАЖНОЕ)
                        if (message.toolCall?.functionCalls) {
                            for (const fc of message.toolCall.functionCalls) {
                                setLiveState(LiveState.THINKING);
                                // Вызываем коллбэк, переданный в хук
                                onFunctionCall(fc.name, fc.args);
                                // Отправляем модели подтверждение, что мы получили команду
                                sessionPromiseRef.current?.then(session => {
                                    session.sendToolResponse({
                                        functionResponses: { id: fc.id, name: fc.name, response: { result: "ok, running." } }
                                    });
                                });
                            }
                        }

                        // Воспроизведение аудио ответа
                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (audioData && outputAudioContextRef.current) {
                           // ... (логика воспроизведения из hooks/useLiveChat.ts в проекте)
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
    }, [liveState, cleanup, onFunctionCall, onTranscriptUpdate, onMessageHistoryUpdate]);

    const stopSession = useCallback(() => {
        cleanup();
    }, [cleanup]);

    return { liveState, startSession, stopSession };
};
```

---

## Шаг 4: Использование хука в компоненте

Теперь вы можете использовать `useLiveChat` в любом компоненте вашего приложения.

```jsx
import React from 'react';
import { useLiveChat, LiveState } from './hooks/useLiveChat';

const VoiceControlComponent = () => {
    
    const handleFunctionCall = (name, args) => {
        console.log(`Gemini wants to call function "${name}" with arguments:`, args);
        // Здесь вы реализуете логику для ваших функций
        if (name === 'myCoolFunction') {
            alert(`Function called with argument: ${args.someArgument}`);
        }
    };
    
    // ... (управление состоянием для transcript и history)

    const { liveState, startSession, stopSession } = useLiveChat({
        onFunctionCall: handleFunctionCall,
        onTranscriptUpdate: setLiveTranscript, // Ваша функция для обновления стейта
        onMessageHistoryUpdate: addMessageToHistory, // Ваша функция для обновления стейта
    });

    const isListening = liveState === LiveState.LISTENING;

    return (
        <div>
            <h1>Voice Control</h1>
            <p>State: {liveState}</p>
            <button 
                onClick={isListening ? stopSession : startSession}
                style={{ backgroundColor: isListening ? 'red' : 'green', color: 'white', padding: '20px', borderRadius: '50%' }}
            >
                {isListening ? 'Stop' : 'Start'}
            </button>

            {/* Здесь вы можете отображать транскрипцию и историю чата */}
        </div>
    );
};

export default VoiceControlComponent;
```

Это руководство дает вам полную основу для создания мощного голосового интерфейса. Но настоящая сила раскрывается, когда ИИ не просто распознает речь, а напрямую управляет вашим приложением.

---

## Шаг 5: Расширение функционала - Управление интерфейсом

Система построена на **Function Calling** (вызове функций). Это значит, что ИИ не просто превращает вашу речь в текст, а **понимает ваше намерение** и просит приложение выполнить конкретное, заранее определенное действие.

Давайте представим, что мы хотим добавить голосовые команды для управления UI:
- **"Открой шаблоны"** -> Открывает панель с шаблонами.
- **"Скачай изображение"** -> Запускает скачивание фото.
- **"Начать сначала"** -> Сбрасывает все изменения.

### 5.1. Описание новых функций для ИИ

Сначала "расскажем" модели Gemini, какие еще команды она может выполнять, расширив список `functionDeclarations` в хуке `useLiveChat`.

```typescript
// Внутри функции startSession в useLiveChat.ts

const editImageFunctionDeclaration: FunctionDeclaration = { /* ... */ };

// Добавляем новые описания:
const showTemplatesFunctionDeclaration: FunctionDeclaration = {
  name: 'showTemplates',
  parameters: { type: Type.OBJECT, properties: {} }, // Аргументы не нужны
  description: "Открывает панель выбора шаблонов или стилей."
};

const downloadImageFunctionDeclaration: FunctionDeclaration = {
  name: 'downloadImage',
  parameters: { type: Type.OBJECT, properties: {} },
  description: "Запускает скачивание отредактированного изображения."
};

const resetEditorFunctionDeclaration: FunctionDeclaration = {
  name: 'resetEditor',
  parameters: { type: Type.OBJECT, properties: {} },
  description: "Сбрасывает все изменения и возвращает на начальный экран."
};

// ... и затем передаем их все в `tools`:
const sessionPromise = ai.live.connect({
    // ...
    config: {
        // ...
        tools: [{ functionDeclarations: [
            editImageFunctionDeclaration,
            showTemplatesFunctionDeclaration,
            downloadImageFunctionDeclaration,
            resetEditorFunctionDeclaration
        ] }],
        // ...
    },
});
```

### 5.2. Обработка вызовов функций в хуке

Теперь перехватим вызовы этих функций в коллбэке `onmessage` и вызовем соответствующие коллбэки, которые мы передадим в хук из компонента.

```typescript
// Внутри onmessage в useLiveChat.ts

if (message.toolCall?.functionCalls) {
    for (const fc of message.toolCall.functionCalls) {
        // Вызываем общий коллбэк, передавая имя функции и аргументы
        onFunctionCall(fc.name, fc.args); 
        
        // Отправляем подтверждение модели
        sessionPromiseRef.current?.then(session => {
            session.sendToolResponse({
                functionResponses: { id: fc.id, name: fc.name, response: { result: `ok, command ${fc.name} received.` } }
            });
        });
    }
}
```

### 5.3. Связывание с UI-компонентом

Осталось только передать реальные функции управления UI в наш хук `useLiveChat` и обработать их.

```jsx
// В вашем UI-компоненте, например, VoiceControlComponent.jsx

const VoiceControlComponent = () => {
    // Функции, управляющие вашим UI
    const handleShowTemplates = () => console.log('Opening templates...');
    const handleDownload = () => console.log('Downloading image...');
    const handleReset = () => console.log('Resetting editor...');
    
    // Главный обработчик вызовов от ИИ
    const handleFunctionCall = (name, args) => {
        console.log(`Gemini wants to call function "${name}" with arguments:`, args);
        switch (name) {
            case 'editImage':
                // handleEdit(args.prompt);
                break;
            case 'showTemplates':
                handleShowTemplates();
                break;
            case 'downloadImage':
                handleDownload();
                break;
            case 'resetEditor':
                handleReset();
                break;
            default:
                console.warn(`Unknown function call: ${name}`);
        }
    };

    const { liveState, startSession, stopSession } = useLiveChat({
        onFunctionCall: handleFunctionCall,
        // ... другие пропсы
    });

    // ... остальной JSX
};
```

Этот подход превращает голосовое управление из простого диктовщика в полноценного интерактивного ассистента, который может взаимодействовать с вашим приложением так же, как и пользователь.