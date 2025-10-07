

import { useState, useCallback } from 'react';
import { LogEntry, PromptHistoryEntry } from '../types';

const VERBOSE_LOGGING_ENABLED = true; // Set to false to disable detailed logging

export const useAppLog = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [promptHistory, setPromptHistory] = useState<PromptHistoryEntry[]>([]);

    const addLog = useCallback((
        type: LogEntry['type'],
        message: string,
        payload?: any,
        isVerbose: boolean = false
    ) => {
        if (isVerbose && !VERBOSE_LOGGING_ENABLED) {
            return;
        }
        const timestamp = new Date().toLocaleTimeString('ru-RU');
        setLogs(prev => [{ timestamp, type, message, payload }, ...prev]);
    }, []);

    const addPromptToHistory = useCallback(({ prompt, tags = [] }: { prompt: string; tags?: string[] }) => {
        if (!prompt || !prompt.trim()) return;
        setPromptHistory(prev => {
            if (prev.length > 0) {
                const firstEntry = prev[0];
                if (firstEntry.prompt === prompt && JSON.stringify(firstEntry.tags.sort()) === JSON.stringify(tags.sort())) {
                    return prev;
                }
            }
            const newHistory = [{ prompt, tags }, ...prev];
            if (newHistory.length > 100) { // Keep last 100 prompts
                return newHistory.slice(0, 100);
            }
            return newHistory;
        });
    }, []);

    return { logs, setLogs, promptHistory, addLog, addPromptToHistory };
};