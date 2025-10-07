import React from 'react';

interface TooltipProps {
    text: string;
    children: React.ReactNode;
    position?: 'top' | 'right' | 'left' | 'bottom';
    className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'right', className = '' }) => {
    const getPositionClasses = () => {
        switch (position) {
            case 'top':
                return 'bottom-full mb-2 left-1/2 -translate-x-1/2 origin-bottom';
            case 'bottom':
                return 'top-full mt-2 left-1/2 -translate-x-1/2 origin-top';
            case 'left':
                return 'right-full mr-4 origin-right';
            case 'right':
            default:
                return 'left-full ml-4 origin-left';
        }
    };

    return (
        <div className={`relative group flex items-center ${className}`}>
            {children}
            <div className={`absolute w-auto p-2 min-w-max rounded-md shadow-md text-white bg-[#111111] border border-gray-700 text-xs font-bold transition-all duration-100 scale-0 group-hover:scale-100 z-50 pointer-events-none ${getPositionClasses()}`}>
                {text}
            </div>
        </div>
    );
};

export default Tooltip;