
import React from 'react';
import { LiveState } from '../types';
import Icon from './Icon';

interface VoiceControlProps {
    liveState: LiveState;
    startSession: () => void;
    stopSession: () => void;
    liveTranscript: { user: string; model: string } | null;
}

const VoiceControl: React.FC<VoiceControlProps> = ({ liveState, startSession, stopSession, liveTranscript }) => {
    const isSessionActive = liveState !== LiveState.IDLE && liveState !== LiveState.ERROR;

    const getButtonContent = () => {
        switch (liveState) {
            case LiveState.CONNECTING:
                return <div className="w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin"></div>;
            case LiveState.LISTENING:
            case LiveState.SPEAKING:
                return <Icon name="mic" className="w-5 h-5 text-white" />;
            case LiveState.THINKING:
                return <Icon name="sparkles" className="w-5 h-5 text-white animate-pulse" />;
            case LiveState.ERROR:
                 return <Icon name="mic-off" className="w-5 h-5 text-red-400" />;
            case LiveState.IDLE:
            default:
                return <Icon name="mic" className="w-5 h-5 text-white" />;
        }
    };

    const getButtonClass = () => {
        switch (liveState) {
            case LiveState.LISTENING:
            case LiveState.SPEAKING:
                return 'bg-green-500 animate-pulse';
            case LiveState.ERROR:
                return 'bg-red-800';
            default:
                return 'bg-[#2a2a2a] hover:bg-[#383838]';
        }
    };

    return (
        <>
            {liveTranscript && (
                 <div className="fixed bottom-24 right-4 w-80 bg-black/50 backdrop-blur-md p-4 rounded-lg text-white font-mono z-50 pointer-events-none">
                    <p><span className="font-bold text-gray-400">User:</span> {liveTranscript.user}</p>
                    <p className="mt-2"><span className="font-bold text-cyan-400">AI:</span> {liveTranscript.model}</p>
                 </div>
            )}
            <button
                onClick={isSessionActive ? stopSession : startSession}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 z-50 ${getButtonClass()}`}
                aria-label={isSessionActive ? 'Stop voice control' : 'Start voice control'}
            >
                {getButtonContent()}
            </button>
        </>
    );
};

export default VoiceControl;
