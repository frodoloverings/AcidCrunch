import React, { useState } from 'react';
import Icon from './Icon';
import { LogEntry, PromptHistoryEntry } from '../types';

interface ActionLogProps {
    logs: LogEntry[];
    promptHistory: PromptHistoryEntry[];
    onClose: () => void;
    t: (key: string) => string;
}

const ActionLog: React.FC<ActionLogProps> = ({ logs, promptHistory, onClose, t }) => {
    const [activeTab, setActiveTab] = useState<'log' | 'history'>('log');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const getLogAppearance = (type: LogEntry['type']) => {
        switch (type) {
            case 'action': return { icon: '>', color: 'text-cyan-400' };
            case 'api_request': return { icon: '↑', color: 'text-orange-400' };
            case 'api_response': return { icon: '↓', color: 'text-green-400' };
            case 'error': return { icon: '!', color: 'text-red-400' };
            case 'ui': return { icon: '#', color: 'text-purple-400' };
            case 'state': return { icon: 'S', color: 'text-indigo-400' };
            case 'event': return { icon: '@', color: 'text-yellow-400' };
            default: return { icon: '?', color: 'text-gray-400' };
        }
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            // Using window.setTimeout for consistency and to avoid potential type conflicts.
            window.setTimeout(() => setCopiedIndex(null), 2000);
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="relative flex flex-col bg-[#1c1c1c] rounded-2xl p-6 shadow-2xl border border-[#262626] w-full max-w-2xl max-h-[80vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-2xl font-bold text-white">Console</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex border-b border-white/10 mb-4 flex-shrink-0">
                    <button 
                        onClick={() => setActiveTab('log')}
                        className={`py-2 px-4 font-semibold transition-colors ${activeTab === 'log' ? 'text-[#d1fe17] border-b-2 border-[#d1fe17]' : 'text-gray-400 hover:text-white'}`}
                    >
                        Action Log
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`py-2 px-4 font-semibold transition-colors ${activeTab === 'history' ? 'text-[#d1fe17] border-b-2 border-[#d1fe17]' : 'text-gray-400 hover:text-white'}`}
                    >
                        Prompt History
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto space-y-2 pr-2 bg-[#111] p-3 rounded-lg font-mono text-sm">
                    {activeTab === 'log' && (
                        <>
                            {logs.length === 0 ? (
                                <p className="text-gray-500">{t('log.empty')}</p>
                            ) : (
                                logs.map((log, index) => {
                                    const { icon, color } = getLogAppearance(log.type);
                                    return (
                                        <div key={index} className="flex items-start gap-3">
                                            <span className="text-gray-500 whitespace-nowrap">{log.timestamp}</span>
                                            <span className={`font-bold ${color}`}>{icon}</span>
                                            <div className="flex-1 break-words">
                                                <p className="text-gray-200">{log.message}</p>
                                                {log.payload && (
                                                    <pre className="mt-1 text-xs bg-black/30 p-2 rounded-md overflow-x-auto text-gray-400 whitespace-pre-wrap">
                                                        {JSON.stringify(log.payload, null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}
                    {activeTab === 'history' && (
                         <>
                            {promptHistory.length === 0 ? (
                                <p className="text-gray-500">No prompts in history yet.</p>
                            ) : (
                                promptHistory.map((entry, index) => {
                                    return (
                                        <div key={index} className="bg-black/30 p-3 rounded-md group relative">
                                            {entry.tags && entry.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {entry.tags.map(tag => (
                                                        <span key={tag} className="px-2 py-0.5 bg-[#2a2a2a] text-[#d1fe17] text-xs font-bold rounded-full">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-gray-300 whitespace-pre-wrap">{entry.prompt}</p>
                                            <button 
                                                onClick={() => handleCopy(entry.prompt, index)}
                                                className="absolute top-2 right-2 px-2 py-1 bg-[#2a2a2a] text-gray-400 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#383838] hover:text-white"
                                            >
                                                {copiedIndex === index ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActionLog;