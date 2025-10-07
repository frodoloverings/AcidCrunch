import React, { useRef, useEffect, useState, useCallback } from 'react';
import Icon from './Icon';

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
    t: (key: string) => string;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture, t }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(err => {
                    console.error("Error accessing camera:", err);
                    setError("Could not access the camera. Please check permissions.");
                });
        } else {
            stopStream();
        }

        return stopStream;
    }, [isOpen, stopStream]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);


    const handleCapture = () => {
        if (!videoRef.current || !streamRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => {
                if (blob) {
                    const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
                    onCapture(file);
                }
            }, 'image/png');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div ref={modalRef} className="relative flex flex-col bg-[#1c1c1c] rounded-2xl p-6 shadow-2xl border border-[#262626] w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-white">{t('generate_bar.camera')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-4">
                    {error ? (
                        <div className="w-full h-full flex items-center justify-center text-red-400 text-center p-4">{error}</div>
                    ) : (
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    )}
                </div>
                <div className="flex justify-center">
                    <button
                        onClick={handleCapture}
                        disabled={!!error}
                        className="w-20 h-20 rounded-full bg-white/20 border-4 border-white flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Take Picture"
                    >
                         <div className="w-16 h-16 rounded-full bg-white"></div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CameraModal;
